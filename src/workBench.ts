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
import { get } from "./settings";
import focusMainWindowBlock from "roamjs-components/util/focusMainWindowBlock";
import React from "react";
import { SidebarWindow } from "roamjs-components/types/native";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import updateBlock from "roamjs-components/writes/updateBlock";

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
  commandAddRunFromAnywhere("Send block ref - to top (sbrt)", async (uids) => {
    promptMoveRefs({ uids, getBase: () => 0 });
  });
  commandAddRunFromAnywhere(
    "Send block refs - to bottom (sbrb)",
    async (uids) => {
      promptMoveRefs({ uids, getBase: getChildrenLengthByParentUid });
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
  commandAddRunFromAnywhere("Pull child blocks  (pcb)", async (uids) => {
    promptPullChildBlocks(uids);
  });
  commandAddRunFromAnywhere(
    "Pull child block and leave block ref (pcr)",
    async (uids) => {
      promptPullChildBlocks(uids, true);
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
  commandAddRunFromAnywhere("Copy Block Reference", async (uids) => {
    window.navigator.clipboard.writeText(`((${uids[0] || ""}))`);
  });
  commandAddRunFromAnywhere("Copy Block Reference as alias", async (uids) => {
    window.navigator.clipboard.writeText(`[*](((${uids[0] || ""})))`);
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

  commandAddRunFromAnywhere("Create a page (cap)", async () => {
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

  commandAddRunFromAnywhere("Daily Notes (dn)", async () => {
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
  commandAddRunFromAnywhere("All Pages", async () => {
    document.location.hash = `#/${graphTypes[window.roamAlphaAPI.graph.type]}/${
      window.roamAlphaAPI.graph.name
    }/search`;
  });
  commandAddRunFromAnywhere("Graph Overview", async () => {
    document.location.hash = `#/${graphTypes[window.roamAlphaAPI.graph.type]}/${
      window.roamAlphaAPI.graph.name
    }/graph`;
  });
  commandAddRunFromAnywhere("Goto next day", async () => {
    moveForwardToDate(true);
  });
  commandAddRunFromAnywhere("Goto previous day", async () => {
    moveForwardToDate(false);
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

  commandAddRunFromAnywhere("Heading 1", async (uids) => {
    uids.map((uid) => updateBlock({ uid, heading: 1 }));
  });
  commandAddRunFromAnywhere("Heading 2", async (uids) => {
    uids.map((uid) => updateBlock({ uid, heading: 2 }));
  });
  commandAddRunFromAnywhere("Heading 3", async (uids) => {
    uids.map((uid) => updateBlock({ uid, heading: 3 }));
  });

  (await userCommands.UserDefinedCommandList()).forEach(({ key, ...item }) => {
    commandAddRunFromAnywhere(key, () => userCommands.runComand(item));
  });
  commandAddRunFromAnywhere("Refresh Inboxes", async () => {
    shutdown();
    initialize();
  });
};

export const shutdown = () => {
  _commands.forEach((c) =>
    window.roamAlphaAPI.ui.commandPalette.removeCommand({ label: c.display })
  );
  active = false;
};

export const toggleFeature = (flag: boolean) => {
  if (flag) initialize();
  else shutdown();
};
