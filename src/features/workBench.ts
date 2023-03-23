import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageUidByBlockUid from "roamjs-components/queries/getPageUidByBlockUid";
import createPage from "roamjs-components/writes/createPage";
import getBlockUidsAndTextsReferencingPage from "roamjs-components/queries/getBlockUidsAndTextsReferencingPage";
import parseNlpDate from "roamjs-components/date/parseNlpDate";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import {
  prompt,
  render as renderFormDialog,
} from "roamjs-components/components/FormDialog";
import { render as renderToast } from "roamjs-components/components/Toast";
import createBlock from "roamjs-components/writes/createBlock";
import getChildrenLengthByParentUid from "roamjs-components/queries/getChildrenLengthByPageUid";
import getOrderByBlockUid from "roamjs-components/queries/getOrderByBlockUid";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import { render as renderSimpleAlert } from "roamjs-components/components/SimpleAlert";
import { get } from "../settings";
import focusMainWindowBlock from "roamjs-components/util/focusMainWindowBlock";
import React from "react";
import { AddCommandOptions, RoamBasicNode, SidebarWindow } from "roamjs-components/types/native";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import updateBlock from "roamjs-components/writes/updateBlock";
import { moveForwardToDate } from "./dailyNotesPopup";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import getUidsFromId from "roamjs-components/dom/getUidsFromId";
import getBlockUidsReferencingPage from "roamjs-components/queries/getBlockUidsReferencingPage";
import createTagRegex from "roamjs-components/util/createTagRegex";
import registerSmartBlocksCommand from "roamjs-components/util/registerSmartBlocksCommand";

export let active = false;

let keystate = {
  shiftKey: false,
};
type Command = {
  display: string;
  cmd: () => void;
};
let _commands: Set<Command> = new Set();

const confirm = (content: string) =>
  new Promise<boolean>((resolve) =>
    renderSimpleAlert({
      content,
      confirmText: "Yes",
      onCancel: () => resolve(false),
      onConfirm: () => resolve(true),
    })
  );

const getBlocksByParent = (uid: string) =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?c [:block/string, :block/uid]) :where [?b :block/uid "${uid}"] [?c :block/page ?b]]`
    )
    .map((a) => a[0]) as { string: string; uid: string }[];

const runInboxCommand = async (uids: string[], children: RoamBasicNode[]) => {
  let pageUID = null;
  let pageName = await userCommands.findBlockAmongstChildren(children, "page:");
  if (pageName == null) {
    //default to DNP
    pageUID = window.roamAlphaAPI.util.dateToPageUid(parseNlpDate("today"));
    pageName = "Today's DNP";
  } else {
    //get page UID, if doesnt exist, exist
    pageUID = getPageUidByPageTitle(pageName);
    if (pageUID == "") {
      renderToast({
        content: `This page "${pageName}" doesnt exist, action not performed.`,
        intent: "warning",
        id: "workbench-warning",
        timeout: 5000,
      });
      return;
    }
  }
  let textName = await userCommands.findBlockAmongstChildren(children, "text:");
  //if text defined, get the UID of the tag.
  let textUID =
    textName == null
      ? null
      : getBlocksByParent(pageUID).find((e) =>
          e.string.toLowerCase().includes(textName.toLowerCase())
        );

  if (textName != null && textUID == null) {
    //text location doesnt exist,
    textUID = {
      uid: window.roamAlphaAPI.util.generateUID(),
      string: textName,
    };
    await window.roamAlphaAPI.createBlock({
      location: { "parent-uid": pageUID, order: 0 },
      block: { uid: textUID.uid, string: textName },
    });
    renderToast({
      content: `This location "${pageName} > ${textName}" didnt exist, so a new block was created.`,
      intent: "warning",
      id: "workbench-warning",
      timeout: 5000,
    });
  }

  //reset pageUID if there is a valid text block
  pageUID = textUID ? textUID.uid : pageUID;

  let locationTopBotom = await userCommands.findBlockAmongstChildren(
    children,
    "location:"
  );

  const blockrefValues = { true: true, reverse: "reverse" };
  let blockRef: boolean | string = await userCommands.findBlockAmongstChildren(
    children,
    "blockref:"
  );
  if (blockRef == null) blockRef = false;
  else {
    const key = blockRef.toLowerCase();
    blockRef =
      key in blockrefValues
        ? blockrefValues[key as keyof typeof blockrefValues]
        : false;
  }

  moveBlocks({
    base: locationTopBotom === "top" ? 0 : 1000,
    parentUid: pageUID,
    uids,
    blockRef,
  }).then(() =>
    renderToast({
      content: `Block(s) moved to ${pageName}${
        textName == null ? "" : " > " + textName
      }`,
      intent: "warning",
      id: "workbench-warning",
      timeout: 3000,
    })
  );
};

const sortObjectByKey = <T extends { key: string }>(o: T[]) => {
  return o.sort(function (a, b) {
    return a.key.localeCompare(b.key);
  });
};

export const userCommands = {
  findBlockAmongstChildren: async (
    childrenBlocks: RoamBasicNode[],
    startsWith: string
  ) => {
    //loops through array and returns node where the text matches
    for (let c of childrenBlocks) {
      let resolvedBlockString = resolveRefs(c.text);
      let searchString = resolvedBlockString.toString().toLowerCase();
      let comparisonString = startsWith.toLowerCase();
      if (searchString.startsWith(comparisonString))
        return resolvedBlockString.substring(startsWith.length).trim();
    }
    return null;
  },
  UserDefinedCommandList: async () => {
    let validCommandTypeList = ["inbox"]; //in future add new types here
    let userCommandBlocks = getBlockUidsAndTextsReferencingPage("42workBench");
    let results = [];
    const userEmail = getCurrentUserEmail();
    for (let inbox of userCommandBlocks) {
      try {
        var sType = inbox.text
          .replace("#42workBench", "")
          .replace("#[[42workBench]]", "")
          .trim()
          .toLowerCase();
        const inboxChildren = getBasicTreeByParentUid(inbox.uid);
        if (inboxChildren && validCommandTypeList.includes(sType)) {
          let users = await userCommands.findBlockAmongstChildren(
            inboxChildren,
            "users:"
          );
          if (users != null && users.trim() != "users:") {
            const userArray = users.split(" ");
            if (userArray.includes(userEmail) == false) continue;
          }
          //must contain a name
          let name = await userCommands.findBlockAmongstChildren(
            inboxChildren,
            "name:"
          );
          if (name == null) continue;
          results.push({
            key: name,
            type: sType,
            details: inboxChildren,
          });
        }
      } catch (e) {}
    }
    return sortObjectByKey(results);
  },
  runComand: async (
    uids: string[],
    cmdInfo: { type: string; details: RoamBasicNode[] }
  ) => {
    //this function is called by the workBench to peform an action
    switch (cmdInfo["type"]) {
      case "inbox":
        await runInboxCommand(uids, cmdInfo.details);
        break;
    }
  },
};

export const addCommand = (
  textToDisplay: string,
  callback: (uids: string[]) => unknown | Promise<unknown>,
  restoreFocus?: true
) => {
  const callbackFunction = async () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    const uids = uid
      ? [uid]
      : Array.from(document.querySelectorAll(`.block-highlight-blue`)).map(
          (d) => getUidsFromId(d.querySelector(".roam-block").id).blockUid
        );
    Promise.resolve(callback(uids)).then(() => {
      if (restoreFocus && uids.length === 1) {
        focusMainWindowBlock(uids[0]);
      }
    });
  };
  const display = "(WB) " + textToDisplay;
  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: display,
    callback: callbackFunction,
  });
  const command = {
    display,
    cmd: callbackFunction,
  };
  _commands.add(command);
  return () => _commands.delete(command);
};

// testing
export const newAddCommand = (args: AddCommandOptions, extensionAPI: any) => {
  const display = "(WB) " + args.label;
  const options = { 
    label: display,
    callback: args.callback,
    disableHotkey: args.disableHotkey,
    defaultHotkey: args.defaultHotkey
  };
  extensionAPI.ui.commandPalette.addCommand(options);
  const command = {
    display,
    cmd: args.callback,
  };
  _commands.add(command);
  return () => 
  {
    removeCommand(display, extensionAPI);
    _commands.delete(command);
  }
}

export const removeCommand = (label: string, extensionAPI: any) => {
  extensionAPI.ui.commandPalette.removeCommand({
    label
  });
}

const moveBlocks = ({
  uids,
  base = 0,
  parentUid,
  blockRef = false,
}: {
  uids: string[];
  base?: number;
  parentUid: string;
  blockRef?: string | boolean;
}) =>
  Promise.all(
    uids.map((uid, order) =>
      blockRef === "reverse"
        ? createBlock({
            parentUid,
            order: base + order,
            node: { text: `((${uid}))` },
          })
        : blockRef
        ? createBlock({
            parentUid: getParentUidByBlockUid(uid),
            order: getOrderByBlockUid(uid),
            node: { text: `((${uid}))` },
          }).then(() =>
            window.roamAlphaAPI.moveBlock({
              location: { "parent-uid": parentUid, order: base + order },
              block: { uid },
            })
          )
        : window.roamAlphaAPI.moveBlock({
            location: { "parent-uid": parentUid, order: base + order },
            block: { uid },
          })
    )
  );

const leaveBlockReferences = ({ uids }: { uids: string[] }) =>
  uids.map((uid) =>
    createBlock({
      parentUid: getParentUidByBlockUid(uid),
      order: getOrderByBlockUid(uid),
      node: { text: `((${uid}))` },
    })
  );

const promptPathAndCallback = ({
  valid: check,
  callback,
  supportPages,
}: {
  valid: boolean;
  callback: (inputUid: string) => Promise<unknown>;
  supportPages?: boolean;
}) => {
  if (!check) {
    renderToast({
      content: "No blocks selected",
      intent: "warning",
      id: "workbench-warning",
    });
    return Promise.resolve(false);
  } else {
    return new Promise<boolean>((resolve) =>
      renderFormDialog({
        // @ts-ignore
        onClose: () => resolve(false),
        onSubmit: (data: { block: string; page?: string }) => {
          const parentUid = data.page
            ? getPageUidByPageTitle(data.page) || data.block
            : data.block;
          if (parentUid) {
            return callback(parentUid)
              .then(() => resolve(true))
              .catch((e) => {
                renderToast({
                  content: `Failed to act on user inputs: ${e.message}`,
                  intent: "warning",
                  id: "workbench-warning",
                });
                resolve(false);
              });
          } else {
            renderToast({
              content: "Could not find ref based on user input",
              intent: "warning",
              id: "workbench-warning",
            });
            resolve(false);
          }
        },
        content: React.createElement(
          "div",
          { className: "mb-4 text-lg font-semibold" },
          supportPages ? "Select either a page or block" : "Select a block"
        ),
        fields: supportPages
          ? {
              page: { type: "page", label: "Page" },
              block: { type: "block", label: "Block" },
            }
          : {
              block: { type: "block", label: "Block" },
            },
      })
    );
  }
};

const promptMoveBlocks = ({
  uids,
  getBase,
}: {
  uids: string[];
  getBase: (n: string) => number;
}) =>
  promptPathAndCallback({
    valid: !!uids.length,
    supportPages: true,
    callback: (inputUid) =>
      moveBlocks({
        uids,
        parentUid: inputUid,
        base: getBase(inputUid),
      }),
  });

const promptMoveRefs = ({
  uids,
  getBase,
}: {
  uids: string[];
  getBase: (n: string) => number;
}) =>
  promptPathAndCallback({
    valid: !!uids.length,
    callback: (inputUid) => {
      const base = getBase(inputUid);
      return Promise.all(
        uids.map((uid, order) =>
          createBlock({
            parentUid: inputUid,
            order: base + order,
            node: { text: `((${uid}))` },
          })
        )
      );
    },
  });

const promptPullBlock = async (uids: string[], makeBlockRef = false) => {
  promptPathAndCallback({
    valid: !!uids.length,
    callback: (inputUid) => {
      const targetUid = uids[0];
      const setup = makeBlockRef
        ? createBlock({
            parentUid: getParentUidByBlockUid(inputUid),
            node: { text: `((${inputUid}))` },
            order: getOrderByBlockUid(inputUid),
          })
        : Promise.resolve();
      return setup.then(() =>
        window.roamAlphaAPI.moveBlock({
          location: { "parent-uid": targetUid, order: 0 },
          block: { uid: inputUid },
        })
      );
    },
  });
};

const promptPullChildBlocks = async (uids: string[], makeBlockRef = false) => {
  promptPathAndCallback({
    valid: !!uids.length,
    callback: (inputUid) => {
      const targetUid = uids[0];
      const childBlocks = getShallowTreeByParentUid(inputUid);
      const setup = makeBlockRef
        ? Promise.all(
            childBlocks.map((cuid, order) =>
              createBlock({
                parentUid: inputUid,
                node: { text: `((${cuid}))` },
                order,
              })
            )
          )
        : Promise.resolve();
      return setup.then(() =>
        window.roamAlphaAPI.moveBlock({
          location: { "parent-uid": targetUid, order: 0 },
          block: { uid: inputUid },
        })
      );
    },
  });
};

const swapWithSideBar = async (index = 0) => {
  const panes = window.roamAlphaAPI.ui.rightSidebar.getWindows();
  if (panes.length == 0) {
    renderToast({
      content: "No open sidebar windows to swap with.",
      id: "workbench-warning",
    });
    return;
  }
  const mainPageUID =
    await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
  const pane = panes[index];
  const paneToSwap =
    pane.type === "outline"
      ? pane["page-uid"]
      : pane.type === "mentions"
      ? pane["mentions-uid"]
      : pane["block-uid"];
  if (paneToSwap != undefined) {
    window.roamAlphaAPI.ui.mainWindow.openBlock({
      block: { uid: paneToSwap },
    });
    window.roamAlphaAPI.ui.rightSidebar.removeWindow({
      window: { "block-uid": paneToSwap, type: pane.type },
    });
    window.roamAlphaAPI.ui.rightSidebar.addWindow({
      window: { "block-uid": mainPageUID, type: "outline" },
    });
  }
};

const getWindowUid = (pane: SidebarWindow) =>
  pane["type"] === "mentions"
    ? pane["mentions-uid"]
    : pane["type"] == "outline"
    ? pane["page-uid"]
    : pane["block-uid"];

const REPLACE = "{ref}";
const pullReferences = async (uids: string[], removeTags?: boolean) => {
  const format = get("pullReferencesFormat") || REPLACE;
  const pageTitleText = uids.length
    ? getPageTitleByBlockUid(uids[0]) || getPageTitleByPageUid(uids[0])
    : await window.roamAlphaAPI.ui.mainWindow
        .getOpenPageOrBlockUid()
        .then((uid) => getPageTitleByPageUid(uid));
  const linkedReferences = getBlockUidsAndTextsReferencingPage(pageTitleText);
  if (linkedReferences.length === 0) {
    return [`No linked references for ${pageTitleText}!`];
  }
  const bullets = linkedReferences.map((l) =>
    format
      .replace(/{ref}/gi, `((${l.uid}))`)
      .replace(/{todo}/gi, "{{[[TODO]]}}")
  );

  if (removeTags) {
    getBlockUidsReferencingPage(pageTitleText).forEach((blockUid) => {
      const value = getTextByBlockUid(blockUid);
      window.roamAlphaAPI.updateBlock({
        block: {
          string: value.replace(createTagRegex(pageTitleText), ""),
          uid: blockUid,
        },
      });
    });
  }
  return bullets;
};

const unloads = new Set<() => void>();
export const initialize = async () => {
  // Commands are ordered in line with the docs at: https://roamjs.com/extensions/workbench/command_palette_plus
  addCommand("Move Block(s) - to top (mbt)", async (uids) => {
    promptMoveBlocks({ uids, getBase: () => 0 });
  });
  addCommand("Move Block(s) - to bottom (mbb)", async (uids) => {
    promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid });
  });
  addCommand("Move Block(s) - DNP (mbdnp)", async (uids) => {
    const dateExpression = await prompt({
      title: "WorkBench",
      question: "Move this block to the top of what date?",
      defaultAnswer: "Tomorrow",
    });
    if (!dateExpression) return;
    const parsedDate = window.roamAlphaAPI.util.dateToPageTitle(
      parseNlpDate(dateExpression)
    );
    if (!parsedDate) {
      renderToast({
        content: "Invalid date: " + dateExpression,
        intent: "warning",
        id: "workbench-warning",
        timeout: 5000,
      });
      return;
    }
    const makeBlockRef = await confirm("Leave Block Reference?");
    if (makeBlockRef) {
      await leaveBlockReferences({ uids });
    }
    //move the block, and leave behind a block ref
    const destinationPage =
      getPageUidByPageTitle(parsedDate) ||
      (await createPage({ title: parsedDate }));
    const base = getChildrenLengthByParentUid(destinationPage);
    return moveBlocks({ base, uids, parentUid: destinationPage });
  });
  addCommand("Move Block(s) - to top with block Ref (mbtr)", async (uids) => {
    await leaveBlockReferences({ uids });
    promptMoveBlocks({ uids, getBase: () => 0 });
  });
  addCommand(
    "Move Block(s) - to bottom with block ref (mbbr)",
    async (uids) => {
      await leaveBlockReferences({ uids });
      promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid });
    }
  );
  addCommand("Move Block(s) - to top & zoom (mbtz)", async (uids) => {
    promptMoveBlocks({ uids, getBase: () => 0 }).then(
      (success) =>
        success &&
        window.roamAlphaAPI.ui.mainWindow.openBlock({
          block: { uid: getParentUidByBlockUid(uids[0]) },
        })
    );
  });
  addCommand("Move Block(s) - to bottom & zoom (mbbz)", async (uids) => {
    promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid }).then(
      (success) =>
        success &&
        window.roamAlphaAPI.ui.mainWindow.openBlock({
          block: { uid: getParentUidByBlockUid(uids[0]) },
        })
    );
  });
  addCommand("Move Block(s) - to top & sidebar (mbts)", async (uids) => {
    promptMoveBlocks({ uids, getBase: () => 0 }).then(
      (success) => success && openBlockInSidebar(uids[0])
    );
  });
  addCommand("Move Block(s) - to bottom & sidebar (mbbs)", async (uids) => {
    promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid }).then(
      (success) => success && openBlockInSidebar(uids[0])
    );
  });
  addCommand("Send block ref - to top (sbrt)", async (uids) => {
    promptMoveRefs({ uids, getBase: () => 0 });
  });
  addCommand("Send block refs - to bottom (sbrb)", async (uids) => {
    promptMoveRefs({ uids, getBase: getChildrenLengthByParentUid });
  });

  addCommand("Pull block (pbb)", async (uids) => {
    promptPullBlock(uids);
  });
  addCommand("Pull block and leave block ref (pbr)", async (uids) => {
    promptPullBlock(uids, true);
  });
  addCommand("Pull child blocks  (pcb)", async (uids) => {
    promptPullChildBlocks(uids);
  });
  addCommand("Pull child block and leave block ref (pcr)", async (uids) => {
    promptPullChildBlocks(uids, true);
  });
  addCommand("Pull references (prf)", async (uids) => {
    pullReferences(uids).then(async (bts) => {
      const [blockUid] = uids;
      const parentUid = blockUid
        ? getParentUidByBlockUid(blockUid)
        : await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
      const order = blockUid
        ? getOrderByBlockUid(blockUid)
        : getChildrenLengthByParentUid(blockUid);
      return Promise.all([
        updateBlock({ text: bts[0], uid: blockUid }),
        ...bts
          .slice(1)
          .map((text, o) =>
            createBlock({ parentUid, order: o + order + 1, node: { text } })
          ),
      ]);
    });
  });
  addCommand("Pull references and remove old refs (prr)", async (uids) => {
    pullReferences(uids, true).then(async (bts) => {
      const [blockUid] = uids;
      const parentUid = blockUid
        ? getParentUidByBlockUid(blockUid)
        : await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
      const order = blockUid
        ? getOrderByBlockUid(blockUid)
        : getChildrenLengthByParentUid(blockUid);
      return Promise.all([
        updateBlock({ text: bts[0], uid: blockUid }),
        ...bts
          .slice(1)
          .map((text, o) =>
            createBlock({ parentUid, order: o + order + 1, node: { text } })
          ),
      ]);
    });
  });

  addCommand("Jump to Block in page (jbp)", async () => {
    promptPathAndCallback({
      valid: true,
      callback: (inputUid) => {
        return window.roamAlphaAPI.ui.mainWindow
          .openPage({
            page: { uid: getPageUidByBlockUid(inputUid) },
          })
          .then(() => {
            focusMainWindowBlock(inputUid);
          });
      },
    });
  });
  addCommand("Copy Block Reference", async (uids) => {
    window.navigator.clipboard.writeText(`((${uids[0] || ""}))`);
  });
  addCommand("Copy Block Reference as alias", async (uids) => {
    window.navigator.clipboard.writeText(`[*](((${uids[0] || ""})))`);
  });
  addCommand("Sort Child Blocks", async (uids) => {
    Promise.all(
      uids.map((u) => {
        const children = getShallowTreeByParentUid(u);
        const sorted = children.sort((a, b) => a.text.localeCompare(b.text));
        return sorted
          .map(
            (c, order) => () =>
              window.roamAlphaAPI.moveBlock({
                location: { "parent-uid": u, order },
                block: { uid: c.uid },
              })
          )
          .reduce((p, c) => p.then(c), Promise.resolve());
      })
    );
  });

  addCommand("Sidebars - swap with main window (swap)", async () => {
    swapWithSideBar();
  });
  addCommand(
    "Sidebars - swap with main window & choose window (swc)",
    async () => {
      const panes = await window.roamAlphaAPI.ui.rightSidebar.getWindows();
      if (panes.length == 0) {
        renderToast({
          content: "No open side windows to swap with.",
          intent: "warning",
          id: "workbench-warning",
          timeout: 5000,
        });
        return;
      }
      let outputString = "";
      let iCounter = 1;
      for (const pane of panes) {
        let paneUID = getWindowUid(pane);
        if (paneUID != undefined) {
          const title = getPageTitleByPageUid(paneUID);
          if (title)
            outputString += (iCounter + ": " + title + "\n").substring(0, 100);
          else
            outputString += (
              iCounter +
              ": " +
              getPageTitleByBlockUid(paneUID) +
              " > " +
              getTextByBlockUid(paneUID) +
              "\n"
            ).substring(0, 100);
          iCounter += 1;
        }
      }
      let paneToSwap = await prompt({
        title: "WorkBench",
        question: "Which window pane to swap? (type number)\n\n" + outputString,
        defaultAnswer: "1",
      });
      if (paneToSwap != null && paneToSwap != "") {
        const paneToSwapVal = Number(paneToSwap);
        if (
          paneToSwapVal != NaN &&
          paneToSwapVal > 0 &&
          paneToSwapVal <= panes.length
        )
          await swapWithSideBar(paneToSwapVal - 1);
        else
          renderToast({
            content: "Not  a valid number for a sidebar pane",
            intent: "warning",
            id: "workbench-warning",
            timeout: 5000,
          });
      }
    }
  );
  addCommand(
    "Right Sidebar - close window panes (rscwp)",
    async () => {
      await Promise.all(
        window.roamAlphaAPI.ui.rightSidebar
          .getWindows()
          .map((w) =>
            window.roamAlphaAPI.ui.rightSidebar.removeWindow({
              window: { type: w.type, "block-uid": getWindowUid(w) },
            })
          )
          .concat(window.roamAlphaAPI.ui.rightSidebar.close())
      );
    },
    true
  );
  addCommand(
    "Sidebars - open both (sob)",
    async () => {
      await Promise.all([
        window.roamAlphaAPI.ui.rightSidebar.open(),
        window.roamAlphaAPI.ui.leftSidebar.open(),
      ]);
    },
    true
  );
  addCommand(
    "Sidebars - close both (scb)",
    async () => {
      await Promise.all([
        window.roamAlphaAPI.ui.rightSidebar.close(),
        window.roamAlphaAPI.ui.leftSidebar.close(),
      ]);
    },
    true
  );
  addCommand("Open Page (opp)", async () => {
    promptPathAndCallback({
      valid: true,
      supportPages: true,
      callback: (inputUid) =>
        window.roamAlphaAPI.ui.mainWindow.openBlock({
          block: { uid: inputUid },
        }),
    });
  });
  addCommand("Open Page in Sidebar (ops)", async () => {
    promptPathAndCallback({
      valid: true,
      supportPages: true,
      callback: (inputUid) => openBlockInSidebar(inputUid),
    });
  });

  addCommand("Create a page (cap)", async () => {
    prompt({
      title: "Create Page",
      question: "Enter page title",
      defaultAnswer: "",
    }).then((title) => {
      if (getPageUidByPageTitle(title)) {
        renderToast({
          intent: "warning",
          content: `Page ${title} already exists.`,
          id: "workbench-warning",
        });
      } else {
        createPage({ title }).then((uid) =>
          window.roamAlphaAPI.ui.mainWindow.openPage({
            page: { uid },
          })
        );
      }
    });
  });
  const confirmDeletePage = (pageUID: string, pageTitle: string) => {
    return confirm(
      `Are you sure you want to **DELETE** the page?\n\n**${pageTitle}**`
    ).then(
      (success) =>
        success &&
        window.roamAlphaAPI.ui.mainWindow
          .openDailyNotes()
          .then(() =>
            window.roamAlphaAPI.deletePage({ page: { uid: pageUID } })
          )
    );
  };
  addCommand("Delete current page (dcp)", async () => {
    const uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
    if ((await get("workBenchDcpConfirm")) == "off") {
      return window.roamAlphaAPI.ui.mainWindow
        .openDailyNotes()
        .then(() => window.roamAlphaAPI.deletePage({ page: { uid } }));
    } else {
      const currentPageTitle = getPageTitleByPageUid(uid);
      confirmDeletePage(uid, currentPageTitle);
    }
  });
  addCommand("Delete a page using Path Navigator (dap)", async () => {
    promptPathAndCallback({
      valid: true,
      supportPages: true,
      callback: (inputUid) => {
        const title =
          getPageTitleByPageUid(inputUid) || getPageTitleByBlockUid(inputUid);
        return confirmDeletePage(getPageUidByPageTitle(title), title);
      },
    });
  });

  addCommand("Daily Notes (dn)", async () => {
    if (keystate.shiftKey) {
      openBlockInSidebar(window.roamAlphaAPI.util.dateToPageUid(new Date()));
    } else {
      window.roamAlphaAPI.ui.mainWindow.openDailyNotes();
    }
  });
  const graphTypes = {
    hosted: "app",
    offline: "offline",
  };
  addCommand("All Pages", async () => {
    document.location.hash = `#/${graphTypes[window.roamAlphaAPI.graph.type]}/${
      window.roamAlphaAPI.graph.name
    }/search`;
  });
  addCommand("Graph Overview", async () => {
    document.location.hash = `#/${graphTypes[window.roamAlphaAPI.graph.type]}/${
      window.roamAlphaAPI.graph.name
    }/graph`;
  });
  addCommand("Goto next day", async () => {
    moveForwardToDate(true);
  });
  addCommand("Goto previous day", async () => {
    moveForwardToDate(false);
  });

  addCommand("Heading 1", async (uids) => {
    uids.map((uid) => updateBlock({ uid, heading: 1 }));
  });
  addCommand("Heading 2", async (uids) => {
    uids.map((uid) => updateBlock({ uid, heading: 2 }));
  });
  addCommand("Heading 3", async (uids) => {
    uids.map((uid) => updateBlock({ uid, heading: 3 }));
  });

  (await userCommands.UserDefinedCommandList()).forEach(({ key, ...item }) => {
    addCommand(key, (uids) => userCommands.runComand(uids, item));
  });
  addCommand("Refresh Inboxes", async () => {
    shutdown();
    initialize();
  });

  unloads.add(() => {
    _commands.forEach((c) =>
      window.roamAlphaAPI.ui.commandPalette.removeCommand({ label: c.display })
    );
    _commands.clear();
  });

  const unregisterSB = registerSmartBlocksCommand({
    text: "PULLREFERENCES",
    handler:
      (context: { targetUid: string }) =>
      (...args) =>
        pullReferences([context.targetUid], !!args.length),
  });

  unloads.add(unregisterSB);
};

export const shutdown = () => {
  unloads.forEach((u) => u());
  unloads.clear();
};

export const toggleFeature = (flag: boolean) => {
  active = flag;
  if (flag) initialize();
  else shutdown();
};
