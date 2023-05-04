import registerSmartBlocksCommand from "roamjs-components/util/registerSmartBlocksCommand";
import { addCommand } from "./workBench";
import React, { ChangeEvent, useCallback, useState, useMemo } from "react";
import {
  Button,
  Checkbox,
  Classes,
  Dialog,
  Icon,
  InputGroup,
  Label,
  Popover,
  Spinner,
  Text,
} from "@blueprintjs/core";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import iconv from "iconv-lite";
import charset from "charset";
import { InputTextNode, OnloadArgs } from "roamjs-components/types/native";
import updateBlock from "roamjs-components/writes/updateBlock";
import createBlock from "roamjs-components/writes/createBlock";
import getUidsFromId from "roamjs-components/dom/getUidsFromId";
import getOrderByBlockUid from "roamjs-components/queries/getOrderByBlockUid";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import apiPost from "roamjs-components/util/apiPost";
import getNthChildUidByBlockUid from "roamjs-components/queries/getNthChildUidByBlockUid";
import getChildrenLengthByPageUid from "roamjs-components/queries/getChildrenLengthByPageUid";
import { Buffer } from "buffer";

export const ERROR_MESSAGE =
  "Error Importing Article. Email link to support@roamjs.com for help!";

const td = new TurndownService({
  hr: "---",
  headingStyle: "atx",
});
td.addRule("img", {
  filter: "img",
  replacement: function (content, node) {
    const img = node as HTMLImageElement;
    const src = img.getAttribute("data-src") || img.getAttribute("src");
    const alt = img.getAttribute("alt") || "";
    return `![${alt
      .replace(/\n/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "")}](${src})`;
  },
});
td.addRule("i", {
  filter: ["i", "em"],
  replacement: function (content) {
    return `__${content}__`;
  },
});
td.addRule("h4", {
  filter: ["h4"],
  replacement: function (content) {
    return `### ${content}`;
  },
});
td.addRule("a", {
  filter: (node, options) =>
    options.linkStyle === "inlined" &&
    node.nodeName === "A" &&
    !!node.getAttribute("href"),

  replacement: (content, node) => {
    if (!content) {
      return "";
    }
    const anchor = node as HTMLAnchorElement;
    if (
      anchor.childElementCount === 1 &&
      anchor.children[0].nodeName === "IMG"
    ) {
      return content;
    }
    const href = anchor.getAttribute("href");
    return "[" + content + "](" + href + ")";
  },
});

export const importArticle = ({
  url,
  blockUid,
  indent,
  onSuccess,
}: {
  url: string;
  blockUid?: string;
  indent: boolean;
  onSuccess?: () => void;
}): Promise<InputTextNode[]> =>
  apiPost<{ encoded: string; headers: Record<string, string> }>({
    path: `article`,
    data: { url },
    anonymous: true,
    domain: "https://lambda.roamjs.com",
  }).then(async (r) => {
    const enc = charset(r.headers) || "utf-8";
    const buffer = iconv.encode(r.encoded, "base64");
    const html = iconv.decode(buffer, enc);
    const headIndex = html.indexOf("<head>") + "<head>".length;
    const base = document.createElement("base");
    base.href = url;
    base.target = "_blank";
    const htmlWithBase = `${html.substring(0, headIndex)}${
      base.outerHTML
    }${html.substring(headIndex)}`;
    const doc = new DOMParser().parseFromString(htmlWithBase, "text/html");
    const parsedDoc = new Readability(doc).parse();
    if (!parsedDoc) return [];
    const stack: InputTextNode[] = [];
    const inputTextNodes: InputTextNode[] = [];
    const markdown = td.turndown(parsedDoc.content);
    const nodes = markdown.split("\n").filter((c) => !!c.trim());
    let previousNodeTabbed = false;
    for (const node of nodes) {
      const isHeader = /^#{1,3} /.test(node);
      const isBullet = node.startsWith("* ");
      const bulletText = isBullet ? node.substring(2).trim() : node;
      const text = isHeader ? bulletText.replace(/^#+ /, "") : bulletText;
      const heading = isHeader ? node.split(" ")[0].length : 0;
      if (isHeader && indent) {
        stack.pop();
      }
      if (isBullet && !previousNodeTabbed) {
        const children = stack[stack.length - 1]?.children || inputTextNodes;
        stack.push(children.slice(-1)[0]);
      }
      const children = stack[stack.length - 1]?.children || inputTextNodes;
      const inputTextNode: InputTextNode = { text, heading, children: [] };
      children.push(inputTextNode);
      if (isBullet && !previousNodeTabbed) {
        stack.pop();
      }
      if (indent && isHeader) {
        stack.push(inputTextNode);
        previousNodeTabbed = true;
      } else {
        previousNodeTabbed = false;
      }
    }
    const uid =
      blockUid ||
      (await window.roamAlphaAPI.ui.mainWindow
        .getOpenPageOrBlockUid()
        .then((parentUid) =>
          parentUid
            ? createBlock({
                parentUid,
                order: getChildrenLengthByPageUid(parentUid),
                node: { text: "" },
              })
            : ""
        )) ||
      "";
    updateBlock({ ...inputTextNodes[0], uid });
    (inputTextNodes[0].children || []).forEach((node, order) =>
      createBlock({ node, order, parentUid: uid })
    );
    const parentUid = getParentUidByBlockUid(uid);
    const order = getOrderByBlockUid(uid);
    inputTextNodes
      .slice(1)
      .forEach((node, o) =>
        createBlock({ node, order: o + order + 1, parentUid })
      );
    if (onSuccess) {
      onSuccess();
    }
    return inputTextNodes;
  });

const ImportArticle = ({
  blockUid,
  isOpen,
  onClose,
}: RoamOverlayProps<{
  blockUid?: string;
}>): JSX.Element => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(false);
  const [loading, setLoading] = useState(false);
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      setError("");
    },
    [setValue]
  );
  const importArticleCallback = useCallback(() => {
    if (!value.startsWith("https://") && !value.startsWith("http://")) {
      setError("Link must start with https:// protocol!");
      return;
    }
    setError("");
    setLoading(true);
    importArticle({ url: value, blockUid, indent, onSuccess: onClose }).catch(
      () => {
        setError(ERROR_MESSAGE);
        setLoading(false);
      }
    );
  }, [blockUid, value, indent, setError, setLoading, onClose]);
  const indentOnChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setIndent(e.target.checked),
    [setIndent]
  );
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      enforceFocus={false}
      autoFocus={false}
    >
      <div className={Classes.DIALOG_BODY}>
        <div style={{ padding: 16 }}>
          <div>
            <InputGroup
              leftElement={<Icon icon="link" />}
              onChange={onChange}
              placeholder="Enter url..."
              value={value}
              autoFocus={true}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  importArticleCallback();
                }
              }}
              width={1000}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <Checkbox
              checked={indent}
              onChange={indentOnChange}
              label={"Indent Under Header"}
            />
          </div>
        </div>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Text>{error}</Text>
          <Button
            text="IMPORT ARTICLE"
            onClick={importArticleCallback}
            disabled={loading}
            icon={loading ? <Spinner size={20} /> : undefined}
          />
        </div>
      </div>
    </Dialog>
  );
};

export const getIndentConfig = (): boolean => {
  const config = getFullTreeByParentUid(
    getPageUidByPageTitle("roam/js/article")
  );
  return config.children.some(
    (s) => s.text.trim().toUpperCase() === "INDENT UNDER HEADER"
  );
};

export const renderImportArticle = (blockUid?: string) =>
  renderOverlay({ Overlay: ImportArticle, props: { blockUid } });

// https://github.com/spamscanner/url-regex-safe/blob/master/src/index.js
const protocol = `(?:https?://)`;
const host = "(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)";
const domain = "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*";
const tld = `(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))`;
const port = "(?::\\d{2,5})?";
const path = "(?:[/?#][^\\s\"\\)']*)?";
const regex = `(?:${protocol}|www\\.)(?:${host}${domain}${tld})${port}${path}`;
const urlRegex = new RegExp(regex, "ig");

const inlineImportArticle = async ({
  value,
  parentUid,
}: {
  value: string;
  parentUid?: string;
}) => {
  const match = value.match(urlRegex);
  if (match) {
    const indent = getIndentConfig();
    const url = match[0];
    if (parentUid) {
      const blockUid = await createBlock({
        node: { text: "Loading..." },
        parentUid,
      });
      await importArticle({
        url,
        blockUid,
        indent,
      }).catch(async () => {
        updateBlock({ uid: blockUid, text: ERROR_MESSAGE });
      });
      return `[Source](${url})`;
    } else {
      return importArticle({ url, indent });
    }
  } else {
    return "Invalid Article URL";
  }
};

const unloads = new Set<() => void>();
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  if (flag) {
    const oldBuffer = window.Buffer;
    window.Buffer = Buffer;
    unloads.add(() => {
      window.Buffer = oldBuffer;
    })
    unloads.add(
      addCommand(
        {
          label: "Import Article Into Roam",
          callback: () =>
            renderImportArticle(
              window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"]
            ),
          defaultHotkey: "alt-shift-i",
        },
        extensionAPI
      )
    );

    unloads.add(
      registerSmartBlocksCommand({
        text: "ARTICLE",
        handler: () => (value) => {
          return inlineImportArticle({ value });
        },
      })
    );
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
