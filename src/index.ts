/* roam42 namespace structure
  roam42.keyevents         global handler for keyevents (some modules have their own key handling)
  roam42.quickRef          quick reference system
  roam42.dailyNotesPopup   Dialy notes popup
  roam42.livePreview       Live preview features
  roam42.privacyMode       Redacts content from your Roam
  roam42.formatConverter   converts current page to various formats
  roam42.formatConverterUI UI to roam42.formatConverter
	roam42.workBench				 Workbench engine
  roam42.KeyboardLib       imported from another library. so letting it stand as its own object
*/
import runExtension from "roamjs-components/util/runExtension";
import "roamjs-components/types";

// common
import * as common from "./commonFunctions";
import * as dateProcessing from "./dateProcessing";
import * as roam42KeyboardLib from "./r42kb_lib";
import * as settings from "./settings";
import * as help from "./help";

// exts
import * as jumpnav from "./jumpNav";
import * as quickRef from "./quickRef";

declare global {
  interface Window {
    roam42?: {
      buildID: string;
      loader: {
        logo2HC: string;
      };

      common: typeof common;
      dateProcessing: typeof dateProcessing;
      settings: typeof settings;
      help: typeof help;

      jumpnav: typeof jumpnav;
      quickRef: typeof quickRef;
    };
    loadRoam42InMobile?: boolean;
    roam42KeyboardLib: typeof roam42KeyboardLib;
  }
}

const extensionId = "workbench";

export default runExtension({
  extensionId,
  run: ({ extensionAPI }) => {
    if (
      typeof window.roam42 == "undefined" &&
      !(
        window.roamAlphaAPI.platform.isMobile &&
        (typeof window.loadRoam42InMobile === "undefined" ||
          !window.loadRoam42InMobile)
      )
    ) {
      window.roam42 = {
        buildID: process.env.ROAMJS_VERSION || "Version Not Found",
        loader: {
          logo2HC:
            "https://raw.githubusercontent.com/dvargas92495/roamjs-workbench/img/logo/42logo-2hc.png",
        },

        common,
        dateProcessing,
        settings,
        help,

        jumpnav,
        quickRef,
      };
      window.roam42KeyboardLib = roam42KeyboardLib;

      extensionAPI.settings.panel.create({
        tabTitle: "WorkBench (Roam42)",
        settings: [
          {
            id: "jumpNav",
            name: "Jump Navigation",
            action: {
              type: "switch",
              onChange: (e) => jumpnav.toggle(e.target.checked),
            },
            description: "Hot Keys for easy Jump Navigation",
          },
          {
            id: "quickRef",
            name: "Quick Reference",
            action: {
              type: "switch",
              onChange: (e) => quickRef.toggle(e.target.checked),
            },
            description: "A quick help section of WorkBench's and Roam's features",
          },
        ],
      });

      jumpnav.toggle(!!extensionAPI.settings.get("jumpNav"));
      quickRef.toggle(!!extensionAPI.settings.get("quickRef"));

      //extension modules
      roam42.loader.addScriptToPage(
        "privacyMode",
        roam42.host + "ext/privacyMode.js"
      );
      roam42.loader.addScriptToPage(
        "roam42Menu",
        roam42.host + "ext/roam42Menu.js"
      );
      roam42.loader.addScriptToPage(
        "roam42Tutorials",
        roam42.host + "ext/tutorials.js"
      );
      roam42.loader.addScriptToPage(
        "roamNavigator",
        roam42.host + "ext/roam-navigator.js"
      );
      roam42.loader.addScriptToPage("stats", roam42.host + "ext/stats.js");

      roam42.typeAhead.loadTypeAhead();
      roam42.loader.addScriptToPage(
        "lookupUI",
        roam42.host + "ext/typeaheadUI.js"
      );
      
      roam42.loader.addScriptToPage(
        "typeAheadData",
        roam42.host + "ext/typeaheadData.js"
      );
      roam42.loader.addScriptToPage(
        "formatConverter",
        roam42.host + "ext/formatConverter.js"
      );
      roam42.loader.addScriptToPage(
        "formatConverterUI",
        roam42.host + "ext/formatConverterUI.js"
      );
      roam42.loader.addScriptToPage(
        "livePreview",
        roam42.host + "ext/livePreview.js"
      );
      roam42.loader.addScriptToPage(
        "dailyNote",
        roam42.host + "ext/dailyNotesPopup.js"
      );
      roam42.loader.addScriptToPage(
        "workBench",
        roam42.host + "ext/workBench.js"
      );
      roam42.loader.addCSSToPage(
        "workBenchCss",
        roam42.host + "css/workBench.css"
      );

      roam42.keyevents.loadKeyEvents();
      roam42.loader.addScriptToPage(
        "keyEvents",
        roam42.host + "common/keyevents.js"
      );

      // Give the libraries a few seconds to get comfy in their new home
      // and then let the extension dance, that is to say,
      // begin initializing the environment with all the cool tools

      var loadingCounter = 0;

      const interval = setInterval(async () => {
        if (roam42.keyevents) {
          clearInterval(interval);
          try {
          } catch (e) {}
          const initializeWb = (counter) =>
            setTimeout(() => {
              if (roam42.wB) {
                try {
                  roam42.wB.initialize();
                } catch (e) {}
              } else if (counter > 100) {
                console.error("Failed to initalize workbench after 100 tries");
              } else {
                initializeWb(counter + 1);
              }
            }, 1000);
          if (window === window.parent) initializeWb(0);
          try {
            roam42.user = roam42.common.getUserInformation();
          } catch (e) {}

          try {
            if (window === window.parent) {
              try {
                await roam42.dailyNotesPopup.component.initialize();
              } catch (e) {}
            }
          } catch (e) {}
          try {
            setTimeout(async () => {
              await roam42.roam42Menu.initialize();
              document.body.dispatchEvent(new Event("roamjs:roam42:loaded"));
            }, 2000);
          } catch (e) {}
        } else {
          if (loadingCounter > 30) clearInterval(interval);
          else loadingCounter += 1;
        }
      }, 3000);
    }
  },
});
