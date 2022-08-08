import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageUidByBlockUid from "roamjs-components/queries/getPageUidByBlockUid";
import createPage from "roamjs-components/writes/createPage";
import {
  commandPaletteAdd,
  getBlocksReferringToThisPage,
  sleep,
  BlockNode,
  getUserInformation,
  sortObjectByKey,
  createSiblingBlock,
  moveBlock,
  navigateUiTo,
  baseUrl,
  getBlockInfoByUID,
  sortObjectsByOrder,
  batchCreateBlocks,
  deleteBlock,
  currentPageUID,
  displayMessage,
  moveForwardToDate,
} from "./commonFunctions";
import { getRoamDate, parseTextForDates } from "./dateProcessing";
import {
  htmlview,
  resolveBlockRefsInText,
  show as showFormatConverter,
} from "./formatConverter";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import {
  prompt,
  render as renderFormDialog,
} from "roamjs-components/components/FormDialog";
import { render as renderToast } from "roamjs-components/components/Toast";
import extractRef from "roamjs-components/util/extractRef";
import extractTag from "roamjs-components/util/extractTag";
import createBlock from "roamjs-components/writes/createBlock";
import getChildrenLengthByParentUid from "roamjs-components/queries/getChildrenLengthByPageUid";
import getOrderByBlockUid from "roamjs-components/queries/getOrderByBlockUid";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import { render as renderSimpleAlert } from "roamjs-components/components/SimpleAlert";
import { toggle as togglePrivacy } from "./privacyMode";
import { component as quickRefComponent } from "./quickRef";
import { show as showTutorials } from "./tutorials";
import { displayGraphStats } from "./stats";
import { jumpCommandByActiveElement } from "./jumpNav";
import iziToast, { IziToast } from "izitoast";
import { get } from "./settings";
import focusMainWindowBlock from "roamjs-components/util/focusMainWindowBlock";
import React from "react";
import { SidebarWindow } from "roamjs-components/types/native";

export let active = false;

let keystate = {
  shiftKey: false,
};
type Command = {
  display: string;
  cmd: () => void;
};
let _commands: Command[] = [];

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
    .map((a) => a[0]);

const runInboxCommand = async (children: BlockNode[]) => {
  let pageUID = null;
  let pageName = await userCommands.findBlockAmongstChildren(children, "page:");
  if (pageName == null) {
    //default to DNP
    pageUID = getPageUidByPageTitle(
      parseTextForDates("today", new Date())
        .replace("[[", "")
        .replace("]]", "")
        .trim()
    );
    pageName = "Today's DNP";
  } else {
    //get page UID, if doesnt exist, exist
    pageUID = getPageUidByPageTitle(pageName);
    if (pageUID == "") {
      displayMessage(
        `This page "${pageName}" doesnt exist, action not performed.`,
        5000
      );
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
    textUID = { uid: window.roamAlphaAPI.util.generateUID() };
    await window.roamAlphaAPI.createBlock({
      location: { "parent-uid": pageUID, order: 0 },
      block: { uid: textUID.uid, string: textName },
    });
    displayMessage(
      `This location "${pageName} > ${textName}" didnt exist, so a new block was created.`,
      5000
    );
  }

  //reset pageUID if there is a valid text block
  pageUID = textUID ? textUID.uid : pageUID;

  let locationTopBotom = await userCommands.findBlockAmongstChildren(
    children,
    "location:"
  );
  const locationTopBotomValue = locationTopBotom == "bottom" ? 10000 : 0;

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

  // await moveBlocks(pageUID, locationTopBotomValue, 0, blockRef);
  textName = textName == null ? "" : " > " + textName;
  displayMessage(`Block(s) moved to ${pageName}${textName}`, 3000);
};

export const userCommands = {
  findBlockAmongstChildren: async (
    childrenBlocks: BlockNode[],
    startsWith: string
  ) => {
    //loops through array and returns node where the text matches
    for (let c of childrenBlocks) {
      let resolvedBlockString = await resolveBlockRefsInText(c.string);
      let searchString = resolvedBlockString.toString().toLowerCase();
      let comparisonString = startsWith.toLowerCase();
      if (searchString.startsWith(comparisonString))
        return resolvedBlockString.substring(startsWith.length).trim();
    }
    return null;
  },
  UserDefinedCommandList: async () => {
    let validCommandTypeList = ["inbox"]; //in future add new types here
    let userCommandBlocks = await getBlocksReferringToThisPage("42workBench");
    let results = [];
    const userEmail = getUserInformation().email;
    for (let item of userCommandBlocks) {
      try {
        const inbox = item[0];
        var sType = inbox.string
          .replace("#42workBench", "")
          .replace("#[[42workBench]]", "")
          .trim()
          .toLowerCase();
        if (inbox.children && validCommandTypeList.includes(sType)) {
          let users = await userCommands.findBlockAmongstChildren(
            inbox.children,
            "users:"
          );
          if (users != null && users.trim() != "users:") {
            const userArray = users.split(" ");
            if (userArray.includes(userEmail) == false) continue;
          }
          //must contain a name
          let name = await userCommands.findBlockAmongstChildren(
            inbox.children,
            "name:"
          );
          if (name == null) continue;
          results.push({
            key: name,
            type: sType,
            details: item,
          });
        }
      } catch (e) {}
    }
    return sortObjectByKey(results);
  },
  runComand: async (cmdInfo: { type: string; details: BlockNode[] }) => {
    //this function is called by the workBench to peform an action
    switch (cmdInfo["type"]) {
      case "inbox":
        await runInboxCommand(cmdInfo.details[0].children);
        break;
    }
  },
  inboxUID: async (ibx: BlockNode) => {
    let pageUID = null;
    let pageName = await userCommands.findBlockAmongstChildren(
      ibx.children,
      "page:"
    );
    if (pageName == null) {
      //default to DNP
      pageUID = getPageUidByPageTitle(
        parseTextForDates("today", new Date())
          .replace("[[", "")
          .replace("]]", "")
          .trim()
      );
      pageName = "Today's DNP";
    } else {
      //get page UID, if doesnt exist, exist
      pageUID = await getPageUidByPageTitle(pageName);
      if (pageUID == "") {
        displayMessage(
          `This page "${pageName}" doesnt exist, action not performed.`,
          5000
        );
        return null;
      }
    }
    let textName = await userCommands.findBlockAmongstChildren(
      ibx.children,
      "text:"
    );
    //if text defined, get the UID of the tag.
    let textUID =
      textName == null
        ? null
        : getBlocksByParent(pageUID).find((e) =>
            e.string.toLowerCase().includes(textName.toLowerCase())
          );

    if (textName != null && textUID == null) {
      //text location doesnt exist,
      textUID = { uid: window.roamAlphaAPI.util.generateUID() };
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": pageUID, order: 0 },
        block: { uid: textUID.uid, string: textName },
      });
      displayMessage(
        `This location "${pageName} > ${textName}" didnt exist, so a new block was created.`,
        5000
      );
    }

    //reset pageUID if there is a valid text block
    pageUID = textUID ? textUID.uid : pageUID;

    return pageUID;
  },
};

export const commandAddRunFromAnywhere = async (
  textToDisplay: string,
  callback: (uids: string[]) => Promise<unknown>,
  restoreFocus?: true
) => {
  const callbackFunction = async () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    const uids = uid
      ? [uid]
      : Array.from(document.querySelectorAll(`.block-highlight-blue`)).map(
          (d) => extractRef(d.querySelector(".roam-block").id)
        );
    callback(uids).then(() => {
      if (restoreFocus && uids.length === 1) {
        focusMainWindowBlock(uids[0]);
      }
    });
  };
  const display = "(WB) " + textToDisplay;
  commandPaletteAdd(display, callbackFunction);
  _commands.push({
    display,
    cmd: callbackFunction,
  });
};

const moveBlocks = ({
  uids,
  base = 0,
  parentUid,
}: {
  uids: string[];
  base?: number;
  parentUid: string;
}) =>
  Promise.all(
    uids.map((uid, order) =>
      window.roamAlphaAPI.moveBlock({
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

const swapWithSideBar = async (index = 0) => {
  const panes = window.roamAlphaAPI.ui.rightSidebar.getWindows();
  if (panes.length == 0) {
    renderToast({
      content: "No open sidebar windows to swap with.",
      id: "workbench-warning",
    });
    return;
  }
  const mainPageUID = await currentPageUID();
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

export const initialize = async () => {
  active = true;

  // Commands are ordered in line with the docs at: https://roamjs.com/extensions/workbench/command_palette_plus
  commandAddRunFromAnywhere("Move Block(s) - to top (mbt)", async (uids) => {
    promptMoveBlocks({ uids, getBase: () => 0 });
  });
  commandAddRunFromAnywhere("Move Block(s) - to bottom (mbb)", async (uids) => {
    promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid });
  });
  commandAddRunFromAnywhere("Move Block(s) - DNP (mbdnp)", async (uids) => {
    const dateExpression = await prompt({
      title: "Roam42 WorkBench",
      question: "Move this block to the top of what date?",
      defaultAnswer: "Tomorrow",
    });
    if (!dateExpression) return;
    const parsedDate = extractTag(parseTextForDates(dateExpression).trim());
    if (!parsedDate) {
      displayMessage("Invalid date: " + dateExpression, 5000);
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
  commandAddRunFromAnywhere(
    "Move Block(s) - to top with block Ref (mbtr)",
    async (uids) => {
      await leaveBlockReferences({ uids });
      promptMoveBlocks({ uids, getBase: () => 0 });
    }
  );
  commandAddRunFromAnywhere(
    "Move Block(s) - to bottom with block ref (mbbr)",
    async (uids) => {
      await leaveBlockReferences({ uids });
      promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid });
    }
  );
  commandAddRunFromAnywhere(
    "Move Block(s) - to top & zoom (mbtz)",
    async (uids) => {
      promptMoveBlocks({ uids, getBase: () => 0 }).then(
        (success) =>
          success &&
          window.roamAlphaAPI.ui.mainWindow.openBlock({
            block: { uid: getParentUidByBlockUid(uids[0]) },
          })
      );
    }
  );
  commandAddRunFromAnywhere(
    "Move Block(s) - to bottom & zoom (mbbz)",
    async (uids) => {
      promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid }).then(
        (success) =>
          success &&
          window.roamAlphaAPI.ui.mainWindow.openBlock({
            block: { uid: getParentUidByBlockUid(uids[0]) },
          })
      );
    }
  );
  commandAddRunFromAnywhere(
    "Move Block(s) - to top & sidebar (mbts)",
    async (uids) => {
      promptMoveBlocks({ uids, getBase: () => 0 }).then(
        (success) => success && openBlockInSidebar(uids[0])
      );
    }
  );
  commandAddRunFromAnywhere(
    "Move Block(s) - to bottom & sidebar (mbbs)",
    async (uids) => {
      promptMoveBlocks({ uids, getBase: getChildrenLengthByParentUid }).then(
        (success) => success && openBlockInSidebar(uids[0])
      );
    }
  );

  commandAddRunFromAnywhere("Pull block (pbb)", async (uids) => {
    promptPullBlock(uids);
  });
  commandAddRunFromAnywhere(
    "Pull block and leave block ref (pbr)",
    async (uids) => {
      promptPullBlock(uids, true);
    }
  );

  commandAddRunFromAnywhere("Jump to Block in page (jbp)", async () => {
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

  commandAddRunFromAnywhere(
    "Sidebars - swap with main window (swap)",
    async () => {
      swapWithSideBar();
    }
  );
  commandAddRunFromAnywhere(
    "Sidebars - swap with main window & choose window (swc)",
    async () => {
      const panes = await window.roamAlphaAPI.ui.rightSidebar.getWindows();
      if (panes.length == 0) {
        displayMessage("No open side windows to swap with.", 5000);
        return;
      }
      let outputString = "";
      let iCounter = 1;
      for (const pane of panes) {
        let paneUID = getWindowUid(pane);
        if (paneUID != undefined) {
          let paneInfo = (await getBlockInfoByUID(paneUID, false, true))[0][0];
          if (paneInfo.title)
            outputString += (iCounter + ": " + paneInfo.title + "\n").substring(
              0,
              100
            );
          else
            outputString += (
              iCounter +
              ": " +
              paneInfo.parents[0].title +
              " > " +
              paneInfo.string +
              "\n"
            ).substring(0, 100);
          iCounter += 1;
        }
      }
      let paneToSwap = await prompt({
        title: "Roam42 WorkBench",
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
        else displayMessage("Not  a valid number for a sidebar pane", 5000);
      }
    }
  );
  commandAddRunFromAnywhere(
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
  commandAddRunFromAnywhere(
    "Sidebars - open both (sob)",
    async () => {
      await Promise.all([
        window.roamAlphaAPI.ui.rightSidebar.open(),
        window.roamAlphaAPI.ui.leftSidebar.open(),
      ]);
    },
    true
  );
  commandAddRunFromAnywhere(
    "Sidebars - close both (scb)",
    async () => {
      await Promise.all([
        window.roamAlphaAPI.ui.rightSidebar.close(),
        window.roamAlphaAPI.ui.leftSidebar.close(),
      ]);
    },
    true
  );
  commandAddRunFromAnywhere("Open Page (opp)", async () => {
    promptPathAndCallback({
      valid: true,
      supportPages: true,
      callback: (inputUid) =>
        window.roamAlphaAPI.ui.mainWindow.openBlock({
          block: { uid: inputUid },
        }),
    });
  });
  commandAddRunFromAnywhere("Open Page in Sidebar (ops)", async () => {
    promptPathAndCallback({
      valid: true,
      supportPages: true,
      callback: (inputUid) => openBlockInSidebar(inputUid),
    });
  });

  //DELETE PAGE
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
  commandAddRunFromAnywhere("Delete current page (dcp)", async () => {
    const uid = await currentPageUID();
    if ((await get("workBenchDcpConfirm")) == "off") {
      return window.roamAlphaAPI.ui.mainWindow
        .openDailyNotes()
        .then(() => window.roamAlphaAPI.deletePage({ page: { uid } }));
    } else {
      const currentPageTitle = getPageTitleByPageUid(uid);
      confirmDeletePage(uid, currentPageTitle);
    }
  });
  commandAddRunFromAnywhere(
    "Delete a page using Path Navigator (dap)",
    async () => {
      promptPathAndCallback({
        valid: true,
        supportPages: true,
        callback: (inputUid) => {
          const title =
            getPageTitleByPageUid(inputUid) || getPageTitleByBlockUid(inputUid);
          return confirmDeletePage(getPageUidByPageTitle(title), title);
        },
      });
    }
  );

  // COMMANDS BELOW THIS LINE HAVE NOT BEEN TESTED

  (await userCommands.UserDefinedCommandList()).forEach(({ key, ...item }) => {
    commandAddRunFromAnywhere(key, () => userCommands.runComand(item));
  });
  commandAddRunFromAnywhere("Daily Notes (dn)", async () => {
    navigateUiTo(getRoamDate(new Date()), keystate.shiftKey);
  });
  commandAddRunFromAnywhere("All Pages", async () => {
    document.location.href = baseUrl().href.replace("page", "") + "/search";
  });
  commandAddRunFromAnywhere("Graph Overview", async () => {
    document.location.href = baseUrl().href.replace("page", "") + "/graph";
  });

  const pullChildBlocksToThisBlock = async (
    uidParent: string,
    makeBlockRef = false
  ) => {
    const parentBlockInfo = await getBlockInfoByUID(uidParent, true);
    if (!parentBlockInfo[0][0].children)
      displayMessage("This block has no children to pull.", 5000);
    else {
      const childBlocks = await sortObjectsByOrder(
        parentBlockInfo[0][0].children
      );
      for (let i = childBlocks.length - 1; i >= 0; i--) {
        const activeBlockUID = ""; //triggeredState.activeElementId.slice(-9);
        if (makeBlockRef == true) {
          await createSiblingBlock(
            childBlocks[i].uid,
            `((${childBlocks[i].uid}))`
          );
          await sleep(50);
        }
        await moveBlock(activeBlockUID, 0, childBlocks[i].uid);
        await sleep(50);
      }
      // await restoreCurrentBlockSelection();
    }
  };
  commandAddRunFromAnywhere("Pull child blocks  (pcb)", async () => {
    // path.launch(async (uid) => {
    //   pullChildBlocksToThisBlock(uid);
    // }, excludeSelectedBlocks());
  });
  commandAddRunFromAnywhere(
    "Pull child block and leave block ref (pcr)",
    async () => {
      // path.launch(async (uid) => {
      //   pullChildBlocksToThisBlock(uid, true);
      // }, excludeSelectedBlocks());
    }
  );

  const sendBlockRefToThisBlock = async (
    destinationUID: string,
    uids: string[],
    locationTop = true
  ) => {
    const makeBlockRefs = uids.map((e) => `((${e}))`);
    if (locationTop == true) {
      //add to top
      await batchCreateBlocks(destinationUID, 0, makeBlockRefs);
    } else {
      await batchCreateBlocks(destinationUID, 100000, makeBlockRefs);
    }
    await sleep(150);
    try {
      // await restoreCurrentBlockSelection();
    } catch (e) {}
  };
  commandAddRunFromAnywhere("Send block ref - to top (sbrt)", async () => {
    // path.launch(
    //   async (uid) => {
    //     sendBlockRefToThisBlock(uid, true);
    //   },
    //   excludeSelectedBlocks(),
    //   null,
    //   null,
    //   true
    // );
  });
  commandAddRunFromAnywhere("Send block refs - to top (sbrt)", async () => {
    // path.launch(
    //   async (uid) => {
    //     sendBlockRefToThisBlock(uid, true);
    //   },
    //   excludeSelectedBlocks(),
    //   null,
    //   null,
    //   true
    // );
  });
  commandAddRunFromAnywhere("Send block ref - to bottom (sbrb)", async () => {
    // path.launch(
    //   async (uid) => {
    //     sendBlockRefToThisBlock(uid, false);
    //   },
    //   excludeSelectedBlocks(),
    //   null,
    //   null,
    //   true
    // );
  });
  commandAddRunFromAnywhere("Send block refs - to bottom (sbrb)", async () => {
    // path.launch(
    //   async (uid) => {
    //     sendBlockRefToThisBlock(uid, false);
    //   },
    //   excludeSelectedBlocks(),
    //   null,
    //   null,
    //   true
    // );
  });

  commandAddRunFromAnywhere("Roam42 Privacy Mode (alt-shift-p)", async () =>
    togglePrivacy()
  );
  commandAddRunFromAnywhere("Roam42 Converter (alt-m)", async () =>
    showFormatConverter()
  );
  commandAddRunFromAnywhere("Roam42 Web View (alt-shift-m)", async () =>
    htmlview()
  );
  commandAddRunFromAnywhere("Roam42 Help", async () =>
    quickRefComponent.toggleQuickReference()
  );
  commandAddRunFromAnywhere("Roam42 Tutorials", async () => showTutorials());
  commandAddRunFromAnywhere("Roam42 Graph DB Stats", displayGraphStats);
  commandAddRunFromAnywhere(
    "Goto next day - Roam42 (ctrl-shift-.)",
    async () => {
      moveForwardToDate(true);
    }
  );
  commandAddRunFromAnywhere(
    "Goto previous day - Roam42 (ctrl-shift-.)",
    async () => {
      moveForwardToDate(false);
    }
  );

  commandAddRunFromAnywhere("Heading 1 (Alt+Shift+1)", async () => {
    jumpCommandByActiveElement("ctrl+j 5");
  });
  commandAddRunFromAnywhere("Heading 2 (Alt+Shift+2)", async () => {
    jumpCommandByActiveElement("ctrl+j 6");
  });
  commandAddRunFromAnywhere("Heading 3 (Alt+Shift+3)", async () => {
    jumpCommandByActiveElement("ctrl+j 7");
  });

  commandAddRunFromAnywhere(
    "Copy Block Reference - Jump Nav (Meta-j r)",
    async () => {
      jumpCommandByActiveElement("ctrl+j r");
    }
  );
  commandAddRunFromAnywhere(
    "Copy Block Reference as alias - Jump Nav (Meta-j s)",
    async () => {
      jumpCommandByActiveElement("ctrl+j s");
    }
  );

  //CREATE  PAGE
  const createThisPage = (
    instance: IziToast,
    toast: HTMLDivElement,
    textInput: string,
    shiftKey: boolean
  ) => {
    if (textInput.length > 0) {
      setTimeout(async () => {
        const pageUID = await getPageUidByPageTitle(textInput);
        if (pageUID != "") {
          displayMessage(`Page <b>${textInput}</b> already exists.`, 5000);
          document
            .querySelector<HTMLInputElement>("#roam42-wB-CreatePage-input")
            .focus();
        } else {
          instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          await createPage({ title: textInput });
          await sleep(50);
          navigateUiTo(textInput, shiftKey);
        }
      }, 10);
    }
  };
  commandAddRunFromAnywhere("Create a page (cap)", async () => {
    let textInput = "";
    iziToast.info({
      timeout: 120000,
      overlay: true,
      displayMode: 1,
      id: "inputs",
      zindex: 999,
      title: "Create Page",
      position: "center",
      drag: false,
      inputs: [
        [
          '<input type="text" id="roam42-wB-CreatePage-input">',
          "keyup",
          (instance, toast, input, e) => {
            textInput = input.value;
            document.querySelector<HTMLDivElement>(
              "#roam42-wB-createPage-CREATE"
            ).style.visibility = input.value.length > 0 ? "visible" : "hidden";
            const ke = e as KeyboardEvent;
            if (ke.key == "Enter")
              createThisPage(instance, toast, textInput, ke.shiftKey);
          },
          true,
        ],
      ],
      buttons: [
        [
          '<button id="roam42-wB-createPage-CREATE" style="visibility:hidden"><b>CREATE</b></button>',
          (instance, toast) => {
            createThisPage(instance, toast, textInput, false);
          },
          false,
        ],
        [
          "<button>CANCEL</button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          },
          false,
        ],
      ],
    });
  });

  // from https://stackoverflow.com/a/44438404
  // replaces all "new line" characters contained in `someString` with the given `replacementString`
  const replaceNewLineChars = (someString: string, replacementString = ``) => {
    // defaults to just removing
    const LF = `\u{000a}`; // Line Feed (\n)
    const VT = `\u{000b}`; // Vertical Tab
    const FF = `\u{000c}`; // Form Feed
    const CR = `\u{000d}`; // Carriage Return (\r)
    const CRLF = `${CR}${LF}`; // (\r\n)
    const NEL = `\u{0085}`; // Next Line
    const LS = `\u{2028}`; // Line Separator
    const PS = `\u{2029}`; // Paragraph Separator
    const ZW = `\u{200B}`; // Zero  white space https://www.fileformat.info/info/unicode/char/200b/index.htm
    const lineTerminators = [LF, VT, FF, CR, CRLF, NEL, LS, PS, ZW]; // all Unicode `lineTerminators`
    let finalString = someString.normalize(`NFD`); // better safe than sorry? Or is it?
    for (let lineTerminator of lineTerminators) {
      if (finalString.includes(lineTerminator)) {
        // check if the string contains the current `lineTerminator`
        let regex = new RegExp(lineTerminator.normalize(`NFD`), `gu`); // create the `regex` for the current `lineTerminator`
        finalString = finalString.replace(regex, replacementString); // perform the replacement
      }
    }
    return finalString.normalize(`NFC`); // return the `finalString` (without any Unicode `lineTerminators`)
  };

  commandAddRunFromAnywhere(
    "Remove blank blocks at current level (rbbcl) - not recursive",
    async (uids) => {
      for (let i = uids.length - 1; i >= 0; i--) {
        const blockToAnalyze = uids[i];
        const blockInfo = await getBlockInfoByUID(blockToAnalyze, true);
        if (!blockInfo[0][0].children) {
          //don't process if it has child blocks
          if (
            blockInfo[0][0].string.trim().length == 0 ||
            blockInfo[0][0].string == ""
          )
            //this is a blank, should delete
            await deleteBlock(blockToAnalyze);
          else if (blockInfo[0][0].string.trim().length == 1) {
            //test if this is a line break
            const stringText = replaceNewLineChars(
              blockInfo[0][0].string.trim()
            );
            if (stringText.length == 0) await deleteBlock(blockToAnalyze);
          }
        }
      }
    }
  );

  commandAddRunFromAnywhere("Create Vanity Page UID (cvpu)", async () => {
    iziToast.info({
      timeout: 120000,
      overlay: true,
      displayMode: 1,
      id: "inputs",
      zindex: 999,
      title: "Vanity Page UID",
      position: "center",
      drag: false,
      inputs: [
        [
          '<input type="text" placeholder="Page Name" id="roam42-wB-CreateVanityPage-PageName">',
          "keyup",
          (instance, toast, input, e) => {},
          true,
        ],
        [
          '<input type="text" placeholder="Vanity UID" id="roam42-wB-CreateVanityPage-UID">',
          "keyup",
          (instance, toast, input, e) => {},
          false,
        ],
      ],
      buttons: [
        [
          '<button id="roam42-wB-CreateVanityPage-CREATE"><b>CREATE</b></button>',
          async (instance, toast) => {
            //validate page name
            const pageName = document
              .querySelector<HTMLInputElement>(
                "#roam42-wB-CreateVanityPage-PageName"
              )
              .value.trim();
            if (pageName.length == 0) {
              displayMessage("Page name is not valid.", 3000);
              document
                .querySelector<HTMLInputElement>(
                  "#roam42-wB-CreateVanityPage-PageName"
                )
                .focus();
              return;
            } else {
              //test if page is in use
              if ((await getPageUidByPageTitle(pageName)) != "") {
                displayMessage(
                  "This page name is already in use, try again.",
                  3000
                );
                document
                  .querySelector<HTMLInputElement>(
                    "#roam42-wB-CreateVanityPage-PageName"
                  )
                  .focus();
                return;
              }
            }
            //validate UID
            const vanityUID = document
              .querySelector<HTMLInputElement>(
                "#roam42-wB-CreateVanityPage-UID"
              )
              .value.trim();
            const regex = new RegExp("^[a-zA-Z0-9]+$");
            if (vanityUID.length != 9 || !regex.test(vanityUID)) {
              displayMessage(
                "UID is not valid. It must be exactly 9 characters and it contain only alpha-numeric characters. It is also case-sensitive.",
                3000
              );
              document
                .querySelector<HTMLInputElement>(
                  "#roam42-wB-CreateVanityPage-UID"
                )
                .focus();
              return;
            } else {
              //test if UID is in use
              if ((await getBlockInfoByUID(vanityUID)) != null) {
                displayMessage("This UID is already in use, try again.", 3000);
                document
                  .querySelector<HTMLInputElement>(
                    "#roam42-wB-CreateVanityPage-UID"
                  )
                  .focus();
                return;
              }
            }
            const success = await window.roamAlphaAPI.createPage({
              page: { title: pageName, uid: vanityUID },
            });
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
            await sleep(50);
            navigateUiTo(pageName);
          },
          false,
        ],
        [
          "<button>CANCEL</button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          },
          false,
        ],
      ],
    });
  });

  commandAddRunFromAnywhere("Create vanity block UID (cvbu)", async () => {
    iziToast.info({
      timeout: 120000,
      overlay: true,
      displayMode: 1,
      id: "inputs",
      zindex: 999,
      title: "Vanity Block UID",
      position: "center",
      drag: false,
      inputs: [
        [
          '<input type="text" placeholder="Vanity UID" id="roam42-wB-CreateVanityBlock-UID">',
          "keyup",
          (instance, toast, input, e) => {},
          true,
        ],
      ],
      buttons: [
        [
          '<button id="roam42-wB-CreateVanityBlock-CREATE"><b>CREATE</b></button>',
          async (instance, toast) => {
            //validate UID
            const vanityUID = document
              .querySelector<HTMLInputElement>(
                "#roam42-wB-CreateVanityBlock-UID"
              )
              .value.trim();
            const regex = new RegExp("^[a-zA-Z0-9]+$");
            if (vanityUID.length != 9 || !regex.test(vanityUID)) {
              displayMessage(
                "UID is not valid. It must be exactly 9 characters and it contain only alpha-numeric characters. It is also case-sensitive.",
                3000
              );
              document
                .querySelector<HTMLInputElement>(
                  "#roam42-wB-CreateVanityBlock-UID"
                )
                .focus();
              return;
            } else {
              //test if UID is in use
              if ((await getBlockInfoByUID(vanityUID)) != null) {
                displayMessage("This UID is already in use, try again.", 3000);
                document
                  .querySelector<HTMLInputElement>(
                    "#roam42-wB-CreateVanityBlock-UID"
                  )
                  .focus();
                return;
              }
            }
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
            await window.roamAlphaAPI.createBlock({
              location: {
                "parent-uid": "", // triggeredState.activeElementId.slice(-9),
                order: 0,
              },
              block: {
                string: `This is a new block with the UID: ${vanityUID}`,
                uid: vanityUID,
              },
            });
            await sleep(50);
          },
          false,
        ],
        [
          "<button>CANCEL</button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          },
          false,
        ],
      ],
    });
  });

  commandAddRunFromAnywhere("workBench - Generate command list", async () => {
    iziToast.question({
      timeout: 20000,
      close: false,
      overlay: true,
      displayMode: 1,
      id: "question",
      color: "green",
      zindex: 999,
      position: "center",
      message: `Create a page with a list of workBench commands. Proceed?`,
      buttons: [
        [
          "<button><b>YES</b></button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
            setTimeout(async () => {
              const userDefinedCommands =
                await userCommands.UserDefinedCommandList();

              const date = new Date();
              const newPageTitle = `#[[42workBench]] Command List as of ${date.getFullYear()}-${(
                date.getMonth() + 1
              )
                .toString()
                .padStart(2, "0")}-${date
                .getDate()
                .toString()
                .padStart(2, "0")} ${date
                .getHours()
                .toString()
                .padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")} `;
              const newPageUID = await createPage({ title: newPageTitle });

              const userCommandsParentUID = await createBlock({
                parentUid: newPageUID,
                order: 0,
                node: { text: "**User Defined Commands**" },
              });
              const userCommandsArray = userDefinedCommands.map((c) => c.key);
              await batchCreateBlocks(
                userCommandsParentUID,
                0,
                userCommandsArray
              );

              const builtinCommandsParentUID = await createBlock({
                parentUid: newPageUID,
                order: 1,
                node: { text: "**Built-in Commands**" },
              });
              const builtinCommandsArray = _commands.map((c) => c.display);
              await batchCreateBlocks(
                builtinCommandsParentUID,
                0,
                builtinCommandsArray
              );

              await navigateUiTo(newPageTitle);
            }, 10);
          },
          true,
        ],
        [
          "<button>NO</button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          },
          false,
        ],
      ],
    });
  });
};

export const toggleFeature = (flag: boolean) => {
  if (flag) initialize();
  else {
    _commands.forEach((c) =>
      window.roamAlphaAPI.ui.commandPalette.removeCommand({ label: c.display })
    );
    active = false;
  }
};
