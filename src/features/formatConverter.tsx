import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Button, Classes, Dialog, Drawer, Label } from "@blueprintjs/core";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getBlockUidsAndTextsReferencingPage from "roamjs-components/queries/getBlockUidsAndTextsReferencingPage";
import getFirstChildTextByBlockUid from "roamjs-components/queries/getFirstChildTextByBlockUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import type { OnloadArgs, TreeNode } from "roamjs-components/types/native";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import { addCommand } from "./workBench";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";

const OPTIONS: Record<string, { label: string; fileFormat: string }> = {
  puretext_Space: { label: "Text with space indentation", fileFormat: ".txt" },
  puretext_Tab: { label: "Text with tab indentation", fileFormat: ".txt" },
  pureText_NoIndentation: {
    label: "Text with no indentation",
    fileFormat: ".txt",
  },
  markdown_Github: { label: "GitHub Flavored Markdown", fileFormat: ".md" },
  markdown_Github_flatten: {
    label: "GitHub Flavored Markdown - flatten",
    fileFormat: ".md",
  },
  html_Simple: { label: "HTML", fileFormat: ".html" },
  html_Markdown_Github_flatten: {
    label: "HTML after Markdown Flattening",
    fileFormat: ".html",
  },
  json_Simple: { label: "JSON in simple format", fileFormat: ".json" },
  json_Simple_withIndentation: {
    label: "JSON in simple format with Indentation in text string",
    fileFormat: ".json",
  },
};

const sortObjectsByOrder = (o: TreeNode[]) => {
  return o.sort(function (a, b) {
    return a.order - b.order;
  });
};

const roamMarkupScrubber = (blockText: string, removeMarkdown = true) => {
  if (
    blockText.substring(0, 9) == "{{[[query" ||
    blockText.substring(0, 7) == "{{query"
  )
    return "";
  if (blockText.substring(0, 12) == "{{attr-table") return "";
  if (blockText.substring(0, 15) == "{{[[mentions]]:") return "";
  if (blockText.substring(0, 8) == ":hiccup " && blockText.includes(":hr"))
    return "---"; // Horizontal line in markup, replace it with MD
  blockText = blockText.replaceAll("{{TODO}}", "TODO");
  blockText = blockText.replaceAll("{{[[TODO]]}}", "TODO");
  blockText = blockText.replaceAll("{{DONE}}", "DONE");
  blockText = blockText.replaceAll("{{[[DONE]]}}", "DONE");
  blockText = blockText.replaceAll("{{[[table]]}}", "");
  blockText = blockText.replaceAll("{{[[kanban]]}}", "");
  blockText = blockText.replaceAll("{{mermaid}}", "");
  blockText = blockText.replaceAll("{{word-count}}", "");
  blockText = blockText.replaceAll("{{date}}", "");
  blockText = blockText.replaceAll("{{diagram}}", "");
  blockText = blockText.replaceAll("{{POMO}}", "");
  blockText = blockText.replaceAll("{{slider}}", "");
  blockText = blockText.replaceAll("{{TaoOfRoam}}", "");
  blockText = blockText.replaceAll("{{orphans}}", "");
  blockText = blockText.replace("::", ":"); // ::
  blockText = blockText.replaceAll(/\(\((.+?)\)\)/g, "$1"); // (())
  blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, "$1"); // [[ ]]  First run
  blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, "$1"); // [[ ]]  second run
  blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, "$1"); // [[ ]]  second run
  // blockText = blockText.replaceAll(/\$\$(.+?)\$\$/g, '$1');      // $$ $$
  blockText = blockText.replaceAll(/\B\#([a-zA-Z]+\b)/g, "$1"); // #hash tag
  blockText = blockText.replaceAll(
    /\{\{calc: (.+?)\}\}/g,
    function (all, match) {
      return formatter.evaluate(match).toString();
    }
  );
  // calc functions  {{calc: 4+4}}
  if (removeMarkdown) {
    blockText = blockText.replaceAll(/\*\*(.+?)\*\*/g, "$1"); // ** **
    blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, "$1"); // __ __
    blockText = blockText.replaceAll(/\^\^(.+?)\^\^/g, "$1"); // ^^ ^^
    blockText = blockText.replaceAll(/\~\~(.+?)\~\~/g, "$1"); // ~~ ~~
    blockText = blockText.replaceAll(/\!\[(.+?)\]\((.+?)\)/g, "$1 $2"); //images with description
    blockText = blockText.replaceAll(/\!\[\]\((.+?)\)/g, "$1"); //imags with no description
    blockText = blockText.replaceAll(/\[(.+?)\]\((.+?)\)/g, "$1: $2"); //alias with description
    blockText = blockText.replaceAll(/\[\]\((.+?)\)/g, "$1"); //alias with no description
    blockText = blockText.replaceAll(/\[(.+?)\](?!\()(.+?)\)/g, "$1"); //alias with embeded block (Odd side effect of parser)
  } else {
    blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, "_$1_"); // convert for use as italics _ _
  }

  return blockText;
};

const walkDocumentStructureAndFormat = async (
  nodeCurrent: TreeNode,
  level: number,
  outputFunction: (
    t: string,
    n: TreeNode,
    l: number,
    p: TreeNode | null,
    f: boolean
  ) => Promise<string>,
  parent: TreeNode | null,
  flatten: boolean
): Promise<string> => {
  const mainText = await Promise.resolve(nodeCurrent.text || "").then(
    async (blockText) => {
      const embeds = await Promise.all(
        Array.from(
          blockText.matchAll(
            /\{\{(?:\[\[)embed(?:\]\])\:\s*\(\((.{9})\)\)\s*\}\}/g
          )
        ).map((e) => {
          const uid = e[1];
          const node = getFullTreeByParentUid(uid);
          return walkDocumentStructureAndFormat(
            node,
            level,
            outputFunction,
            parent,
            flatten
          ).then((output) => ({
            output,
            index: e.index || 0,
            length: e[0].length,
          }));
        })
      );
      const { text } = embeds.reduce(
        (p, c) => ({
          text: `${p.text.slice(0, c.index + p.offset)}${
            c.output
          }${p.text.slice(c.index + c.length + p.offset)}`,
          offset: p.offset + c.output.length - c.length,
        }),
        { text: blockText, offset: 0 }
      );
      return outputFunction(
        resolveRefs(text),
        nodeCurrent,
        level,
        parent,
        flatten
      );
    }
  );

  const childrenText =
    typeof nodeCurrent.children != "undefined"
      ? await Promise.all(
          sortObjectsByOrder(nodeCurrent.children).map((orderedNode) =>
            walkDocumentStructureAndFormat(
              orderedNode,
              level + 1,
              outputFunction,
              nodeCurrent,
              flatten
            )
          )
        ).then((children) => children.join(""))
      : "";
  return `${mainText}${childrenText}`;
};

export const iterateThroughTree = async (
  uid: string,
  formatterFunction: (s: string) => Promise<string>,
  flatten = false
) => {
  return walkDocumentStructureAndFormat(
    getFullTreeByParentUid(uid),
    0,
    formatterFunction,
    null,
    flatten
  );
};

export const formatter = {
  pureText_SpaceIndented: async (
    blockText: string,
    nodeCurrent?: TreeNode,
    level = 0
  ) => {
    if (getPageTitleByPageUid(nodeCurrent?.uid || "")) return "";
    let leadingSpaces = level > 1 ? "  ".repeat(level - 1) : "";
    return leadingSpaces + roamMarkupScrubber(blockText, true) + "\n";
  },
  pureText_TabIndented: async (
    blockText: string,
    nodeCurrent?: TreeNode,
    level = 0
  ) => {
    if (getPageTitleByPageUid(nodeCurrent?.uid || "")) return "";
    const leadingSpaces = level > 1 ? "\t".repeat(level - 1) : "";
    return leadingSpaces + roamMarkupScrubber(blockText, true) + "\n";
  },
  pureText_NoIndentation: async (blockText: string, nodeCurrent?: TreeNode) => {
    if (getPageTitleByPageUid(nodeCurrent?.uid || "")) return "";
    return roamMarkupScrubber(blockText, true) + "\n";
  },
  markdownGithub: async (
    blockText: string,
    nodeCurrent: TreeNode,
    level: number,
    parent: TreeNode,
    flatten?: boolean
  ) => {
    if (flatten == true) {
      level = 0;
    } else {
      level = level - 1;
    }
    if (getPageTitleByPageUid(nodeCurrent.uid)) {
      return "# " + blockText;
    }

    if (blockText.substring(0, 3) != "```")
      blockText = blockText.replaceAll("\n", "<br/>");

    if (nodeCurrent.heading == 1) blockText = "# " + blockText;
    if (nodeCurrent.heading == 2) blockText = "## " + blockText;
    if (nodeCurrent.heading == 3) blockText = "### " + blockText;

    const todoPrefix = level > 0 ? "" : "- "; //todos on first level need a dash before them
    if (blockText.substring(0, 12) == "{{[[TODO]]}}") {
      blockText = blockText.replace("{{[[TODO]]}}", todoPrefix + "[ ]");
    } else if (blockText.substring(0, 8) == "{{TODO}}") {
      blockText = blockText.replace("{{TODO}}", todoPrefix + "[ ]");
    } else if (blockText.substring(0, 12) == "{{[[DONE]]}}") {
      blockText = blockText.replace("{{[[DONE]]}}", todoPrefix + "[x]");
    } else if (blockText.substring(0, 8) == "{{DONE}}") {
      blockText = blockText.replace("{{DONE}}", todoPrefix + "[x]");
    }
    // console.log("2",blockText)
    try {
      blockText = roamMarkupScrubber(blockText, false);
    } catch (e) {}
    // console.log("3",blockText)

    const hasPrefix = level > 0 && blockText.substring(0, 3) != "```";
    if (!hasPrefix) blockText = "\n" + blockText;
    const prefix = hasPrefix
      ? parent["viewType"] == "numbered"
        ? "    ".repeat(level - 1) + "1. "
        : "  ".repeat(level) + "- "
      : "";

    return prefix + blockText + "  \n";
  },
  htmlSimple: async (uid: string) => {
    // @ts-ignore
    var md = await iterateThroughTree(uid, formatter.markdownGithub);
    // @ts-ignore
    const { marked } = await window.RoamLazy.Marked();
    marked.setOptions({
      gfm: true,
      xhtml: false,
      pedantic: false,
    });
    md = md.replaceAll("- [ ] [", "- [ ]&nbsp;&nbsp;["); //fixes odd isue of task and alis on same line
    md = md.replaceAll("- [x] [", "- [x]&nbsp;["); //fixes odd isue of task and alis on same line
    md = md.replaceAll(/\{\{\youtube\: (.+?)\}\} /g, (str, lnk) => {
      lnk = lnk.replace("youtube.com/", "youtube.com/embed/");
      lnk = lnk.replace("youtu.be/", "youtube.com/embed/");
      lnk = lnk.replace("watch?v=", "");
      return `<iframe width="560" height="315" class="embededYoutubeVieo" src="${lnk}" frameborder="0"></iframe>`;
    });

    //lATEX handling
    md = md.replace(/  \- (\$\$)/g, "\n\n$1"); //Latex is centered
    const tokenizer = {
      codespan(src: string) {
        const match = src.match(/\$\$(.*?)\$\$/);
        if (match) {
          var str = match[0];
          str = str.replaceAll("<br>", " ");
          str = str.replaceAll("<br/>", " ");
          str = `<div>${str}</div>`;
          return { type: "text" as const, raw: match[0], text: str };
        }
        // return false to use original codespan tokenizer
        return false;
      },
    };
    // @ts-ignore
    marked.use({ tokenizer });
    md = marked(md);

    return `<html>
  <head>
  </head>
  <body>
    ${md}
  </body>
</html>`;
  },
  htmlMarkdownFlatten: async (uid: string) => {
    // @ts-ignore
    var md = await iterateThroughTree(uid, formatter.markdownGithub, true);
    // @ts-ignore
    const { marked } = await window.RoamLazy.Marked();
    marked.setOptions({
      gfm: true,
      xhtml: false,
      pedantic: false,
    });
    md = md.replaceAll("- [ ] [", "- [ ]&nbsp;&nbsp;["); //fixes odd isue of task and alis on same line
    md = md.replaceAll("- [x] [", "- [x]&nbsp;["); //fixes odd isue of task and alis on same line
    md = md.replaceAll(/\{\{\youtube\: (.+?)\}\} /g, (str, lnk) => {
      lnk = lnk.replace("youtube.com/", "youtube.com/embed/");
      lnk = lnk.replace("youtu.be/", "youtube.com/embed/");
      lnk = lnk.replace("watch?v=", "");
      return `<iframe width="560" height="315" class="embededYoutubeVieo" src="${lnk}" frameborder="0"></iframe>`;
    });

    //lATEX handling
    md = md.replace(/  \- (\$\$)/g, "\n\n$1"); //Latex is centered
    const tokenizer = {
      codespan(src: string) {
        const match = src.match(/\$\$(.*?)\$\$/);
        if (match) {
          var str = match[0];
          str = str.replaceAll("<br>", " ");
          str = str.replaceAll("<br/>", " ");
          str = `<div>${str}</div>`;
          return { type: "text", raw: match[0], text: str };
        }
        // return false to use original codespan tokenizer
        return false;
      },
    };
    // @ts-ignore
    marked.use({ tokenizer });
    md = marked(md);

    return `<html>
  <head>
  </head>
  <body>
    ${md}
  </body>
</html>`;
  },
  evaluate: (_: string): string => "0",
};

type JSONNode = {
  uid: string;
  order: number;
  parentUID: string;
  level: number;
  blockText: string;
};

export const flatJson = async (uid: string, withIndents = false) => {
  const results = await getFullTreeByParentUid(uid);
  if (results == null) return "[]";
  const output = await walkDocumentStructureAndFormat(
    results,
    0,
    async (blockText, nodeCurrent, level, parent, flatten) => {
      let blockOutput = roamMarkupScrubber(blockText, true);
      if (withIndents == true)
        blockOutput =
          (level > 1 ? "  ".repeat(level - 1) + " - " : "+ ") + blockOutput;
      return (
        JSON.stringify({
          uid: nodeCurrent.uid,
          order: nodeCurrent.order,
          parentUID: parent?.uid || getParentUidByBlockUid(uid),
          level: level,
          blockText: blockOutput,
        }) + ","
      );
    },
    null,
    false
  );
  return JSON.stringify(
    JSON.parse(`[${(output || "").slice(0, -1)}]`),
    null,
    4
  );
};

const FormatConverterUI = ({
  isOpen,
  onClose,
  uid,
}: RoamOverlayProps<{ uid: string }>) => {
  const lastValue = useMemo(
    () => localStorage.getItem("formatConverterUI_lastFormat") as string,
    []
  );
  const [selectedFormat, setSelectedFormat] = useState(
    lastValue || "puretext_Space"
  );
  const [drawerSize, setDrawerSize] = useState("50%");
  const [displayValue, setDisplayValue] = useState("");
  const changeFormat = useCallback(async () => {
    localStorage.setItem("formatConverterUI_lastFormat", selectedFormat);
    switch (selectedFormat) {
      case "puretext_Tab":
        setDisplayValue(
          await iterateThroughTree(uid, formatter.pureText_TabIndented)
        );
        break;
      case "puretext_Space":
        setDisplayValue(
          await iterateThroughTree(uid, formatter.pureText_SpaceIndented)
        );
        break;
      case "pureText_NoIndentation":
        setDisplayValue(
          await iterateThroughTree(uid, formatter.pureText_NoIndentation)
        );
        break;
      case "markdown_Github":
        setDisplayValue(
          // @ts-ignore
          await iterateThroughTree(uid, formatter.markdownGithub)
        );
        break;
      case "markdown_Github_flatten":
        setDisplayValue(
          // @ts-ignore
          await iterateThroughTree(uid, formatter.markdownGithub, true)
        );
        break;
      case "html_Simple":
        setDisplayValue(await formatter.htmlSimple(uid));
        break;
      case "html_Markdown_Github_flatten":
        setDisplayValue(await formatter.htmlMarkdownFlatten(uid));
        break;
      case "json_Simple":
        setDisplayValue((await flatJson(uid, false)) as string);
        break;
      case "json_Simple_withIndentation":
        setDisplayValue((await flatJson(uid, true)) as string);
        break;
    }
  }, [selectedFormat, uid]);
  useEffect(() => {
    changeFormat();
  }, [changeFormat]);
  return (
    <Drawer
      title={"WorkBench Format Converter"}
      className={"workbench-format-converter pointer-events-auto"}
      portalClassName={"pointer-events-none"}
      isOpen={isOpen}
      onClose={onClose}
      position={"bottom"}
      hasBackdrop={false}
      canOutsideClickClose={false}
      enforceFocus={false}
      autoFocus={false}
      size={drawerSize}
      canEscapeKeyClose={true}
    >
      <div
        className={Classes.DRAWER_BODY}
        style={{
          width: "100%",
          height: window.innerHeight * 0.4,
          overflow: "hidden",
        }}
      >
        <div style={{ height: "calc(100% - 100px)" }}>
          <div className="flex flex-col md:flex-row items-center mb-2">
            {/* Output format select */}
            <Label className="p-3" style={{ marginBottom: 0 }}>
              Output format:
              <MenuItemSelect
                activeItem={selectedFormat}
                onItemSelect={(item) => setSelectedFormat(item)}
                items={Object.keys(OPTIONS)}
                transformItem={(k) => OPTIONS[k].label}
              />
            </Label>
            {/* Middle Buttons */}
            <div className="flex p-3 gap-4 items-center justify-center">
              <Button
                icon={"refresh"}
                small
                minimal
                onClick={changeFormat}
                title={"Refresh view based on current page"}
              />
              <Button
                icon={"clipboard"}
                small
                minimal
                onClick={() => navigator.clipboard.writeText(displayValue)}
                title="Copy to clipboard"
              />
              <Button
                icon={"floppy-disk"}
                small
                minimal
                title="Save to a file"
                onClick={() => {
                  const currentPageName = getPageTitleByPageUid(uid);
                  const extension = OPTIONS[selectedFormat].fileFormat;
                  const filename =
                    (currentPageName + "-" + new Date().toISOString()).replace(
                      /(\W+)/gi,
                      "-"
                    ) + extension;
                  const element = document.createElement("a");
                  element.setAttribute(
                    "href",
                    "data:text/plain;charset=utf-8," +
                      encodeURIComponent(displayValue)
                  );
                  element.setAttribute("download", filename);
                  element.style.display = "none";
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                  renderToast({
                    content: "File saved: " + filename,
                    intent: "warning",
                    id: "workbench-warning",
                    timeout: 3000,
                  });
                }}
              />
            </div>
            {/* Draw Size Buttons */}
            <div className="p-3">
              {["25%", "50%", "75%", "100%"].map((size) => (
                <Button
                  text={size}
                  minimal={drawerSize !== size}
                  onClick={() => setDrawerSize(size)}
                />
              ))}
            </div>
          </div>
          <div className="mx-3 h-full">
            <textarea
              className="p-2 w-full h-full overflow-auto font-mono"
              value={displayValue}
              onChange={(e) => setDisplayValue(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export const show = () => {
  window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid().then((uid) =>
    renderOverlay({
      Overlay: FormatConverterUI,
      props: {
        uid: uid || window.roamAlphaAPI.util.dateToPageUid(new Date()),
      },
    })
  );
};

export const htmlview = async () => {
  const uid = await window.roamAlphaAPI.ui.mainWindow
    .getOpenPageOrBlockUid()
    .then((uid) => uid || window.roamAlphaAPI.util.dateToPageUid(new Date()));
  const results = (await formatter.htmlSimple(uid)).replace(
    "<html>",
    "<!DOCTYPE html>"
  );

  const customCSSNode = getBlockUidsAndTextsReferencingPage("42WebViewCSS");
  const childCSSText =
    getFirstChildTextByBlockUid(customCSSNode[0]?.uid || "") || "";
  const childCSS =
    childCSSText.substring(0, 6) === "```css"
      ? `<style>\n${childCSSText
          .replace("```css", "")
          .replace("```", "")}</style>\n`
      : "";
  const output = results
    .replace("</body>", `${childCSS}</body>`)
    .replace(
      "</body>",
      "\n<script>setTimeout(()=>{typeof renderMathInElement !== 'undefined' && renderMathInElement(document.body);},1000)</script>\n</body>"
    )
    .replace(
      "</head>",
      `    <link href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css" rel="stylesheet" type="text/css" id="KatexCSS">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js" type="text/javascript" id="KatexJS">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/contrib/auto-render.min.js" type="text/javascript" id="KatexJS-auto"></script>
    <style>img {
  max-width: 600px;
}

/* font sizes */
body {
    font: 12pt Georgia, "Times New Roman", Times, serif;
    line-height: 1.3;
    color: #000;
}

h1 { font-size: 24pt }

h2 { font-size: 14pt; margin-top: 25px }

aside h2 { font-size: 18pt }

header .print { display: block }

img { border: 0 }

header { margin-bottom: 40px }

blockquote {
    font-size: 13pt;
    font-style: italic;
}

p a { color: #000 }</style>
</head>`
    );

  const Overlay = ({ isOpen, onClose }: RoamOverlayProps<{}>) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={"WorkBench Viewer"}
        className={"roamjs-workbench-html-view"}
        enforceFocus={false}
        autoFocus={false}
      >
        <style>{`.roamjs-workbench-html-view { width: unset; }`}</style>
        <div
          className={Classes.DIALOG_BODY}
          style={{ width: 1000, height: 600 }}
        >
          <iframe
            ref={iframeRef}
            width={1000}
            height={600}
            srcDoc={output}
            id={"roamjs-web-view"}
          />
          <Button
            text={"Print"}
            intent={"primary"}
            rightIcon={"print"}
            onClick={() => {
              iframeRef.current?.contentWindow?.print();
            }}
          />
        </div>
      </Dialog>
    );
  };

  renderOverlay({
    Overlay,
  });
};

export let enabled = false;
const workbenchCommands = new Set<() => void>();
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  enabled = flag;
  if (flag) {
    workbenchCommands.add(
      addCommand(
        { label: "Format Converter", callback: show, defaultHotkey: "alt-m" },
        extensionAPI
      )
    );
    workbenchCommands.add(
      addCommand(
        {
          label: "Format Converter: Web View",
          callback: htmlview,
          defaultHotkey: "alt-shift-m",
        },
        extensionAPI
      )
    );
    window.RoamLazy?.Insect().then((insect) => {
      formatter.evaluate = (s: string) =>
        insect.repl(insect.fmtPlain)(insect.initialEnvironment)(s).msg;
    });
  } else {
    workbenchCommands.forEach((r) => r());
    workbenchCommands.clear();
  }
};
