import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";
import React from "react";
import { AnchorButton, Button } from "@blueprintjs/core";
import addStyle from "roamjs-components/dom/addStyle";
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

type Feature = {
  id: string;
  name: string;
  description: string;
  module: any;
  docs: string;
  settings?: boolean;
};
const FEATURES = [
  {
    id: "alert",
    name: "Alert",
    description: "Schedule reminders that are triggered by Roam.",
    module: alert,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/alert.md",
  },
  {
    id: "workBench",
    name: "Command Palette+",
    description:
      "Whether or not to include the core set of workBench commands in the Roam Command Palette",
    module: workBench,
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/command-palette-plus.md",
  },
  {
    id: "dailyNotesPopup",
    name: "Daily Notes Popup",
    module: dailyNotesPopup,
    description: "A popup window with the current Daily Notes Page",
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/daily-note-popup.md",
  },
  {
    id: "decorators",
    name: "Decorated Blocks",
    module: decorators,
    description:
      "Decorates blocks with various configurable features for quick actions.",
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/decorated-blocks.md",
  },
  {
    id: "roamNavigator",
    name: "Deep Nav",
    module: roamNavigator,
    description: "Quick navigation through Roam's UI using the keyboard",
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/deep-nav.md",
  },
  {
    id: "dictionary",
    name: "Dictionary",
    module: dictionary,
    description: "Look up terms in the dictionary",
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/dictionary.md",
  },
  {
    id: "formatConverter",
    name: "Format Converter",
    module: formatConverter,
    description: "Outputs the current page to various formats",
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/format-converter.md",
  },
  {
    id: "jumpNav",
    name: "Hot Keys",
    module: jumpnav,
    description:
      "Keyboard shortcuts for interacting with the Roam user interface",
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/hot-keys.md",
  },
  {
    id: "ocr",
    name: "Image OCR",
    description: "Extract the text from an image and add it as child blocks!",
    module: ocr,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/image-ocr.md",
  },
  {
    id: "article",
    name: "Import Article",
    description: "Add commands to import web articles directly into Roam",
    module: article,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/import-article.md",
  },
  {
    id: "livePreview",
    name: "Live Preview",
    module: livePreview,
    description:
      "See live and editable preview of pages upon hovering over tags and page links",
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/live-preview.md",
  },
  {
    id: "mindmap",
    name: "Mind Map",
    module: mindmap,
    description: "Visualize pieces of your Roam graph as a mindmap!",
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/mindmap.md",
  },
  {
    id: "privacyMode",
    name: "Privacy Mode",
    description: "Redacts content from your Roam",
    module: privacyMode,
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/privacy-mode.md",
  },
  {
    id: "tag-cycle",
    name: "Tag Cycle",
    module: tagCycle,
    description: "Define custom cycles tied to a keyboard shortcut!",
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/tag-cycle.md",
  },
  {
    id: "tally",
    name: "Tally Button",
    module: tally,
    description:
      "Introduce a tally button component to use directly in your Roam graph!",
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/tag-cycle.md",
  },
  {
    id: "tutorials",
    name: "Tutorials",
    module: tutorials,
    description:
      "Learn how to use WorkBench features and Roam basics right from within Roam",
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/tutorials.md",
  },
  {
    id: "weekly-notes",
    name: "Weekly Notes",
    module: weeklyNotes,
    description: "Enabling workflows surrounding weekly note pages.",
    settings: true,
    docs: "https://github.com/RoamJs/workbench/blob/main/docs/weekly-notes.md",
  },
];

export default runExtension(async ({ extensionAPI, extension }) => {
  tutorials.setVersion(extension.version);

  const el = React.createElement;

  const settingsStyle = {
    maxWidth: "25px",
    minWidth: "initial",
    textAlign: "center",
  };
  const featureStyle = {
    textAlign: "left",
  };

  const createDocsButton = (docs: string) => {
    return React.createElement(AnchorButton, {
      intent: "primary",
      icon: "document-open",
      href: docs,
    });
  };

  const settingsButton = React.createElement(AnchorButton, {
    intent: "primary",
    icon: "cog",
    onClick: () => {
      console.log("Button clicked!");
    },
  });

  const SettingsHeader = (header: string) => {
    const isSetting = ["Documentation", "Settings", "Enabled"].includes(header);
    return el(
      "th",
      {
        key: header,
        style: isSetting ? settingsStyle : featureStyle,
      },
      header
    );
  };

  const SettingsRow = ({ id, name, settings, docs }: Feature) => {
    return el(
      "tr",
      { key: id },
      el("td", { style: featureStyle }, name),
      el("td", { style: settingsStyle }, createDocsButton(docs)),
      el("td", { style: settingsStyle }, settings ? settingsButton : null),
      el(
        "td",
        { style: settingsStyle },
        el("input", {
          type: "checkbox",
          checked: extensionAPI.settings.get(id) as boolean,
          onChange: (e) => {
            // create state to update checkbox frontend?
            extensionAPI.settings.set(id, e.target.checked);
          },
        })
      )
    );
  };

  const SettingsTable = () => {
    return el(
      "div",
      {
        style: {
          width: "100%",
          marginLeft: "10px",
        },
      },
      el(
        "table",
        {},
        el(
          "thead",
          {},
          el(
            "tr",
            {},
            ["Feature", "Documentation", "Settings", "Enabled"].map(
              SettingsHeader
            )
          )
        ),
        el("tbody", {}, FEATURES.map(SettingsRow))
      )
    );
  };

  extensionAPI.settings.panel.create({
    tabTitle: "WorkBench",
    settings: [
      {
        id: "id",
        description: "",
        name: "WorkBench Features",
        action: {
          type: "reactComponent",
          component: SettingsTable,
        },
      },
    ],
  });

  // Hide panel "name"

  const devPanelId =
    "bp3-tab-panel_rm-settings-tabs_rm-ext-uuide937b389-ef92-4d5e-a4b9-7db577a129a4-tab";
  const style = addStyle(`
  [id*="dvargas92495"][id*="workbench"] section.rm-settings-panel__section.flex-h-box.rm-settings-panel__section--top > div > h4 { 
    display: none; }
  #${devPanelId} section.rm-settings-panel__section.flex-h-box.rm-settings-panel__section--top > div > h4 { 
    display: none; }
  }`);

  const flags: boolean[] = [];

  FEATURES.forEach(({ id, module }) => {
    const flag = extensionAPI.settings.get(id);
    const unset = typeof flag === "undefined" || flag === null;
    if (unset) extensionAPI.settings.set(id, false);
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

  return {
    elements: [style],
    unload: () => {
      FEATURES.forEach(({ module }) => {
        module.toggleFeature(false, extensionAPI);
      });
    },
  };
});
