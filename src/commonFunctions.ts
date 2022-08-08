import iziToast, { IziToastTransitionIn } from "izitoast";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import type { SidebarWindowInput } from "roamjs-components/types/native";
import { getRoamDate, testIfRoamDateAndConvert } from "./dateProcessing";
import { displayMessage } from "./help";
import { simulateKey } from "./r42kb_lib";

export const sleep = (m: number) => new Promise((r) => setTimeout(r, m));

export const baseUrl = () => {
  const url = new URL(window.location.href);
  const parts = url.hash.split("/");
  url.hash = parts.slice(0, 3).concat(["page"]).join("/");
  return url;
};

export type BlockInfo = {
  title: string;
  string: string;
  uid: string;
  heading: number;
  order: number;
  open: boolean;
  "view-type": string;
  "text-align": string;
  children: BlockInfo[];
  parents: BlockInfo[];
};

export const getBlockInfoByUID = (
  uid: string,
  withChildren = false,
  withParents = false
) => {
  try {
    let q = `[:find (pull ?page
                   [:node/title :block/string :block/uid :block/heading :block/props 
                    :entity/attrs :block/open :block/text-align :children/view-type
                    :block/order
                    ${withChildren ? "{:block/children ...}" : ""}
                    ${withParents ? "{:block/parents ...}" : ""}
                   ])
                :where [?page :block/uid "${uid}"]  ]`;
    var results = window.roamAlphaAPI.q(q);
    if (results.length == 0) return null;
    return results as [BlockInfo][];
  } catch (e) {
    return null;
  }
};

export const createPage = async (page_title: string) => {
  const newUID = window.roamAlphaAPI.util.generateUID();
  await window.roamAlphaAPI.createPage({
    page: { title: page_title.toString(), uid: newUID },
  });
  return newUID;
};

export const navigateUiTo = async function (
  destinationPage: string,
  openInSideBar = false,
  sSidebarType: SidebarWindowInput["type"] = "outline"
) {
  //sSidebarType = block, outline, graph
  const prefix = destinationPage.substring(0, 2);
  const suffix = destinationPage.substring(
    destinationPage.length - 2,
    destinationPage.length
  );
  if (sSidebarType == "outline" && prefix == "((" && suffix == "))")
    //test if block ref to open in block mode
    sSidebarType = "block"; //chnage to block mode
  if ((prefix == "[[" && suffix == "]]") || (prefix == "((" && suffix == "))"))
    destinationPage = destinationPage.substring(2, destinationPage.length - 2);
  let uid = getPageUidByPageTitle(destinationPage);
  if (uid == "") {
    //test if UID for zooming in, if not create page
    const info = getBlockInfoByUID(destinationPage);
    if (info == null) {
      //not a page, nor UID so create page
      if (destinationPage.length > 255)
        destinationPage = destinationPage.substring(0, 254);
      await createPage(destinationPage);
      await sleep(50);
      uid = getPageUidByPageTitle(destinationPage);
    } else {
      uid = destinationPage; //seems to be a UID, zoom it
    }
  }
  if (openInSideBar == false)
    document.location.assign(baseUrl().href + "/" + uid);
  else {
    await window.roamAlphaAPI.ui.rightSidebar.addWindow({
      window: { "block-uid": uid, type: sSidebarType },
    });
  }
};

export const commandPaletteAdd = (label: string, callback: () => void) => {
  return window.roamAlphaAPI.ui.commandPalette.addCommand({
    label,
    callback,
  });
};

export const sortObjectByKey = <T extends { key: string }>(o: T[]) => {
  return o.sort(function (a, b) {
    return a.key.localeCompare(b.key);
  });
};

export const sortObjectsByOrder = <T extends { order: number }>(o: T[]) => {
  return o.sort(function (a, b) {
    return a.order - b.order;
  });
};

export const asyncQuerySelector = async (node: Element, query: string) => {
  try {
    return await (query ? node.querySelector(query) : node);
  } catch (error) {
    console.error(`Cannot find ${query ? `${query} in` : ""} ${node}.`, error);
    return null;
  }
};

const mouseOverEvents = ["mouseover"];
export const simulateMouseOver = (element: Element) => {
  mouseOverEvents.forEach((mouseEventType) =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      })
    )
  );
};

export const setSideBarState = async (state: number) => {
  switch (state) {
    case 1: //open left
      if (document.querySelector(".rm-open-left-sidebar-btn")) {
        //not open.. so open
        simulateMouseOver(
          document.getElementsByClassName("rm-open-left-sidebar-btn")[0]
        );
        setTimeout(async () => {
          (
            document.getElementsByClassName(
              "rm-open-left-sidebar-btn"
            )[0] as HTMLButtonElement
          ).click();
        }, 100);
      }
      break;
    case 2: //close left
      if (!document.querySelector(".rm-open-left-sidebar-btn")) {
        //open.. so close
        (
          document.querySelector(
            ".roam-sidebar-content .bp3-icon-menu-closed"
          ) as HTMLButtonElement
        ).click();
        simulateMouseOver(document.getElementsByClassName("roam-article")[0]);
      }
      break;
    case 3: //open right
      await window.roamAlphaAPI.ui.rightSidebar.open();
      break;
    case 4: //close right
      await window.roamAlphaAPI.ui.rightSidebar.close();
      break;
  }
};

export const saveLocationParametersOfTextArea = (
  element: HTMLTextAreaElement
) => {
  return {
    id: element.id,
    selStart: element.selectionStart,
    selEnd: element.selectionEnd,
  };
};

//https://stackoverflow.com/questions/40091000/simulate-click-event-on-react-element
const mouseClickEvents = ["mousedown", "click", "mouseup"];
export const simulateMouseClick = (element: Element) => {
  try {
    mouseClickEvents.forEach((mouseEventType) =>
      element.dispatchEvent(
        new MouseEvent(mouseEventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1,
        })
      )
    );
  } catch (e) {}
};

export const restoreLocationParametersOfTexArea = (locationFacts: {
  id: string;
  selStart: number;
  selEnd: number;
}) => {
  setTimeout(() => {
    simulateMouseClick(document.getElementById(locationFacts.id));
    setTimeout(() => {
      const el = document.getElementById(
        locationFacts.id
      ) as HTMLTextAreaElement;
      el.selectionStart = locationFacts.selStart;
      el.selectionEnd = locationFacts.selEnd;
    }, 100);
  }, 100);
};

export const rightSidebarCloseWindow = async (
  iWindow: number,
  bRestoreLocation = true
) => {
  //iWindow = 0 to close all windows, otherwise the number of the window to close
  if ((await window.roamAlphaAPI.ui.rightSidebar.getWindows().length) > 0) {
    let restoreLocation = bRestoreLocation
      ? saveLocationParametersOfTextArea(
          document.activeElement as HTMLTextAreaElement
        )
      : null;
    await window.roamAlphaAPI.ui.rightSidebar.open();
    await sleep(250);
    var panes = document.querySelectorAll(".sidebar-content .bp3-icon-cross");
    if (iWindow == 0) {
      const numberOfPanes = panes.length;
      for (let i = 0; i <= numberOfPanes - 1; i++) {
        simulateMouseClick(
          document.querySelector(".sidebar-content .bp3-icon-cross")
        );
        await sleep(100);
      }
    } else {
      simulateMouseClick(panes[iWindow - 1]);
    }
    if (bRestoreLocation) restoreLocationParametersOfTexArea(restoreLocation);
    await sleep(300);
  }
};

export const currentPageUID = () => {
  let uid = "";
  if (window.location.href.includes("page")) {
    uid = window.location.href.replace(baseUrl().href + "/", "");
    try {
      //test uid if it is the title
      const testForParents = getBlockInfoByUID(uid, false, true);
      if (testForParents[0][0].parents)
        uid = testForParents[0][0].parents[0].uid;
    } catch (e) {}
  } else {
    uid = window.roamAlphaAPI.util.dateToPageUid(new Date());
  }
  return uid;
};

export const swapWithSideBar = async (paneNumber = 1) => {
  const panes = await window.roamAlphaAPI.ui.rightSidebar.getWindows();
  if (panes.length == 0) {
    displayMessage(
      "No open side windows to swap with.",
      5000
    );
    return;
  }
  const mainPageUID = currentPageUID();
  const pane = window.roamAlphaAPI.ui.rightSidebar.getWindows()[paneNumber - 1];
  let paneToSwap =
    pane.type === "outline"
      ? pane["page-uid"]
      : pane.type === "mentions"
      ? pane["mentions-uid"]
      : pane["block-uid"];
  if (paneToSwap != undefined) {
    navigateUiTo(paneToSwap, false); //move to main window
    navigateUiTo(mainPageUID, true); //move to side bar main page
    await sleep(500);
    await rightSidebarCloseWindow(paneNumber + 1, false);
  }
};

export const sidebarRightToggle = () => {
  try {
    if (document.querySelector("#roam-right-sidebar-content"))
      window.roamAlphaAPI.ui.rightSidebar.close();
    else window.roamAlphaAPI.ui.rightSidebar.open();
  } catch (e) {
    console.log(e);
  }
};

export const sidebarLeftToggle = async () => {
  if (document.getElementsByClassName("rm-open-left-sidebar-btn")?.length > 0)
    //left side bar closed, open it
    await setSideBarState(1);
  else await setSideBarState(2);
};

const mouseClickEventsRight = ["contextmenu"];
export const simulateMouseClickRight = (element: Element) => {
  mouseClickEventsRight.forEach((mouseEventType) =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      })
    )
  );
};

// updates an empty text area with a new value. This function does some additional work
// because the textarea in roam is managed by React component, and it wasn't being triggered to
// update when inserting a value
export const setEmptyNodeValue = (element: Element, value: string) => {
  const e = new Event("input", { bubbles: true });
  const valueSetter = Object.getOwnPropertyDescriptor(element, "value").set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value"
  ).set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
  element.dispatchEvent(e);
};

//Inserts text at the current cursor location in a textara
export const insertAtCaret = (areaId: string, text: string) => {
  var txtarea = document.getElementById(areaId) as HTMLTextAreaElement;
  var scrollPos = txtarea.scrollTop;
  var strPos = 0;
  var br =
    txtarea.selectionStart || txtarea.selectionStart === 0 ? "ff" : false;
  if (br == "ff") strPos = txtarea.selectionStart;

  var front = txtarea.value.substring(0, strPos);
  var back = txtarea.value.substring(strPos, txtarea.value.length);
  setEmptyNodeValue(txtarea, front + text + back);
  setTimeout(() => {
    strPos = strPos + text.length;
    if (br == "ff") {
      txtarea.selectionStart = strPos;
      txtarea.selectionEnd = strPos;
      txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
  }, 100);
};

export const replaceAsync = (
  string: string,
  searchValue: string,
  replacer: () => Promise<void>
) => {
  //https://github.com/dsblv/string-replace-async#readme
  try {
    if (typeof replacer === "function") {
      // 1. Run fake pass of `replace`, collect values from `replacer` calls
      // 2. Resolve them with `Promise.all`
      // 3. Run `replace` with resolved values
      var values: (() => Promise<void>)[] = [];
      String.prototype.replace.call(string, searchValue, function () {
        values.push(replacer.apply(undefined, arguments));
        return "";
      });
      return Promise.all(values).then(function (resolvedValues) {
        return String.prototype.replace.call(string, searchValue, function () {
          return resolvedValues.shift();
        });
      });
    } else {
      return Promise.resolve(
        String.prototype.replace.call(string, searchValue, replacer)
      );
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

export const currentActiveBlockUID = () => {
  if (document.activeElement.localName == "textarea")
    return document.activeElement.id.slice(-9);
  else return null;
};

export const blockDelete = (block: HTMLTextAreaElement) => {
  if (block.localName == "textarea") {
    setTimeout(async () => {
      await moveCursorToPreviousBlock(block);
      await sleep(100);
      await deleteBlock(block.id.slice(-9));
    }, 50);
  }
};

export const blockInsertBelow = (block: HTMLElement) => {
  //Block is the HTMLElement of the currently selected block
  if (block.localName == "textarea") {
    setTimeout(async () => {
      let newUID = await createSiblingBlock(block.id.slice(-9), "", true);
      await sleep(50);
      simulateMouseClick(document.querySelector(`div[id$='${newUID}']`));
    }, 50);
  }
};

export const blockInsertAbove = (block: HTMLElement) => {
  //Block is the HTMLElement of the currently selected block
  if (block.localName == "textarea") {
    setTimeout(async () => {
      let newUID = await createSiblingBlock(block.id.slice(-9), "", false);
      await sleep(50);
      simulateMouseClick(document.querySelector(`div[id$='${newUID}']`));
    }, 50);
  }
};

export const moveCursorToNextBlock = (block: HTMLTextAreaElement) => {
  //Block is the HTMLElement of the currently selected block
  if (block.localName == "textarea") {
    setTimeout(async () => {
      block.selectionStart = block.value.length;
      block.selectionEnd = block.value.length;
      await simulateKey(40); //up arrow
      let newLocation = document.activeElement as HTMLTextAreaElement;
      newLocation.selectionStart = newLocation.value.length;
      newLocation.selectionEnd = newLocation.value.length;
    }, 10);
  }
};

export const moveCursorToPreviousBlock = (block: HTMLTextAreaElement) => {
  //Block is the HTMLElement of the currently selected block
  if (block.localName == "textarea") {
    setTimeout(async () => {
      block.selectionStart = 0;
      block.selectionEnd = 0;
      await simulateKey(38); //up arrow
      let newLocation = document.activeElement as HTMLTextAreaElement;
      newLocation.selectionStart = newLocation.value.length;
      newLocation.selectionEnd = newLocation.value.length;
    }, 10);
  }
};

export const startOfWeek = (date: Date) => {
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export const getUserInformation = () => {
  let gs = window.localStorage.getItem("globalAppState").split(",");
  let email = gs[gs.findIndex((e, i) => e.includes("~:email")) + 1];
  let displayName =
    gs[gs.findIndex((e, i) => e.includes("~:display-name")) + 1];
  let userID = gs[gs.findIndex((e, i) => e.includes("~:uid")) + 1];
  let photoUrl = gs[gs.findIndex((e, i) => e.includes("~:photo-url")) + 1];
  return {
    displayName: displayName.substring(1, displayName.length - 1),
    email: email.substring(1, email.length - 1),
    userID: userID.substring(1, userID.length - 1),
    photoUrl: photoUrl.substring(1, photoUrl.length - 1),
  };
};

export const createUid = () => {
  return window.roamAlphaAPI.util.generateUID();
};

//API DOCS: https://roamresearch.com/#/app/help/page/0Xd0lmIrF
export const createBlock = async (
  parent_uid: string,
  block_order: number,
  block_string: string
) => {
  parent_uid = parent_uid.replace("((", "").replace("))", "");
  let newUid = window.roamAlphaAPI.util.generateUID();
  await window.roamAlphaAPI.createBlock({
    location: { "parent-uid": parent_uid, order: block_order },
    block: { string: block_string.toString(), uid: newUid },
  });
  await sleep(10); //seems a brief pause is need for DB to register the write
  return newUid;
};

export const createSiblingBlock = async (
  fromUID: string,
  newBlockText: string,
  bBelow = true
) => {
  //fromUID -- adds at sibling level below this block {order: 2, parentUID: "szmOXpDwT"}
  //this is not an efficient method for bulk inserting
  fromUID = fromUID.replace("((", "").replace("))", "");
  var blockInfo = await getDirectBlockParentUid(fromUID);
  var orderValue = bBelow ? 1 : 0;
  return await createBlock(
    blockInfo.parentUID,
    Number(blockInfo.order) + orderValue,
    newBlockText.toString()
  );
};

export const batchCreateBlocks = async (
  parent_uid: string,
  starting_block_order: number,
  string_array_to_insert: string[]
) => {
  parent_uid = parent_uid.replace("((", "").replace("))", "");
  await string_array_to_insert.forEach(async (item, counter) => {
    await createBlock(
      parent_uid,
      counter + starting_block_order,
      item.toString()
    );
  });
};

export const moveBlock = async (
  parent_uid: string,
  block_order: number,
  block_to_move_uid: string
) => {
  parent_uid = parent_uid.replace("((", "").replace("))", "");
  return window.roamAlphaAPI.moveBlock({
    location: { "parent-uid": parent_uid, order: block_order },
    block: { uid: block_to_move_uid },
  });
};

export const updateBlock = async (
  block_uid: string,
  block_string: string,
  block_expanded = true
) => {
  block_uid = block_uid.replace("((", "").replace("))", "");
  return window.roamAlphaAPI.updateBlock({
    block: {
      uid: block_uid,
      string: block_string.toString(),
      open: block_expanded,
    },
  });
};

export const replaceBlock = async (
  parent_uid: string,
  block_order: number,
  block_to_move_uid: string
) => {
  parent_uid = parent_uid.replace("((", "").replace("))", "");
  var refInfo = await getBlockInfoByUID(block_to_move_uid, true, false);

  window.roamAlphaAPI.updateBlock({
    block: {
      uid: parent_uid,
      string: refInfo[0][0].string.toString(),
      open: refInfo[0][0].open,
    },
  });
  if (refInfo[0][0].hasOwnProperty("children")) {
    for (var i = 0; i < refInfo[0][0].children.length; i++) {
      window.roamAlphaAPI.moveBlock({
        location: { "parent-uid": parent_uid, order: block_order },
        block: { uid: refInfo[0][0].children[i].uid },
      });
    }
  }

  var newBlockRefString = "((" + parent_uid + "))";
  updateBlock(block_to_move_uid, newBlockRefString, true);
};

export const deleteBlock = async (block_uid: string) => {
  block_uid = block_uid.replace("((", "").replace("))", "");
  return window.roamAlphaAPI.deleteBlock({ block: { uid: block_uid } });
};

export const updatePage = async (page_uid: string, page_new_title: string) => {
  return window.roamAlphaAPI.updatePage({
    page: { uid: page_uid, title: page_new_title },
  });
};

export const deletePage = async (page_uid: string) => {
  return window.roamAlphaAPI.deletePage({ page: { uid: page_uid } });
};

//returns the direct parent block  {order: 2, parentUID: "szmOXpDwT"}
export const getDirectBlockParentUid = async (uid: string) => {
  var r = await window.roamAlphaAPI.q(`[:find ?uid ?order 
							:where  [?cur_block :block/uid "${uid}"]
											[?cur_block :block/order ?order]
											[?parent :block/children ?cur_block]
											[?parent :block/uid ?uid]]`);
  return r.length > 0 ? { order: r[0][1], parentUID: r[0][0] } : null;
};

//gets all parent blocks up to the root
export const getBlockParentUids = async (uid: string) => {
  try {
    var parentUIDs = (await window.roamAlphaAPI.q(
      `[:find (pull ?block [{:block/parents [:block/uid]}]) :in $ [?block-uid ...] :where [?block :block/uid ?block-uid]]`,
      [uid]
    )[0][0]) as { parents: { uid: string }[] };
    var UIDS = parentUIDs.parents.map((e) => e.uid);
    UIDS.shift();
    return await getPageNamesFromBlockUidList(UIDS);
  } catch (e) {
    return "";
  }
};

export const getBlockByPhrase = async (search_phrase: string) => {
  var blocks = await window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/uid :block/string] ) :where [?e :block/string ?contents][(clojure.string/includes? ?contents "${search_phrase}")]]`
  );
  return blocks;
};

export const currentPageZoomLevelUID = async () => {
  var uid = "";
  if (window.location.href.includes("page")) {
    uid = window.location.href.replace(baseUrl().href + "/", "");
  } else {
    uid = window.roamAlphaAPI.util.dateToPageUid(new Date());
  }
  return uid;
};

export const isPage = async (title: string) => {
  try {
    var page = window.roamAlphaAPI.q(`
          [:find ?e
              :where [?e :node/title "${title}"]]`);

    return page.length > 0 ? true : false;
  } catch (e) {
    return "";
  }
};

export const isBlockRef = async (uid: string) => {
  try {
    if (uid.startsWith("((")) {
      uid = uid.slice(2, uid.length);
      uid = uid.slice(0, -2);
    }

    var block_ref = await window.roamAlphaAPI.q(`
          [:find (pull ?e [:block/string])
              :where [?e :block/uid "${uid}"]]`);

    return block_ref.length > 0 && block_ref[0][0] != null ? true : false;
  } catch (e) {
    return "";
  }
};

export const isPageRef = async (uid: string) => {
  try {
    if (uid.startsWith("((")) {
      uid = uid.slice(2, uid.length);
      uid = uid.slice(0, -2);
    }

    var block_ref = await window.roamAlphaAPI.q(`
          [:find (pull ?e [:node/title])
              :where [?e :block/uid "${uid}"]]`);

    return block_ref.length > 0 && block_ref[0][0] != null ? true : false;
  } catch (e) {
    return "";
  }
};

export const getPageNamesFromBlockUidList = async (blockUidList: string[]) => {
  //blockUidList ex ['sdfsd', 'ewfawef']
  var rule =
    "[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]";
  var query = `[:find  (pull ?block [:block/uid :block/string])(pull ?page [:node/title :block/uid])
                                     :in $ [?block_uid_list ...] %
                                     :where
                                      [?block :block/uid ?block_uid_list]
                                     [?page :node/title]
                                     (ancestor ?block ?page)]`;
  var results = await window.roamAlphaAPI.q(query, blockUidList, rule);
  return results;
};

export type BlockNode = { string: string; uid: string; children: BlockNode[] };

export const getBlocksReferringToThisPage = (title: string): BlockNode[][] => {
  try {
    return window.roamAlphaAPI.q(`
          [:find (pull ?refs [:block/string :block/uid {:block/children ...}])
              :where [?refs :block/refs ?title][?title :node/title "${title}"]]`);
  } catch (e) {
    return [];
  }
};

export const getBlocksReferringToThisBlockRef = (
  uid: string
): BlockNode[][] => {
  try {
    return window.roamAlphaAPI.q(`
          [:find (pull ?refs [:block/string :block/uid {:block/children ...}])
              :where [?refs :block/refs ?block][?block :block/uid "${uid}"]]`);
  } catch (e) {
    return [];
  }
};

export const pageExists = async (page_title: string) => {
  var results = await window.roamAlphaAPI.q(
    `[:find ?e :where [?e :node/title "${page_title}"]]`
  );
  if (results.length == 0) {
    return false;
  }

  return true;
};

export const getRandomPage = async () => {
  var results = await window.roamAlphaAPI.q(
    `[:find [(rand 1 ?page)] :where [?e :node/title ?page]]`
  );
  return results;
};

export const getRandomBlock = async () => {
  var results = await window.roamAlphaAPI.q(
    `[:find [(rand 1 ?blocks)] :where [?e :block/uid ?blocks]]`
  );
  return results;
};

export const getRandomBlockMentioningPage = async (page_title: string) => {
  var results = await getBlocksReferringToThisPage(page_title);
  if (results.length == 0) {
    return "";
  }

  var random_result = results[Math.floor(Math.random() * results.length)];
  return random_result[0].uid;
};

export const getRandomBlockMentioningBlockRef = async (block_ref: string) => {
  if (block_ref.startsWith("((")) {
    block_ref = block_ref.slice(2, block_ref.length);
    block_ref = block_ref.slice(0, -2);
  }

  var results = await getBlocksReferringToThisBlockRef(block_ref);
  if (results.length == 0) {
    return "";
  }

  var random_result = results[Math.floor(Math.random() * results.length)];
  return random_result[0].uid;
};

export const getRandomBlockFromPage = async (page_title: string) => {
  var rule =
    "[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]";

  var query = `[:find  (pull ?block [:block/uid])
                                 :in $ ?page_title %
                                 :where
                                 [?page :node/title ?page_title]
                                 (ancestor ?block ?page)]`;

  var results = await window.roamAlphaAPI.q(query, page_title, rule);
  var random_result = results[Math.floor(Math.random() * results.length)];

  return random_result[0].uid;
};

export const getRandomBlockFromBlock = async (uid: string) => {
  if (uid.startsWith("((")) {
    uid = uid.slice(2, uid.length);
    uid = uid.slice(0, -2);
  }

  var rule =
    "[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]";

  var query = `[:find  (pull ?block [:block/uid])
                                 :in $ ?uid %
                                 :where
                                 [?page :block/uid ?uid]
                                 (ancestor ?block ?page)]`;

  var results = await window.roamAlphaAPI.q(query, uid, rule);
  var random_result = results[Math.floor(Math.random() * results.length)];

  return random_result[0].uid;
};

export const moveForwardToDate = (bForward: boolean) => {
  let jumpDate = testIfRoamDateAndConvert(
    document.querySelector<HTMLHeadingElement>(".rm-title-display").innerText
  );
  let directionTip: IziToastTransitionIn = "bounceInDown";
  if (jumpDate != null) {
    if (bForward) {
      jumpDate.setDate(jumpDate.getDate() + 1);
      directionTip = "bounceInRight";
    } else {
      jumpDate.setDate(jumpDate.getDate() - 1);
      directionTip = "bounceInLeft";
    }
    var dDate = getRoamDate(jumpDate);
    navigateUiTo(dDate, false);
  }

  iziToast.destroy();
  iziToast.show({
    message: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][jumpDate.getDay()],
    theme: "dark",
    transitionIn: directionTip,
    position: "center",
    icon: "bp3-button bp3-minimal bp3-icon-pivot",
    progressBar: true,
    animateInside: false,
    close: false,
    timeout: 1500,
    closeOnClick: true,
    displayMode: 2,
  });
};
