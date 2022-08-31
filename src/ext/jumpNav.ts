import { get } from "../settings";
import getFirstChildUidByBlockUid from "roamjs-components/queries/getFirstChildUidByBlockUid";
import getCurrentUserUid from "roamjs-components/queries/getCurrentUserUid";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import { displayMessage } from "../commonFunctions";
import getOrderByBlockUid from "roamjs-components/queries/getOrderByBlockUid";
import createBlock from "roamjs-components/writes/createBlock";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import getNthChildUidByBlockUid from "roamjs-components/queries/getNthChildUidByBlockUid";
import getChildrenLengthByParentUid from "roamjs-components/queries/getChildrenLengthByParentUid";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import updateBlock from "roamjs-components/writes/updateBlock";

const jumpNavIgnore = get("jumpNavIgnore");
const ignoreBindings = new Set(jumpNavIgnore ? jumpNavIgnore.split(",") : []);
let jumpMode = false;
let jumpModeTimeout = 0;
const getCurrentPageUid = async () =>
  (await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid()) ||
  window.roamAlphaAPI.util.dateToPageUid(new Date());
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
        element.click();
        (
          document.querySelector(".bp3-popover-content > div> ul").childNodes[3]
            .childNodes[0] as HTMLElement
        ).click();
      }),
  p: () =>
    document
      .querySelectorAll<HTMLElement>(".rm-reference-item  .block-expand")
      .forEach((element) => {
        element.click();
        (
          document.querySelector(".bp3-popover-content > div> ul").childNodes[4]
            .childNodes[0] as HTMLElement
        ).click();
      }),
  r: () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (uid) {
      navigator.clipboard.writeText(`((${uid}))`);
      displayMessage(`Copied: ((${uid}))`, 2000);
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
    displayMessage(
      `<b>Roam<sup>42</sup></b><br/>Copied:<br/> ${outputText}`,
      2000
    );
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
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (uid) {
      const order = getOrderByBlockUid(uid);
      createBlock({
        order,
        parentUid: getParentUidByBlockUid(uid),
        node: { text: "" },
      });
    }
  },
  u: () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (uid) {
      const order = getOrderByBlockUid(uid) + 1;
      createBlock({
        order,
        parentUid: getParentUidByBlockUid(uid),
        node: { text: "" },
      });
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
  5: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      updateBlock({ uid: active["block-uid"], heading: 1 });
    }
  },
  6: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      updateBlock({ uid: active["block-uid"], heading: 2 });
    }
  },
  7: () => {
    const active = window.roamAlphaAPI.ui.getFocusedBlock();
    if (active) {
      updateBlock({ uid: active["block-uid"], heading: 3 });
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
    const key = /[a-z0-9]/.test(ev.key)
      ? ev.key
      : ev.code.replace(/^Key/, "").toLowerCase();
    if (!ignoreBindings.has(key)) hotkeys[key]?.();
  } else {
    jumpMode = false;
  }
};

export let enabled = false;
export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (flag) {
    document.body.addEventListener("keydown", keydownListener);
  } else {
    document.body.removeEventListener("keydown", keydownListener);
  }
};
