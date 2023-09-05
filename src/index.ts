import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";
import addStyle from "roamjs-components/dom/addStyle";
// features
import * as alert from "./features/alert";
import * as article from "./features/article";
import * as attributeSelect from "./features/attributeSelect";
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
import * as table from "./features/table";
import * as tagCycle from "./features/tagCycle";
import * as tally from "./features/tally";
import * as tutorials from "./features/tutorials";
import * as weeklyNotes from "./features/weekly-notes";
import SettingsTable from "./components/SettingsTable";

export type Feature = {
  id: string;
  name: string;
  description: string;
  module: any;
  docs: string;
  gif: string;
  // settings: any;
};
const FEATURES = [
  {
    id: "alert",
    name: "Alert",
    description: "Schedule reminders that are triggered by Roam.",
    module: alert,
    docs: "alert.md",
    gif: "short-demo-alert",
  },
  {
    id: "attributeSelect",
    name: "Attribute Select",
    description: "Create Dropdowns to fill in Attribute values.",
    module: attributeSelect,
    docs: "alert.md",
    gif: "short-demo-alert",
  },
  {
    id: "workBench",
    name: "Command Palette+",
    description:
      "Whether or not to include the core set of workBench commands in the Roam Command Palette",
    module: workBench,
    // settings: commandPalettePlusSettings,
    docs: "command-palette-plus.md",
    gif: "short-demo-commandpaletteplus",
  },
  {
    id: "dailyNotesPopup",
    name: "Daily Notes Popup",
    module: dailyNotesPopup,
    description: "A popup window with the current Daily Notes Page",
    // settings: dailyNotesPopupSettings,
    docs: "daily-note-popup.md",
    gif: "short-demo-dnp",
  },
  {
    id: "decorators",
    name: "Decorated Blocks",
    module: decorators,
    description:
      "Decorates blocks with various configurable features for quick actions.",
    // settings: decoratedBlocksSettings,
    docs: "decorated-blocks.md",
    gif: "short-demo-decorated-blocks",
  },
  {
    id: "roamNavigator",
    name: "Deep Nav",
    module: roamNavigator,
    description: "Quick navigation through Roam's UI using the keyboard",
    docs: "deep-nav.md",
    gif: "short-demo-deep-nav",
  },
  {
    id: "dictionary",
    name: "Dictionary",
    module: dictionary,
    description: "Look up terms in the dictionary",
    // settings: dictionarySettings,
    docs: "dictionary.md",
    gif: "short-demo-dictionary",
  },
  {
    id: "formatConverter",
    name: "Format Converter",
    module: formatConverter,
    description: "Outputs the current page to various formats",
    docs: "format-converter.md",
    gif: "short-demo-format-converter",
  },
  {
    id: "jumpNav",
    name: "Hot Keys",
    module: jumpnav,
    description:
      "Keyboard shortcuts for interacting with the Roam user interface",
    docs: "hot-keys.md",
    gif: "short-demo-hot-keys",
  },
  {
    id: "ocr",
    name: "Image OCR",
    description: "Extract the text from an image and add it as child blocks!",
    module: ocr,
    docs: "image-ocr.md",
    gif: "short-demo-image-ocr",
  },
  {
    id: "article",
    name: "Import Article",
    description: "Add commands to import web articles directly into Roam",
    module: article,
    docs: "import-article.md",
    gif: "short-demo-import-article",
  },
  {
    id: "livePreview",
    name: "Live Preview",
    module: livePreview,
    description:
      "See live and editable preview of pages upon hovering over tags and page links",
    // settings: livePreviewSettings,
    docs: "live-preview.md",
    gif: "short-demo-live-preview",
  },
  {
    id: "mindmap",
    name: "Mind Map",
    module: mindmap,
    description: "Visualize pieces of your Roam graph as a mind map!",
    docs: "mindmap.md",
    gif: "short-demo-mind-map",
  },
  {
    id: "privacyMode",
    name: "Privacy Mode",
    description: "Redacts content from your Roam",
    module: privacyMode,
    // settings: privacyModeSettings,
    docs: "privacy-mode.md",
    gif: "short-demo-privacy-mode",
  },
  {
    id: "table",
    name: "Table",
    module: table,
    description: "Editable table component.",
    docs: "table.md",
    gif: "short-demo-table",
  },
  {
    id: "tag-cycle",
    name: "Tag Cycle",
    module: tagCycle,
    description: "Define custom cycles tied to a keyboard shortcut!",
    // settings: tagCycleSettings,
    docs: "tag-cycle.md",
    gif: "short-demo-tag-cycle",
  },
  {
    id: "tally",
    name: "Tally Button",
    module: tally,
    description:
      "Introduce a tally button component to use directly in your Roam graph!",
    docs: "tag-cycle.md",
    gif: "short-demo-tally",
  },
  {
    id: "tutorials",
    name: "Tutorials",
    module: tutorials,
    description:
      "Learn how to use WorkBench features and Roam basics right from within Roam",
    docs: "tutorials.md",
    gif: "short-demo-tutorials",
  },
  {
    id: "weekly-notes",
    name: "Weekly Notes",
    module: weeklyNotes,
    description: "Enabling workflows surrounding weekly note pages.",
    // settings: weeklyNotesSettings,
    docs: "weekly-notes.md",
    gif: "short-demo-weekly-note",
  },
];

export default runExtension(async ({ extensionAPI, extension }) => {
  tutorials.setVersion(extension.version);

  const initialSettings: { [key: string]: boolean } = {};
  FEATURES.forEach(({ id, module }) => {
    const flag = extensionAPI.settings.get(id);
    initialSettings[id] = !!flag;
    module.toggleFeature(flag as boolean, extensionAPI);
  });

  extensionAPI.settings.panel.create({
    tabTitle: "WorkBench",
    settings: [
      {
        id: "id",
        description: "",
        name: "WorkBench Features",
        action: {
          type: "reactComponent",
          component: SettingsTable(FEATURES, extensionAPI),
        },
      },
    ],
  });

  // Hide panel "name"

  const style = addStyle(`
  [id*="dvargas92495"][id*="workbench"] section.rm-settings-panel__section.flex-h-box.rm-settings-panel__section--top > div > h4 { 
    display: none; }
  `);

  if (!Object.values(initialSettings).some((flag) => flag)) {
    renderToast({
      id: "roamjs-workbench-features-disabled",
      // code format below intentional to preserve newlines
      content: `WorkBench features are **disabled** by default.

Enable them in the WorkBench settings tab!
    `,
    });
  }

  return {
    elements: [style],
    unload: () => {
      FEATURES.forEach(({ module }) => {
        module.toggleFeature(false, extensionAPI);
      });
    },
  };
});
