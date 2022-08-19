import { pressEsc } from "../r42kb_lib";
import { get } from "../settings";
import { Button, Classes, Overlay } from "@blueprintjs/core";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import { useState, useMemo, useRef, useEffect } from "react";
import { testIfRoamDateAndConvert } from "../dateProcessing";
import { render as renderToast } from "roamjs-components/components/Toast";
import getFirstChildUidByBlockUid from "roamjs-components/queries/getFirstChildUidByBlockUid";
import createBlock from "roamjs-components/writes/createBlock";
import getUids from "roamjs-components/dom/getUids";

export let state = "off";
let observerHeadings: MutationObserver = undefined;
let closeDailyNotesPopup: () => void;

export const moveForwardToDate = (bForward: boolean) => {
  let jumpDate = testIfRoamDateAndConvert(
    document.querySelector<HTMLHeadingElement>(".rm-title-display").innerText
  );
  if (jumpDate != null) {
    if (bForward) {
      jumpDate.setDate(jumpDate.getDate() + 1);
    } else {
      jumpDate.setDate(jumpDate.getDate() - 1);
    }
    const dDate = window.roamAlphaAPI.util.dateToPageTitle(jumpDate);
    window.roamAlphaAPI.ui.mainWindow.openPage({ page: { title: dDate } });
  }

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
};

const DailyNotesPopup = ({ onClose }: RoamOverlayProps<{}>) => {
  const [loaded, setLoaded] = useState(false);
  const pageUid = useMemo(
    () => window.roamAlphaAPI.util.dateToPageUid(new Date()),
    []
  );
  const [minimized, setMinimized] = useState(false);
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
    if (containerRef.current) {
      window.roamAlphaAPI.ui.components.renderBlock({
        el: containerRef.current,
        uid: pageUid,
      });
      Promise.resolve(
        getFirstChildUidByBlockUid(pageUid) ||
          createBlock({
            node: { text: "" },
            parentUid: pageUid,
          })
      ).then((uid) =>
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "block-uid": uid,
            "window-id": getUids(
              containerRef.current.querySelector(".roam-block")
            ).windowId,
          },
        })
      );
    } else if (!loaded) {
      setLoaded(true);
    }
  }, [containerRef.current, loaded, setLoaded]);
  const onDragEnd = () => component.saveUIChanges({ width, top, left, height });
  const dragRef = useRef({ top: 0, left: 0 });
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
      className={"roamjs-daily-notes-popup"}
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

.roamjs-daily-notes-popup .bp3-dialog-header:hover {
  background: #565c70;
  color: white;

  .bp3-icon {
    color: white;
  }
}

.roamjs-daily-notes-popup .bp3-dialog-header:hover .bp3-icon {
  color: white;
}

.roamjs-dialog-body > .rm-block > .rm-block-main {
  display: none;
}

.roamjs-dialog-body > .rm-block > .rm-block-children > .rm-multibar {
  display: none;
}

.roamjs-dialog-body > .rm-block > .rm-block-children {
  margin-left: 0;
}

.roamjs-daily-notes-popup .bp3-overlay-content {
  box-shadow: 0 19px 38px rgb(0 0 0 / 30%), 0 15px 12px rgb(0 0 0 / 22%);
}`}
        </style>
        <div
          tabIndex={-1}
          className="bp3-dialog-header absolute left-0 bottom-full right-0"
          draggable
          onDragStart={(e) => {
            const rect = (e.target as HTMLDivElement).getBoundingClientRect();
            if (e.clientX && e.clientY) {
              dragRef.current = {
                top: e.clientY - rect.top - rect.height,
                left: e.clientX - rect.left,
              };
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
          className="absolute cursor-s-resize h-3 left-2 -bottom-1 bg-red"
          style={{ width: "calc(100% - 16px)" }}
          draggable
          onDrag={(e) => {
            const rect = (e.target as HTMLDivElement).getBoundingClientRect();
            if (e.clientY) {
              setHeight(e.clientY - rect.top);
            }
          }}
          onDragEnd={onDragEnd}
        />
        <div className={`bg-white`} style={{ width, height }}>
          <h1 className={"text-bold text-4xl mb-8 mt-0 pt-6 pl-6"}>
            {window.roamAlphaAPI.util.dateToPageTitle(new Date())}
          </h1>
          <div className={`roamjs-dialog-body`} ref={containerRef} />
        </div>
      </div>
    </Overlay>
  );
};

const listener = (ev: KeyboardEvent) => {
  if (ev.altKey && ev.shiftKey && (ev.key == "¯" || ev.code == "Comma")) {
    ev.preventDefault();
    ev.stopPropagation();
    component.toggleVisible();
    return;
  }

  const target = ev.target as HTMLElement;
  if (ev.ctrlKey == true && ev.shiftKey == true && ev.code == "Comma") {
    ev.preventDefault();
    ev.stopPropagation();
    moveForwardToDate(false);
    return true;
  }

  if (ev.ctrlKey == true && ev.shiftKey == true && ev.code == "Period") {
    ev.preventDefault();
    ev.stopPropagation();
    if (target.nodeName === "TEXTAREA") {
      pressEsc();
      setTimeout(async () => {
        await pressEsc();
        moveForwardToDate(true);
      }, 300);
    } else {
      moveForwardToDate(true);
    }
    return true;
  }

  if (ev.altKey == true && ev.shiftKey == true && ev.code == "KeyJ") {
    ev.preventDefault();
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
  }
};

export const component = {
  async initialize() {
    // Features todo:
    // - Use Dialog and renderBlock to render in view
    // - Make title bar draggable for the full window. no backdrop, interactable
    // - Make edges of window draggable - save in the extensionAPI.settings or localStorage

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

    document.body.addEventListener("keydown", listener);
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
      closeDailyNotesPopup = renderOverlay({
        Overlay: DailyNotesPopup,
        props: {
          onClose: () => {
            closeDailyNotesPopup = undefined;
          },
        },
      });
    }
  },
};

export const toggleFeature = (flag: boolean) => {
  if (flag) component.initialize();
  else {
    document.body.removeEventListener("keydown", listener);
    observerHeadings?.disconnect();
  }
};
