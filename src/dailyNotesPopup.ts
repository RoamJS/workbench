import { moveForwardToDate } from "./commonFunctions";
import { pressEsc } from "./r42kb_lib";
import { get } from "./settings";

export let state = "off";
let observerHeadings: MutationObserver = undefined;

const listener = (ev: KeyboardEvent) => {
  if (ev.altKey && ev.shiftKey && (ev.key == "¯" || ev.code == "Comma")) {
    ev.preventDefault();
    ev.stopPropagation();
    if (window != window.parent) {
      window.parent.document.querySelector<HTMLIFrameElement>(
        "#jsPanelDNP"
      ).style.visibility = "hidden";
    } else {
      component.toggleVisible();
    }
    return;
  }

  const target = ev.target as HTMLElement;
  if (ev.ctrlKey == true && ev.shiftKey == true && ev.code == "Comma") {
    ev.preventDefault();
    ev.stopPropagation();
    if (target.nodeName === "TEXTAREA") {
      pressEsc();
      setTimeout(async () => {
        await pressEsc();
        moveForwardToDate(false);
      }, 300);
    } else {
      moveForwardToDate(false);
    }
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
  panelDNP: undefined as HTMLDivElement,
  idPanelDNP: "jsPanelDNP",

  async initialize() {
    // Features todo:
    // - Use Dialog and renderBlock to render in view
    // - Make title bar draggable for the full window. no backdrop, interactable
    // - Make edges of window draggable - save in the extensionAPI.settings or localStorage
    const jsPanel = {
      create: (_: Record<string, unknown>) => document.createElement("iframe"),
    };
    this.panelDNP = jsPanel.create({
      id: this.idPanelDNP,
      header: "auto-show-hide",
      headerControls: { smallify: "remove", maximize: "remove" },
      headerTitle:
        '<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:200px;color:white !important;padding-top:2px;">Daily Notes</div>',
      iconfont: [
        "bp3-button bp3-minimal bp3-small bp3-icon-small-minus",
        "bp3-button bp3-minimal bp3-small bp3-icon-chevron-down",
        "bp3-button bp3-minimal bp3-small bp3-icon-expand-all",
        "bp3-button bp3-minimal bp3-small bp3-icon-maximize",
        "bp3-button bp3-minimal bp3-small bp3-icon-cross",
      ],
      onwindowresize: true,
      resizeit: { minWidth: 300, minHeight: 300, aspectRatio: false },

      contentOverflow: "hidden",
      position: {
        my: "right-center",
        at: "left-center",
        of: document.body,
      },
      callback: (panel: HTMLDivElement) => {
        panel.querySelector<HTMLDivElement>("#iframePanelDNP").onload =
          function () {
            var loc = localStorage.getItem("DNP_Parameters_Dimensions")
              ? JSON.parse(localStorage.getItem("DNP_Parameters_Dimensions"))
              : "";
            var lWidth = 500;
            var lHeight = 300;
            var lPosition = "center-bottom";
            var lX = -10;
            var lY = -10;
            if (loc != "") {
              lPosition = "left-top";
              lWidth = loc.width;
              lHeight = loc.height;
              lX = loc.left;
              lY = loc.top;
            }
            if (lY >= window.innerHeight) {
              lPosition = "center-top";
              lY = -10;
            }
            if (lX >= window.innerWidth) {
              lPosition = "center-top";
              lX = -10;
            }
            panel.style.visibility = "hidden";
            // panel.reposition({
            //   my: lPosition,
            //   at: lPosition,
            //   offsetX: lX,
            //   offsetY: lY,
            // });
            // panel.resize({ width: lWidth, height: lHeight });
            component.addPanelEvents();
          };
      },
      dragit: {
        containment: [10, 10, 10, 10],
      },
      boxShadow: 4,
    });
    //customize the internal view
    setTimeout(() => {
      var iframe = document.getElementById(
        "iframePanelDNP"
      ) as HTMLIFrameElement;
      var style = document.createElement("style");

      style.textContent = `
  /*          .bp3-icon-more, .bp3-icon-menu, .bp3-icon-menu-open, .bp3-icon-graph, #buffer, .roam-sidebar-container {
               display: none !important;
            }
  */
            .intercom-lightweight-app {
							display: none;
						}
            .roam-article {
              padding: 3px 20px 20px !important;
            }
            h1.rm-title-display {
              margin-top: 8px !important;
              margin-bottom: 8px !important;
              font-size:24px;
          }
        `;
      try {
        (
          iframe.contentDocument.getElementsByClassName(
            "bp3-icon-menu-closed"
          )[0] as HTMLButtonElement
        ).click();
      } catch (e) {} //if on ipad, the above command fails, so go to next step
      iframe.contentDocument.head.appendChild(style);
      iframe.contentDocument.getElementById("app").classList.add("roam42-DNP");
    }, 12000);

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

  saveUIChanges() {
    var UIValues = {
      width: this.panelDNP.currentData.width.replace("px", ""),
      height: this.panelDNP.currentData.height.replace("px", ""),
      left: this.panelDNP.currentData.left.replace("px", ""),
      top: this.panelDNP.currentData.top.replace("px", ""),
    };
    localStorage.setItem("DNP_Parameters_Dimensions", JSON.stringify(UIValues));
  },

  addPanelEvents() {
    this.panelDNP.options.onbeforeclose.push(() => {
      //close hides the window
      this.toggleVisible();
      return false;
    });
    document.addEventListener(
      "jspanelresizestop",
      (event: CustomEvent) => {
        if (event.detail == "jsPanelDNP") {
          this.saveUIChanges("jspanelresizestop");
        }
      },
      false
    );
    document.addEventListener(
      "jspaneldragstop",
      (event: CustomEvent) => {
        if (event.detail == "jsPanelDNP") {
          this.saveUIChanges("jspaneldragstop");
        }
      },
      false
    );
    document.addEventListener(
      "jspanelfronted",
      (event: CustomEvent) => {
        if (event.detail == "jsPanelDNP") {
          this.saveUIChanges("jspanelfronted");
        }
      },
      false
    );
  },

  toggleVisible() {
    if (component.panelDNP.style.visibility == "hidden") {
      if (component.panelDNP.offsetLeft > window.innerWidth) {
        component.panelDNP.style.left = `${
          window.innerWidth -
          Number(component.panelDNP.style.width.replace(/px$/, "")) -
          10
        }px`;
      }
      if (component.panelDNP.offsetTop + 100 > window.innerHeight) {
        component.panelDNP.style.top = `${window.innerHeight - 100}px`;
      }
      component.panelDNP.style.visibility = "visible";
      document.getElementById("iframePanelDNP").focus();
    } else {
      component.panelDNP.normalize();
      component.saveUIChanges();
      component.panelDNP.style.visibility = "hidden";
      parent.focus();
    }
  },
};

export const toggleFeature = (flag: boolean) => {
  if (flag) component.initialize();
  else {
    document.body.removeEventListener("keydown", listener);
    observerHeadings?.disconnect();
    document.querySelector("#jsPanelDNP")?.remove?.();
  }
};
