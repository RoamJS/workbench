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

const jumpNavIgnore = get("jumpNavIgnore");
const ignoreBindings = new Set(jumpNavIgnore ? jumpNavIgnore.split(",") : []);
let jumpMode = false;
let jumpModeTimeout = 0;
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

// Available Keys:
// h
// A, B, D, E, F, G, H, I, J, K, L, M, N, P, Q, R, T, U, W, Y, Z
// 5, 6, 7, 8, 9, 0
const hotkeys: Record<string, () => unknown> = {
  t: () =>
    getCurrentPageUid().then((uid) => {
      const blockUid = getFirstChildUidByBlockUid(uid);
      window.roamAlphaAPI.ui.setBlockFocusAndSelection({
        location: {
          "block-uid": blockUid,
          "window-id": `${getCurrentUserUid()}-body-outline-${uid}`,
        },
      });
    }),
  b: () =>
    getCurrentPageUid().then((uid) => {
      const blocks = getShallowTreeByParentUid(uid);
      const blockUid = blocks[blocks.length - 1]?.uid;
      if (blockUid)
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "block-uid": blockUid,
            "window-id": `${getCurrentUserUid()}-body-outline-${uid}`,
          },
        });
    }),
  e: async () => {
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
  },
  c: async () => {
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
  },
  o: () => getCurrentPageUid().then(openBlockInSidebar),
  w: () => {
    (
      document.querySelector(".rm-reference-container .rm-caret") as HTMLElement
    ).click();
    document
      .querySelector(".rm-reference-container .rm-caret")
      .scrollIntoView();
  },
  z: () => {
    (
      document.querySelector(
        ".rm-reference-main > div > div:nth-child(2) > div > span > span"
      ) as HTMLElement
    ).click();
    document
      .querySelector(
        ".rm-reference-main > div > div:nth-child(2) > div > span > span"
      )
      .scrollIntoView();
  },
  f: () =>
    document
      .querySelectorAll<HTMLElement>(
        ".rm-title-arrow-wrapper .bp3-icon-caret-down"
      )
      .forEach((element) => {
        element.click();
      }),
  v: () =>
    document
      .querySelectorAll<HTMLElement>(".rm-reference-item  .block-expand")
      .forEach((element) => {
        element.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
          })
        );
        const li = Array.from(
          document.querySelector(".bp3-popover-content > div> ul").children
        ).find((e: HTMLLinkElement) => e.innerText === "Expand all");
        (li?.childNodes[0] as HTMLElement).click();
      }),
  p: () =>
    document
      .querySelectorAll<HTMLElement>(".rm-reference-item  .block-expand")
      .forEach((element) => {
        element.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
          })
        );
        const li = Array.from(
          document.querySelector(".bp3-popover-content > div> ul").children
        ).find((e: HTMLLinkElement) => e.innerText === "Collapse all");
        (li?.childNodes[0] as HTMLElement).click();
      }),
  r: () => {
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
  },
  s: () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    const selectedText = window.getSelection().toString();
    const formatToUse = get("CopyRefAsAliasFormat");
    const outputText =
      selectedText != "" && formatToUse
        ? formatToUse
            .replace("UID", `((${uid}))`)
            .replace("SELECTEDTEXT", selectedText)
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
  },
  x: () => {
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
  },
  l: () => {
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
  },
  i: () => {
    const location = window.roamAlphaAPI.ui.getFocusedBlock();
    const uid = location?.["block-uid"];
    if (uid) {
      const order = getOrderByBlockUid(uid);
      createBlock({
        order,
        parentUid: getParentUidByBlockUid(uid),
        node: { text: "" },
      }).then((newUid) =>
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: { "window-id": location["window-id"], "block-uid": newUid },
        })
      );
    }
  },
  u: () => {
    const location = window.roamAlphaAPI.ui.getFocusedBlock();
    const uid = location?.["block-uid"];
    if (uid) {
      const order = getOrderByBlockUid(uid) + 1;
      createBlock({
        order,
        parentUid: getParentUidByBlockUid(uid),
        node: { text: "" },
      }).then((newUid) =>
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: { "window-id": location["window-id"], "block-uid": newUid },
        })
      );
    }
  },
  k: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      const order = getOrderByBlockUid(active["block-uid"]);
      if (order > 0) {
        const parentUid = getParentUidByBlockUid(active["block-uid"]);
        const newBlockUid = getNthChildUidByBlockUid({
          blockUid: parentUid,
          order: order - 1,
        });
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "window-id": active["window-id"],
            "block-uid": newBlockUid,
          },
        });
      }
    }
  },
  j: () => {
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
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "window-id": active["window-id"],
            "block-uid": newBlockUid,
          },
        });
      }
    }
  },
  g: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      const parentUid = getParentUidByBlockUid(active["block-uid"]);
      const isPage = !window.roamAlphaAPI.pull("[:block/page]", [
        ":block/uid",
        parentUid,
      ])?.[":block/page"];
      if (!isPage) {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "window-id": active["window-id"],
            "block-uid": parentUid,
          },
        });
      }
    }
  },
  d: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      deleteBlock(active["block-uid"]);
    }
  },
  1: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      updateBlock({ uid: active["block-uid"], textAlign: "left" });
    }
  },
  2: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      updateBlock({ uid: active["block-uid"], textAlign: "center" });
    }
  },
  3: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      updateBlock({ uid: active["block-uid"], textAlign: "right" });
    }
  },
  4: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      updateBlock({ uid: active["block-uid"], textAlign: "justify" });
    }
  },
  y: () =>
    document
      .querySelectorAll<HTMLDivElement>(".rm-query-title .bp3-icon-caret-down")
      .forEach((element) => {
        element.click();
      }),
  n: () => {
    if (document.querySelector(".rm-open-left-sidebar-btn"))
      window.roamAlphaAPI.ui.leftSidebar.open();
    else window.roamAlphaAPI.ui.leftSidebar.close();
  },
  m: () => {
    if (document.querySelector("#roam-right-sidebar-content"))
      window.roamAlphaAPI.ui.rightSidebar.close();
    else window.roamAlphaAPI.ui.rightSidebar.open();
  },
  S: () => {
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
  },
  V: () => {
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
  },
  q: () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];

    if (uid) {
      const viewType = (
        window.roamAlphaAPI.data.fast.q(
          `[:find (pull ?b [:children/view-type]) :where [?b :block/uid "${uid}"]]`
        )[0]?.[0] as PullBlock
      )?.[":children/view-type"];
      const newViewType =
        viewType === ":document"
          ? "numbered"
          : viewType === ":numbered"
          ? "bullet"
          : "document";
      window.roamAlphaAPI.updateBlock({
        block: { uid, "children-view-type": newViewType },
      });
    }
  },
  a: () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (uid) {
      const text = getTextByBlockUid(uid);
      const allRefs = Array.from(
        text.matchAll(new RegExp(BLOCK_REF_REGEX, "g"))
      );
      if (allRefs.length) {
        const latestMatch = allRefs.findIndex(
          (r) =>
            r.index >
            (document.activeElement as HTMLTextAreaElement).selectionStart
        );
        const refMatch =
          latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
        const refText = getTextByBlockUid(refMatch[1]);
        const prefix = `${text.slice(0, refMatch.index)}${refText} [*](${
          refMatch[0]
        })`;
        const location = window.roamAlphaAPI.ui.getFocusedBlock();
        updateBlock({
          text: `${prefix} ${text.slice(refMatch.index + refMatch[0].length)}`,
          uid,
        }).then(() =>
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location,
            selection: { start: prefix.length },
          })
        );
      }
    }
  },
  C: () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (uid) {
      const text = getTextByBlockUid(uid);
      const allRefs = Array.from(
        text.matchAll(new RegExp(BLOCK_REF_REGEX, "g"))
      );
      if (allRefs.length) {
        const latestMatch = allRefs.findIndex(
          (r) =>
            r.index >
            (document.activeElement as HTMLTextAreaElement).selectionStart
        );
        const refMatch =
          latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
        const tree = getBasicTreeByParentUid(refMatch[1]);
        stripUid(tree).forEach((node, order) =>
          createBlock({ parentUid: uid, order, node })
        );
      }
    }
  },
  O: () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (uid) {
      const text = getTextByBlockUid(uid);
      const allRefs = Array.from(
        text.matchAll(new RegExp(BLOCK_REF_REGEX, "g"))
      );
      if (allRefs.length) {
        const latestMatch = allRefs.findIndex(
          (r) =>
            r.index >
            (document.activeElement as HTMLTextAreaElement).selectionStart
        );
        const refMatch =
          latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
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
  },
  X: () => {
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
  },
};
const keydownListener = (ev: KeyboardEvent) => {
  window.clearTimeout(jumpModeTimeout);
  if (
    (ev.metaKey || ev.altKey || ev.ctrlKey) &&
    (ev.key === "j" || ev.code === `KeyJ`) &&
    !jumpMode
  ) {
    jumpMode = true;
    jumpModeTimeout = window.setTimeout(() => (jumpMode = false), 3000);
    ev.preventDefault();
    ev.stopPropagation();
  } else if (jumpMode) {
    ev.preventDefault();
    ev.stopPropagation();
    jumpMode = false;
    const key = /[a-z0-9A-Z]/.test(ev.key)
      ? ev.key
      : ev.code
          .replace(/^Key/, "")
          .replace(/^Digit/, "")
          [ev.shiftKey ? "toUpperCase" : "toLowerCase"]();
    if (!ignoreBindings.has(key)) hotkeys[key]?.();
  } else if (ev.key === "Enter") {
    const element = ev.target as HTMLElement;
    if (element.className.indexOf("bp3-button") > -1) {
      element.click();
    }
    jumpMode = false;
  } else {
    jumpMode = false;
  }
};

const unloads = new Set<() => void>();
export let enabled = false;
export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (flag) {
    document.body.addEventListener("keydown", keydownListener);
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
    unloads.add(() =>
      document.body.removeEventListener("keydown", keydownListener)
    );
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
