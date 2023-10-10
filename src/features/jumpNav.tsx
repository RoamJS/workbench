import { get } from "../settings";
import getFirstChildUidByBlockUid from "roamjs-components/queries/getFirstChildUidByBlockUid";
import getCurrentUserUid from "roamjs-components/queries/getCurrentUserUid";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import getOrderByBlockUid from "roamjs-components/queries/getOrderByBlockUid";
import createBlock from "roamjs-components/writes/createBlock";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import getNthChildUidByBlockUid from "roamjs-components/queries/getNthChildUidByBlockUid";
import getChildrenLengthByParentUid from "roamjs-components/queries/getChildrenLengthByParentUid";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import { render as renderToast } from "roamjs-components/components/Toast";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import { BLOCK_REF_REGEX } from "roamjs-components/dom/constants";
import extractRef from "roamjs-components/util/extractRef";
import type {
  InputTextNode,
  OnloadArgs,
  PullBlock,
  RoamBasicNode,
} from "roamjs-components/types/native";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import { Dialog, Spinner } from "@blueprintjs/core";
import React, { useMemo, useState, useEffect } from "react";
import { addCommand } from "./workBench";
import getParentUidsOfBlockUid from "roamjs-components/queries/getParentUidsOfBlockUid";

const getCurrentPageUid = async () =>
  (await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid()) ||
  window.roamAlphaAPI.util.dateToPageUid(new Date());
const toUidTree = (tree: RoamBasicNode[]): RoamBasicNode[] =>
  tree.map((t) => ({
    text: `((${t.uid}))`,
    children: toUidTree(t.children),
    uid: window.roamAlphaAPI.util.generateUID(),
  }));
const stripUid = (tree: RoamBasicNode[]): InputTextNode[] =>
  tree.map(({ uid: _, children, ...t }) => ({
    ...t,
    children: stripUid(children),
  }));
const getMaxLevel = (n: RoamBasicNode[]): number => {
  if (n.length)
    return (
      n
        .map((n) => getMaxLevel(n.children))
        .reduce((p, c) => (p > c ? p : c), 0) + 1
    );
  else return 1;
};
const ExpColDialog = ({
  blockUid,
  onClose,
}: RoamOverlayProps<{ blockUid: string }>) => {
  const tree = useMemo(() => getBasicTreeByParentUid(blockUid), [blockUid]);
  const level = getMaxLevel(tree);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const digit = Number(e.key);
      if (digit && digit <= level) {
        document.removeEventListener("keydown", listener);
        const getNodes = (
          ns: RoamBasicNode[],
          l: number
        ): { uid: string; within: boolean }[] => {
          return ns.flatMap((n) => [
            { uid: n.uid, within: l < digit },
            ...getNodes(n.children, l + 1),
          ]);
        };
        const nodes = getNodes(tree, 2).concat({
          uid: blockUid,
          within: digit > 1,
        });

        setLoading(true);
        Promise.all(
          nodes.map((n) => updateBlock({ uid: n.uid, open: n.within }))
        ).then(onClose);
      }
    };
    document.addEventListener("keydown", listener);
  }, []);
  return (
    <Dialog
      title={"Expand/Collapse all blocks to level"}
      isOpen={true}
      onClose={onClose}
      enforceFocus={false}
      autoFocus={false}
    >
      <div tabIndex={-1} style={{ padding: 16, minHeight: 120 }}>
        <input autoFocus style={{ visibility: "hidden" }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {level &&
            Array(level)
              .fill(null)
              .map((_, l) => (
                <span
                  key={l}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: "white",
                    margin: "0px 16px",
                  }}
                >
                  {l + 1}
                </span>
              ))}
        </div>
      </div>
      {loading && <Spinner />}
    </Dialog>
  );
};

const jumpToTheTopOfThePage = () =>
  getCurrentPageUid().then((uid) => {
    const blockUid = getFirstChildUidByBlockUid(uid);
    setTimeout(() => {
      window.roamAlphaAPI.ui.setBlockFocusAndSelection({
        location: {
          "block-uid": blockUid,
          "window-id": `${getCurrentUserUid()}-body-outline-${uid}`,
        },
      });
    }, 300);
  });
const jumpToTheBottomOfPage = () =>
  getCurrentPageUid().then((uid) => {
    const blocks = getShallowTreeByParentUid(uid);
    const blockUid = blocks[blocks.length - 1]?.uid;
    if (blockUid)
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "block-uid": blockUid,
            "window-id": `${getCurrentUserUid()}-body-outline-${uid}`,
          },
        });
      }, 300);
  });
const expandAllBlocksOnPage = async () => {
  const uid = await getCurrentPageUid();
  window.roamAlphaAPI.updateBlock({ block: { uid, open: true } });
  (
    window.roamAlphaAPI.q(
      `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
    ) as [{ uid: string }][]
  )
    .map((a) => a[0].uid)
    .forEach((u) =>
      window.roamAlphaAPI.updateBlock({ block: { uid: u, open: true } })
    );
};
const collapseAllBlocksOnPage = async () => {
  const uid = await getCurrentPageUid();
  window.roamAlphaAPI.updateBlock({ block: { uid, open: false } });
  (
    window.roamAlphaAPI.q(
      `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
    ) as [{ uid: string }][]
  )
    .map((a) => a[0].uid)
    .forEach((u) =>
      window.roamAlphaAPI.updateBlock({
        block: { uid: u, open: false },
      })
    );
};
const openPageInSidebar = () => getCurrentPageUid().then(openBlockInSidebar);
const toggleLinkedRefs = () => {
  (
    document.querySelector(".rm-reference-container .rm-caret") as HTMLElement
  ).click();
  document.querySelector(".rm-reference-container .rm-caret")?.scrollIntoView();
};
const toggleUnlinkedRefs = async () => {
  const rmReferenceDiv = document.querySelector(
    ".rm-reference-main"
  ) as HTMLElement;
  const textEl = Array.from(
    rmReferenceDiv.querySelectorAll(":scope *:not(:empty):not(:has(*))")
  ).find((element) => element.textContent?.includes("Unlinked References"));
  const unlinkedRefsCaret = textEl
    ?.closest("div")
    ?.querySelector("span.rm-caret") as HTMLElement;

  if (!unlinkedRefsCaret) {
    const uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
    if (!uid) {
      renderToast({
        id: "dnp-refs-toast",
        content: "No Unlinked References on Daily Notes Page",
        intent: "warning",
      });
    } else if (uid && getParentUidsOfBlockUid(uid).length > 0) {
      renderToast({
        id: "block-refs-toast",
        content: "No Unlinked References on a block",
        intent: "warning",
      });
    } else {
      throw new Error();
    }
  } else {
    unlinkedRefsCaret.click();
    unlinkedRefsCaret.scrollIntoView();
  }
};
const toggleReferenceParents = () =>
  document
    .querySelectorAll<HTMLElement>(
      ".rm-title-arrow-wrapper .bp3-icon-caret-down"
    )
    .forEach((element) => {
      element.click();
    });
const expandReferenceChildren = () =>
  document
    .querySelectorAll<HTMLElement>(".rm-reference-item  .block-expand")
    .forEach((element) => {
      element.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
        })
      );
      const li = Array.from(
        document.querySelector(
          '.bp3-transition-container:not([style*="display: none;"]) .bp3-popover-content > div > ul'
        )?.children || []
      ).find((e: Element) => (e as HTMLLinkElement).innerText === "Expand all");
      (li?.childNodes[0] as HTMLElement)?.click();
    });
const collapseReferenceChildren = () =>
  document
    .querySelectorAll<HTMLElement>(".rm-reference-item  .block-expand")
    .forEach((element) => {
      element.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
        })
      );
      const li = Array.from(
        document.querySelector(
          '.bp3-transition-container:not([style*="display: none;"]) .bp3-popover-content > div > ul'
        )?.children || []
      ).find(
        (e: Element) => (e as HTMLLinkElement).innerText === "Collapse all"
      );
      (li?.childNodes[0] as HTMLElement).click();
    });
const copyBlockRef = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (uid) {
    navigator.clipboard.writeText(`((${uid}))`);
    renderToast({
      content: `Copied: ((${uid}))`,
      intent: "warning",
      id: "workbench-warning",
      timeout: 2000,
    });
  }
};
const copyBlockRefAsAlias = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  const selectedText = window.getSelection()?.toString();
  const formatToUse = get("CopyRefAsAliasFormat");
  const outputText =
    selectedText != "" && formatToUse
      ? formatToUse
          .replace("UID", `((${uid}))`)
          .replace("SELECTEDTEXT", selectedText ?? "")
          .trim()
      : selectedText != ""
      ? `"${selectedText}" [*](((${uid})))`
      : `[*](((${uid})))`;
  navigator.clipboard.writeText(outputText);
  renderToast({
    content: `Copied: ${outputText}`,
    intent: "warning",
    id: "workbench-warning",
    timeout: 2000,
  });
};
const expandCurrentBlockTree = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (uid) {
    window.roamAlphaAPI.updateBlock({ block: { uid, open: true } });
    (
      window.roamAlphaAPI.q(
        `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
      ) as [{ uid: string }][]
    )
      .map((a) => a[0].uid)
      .forEach((u) =>
        window.roamAlphaAPI.updateBlock({ block: { uid: u, open: true } })
      );
  }
};
const collapseCurrentBlockTree = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (uid) {
    window.roamAlphaAPI.updateBlock({ block: { uid, open: false } });
    (
      window.roamAlphaAPI.q(
        `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
      ) as [{ uid: string }][]
    )
      .map((a) => a[0].uid)
      .forEach((u) =>
        window.roamAlphaAPI.updateBlock({
          block: { uid: u, open: false },
        })
      );
  }
};
const insertBlockAbove = () => {
  const location = window.roamAlphaAPI.ui.getFocusedBlock();
  const uid = location?.["block-uid"];
  if (uid) {
    const order = getOrderByBlockUid(uid);
    createBlock({
      order,
      parentUid: getParentUidByBlockUid(uid),
      node: { text: "" },
    }).then((newUid) => {
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "window-id": location["window-id"],
            "block-uid": newUid,
          },
        });
      }, 300);
    });
  }
};
const insertBlockBelow = () => {
  const location = window.roamAlphaAPI.ui.getFocusedBlock();
  const uid = location?.["block-uid"];
  if (uid) {
    const order = getOrderByBlockUid(uid) + 1;
    createBlock({
      order,
      parentUid: getParentUidByBlockUid(uid),
      node: { text: "" },
    }).then((newUid) => {
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: { "window-id": location["window-id"], "block-uid": newUid },
        });
      }, 300);
    });
  }
};
const goUpBlock = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    const order = getOrderByBlockUid(active["block-uid"]);
    if (order > 0) {
      const parentUid = getParentUidByBlockUid(active["block-uid"]);
      const newBlockUid = getNthChildUidByBlockUid({
        blockUid: parentUid,
        order: order - 1,
      });
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "window-id": active["window-id"],
            "block-uid": newBlockUid,
          },
        });
      }, 300);
    }
  }
};
const goDownBlock = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    const order = getOrderByBlockUid(active["block-uid"]);
    const parentUid = getParentUidByBlockUid(active["block-uid"]);
    const len = getChildrenLengthByParentUid(parentUid);
    if (order < len - 1) {
      const newBlockUid = getNthChildUidByBlockUid({
        blockUid: parentUid,
        order: order + 1,
      });
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "window-id": active["window-id"],
            "block-uid": newBlockUid,
          },
        });
      }, 300);
    }
  }
};
const goToParentBlock = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    const parentUid = getParentUidByBlockUid(active["block-uid"]);
    const isPage = !window.roamAlphaAPI.pull("[:block/page]", [
      ":block/uid",
      parentUid,
    ])?.[":block/page"];
    if (!isPage) {
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "window-id": active["window-id"],
            "block-uid": parentUid,
          },
        });
      }, 300);
    }
  }
};
const delBlock = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    deleteBlock(active["block-uid"]);
  }
};
const alignLeft = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    updateBlock({ uid: active["block-uid"], textAlign: "left" });
  }
};
const center = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    updateBlock({ uid: active["block-uid"], textAlign: "center" });
  }
};
const alignRight = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    updateBlock({ uid: active["block-uid"], textAlign: "right" });
  }
};
const justify = () => {
  const active = window.roamAlphaAPI.ui.getFocusedBlock();
  if (active) {
    updateBlock({ uid: active["block-uid"], textAlign: "justify" });
  }
};
const toggleQueries = () =>
  document
    .querySelectorAll<HTMLDivElement>(".rm-query-title .bp3-icon-caret-down")
    .forEach((element) => {
      element.click();
    });
const addShortcutToLeftSidebar = () => {
  const previousElement = document.activeElement as HTMLElement;
  const emptyShortcuts = document.getElementsByClassName(
    "bp3-button bp3-icon-star-empty"
  ) as HTMLCollectionOf<HTMLSpanElement>;
  const shortcuts = document.getElementsByClassName(
    "bp3-button bp3-icon-star"
  ) as HTMLCollectionOf<HTMLSpanElement>;
  if (emptyShortcuts.length) {
    emptyShortcuts[0].click();
    previousElement?.focus();
  } else if (shortcuts.length) {
    shortcuts[0]?.click();
    previousElement?.focus();
  }
};
const pasteBlockWithChildrenAsReferences = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (uid) {
    window.navigator.clipboard.readText().then((clip) => {
      const srcUid = extractRef(clip);
      const tree = getBasicTreeByParentUid(srcUid);
      window.roamAlphaAPI.updateBlock({
        block: { uid, string: `${getTextByBlockUid(uid)}((${srcUid}))` },
      });
      toUidTree(tree).forEach((t, order) =>
        createBlock({ parentUid: uid, node: t, order })
      );
    });
  }
};
const toggleBlockViewType = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];

  if (uid) {
    const viewType = (
      window.roamAlphaAPI.data.fast.q(
        `[:find (pull ?b [:children/view-type]) :where [?b :block/uid "${uid}"]]`
      )[0]?.[0] as PullBlock
    )?.[":children/view-type"];
    const newViewType =
      viewType !== undefined && /^:?document$/.test(viewType)
        ? "numbered"
        : viewType !== undefined && /^:?numbered$/.test(viewType)
        ? "bullet"
        : "document";
    window.roamAlphaAPI.updateBlock({
      block: { uid, "children-view-type": newViewType },
    });
  }
};
const replaceLastReferenceWithTextAndAlias = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (uid) {
    const text = getTextByBlockUid(uid);
    const allRefs = Array.from(text.matchAll(new RegExp(BLOCK_REF_REGEX, "g")));
    if (allRefs.length) {
      const latestMatch = allRefs.findIndex(
        (r) =>
          r.index >
          (document.activeElement as HTMLTextAreaElement).selectionStart
      );
      const refMatch = latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
      const refText = getTextByBlockUid(refMatch[1]);
      const prefix = `${text.slice(0, refMatch.index)}${refText} [*](${
        refMatch[0]
      })`;
      const location = window.roamAlphaAPI.ui.getFocusedBlock();
      updateBlock({
        text: `${prefix} ${text.slice(refMatch.index + refMatch[0].length)}`,
        uid,
      }).then(() =>
        setTimeout(() => {
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location,
            selection: { start: prefix.length },
          });
        }, 200)
      );
    }
  }
};
const applyChildrenOfLastReferenceAsText = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (uid) {
    const text = getTextByBlockUid(uid);
    const allRefs = Array.from(text.matchAll(new RegExp(BLOCK_REF_REGEX, "g")));
    if (allRefs.length) {
      const latestMatch = allRefs.findIndex(
        (r) =>
          r.index >
          (document.activeElement as HTMLTextAreaElement).selectionStart
      );
      const refMatch = latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
      const tree = getBasicTreeByParentUid(refMatch[1]);
      stripUid(tree).forEach((node, order) =>
        createBlock({ parentUid: uid, order, node })
      );
    }
  }
};
const replaceLastReferenceWithOriginal = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  if (uid) {
    const text = getTextByBlockUid(uid);
    const allRefs = Array.from(text.matchAll(new RegExp(BLOCK_REF_REGEX, "g")));
    if (allRefs.length) {
      const latestMatch = allRefs.findIndex(
        (r) =>
          r.index >
          (document.activeElement as HTMLTextAreaElement).selectionStart
      );
      const refMatch = latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
      const refOrder = getOrderByBlockUid(refMatch[1]);
      const refParent = getParentUidByBlockUid(refMatch[1]);
      const sourceOrder = getOrderByBlockUid(uid);
      const sourceParent = getParentUidByBlockUid(uid);
      window.roamAlphaAPI.moveBlock({
        location: { "parent-uid": refParent, order: refOrder },
        block: { uid },
      });
      window.roamAlphaAPI.moveBlock({
        location: {
          "parent-uid": sourceParent,
          order: sourceOrder,
        },
        block: { uid: refMatch[1] },
      });
    }
  }
};
const expandCollapseBlockTree = () => {
  Promise.resolve(
    window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"] ||
      window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid()
  ).then((blockUid) =>
    renderOverlay({
      id: "exp-col-dialog",
      Overlay: ExpColDialog,
      props: { blockUid },
    })
  );
};

const commands = [
  { label: "Jump to the top of the page", callback: jumpToTheTopOfThePage },
  { label: "Jump to the bottom of page", callback: jumpToTheBottomOfPage },
  { label: "Expand all blocks on page", callback: expandAllBlocksOnPage },
  { label: "Collapse all blocks on page", callback: collapseAllBlocksOnPage },
  { label: "Open this page in sidebar", callback: openPageInSidebar },
  {
    label: "Add shortcut to page to left sidebar",
    callback: addShortcutToLeftSidebar,
  },
  { label: "Toggle Linked Refs", callback: toggleLinkedRefs },
  { label: "Toggle Unlinked Refs", callback: toggleUnlinkedRefs },
  {
    label: "Toggle References to page level",
    callback: toggleReferenceParents,
  },
  { label: "Expand Reference children", callback: expandReferenceChildren },
  { label: "Collapse Reference children", callback: collapseReferenceChildren },
  { label: "Copy block ref", callback: copyBlockRef },
  { label: "Copy block ref as alias", callback: copyBlockRefAsAlias },
  { label: "Expand current block tree", callback: expandCurrentBlockTree },
  { label: "Collapse current block tree", callback: collapseCurrentBlockTree },
  { label: "Insert block above", callback: insertBlockAbove },
  { label: "Insert block below", callback: insertBlockBelow },
  { label: "Go up a block", callback: goUpBlock },
  { label: "Go down a block", callback: goDownBlock },
  { label: "Go to parent block", callback: goToParentBlock },
  { label: "Delete block", callback: delBlock },
  { label: "Toggle Block View type", callback: toggleBlockViewType },
  {
    label: "Replace last reference before cursor with text and alias",
    callback: replaceLastReferenceWithTextAndAlias,
  },
  {
    label: "Apply Children of last reference before cursor as text",
    callback: applyChildrenOfLastReferenceAsText,
  },
  {
    label:
      "Replace last reference before cursor with original + bring nested items along",
    callback: replaceLastReferenceWithOriginal,
  },
  {
    label: "Paste block with children as references",
    callback: pasteBlockWithChildrenAsReferences,
  },
  {
    label:
      "Expand/Collapse block tree to a certain level, specified by the following numeric key press",
    callback: expandCollapseBlockTree,
  },
  { label: "Align left", callback: alignLeft },
  { label: "Center", callback: center },
  { label: "Align right", callback: alignRight },
  { label: "Justify", callback: justify },
  { label: "Toggle Queries", callback: toggleQueries },
];
const unloads = new Set<() => void>();
export let enabled = false;
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  enabled = flag;
  if (flag) {
    const focusableObserver = createHTMLObserver({
      callback: (b) => {
        if (b.tabIndex < 0) {
          b.tabIndex = 0;
        }
      },
      tag: "SPAN",
      className: "bp3-button",
    });
    unloads.add(() => focusableObserver.disconnect());
    commands.forEach((cmd) => unloads.add(addCommand(cmd, extensionAPI)));
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
