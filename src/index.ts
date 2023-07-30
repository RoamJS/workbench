import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";

// features
import * as alert from "./features/alert";
import * as article from "./features/article";
import * as dailyNotesPopup from "./features/dailyNotesPopup";
import * as decorators from "./features/decorators";
import * as dictionary from "./features/dictionary";
import * as formatConverter from "./features/formatConverter";
import * as livePreview from "./features/livePreview";
import * as jumpnav from "./features/jumpNav";
import * as mindmap from "./features/mindmap";
import * as privacyMode from "./features/privacyMode";
import * as roamNavigator from "./features/deepnav";
import * as ocr from "./features/ocr";
import * as workBench from "./features/workBench";
import * as tagCycle from "./features/tagCycle";
import * as tally from "./features/tally";
import * as tutorials from "./features/tutorials";
import * as weeklyNotes from "./features/weekly-notes";

const FEATURES = [
  {
    id: "alert",
    name: "Alert",
    description: "Schedule reminders that are triggered by Roam.",
    module: alert,
  },
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
    id: "decorators",
    name: "Decorated Blocks",
    module: decorators,
    description:
      "Decorates blocks with various configurable features for quick actions.",
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
    id: "ocr",
    name: "Image OCR",
    description: "Extract the text from an image and add it as child blocks!",
    module: ocr,
  },
  {
    id: "article",
    name: "Import Article",
    description: "Add commands to import web articles directly into Roam",
    module: article,
  },
  {
    id: "livePreview",
    name: "Live Preview",
    module: livePreview,
    description:
      "See live and editable preview of pages upon hovering over tags and page links",
  },
  {
    id: "mindmap",
    name: "Mind Map",
    module: mindmap,
    description: "Visualize pieces of your Roam graph as a mindmap!",
  },
  {
    id: "privacyMode",
    name: "Privacy Mode",
    description: "Redacts content from your Roam",
    module: privacyMode,
  },
  {
    id: "tag-cycle",
    name: "Tag Cycle",
    module: tagCycle,
    description: "Define custom cycles tied to a keyboard shortcut!",
  },
  {
    id: "tally",
    name: "Tally Button",
    module: tally,
    description:
      "Introduce a tally button component to use directly in your Roam graph!",
  },
  {
    id: "tutorials",
    name: "Tutorials",
    module: tutorials,
    description:
      "Learn how to use WorkBench features and Roam basics right from within Roam",
  },
  {
    id: "weekly-notes",
    name: "Weekly Notes",
    module: weeklyNotes,
    description: "Enabling workflows surrounding weekly note pages.",
  },
];

export default runExtension(async ({ extensionAPI, extension }) => {
  tutorials.setVersion(extension.version);

  extensionAPI.settings.panel.create({
    tabTitle: "WorkBench",
    settings: FEATURES.map((f) => ({
      id: f.id,
      description: f.description,
      name: f.name,
      action: {
        type: "switch",
        onChange: (e) => f.module.toggleFeature(e.target.checked, extensionAPI),
      },
    })),
  });

  const flags: boolean[] = [];

  FEATURES.forEach(({ id, module }) => {
    const flag = extensionAPI.settings.get(id);
    const unset = typeof flag === "undefined" || flag === null;
    flags.push(unset || flag === false ? false : (flag as boolean));
    module.toggleFeature(unset ? false : (flag as boolean), extensionAPI);
  });

  if (!flags.some((flag) => flag)) {
    renderToast({
      id: "roamjs-workbench-features-disabled",
      // code format below intentional to preserve newlines
      content: `WorkBench features are **disabled** by default.

Enable them in the WorkBench settings tab!
      `,
    });
  }

  return () => {
    FEATURES.forEach(({ module }) => {
      module.toggleFeature(false, extensionAPI);
    });
  };
});
