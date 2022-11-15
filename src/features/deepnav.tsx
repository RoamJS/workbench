import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import addStyle from "roamjs-components/dom/addStyle";
import ReactDOM from "react-dom";
import getUids from "roamjs-components/dom/getUids";
import { SidebarWindowInput } from "roamjs-components/types";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import createBlock from "roamjs-components/writes/createBlock";
import getCurrentUserUid from "roamjs-components/queries/getCurrentUserUid";
import React from "react";
import getPageTitleValueByHtmlElement from "roamjs-components/dom/getPageTitleValueByHtmlElement";

type Breadcrumbs = { hash: string; title: string; uid?: string }[];

type Item = {
  element: HTMLElement;
  navigate: () => Promise<void>;
  mustBeKeys?: string | null;
  text?: string;
  initials?: string;
  extraClasses?: string[];
};

let currentOptions: Record<string, Item> = {};
let currentNavigatePrefixesUsed: Record<string, boolean> = {};
let navigateKeysPressed = "";

const BREADCRUMBS_CLASS = "roam_navigator_breadcrumbs";
const HINT_CLASS = "roam_navigator_hint";
const HINT_TYPED_CLASS = "roam_navigator_hint_typed";
const LINK_HINT_CLASS = "roam_navigator_link_hint";
const NAVIGATE_CLASS = "roam_navigator_navigating";
const LEFT_SIDEBAR_TOGGLE_CLASS = "roam_navigator_left_sidebar_toggle";
const RIGHT_SIDEBAR_CLOSE_CLASS = "roam_navigator_right_sidebar_close";
const SIDE_PAGE_CLOSE_CLASS = "roam_navigator_side_page_close";
const STYLE_ID = "roamjs-workbench-deepnav-style";
const IS_DAILY_NOTES_REGEX = /#\/(offline|app)\/[^\/]+$/;
const IS_ALL_PAGES_REGEX = /#\/(offline|app)\/[^\/]+\/search$/;
const IS_GRAPH_OVERVIEW_REGEX = /#\/(offline|app)\/[^\/]+\/graph$/;
const ENTER_SYMBOL = "⏎";
const SIDEBAR_BLOCK_PREFIX = "s";
const CLOSE_BUTTON_PREFIX = "x";
const LAST_BLOCK_KEY = "b";
const LEFT_SIDEBAR_KEY = "`";
const MAX_BREADCRUMB_COUNT = 15;
const MAX_NAVIGATE_PREFIX = 2;
const JUMP_KEYS = "asdfghjklqwertyuiopzxcvbnm";
const CLOSE_BUTTON_KEYS = "0123456789" + JUMP_KEYS;
const breadcrumbs: Breadcrumbs = [];

const keyIsModifier = (ev: KeyboardEvent) => {
  return (
    ev.key === "Shift" ||
    ev.key === "Meta" ||
    ev.key === "Control" ||
    ev.key === "Alt"
  );
};

let isNavigating = false;

const getInputTarget = (ev: Event) => {
  const element = ev.target as HTMLElement;
  if (
    element.tagName == "INPUT" ||
    element.tagName == "SELECT" ||
    element.tagName == "TEXTAREA" ||
    element.isContentEditable
  ) {
    return element;
  } else {
    return null;
  }
};

const isHotKey = (ev: KeyboardEvent) => ev.code === "KeyG" || ev.key === "g";

const clearBreadcrumbs = () => {
  document.querySelectorAll("." + BREADCRUMBS_CLASS).forEach((container) => {
    container.remove();
  });
};

const updateBreadcrumbs = async () => {
  const { hash } = window.location;
  const uid = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
  const newBreadcrumb = uid
    ? {
        hash,
        title: getPageTitleByPageUid(uid) || getTextByBlockUid(uid),
        uid,
      }
    : {
        hash,
        title: IS_DAILY_NOTES_REGEX.test(hash)
          ? "Daily Notes"
          : IS_GRAPH_OVERVIEW_REGEX.test(hash)
          ? "Graph Overview"
          : IS_ALL_PAGES_REGEX.test(hash)
          ? "All Pages"
          : "Unknown",
      };
  let changed = false;
  if (breadcrumbs.length < 1) {
    breadcrumbs.push(newBreadcrumb);
    changed = true;
  }
  const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  if (lastBreadcrumb.hash === hash) {
    if (lastBreadcrumb.title !== newBreadcrumb.title) {
      lastBreadcrumb.title = newBreadcrumb.title;
    }
  } else {
    breadcrumbs.push(newBreadcrumb);
    changed = true;
  }
  if (changed && breadcrumbs.length > MAX_BREADCRUMB_COUNT) {
    breadcrumbs.splice(0, breadcrumbs.length - MAX_BREADCRUMB_COUNT);
  }
  // Update rendering of breadcrumbs.
  const alreadyVisible =
    document.querySelectorAll("." + BREADCRUMBS_CLASS).length > 0;
  const shouldBeVisible = isNavigating;
  if (!shouldBeVisible) {
    clearBreadcrumbs();
  } else if (changed || !alreadyVisible) {
    clearBreadcrumbs();
    const Container = () => (
      <div className={BREADCRUMBS_CLASS}>
        {breadcrumbs
          .slice(0, -1)
          .reverse()
          .map((breadcrumb) => {
            return (
              <span
                key={breadcrumb.hash}
                title={breadcrumb.title}
                data-link-title={breadcrumb.title}
                onClick={() => {
                  if (breadcrumb.uid) {
                    window.roamAlphaAPI.ui.mainWindow.openBlock({
                      block: { uid: breadcrumb.uid },
                    });
                  } else {
                    window.location.hash = breadcrumb.hash;
                  }
                }}
              >
                <span
                  tabIndex={-1}
                  className={"rm-page-ref rm-page-ref-link-color"}
                  data-link-uid={breadcrumb.uid}
                >
                  {breadcrumb.title}
                </span>
              </span>
            );
          })}
      </div>
    );

    const topbar = document.querySelector(".rm-topbar");
    const render = (el: HTMLElement) => {
      const root = document.createElement("div");
      topbar.insertBefore(root, el);
      ReactDOM.render(<Container />, root);
    };

    if (topbar) {
      const sidebarButton = [".bp3-icon-menu", ".bp3-icon-menu-open"]
        .map((q) => topbar.querySelector(q))
        .find((q) => !!q);
      if (sidebarButton && sidebarButton.nextSibling) {
        render(sidebarButton.nextElementSibling as HTMLElement);
      } else {
        render(topbar.firstElementChild as HTMLElement);
      }
    }
  }
};

const findLastBlock = (el: Element) => {
  const firstLogPage = el.querySelector(".roam-log-page");
  const container = firstLogPage
    ? firstLogPage.querySelector(".flex-v-box")
    : el;
  if (container) {
    return Array.from(
      container.querySelectorAll<HTMLDivElement>(
        ".rm-block-text, #block-input-ghost"
      )
    ).slice(-1)[0];
  }
  return null;
};

const addBlocks = (el: Element, lastBlock: HTMLDivElement, prefix: string) => {
  let offset = 0;
  const blocks = el.querySelectorAll<HTMLDivElement>(
    [
      ".rm-block-text",
      ".rm-title-display",
      ".rm-pages-title-text",
      "#block-input-ghost",
    ].join(", ")
  );
  const maxDigits = Math.floor(Math.log10(blocks.length)) + 1;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const istr = (i + offset).toString();
    let key = prefix;
    if (block === lastBlock) {
      key += LAST_BLOCK_KEY;
      offset -= 1;
    } else {
      key += i == 0 || istr.length === maxDigits ? istr : istr + ENTER_SYMBOL;
    }
    // TODO VARGAS rm-title-display, rm-pages-title-text, #block-input-ghost
    currentOptions[key] = {
      element: block,
      mustBeKeys: key,
      navigate: () => {
        if (block.id === "block-input-ghost") {
          return (
            block.closest(".rm-sidebar-window")
              ? Promise.resolve(
                  Array.from(
                    document.querySelectorAll(".rm-sidebar-window")
                  ).indexOf(block.closest(".rm-sidebar-window"))
                ).then((order) => {
                  const win = window.roamAlphaAPI.ui.rightSidebar
                    .getWindows()
                    .find((w) => w.type === "outline" && w.order === order);
                  return win && win.type === "outline"
                    ? {
                        parentUid: win?.["page-uid"],
                        windowId: win["window-id"],
                      }
                    : undefined;
                })
              : window.roamAlphaAPI.ui.mainWindow
                  .getOpenPageOrBlockUid()
                  .then((parentUid) => ({
                    parentUid,
                    windowId: `${getCurrentUserUid()}-body-outline-${parentUid}`,
                  }))
          ).then((args) =>
            args && createBlock({ parentUid: args.parentUid, node: { text: "" } }).then((blockUid) =>
              window.roamAlphaAPI.ui.setBlockFocusAndSelection({
                location: {
                  "block-uid": blockUid,
                  "window-id": args.windowId,
                },
              })
            )
          );
        } else {
          const { blockUid, windowId } = getUids(block);
          return window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: { "block-uid": blockUid, "window-id": windowId },
          });
        }
      },
    };
  }
};

const preprocessItemText = (txt: string) => {
  let result = "";
  for (let i = 0; i < txt.length; i++) {
    const char = txt[i];
    const lowerChar = char.toLowerCase();
    if (lowercaseCharIsAlpha(lowerChar)) {
      result += lowerChar;
    }
  }
  return result;
};

const getItemInitials = (txt: string) => {
  let result = "";
  for (let i = 0; i < txt.length; i++) {
    const char = txt[i];
    const lowerChar = char.toLowerCase();
    if (
      lowercaseCharIsAlpha(lowerChar) &&
      (i === 0 || txt[i - 1] === " " || lowerChar !== char)
    ) {
      result += lowerChar;
    }
  }
  return result;
};

const lowercaseCharIsAlpha = (char: string) => {
  const code = char.charCodeAt(0);
  return code > 96 && code < 123; // (a-z)
};

const addLinks = (linkItems: Item[], container: Element) => {
  const links = container.querySelectorAll<HTMLElement>(
    [".rm-page-ref", "a"].join(", ")
  );
  links.forEach((link) => {
    const boundingRect = link.getBoundingClientRect();
    const visible = container.classList.contains(BREADCRUMBS_CLASS)
      ? boundingRect.top < 45
      : boundingRect.bottom > 50 && boundingRect.top < window.innerHeight - 10;
    if (visible) {
      const parent = link.parentElement;
      const text = link.innerText;
      const pushLink = (el: HTMLElement, navigate: () => Promise<void>) =>
        linkItems.push({
          element: el,
          mustBeKeys: null,
          text: preprocessItemText(text),
          initials: getItemInitials(text),
          extraClasses: [LINK_HINT_CLASS],
          navigate,
        });
      if (link.tagName === "A") {
        if (parent.classList.contains("rm-ref-page-view-title")) {
          pushLink(parent, () =>
            window.roamAlphaAPI.ui.mainWindow.openPage({
              page: { title: link.innerText },
            })
          );
        } else if (link.classList.contains("rm-alias")) {
          pushLink(link, async () => link.click());
        } else if (link.hasAttribute("href")) {
          pushLink(link, async () => {
            window.open(link.getAttribute("href"));
          });
        } else {
          console.warn("Unexpected <a> element", link);
        }
      } else if (link.classList.contains("rm-page-ref")) {
        const uidAttr = parent.getAttribute("data-link-uid");
        if (uidAttr) {
          pushLink(parent, () =>
            window.roamAlphaAPI.ui.mainWindow.openBlock({
              block: { uid: uidAttr },
            })
          );
        } else if (link.hasAttribute("data-tag")) {
          pushLink(link, () =>
            window.roamAlphaAPI.ui.mainWindow.openPage({
              page: { title: link.getAttribute("data-tag") },
            })
          );
        } else {
          console.warn("Unxpected .rm-page-ref element", link);
        }
      }
    }
  });
};

const removeOldTips = () => {
  Array.from(document.querySelectorAll(`.${HINT_CLASS}`)).forEach((d) =>
    d.remove()
  );
};

const endNavigate = () => {
  isNavigating = false;
  navigateKeysPressed = "";
  clearBreadcrumbs();
  currentOptions = {};
  removeOldTips();
  if (document.body.classList.contains(NAVIGATE_CLASS)) {
    document.body.classList.remove(NAVIGATE_CLASS);
  }
};

const rerenderTips = () => {
  updateBreadcrumbs();
  removeOldTips();
  return Object.entries(currentOptions)
    .map(([k, opt]) => {
      return renderTip(k, opt);
    })
    .some((s) => !!s);
};

const renderTip = (key: string, option: Item) => {
  const prefix = key.slice(0, navigateKeysPressed.length);
  const rest = key.slice(navigateKeysPressed.length);
  if (prefix === navigateKeysPressed) {
    const { element: el, extraClasses = [] } = option;
    const Tip = () => (
      <>
        {prefix.length > 0 && (
          <span className={HINT_TYPED_CLASS}>{prefix}</span>
        )}
        {rest}
      </>
    );
    const render = (parent: HTMLElement, el?: HTMLElement) => {
      const root = document.createElement("div");
      root.className = `${HINT_CLASS} ${extraClasses.join(" ")}`;
      if (el) parent.insertBefore(root, el);
      else parent.prepend(root);
      ReactDOM.render(<Tip />, root);
    };
    if (
      el.classList.contains("rm-block-text") ||
      el.id === "block-input-ghost"
    ) {
      const parent = el.closest(".rm-block-main")?.parentElement;
      if (parent) render(parent);
    } else if (
      extraClasses &&
      extraClasses.some((x) =>
        [
          LEFT_SIDEBAR_TOGGLE_CLASS,
          RIGHT_SIDEBAR_CLOSE_CLASS,
          SIDE_PAGE_CLOSE_CLASS,
        ].includes(x)
      )
    ) {
      // Typically if the parent doesn't exist, then a re-render is
      // scheduled to properly render the sidebar toggle.
      if (el.parentElement) {
        render(el.parentElement, el);
      }
    } else {
      render(el);
    }
    return true;
  }
  return false;
};

// Assign keys to items based on their text.
const assignKeysToItems = (items: Item[]) => {
  let item;
  let keys;
  let prefix;
  // Ensure none of the results are prefixes or equal to this keysequence.
  const prefixNotAliased = (ks: string) => {
    for (let i = 1; i <= ks.length; i++) {
      const sliced = ks.slice(0, i);
      if (currentOptions[sliced]) {
        return false;
      }
    }
    return true;
  };
  const noAliasing = (ks: string) => {
    if (!prefixNotAliased(ks)) {
      return false;
    }
    // Ensure this is keysequence is not a prefix of any other keysequence.
    if (currentNavigatePrefixesUsed[ks]) {
      return false;
    }
    return true;
  };
  const addResult = (ks: string, x: Item) => {
    const noAlias = noAliasing(ks);
    if (noAlias) {
      currentOptions[ks] = x;
      for (let i = 1; i <= ks.length; i++) {
        currentNavigatePrefixesUsed[ks.slice(0, i)] = true;
      }
    }
    return noAlias;
  };
  const addViaKeyFunc = (mode: string, f: (i: Item) => string) => {
    const groups: Record<string, number[]> = {};
    for (let j = 0; j < items.length; j++) {
      keys = f(items[j]);
      if (keys) {
        let group = groups[keys];
        if (!group) {
          group = [];
          groups[keys] = group;
        }
        group.push(j);
      }
    }
    const qualifying = [];
    for (keys in groups) {
      if (noAliasing(keys)) {
        const groupItems = groups[keys];
        let qualifies = false;
        if (mode === "no-shortening") {
          qualifies = true;
        } else if (mode === "try-shortening") {
          // Prefer shortened key sequences if they are unambiguous.
          for (let sl = MAX_NAVIGATE_PREFIX - 1; sl > 0; sl--) {
            const shortened = keys.slice(0, sl);
            if (noAliasing(shortened)) {
              let found = true;
              for (const otherKeys in groups) {
                if (
                  otherKeys !== keys &&
                  otherKeys.slice(0, sl) !== shortened
                ) {
                  found = false;
                  break;
                }
              }
              if (found) {
                keys = shortened;
                break;
              }
            } else {
              break;
            }
          }
          // Still allow ambiguous assignments, even if there is no
          // shortening.
          qualifies = true;
        } else {
          console.error(
            "Inconstiant violation: unexpected mode in addViaKeyFunc"
          );
        }
        if (qualifies) {
          qualifying.push([keys, groupItems[0]] as const);
        }
      }
    }
    // sort backwards so that deletion works.
    qualifying.sort((a, b) => {
      return b[1] - a[1];
    });
    for (let k = 0; k < qualifying.length; k++) {
      keys = qualifying[k][0];
      const ix = qualifying[k][1];
      item = items[ix];
      if (addResult(keys, item)) {
        items.splice(ix, 1);
      }
    }
  };
  // Handle items with 'mustBeKeys' set.
  addViaKeyFunc("no-shortening", (it) => {
    return it.mustBeKeys;
  });
  // When initials are at least MAX_NAVIGATE_PREFIX in length, prefer
  // assigning those.
  addViaKeyFunc("no-shortening", (it) => {
    const initials = it.initials;
    if (initials && initials.length >= MAX_NAVIGATE_PREFIX) {
      return initials.slice(0, MAX_NAVIGATE_PREFIX);
    } else {
      return null;
    }
  });
  // Attempt to use prefix as the key sequence.
  addViaKeyFunc("try-shortening", (it) => {
    if (it.text) {
      return it.text.slice(0, MAX_NAVIGATE_PREFIX);
    } else {
      return null;
    }
  });
  // For the ones that didn't have unambiguous prefixes, try other character
  // prefixes.
  for (let p = MAX_NAVIGATE_PREFIX - 1; p >= 0; p--) {
    for (let m = 0; m < items.length; m++) {
      item = items[m];
      if (!item.text) {
        continue;
      }
      prefix = item.text.slice(0, MAX_NAVIGATE_PREFIX - 1);
      if (prefixNotAliased(prefix)) {
        for (let n = -1; n < JUMP_KEYS.length; n++) {
          if (n === -1) {
            if (prefix.length > 0) {
              // First, try doubling the last key, easiest to type.
              keys = prefix + prefix[prefix.length - 1];
            } else {
              continue;
            }
          } else {
            keys = prefix + JUMP_KEYS[n];
          }
          if (addResult(keys, item)) {
            items.splice(m, 1);
            m--;
            break;
          }
        }
      }
    }
  }
  // VARGAS-TODO items.forEach addResult(nextAvailableKey, item);
};

const setupNavigate = () => {
  updateBreadcrumbs();
  if (!document.body.classList.contains(NAVIGATE_CLASS)) {
    document.body.classList.add(NAVIGATE_CLASS);
  }

  try {
    const sidebar = document.querySelector(".roam-sidebar-container");

    const navigateItems: Item[] = [];

    // Add top level navigations to the list of navigateItems
    if (sidebar) {
      Array.from(sidebar.getElementsByClassName("log-button")).forEach(
        (logButton: HTMLDivElement) => {
          const text = (
            logButton.querySelector(".icon")?.nextSibling?.nodeValue || ""
          ).toLowerCase();
          if (text === "daily notes") {
            const option = {
              element: logButton,
              mustBeKeys: "g",
              navigate: () =>
                window.roamAlphaAPI.ui.mainWindow.openDailyNotes(),
            };
            navigateItems.push(option);
          } else if (text === "graph overview") {
            const option = {
              element: logButton,
              mustBeKeys: "o" + ENTER_SYMBOL,
              navigate: async () => {
                window.location.hash = `#/${
                  window.roamAlphaAPI.graph.type === "hosted"
                    ? "app"
                    : "offline"
                }/${window.roamAlphaAPI.graph.name}/graph`;
              },
            };
            navigateItems.push(option);
          } else if (text === "all pages") {
            const option = {
              element: logButton,
              mustBeKeys: "ap",
              navigate: async () => {
                window.location.hash = `#/${
                  window.roamAlphaAPI.graph.type === "hosted"
                    ? "app"
                    : "offline"
                }/${window.roamAlphaAPI.graph.name}/search`;
              },
            };
            navigateItems.push(option);
          } else if (text === "roam depot") {
            const option = {
              element: logButton,
              mustBeKeys: "rd",
              navigate: async () => {
                logButton.click();
              },
            };
            navigateItems.push(option);
          } else {
            console.error("Unhandled .log-button:", text);
          }
        }
      );

      // Add starred shortcuts to the list of navigateItems
      const starredPages = sidebar.querySelector(".starred-pages");
      if (starredPages) {
        const item = starredPages.querySelector("a");
        if (item) {
          const page = item.querySelector<HTMLDivElement>(".page");
          if (page) {
            const text = page.innerText;
            navigateItems.push({
              element: item,
              mustBeKeys: null,
              text: preprocessItemText(text),
              initials: getItemInitials(text),
              navigate: () =>
                window.roamAlphaAPI.ui.mainWindow.openPage({
                  page: { title: text },
                }),
            });
          }
        }
      }
    }

    [
      {
        cls: ".rm-topbar .bp3-icon-menu",
        navigate: () => window.roamAlphaAPI.ui.leftSidebar.open(),
      },
      {
        cls: ".rm-topbar .bp3-icon-menu-open",
        navigate: () => window.roamAlphaAPI.ui.rightSidebar.close(),
      },
      {
        cls: ".roam-sidebar-container .bp3-icon-menu-closed",
        navigate: () => window.roamAlphaAPI.ui.leftSidebar.close(),
      },
    ].forEach(({ cls, navigate }) => {
      const button = document.querySelector<HTMLButtonElement>(cls);
      if (button) {
        navigateItems.push({
          element: button,
          mustBeKeys: LEFT_SIDEBAR_KEY,
          extraClasses: [LEFT_SIDEBAR_TOGGLE_CLASS],
          navigate,
        });
      }
    });

    // Add key sequences for every block in article.
    const article = document.querySelector(".roam-article");
    if (article && article.firstChild) {
      const lastBlock = findLastBlock(article.firstElementChild);
      addBlocks(article, lastBlock, "");
    }

    // Add key sequences for every block in sidebar.
    const rightSidebarContent = document.getElementById(
      "roam-right-sidebar-content"
    );
    if (rightSidebarContent) {
      const rightSidebar = document.getElementById("right-sidebar");
      if (rightSidebar) {
        addBlocks(
          rightSidebar,
          findLastBlock(rightSidebar),
          SIDEBAR_BLOCK_PREFIX
        );
        const button = rightSidebar.querySelector<HTMLButtonElement>(
          ".bp3-icon-menu-open"
        );
        if (button) {
          currentOptions["sc"] = {
            element: button,
            extraClasses: [RIGHT_SIDEBAR_CLOSE_CLASS],
            navigate: () => window.roamAlphaAPI.ui.rightSidebar.open(),
          };
        }
        let closeButtonCounter = 0;
        Array.from(
          rightSidebar.getElementsByClassName("bp3-icon-cross")
        ).forEach((closeButton, i) => {
          if (closeButtonCounter < CLOSE_BUTTON_KEYS.length) {
            const key =
              CLOSE_BUTTON_PREFIX + CLOSE_BUTTON_KEYS[closeButtonCounter];
            currentOptions[key] = {
              element: closeButton as HTMLButtonElement,
              extraClasses: [SIDE_PAGE_CLOSE_CLASS],
              navigate: () =>
                window.roamAlphaAPI.ui.rightSidebar.removeWindow({
                  window: window.roamAlphaAPI.ui.rightSidebar.getWindows()[
                    i
                  ] as SidebarWindowInput,
                }),
            };
          }
          closeButtonCounter++;
        });
      }
    }

    // Add key sequences for every page in "All Pages" list.
    const allPagesSearch = document.getElementById("all-pages-search");
    if (allPagesSearch) {
      addBlocks(allPagesSearch, null, "");
    }
    // Add key sequences for every link in article.
    if (article) addLinks(navigateItems, article);

    // Add key sequences for every link in right sidebar.
    const rightSidebar = document.getElementById("right-sidebar");
    if (rightSidebar) addLinks(navigateItems, rightSidebar);

    const breadcrumbsContainer = document.querySelector(
      `.${BREADCRUMBS_CLASS}`
    );
    if (breadcrumbsContainer) addLinks(navigateItems, breadcrumbsContainer);

    assignKeysToItems(navigateItems);

    // Finish navigation immediately if no tips to render.
    if (!rerenderTips() && isNavigating) {
      endNavigate();
    }
  } catch (ex) {
    endNavigate();
    throw ex;
  }
};

export const navigate = () => {
  if (isNavigating) {
    throw new Error("Invariant violation: navigate while already navigating");
  }

  currentOptions = {};
  currentNavigatePrefixesUsed = {};
  navigateKeysPressed = "";
  isNavigating = true;

  setupNavigate();
};

const DIGIT_REGEX = /^Digit/;
const eventToKey = (ev: KeyboardEvent) => {
  if (ev.key === "Enter") {
    return ENTER_SYMBOL;
  }
  if (ev.key === ":") {
    return ";";
  }
  if (DIGIT_REGEX.test(ev.code)) {
    return ev.code.replace(DIGIT_REGEX, "");
  }
  const result = ev.key.toLowerCase();
  if (result.length === 1) {
    return result;
  }
  console.warn("Ignoring keypress with length =", result.length, ":", result);
};

const handleNavigateKey = (ev: KeyboardEvent) => {
  if (["ArrowUp", "ArrowDown", " "].includes(ev.key)) {
    return;
  } else if (ev.key === "Backspace") {
    navigateKeysPressed = navigateKeysPressed.slice(0, -1);
    rerenderTips();
  } else if (ev.key === "Escape") {
    endNavigate();
  } else {
    const key = eventToKey(ev);
    if (key) {
      navigateKeysPressed += key;
      const option = currentOptions[navigateKeysPressed];
      if (option) {
        option.navigate().then(endNavigate);
      } else if (!rerenderTips()) {
        endNavigate();
      }
    }
  }
};

const keyDownListener = (ev: KeyboardEvent) => {
  if (
    keyIsModifier(ev) ||
    ev.ctrlKey ||
    (ev.altKey && (isNavigating || !isHotKey(ev)))
  ) {
    return;
  }
  if (isNavigating) {
    if (getInputTarget(ev)) {
      endNavigate();
    } else {
      handleNavigateKey(ev);
    }
  } else if (isHotKey(ev)) {
    const inputTarget = getInputTarget(ev);
    if (ev.altKey || !inputTarget) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
      // Deslect input before navigating
      if (inputTarget) {
        inputTarget.blur();
      }
      navigate();
    }
  }
};

let scrollRef = 0;
const handleScrollOrResize = () => {
  window.clearTimeout(scrollRef);
  scrollRef = window.setTimeout(() => {
    if (isNavigating) {
      setupNavigate();
    }
  }, 100);
};

export let enabled = false;
export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (flag) {
    addStyle(
      `.${HINT_CLASS} {
  position: absolute;
  left: 4px;
  margin-top: 4px;
  font-family: monospace;
  font-weight: bold;
  font-size: 14px;
  color: rgb(145, 154, 159);
  z-index: 998;
}
.${HINT_TYPED_CLASS} {
  color: rgb(206, 217, 224);
}
.log-button .${HINT_CLASS} {
  margin-top: 0;
}
#roam-right-sidebar-content {
  position: relative;
}
#roam-right-sidebar-content .${HINT_CLASS} {
  left: 5px;
}
#roam-right-sidebar-content .rm-title-display .${HINT_CLASS} {
  left: -24px;
}
.rm-title-display .${HINT_CLASS} {
  margin-top: 14px;
}
#all-pages-search .table {
  position: relative;
}
.rm-pages-title-text .${HINT_CLASS} {
  left: 10px;
  margin-top: 0px;
}
.${LINK_HINT_CLASS} {
  left: unset !important;
  display: inline;
  margin-top: -14px;
}
.${BREADCRUMBS_CLASS} .${HINT_CLASS} {
  margin-top: -2px;
  margin-left: 5px;
}
    // Prevents clipping of tips.
.${NAVIGATE_CLASS} .parent-path-wrapper {
  flex: 100 0 0;
  overflow: visible !important;
}
.${BREADCRUMBS_CLASS} {
  flex: 100 0 0;
  overflow: hidden;
  height: 45px;
  line-height: 45px;
}
.${BREADCRUMBS_CLASS} > span {
  float: right;
  margin-left: 5px;
}
.${BREADCRUMBS_CLASS} .rm-page-ref {
  white-space: nowrap;
  overflow: hidden;
  max-width: 256px;
  text-overflow: ellipsis;
  border-left: 0.5px solid #666;
  padding-left: 5px;
}

.${NAVIGATE_CLASS} .bp3-icon-menu-closed {
  opacity: initial !important;
}
.${LEFT_SIDEBAR_TOGGLE_CLASS} {
  width: 0;
  height: 0;
  position: relative;
  top: -22px;
  left: 8px;
}
.roam-sidebar-content .${LEFT_SIDEBAR_TOGGLE_CLASS} {
  left: 42px;
}
.${RIGHT_SIDEBAR_CLOSE_CLASS} {
  position: relative;
  width: 0;
  height: 0;
  top: -25px;
  left: 3px;
}
#roam-right-sidebar-content .${SIDE_PAGE_CLOSE_CLASS} {
  position: relative;
  width: 0;
  height: 0;
  top: -16px !important;
  left: 4px !important;
}`,
      STYLE_ID
    );
    document.addEventListener("keydown", keyDownListener, true);
    window.addEventListener("resize", handleScrollOrResize);
  } else {
    endNavigate();
    document.getElementById(STYLE_ID)?.remove?.();
    document.removeEventListener("keydown", keyDownListener, true);
    window.removeEventListener("resize", handleScrollOrResize);
  }
};
