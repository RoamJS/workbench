import tippyJs, { Instance } from "tippy.js";
import {
  component as dnpComponent,
  state as dnpState,
} from "./features/dailyNotesPopup";
import { enabled as typeAheadEnabled, typeAheadLookup } from "./features/dictionary";
import {
  enabled as formatConverterEnabled,
  htmlview,
  show as formatConverterShow,
} from "./features/formatConverter";
import {
  enabled as privacyEnabled,
  active as privacyActive,
  toggle as privacyToggle,
} from "./features/privacyMode";
import React from "react";
import ReactDOM from "react-dom";
import { Button, Menu, MenuItem } from "@blueprintjs/core";
import { component as qrComponent } from "./quickRef";
import { show as tutorialShow } from "./features/tutorials";
import { displayGraphStats, enabled } from "./stats";
import {
  enabled as deepNavEnabled,
  navigate as triggerDeepNav,
} from "./features/deepnav";
import { enabled as livePreviewState } from "./features/livePreview";

export let tippy: Instance = undefined;
export const toggleFeature = (flag: boolean) => {
  if (flag) initialize();
  else {
    document.querySelector("#roam42-menu")?.remove();
    document.querySelector("#roam42-menu-spacer")?.remove();
  }
};

export const initialize = async () => {
  if (window != window.parent) {
    return; //don't load if in a iframe
  }
  await createMenu();

  var trackTopbarUpdate = false;
  document.querySelector(".rm-topbar").addEventListener(
    "DOMNodeInserted",
    () => {
      if (trackTopbarUpdate == false) {
        trackTopbarUpdate = true;
        setTimeout(() => {
          var roamTopbar = document.querySelectorAll(
            ".rm-topbar .bp3-popover-wrapper"
          );
          var positionInToolbar =
            document.querySelector(".rm-topbar .bp3-icon-menu-closed")?.children
              .length > 0
              ? 2
              : 1;
          var nextIconButton =
            roamTopbar[roamTopbar.length - positionInToolbar];
          nextIconButton.insertAdjacentElement(
            "afterend",
            document.querySelector("#roam42-menu")
          );
          nextIconButton.insertAdjacentElement(
            "afterend",
            document.querySelector("#roam42-button-jumptodate")
          );
          trackTopbarUpdate = false;
        }, 100);
      }
    },
    false
  ); //end of event hanlder
};

export const createMenu = () => {
  //create menu item
  var menu = document.createElement("div");
  menu.id = "roam42-menu";
  menu.className =
    "bp3-button bp3-minimal bp3-small bp3-icon-vertical-distribution";
  menu.setAttribute("style", "left:2px;");
  var roamTopbar = document.querySelectorAll(".rm-topbar .bp3-popover-wrapper");
  var positionInToolbar =
    document.querySelector(".rm-topbar .bp3-icon-menu-closed")?.children
      .length > 0
      ? 2
      : 1;
  var nextIconButton = roamTopbar[roamTopbar.length - positionInToolbar];
  nextIconButton.insertAdjacentElement("afterend", menu);

  tippy = tippyJs(menu, {
    allowHTML: true,
    interactive: true,
    interactiveBorder: 5,
    arrow: false,
    trigger: "click",
    // position: "auto",
    onShow(instance) {
      setTimeout(async () => {
        var elem = document.getElementById(instance.popper.id)
          .firstElementChild as HTMLDivElement;
        if (window.innerWidth < elem.getBoundingClientRect().right)
          elem.style.left =
            "-" + Number(elem.style.width.replace("px", "")) + "px";
        instance.setContent(displayMenu());
      }, 50);
    },
    onMount(instance) {
      setTimeout(async () => {
        var bck = document.querySelector<HTMLDivElement>(
          "#roam42-menu + div .tippy-box"
        );
        try {
          bck.style.width = "240px";
          bck.classList.add("bp3-popover");
        } catch (e) {}
        instance.setContent(displayMenu()); //force content in for sizing
      }, 50);
    },
  });

  tippyJs(menu, {
    content: `<div class="bp3-popover-content">Roam42 </div>`,
    allowHTML: true,
    arrow: false,
    theme: "light-border",
  });
};

export const displayMenu = () => {
  const menu = document.createElement("div");
  menu.className = "bp3-popover-content";

  ReactDOM.render(
    <>
      <Menu>
        {dnpState != undefined && dnpState != "off" && (
          <MenuItem
            onClick={() => {
              tippy.hide();
              dnpComponent.toggleVisible();
            }}
          >
            <Button icon={"timeline-events"} minimal small />
            Daily Notes <span style={{ fontSize: "7pt" }}>(Alt-Shift-,)</span>
          </MenuItem>
        )}
        {typeAheadEnabled && (
          <MenuItem
            onClick={() => {
              tippy.hide();
              typeAheadLookup();
            }}
          >
            <Button icon={"manual"} minimal small />
            Dictionary <span style={{ fontSize: "7pt" }}>(Alt-Shift-.)</span>
          </MenuItem>
        )}
        {privacyEnabled && (
          <MenuItem
            onClick={() => {
              tippy.hide();
              privacyToggle();
            }}
          >
            <Button
              icon={"shield"}
              minimal
              small
              intent={privacyActive ? "warning" : "none"}
            />
            Privacy Mode <span style={{ fontSize: "7pt" }}>(Alt-Shift-p)</span>
          </MenuItem>
        )}
        {formatConverterEnabled && (
          <>
            <hr style={{ margin: 0, padding: 0 }} />
            <MenuItem
              onClick={() => {
                tippy.hide();
                formatConverterShow();
              }}
            >
              <Button icon={"fork"} minimal small />
              Converter <span style={{ fontSize: "7pt" }}>(Alt-m)</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                tippy.hide();
                htmlview();
              }}
            >
              <Button icon={"document-share"} minimal small />
              Web View <span style={{ fontSize: "7pt" }}>(Alt-Shift-m)</span>
            </MenuItem>
          </>
        )}
        <hr style={{ margin: 0, padding: 0 }} />
        <MenuItem
          onClick={() => {
            tippy.hide();
            qrComponent.toggleQuickReference();
          }}
        >
          <Button icon={"help"} minimal small />
          Help <span style={{ fontSize: "7pt" }}>(Ctrl-Shift-q)</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            tippy.hide();
            tutorialShow();
          }}
        >
          <Button icon={"learning"} minimal small />
          Tutorials
        </MenuItem>
        {enabled && (
          <MenuItem
            onClick={() => {
              tippy.hide();
              displayGraphStats();
            }}
          >
            <Button icon={"database"} minimal small />
            Graph DB Stats
          </MenuItem>
        )}
        <hr style={{ margin: 0, padding: 0 }} />
        <MenuItem>
          <span style={{ fontSize: "9pt" }}>Toggle Features On/Off:</span>
        </MenuItem>
        {deepNavEnabled && (
          <MenuItem
            onClick={() => {
              tippy.hide();
              triggerDeepNav();
            }}
          >
            <span style={{ fontSize: "8pt", paddingLeft: 15 }}>
              Deep Jump Nav{" "}
            </span>
          </MenuItem>
        )}
        <hr style={{ margin: 0, marginTop: 5, padding: 0 }} />
        <MenuItem>
          <span style={{ fontSize: "8pt", paddingLeft: "15px" }}>
            Roam42 {window.roam42.buildID}
          </span>
        </MenuItem>
      </Menu>
      <div
        style={{ position: "absolute", bottom: -7, right: -2, zIndex: 1000 }}
      >
        <img
          width="40px"
          src={
            "https://raw.githubusercontent.com/dvargas92495/roamjs-workbench/img/logo/42logo-2hc.png"
          }
        />
      </div>
    </>,
    menu
  );
  return menu;
};
