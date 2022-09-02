import runExtension from "roamjs-components/util/runExtension";
import "roamjs-components/types";

// exts
import * as dailyNotesPopup from "./ext/dailyNotesPopup";
import * as dictionary from "./ext/dictionary";
import * as formatConverter from "./ext/formatConverter";
import * as livePreview from "./ext/livePreview";
import * as jumpnav from "./ext/jumpNav";
import * as privacyMode from "./privacyMode";
import * as quickRef from "./quickRef";
import * as roam42Menu from "./roam42Menu";
import * as roamNavigator from "./ext/deepnav";
import * as stats from "./stats";
import * as tutorials from "./tutorials";
import * as workBench from "./ext/workBench";

declare global {
  interface Window {
    roam42?: {
      buildID: string;
    };
  }
}

const extensionId = "workbench";
let unload: () => void;

export default runExtension({
  extensionId,
  run: ({ extensionAPI, extension }) => {
    window.roam42 = {
      buildID: extension.version,
    };

    extensionAPI.settings.panel.create({
      tabTitle: "WorkBench",
      settings: [
        {
          id: "workBench",
          name: "Command Palette+",
          action: {
            type: "switch",
            onChange: (e) => workBench.toggleFeature(e.target.checked),
          },
          description:
            "Whether or not to include the core set of workBench commands in the Roam Command Palette",
        },
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
          id: "roamNavigator",
          name: "Deep Nav",
          action: {
            type: "switch",
            onChange: (e) => roamNavigator.toggleFeature(e.target.checked),
          },
          description: "Quick navigation through Roam's UI using the keyboard",
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
          name: "Hot Keys",
          action: {
            type: "switch",
            onChange: (e) => jumpnav.toggleFeature(e.target.checked),
          },
          description:
            "Keyboard shortcuts for interacting with the Roam user interface",
        },
        {
          id: "livePreview",
          name: "Live Preview",
          action: {
            type: "switch",
            onChange: (e) => livePreview.toggleFeature(e.target.checked),
          },
          description:
            "See live and editable preview of pages upon hovering over tags and page links",
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

        // TODO: Combine the bottom four into one tutorials feature
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
      ],
    });

    workBench.toggleFeature(!!extensionAPI.settings.get("workBench"));
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

    const keyDownListener = (ev: KeyboardEvent) => {
      try {
        if (quickRef.component.keyboardHandler(ev)) {
          return;
        }
      } catch (e) {}

      //Date NLP - move to auto tag
      // if (ev.altKey && ev.shiftKey && ev.code == "KeyD") {
      //   if (target.nodeName === "TEXTAREA") {
      //     var processText = dateProcessing.parseTextForDates(
      //       (target as HTMLTextAreaElement).value
      //     );
      //     common.setEmptyNodeValue(
      //       document.getElementById(target.id),
      //       processText
      //     );
      //     ev.preventDefault();
      //     ev.stopPropagation();
      //   }
      //   return;
      // }
    };

    document.addEventListener("keydown", keyDownListener);

    unload = () => {
      workBench.toggleFeature(false);
      dailyNotesPopup.toggleFeature(false);
      roamNavigator.toggleFeature(false);
      dictionary.toggleFeature(false);
      formatConverter.toggleFeature(false);
      jumpnav.toggleFeature(false);
      livePreview.toggleFeature(false);
      privacyMode.toggleFeature(false);
      
      quickRef.toggleFeature(false);
      roam42Menu.toggleFeature(false);
      tutorials.toggleFeature(false);
      stats.toggleFeature(false);
    };
    return {
      domListeners: [
        { el: document, type: "keydown", listener: keyDownListener },
      ],
    };
  },
  unload: () => unload(),
});
