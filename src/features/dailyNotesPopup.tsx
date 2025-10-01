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
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";

let closeDailyNotesPopup: (() => void) | undefined;

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
  var loc = useMemo(() => {
    const item = localStorage.getItem("DNP_Parameters_Dimensions");
    return item
      ? (JSON.parse(item) as {
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
        };
  }, []);
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
        const blockElement = containerRef.current?.querySelector(
          ".roam-block"
        ) as HTMLDivElement;
        if (blockElement) {
          const { windowId } = getUids(blockElement);
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: {
              "block-uid": uid,
              "window-id": windowId,
            },
          });
        }
      });
    } else if (!loaded) {
      setLoaded(true);
    } else if (minimizedRef.current) {
      setLoaded(false);
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
          aria-label="Daily Notes Popup Header"
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
          aria-label="Bottom Resize Handle"
          className="absolute h-3 left-2 -bottom-1"
          style={{ width: "calc(100% - 16px)", cursor: "s-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) dragRef.current.top = rect.top;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setHeight(e.clientY - dragRef.current.top);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          aria-label="Bottom Left Corner Resize Handle"
          className="absolute h-3 -left-1 w-3 -bottom-1"
          style={{ cursor: "sw-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) {
              dragRef.current.top = rect.top;
              dragRef.current.width = rect.width;
              dragRef.current.left = rect.left;
            }
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
          aria-label="Left Resize Handle"
          className="absolute w-3 bottom-2 -left-1"
          style={{ height: "calc(100% - 16px)", cursor: "w-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) {
              dragRef.current.left = rect.left;
              dragRef.current.width = rect.width;
            }
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
          aria-label="Top Left Corner Resize Handle"
          className="absolute h-3 -left-1 w-3 -top-1"
          style={{ cursor: "nw-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) {
              dragRef.current.top = rect.top;
              dragRef.current.height = rect.height;
              dragRef.current.left = rect.left;
              dragRef.current.width = rect.width;
            }
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
          aria-label="Top Resize Handle"
          className="absolute h-3 left-2 -top-1"
          style={{ width: "calc(100% - 16px)", cursor: "n-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) {
              dragRef.current.top = rect.top;
              dragRef.current.height = rect.height;
            }
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
          aria-label="Top Right Corner Resize Handle"
          className="absolute h-3 -right-1 w-3 -top-1"
          style={{ cursor: "ne-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) {
              dragRef.current.top = rect.top;
              dragRef.current.height = rect.height;
              dragRef.current.left = rect.left;
            }
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
          aria-label="Right Resize Handle"
          className="absolute w-3 bottom-2 -right-1"
          style={{ height: "calc(100% - 16px)", cursor: "e-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) dragRef.current.left = rect.left;
          }}
          onDrag={(e) => {
            if (e.clientY) {
              setWidth(e.clientX - dragRef.current.left);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div
          aria-label="Bottom Right Corner Resize Handle"
          className="absolute h-3 -right-1 w-3 -bottom-1"
          style={{ cursor: "se-resize" }}
          draggable
          onDragStart={(e) => {
            cancelDragImage(e);
            const targetElement = (
              e.target as HTMLDivElement
            ).parentElement?.querySelector(".dnp-content");
            const rect = targetElement?.getBoundingClientRect();
            if (rect) {
              dragRef.current.top = rect.top;
              dragRef.current.left = rect.left;
            }
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
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  const popup =
    range?.commonAncestorContainer instanceof Element
      ? (range.commonAncestorContainer as Element).closest(
          ".roamjs-daily-notes-popup"
        )
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

// Daily Note Subtitles / Banner
const ROAM_TITLE_CLASS = "rm-title-display";
const ROAM_TITLE_CONTAINER_CLASS = "rm-title-display-container";
const DAY_BANNER_CLASS = "roam-title-day-banner";
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

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Daily Note Subtitles / Banner - Utils
const parseDateFromHeading = (headingText: string): Date | null => {
  const [month, date = "", year = ""] = headingText.split(" ");
  const dateMatch = date.match(/^(\d{1,2})(st|nd|rd|th),$/);

  if (!year || !dateMatch || !MONTHS.includes(month)) {
    return null;
  }

  const pageDate = new Date(
    Number(year),
    MONTHS.indexOf(month),
    Number(dateMatch[1])
  );
  return !isNaN(pageDate.valueOf()) ? pageDate : null;
};
const createDayBanner = (
  dayOfWeek: number,
  heading: HTMLHeadingElement
): HTMLDivElement => {
  const banner = document.createElement("div");
  banner.className = DAY_BANNER_CLASS;
  banner.innerText = WEEKDAYS[dayOfWeek];
  banner.style.fontSize = "10pt";
  banner.style.position = "relative";

  // Calculate positioning based on heading's margin
  const headingMargin = getComputedStyle(heading).marginBottom;
  const marginValue = Number(headingMargin.replace("px", "")) || 0;
  banner.style.top = `-${marginValue + 6}px`;

  return banner;
};
const insertBanner = (
  banner: HTMLDivElement,
  heading: HTMLHeadingElement
): void => {
  const container = heading.closest(`.${ROAM_TITLE_CONTAINER_CLASS}`);
  const insertionPoint = container || heading;
  insertionPoint.insertAdjacentElement("afterend", banner);
};
const hasExistingBanner = (heading: HTMLHeadingElement): boolean => {
  // Check DNP case: banner is next sibling of heading
  const nextSibling = heading.nextElementSibling;
  if (nextSibling && nextSibling.classList.contains(DAY_BANNER_CLASS)) {
    return true;
  }

  // Check page/sidebar case: banner is next sibling of container
  const container = heading.closest(`.${ROAM_TITLE_CONTAINER_CLASS}`);
  if (container) {
    const containerNextSibling = container.nextElementSibling;
    if (
      containerNextSibling &&
      containerNextSibling.classList.contains(DAY_BANNER_CLASS)
    ) {
      return true;
    }
  }

  return false;
};
const addDateToRoamTitleBanner = (heading: HTMLHeadingElement): void => {
  if (hasExistingBanner(heading)) return;

  const pageDate = parseDateFromHeading(heading.innerText);
  if (!pageDate) return;

  const dayOfWeek = pageDate.getDay();
  const banner = createDayBanner(dayOfWeek, heading);
  insertBanner(banner, heading);
};
const processExistingHeadings = (): void => {
  const existingHeadings = document.querySelectorAll(`.${ROAM_TITLE_CLASS}`);
  existingHeadings.forEach((heading) => {
    addDateToRoamTitleBanner(heading as HTMLHeadingElement);
  });
};

// Daily Note Subtitles / Banner - Observer
let observerHeadings: { disconnect: () => void } | undefined = undefined;
const setupHeadingObserver = (): void => {
  observerHeadings = createHTMLObserver({
    tag: "H1",
    className: ROAM_TITLE_CLASS,
    callback: (element) =>
      addDateToRoamTitleBanner(element as HTMLHeadingElement),
  });
};
const cleanupHeadingObserver = (): void => {
  if (observerHeadings) {
    observerHeadings.disconnect();
    observerHeadings = undefined;
  }
};

// Main Daily Notes Popup Component
export const component = {
  async initialize() {
    const setting = get("dailySubtitles");
    if (setting === "off") return;

    processExistingHeadings();
    setupHeadingObserver();
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
    cleanupHeadingObserver();
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
