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
} from "./commonFunctions";
import { getRoamDate, parseTextForDates } from "./dateProcessing";
import { resolveBlockRefsInText } from "./formatConverter";
import { displayMessage } from "./help";
import { pressEsc } from "./r42kb_lib";

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
type Source = {
  name: string;
  sourceCallBack: (context: Context, query: string, results: Command[]) => void;
};
export let _sources: Source[] = []; //sources for looking up and returning commands
export let _commands: Command[] = []; //commands visible in CP

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

// WBPATH
{
  roam42.wB.path = {};

  roam42.wB.path.initialize = async () => {
    roam42.wB.path.level = 0; // tracks level of path nav. 0 is page level, 1 is child blocks
    roam42.wB.path.UI_Visible = false;
    roam42.wB.path.trailUID = null; //UID path stored as an array
    roam42.wB.path.trailString = null; //string path stored as an array (same number index as roam42.wb.path.trailUID)
    roam42.wB.path.excludeUIDs = []; //array of UID to exclude in output
    roam42.wB.path.callBack = null; //passes in 4 values: Last UID, last string, UID path and String Path
    roam42.wB.path.allPagesForGraphSearch = null; //search object for page names
    roam42.wB.path.currentPageBlocks = null; //search object for current page
    roam42.wB.path.canPageBeSelected = false; //can the page be selected in the navigator as a destination point

    roam42.wB.path.launch = (
      callBackFunction,
      excludeUIDs = [],
      startUID = null,
      startString = null,
      canPageBeSelected = false
    ) => {
      roam42.wB.path.level = 0; //reset path level
      roam42.wB.path.trailUID = [startUID]; //UID path
      roam42.wB.path.trailString = [startString]; //string path
      roam42.wB.path.excludeUIDs = excludeUIDs;
      roam42.wB.path.callBack = callBackFunction;
      roam42.wB.path.canPageBeSelected = canPageBeSelected;
      roam42.wB.path.allPagesForGraphSearch = null;
      roam42.wB.path.currentPageBlocks = null;

      if (startUID != null) roam42.wB.path.level = 1;
      //following lines handles bug in typeahead not refreshing new data SOURCES
      //be VERY Careful when changing
      //START FIX
      setTimeout(() => {
        $("#roam42-wB-path-input").typeahead("val", "-");
      }, 10);
      setTimeout(async () => {
        $("#roam42-wB-path-input").typeahead("val", "");
        $("#roam42-wB-path-input").focus();
        setTimeout(async () => {
          roam42.wB.path.toggleVisible();
        }, 100);
      }, 100);
    };

    await appendCP_HTML_ToBody();

    await typeAheadCreate();

    roam42.wB.path.toggleVisible = async () => {
      const wControl = document.querySelector("#roam42-wB-path-container");
      if (roam42.wB.path.UI_Visible) {
        $(`#roam42-wB-path-input`).typeahead("val", "");
        $(`#roam42-wB-path-PathDisplay`).text(">");
        wControl.style.visibility = "hidden";
      } else {
        roam42.wB.path.allPagesForGraphSearch = new JsSearch.Search("1");
        roam42.wB.path.allPagesForGraphSearch.searchIndex =
          new JsSearch.UnorderedSearchIndex();
        roam42.wB.path.allPagesForGraphSearch.indexStrategy =
          new JsSearch.AllSubstringsIndexStrategy();
        roam42.wB.path.allPagesForGraphSearch.addDocuments(
          await window.roamAlphaAPI.q(
            "[:find ?name ?uid :where [?page :node/title ?name] [?page :block/uid ?uid]]"
          )
        );
        roam42.wB.path.allPagesForGraphSearch.addIndex("0");
        roam42.wB.path.currentPageBlocks = null;
        wControl.style.visibility = "visible";
        $(`#roam42-wB-path-PathDisplay`).text("Typing page name.... ");
        document.querySelector("#roam42-wB-path-input").focus();
      }
      roam42.wB.path.UI_Visible = !roam42.wB.path.UI_Visible;
    };
  }; // End of INITIALIZE

  var allPagesForGraph = [];
  // SOURCES ===================================
  const levelPages = async (query, results) => {
    if (
      "Current page (cp)".toLowerCase().includes(query.toLowerCase()) ||
      query.length == 0
    )
      await results.push({
        display: "Current page (cp)",
        level: 0,
        type: "page",
        img: roam42.host + "img/wb/page.png",
        uid: await currentPageUID(),
      });
    const inboxes = (
      await roam42.wB.userCommands.UserDefinedCommandList()
    ).filter((e) => e.type == "inbox");
    for (inbox of inboxes) {
      if (
        `Inbox: ${inbox.key}`.toLowerCase().includes(query.toLowerCase()) ||
        query.length == 0
      ) {
        await results.push({
          display: `Inbox: ${inbox.key}`,
          level: 0,
          type: "page",
          img: roam42.host + "img/wb/page.png",
          uid: await roam42.wB.userCommands.inboxUID(inbox.details[0]),
        });
      }
    }
    if (
      roam42.wB.path.allPagesForGraphSearch &&
      roam42.wB.path.allPagesForGraphSearch._documents.length > 0
    ) {
      const pages = roam42.wB.path.allPagesForGraphSearch.search(query);
      const sortPages = pages.sort((a, b) => a[0].localeCompare(b[0]));
      for await (page of sortPages)
        await results.push({
          display: page[0].substring(0, 255),
          uid: page[1],
          type: "page",
          img: roam42.host + "img/wb/page.png",
        });
    }
    if (
      "Today DNP".toLowerCase().includes(query.toLowerCase()) ||
      query.length == 0
    )
      await results.push({
        display: "Today DNP",
        level: 0,
        type: "page",
        img: roam42.host + "img/wb/page.png",
        uid: await getPageUidByTitle(
          roam42.dateProcessing.getRoamDate(new Date())
        ),
      });
  };

  const levelBlocks = async (query, results) => {
    //shows all the child blocks of UID from roam42.wB.path.trailUID
    if (roam42.wB.path.trailUID == null || roam42.wB.path.trailUID.length == 0)
      return;
    if (roam42.wB.path.currentPageBlocks == null) {
      roam42.wB.path.currentPageBlocks = new JsSearch.Search("uid");
      roam42.wB.path.currentPageBlocks.searchIndex =
        new JsSearch.UnorderedSearchIndex();
      roam42.wB.path.currentPageBlocks.indexStrategy =
        new JsSearch.AllSubstringsIndexStrategy();
      roam42.wB.path.currentPageBlocks.sanitizer =
        new JsSearch.LowerCaseSanitizer();
      roam42.wB.path.currentPageBlocks.addIndex("blockText");
      roam42.wB.path.currentPageBlocks.addDocuments(
        await roam42.formatConverter.flatJson(
          roam42.wB.path.trailUID[0],
          (withIndents = false),
          false
        )
      );
    }
    const pageLine = "Page: " + roam42.wB.path.trailString[0];
    if (roam42.wB.path.currentPageBlocks._documents.length == 1) {
      //no blocks, mimick empty block
      if (roam42.wB.path.canPageBeSelected == true)
        await results.push({
          display: pageLine,
          uid: roam42.wB.path.trailUID[0],
          showLevel: false,
          level: 0,
          type: "page",
          img: roam42.host + "img/wb/page.png",
        });
    } else if (
      roam42.wB.path.currentPageBlocks &&
      roam42.wB.path.currentPageBlocks._documents.length > 0 &&
      query.length > 0
    ) {
      let lastParentUid = null;
      let lastOrder = null;
      let styledResults = [];
      for await (block of roam42.wB.path.currentPageBlocks.search(query)) {
        let bSiblingBlock = false;
        if (lastParentUid == block.parentUID && lastOrder == block.order - 1)
          bSiblingBlock = true;
        lastParentUid = block.parentUID;
        lastOrder = block.order;
        let blockOutput =
          block.blockText.length > 0 ? block.blockText.substring(0, 255) : " ";
        await results.push({
          display: blockOutput,
          isSibling: bSiblingBlock,
          parentUID: block.parentUID,
          uid: block.uid,
          showLevel: true,
          level: block.level,
          type: "bullet",
          img: roam42.host + "img/wb/bullet.png",
        });
      }
    } else {
      //no query yet, just show blocks from page
      if (roam42.wB.path.canPageBeSelected == true)
        await results.push({
          display: pageLine,
          uid: roam42.wB.path.trailUID[0],
          showLevel: false,
          level: 0,
          type: "page",
          img: roam42.host + "img/wb/page.png",
        });
      let maxCount =
        roam42.wB.path.currentPageBlocks._documents.length > 1000
          ? 1000
          : roam42.wB.path.currentPageBlocks._documents.length;
      for (i = 0; i < maxCount; i++) {
        let block = roam42.wB.path.currentPageBlocks._documents[i];
        let blockOutput =
          block.blockText.length > 0 ? block.blockText.substring(0, 255) : " ";
        await results.push({
          display: blockOutput,
          uid: block.uid,
          showLevel: true,
          level: block.level,
          type: "bullet",
          img: roam42.host + "img/wb/bullet.png",
        });
      }
    }
  };

  const typeAheadCreate = async () => {
    $("#roam42-wB-path-input")
      .typeahead(
        { hint: true, highlight: true, minLength: 0, autoselect: true },
        {
          name: "basicnav",
          display: "display",
          limit: 1000,
          async: true,
          source: async (query, syncResults, asyncResults) => {
            var results = [];
            if (roam42.wB.path.level == 0) await levelPages(query, results);
            else await levelBlocks(query, results);
            asyncResults(results);
          },
          templates: {
            suggestion: (val) => {
              if (val.type == "page") {
                return (
                  '<div style="display: flex" class="roam42-wb-path-ttmenu-item">' +
                  '<div style="width:20px"><img class="roam42-wb-path-image-page" height="18px" src="' +
                  val.img +
                  '"></div>' +
                  '<div style="padding-left:5px;width:430p">' +
                  val.display.substring(0, 80) +
                  "</div>" +
                  "</div>"
                );
              } else {
                let lvlWidth = 10;
                let lvl = Number(val.level);
                if (val.showLevel == true && lvl > 1) lvlWidth = lvlWidth * lvl;
                const groupLine =
                  val.isSibling == false ? "border-top: 1px solid" : "";
                return (
                  '<div style="' +
                  groupLine +
                  '"><div style="display: flex;" class="roam42-wb-path-ttmenu-item">' +
                  '<div style="margin-left:4px;padding-top:6px;width:' +
                  lvlWidth +
                  'px"><img style="float:right" class="roam42-wb-path-image-bullet" height="10px" src="' +
                  val.img +
                  '"></div>' +
                  '<div style="width:100%;padding-left:6px;">' +
                  val.display.substring(0, 500) +
                  "</div>" +
                  "</div></div>"
                );
              }
            },
          },
        }
      )
      .on("keydown", this, function (event) {
        if (
          event.key == "Tab" ||
          (event.key == "Enter" && roam42.wB.path.trailUID.length > 1) ||
          (event.key == "Enter" && event.ctrlKey == true)
        ) {
          event.preventDefault();
          if (
            roam42.wB.path.trailUID == null ||
            roam42.wB.path.trailUID.length == 0
          )
            return;
          let outputUID = null;
          let outputText = null;
          if (
            event.key == "Enter" &&
            event.ctrlKey == true &&
            roam42.wB.path.trailUID.length > 0
          ) {
            // use the last selection as the lookup
            outputUID =
              roam42.wB.path.trailUID[roam42.wB.path.trailUID.length - 1];
            outputText =
              roam42.wB.path.trailString[roam42.wB.path.trailString.length - 1];
          } else {
            //as tab use the current
            outputUID =
              roam42.wB.path.trailUID[roam42.wB.path.trailUID.length - 1];
            outputText =
              roam42.wB.path.trailString[roam42.wB.path.trailString.length - 1];
          }
          roam42.wB.path.level = 0;
          roam42.wB.path.toggleVisible();
          //following lines handles bug in typeahead not refreshing new data SOURCES
          //be VERY Careful when changing
          //START FIX
          setTimeout(() => {
            $("#roam42-wB-path-input").typeahead("val", "-");
          }, 50);
          setTimeout(async () => {
            $("#roam42-wB-path-input").typeahead("val", "");
            $("#roam42-wB-path-input").focus();
          }, 100);
          //END FIX
          setTimeout(async () => {
            //Execute CALLBACK function here
            if (roam42.wB.path.callBack !== null)
              await roam42.wB.path.callBack(outputUID, outputText);
            roam42.wB.path.callBack = null;
          }, 150);
        } else if (
          (event.key == "Backspace" &&
            roam42.wB.path.trailUID.length > 0 &&
            document.getElementById("roam42-wB-path-input").value.length ==
              0) ||
          (event.key == "Backspace" &&
            (event.ctrlKey == true || event.metaKey == true))
        ) {
          //remove last block in path if backspace pressed (and nothing in block)
          event.preventDefault();
          roam42.wB.path.trailString.pop();
          roam42.wB.path.trailUID.pop();
          if (roam42.wB.path.trailUID.length == 0) roam42.wB.path.level = 0;
          //following lines handles bug in typeahead not refreshing new data SOURCES
          //be VERY Careful when changing
          //START FIX
          $("#roam42-wB-path-input").typeahead("val", "-");
          setTimeout(async () => {
            $("#roam42-wB-path-input").typeahead("val", "");
            $("#roam42-wB-path-input").focus();
          }, 10);
          //END FIX
        } else if (event.key == "Escape") {
          event.stopPropagation();
          roam42.wB.path.level = 0;
          setTimeout(() => {
            roam42.wB.path.toggleVisible();
          }, 10);
          setTimeout(() => {
            $("#roam42-wB-path-input").typeahead("val", "-");
          }, 50);
          setTimeout(() => {
            $("#roam42-wB-path-input").typeahead("val", "");
            $("#roam42-wB-path-input").focus();
          }, 100);
        }
      });

    $("#roam42-wB-path-input").bind("typeahead:select", (ev, suggestion) => {
      if (roam42.wB.path.level == 0) {
        roam42.wB.path.level = 1;
        roam42.wB.path.trailString = [suggestion.display]; //string path
        roam42.wB.path.trailUID = [suggestion.uid]; //UID path

        //following lines handles bug in typeahead not refreshing new data SOURCES
        //be VERY Careful when changing
        //START FIX
        $("#roam42-wB-path-input").typeahead("val", " ");
        setTimeout(async () => {
          $("#roam42-wB-path-input").typeahead("val", "");
          $("#roam42-wB-path-input").focus();
        }, 10);
        //END FIX
      } else if (roam42.wB.path.level == 1) {
        roam42.wB.path.level = 0;
        roam42.wB.path.toggleVisible();
        setTimeout(async () => {
          //Execute CALLBACK function here
          if (roam42.wB.path.callBack !== null)
            await roam42.wB.path.callBack(suggestion.uid, suggestion.display);
          roam42.wB.path.callBack = null;
        }, 150);
      }
    });

    let inputFieldFocusOutListener = (e) => {
      if (roam42.wB.path.UI_Visible) {
        roam42.wB.path.level = 0;
        setTimeout(() => {
          roam42.wB.path.toggleVisible();
        }, 10);
        setTimeout(() => {
          $("#roam42-wB-path-input").typeahead("val", "-");
        }, 50);
        setTimeout(() => {
          $("#roam42-wB-path-input").typeahead("val", "");
          $("#roam42-wB-path-input").focus();
        }, 200);
      }
    };

    try {
      document
        .querySelector("#roam42-wB-path-input")
        .removeEventListener("focusout", inputFieldFocusOutListener);
    } catch (e) {}
    document
      .querySelector("#roam42-wB-path-input")
      .addEventListener("focusout", inputFieldFocusOutListener);
  };

  const appendCP_HTML_ToBody = () => {
    $(document.body).append(`
			<div id="roam42-wB-path-container" style="visibility:hidden">
				<div><input placeholder='type...' autocomplete="off" class="typeahead" id="roam42-wB-path-input" type="text"></div>
			</div>`);
  }; //end of appendCP_HTML_ToBody

  roam42.wB.path.initialize();
  roam42.wB.path.testReload = () => {
    console.clear();
    console.log("reloading wB path");
    try {
      document.querySelector("#roam42-wB-path-container").remove();
    } catch (e) {}
    setTimeout(async () => {
      roam42.loader.addScriptToPage(
        "workBenchPath",
        roam42.host + "ext/workBenchPath.js"
      );
    }, 4000);
  };

  roam42.wB.path.fromwB_TestReload = () => {
    try {
      document.querySelector("#roam42-wB-path-container").remove();
    } catch (e) {}
  };
}
// WBPATH

// WBCMD
{
  roam42.wB.commandAddRunFromAnywhere("All Pages", () => {
    document.location.href = baseUrl().href.replace("page", "") + "/search";
  });
  roam42.wB.commandAddRunFromAnywhere("Graph Overview", () => {
    document.location.href = baseUrl().href.replace("page", "") + "/graph";
  });
  roam42.wB.commandAddRunFromAnywhere(
    "Right Sidebar - close window panes (rscwp)",
    async () => {
      await roam42KeyboardLib.pressEsc(100);
      await roam42KeyboardLib.pressEsc(100);
      await rightSidebarCloseWindow(0, false);
      try {
        await restoreCurrentBlockSelection();
      } catch (e) {}
    }
  );
  roam42.wB.commandAddRunFromAnywhere(
    "Sidebars - swap with main window (swap)",
    async () => {
      await swapWithSideBar();
    }
  );

  roam42.wB.commandAddRunFromAnywhere(
    "Sidebars - swap with main window & choose window (swc)",
    async () => {
      const panes = await roamAlphaAPI.ui.rightSidebar.getWindows();
      if (panes.length == 0) {
        roam42.help.displayMessage("No open side windows to swap with.", 5000);
        return;
      }
      let outputString = "";
      let iCounter = 1;
      for (pane of panes) {
        let paneUID =
          pane["type"] == "block" ? pane["block-uid"] : pane["page-uid"];
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
      let paneToSwap = await smalltalk.prompt(
        "Roam42 WorkBench",
        "Which window pane to swap? (type number)\n\n" + outputString,
        1
      );
      if (paneToSwap != null && paneToSwap != "") {
        paneToSwap = Number(paneToSwap);
        if (paneToSwap != NaN && paneToSwap > 0 && paneToSwap <= panes.length)
          await swapWithSideBar(paneToSwap);
        else
          roam42.help.displayMessage(
            "Not  a valid number for a sidebar pane",
            5000
          );
      }
    }
  );

  roam42.wB.commandAddRunFromAnywhere(
    "Sidebars - open both (sob)",
    async () => {
      await setSideBarState(3);
      await setSideBarState(1);
      if (roam42.wB.triggeredState.activeElementId != null) {
        await sleep(500);
        await roam42.wB.restoreCurrentBlockSelection();
      }
    }
  );
  roam42.wB.commandAddRunFromAnywhere(
    "Sidebars - close both (scb)",
    async () => {
      await setSideBarState(2);
      await setSideBarState(4);
      if (roam42.wB.triggeredState.activeElementId != null) {
        await sleep(500);
        await roam42.wB.restoreCurrentBlockSelection();
      }
    }
  );

  const excludeSelectedBlocks = () => {
    let nodes = [];
    if (roam42.wB.triggeredState.activeElementId != null)
      nodes = [roam42.wB.triggeredState.activeElementId.slice(-9)];
    else if (roam42.wB.triggeredState.selectedNodes != null)
      for (node of roam42.wB.triggeredState.selectedNodes)
        nodes.push(node.querySelector(".rm-block-text").id.slice(-9));
    return nodes;
  };
  //move block
  roam42.wB.commandAddRunFromBlock("Move Block - to bottom (mbb)", async () => {
    roam42.wB.path.launch(
      async (uid) => {
        moveBlocks(uid, 10000);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks - to bottom (mbb)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromBlock("Move Block - to top (mbt)", async () => {
    roam42.wB.path.launch(
      async (uid) => {
        moveBlocks(uid, 0);
      },
      excludeSelectedBlocks(),
      null,
      null,
      true
    );
  });
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks - to top (mbt)",
    async () => {
      roam42.wB.path.launch(
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

  //move block and leave block ref
  roam42.wB.commandAddRunFromBlock(
    "Move Block - to bottom with block ref (mbbr)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks - to bottom with block ref (mbbr)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromBlock(
    "Move Block - to top with block Ref (mbtr)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks - to top with block refs (mbtr)",
    async () => {
      roam42.wB.path.launch(
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

  //move block & zoom
  roam42.wB.commandAddRunFromBlock(
    "Move Block - to bottom & zoom (mbbz)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks - to bottom & zoom (mbbz)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromBlock(
    "Move Block - to top & zoom (mbtz)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks - to top & zoom (mbtz)",
    async () => {
      roam42.wB.path.launch(
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
  //move block & sidebar
  roam42.wB.commandAddRunFromBlock(
    "Move Block - to bottom & sidebar (mbbs)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks -to bottom & sidebar (mbbs)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromBlock(
    "Move Block - to top & sidebar (mbts)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks -to top & sidebar (mbts)",
    async () => {
      roam42.wB.path.launch(
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

  roam42.wB.commandAddRunFromAnywhere("Open Page (opp)", async () => {
    roam42.wB.path.launch(
      async (uid) => {
        navigateUiTo(uid);
      },
      [],
      null,
      null,
      true
    );
  });
  roam42.wB.commandAddRunFromAnywhere(
    "Open Page in Sidebar (ops)",
    async () => {
      roam42.wB.path.launch(
        async (uid) => {
          navigateUiTo(uid, true);
        },
        [],
        null,
        null,
        true
      );
    }
  );

  const MoveBlockDNP = async () => {
    let dateExpression = await smalltalk.prompt(
      "Roam42 WorkBench",
      "Move this block to the top of what date?",
      "Tomorrow"
    );
    if (!dateExpression) return;
    let parsedDate = roam42.dateProcessing.parseTextForDates(dateExpression);
    if (parsedDate == dateExpression) {
      roam42.help.displayMessage("Invalid date: " + dateExpression, 5000);
      return;
    } else parsedDate = parsedDate.substring(2, parsedDate.length - 3);
    let makeBlockRef = await smalltalk
      .confirm("Roam42 WorkBench", "Leave Block Reference?", {
        buttons: {
          ok: "Yes",
          cancel: "No",
        },
      })
      .then(() => true)
      .catch(() => false);
    //move the block, and leave behind a block ref
    let destinationPage = await getPageUidByTitle(parsedDate);
    if (destinationPage == "") {
      //DNP does not exist, create it before going further
      await createPage(parsedDate);
      await sleep(150);
      destinationPage = await getPageUidByTitle(parsedDate);
    }
    setTimeout(() => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromBlock("Move Block - DNP (mbdnp)", async () => {
    MoveBlockDNP();
  });
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Move Blocks - DNP (mbdnp)",
    async () => {
      MoveBlockDNP();
    }
  );

  const pullBlockToThisBlock = async (uidToMove, makeBlockRef = false) => {
    const activeBlockUID = roam42.wB.triggeredState.activeElementId.slice(-9);
    if (makeBlockRef == true) {
      await createSiblingBlock(uidToMove, `((${uidToMove}))`);
      await sleep(50);
    }
    await moveBlock(activeBlockUID, 0, uidToMove);
    await sleep(250);
    await roam42.wB.restoreCurrentBlockSelection();
  };
  roam42.wB.commandAddRunFromBlock("Pull block (pbb)", async () => {
    roam42.wB.path.launch(async (uid) => {
      pullBlockToThisBlock(uid);
    }, excludeSelectedBlocks());
  });
  roam42.wB.commandAddRunFromBlock(
    "Pull block and leave block ref (pbr)",
    async () => {
      roam42.wB.path.launch(async (uid) => {
        pullBlockToThisBlock(uid, true);
      }, excludeSelectedBlocks());
    }
  );

  const pullChildBlocksToThisBlock = async (
    uidParent,
    makeBlockRef = false
  ) => {
    const parentBlockInfo = await getBlockInfoByUID(uidParent, true);
    if (!parentBlockInfo[0][0].children)
      roam42.help.displayMessage("This block has no children to pull.", 5000);
    else {
      const childBlocks = await sortObjectsByOrder(
        parentBlockInfo[0][0].children
      );
      for (let i = childBlocks.length - 1; i >= 0; i--) {
        const activeBlockUID =
          roam42.wB.triggeredState.activeElementId.slice(-9);
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
      await roam42.wB.restoreCurrentBlockSelection();
    }
  };
  roam42.wB.commandAddRunFromBlock("Pull child blocks  (pcb)", async () => {
    roam42.wB.path.launch(async (uid) => {
      pullChildBlocksToThisBlock(uid);
    }, excludeSelectedBlocks());
  });
  roam42.wB.commandAddRunFromBlock(
    "Pull child block and leave block ref (pcr)",
    async () => {
      roam42.wB.path.launch(async (uid) => {
        pullChildBlocksToThisBlock(uid, true);
      }, excludeSelectedBlocks());
    }
  );

  roam42.wB.commandAddRunFromAnywhere(
    "Jump to Block in page (jbp)",
    async () => {
      roam42.wB.path.launch(
        async (uid) => {
          if (uid != roam42.wB.path.trailUID[0]) {
            navigateUiTo(roam42.wB.path.trailUID[0], false);
            await sleep(500);
          }
          document.querySelector(`[id*="${uid}"]`).scrollIntoView();
          await sleep(200);
          simulateMouseClick(document.body);
          await sleep(50);
          simulateMouseClick(document.querySelector(`[id*="${uid}"]`));
          await sleep(250);
          document.activeElement.selectionStart =
            document.activeElement.value.length;
          document.activeElement.selectionEnd =
            document.activeElement.value.length;
        },
        excludeSelectedBlocks(),
        null,
        null,
        true
      );
    }
  );

  const sendBlockRefToThisBlock = async (
    destinationUID,
    locationTop = true
  ) => {
    let blockRefUIDS = [];
    if (roam42.wB.triggeredState.selectedNodes != null)
      for (i = 0; i <= roam42.wB.triggeredState.selectedNodes.length - 1; i++)
        blockRefUIDS.push(
          roam42.wB.triggeredState.selectedNodes[i]
            .querySelector(".rm-block-text")
            .id.slice(-9)
        );
    else if (roam42.wB.triggeredState.activeElementId != null)
      blockRefUIDS.push(roam42.wB.triggeredState.activeElementId.slice(-9));
    const makeBlockRefs = blockRefUIDS.map((e) => `((${e}))`);
    if (locationTop == true) {
      //add to top
      await batchCreateBlocks(destinationUID, 0, makeBlockRefs);
    } else {
      await batchCreateBlocks(destinationUID, 100000, makeBlockRefs);
    }
    await sleep(150);
    try {
      await roam42.wB.restoreCurrentBlockSelection();
    } catch (e) {}
  };
  roam42.wB.commandAddRunFromBlock(
    "Send block ref - to top (sbrt)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Send block refs - to top (sbrt)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromBlock(
    "Send block ref - to bottom (sbrb)",
    async () => {
      roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Send block refs - to bottom (sbrb)",
    async () => {
      roam42.wB.path.launch(
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

  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Roam42 Privacy Mode (alt-shift-p)",
      roam42.privacyMode.toggle
    );
  } catch (e) {}
  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Roam42 Converter (alt-m)",
      roam42.formatConverterUI.show
    );
  } catch (e) {}
  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Roam42 Web View (alt-shift-m)",
      roam42.formatConverterUI.htmlview
    );
  } catch (e) {}
  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Roam42 Help",
      roam42.quickRef.component.toggleQuickReference
    );
  } catch (e) {}
  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Roam42 Tutorials",
      roam42.tutorials.show
    );
  } catch (e) {}
  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Roam42 Graph DB Stats",
      roam42.stats.displayGraphStats
    );
  } catch (e) {}

  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Goto next day - Roam42 (ctrl-shift-.)",
      () => {
        roam42.jumpToDate.component.moveForwardToDate(true);
      }
    );
  } catch (e) {}
  try {
    roam42.wB.commandAddRunFromAnywhere(
      "Goto previous day - Roam42 (ctrl-shift-.)",
      () => {
        roam42.jumpToDate.component.moveForwardToDate(false);
      }
    );
  } catch (e) {}

  roam42.wB.commandAddRunFromBlock("Heading 1 (Alt+Shift+1)", () => {
    roam42.jumpnav.jumpCommandByActiveElement("ctrl+j 5");
  });
  roam42.wB.commandAddRunFromBlock("Heading 2 (Alt+Shift+2)", () => {
    roam42.jumpnav.jumpCommandByActiveElement("ctrl+j 6");
  });
  roam42.wB.commandAddRunFromBlock("Heading 3 (Alt+Shift+3)", () => {
    roam42.jumpnav.jumpCommandByActiveElement("ctrl+j 7");
  });

  roam42.wB.commandAddRunFromBlock(
    "Copy Block Reference - Jump Nav (Meta-j r)",
    () => {
      roam42.jumpnav.jumpCommandByActiveElement("ctrl+j r");
    }
  );
  roam42.wB.commandAddRunFromBlock(
    "Copy Block Reference as alias - Jump Nav (Meta-j s)",
    () => {
      roam42.jumpnav.jumpCommandByActiveElement("ctrl+j s");
    }
  );

  const navToDnp = () => {
    const d = new Date();
    window.roamAlphaAPI.ui.mainWindow.openPage({
      page: { uid: `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}` },
    });
  };

  //DELETE PAGE
  const confirmDeletePage = (pageUID, pageTitle) => {
    iziToast.question({
      timeout: 20000,
      close: false,
      overlay: true,
      displayMode: "once",
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
            navigateUiTo(roam42.dateProcessing.getRoamDate(new Date()));
            setTimeout(async () => {
              await deleteBlock(pageUID);
              navToDnp();
            }, 500);
          },
        ],
      ],
    });
  };

  const deleteCurrentPage = async () => {
    const uid = await currentPageUID();
    const currentPageTitle = (await getBlockInfoByUID(uid))[0][0].title;
    if ((await roam42.settings.get("workBenchDcpConfirm")) == "off") {
      await deleteBlock(uid);
      navToDnp();
    } else {
      confirmDeletePage(uid, currentPageTitle);
    }
  };

  const deleteSomePage = async () => {
    await roam42.wB.path.launch(
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
  roam42.wB.commandAddRunFromAnywhere("Delete current page (dcp)", async () => {
    deleteCurrentPage();
  });
  roam42.wB.commandAddRunFromAnywhere(
    "Delete a page using Path Navigator (dap)",
    async () => {
      deleteSomePage();
    }
  );

  //CREATE  PAGE
  const createThisPage = (instance, toast, textInput, shiftKey) => {
    if (textInput.length > 0) {
      setTimeout(async () => {
        const pageUID = await getPageUidByTitle(textInput);
        if (pageUID != "") {
          roam42.help.displayMessage(
            `Page <b>${textInput}</b> already exists.`,
            5000
          );
          document.querySelector("#roam42-wB-CreatePage-input").focus();
        } else {
          instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          await createPage(textInput);
          await sleep(50);
          navigateUiTo(textInput, shiftKey);
        }
      }, 10);
    }
  };
  roam42.wB.commandAddRunFromAnywhere("Create a page (cap)", async () => {
    let textInput = "";
    iziToast.info({
      timeout: 120000,
      overlay: true,
      displayMode: "once",
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
            document.querySelector(
              "#roam42-wB-createPage-CREATE"
            ).style.visibility = input.value.length > 0 ? "visible" : "hidden";
            if (e.key == "Enter")
              createThisPage(instance, toast, textInput, e.shiftKey);
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
        ],
        [
          "<button>CANCEL</button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          },
        ],
      ],
    });
  });

  // from https://stackoverflow.com/a/44438404
  // replaces all "new line" characters contained in `someString` with the given `replacementString`
  const replaceNewLineChars = (someString, replacementString = ``) => {
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

  roam42.wB.commandAddRunFromMultiBlockSelection(
    "Remove blank blocks at current level (rbbcl) - not recursive",
    async () => {
      for (i = roam42.wB.triggeredState.selectedNodes.length - 1; i >= 0; i--) {
        const blockToAnalyze = roam42.wB.triggeredState.selectedNodes[i]
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

  roam42.wB.commandAddRunFromAnywhere(
    "Create Vanity Page UID (cvpu)",
    async () => {
      iziToast.info({
        timeout: 120000,
        overlay: true,
        displayMode: "once",
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
                .querySelector("#roam42-wB-CreateVanityPage-PageName")
                .value.trim();
              if (pageName.length == 0) {
                roam42.help.displayMessage("Page name is not valid.", 3000);
                document
                  .querySelector("#roam42-wB-CreateVanityPage-PageName")
                  .focus();
                return;
              } else {
                //test if page is in use
                if ((await getPageUidByTitle(pageName)) != "") {
                  roam42.help.displayMessage(
                    "This page name is already in use, try again.",
                    3000
                  );
                  document
                    .querySelector("#roam42-wB-CreateVanityPage-PageName")
                    .focus();
                  return;
                }
              }
              //validate UID
              const vanityUID = document
                .querySelector("#roam42-wB-CreateVanityPage-UID")
                .value.trim();
              const regex = new RegExp("^[a-zA-Z0-9]+$");
              if (vanityUID.length != 9 || !regex.test(vanityUID)) {
                roam42.help.displayMessage(
                  "UID is not valid. It must be exactly 9 characters and it contain only alpha-numeric characters. It is also case-sensitive.",
                  3000
                );
                document
                  .querySelector("#roam42-wB-CreateVanityPage-UID")
                  .focus();
                return;
              } else {
                //test if UID is in use
                if ((await getBlockInfoByUID(vanityUID)) != null) {
                  roam42.help.displayMessage(
                    "This UID is already in use, try again.",
                    3000
                  );
                  document
                    .querySelector("#roam42-wB-CreateVanityPage-UID")
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
          ],
          [
            "<button>CANCEL</button>",
            (instance, toast) => {
              instance.hide({ transitionOut: "fadeOut" }, toast, "button");
            },
          ],
        ],
      });
    }
  );

  roam42.wB.commandAddRunFromBlock("Create vanity block UID (cvbu)", () => {
    iziToast.info({
      timeout: 120000,
      overlay: true,
      displayMode: "once",
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
              .querySelector("#roam42-wB-CreateVanityBlock-UID")
              .value.trim();
            const regex = new RegExp("^[a-zA-Z0-9]+$");
            if (vanityUID.length != 9 || !regex.test(vanityUID)) {
              roam42.help.displayMessage(
                "UID is not valid. It must be exactly 9 characters and it contain only alpha-numeric characters. It is also case-sensitive.",
                3000
              );
              document
                .querySelector("#roam42-wB-CreateVanityBlock-UID")
                .focus();
              return;
            } else {
              //test if UID is in use
              if ((await getBlockInfoByUID(vanityUID)) != null) {
                roam42.help.displayMessage(
                  "This UID is already in use, try again.",
                  3000
                );
                document
                  .querySelector("#roam42-wB-CreateVanityBlock-UID")
                  .focus();
                return;
              }
            }
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
            await window.roamAlphaAPI.createBlock({
              location: {
                "parent-uid":
                  roam42.wB.triggeredState.activeElementId.slice(-9),
                order: 0,
              },
              block: {
                string: `This is a new block with the UID: ${vanityUID}`,
                uid: vanityUID,
              },
            });
            await sleep(50);
          },
        ],
        [
          "<button>CANCEL</button>",
          (instance, toast) => {
            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          },
        ],
      ],
    });
  });

  roam42.wB.commandAddRunFromAnywhere(
    "workBench - Generate command list",
    () => {
      iziToast.question({
        timeout: 20000,
        close: false,
        overlay: true,
        displayMode: "once",
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
                const userCommands =
                  await roam42.wB.userCommands.UserDefinedCommandList();
                const builtinCommands = await roam42.wB._commands;

                const newPageTitle =
                  "#[[42workBench]] Command List as of " +
                  dayjs().format("YYYY-MM-DD hh:mm ");
                const newPageUID = await createPage(newPageTitle);

                const userCommandsParentUID = await createBlock(
                  newPageUID,
                  0,
                  "**User Defined Commands**"
                );
                const userCommandsArray = userCommands.map((c) => c.key);
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
                const builtinCommandsArray = builtinCommands.map(
                  (c) => c.display
                );
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
          ],
        ],
      });
    }
  );

  roam42.wB.commandAddRunFromAnywhere("Reload workBench (rwb)", async () => {
    await sleep(100);
    try {
      await roam42.wB.restoreCurrentBlockSelection();
    } catch (e) {}
    roam42.wB.testReload();
    roam42.help.displayMessage("Reloading workBench.", 2000);
  });
} //end of module
// WBCMD
