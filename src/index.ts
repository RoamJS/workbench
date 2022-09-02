import runExtension from "roamjs-components/util/runExtension";
import "roamjs-components/types";

// features
import * as dailyNotesPopup from "./features/dailyNotesPopup";
import * as dictionary from "./features/dictionary";
import * as formatConverter from "./features/formatConverter";
import * as livePreview from "./features/livePreview";
import * as jumpnav from "./features/jumpNav";
import * as privacyMode from "./features/privacyMode";
import * as roamNavigator from "./features/deepnav";
import * as workBench from "./features/workBench";
import * as tutorials from "./features/tutorials";

const extensionId = "workbench";
const FEATURES = [
  {
    id: "workBench",
    name: "Command Palette+",
    description:
      "Whether or not to include the core set of workBench commands in the Roam Command Palette",
    module: workBench,
  },
  {
    id: "dailyNotesPopup",
    name: "Daily Notes Popup",
    module: dailyNotesPopup,
    description: "A popup window with the current Daily Notes Page",
  },
  {
    id: "roamNavigator",
    name: "Deep Nav",
    module: roamNavigator,
    description: "Quick navigation through Roam's UI using the keyboard",
  },
  {
    id: "dictionary",
    name: "Dictionary",
    module: dictionary,
    description: "Look up terms in the dictionary",
  },
  {
    id: "formatConverter",
    name: "Format Converter",
    module: formatConverter,
    description: "Outputs the current page to various formats",
  },
  {
    id: "jumpNav",
    name: "Hot Keys",
    module: jumpnav,
    description:
      "Keyboard shortcuts for interacting with the Roam user interface",
  },
  {
    id: "livePreview",
    name: "Live Preview",
    module: livePreview,
    description:
      "See live and editable preview of pages upon hovering over tags and page links",
  },
  {
    id: "privacyMode",
    name: "Privacy Mode",
    description: "Redacts content from your Roam",
    module: privacyMode,
  },
  {
    id: "tutorials",
    name: "Tutorials",
    module: tutorials,
    description:
      "Learn how to use WorkBench features and Roam basics right from within Roam",
  },
];

export default runExtension({
  extensionId,
  run: ({ extensionAPI, extension }) => {
    tutorials.setVersion(extension.version);

    extensionAPI.settings.panel.create({
      tabTitle: "WorkBench",
      settings: FEATURES.map((f) => ({
        id: f.id,
        description: f.description,
        name: f.name,
        action: {
          type: "switch",
          onChange: (e) => f.module.toggleFeature(e.target.checked),
        },
      })),
    });

    FEATURES.forEach(({ id, module }) => {
      const flag = extensionAPI.settings.get(id);
      const unset = typeof flag === "undefined" || flag === null;
      if (unset) extensionAPI.settings.set(id, true);
      module.toggleFeature(unset || (flag as boolean));
    });

    return () => {
      FEATURES.forEach(({ module }) => module.toggleFeature(false));
    };
  },
});
