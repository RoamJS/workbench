// Thanks Bro! gracefully borrowed  from: https://github.com/palashkaria/roam-modifiers

import Cookies from "js-cookie";
import { get } from "./settings";
import iziToast from "izitoast";
import Popper from "popper.js";

const initialState = get("LivePreview");
export const state = ["on", "optimized"].includes(initialState)
  ? initialState
  : "on";
export const browserHeight = get("LivePreviewHeight") || "500px";
export const browserWidth = get("LivePreviewWidth") || "500px";
export const delay = Number(get("LivePreviewDelay") || "100");

export const getRoamLivePreviewState = () => {
  switch (Cookies.get("RoamLivePreview_IsEnabled")) {
    case "1":
      return 1;
    case "2":
      return 2;
    default:
      return 0;
  }
};

export let roam42LivePreviewState = getRoamLivePreviewState();

export const setRoamLivePreviewState = (val: number) => {
  Cookies.set("RoamLivePreview_IsEnabled", val.toString(), { expires: 365 });
  roam42LivePreviewState = val;
};

export const toggleRoamLivePreviewState = () => {
  const s = getRoamLivePreviewState();
  switch (s) {
    case 1:
      setRoamLivePreviewState(2);
      break;
    case 2:
      setRoamLivePreviewState(0);
      break;
    default:
      setRoamLivePreviewState(1);
      break;
  }
};

export const keyboardHandlerLivePreview = (ev: KeyboardEvent) => {
  if (
    (ev.ctrlKey == true && ev.key == "L") ||
    (ev.altKey == true && ev.key == "l")
  ) {
    ev.preventDefault();

    toggleRoamLivePreviewState();
    let msg = "";
    const s = getRoamLivePreviewState();
    switch (s) {
      case 1:
        msg = "Active";
        break;
      case 2:
        msg = "Active with block refs";
        break;
      default:
        msg = "Inactive";
        break;
    }
    iziToast.destroy();
    iziToast.show({
      message: "Live Preview<br/><b>" + msg + "</b>",
      theme: "dark",
      progressBar: true,
      animateInside: false,
      close: false,
      timeout: 3000,
      closeOnClick: true,
      displayMode: 2,
    });
    return true;
  }
};

export const livePreviewStatusToast = () => {
  var status = getRoamLivePreviewState();
  iziToast.show({
    timeout: 20000,
    theme: "dark",
    title: "Live preview",
    message: "Status:",
    position: "bottomRight",
    progressBarColor: "rgb(0, 255, 184)",
    buttons: [
      [
        "<button>Active</button>",
        function (instance, toast) {
          setRoamLivePreviewState(1);
          instance.hide({ transitionOut: "fadeOutUp" }, toast, "buttonName");
        },
        status == 1,
      ],
      [
        "<button>Active with block refs</button>",
        function (instance, toast) {
          setRoamLivePreviewState(2);
          instance.hide({ transitionOut: "fadeOutDown" }, toast, "buttonName");
        },
        status == 2,
      ],
      [
        "<button>Inactive</button>",
        function (instance, toast) {
          setRoamLivePreviewState(0);
          instance.hide({ transitionOut: "fadeOutDown" }, toast, "buttonName");
        },
        status == 0,
      ],
    ],
  });
};

const runInPageContext = (
  method: (...args: unknown[]) => unknown,
  ...args: unknown[]
) => {
  const stringifiedMethod = method.toString();

  const stringifiedArgs = JSON.stringify(args);

  const scriptContent = `document.currentScript.innerHTML = JSON.stringify((${stringifiedMethod})(...${stringifiedArgs}));`;

  const scriptElement = document.createElement("script");
  scriptElement.innerHTML = scriptContent;
  document.documentElement.prepend(scriptElement);

  const result = JSON.parse(scriptElement.innerHTML);
  document.documentElement.removeChild(scriptElement);
  return result;
};

const getBlockById = (dbId: string) => {
  const fn = function (dbId: string) {
    return function (dbId: string) {
      return window.roamAlphaAPI.pull("[*]", dbId);
    };
  };
  return runInPageContext(fn(dbId), dbId);
};

const queryFn = (query: string, ...params: unknown[]) => {
  return runInPageContext(
    function (q: string, ...args: unknown[]) {
      return window.roamAlphaAPI.q(q, ...args);
    },
    query,
    ...params
  );
};

const queryFirst = (query: string, ...params: unknown[]) => {
  const results = queryFn(query, ...params);
  if (!results || !results[0] || results[0].length < 1) return null;

  return getBlockById(results[0][0]);
};
const baseUrl = () => {
  const url = new URL(window.location.href);
  const parts = url.hash.split("/");

  url.hash = parts.slice(0, 3).concat(["page"]).join("/");
  return url;
};
const getPageByName = (name: string) => {
  return queryFirst("[:find ?e :in $ ?a :where [?e :node/title ?a]]", name);
};
const getPageUrlByName = (name: string) => {
  const page = getPageByName(name);
  return getPageUrl(page[":block/uid"]);
};
const getPageUrl = (uid: string) => {
  return baseUrl().toString() + "/" + uid;
};

const createPreviewIframe = () => {
  let url = baseUrl().toString().replace("/page", "");
  if (state == "optimized") url = url + "?disablejs=true";

  const existing = document.querySelector<HTMLIFrameElement>(`[src="${url}"]`);
  if (existing) {
    return existing;
  }
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.position = "absolute";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.height = "0px";
  iframe.style.width = "0px";
  iframe.style.border = "0";
  iframe.style.boxShadow = "0 0 4px 5px rgba(0, 0, 0, 0.2)";
  iframe.style.borderRadius = "8px";
  iframe.id = "roam42-live-preview-iframe";
  const styleNode = document.createElement("style");

  styleNode.innerHTML = `
          div.roam-app > div.flex-h-box {
            margin-left: 10px !important;
          }
          .roam-article {
            padding: 10px !important;
            margin-top: 10px !important;
          }
          .rm-title-display {
            margin-top: 0px;
          }
          .roam-topbar {
              display: none !important;
          }
          .roam-sidebar-container {
              display: none !important;
          }
          .roam-main {
              padding: 0 !important;
          }
          .roam-body-main {
              top: 0px !important;
              left: 0px !important;
              width: 100% !important;
          }
					.intercom-lightweight-app {
						display: none;
					}
          iframe {
              display: none !important;
          }
        `;

  iframe.onload = (event) => {
    (event.target as HTMLIFrameElement).contentDocument.body.appendChild(
      styleNode
    );
  };
  document.body.appendChild(iframe);
  const htmlElement = document.querySelector("html");
  if (htmlElement) {
    // to reset scroll after adding iframe
    htmlElement.scrollTop = 0;
  }
  return iframe;
};

function generateGetBoundingClientRect(x = 0, y = 0) {
  return () => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x,
    x,
    y,
    toJSON: () => JSON.stringify({ x, y }),
  });
}

const virtualElement = {
  clientHeight: window.innerHeight,
  clientWidth: window.innerWidth,
  getBoundingClientRect: generateGetBoundingClientRect(),
};

const mouseMoveListener = ({ clientX: x, clientY: y }: MouseEvent) => {
  virtualElement.getBoundingClientRect = generateGetBoundingClientRect(
    x + 1,
    y
  );
}

let hoveredElement: HTMLElement = null;
let popupTimeout: number = null;
let popper: Popper = null;
let previewIframe: HTMLIFrameElement = null;
let specialDelayMouseOut = false; //used to control the mouseout event in some scenarios
let specialDelayTimeOutAmount = 200;

const mouseOverListener = (e: MouseEvent) => {
  // if( e.ctrlKey == false ) { return }
  if (e.ctrlKey == false && roam42LivePreviewState == 0) {
    return;
  }
  let pageIsBlock = false;
  let target = e.target as HTMLElement;

  let isPageRef = false;
  let isPageRefTag = target.classList.contains("rm-page-ref");
  let text = "";

  if (isPageRefTag) {
    isPageRef = true;
    text = target.classList.contains("rm-page-ref--tag")
      ? target.getAttribute("data-tag")
      : target.parentElement.getAttribute("data-link-title");
  }

  //finds odd scenario like: [[[[book]]/smart notes]]
  if (
    isPageRef == false &&
    target.classList.length == 0 &&
    target.parentElement.classList.contains("rm-page-ref") &&
    target.parentElement.parentElement.hasAttribute("data-link-uid")
  ) {
    isPageRef = true;
    pageIsBlock = true;
    text = target.parentElement.parentElement.getAttribute("data-link-uid");
  }

  if (isPageRef == false && target.classList.contains("rm-alias-page")) {
    isPageRef = true;
    text = target.title.replace("page: ", "");
  }
  if (isPageRef == false && target.classList.contains("rm-page__title")) {
    isPageRef = true;
    text = target.innerText;
    specialDelayMouseOut = true;
    setTimeout(
      () => (specialDelayMouseOut = false),
      delay + specialDelayTimeOutAmount
    );
  }

  if (
    !isPageRef &&
    !isPageRefTag &&
    target.classList.length == 0 &&
    target.parentElement.classList.contains("rm-page-ref")
  ) {
    isPageRef = true;
    text = target.innerText;
    target = e.target as HTMLElement;
  }

  if (
    isPageRef == false &&
    target.style.cursor == "pointer" &&
    target.parentElement.classList.contains("level2")
  ) {
    isPageRef = true;
    text = target.textContent;
  }

  // "All Pages" - page
  try {
    if (
      isPageRef == false &&
      target.classList.contains("bp3-text-overflow-ellipsis") &&
      target.firstElementChild.classList.contains("rm-pages-title-text")
    ) {
      isPageRef = true;
      text = target.firstChild.textContent;
      target = target.parentElement;
    }
  } catch (e) {}

  //preview BLOCK references
  if (
    isPageRef == false &&
    (e.ctrlKey == true || roam42LivePreviewState == 2) &&
    (target.classList.contains("rm-block-ref") ||
      target.classList.contains("rm-alias-block"))
  ) {
    pageIsBlock = true;
    let block = target.closest(".roam-block").id;
    let bId = block.substring(block.length - 9);
    var q = `[:find ?bstring :in $ ?buid :where [?e :block/uid ?buid][?e :block/string ?bstring] ]`;
    var results = window.roamAlphaAPI.q(q, bId);
    var refNumberInBlock = Array.from(
      target.closest(".roam-block").querySelectorAll(`.rm-block-ref`)
    ).indexOf(target);
    if (refNumberInBlock < 0) {
      refNumberInBlock = 0;
    }
    isPageRef = true;
    text = results[0].toString();
    text = text.match(/\(\((.*?)\)\)/g)?.[refNumberInBlock] || "";
    text = text.replaceAll("(", "").replaceAll(")", "");
    specialDelayMouseOut = true;
    setTimeout(
      () => (specialDelayMouseOut = false),
      delay + specialDelayTimeOutAmount
    );
  }

  // remove '#' for page tags
  if (isPageRef) {
    hoveredElement = target;
    const url = pageIsBlock == true ? getPageUrl(text) : getPageUrlByName(text);
    const isAdded = (pageUrl: string) =>
      !!document.querySelector(`[src="${pageUrl}"]`);
    const isVisible = (pageUrl: string) =>
      document.querySelector<HTMLIFrameElement>(`[src="${pageUrl}"]`).style
        .opacity === "1";
    if ((!isAdded(url) || !isVisible(url)) && previewIframe) {
      setTimeout(() => {
        previewIframe.src = url;
      }, 100);
      previewIframe.style.pointerEvents = "none";

      if (state !== "off") {
        previewIframe.style.height = "500px";
        previewIframe.style.width = "500px";
      } else {
        previewIframe.style.height = browserHeight;
        previewIframe.style.width = browserWidth;
      }
    }
    if (!popupTimeout) {
      popupTimeout = window.setTimeout(() => {
        const previewTopbar =
          previewIframe.contentDocument.querySelector(".rm-topbar");
        if (previewTopbar) {
          previewTopbar.scrollIntoView();
        }
        if (previewIframe) {
          previewIframe.style.opacity = "1";
          previewIframe.style.pointerEvents = "all";
          popper = new Popper(virtualElement, previewIframe, {
            placement: "right",
            modifiers: {
              preventOverflow: {
                padding: { top: 48 },
              },
              flip: {
                boundariesElement: document.querySelector("#app"),
              },
            },
          });
        }
      }, delay + 100);
    }
  }
};

const mouseOutListener = (e: MouseEvent) => {
  if (specialDelayMouseOut) {
    hoveredElement = null;
    return;
  }
  const target = e.target;
  const relatedTarget = e.relatedTarget;
  const iframe = document.getElementById("roam42-live-preview-iframe");
  if (
    (hoveredElement === target && relatedTarget !== iframe) ||
    (target === iframe && relatedTarget !== hoveredElement) ||
    !document.body.contains(hoveredElement)
  ) {
    hoveredElement = null;
    clearTimeout(popupTimeout);
    popupTimeout = null;
    if (iframe) {
      // if (iframe.contentDocument) {
      //   // scroll to top when removed
      //   const scrollContainer = iframe.contentDocument.querySelector(
      //     '.roam-article > div'
      //   );
      //   if (scrollContainer) {
      //     scrollContainer.scrollTop = 0;
      //   }
      // }
      iframe.style.pointerEvents = "none";
      iframe.style.opacity = "0";
      iframe.style.height = "0";
      iframe.style.width = "0";
    }
    if (popper) {
      popper.destroy();
      popper = null;
    }
  } else {
    //console.log('out', target, event);
  }
};

const enableLivePreview = () => {
  previewIframe = createPreviewIframe();

  document.addEventListener("mousemove", mouseMoveListener);
  document.addEventListener("mouseover", mouseOverListener);
  document.addEventListener("mouseout", mouseOutListener);
};

export const toggleFeature = (flag: boolean) => {
  if (flag) enableLivePreview();
  else {
    document.removeEventListener("mousemove", mouseMoveListener);
    document.removeEventListener("mouseout", mouseOutListener);
    document.removeEventListener("mouseover", mouseOverListener);
    if (previewIframe) previewIframe.remove();
  }
};
