import { get } from "../settings";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { render as renderToast } from "roamjs-components/components/Toast";
import getFirstChildUidByBlockUid from "roamjs-components/queries/getFirstChildUidByBlockUid";
import createBlock from "roamjs-components/writes/createBlock";
import getUids from "roamjs-components/dom/getUids";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import type { OnloadArgs } from "roamjs-components/types";
import { addCommand } from "./workBench";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import LivePreviewWindow from "../components/LivePreviewWindow";
import { clampGeometry, PreviewState } from "./livePreviewModel";
import { readDailyNotesGeometry } from "./dailyNotesPopupModel";

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

const DailyNotesPopup = ({ onClose }: RoamOverlayProps<{}>): JSX.Element => {
  const pageUid = useMemo(
    () => window.roamAlphaAPI.util.dateToPageUid(new Date()),
    [],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const autofocusAllowed = useRef(true);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("DNP_Parameters_Dimensions");
    } catch {
      // The popup remains usable when browser storage is unavailable.
    }
    return {
      id: "daily-notes-popup",
      uid: pageUid,
      title: "Daily Notes",
      pinned: true,
      minimized: false,
      widthPreset: "custom",
      geometry: readDailyNotesGeometry({
        stored,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }),
    };
  });
  useEffect(() => {
    const { width, height, x: left, y: top } = preview.geometry;
    component.saveUIChanges({ width, height, left, top });
  }, [preview.geometry]);
  useEffect(() => {
    const onResize = (): void => {
      setPreview((current) => ({
        ...current,
        geometry: clampGeometry({
          geometry: current.geometry,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          minimized: current.minimized,
        }),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let disposed = false;
    let focusObserver: MutationObserver | undefined;
    const rendered = window.roamAlphaAPI.ui.components.renderPage({
      el,
      uid: pageUid,
    });
    void Promise.resolve(rendered)
      .then(async () => {
        if (disposed) return;
        const uid =
          getFirstChildUidByBlockUid(pageUid) ||
          (await createBlock({ node: { text: "" }, parentUid: pageUid }));
        if (disposed || !autofocusAllowed.current) return;
        const focusBlock = (): void => {
          if (disposed || !autofocusAllowed.current) {
            focusObserver?.disconnect();
            return;
          }
          const blockElement = el.querySelector<HTMLDivElement>(".roam-block");
          if (!blockElement || disposed) return;
          focusObserver?.disconnect();
          const { windowId } = getUids(blockElement);
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: { "block-uid": uid, "window-id": windowId },
          });
        };
        focusObserver = new MutationObserver(focusBlock);
        focusObserver.observe(el, { childList: true, subtree: true });
        focusBlock();
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      focusObserver?.disconnect();
      void Promise.resolve(rendered)
        .then(
          () => window.roamAlphaAPI.ui.components.unmountNode({ el }),
          () => window.roamAlphaAPI.ui.components.unmountNode({ el }),
        )
        .catch((error: unknown) =>
          console.error("WorkBench could not unmount Daily Notes", error),
        );
    };
  }, [pageUid]);
  return (
    <div className="roamjs-daily-notes-popup roamjs-workbench-live-preview-layer">
      <LivePreviewWindow
        preview={preview}
        pinnable={false}
        label="popup"
        zIndex={200}
        onChange={(patch) => {
          if (patch.minimized) autofocusAllowed.current = false;
          setPreview((current) => ({ ...current, ...patch }));
        }}
        onClose={onClose}
      >
        {failed && (
          <p role="alert">
            Daily Notes could not be opened. Close the popup and try again.
          </p>
        )}
        <div
          className="workbench-live-preview-page dnp-content"
          ref={containerRef}
        />
      </LivePreviewWindow>
    </div>
  );
};

const toggleFocus = () => {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const focused = document.activeElement;
  const ancestor = range?.commonAncestorContainer;
  const selectionElement =
    ancestor instanceof Element ? ancestor : ancestor?.parentElement;
  const popup =
    focused?.closest(".roamjs-daily-notes-popup") ||
    selectionElement?.closest(".roamjs-daily-notes-popup");
  if (!popup) {
    const firstPopupBlock = document.querySelector<HTMLDivElement>(
      '.roamjs-daily-notes-popup [data-minimized="false"] .rm-block-children .roam-block',
    );
    if (firstPopupBlock) {
      const { blockUid, windowId } = getUids(firstPopupBlock);
      window.roamAlphaAPI.ui.setBlockFocusAndSelection({
        location: { "block-uid": blockUid, "window-id": windowId },
      });
    }
  } else {
    const firstMainBlock = document.querySelector<HTMLDivElement>(
      ".roam-article .roam-block",
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
    "div.rm-topbar span.bp3-icon-calendar",
  );
  if (roamNativeDate) {
    roamNativeDate.click();
    setTimeout(() => {
      const day = new Date().getDate();
      const dayEl = Array.from(
        document.querySelectorAll<HTMLSpanElement>(".DayPicker-Day"),
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
    Number(dateMatch[1]),
  );
  return !isNaN(pageDate.valueOf()) ? pageDate : null;
};
const createDayBanner = (
  dayOfWeek: number,
  heading: HTMLHeadingElement,
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
  heading: HTMLHeadingElement,
): void => {
  const container = heading.closest(`.${ROAM_TITLE_CONTAINER_CLASS}`);
  const insertionPoint = container || heading;
  insertionPoint.insertAdjacentElement("afterend", banner);
};
const hasExistingBanner = (heading: HTMLHeadingElement): boolean => {
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
    try {
      localStorage.setItem(
        "DNP_Parameters_Dimensions",
        JSON.stringify(UIValues),
      );
    } catch {
      // Moving or resizing still works when browser storage is unavailable.
    }
  },

  toggleVisible() {
    if (closeDailyNotesPopup) {
      closeDailyNotesPopup();
    } else {
      closeDailyNotesPopup =
        renderOverlay({
          Overlay: DailyNotesPopup,
          path:
            document.querySelector<HTMLElement>(".roam-app") ?? document.body,
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
  extensionAPI: OnloadArgs["extensionAPI"],
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
        extensionAPI,
      ),
    );
    unloads.add(
      addCommand(
        {
          label: `Daily Notes Popup - Toggle Focus`,
          callback: toggleFocus,
          defaultHotkey: "alt-ctrl-shift-.",
        },
        extensionAPI,
      ),
    );
    unloads.add(
      addCommand(
        {
          label: `DNP Jump Date Forward`,
          callback: jumpDateForward,
        },
        extensionAPI,
      ),
    );
    unloads.add(
      addCommand(
        {
          label: `DNP Jump Date Backward`,
          callback: jumpDateBack,
        },
        extensionAPI,
      ),
    );
    unloads.add(
      addCommand(
        {
          label: `DNP Jump To Date`,
          callback: jumpDateIcon,
          defaultHotkey: "alt-shift-j",
        },
        extensionAPI,
      ),
    );
    component.initialize();
  } else {
    closeDailyNotesPopup?.();
    cleanupHeadingObserver();
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
