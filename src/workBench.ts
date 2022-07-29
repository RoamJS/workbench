import Cookies from "js-cookie";
import { pressEsc } from "./r42kb_lib";

export let enabled = false;
export const getIsEnabled = () => {
  if (Cookies.get("wB_IsEnabled") === "true") return true;
  else return false;
};
export let active = false;
export let keyboardShortcut = "ctrl+;";
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

export const toggleActiveState = () => {
  let currentState = getIsEnabled();
  active = !currentState;
  setIsEnabled(!currentState);
  if (roam42.wB.active) roam42.help.displayMessage("workBench activated", 5000);
  else roam42.help.displayMessage("Bye Bye workBench", 5000);
};

roam42.wB.initialize = async () => {
  // Default is that wB is enabled, but during testing is turned off.
  if ((await roam42.settings.get("workBenchEnabled")) == "off") return;
  else roam42.wB.enabled = true;

  roam42.wB.setIsEnabled = (val) => {
    if (val == true) Cookies.set("wB_IsEnabled", "true", { expires: 365 });
    else Cookies.set("wB_IsEnabled", "false", { expires: 365 });
  };

  roam42.wB.active = roam42.wB.getIsEnabled();

  roam42.wB.UI_Visible = false;
  roam42.wB.keystate = {}; //tracks key state of CP input control
  roam42.wB._sources = []; //sources for looking up and returning commands
  roam42.wB._commands = []; //commands visible in CP

  await appendCP_HTML_ToBody();

  $("#roam42-wB-input").typeahead(
    { hint: true, highlight: true, minLength: 0, autoselect: true },
    {
      name: "basicnav",
      display: "display",
      limit: 1000,
      async: true,
      source: async (query, syncResults, asyncResults) => {
        var results = [];
        let context = "*"; //default to anywhere
        if (roam42.wB.triggeredState.activeElementId != null) context = "-"; //context: textarea
        if (roam42.wB.triggeredState.selectedNodes != null) context = "+"; //context: multiple nodes
        if (query.length == 0) {
          for await (source of await roam42.wB._sources)
            await source.sourceCallBack(context, query, results);
        } else {
          if (roam42.wB._sources.length > 0) {
            for await (source of await roam42.wB._sources)
              await source.sourceCallBack(context, query, results);
            var enhancedSearch = new JsSearch.Search("display");
            enhancedSearch.searchIndex = new JsSearch.UnorderedSearchIndex();
            enhancedSearch.indexStrategy =
              new JsSearch.AllSubstringsIndexStrategy();
            enhancedSearch.addDocuments(results);
            enhancedSearch.addIndex("display");
            results = enhancedSearch.search(query);
          }
        }
        asyncResults(results);
      },
      templates: {
        suggestion: (val) => {
          return (
            '<div style="display: flex">' +
            '<div style="left:5px;width:22px;"><img height="14px" src="' +
            val.img +
            '"></div>' +
            '<div style="width:430px"> ' +
            val.display +
            "</div>" +
            "</div>"
          );
        },
      },
    }
  );

  // perform command
  $("#roam42-wB-input").bind("typeahead:select", (ev, suggestion) => {
    $("#roam42-wB-input").typeahead("close");
    roam42.wB.toggleVisible();
    setTimeout(async () => {
      switch (suggestion.context) {
        case "-": //textarea block edit
          await roam42KeyboardLib.pressEsc(100);
          await roam42.wB.restoreCurrentBlockSelection();
          break;
        case "+": //multipe blocks selected
          break;
      }
      await suggestion.cmd(suggestion);
    }, 200);
  });

  $("#roam42-wB-input").on("keydown", function (e) {
    roam42.wB.keystate = e;
    if (e.key == "Escape") inputFieldFocusOutListener();
  });

  $("#roam42-wB-input").on("keyup", function (e) {
    roam42.wB.keystate = e;
  });

  //assign trigger to keyboard
  let shortcut = await roam42.settings.get("workBenchShortcut");
  if (shortcut != null) roam42.wB.keyboardShortcut = shortcut;

  Mousetrap.unbind(roam42.wB.keyboardShortcut); //do this in case of a reset
  Mousetrap.bind(roam42.wB.keyboardShortcut, () => {
    roam42.wB.launch();
    return false;
  });

  roam42.wB.restoreCurrentBlockSelection = async () => {
    roam42.common.simulateMouseClick(document.body);
    await roam42.common.sleep(100);
    roam42.common.simulateMouseClick(
      document.getElementById(roam42.wB.triggeredState.activeElementId)
    );
    await roam42.common.sleep(150);
    document.activeElement.selectionStart =
      roam42.wB.triggeredState.activeElementSelectionStart;
    document.activeElement.selectionEnd =
      roam42.wB.triggeredState.activeElementSelectionEnd;
  };

  let inputFieldFocusOutListener = (e) => {
    if (roam42.wB.UI_Visible) {
      roam42.wB.toggleVisible();
      if (roam42.wB.triggeredState.activeElementId != null)
        setTimeout(async () => {
          roam42.wB.restoreCurrentBlockSelection();
        }, 200);
    }
  };

  let inputFieldKeyListener = (e) => {
    if (roam42.wB.UI_Visible) {
      if (e.keyCode == 9) {
        //tab key
        console.log("tab");
        event.preventDefault();
      }
    }
  };

  try {
    document
      .querySelector("#roam42-wB-input")
      .removeEventListener("focusout", inputFieldFocusOutListener);
  } catch (e) {}
  document
    .querySelector("#roam42-wB-input")
    .addEventListener("focusout", inputFieldFocusOutListener);

  try {
    document
      .querySelector("#roam42-wB-input")
      .removeEventListener("keydown", inputFieldKeyListener);
  } catch (e) {}
  document
    .querySelector("#roam42-wB-input")
    .addEventListener("keydown", inputFieldKeyListener);

  // SOURCES ===================================

  roam42.wB.sourceAdd = async (sourceName, callBackFunction) => {
    //callback receives query and the results object for appending commands
    let source = await roam42.wB._sources.find(
      (source) => source.name === sourceName
    );
    if (source === undefined)
      roam42.wB._sources.push({
        name: sourceName,
        sourceCallBack: callBackFunction,
      });
    else source.sourceCallBack = callBackFunction;
  };

  await roam42.wB.sourceAdd(
    "workBench userCommands",
    async (context, query, results) => {
      let list = await roam42.wB.userCommands.UserDefinedCommandList();
      for (item of list) {
        if (context == "-" || context == "+")
          await results.push({
            display: item.key,
            img: roam42.host + `img/wb/ucmd-${item.type}.png`,
            context: context,
            info: item.details,
            type: item["type"],
            cmd: roam42.wB.userCommands.runComand,
          });
      }
    }
  );

  await roam42.wB.sourceAdd("SmartBlocks", async (context, query, results) => {
    if (context != "-") return;
    const createTagRegex = (tag) => new RegExp(`#?\\[\\[${tag}\\]\\]|#${tag}`);
    let sbList = window.roamAlphaAPI
      .q(
        `[:find ?s ?u :where [?r :block/uid ?u] [?r :block/string ?s] [?r :block/refs ?p] (or [?p :node/title "SmartBlock"] [?p :node/title "42SmartBlock"])]`
      )
      .map(([text, uid]) => ({
        uid,
        name: text
          .replace(createTagRegex("SmartBlock"), "")
          .replace(createTagRegex("42SmartBlock"), "")
          .trim(),
      }));
    for (sb of sbList) {
      results.push({
        display: sb["name"],
        img: roam42.host + "img/wb/sbinwb.png",
        context: "-",
        info: sb,
        cmd: async (cmdInfo) => {
          const targetMatch = window.location.hash.match(/\/page\/(.{9,10})$/);
          const double = (n) => `${n}`.padStart(2, "0");
          return window.roamjs.extension.smartblocks.triggerSmartblock({
            srcUid: cmdInfo.info.uid,
            targetUid: targetMatch
              ? targetMatch[1]
              : `${double(new Date().getMonth() + 1)}-${double(
                  new Date().getDate()
                )}-${new Date().getFullYear()}`,
          });
        },
      });
    }
  });

  await roam42.wB.sourceAdd(
    "Built-in Roam commands",
    async (context, query, results) => {
      let queryLowerCase = query.toLowerCase();
      for await (el of roam42.wB._commands) {
        if (el.context == "*" || el.context == context)
          //applies to all contexts, so include
          await results.push(el);
      }
    }
  );

  // Commands ===================================

  // Format for command array
  // display: text displayed in search
  // cmd: command to be run depending on its type
  // context: command works in the defined context
  //				  * = anywhere
  //					- = from a textarea
  //				  + = multipblock selection
  roam42.wB._commands.push({
    display: "Daily Notes (dn)",
    cmd: () => {
      roam42.common.navigateUiTo(
        roam42.dateProcessing.getRoamDate(new Date()),
        roam42.wB.keystate.shiftKey
      );
    },
    searchText: "dailynotes dn",
    context: "*",
    img: roam42.host + "img/wb/command.png",
  });

  roam42.wB.commandAddRunFromAnywhere = async (
    textToDisplay,
    callbackFunction
  ) => {
    try {
      roam42.common.commandPaletteAdd(
        "(42) " + textToDisplay,
        callbackFunction
      );
    } catch (e) {}
    roam42.wB._commands.push({
      display: textToDisplay,
      searchText: textToDisplay.toLowerCase(),
      img: roam42.host + "img/wb/command.png",
      cmd: callbackFunction,
      context: "*",
    });
  };

  roam42.wB.commandAddRunFromBlock = (textToDisplay, callbackFunction) => {
    roam42.common.commandPaletteAdd("(42) " + textToDisplay, () => {
      const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
      if (uid) {
        const el = document.querySelector(`div[id*="${uid}"]`);
        roam42.wB.triggeredState.activeElementId = el?.id;
        roam42.wB.triggeredState.activeElementSelectionStart =
          el.selectionStart;
        roam42.wB.triggeredState.activeElementSelectionEnd = el.selectionEnd;
      }
      roam42.wB.triggeredState.selectedNodes = document.querySelectorAll(
        `.block-highlight-blue`
      );
      callbackFunction();
    });
    roam42.wB._commands.push({
      display: textToDisplay,
      searchText: textToDisplay.toLowerCase(),
      img: roam42.host + "img/wb/blocksblock.png",
      cmd: callbackFunction,
      context: "-",
    });
  };

  roam42.wB.commandAddRunFromMultiBlockSelection = (
    textToDisplay,
    callbackFunction
  ) => {
    roam42.common.commandPaletteAdd("(42) " + textToDisplay, () => {
      const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
      if (uid) {
        const el = document.querySelector(`div[id*="${uid}"]`);
        roam42.wB.triggeredState.activeElementId = el?.id;
        roam42.wB.triggeredState.activeElementSelectionStart =
          el.selectionStart;
        roam42.wB.triggeredState.activeElementSelectionEnd = el.selectionEnd;
      }
      roam42.wB.triggeredState.selectedNodes = document.querySelectorAll(
        `.block-highlight-blue`
      );
      callbackFunction();
    });
    roam42.wB._commands.push({
      display: textToDisplay,
      searchText: textToDisplay.toLowerCase(),
      img: roam42.host + "img/wb/blocksmulti.png",
      cmd: callbackFunction,
      context: "+",
    });
  };

  // add dependencies
  setTimeout(() => {
    roam42.loader.addScriptToPage(
      "workBenchPath",
      roam42.host + "ext/workBenchPath.js"
    );
    roam42.loader.addScriptToPage(
      "workBenchCmd",
      roam42.host + "ext/workBenchCmd.js"
    );
    roam42.loader.addScriptToPage(
      "workBenchCmd",
      roam42.host + "ext/workBenchUserCmd.js"
    );
  }, 1000);
}; // End of INITIALIZE

// HTML Body ===================================
const appendCP_HTML_ToBody = () => {
  $(document.body).append(`
				<div id="roam42-wB-container" style="visibility:hidden">
					<input placeholder="Type a command" autocomplete="off" class="typeahead" id="roam42-wB-input" type="text">
				</div>`);
}; //end of module

roam42.wB.testReload = () => {
  console.clear(0);
  console.log("reloading wB");
  try {
    roam42.wB.path.fromwB_TestReload();
  } catch (e) {}
  roam42.loader.addScriptToPage("workBench", roam42.host + "ext/workBench.js");
  setTimeout(async () => {
    // cleanup controls if being reinitialized
    try {
      document.querySelector("#roam42-wB-container").remove();
    } catch (e) {}
    try {
      document.querySelector("#roam42-wB-container-style").remove();
    } catch (e) {}
    await roam42.wB.initialize();
  }, 1000);
};
