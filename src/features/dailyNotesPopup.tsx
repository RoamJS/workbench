import { get } from "../settings";
import { Button, Overlay } from "@blueprintjs/core";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { render as renderToast } from "roamjs-components/components/Toast";
import getFirstChildUidByBlockUid from "roamjs-components/queries/getFirstChildUidByBlockUid";
import createBlock from "roamjs-components/writes/createBlock";
import getUids from "roamjs-components/dom/getUids";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import type { OnloadArgs } from "roamjs-components/types";
import { addCommand } from "./workBench";

let observerHeadings: MutationObserver = undefined;
let closeDailyNotesPopup: () => void;

export const moveForwardToDate = (bForward: boolean) => {
  window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid().then((_uid) => {
    const uid = _uid || window.roamAlphaAPI.util.dateToPageUid(new Date());
    if (uid) {
      const title = getPageTitleByPageUid(uid);
      if (title) {
        const jumpDate = window.roamAlphaAPI.util.pageTitleToDate(title);
        if (jumpDate) {
          if (bForward) {
            jumpDate.setDate(jumpDate.getDate() + 1);
          } else {
            jumpDate.setDate(jumpDate.getDate() - 1);
          }
          const dDate = window.roamAlphaAPI.util.dateToPageTitle(jumpDate);
          window.roamAlphaAPI.ui.mainWindow
            .openPage({ page: { title: dDate } })
            .then(() => {
              renderToast({
                content: [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ][jumpDate.getDay()],
                id: "jump-date",
              });
            });
        }
      }
    }
  });
};

const DailyNotesPopup = ({ onClose }: RoamOverlayProps<{}>) => {
  const [loaded, setLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const pageUid = useMemo(
    () => window.roamAlphaAPI.util.dateToPageUid(new Date()),
    []
  );
  const [minimized, _setMinimized] = useState(false);
  const minimizedRef = useRef(false);
  const setMinimized = (f: boolean) =>
    _setMinimized((minimizedRef.current = f));
  const containerRef = useRef<HTMLDivElement>(null);
  var loc = useMemo(
    () =>
      localStorage.getItem("DNP_Parameters_Dimensions")
        ? (JSON.parse(localStorage.getItem("DNP_Parameters_Dimensions")) as {
            height: number;
            width: number;
            left: number;
            top: number;
          })
        : {
            height: 300,
            width: 500,
            left: window.innerWidth / 2 - 300,
            top: window.innerHeight / 2 - 150,
          },
    []
  );
  const [height, setHeight] = useState(loc.height);
  const [width, setWidth] = useState(loc.width);
  const [top, setTop] = useState(loc.top);
  const [left, setLeft] = useState(loc.left);
  useEffect(() => {
    if (containerRef.current && !minimizedRef.current) {
      window.roamAlphaAPI.ui.components.renderPage({
        el: containerRef.current,
        uid: pageUid,
      });
      Promise.resolve(
        getFirstChildUidByBlockUid(pageUid) ||
          createBlock({
            node: { text: "" },
            parentUid: pageUid,
          })
      ).then((uid) => {
        const { windowId } = getUids(
          containerRef.current.querySelector(".roam-block")
        );
        console.log(uid, windowId);
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "block-uid": uid,
            "window-id": windowId,
          },
        });
      });
    } else if (!loaded) {
      setLoaded(true);
    } else if (minimizedRef.current) {
      setLoaded(false);
      containerRef.current = undefined;
    }
  }, [containerRef.current, loaded, setLoaded, minimizedRef]);
  const onDragEnd = () => {
    component.saveUIChanges({ width, top, left, height });
    setIsDragging(false);
  };
  const dragImage = useMemo(() => {
    const img = document.createElement("img");
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    return img;
  }, []);
  const cancelDragImage = (e: React.DragEvent) => {
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };
  const dragRef = useRef({ top: 0, left: 0, width: 0, height: 0 });
  return minimized ? (
    <div
      className="absolute bottom-0 left-0 px-4 py-2 text-white flex justify-between items-center gap-12"
      style={{ background: "#565c70" }}
    >
      <span>Daily Notes</span>
      <span>
        <Button
          icon={"expand-all"}
          minimal
          onClick={() => setMinimized(false)}
          style={{
            minHeight: 16,
            minWidth: 16,
            height: 16,
            width: 16,
          }}
        />
        <Button
          icon={"cross"}
          minimal
          onClick={onClose}
          style={{
            minHeight: 16,
            minWidth: 16,
            height: 16,
            width: 16,
          }}
        />
      </span>
    </div>
  ) : (
    <Overlay
      isOpen={true}
      onClose={onClose}
      className={`roamjs-daily-notes-popup ${
        isDragging && "roamjs-daily-notes-dragging"
      }`}
      autoFocus={false}
      enforceFocus={false}
      hasBackdrop={false}
      canOutsideClickClose={false}
      canEscapeKeyClose={false}
      portalClassName={"roamjs-daily-notes-portal"}
    >
      <div style={{ top, left }}>
        <style>
          {`.roamjs-daily-notes-popup {
            background: transparent;
            width: auto;
          }

          .roamjs-daily-notes-popup .bp3-dialog-header {
            cursor: move;
            padding: 8px 16px;
            background: transparent;
            color: transparent;
            
            .bp3-icon {
              color: transparent;
            }
          }

          .roamjs-daily-notes-popup .bp3-dialog-header .bp3-icon {
            color: transparent;
          }

          .roamjs-daily-notes-popup .bp3-dialog-header:hover,
          .roamjs-daily-notes-popup.roamjs-daily-notes-dragging .bp3-dialog-header {
            background: #565c70;
            color: white;

            .bp3-icon {
              color: white;
            }
          }

          .roamjs-daily-notes-popup .bp3-dialog-header:hover .bp3-icon,
          .roamjs-daily-notes-popup.roamjs-daily-notes-dragging .bp3-dialog-header .bp3-icon {
            color: white;
          }

          .roamjs-daily-notes-popup .bp3-overlay-content {
            box-shadow: 0 19px 38px rgb(0 0 0 / 30%), 0 15px 12px rgb(0 0 0 / 22%);
          }
          
          .rm-autocomplete__results {
            z-index: 1020;
          }`}
        </style>
        <div
          tabIndex={-1}
          className="bp3-dialog-header absolute left-0 bottom-full right-0"
          draggable
          onDragStart={(e) => {
            setIsDragging(true);
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).getBoundingClientRect();
            if (e.clientX && e.clientY) {
              dragRef.current.top = e.clientY - rect.top - rect.height;
              dragRef.current.left = e.clientX - rect.left;
            }
          }}
          onDrag={(e) => {
            if (e.clientX && e.clientY) {
              setTop(e.clientY - dragRef.current.top);
              setLeft(e.clientX - dragRef.current.left);
            }
          }}
          onDragEnd={onDragEnd}
        >
          <div className="flex justify-between items-center">
            <span>Daily Notes</span>
            <span>
              <Button
                icon={"caret-down"}
                minimal
                onClick={() => setMinimized(true)}
                style={{
                  minHeight: 16,
                  minWidth: 16,
                  height: 16,
                  width: 16,
                }}
              />
              <Button
                icon={"cross"}
                minimal
                onClick={onClose}
                style={{
                  minHeight: 16,
                  minWidth: 16,
                  height: 16,
                  width: 16,
                }}
              />
            </span>
          </div>
        </div>
        <div
          className="absolute h-3 left-2 -bottom-1"
          style={{ width: "calc(100% - 16px)", cursor: "s-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.top = rect.top;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setHeight(e.clientY - dragRef.current.top);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className="absolute h-3 -left-1 w-3 -bottom-1"
          style={{ cursor: "sw-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.top = rect.top;
            dragRef.current.width = rect.width;
            dragRef.current.left = rect.left;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setHeight(e.clientY - dragRef.current.top);
              setWidth(
                dragRef.current.left - e.clientX + dragRef.current.width
              );
              setLeft(e.clientX);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className="absolute w-3 bottom-2 -left-1"
          style={{ height: "calc(100% - 16px)", cursor: "w-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.left = rect.left;
            dragRef.current.width = rect.width;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setWidth(
                dragRef.current.left - e.clientX + dragRef.current.width
              );
              setLeft(e.clientX);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className="absolute h-3 -left-1 w-3 -top-1"
          style={{ cursor: "nw-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.top = rect.top;
            dragRef.current.height = rect.height;
            dragRef.current.left = rect.left;
            dragRef.current.width = rect.width;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setWidth(
                dragRef.current.left - e.clientX + dragRef.current.width
              );
              setHeight(
                dragRef.current.top - e.clientY + dragRef.current.height
              );
              setLeft(e.clientX);
              setTop(e.clientY);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className="absolute h-3 left-2 -top-1"
          style={{ width: "calc(100% - 16px)", cursor: "n-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.top = rect.top;
            dragRef.current.height = rect.height;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setHeight(
                dragRef.current.top - e.clientY + dragRef.current.height
              );
              setTop(e.clientY);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className="absolute h-3 -right-1 w-3 -top-1"
          style={{ cursor: "ne-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.top = rect.top;
            dragRef.current.height = rect.height;
            dragRef.current.left = rect.left;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setHeight(
                dragRef.current.top - e.clientY + dragRef.current.height
              );
              setWidth(e.clientX - dragRef.current.left);
              setTop(e.clientY);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className="absolute w-3 bottom-2 -right-1"
          style={{ height: "calc(100% - 16px)", cursor: "e-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.left = rect.left;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setWidth(e.clientX - dragRef.current.left);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className="absolute h-3 -right-1 w-3 -bottom-1"
          style={{ cursor: "se-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const rect = (e.target as HTMLDivElement).parentElement
              .querySelector(".dnp-content")
              .getBoundingClientRect();
            dragRef.current.top = rect.top;
            dragRef.current.left = rect.left;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setWidth(e.clientX - dragRef.current.left);
              setHeight(e.clientY - dragRef.current.top);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          className={`bg-white overflow-auto dnp-content`}
          style={{ width, height }}
        >
          <div className={`roamjs-dialog-body pr-6 pl-6`} ref={containerRef} />
        </div>
      </div>
    </Overlay>
  );
};

const toggleFocus = () => {
  const popup =
    (window.getSelection().getRangeAt(0)
      .commonAncestorContainer as Element) instanceof Element
      ? (
          window.getSelection().getRangeAt(0).commonAncestorContainer as Element
        ).closest(".roamjs-daily-notes-popup")
      : null;
  if (!popup) {
    const firstPopupBlock = document.querySelector<HTMLDivElement>(
      ".roamjs-daily-notes-popup .rm-block-children .roam-block"
    );
    if (firstPopupBlock) {
      const { blockUid, windowId } = getUids(firstPopupBlock);
      window.roamAlphaAPI.ui.setBlockFocusAndSelection({
        location: { "block-uid": blockUid, "window-id": windowId },
      });
    }
  } else {
    const firstMainBlock = document.querySelector<HTMLDivElement>(
      ".roam-article .roam-block"
    );
    if (firstMainBlock) {
      const { blockUid, windowId } = getUids(firstMainBlock);
      window.roamAlphaAPI.ui.setBlockFocusAndSelection({
        location: { "block-uid": blockUid, "window-id": windowId },
      });
    }
  }
};
const toggleDNPPopup = () => {
  component.toggleVisible();
};
const jumpDateForward = () => {
  moveForwardToDate(false);
  return true;
};
const jumpDateBack = () => {
  moveForwardToDate(true);
  return true;
};
const jumpDateIcon = () => {
  const roamNativeDate = document.querySelector<HTMLSpanElement>(
    "div.rm-topbar span.bp3-icon-calendar"
  );
  if (roamNativeDate) {
    roamNativeDate.click();
    setTimeout(() => {
      const day = new Date().getDate();
      const dayEl = Array.from(
        document.querySelectorAll<HTMLSpanElement>(".DayPicker-Day")
      ).find((d) => d.innerText === `${day}`);
      dayEl?.focus?.();
    }, 1);
  }
  return true;
};

export const component = {
  async initialize() {
    const setting = get("dailySubtitles");
    if (setting != "off") {
      // TODO - Move This
      const MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const addDateToRoamTitleBanners = (titles: HTMLHeadingElement[]) => {
        titles.forEach((title) => {
          if (
            title.nextElementSibling &&
            title.nextElementSibling.classList.contains("roam-title-day-banner")
          ) {
            return;
          }
          const [month, date = "", year = ""] = title.innerText.split(" ");
          const dateMatch = date.match(/^(\d{1,2})(st|nd|rd|th),$/);
          const pageDate =
            year &&
            dateMatch &&
            MONTHS.includes(month) &&
            new Date(Number(year), MONTHS.indexOf(month), Number(dateMatch[1]));
          if (pageDate && !isNaN(pageDate.valueOf())) {
            var weekdays = new Array(
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            );
            var day = pageDate.getDay();
            var div = document.createElement("DIV");
            div.className = "roam-title-day-banner";
            div.innerText = weekdays[day];
            div.style.fontSize = "10pt";
            div.style.top =
              -(
                Number(getComputedStyle(title).marginBottom.replace("px", "")) +
                6
              ) + "px";
            div.style.position = "relative";
            title.insertAdjacentElement("afterend", div);
          }
        });
      };

      const className = "rm-title-display";
      addDateToRoamTitleBanners(
        Array.from(document.querySelectorAll(`.${className}`))
      );
      observerHeadings = new MutationObserver((ms) => {
        const titles = ms
          .flatMap((m) =>
            Array.from(m.addedNodes).filter(
              (d) =>
                /^H\d$/.test(d.nodeName) &&
                (d as Element).classList.contains(className)
            )
          )
          .concat(
            ms.flatMap((m) =>
              Array.from(m.addedNodes)
                .filter((n) => n.hasChildNodes())
                .flatMap((d) =>
                  Array.from((d as Element).getElementsByClassName(className))
                )
            )
          )
          .map((n) => n as HTMLHeadingElement);
        addDateToRoamTitleBanners(titles);
      });
      observerHeadings.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  },

  saveUIChanges(UIValues: {
    width: number;
    height: number;
    left: number;
    top: number;
  }) {
    localStorage.setItem("DNP_Parameters_Dimensions", JSON.stringify(UIValues));
  },

  toggleVisible() {
    if (closeDailyNotesPopup) {
      closeDailyNotesPopup();
    } else {
      closeDailyNotesPopup =
        renderOverlay({
          Overlay: DailyNotesPopup,
          props: {
            onClose: () => {
              closeDailyNotesPopup = undefined;
            },
          },
        }) || undefined;
    }
  },
};

let unloads = new Set<() => void>();
export let enabled = false;
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  enabled = flag;
  if (flag) {
    unloads.add(
      addCommand(
        {
          label: `Daily Notes Popup`,
          callback: toggleDNPPopup,
          defaultHotkey: "alt-shift-,",
        },
        extensionAPI
      )
    );
    unloads.add(
      addCommand(
        {
          label: `Daily Notes Popup - Toggle Focus`,
          callback: toggleFocus,
          defaultHotkey: "alt-ctrl-shift-.",
        },
        extensionAPI
      )
    );
    unloads.add(
      addCommand(
        {
          label: `DNP Jump Date Forward`,
          callback: jumpDateForward,
        },
        extensionAPI
      )
    );
    unloads.add(
      addCommand(
        {
          label: `DNP Jump Date Backward`,
          callback: jumpDateBack,
        },
        extensionAPI
      )
    );
    unloads.add(
      addCommand(
        {
          label: `DNP Jump To Date`,
          callback: jumpDateIcon,
          defaultHotkey: "alt-shift-j",
        },
        extensionAPI
      )
    );
    component.initialize();
  } else {
    observerHeadings?.disconnect();
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
