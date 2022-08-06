import Cookies from "js-cookie";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import {
  commandPaletteAdd,
  getBlocksReferringToThisPage,
  simulateMouseClick,
  sleep,
  BlockNode,
  getUserInformation,
  sortObjectByKey,
  createSiblingBlock,
  createBlock,
  moveBlock,
  navigateUiTo,
  baseUrl,
  rightSidebarCloseWindow,
  swapWithSideBar,
  getBlockInfoByUID,
  setSideBarState,
  createPage,
  sortObjectsByOrder,
  batchCreateBlocks,
  deleteBlock,
  currentPageUID,
} from "./commonFunctions";
import { getRoamDate, parseTextForDates } from "./dateProcessing";
import {
  htmlview,
  resolveBlockRefsInText,
  show as showFormatConverter,
} from "./formatConverter";
import { displayMessage } from "./help";
import { pressEsc } from "./r42kb_lib";
import createOverlayRender from "roamjs-components/util/createOverlayRender";
import FormDialog, { prompt } from "roamjs-components/components/FormDialog";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import { render as renderSimpleAlert } from "roamjs-components/components/SimpleAlert";
import { toggle as togglePrivacy } from "./privacyMode";
import { component as quickRefComponent } from "./quickRef";
import { show as showTutorials } from "./tutorials";
import { displayGraphStats } from "./stats";
import { jumpCommandByActiveElement } from "./jumpNav";
import iziToast, { IziToast } from "izitoast";
import { get } from "./settings";

export let active = false;
export const triggeredState: {
  activeElementId: null | string;
  selectedNodes: null | Element[];
  activeElementSelectionStart: null | number;
  activeElementSelectionEnd: null | number;
} = {
  activeElementId: null,
  selectedNodes: null,
  activeElementSelectionStart: null,
  activeElementSelectionEnd: null,
}; //tracks state of when the CP was triggered

export let UI_Visible = false;
export let keystate = {
  shiftKey: false,
}; //tracks key state of CP input control
type Context = "*" | "+" | "-";
type Command = {
  display: string;
  searchText: string;
  img: string;
  cmd: () => void;
  context: Context;
};

type PathCallback = (
  lastUid: string,
  lastString: string,
  uidPath?: string,
  path?: string
) => void;
export let _commands: Command[] = []; //commands visible in CP

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

const moveBlocks = async (
  destinationUID: string,
  iLocation: number,
  zoom = 0,
  makeBlockRef: boolean | string = false
) => {
  //zoom  = 0  do nothing, 1 move blocks opened in sidebar, 2, zoomed in main window
  let zoomUID = "";
  if (triggeredState.selectedNodes != null) {
    if (iLocation == 0) {
      //adding to top
      for (let i = triggeredState.selectedNodes.length - 1; i >= 0; i--) {
        const blockToMove = triggeredState.selectedNodes[i]
          .querySelector(".rm-block-text")
          .id.slice(-9);
        if (makeBlockRef == true) {
          await createSiblingBlock(blockToMove, `((${blockToMove}))`);
          await sleep(50);
        }
        if (makeBlockRef === "reverse") {
          createBlock(destinationUID, iLocation, `((${blockToMove}))`);
        } else {
          moveBlock(destinationUID, iLocation, blockToMove);
        }
        if (!zoomUID) zoomUID = destinationUID; //go to first block in move
      }
    } else {
      for (let i = 0; i <= triggeredState.selectedNodes.length - 1; i++) {
        const blockToMove = triggeredState.selectedNodes[i]
          .querySelector(".rm-block-text")
          .id.slice(-9);
        if (makeBlockRef == true) {
          await createSiblingBlock(blockToMove, `((${blockToMove}))`);
          await sleep(50);
        }
        if (makeBlockRef === "reverse") {
          createBlock(destinationUID, iLocation, `((${blockToMove}))`);
        } else {
          moveBlock(destinationUID, iLocation, blockToMove);
        }
        if (!zoomUID) zoomUID = destinationUID; //go to first block in move
      }
    }
  } else if (triggeredState.activeElementId != null) {
    if (destinationUID != triggeredState.activeElementId.slice(-9)) {
      //single block move
      let blockToMove = triggeredState.activeElementId.slice(-9);
      if (makeBlockRef == true) {
        await createSiblingBlock(blockToMove, `((${blockToMove}))`);
        await sleep(50);
      }
      if (makeBlockRef === "reverse") {
        createBlock(destinationUID, iLocation, `((${blockToMove}))`);
      } else {
        moveBlock(destinationUID, iLocation, blockToMove);
      }
      zoomUID = blockToMove;
    }
  }
  if (zoom > 0) await sleep(150);
  if (zoom == 1 && !!zoomUID)
    //open in  side bar
    navigateUiTo(zoomUID, true, "block");
  else if (zoom == 2 && !!zoomUID)
    //jump to in main page
    navigateUiTo(zoomUID, false);
};

const MoveBlockDNP = async () => {
  let dateExpression = await prompt({
    title: "Roam42 WorkBench",
    question: "Move this block to the top of what date?",
    defaultAnswer: "Tomorrow",
  });
  if (!dateExpression) return;
  let parsedDate = parseTextForDates(dateExpression);
  if (parsedDate == dateExpression) {
    displayMessage("Invalid date: " + dateExpression, 5000);
    return;
  } else parsedDate = parsedDate.substring(2, parsedDate.length - 3);
  let makeBlockRef = await confirm("Leave Block Reference?");
  //move the block, and leave behind a block ref
  let destinationPage = await getPageUidByPageTitle(parsedDate);
  if (destinationPage == "") {
    //DNP does not exist, create it before going further
    await createPage(parsedDate);
    await sleep(150);
    destinationPage = await getPageUidByPageTitle(parsedDate);
  }
  setTimeout(() => {
    path.launch(
      async (uid) => {
        moveBlocks(uid, 0, 0, makeBlockRef);
      },
      excludeSelectedBlocks(),
      destinationPage,
      parsedDate.toString(),
      true
    );
  }, 200);
};

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

  await moveBlocks(pageUID, locationTopBotomValue, 0, blockRef);
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

export const restoreCurrentBlockSelection = async () => {
  simulateMouseClick(document.body);
  await sleep(100);
  simulateMouseClick(document.getElementById(triggeredState.activeElementId));
  await sleep(150);
  const ta = document.activeElement as HTMLTextAreaElement;
  ta.selectionStart = triggeredState.activeElementSelectionStart;
  ta.selectionEnd = triggeredState.activeElementSelectionEnd;
};
const excludeSelectedBlocks = () => {
  let nodes = [];
  if (triggeredState.activeElementId != null)
    nodes = [triggeredState.activeElementId.slice(-9)];
  else if (triggeredState.selectedNodes != null)
    for (const node of triggeredState.selectedNodes)
      nodes.push(node.querySelector(".rm-block-text").id.slice(-9));
  return nodes;
};

export const commandAddRunFromAnywhere = async (
  textToDisplay: string,
  callback: () => void
) => {
  const callbackFunction = async () => {
    const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (uid) {
      const el = document.querySelector(`div[id*="${uid}"]`);
      triggeredState.activeElementId = el?.id;
    } else {
      triggeredState.activeElementId = null;
    }
    triggeredState.selectedNodes = Array.from(
      document.querySelectorAll(`.block-highlight-blue`)
    );
    if (triggeredState.activeElementId) {
      await pressEsc(100);
      await restoreCurrentBlockSelection();
    }
    callback();
  };
  commandPaletteAdd("(WB) " + textToDisplay, callbackFunction);
  _commands.push({
    display: textToDisplay,
    searchText: textToDisplay.toLowerCase(),
    img: "https://roamjs.com/roam42/img/wb/command.png",
    cmd: callbackFunction,
    context: "*",
  });
};
// using the command palette has made these methods useless
export const commandAddRunFromBlock = commandAddRunFromAnywhere;
export const commandAddRunFromMultiBlockSelection = commandAddRunFromAnywhere;

export const initialize = async () => {
  active = true;
  (await userCommands.UserDefinedCommandList()).forEach(({ key, ...item }) => {
    commandAddRunFromAnywhere(key, () => userCommands.runComand(item));
  });
  commandAddRunFromAnywhere("Daily Notes (dn)", () => {
    navigateUiTo(getRoamDate(new Date()), keystate.shiftKey);
  });
  commandAddRunFromAnywhere("All Pages", () => {
    document.location.href = baseUrl().href.replace("page", "") + "/search";
  });
  commandAddRunFromAnywhere("Graph Overview", () => {
    document.location.href = baseUrl().href.replace("page", "") + "/graph";
  });
  commandAddRunFromAnywhere(
    "Right Sidebar - close window panes (rscwp)",
    async () => {
      await pressEsc(100);
      await pressEsc(100);
      await rightSidebarCloseWindow(0, false);
      try {
        await restoreCurrentBlockSelection();
      } catch (e) {}
    }
  );
  commandAddRunFromAnywhere(
    "Sidebars - swap with main window (swap)",
    async () => {
      await swapWithSideBar();
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
        let paneUID =
          pane["type"] === "mentions"
            ? pane["mentions-uid"]
            : pane["type"] == "outline"
            ? pane["page-uid"]
            : pane["block-uid"];
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
          await swapWithSideBar(paneToSwapVal);
        else displayMessage("Not  a valid number for a sidebar pane", 5000);
      }
    }
  );
  commandAddRunFromAnywhere("Sidebars - open both (sob)", async () => {
    await setSideBarState(3);
    await setSideBarState(1);
    if (triggeredState.activeElementId != null) {
      await sleep(500);
      await restoreCurrentBlockSelection();
    }
  });
  commandAddRunFromAnywhere("Sidebars - close both (scb)", async () => {
    await setSideBarState(2);
    await setSideBarState(4);
    if (triggeredState.activeElementId != null) {
      await sleep(500);
      await restoreCurrentBlockSelection();
    }
  });
  commandAddRunFromBlock("Move Block - to bottom (mbb)", async () => {
    path.launch(
      async (uid) => {
        moveBlocks(uid, 10000);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  commandAddRunFromMultiBlockSelection(
    "Move Blocks - to bottom (mbb)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 10000);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock("Move Block - to top (mbt)", async () => {
    path.launch(
      async (uid) => {
        moveBlocks(uid, 0);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  commandAddRunFromMultiBlockSelection(
    "Move Blocks - to top (mbt)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 0);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock(
    "Move Block - to bottom with block ref (mbbr)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 10000, 0, true);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromMultiBlockSelection(
    "Move Blocks - to bottom with block ref (mbbr)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 10000, 0, true);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock(
    "Move Block - to top with block Ref (mbtr)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 0, 0, true);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromMultiBlockSelection(
    "Move Blocks - to top with block refs (mbtr)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 0, 0, true);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock("Move Block - to bottom & zoom (mbbz)", async () => {
    path.launch(
      async (uid) => {
        moveBlocks(uid, 10000, 2);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  commandAddRunFromMultiBlockSelection(
    "Move Blocks - to bottom & zoom (mbbz)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 10000, 2);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock("Move Block - to top & zoom (mbtz)", async () => {
    path.launch(
      async (uid) => {
        moveBlocks(uid, 0, 2);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  commandAddRunFromMultiBlockSelection(
    "Move Blocks - to top & zoom (mbtz)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 0, 2);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock(
    "Move Block - to bottom & sidebar (mbbs)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 10000, 1);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromMultiBlockSelection(
    "Move Blocks -to bottom & sidebar (mbbs)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 10000, 1);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock("Move Block - to top & sidebar (mbts)", async () => {
    path.launch(
      async (uid) => {
        moveBlocks(uid, 0, 1);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  commandAddRunFromMultiBlockSelection(
    "Move Blocks -to top & sidebar (mbts)",
    async () => {
      path.launch(
        async (uid) => {
          moveBlocks(uid, 0, 1);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromAnywhere("Open Page (opp)", async () => {
    path.launch(
      async (uid) => {
        navigateUiTo(uid);
      },
      [],
      null,
      null,
      true
    );
  });
  commandAddRunFromAnywhere("Open Page in Sidebar (ops)", async () => {
    path.launch(
      async (uid) => {
        navigateUiTo(uid, true);
      },
      [],
      null,
      null,
      true
    );
  });

  commandAddRunFromBlock("Move Block - DNP (mbdnp)", async () => {
    MoveBlockDNP();
  });
  commandAddRunFromMultiBlockSelection(
    "Move Blocks - DNP (mbdnp)",
    async () => {
      MoveBlockDNP();
    }
  );

  const pullBlockToThisBlock = async (
    uidToMove: string,
    makeBlockRef = false
  ) => {
    const activeBlockUID = triggeredState.activeElementId.slice(-9);
    if (makeBlockRef == true) {
      await createSiblingBlock(uidToMove, `((${uidToMove}))`);
      await sleep(50);
    }
    await moveBlock(activeBlockUID, 0, uidToMove);
    await sleep(250);
    await restoreCurrentBlockSelection();
  };
  commandAddRunFromBlock("Pull block (pbb)", async () => {
    path.launch(async (uid) => {
      pullBlockToThisBlock(uid);
    }, excludeSelectedBlocks());
  });
  commandAddRunFromBlock("Pull block and leave block ref (pbr)", async () => {
    path.launch(async (uid) => {
      pullBlockToThisBlock(uid, true);
    }, excludeSelectedBlocks());
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
        const activeBlockUID = triggeredState.activeElementId.slice(-9);
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
      await restoreCurrentBlockSelection();
    }
  };
  commandAddRunFromBlock("Pull child blocks  (pcb)", async () => {
    path.launch(async (uid) => {
      pullChildBlocksToThisBlock(uid);
    }, excludeSelectedBlocks());
  });
  commandAddRunFromBlock(
    "Pull child block and leave block ref (pcr)",
    async () => {
      path.launch(async (uid) => {
        pullChildBlocksToThisBlock(uid, true);
      }, excludeSelectedBlocks());
    }
  );

  commandAddRunFromAnywhere("Jump to Block in page (jbp)", async () => {
    path.launch(
      async (uid) => {
        if (uid != path.trailUID[0]) {
          navigateUiTo(path.trailUID[0], false);
          await sleep(500);
        }
        document.querySelector(`[id*="${uid}"]`).scrollIntoView();
        await sleep(200);
        simulateMouseClick(document.body);
        await sleep(50);
        simulateMouseClick(document.querySelector(`[id*="${uid}"]`));
        await sleep(250);
        const ta = document.activeElement as HTMLTextAreaElement;
        ta.selectionStart = ta.value.length;
        ta.selectionEnd = ta.value.length;
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });

  const sendBlockRefToThisBlock = async (
    destinationUID: string,
    locationTop = true
  ) => {
    let blockRefUIDS = [];
    if (triggeredState.selectedNodes != null)
      for (let i = 0; i <= triggeredState.selectedNodes.length - 1; i++)
        blockRefUIDS.push(
          triggeredState.selectedNodes[i]
            .querySelector(".rm-block-text")
            .id.slice(-9)
        );
    else if (triggeredState.activeElementId != null)
      blockRefUIDS.push(triggeredState.activeElementId.slice(-9));
    const makeBlockRefs = blockRefUIDS.map((e) => `((${e}))`);
    if (locationTop == true) {
      //add to top
      await batchCreateBlocks(destinationUID, 0, makeBlockRefs);
    } else {
      await batchCreateBlocks(destinationUID, 100000, makeBlockRefs);
    }
    await sleep(150);
    try {
      await restoreCurrentBlockSelection();
    } catch (e) {}
  };
  commandAddRunFromBlock("Send block ref - to top (sbrt)", async () => {
    path.launch(
      async (uid) => {
        sendBlockRefToThisBlock(uid, true);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  commandAddRunFromMultiBlockSelection(
    "Send block refs - to top (sbrt)",
    async () => {
      path.launch(
        async (uid) => {
          sendBlockRefToThisBlock(uid, true);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );
  commandAddRunFromBlock("Send block ref - to bottom (sbrb)", async () => {
    path.launch(
      async (uid) => {
        sendBlockRefToThisBlock(uid, false);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  commandAddRunFromMultiBlockSelection(
    "Send block refs - to bottom (sbrb)",
    async () => {
      path.launch(
        async (uid) => {
          sendBlockRefToThisBlock(uid, false);
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );

  commandAddRunFromAnywhere("Roam42 Privacy Mode (alt-shift-p)", togglePrivacy);
  commandAddRunFromAnywhere("Roam42 Converter (alt-m)", showFormatConverter);
  commandAddRunFromAnywhere("Roam42 Web View (alt-shift-m)", htmlview);
  commandAddRunFromAnywhere(
    "Roam42 Help",
    quickRefComponent.toggleQuickReference
  );
  commandAddRunFromAnywhere("Roam42 Tutorials", showTutorials);
  commandAddRunFromAnywhere("Roam42 Graph DB Stats", displayGraphStats);

  commandAddRunFromBlock("Heading 1 (Alt+Shift+1)", () => {
    jumpCommandByActiveElement("ctrl+j 5");
  });
  commandAddRunFromBlock("Heading 2 (Alt+Shift+2)", () => {
    jumpCommandByActiveElement("ctrl+j 6");
  });
  commandAddRunFromBlock("Heading 3 (Alt+Shift+3)", () => {
    jumpCommandByActiveElement("ctrl+j 7");
  });

  commandAddRunFromBlock("Copy Block Reference - Jump Nav (Meta-j r)", () => {
    jumpCommandByActiveElement("ctrl+j r");
  });
  commandAddRunFromBlock(
    "Copy Block Reference as alias - Jump Nav (Meta-j s)",
    () => {
      jumpCommandByActiveElement("ctrl+j s");
    }
  );

  const navToDnp = () => {
    const d = new Date();
    window.roamAlphaAPI.ui.mainWindow.openPage({
      page: { uid: `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}` },
    });
  };

  //DELETE PAGE
  const confirmDeletePage = (pageUID: string, pageTitle: string) => {
    iziToast.question({
      timeout: 20000,
      close: false,
      overlay: true,
      displayMode: 1,
      id: "question",
      color: "red",
      zindex: 999,
      position: "center",
      message: `Are you sure you want to <span style='color:red'><b>DELETE</b></span> the page? <br><br> <b>${pageTitle}</b> <br><br>`,
      buttons: [
        [
          "<button>NO</button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          },
          true,
        ],
        [
          "<button><b>YES</b></button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
            navigateUiTo(getRoamDate(new Date()));
            setTimeout(async () => {
              await deleteBlock(pageUID);
              navToDnp();
            }, 500);
          },
          false,
        ],
      ],
    });
  };

  const deleteCurrentPage = async () => {
    const uid = await currentPageUID();
    const currentPageTitle = (await getBlockInfoByUID(uid))[0][0].title;
    if ((await get("workBenchDcpConfirm")) == "off") {
      await deleteBlock(uid);
      navToDnp();
    } else {
      confirmDeletePage(uid, currentPageTitle);
    }
  };

  const deleteSomePage = async () => {
    await path.launch(
      async (uid) => {
        const blockInfo = await getBlockInfoByUID(uid, false, true);
        let currentPageTitle = blockInfo[0][0].title;
        if (currentPageTitle == undefined) {
          currentPageTitle = blockInfo[0][0].parents[0].title;
          uid = blockInfo[0][0].parents[0].uid;
        }
        confirmDeletePage(uid, currentPageTitle);
      },
      [],
      null,
      null,
      true
    );
  };
  commandAddRunFromAnywhere("Delete current page (dcp)", async () => {
    deleteCurrentPage();
  });
  commandAddRunFromAnywhere(
    "Delete a page using Path Navigator (dap)",
    async () => {
      deleteSomePage();
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
          await createPage(textInput);
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

  commandAddRunFromMultiBlockSelection(
    "Remove blank blocks at current level (rbbcl) - not recursive",
    async () => {
      for (let i = triggeredState.selectedNodes.length - 1; i >= 0; i--) {
        const blockToAnalyze = triggeredState.selectedNodes[i]
          .querySelector(".rm-block-text")
          .id.slice(-9);
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

  commandAddRunFromBlock("Create vanity block UID (cvbu)", () => {
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
                "parent-uid": triggeredState.activeElementId.slice(-9),
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

  commandAddRunFromAnywhere("workBench - Generate command list", () => {
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
              const newPageUID = await createPage(newPageTitle);

              const userCommandsParentUID = await createBlock(
                newPageUID,
                0,
                "**User Defined Commands**"
              );
              const userCommandsArray = userDefinedCommands.map((c) => c.key);
              await batchCreateBlocks(
                userCommandsParentUID,
                0,
                userCommandsArray
              );

              const builtinCommandsParentUID = await createBlock(
                newPageUID,
                1,
                "**Built-in Commands**"
              );
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

export const path = {
  level: 0, // tracks level of path nav. 0 is page level, 1 is child blocks
  UI_Visible: false,
  trailUID: null as null | string[],
  trailString: null as null | string[],
  excludeUIDs: [] as string[],
  callBack: null as null | PathCallback,
  allPagesForGraphSearch: null as null | {},
  currentPageBlocks: null as null | {},
  canPageBeSelected: false,
  launch: (
    callBackFunction: PathCallback,
    excludeUIDs: string[] = [],
    startUID: string = null,
    startString: string = null,
    canPageBeSelected = false
  ) => {
    path.level = 0;
    path.trailUID = [startUID];
    path.trailString = [startString];
    path.excludeUIDs = excludeUIDs;
    path.callBack = callBackFunction;
    path.canPageBeSelected = canPageBeSelected;
    path.allPagesForGraphSearch = null;
    path.currentPageBlocks = null;

    if (startUID != null) path.level = 1;
    createOverlayRender(
      "roam42-wB-path-container",
      FormDialog
    )({
      onSubmit: (data: { page: string }) => {
        path.callBack(data.page, getPageTitleByPageUid(data.page));
        path.callBack = null;
      },
      fields: {
        page: { type: "page", label: "Enter Page Name" },
      },
    });
  },
  initialize: async () => {},
};
