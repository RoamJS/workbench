import createBlockObserver from "roamjs-components/dom/createBlockObserver";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getUids from "roamjs-components/dom/getUids";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import { TreeNode } from "roamjs-components/types";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import getDropUidOffset from "roamjs-components/dom/getDropUidOffset";
import isControl from "roamjs-components/util/isControl";

const HIGHLIGHT_CLASS = "block-highlight-blue";
const DRAG_CLASS = "block-highlight-grey";
const globalRefs = {
  blocksToMove: new Set<string>(),
  shiftKey: false,
};

const getUidByContainer = (d: Element) =>
  getUids(
    (d.getElementsByClassName("roam-block")?.[0] as HTMLDivElement) ||
      (d.getElementsByClassName("rm-block-input")?.[0] as HTMLTextAreaElement)
  ).blockUid;

let enabled = false;
const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (enabled) {
    const [blockObserver] = createBlockObserver((d) => {
      const b = d.closest(".roam-block-container") as HTMLDivElement;
      if (b) {
        if (!b.hasAttribute("data-roamjs-multi-select-listener")) {
          b.setAttribute("data-roamjs-multi-select-listener", "true");
          b.addEventListener("mousedown", (e) => {
            if (isControl(e)) {
              const { blockUid } = getUids(d);
              if (b.classList.contains(HIGHLIGHT_CLASS)) {
                b.classList.remove(HIGHLIGHT_CLASS);
                globalRefs.blocksToMove.delete(blockUid);
              } else {
                b.classList.add(HIGHLIGHT_CLASS);
                globalRefs.blocksToMove.add(blockUid);
              }
              e.stopPropagation();
            }
          });
        }
      }
    });
    unloads.add(() => blockObserver.disconnect());

    const mouseDownListener = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.className?.includes?.("rm-bullet__inner") &&
        target
          .closest(".roam-block-container")
          ?.className?.includes?.(HIGHLIGHT_CLASS)
      ) {
        Array.from(document.getElementsByClassName(HIGHLIGHT_CLASS)).forEach(
          (d) => {
            d.classList.remove(HIGHLIGHT_CLASS);
            d.classList.add(DRAG_CLASS);
          }
        );
      } else if (
        !isControl(e) ||
        (!target.classList.contains("roam-block-container") &&
          !target.closest(".roam-block-container"))
      ) {
        Array.from(document.getElementsByClassName(HIGHLIGHT_CLASS)).forEach(
          (d) => d.classList.remove(HIGHLIGHT_CLASS)
        );
      }
    };
    document.addEventListener("mousedown", mouseDownListener);
    unloads.add(() =>
      document.removeEventListener("mousedown", mouseDownListener)
    );

    const dropAreaObserver = createHTMLObserver({
      tag: "DIV",
      className: "dnd-drop-area",
      callback: (d: HTMLDivElement) => {
        d.addEventListener("drop", () => {
          const { parentUid, offset } = getDropUidOffset(d);
          const containers = Array.from(
            document.getElementsByClassName(DRAG_CLASS)
          );
          Array.from(globalRefs.blocksToMove)
            .map((uid) => ({
              uid,
              index: containers.findIndex((c) => getUidByContainer(c) === uid),
            }))
            .sort(({ index: a }, { index: b }) => a - b)
            .forEach(({ uid }, order) =>
              window.roamAlphaAPI.moveBlock({
                location: {
                  "parent-uid": parentUid,
                  order: offset + order,
                },
                block: {
                  uid,
                },
              })
            );
          globalRefs.blocksToMove = new Set();
        });
      },
    });
    unloads.add(() => dropAreaObserver.disconnect());

    const dragEndListener = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.nodeName === "SPAN" &&
        target.classList.contains("rm-bullet")
      ) {
        Array.from(document.getElementsByClassName(DRAG_CLASS)).forEach((c) =>
          c.classList.remove(DRAG_CLASS)
        );
      }
    };
    document.addEventListener("dragend", dragEndListener);
    unloads.add(() => document.removeEventListener("dragend", dragEndListener));

    const treeNodeToString = (n: TreeNode, i: number, prefix = "- "): string =>
      `${"".padStart(i * 4, " ")}${prefix}${n.text}\n${n.children
        .map((c) => treeNodeToString(c, i + 1, prefix))
        .join("")}`;

    const getHighlightedUids = () =>
      Array.from(document.getElementsByClassName(HIGHLIGHT_CLASS)).map(
        getUidByContainer
      );

    const copyListener = (e: ClipboardEvent) => {
      const data = getHighlightedUids()
        .map((uid) =>
          globalRefs.shiftKey
            ? `- ((${uid}))\n`
            : treeNodeToString(getFullTreeByParentUid(uid), 0)
        )
        .join("");
      globalRefs.shiftKey = false;
      if (data) {
        e.clipboardData.setData("text/plain", data);
        e.preventDefault();
      }
    };
    document.addEventListener("copy", copyListener);
    unloads.add(() => document.removeEventListener("copy", copyListener));

    const cutListener = (e: ClipboardEvent) => {
      const data = getHighlightedUids()
        .map((uid) => {
          const text = treeNodeToString(getFullTreeByParentUid(uid), 0);
          deleteBlock(uid);
          return text;
        })
        .join("");
      if (data) {
        e.clipboardData.setData("text/plain", data);
        e.preventDefault();
      }
    };
    document.addEventListener("cut", cutListener);
    unloads.add(() => document.removeEventListener("cut", cutListener));

    const keydownListener = (e: KeyboardEvent) => {
      if (e.shiftKey && isControl(e) && e.code === "KeyC") {
        e.preventDefault();
        globalRefs.shiftKey = true;
        document.execCommand("copy");
      } else if (e.shiftKey && isControl(e) && e.code === "KeyM") {
        e.preventDefault();
        const uids = getHighlightedUids();
        if (uids.length) {
          const text = uids
            .map((u) => treeNodeToString(getFullTreeByParentUid(u), 0, ""))
            .join("")
            .slice(0, -1); // trim trailing newline
          updateBlock({ text, uid: uids[0] });
          getShallowTreeByParentUid(uids[0]).forEach(({ uid }) =>
            deleteBlock(uid)
          );
          uids.slice(1).forEach((u) => deleteBlock(u));
        }
      }
    };
    document.addEventListener("keydown", keydownListener);
    unloads.add(() => document.removeEventListener("keydown", keydownListener));
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
