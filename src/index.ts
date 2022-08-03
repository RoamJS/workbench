/* roam42 namespace structure
  roam42.keyevents         global handler for keyevents (some modules have their own key handling)
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
import * as dailyNotesPopup from "./dailyNotesPopup";
import * as dictionary from "./dictionary";
import * as formatConverter from "./formatConverter";
import * as livePreview from "./livePreview";
import * as jumpnav from "./jumpNav";
import * as privacyMode from "./privacyMode";
import * as quickRef from "./quickRef";
import * as roam42Menu from "./roam42Menu";
import * as roamNavigator from "./deepnav";
import * as stats from "./stats";
import * as tutorials from "./tutorials";
import * as workBench from "./workBench";

declare global {
  interface Window {
    roam42?: {
      buildID: string;
      loader: {
        logo2HC: string;
      };

      common: typeof common;
      dateProcessing: typeof dateProcessing;
      help: typeof help;
      settings: typeof settings;

      dailyNotesPopup: typeof dailyNotesPopup;
      formatConverter: typeof formatConverter;
      jumpnav: typeof jumpnav;
      livePreview: typeof livePreview;
      privacyMode: typeof privacyMode;
      quickRef: typeof quickRef;
      roam42Menu: typeof roam42Menu;
      roamNavigator: typeof roamNavigator;
      stats: typeof stats;
      tutorials: typeof tutorials;
      typeAhead: typeof dictionary;
      workBench: typeof workBench;
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
        help,
        settings,

        dailyNotesPopup,
        formatConverter,
        jumpnav,
        livePreview,
        privacyMode,
        quickRef,
        roam42Menu,
        roamNavigator,
        stats,
        tutorials,
        typeAhead: dictionary,
        workBench,
      };
      window.roam42KeyboardLib = roam42KeyboardLib;

      extensionAPI.settings.panel.create({
        tabTitle: "WorkBench (Roam42)",
        settings: [
          {
            id: "dailyNotesPopup",
            name: "Daily Notes Popup",
            action: {
              type: "switch",
              onChange: (e) => dailyNotesPopup.toggleFeature(e.target.checked),
            },
            description: "A popup window with the current Daily Notes Page",
          },
          {
            id: "dictionary",
            name: "Dictionary",
            action: {
              type: "switch",
              onChange: (e) => dictionary.toggleFeature(e.target.checked),
            },
            description: "Look up terms in the dictionary",
          },
          {
            id: "formatConverter",
            name: "Format Converter",
            action: {
              type: "switch",
              onChange: (e) => formatConverter.toggleFeature(e.target.checked),
            },
            description: "Outputs the current page to various formats",
          },
          {
            id: "jumpNav",
            name: "Jump Navigation",
            action: {
              type: "switch",
              onChange: (e) => jumpnav.toggleFeature(e.target.checked),
            },
            description: "Hot Keys for easy Jump Navigation",
          },
          {
            id: "livePreview",
            name: "Live Preview",
            action: {
              type: "switch",
              onChange: (e) => livePreview.toggleFeature(e.target.checked),
            },
            description: "Live preview pages upon hovering over tag",
          },
          {
            id: "privacyMode",
            name: "Privacy Mode",
            description: "Redacts content from your Roam",
            action: {
              type: "switch",
              onChange: (e) => privacyMode.toggleFeature(e.target.checked),
            },
          },
          {
            id: "quickRef",
            name: "Quick Reference",
            action: {
              type: "switch",
              onChange: (e) => quickRef.toggleFeature(e.target.checked),
            },
            description:
              "A quick help section of WorkBench's and Roam's features",
          },
          {
            id: "roam42Menu",
            name: "Roam42 Menu",
            action: {
              type: "switch",
              onChange: (e) => roam42Menu.toggleFeature(e.target.checked),
            },
            description: "Help menu that appears on the top right",
          },
          {
            id: "roamNavigator",
            name: "Deep Nav",
            action: {
              type: "switch",
              onChange: (e) => roamNavigator.toggleFeature(e.target.checked),
            },
            description: "Help menu that appears on the top right",
          },
          {
            id: "stats",
            name: "Stats",
            action: {
              type: "switch",
              onChange: (e) => stats.toggleFeature(e.target.checked),
            },
            description: "Get stats on your Roam usage",
          },
          {
            id: "tutorials",
            name: "Tutorials",
            action: {
              type: "switch",
              onChange: (e) => tutorials.toggleFeature(e.target.checked),
            },
            description:
              "Learn how to use WorkBench features and Roam basics right from within Roam",
          },
          {
            id: "workBench",
            name: "Command Palette Commands",
            action: {
              type: "switch",
              onChange: (e) => workBench.toggleFeature(e.target.checked),
            },
            description:
              "Whether or not to include the core set of workBench commands in the Roam Command Palette",
          },
        ],
      });

      dailyNotesPopup.toggleFeature(
        !!extensionAPI.settings.get("dailyNotesPopup")
      );
      dictionary.toggleFeature(!!extensionAPI.settings.get("dictionary"));
      formatConverter.toggleFeature(
        !!extensionAPI.settings.get("formatConverter")
      );
      jumpnav.toggleFeature(!!extensionAPI.settings.get("jumpNav"));
      livePreview.toggleFeature(!!extensionAPI.settings.get("livePreview"));
      privacyMode.toggleFeature(!!extensionAPI.settings.get("privacyMode"));
      quickRef.toggleFeature(!!extensionAPI.settings.get("quickRef"));
      roam42Menu.toggleFeature(!!extensionAPI.settings.get("roam42Menu"));
      roamNavigator.toggleFeature(!!extensionAPI.settings.get("roamNavigator"));
      tutorials.toggleFeature(!!extensionAPI.settings.get("tutorials"));
      workBench.toggleFeature(!!extensionAPI.settings.get("workBench"));

      roam42.keyevents.loadKeyEvents();
      roam42.loader.addScriptToPage(
        "keyEvents",
        roam42.host + "common/keyevents.js"
      );
    }
  },
});
