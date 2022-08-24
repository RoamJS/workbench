import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";

type Breadcrumbs = { hash: string; title: string; uid?: string }[];

type Item = {
  element?: Element;
  mustBeKeys?: string | null;
  text?: string;
  initials?: string;
  isNavigateOption?: boolean;
  keepGoing?: boolean;
  extraClasses?: string[];
  uid?: string;
  isLink?: boolean;
};

let finishNavigate: () => void = null;
let currentOptions: Record<string, Item> = {};
let currentNavigatePrefixesUsed: Record<string, boolean> = {};
let navigateKeysPressed = "";

const BREADCRUMBS_CLASS = "roam_navigator_breadcrumbs";
const IS_DAILY_NOTES_REGEX = /#\/(offline|app)\/[^\/]+$/;
const IS_ALL_PAGES_REGEX = /#\/(offline|app)\/[^\/]+\/search$/;
const IS_GRAPH_OVERVIEW_REGEX = /#\/(offline|app)\/[^\/]+\/graph$/;
const breadcrumbs: Breadcrumbs = [];

const keyIsModifier = (ev: KeyboardEvent) => {
  return (
    ev.key === "Shift" ||
    ev.key === "Meta" ||
    ev.key === "Control" ||
    ev.key === "Alt"
  );
};

const isNavigating = () => {
  return finishNavigate !== null;
};

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
  const shouldBeVisible = isNavigating();
  if (!shouldBeVisible) {
    clearBreadcrumbs();
  } else if (changed || !alreadyVisible) {
    clearBreadcrumbs();
    renderBreadcrumbs();
  }
};

function setupNavigate() {
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
            Array.from(logButton.childNodes).find((c) => c.nodeName === "#text")
              ?.nodeValue || ""
          ).toLowerCase();
          if (text === "daily notes") {
            const option = {
              element: logButton,
              mustBeKeys: DAILY_NOTES_KEY,
              keepGoing: true,
              isNavigateOption: true,
            };
            navigateItems.push(option);
          } else if (text === "graph overview") {
            const option = {
              element: logButton,
              mustBeKeys: GRAPH_OVERVIEW_KEY,
              keepGoing: true,
              isNavigateOption: true,
            };
            navigateItems.push(option);
          } else if (text === "all pages") {
            const option = {
              element: logButton,
              mustBeKeys: ALL_PAGES_KEYS,
              keepGoing: true,
              isNavigateOption: true,
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
              isNavigateOption: true,
              keepGoing: true,
            });
          }
        }
      }
    }

    [
      ".rm-topbar .bp3-icon-menu",
      ".rm-topbar .bp3-icon-menu-open",
      ".roam-sidebar-container .bp3-icon-menu-closed",
    ].forEach((cls) => {
      const button = document.querySelector(cls);
      if (button) {
        navigateItems.push({
          element: button,
          mustBeKeys: LEFT_SIDEBAR_KEY,
          keepGoing: true,
          extraClasses: [LEFT_SIDEBAR_TOGGLE_CLASS],
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
    const rightSidebarContent = getById("roam-right-sidebar-content");
    if (rightSidebarContent) {
      withId("right-sidebar", (rightSidebar) => {
        addBlocks(
          rightSidebar,
          findLastBlock(rightSidebar),
          SIDEBAR_BLOCK_PREFIX
        );
        withUniqueClass(rightSidebar, "bp3-icon-menu-open", all, (button) => {
          currentOptions["sc"] = {
            element: button,
            keepGoing: true,
            extraClasses: [RIGHT_SIDEBAR_CLOSE_CLASS],
          };
        });
        let closeButtonCounter = 0;
        Array.from(
          rightSidebar.getElementsByClassName("bp3-icon-cross")
        ).forEach((closeButton) => {
          if (closeButtonCounter < CLOSE_BUTTON_KEYS.length) {
            const key =
              CLOSE_BUTTON_PREFIX + CLOSE_BUTTON_KEYS[closeButtonCounter];
            currentOptions[key] = {
              element: closeButton,
              keepGoing: true,
              extraClasses: [SIDE_PAGE_CLOSE_CLASS],
            };
          }
          closeButtonCounter++;
        });
      });
    }

    // Add key sequences for every page in "All Pages" list.
    const allPagesSearch = getById("all-pages-search");
    if (allPagesSearch) {
      addBlocks(allPagesSearch, null, "");
    }
    // Add key sequences for every link in article.
    if (article) {
      addLinks(navigateItems, article);
    }

    // Add key sequences for every link in right sidebar.
    withId("right-sidebar", (rightSidebar) => {
      addLinks(navigateItems, rightSidebar);
    });

    const breadcrumbsContainer = document.querySelector(
      `.${BREADCRUMBS_CLASS}`
    );
    if (breadcrumbsContainer) {
      addLinks(navigateItems, breadcrumbsContainer);
    }

    assignKeysToItems(navigateItems);

    // Finish navigation immediately if no tips to render.
    if (!rerenderTips() && finishNavigate) {
      endNavigate();
    }
  } catch (ex) {
    endNavigate();
    throw ex;
  }
}

export const navigate = () => {
  if (isNavigating()) {
    throw new Error("Invariant violation: navigate while already navigating");
  }

  currentOptions = {};
  currentNavigatePrefixesUsed = {};
  navigateKeysPressed = "";

  finishNavigate = clearBreadcrumbs;

  setupNavigate();
};

const keyDownListener = (ev: KeyboardEvent) => {
  if (
    keyIsModifier(ev) ||
    ev.ctrlKey ||
    (ev.altKey && (isNavigating() || !isHotKey(ev)))
  ) {
    return;
  }
  if (isNavigating()) {
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

export let enabled = false;
export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (flag) {
    document.addEventListener("keydown", keyDownListener, true);
    window.addEventListener("resize", handleScrollOrResize);
  } else {
    document.removeEventListener("keydown", keyDownListener);
    window.removeEventListener("resize", handleScrollOrResize);
  }
};

// EVERYTHING BELOW THIS LINE IS DEPRECATED //

// Symbol used to indicate the enter key.
const ENTER_SYMBOL = "⏎";

const DAILY_NOTES_KEY = "g";

// Key sequence to navigate to graph overview.
const GRAPH_OVERVIEW_KEY = "o" + ENTER_SYMBOL;

// Key sequence to navigate to all pages view.
const ALL_PAGES_KEYS = "ap";

// Key sequence prefix for sidebar blocks.
const SIDEBAR_BLOCK_PREFIX = "s";

// Key sequence prefix for sidebar close buttons.
const CLOSE_BUTTON_PREFIX = "x";

// Key sequence for last block.
const LAST_BLOCK_KEY = "b";

// Key to scroll up a bit.
const SCROLL_UP_KEY = "ArrowUp";

// Key to scroll down a bit.
const SCROLL_DOWN_KEY = "ArrowDown";

// Key to scroll a half page down and half page up with shift.
const BIG_SCROLL_KEY = " ";

// Key to toggle left sidebar visibility.
const LEFT_SIDEBAR_KEY = "`";

// Maximum number of breadcrumbs (recent pages) to keep track of /
// attempt to display.
const MAX_BREADCRUMB_COUNT = 15;

const MAX_NAVIGATE_PREFIX = 2;

const handleScrollOrResize = throttle(100, () => {
  if (isNavigating()) {
    setupNavigate();
  }
});

/*
  var IS_CHROME = /Chrom/.test(navigator.userAgent) &&
    /Google Inc/.test(navigator.vendor);
  */

const HINT_CLASS = "roam_navigator_hint";
const HINT_TYPED_CLASS = "roam_navigator_hint_typed";
const LINK_HINT_CLASS = "roam_navigator_link_hint";
const NAVIGATE_CLASS = "roam_navigator_navigating";
const LEFT_SIDEBAR_TOGGLE_CLASS = "roam_navigator_left_sidebar_toggle";
const RIGHT_SIDEBAR_CLOSE_CLASS = "roam_navigator_right_sidebar_close";
const SIDE_PAGE_CLOSE_CLASS = "roam_navigator_side_page_close";

function endNavigate() {
  if (!isNavigating()) {
    throw new Error("Invariant violation: endNavigate while not navigating.");
  }
  finishNavigate();
  finishNavigate = null;
  currentOptions = {};
  closeSidebarIfOpened();
  removeOldTips();
  if (document.body.classList.contains(NAVIGATE_CLASS)) {
    document.body.classList.remove(NAVIGATE_CLASS);
  }
}

function findLastBlock(el: Element) {
  const firstLogPage = getFirstClass(el, "roam-log-page");
  const container = firstLogPage
    ? getFirstClass(firstLogPage, "flex-v-box")
    : el;
  if (container) {
    // TODO: inefficient to query all blocks twice.
    const query = ".rm-block-text, #block-input-ghost";
    return findLast(all, Array.from(container.querySelectorAll(query)));
  }
  return null;
}

function addBlocks(el: Element, lastBlock: Element, prefix: string) {
  let offset = 0;
  const blocks = el.querySelectorAll(
    [
      ".rm-block-text",
      ".rm-title-display",
      ".rm-pages-title-text",
      "#block-input-ghost",
    ].join(", ")
  );
  const maxDigits = Math.floor(Math.log10(Math.max(1, blocks.length - 1))) + 1;
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
    currentOptions[key] = {
      element: block,
      mustBeKeys: key,
      keepGoing: !block.classList.contains("rm-block-text"),
    };
  }
}

function addLinks(linkItems: Item[], container: Element) {
  const links = container.querySelectorAll<HTMLElement>(
    [".rm-page-ref", "a"].join(", ")
  );
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const boundingRect = link.getBoundingClientRect();
    const visible = container.classList.contains(BREADCRUMBS_CLASS)
      ? boundingRect.top < 45
      : boundingRect.bottom > 50 && boundingRect.top < window.innerHeight - 10;
    if (visible) {
      const parent = link.parentElement;
      let el;
      let uid;
      // let isExternalLink = false;
      if (link.tagName === "A") {
        if (parent.classList.contains("rm-ref-page-view-title")) {
          // Link in linked references
          el = parent;
          uid = link.innerText;
        } else if (link.classList.contains("rm-alias")) {
          el = link;
          uid = link.innerText;
        } else {
          const hrefAttr = link.getAttribute("href");
          if (hrefAttr) {
            // External link
            el = link;
            uid = hrefAttr;
            // isExternalLink = true;
          } else {
            if (link.parentElement.tagName === "H1") {
              //TODO: omitting because the tip on sidebar title gets clipped.
              continue;
              /*
                el = link.parentElement;
                uid = link.innerText;
                */
            } else {
              console.warn("Unexpected <a> element", link);
              continue;
            }
          }
        }
      } else if (link.classList.contains("rm-page-ref")) {
        const uidAttr = parent.getAttribute("data-link-uid");
        if (uidAttr) {
          // Internal link
          el = parent;
          uid = uidAttr;
        } else {
          const tagAttr = link.getAttribute("data-tag");
          if (tagAttr) {
            // Internal tag
            el = link;
            uid = tagAttr;
          } else {
            console.error(
              "Expected data-tag or data-link-uid attribute on",
              link
            );
            continue;
          }
        }
      }
      const text = link.innerText;
      linkItems.push({
        element: el,
        mustBeKeys: null,
        text: preprocessItemText(text),
        initials: getItemInitials(text),
        extraClasses: [LINK_HINT_CLASS],
        uid: uid,
        keepGoing: true,
      });
    }
  }
}

// Add in tips to tell the user what key to press.
function rerenderTips() {
  updateBreadcrumbs();
  removeOldTips();
  return Object.entries(currentOptions)
    .map(([k, opt]) => {
      return renderTip(k, opt);
    })
    .some((s) => !!s);
}

function renderTip(key: string, option: Item) {
  const prefix = key.slice(0, navigateKeysPressed.length);
  const rest = key.slice(navigateKeysPressed.length);
  if (prefix === navigateKeysPressed) {
    if (option.element) {
      renderTipInternal(prefix, rest, option.element, option.extraClasses);
    } else {
      console.error("element not set in", key, option);
    }
    return true;
  }
  return false;
}

function renderTipInternal(
  prefix: string,
  rest: string,
  el: Element,
  extraClasses: string[]
) {
  const tip = div({ class: HINT_CLASS }, text(rest));
  if (extraClasses) {
    for (const cls of extraClasses) {
      tip.classList.add(cls);
    }
  }
  if (prefix.length > 0) {
    tip.prepend(span({ class: HINT_TYPED_CLASS }, text(prefix)));
  }
  if (el.classList.contains("rm-block-text") || el.id === "block-input-ghost") {
    findParent(el, (el) => el.classList.contains("rm-block-main")).prepend(tip);
  } else if (
    extraClasses &&
    extraClasses.findIndex(
      (x) =>
        x === LEFT_SIDEBAR_TOGGLE_CLASS ||
        x === RIGHT_SIDEBAR_CLOSE_CLASS ||
        x === SIDE_PAGE_CLOSE_CLASS
    ) >= 0
  ) {
    // Typically if the parent doesn't exist, then a re-render is
    // scheduled to properly render the sidebar toggle.
    if (el.parentElement) {
      el.parentElement.insertBefore(tip, el);
    }
  } else if (el.classList.contains("bp3-icon-cross")) {
    el.prepend(tip);
  } else {
    el.prepend(tip);
  }
}

function closeSidebarIfOpened() {
  const bodyMain = document.querySelector(".roam-body-main");
  if (bodyMain) {
    mouseOver(bodyMain);
  }
}

// Lowercase and take only alphanumeric.
function preprocessItemText(txt: string) {
  let result = "";
  for (let i = 0; i < txt.length; i++) {
    const char = txt[i];
    const lowerChar = char.toLowerCase();
    if (lowercaseCharIsAlpha(lowerChar)) {
      result += lowerChar;
    }
  }
  return result;
}

// Lowercase and get initials.
function getItemInitials(txt: string) {
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
}

function lowercaseCharIsAlpha(char: string) {
  const code = char.charCodeAt(0);
  return code > 96 && code < 123; // (a-z)
}

const JUMP_KEYS = "asdfghjklqwertyuiopzxcvbnm";
const CLOSE_BUTTON_KEYS = "0123456789" + JUMP_KEYS;

// Assign keys to items based on their text.
function assignKeysToItems(items: Item[]) {
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
}

function handleScrollKey(ev: KeyboardEvent) {
  if (ev.key === BIG_SCROLL_KEY) {
    // Space to scroll down.  Shift+space to scroll up.
    withContainerToScroll((container) => {
      if (ev.shiftKey) {
        container.scrollBy(0, container.clientHeight / -2);
      } else {
        container.scrollBy(0, container.clientHeight / 2);
      }
    });
    return true;
  } else if (ev.key === SCROLL_UP_KEY) {
    // Up arrow to scroll up a little bit.
    withContainerToScroll((container) => {
      container.scrollBy(0, -40);
    });
    return true;
  } else if (ev.key === SCROLL_DOWN_KEY) {
    // Down arrow to scroll down a little bit.
    withContainerToScroll((container) => {
      container.scrollBy(0, 40);
    });
    return true;
  }
  return false;
}

function handleNavigateKey(ev: KeyboardEvent) {
  console.log("handleNavigateKey");
  let keepGoing = false;
  try {
    if (handleScrollKey(ev)) {
      keepGoing = true;
    } else if (ev.key === "Backspace") {
      navigateKeysPressed = navigateKeysPressed.slice(0, -1);
      console.log("navigateKeysPressed after backspace:", navigateKeysPressed);
      keepGoing = rerenderTips();
    } else if (ev.key === "Escape") {
      keepGoing = false;
    } else {
      const key = eventToKey(ev);
      if (key) {
        navigateKeysPressed += key;
        const option = currentOptions[navigateKeysPressed];
        if (option) {
          const el = option.element;
          keepGoing = option.keepGoing;
          navigateToElement(ev, el);
          // Special case: should not keep going after clicking
          // title to edit.
          if (el.classList.contains("rm-title-display") && !ev.shiftKey) {
            keepGoing = false;
          }
          // Scroll the clicked thing into view, if needed.
          // @ts-ignore non-standard
          (el as HTMLElement).scrollIntoViewIfNeeded();
          // If we're just changing folding, then the user probably wants to
          // stay in navigation mode, so reset and rerender.
          if (keepGoing) {
            navigateKeysPressed = "";
            keepGoing = rerenderTips();
          }
        } else {
          keepGoing = rerenderTips();
        }
      }
    }
  } finally {
    if (!keepGoing && isNavigating()) {
      endNavigate();
    }
  }
}

function eventToKey(ev: KeyboardEvent) {
  if (ev.key === "Enter") {
    return ENTER_SYMBOL;
  }
  if (ev.key === ":") {
    return ";";
  }
  const digit = stripPrefix("Digit", ev.code);
  if (digit) {
    return digit;
  }
  const result = ev.key.toLowerCase();
  if (result.length === 1) {
    return result;
  }
  console.warn("Ignoring keypress with length =", result.length, ":", result);
}

function navigateToElement(
  ev: KeyboardEvent,
  el: Element,
  f?: (el: Element) => void
) {
  let scheduleRerender = false;
  let closeSidebar = true;
  if (el.classList.contains("rm-block-text")) {
    const blockParent = el.parentElement;
    click(el);
    persistentlyFind(
      () => blockParent.getElementsByTagName("textarea")[0],
      (el) => {
        const textarea = el as HTMLTextAreaElement;
        textarea.focus();
        const lastPosition = textarea.value.length;
        textarea.setSelectionRange(lastPosition, lastPosition);
        if (f) {
          f(textarea);
        }
      }
    );
    return;
  }
  const clickFunc = ev.shiftKey ? shiftClick : click;
  if (
    ["rm-ref-page-view-title", "rm-title-display"].find((cls) =>
      el.classList.contains(cls)
    )
  ) {
    clickFunc(
      Array.from(el.getElementsByTagName("span")).find(
        (el) => !el.classList.contains(HINT_TYPED_CLASS)
      )
    );
  } else if (el.classList.contains("bp3-icon-menu")) {
    // Hover to open sidebar
    mouseOver(el);
    closeSidebar = false;
  } else if (
    ["bp3-icon-menu-open", "bp3-icon-menu-closed"].some((cls) =>
      el.classList.contains(cls)
    )
  ) {
    click(el);
    // Sidebar toggling tip doesn't promptly update, so defer a
    // couple re-renders.
    scheduleRerender = true;
    /* Aborted attempt at opening links in new tab without switching to it
    } else if (el.attributes['href']) {
      if (ev.shiftKey || !IS_CHROME) {
        // Shift on external links causes a normal click, causing
        // focus to switch to new tab.
        click(el);
      } else {
        // This appears to only work in chrome - opens link in a new
        // tab without switching focus.
        console.log('MIDDLE CLICK');
        var middleClick = new MouseEvent( 'click', { 'button': 1, 'which': 2 });
        el.dispatchEvent(middleClick);
      }
      */
  } else {
    const pageRef = el.querySelector(".rm-page-ref");
    if (pageRef) {
      clickFunc(pageRef);
    } else {
      const innerDiv = Array.from(el.getElementsByTagName("div")).find(
        (el) => !el.classList.contains(HINT_CLASS)
      );
      if (innerDiv) {
        clickFunc(innerDiv);
        setTimeout(() => clickFunc(innerDiv));
      } else {
        clickFunc(el);
      }
    }
  }
  if (closeSidebar) {
    closeSidebarIfOpened();
  }
  if (scheduleRerender) {
    setTimeout(() => {
      rerenderTips();
    }, 50);
    setTimeout(() => {
      rerenderTips();
    }, 100);
  }
}

function withContainerToScroll(f: (el: Element) => void) {
  if (navigateKeysPressed.startsWith(SIDEBAR_BLOCK_PREFIX)) {
    withId("roam-right-sidebar-content", f);
  } else {
    const allPages = getById("all-pages-search");
    if (allPages) {
      withUniqueClass(allPages, "table", all, f);
    } else {
      withUniqueClass(document, "roam-body-main", all, (main) => {
        f(main.firstElementChild);
      });
    }
  }
}

function removeOldTips() {
  // FIXME: I can't quite explain this, but for some reason, querying the
  // list that matches the class name doesn't quite work.  So instead find
  // and remove until they are all gone.
  let toDelete: Element[] = [];
  do {
    for (let i = 0; i < toDelete.length; i++) {
      const el = toDelete[i];
      el.parentElement.removeChild(el);
    }
    toDelete = Array.from(document.getElementsByClassName(HINT_CLASS));
  } while (toDelete.length > 0);
}

// Attributes used for link portion of breadcrumbs.
const LINK_ATTRS = {
  tabindex: "-1",
  class: "rm-page-ref rm-page-ref-link-color",
};

function renderBreadcrumbs() {
  const container = div({ class: BREADCRUMBS_CLASS });
  for (let i = breadcrumbs.length - 2; i >= 0; i--) {
    const breadcrumb = breadcrumbs[i];
    const breadcrumbAttrs: Record<string, string> = {
      title: breadcrumb.title,
      "data-link-title": breadcrumb.title,
    };
    if ("uid" in breadcrumb) {
      breadcrumbAttrs["data-link-uid"] = breadcrumb["uid"];
    }
    const breadcrumbSpan = span(breadcrumbAttrs);
    breadcrumbSpan.appendChild(span(LINK_ATTRS, text(breadcrumb.title)));
    breadcrumbSpan.onclick = () => {
      setTimeout(() => {
        window.location.hash = breadcrumb.hash;
      });
    };
    container.appendChild(breadcrumbSpan);
  }

  const topbar = document.querySelector(".rm-topbar");
  if (topbar) {
    const sidebarButton = [".bp3-icon-menu", ".bp3-icon-menu-open"]
      .map((q) => topbar.querySelector(q))
      .find((q) => !!q);
    if (sidebarButton && sidebarButton.nextSibling) {
      topbar.insertBefore(container, sidebarButton.nextSibling);
    } else {
      topbar.insertBefore(container, topbar.firstChild);
    }
  }
}

/*****************************************************************************
 * Utilities
 */

function persistentlyFind(finder: () => Element, f: (el: Element) => void) {
  persistentlyFindImpl(finder, 0, f);
}

function persistentlyFindImpl(
  finder: () => Element,
  n: number,
  f: (el: Element) => void
) {
  const el = finder();
  if (el) {
    f(el);
  } else if (n > 1000) {
    console.warn("Giving up on finding after", n, "retries.");
  } else {
    setTimeout(() => persistentlyFindImpl(finder, n + 1, f), 15);
  }
}

function throttle(ivl: number, f: () => void) {
  let prev = 0;
  return () => {
    const now = new Date();
    if (now.valueOf() - prev >= ivl) {
      f();
      prev = now.valueOf();
    }
  };
}

// Simulate a mouse over event.
function mouseOver(el: Element) {
  const options = {
    bubbles: true,
    cancelable: true,
    view: window,
    target: el,
  };
  el.dispatchEvent(new MouseEvent("mouseover", options));
}

// Simulate a mouse click.
function click(el: Element) {
  const options = {
    bubbles: true,
    cancelable: true,
    view: window,
    target: el,
    which: 1,
    button: 0,
  };
  el.dispatchEvent(new MouseEvent("mousedown", options));
  el.dispatchEvent(new MouseEvent("mouseup", options));
  el.dispatchEvent(new MouseEvent("click", options));
}

// Simulate a shift mouse click.
// eslint-disable-next-line no-unused-vars
function shiftClick(el: Element) {
  const options = {
    bubbles: true,
    cancelable: true,
    view: window,
    which: 1,
    button: 0,
    shiftKey: true,
    target: el,
  };
  let ev = new MouseEvent("mousedown", options);
  ev.preventDefault();
  el.dispatchEvent(ev);
  ev = new MouseEvent("mouseup", options);
  ev.preventDefault();
  el.dispatchEvent(ev);
  ev = new MouseEvent("click", options);
  ev.preventDefault();
  el.dispatchEvent(ev);
}

// https://github.com/greasemonkey/greasemonkey/issues/2724#issuecomment-354005162
function addCss(css: string) {
  const style = document.createElement("style");
  style.textContent = css;
  document.documentElement.appendChild(style);
  return style;
}

// Alias for document.getElementById
function getById(id: string) {
  return document.getElementById(id);
}

// Invokes the function for the matching id, or logs a console.warning.
function withId(id: string, f: (el: Element) => void, ...rest: unknown[]) {
  if (rest.length > 0) {
    console.error("Too many arguments passed to withId", rest);
  }
  const el = getById(id);
  if (el) {
    return f(el);
  } else {
    console.warn("Couldn't find ID", id);
    return null;
  }
}

// Invokes the function for every descendant element that matches a
// tag name.
function withTag(
  parent: Element,
  tag: string,
  f: (el: Element) => void,
  ...rest: unknown[]
) {
  if (rest.length > 0) {
    console.error("Too many arguments passed to withTag", rest);
  }
  const els = parent.getElementsByTagName(tag);
  for (let i = 0; i < els.length; i++) {
    f(els[i]);
  }
}

// Finds a parentElement which matches the specified
// predicate. Returns null if element is null.
function findParent(el0: Element, predicate: (el: Element) => boolean) {
  if (!el0) return null;
  let el = el0.parentElement;
  if (!el) return null;
  do {
    if (predicate(el)) {
      return el;
    }
    el = el.parentElement;
  } while (el);
  return null;
}

// Returns first descendant that matches the specified class and
// predicate.
function getFirstClass(
  parent: Element,
  cls: string,
  predicate?: (el: Element) => boolean
) {
  return Array.from(parent.getElementsByClassName(cls)).find(predicate);
}

// Checks that there is only one descendant element that matches the
// class name, and invokes the function on it. Logs a console.warning if
// there isn't exactly one.
function withUniqueClass(
  parent: Element | Document,
  cls: string,
  predicate: (el: Element) => boolean,
  f: (el: HTMLElement) => void
) {
  const result = Array.from(parent.getElementsByClassName(cls)).find(predicate);
  if (result) {
    return f(result as HTMLElement);
  } else {
    console.warn(
      "Couldn't find unique descendant with class",
      cls,
      "and matching predicate, instead got",
      result
    );
    return null;
  }
}

// Given a predicate, returns the last element that matches. If predicate is
// null, then it is treated like 'all'.
function findLast(predicate: (el: Element) => boolean, array: Element[]) {
  for (let i = array.length - 1; i >= 0; i--) {
    const el = array[i];
    if (predicate(el)) {
      return el;
    }
  }
  return null;
}

// Returns string with prefix removed.  Returns null if prefix doesn't
// match.
function stripPrefix(prefix: string, string: string) {
  const found = string.slice(0, prefix.length);
  if (found === prefix) {
    return string.slice(prefix.length);
  } else {
    return null;
  }
}

/*****************************************************************************
 * Predicates (for use with get / with functions above)
 */

// Predicate which always returns 'true'.
function all() {
  return true;
}

/*****************************************************************************
 * Utilities for creating elements
 */

function text(x: string) {
  return document.createTextNode(x);
}

function span(attrs: Record<string, string>, ...rest: Node[]) {
  return element("span", attrs, ...rest);
}

function div(attrs: Record<string, string>, ...rest: Node[]) {
  return element("div", attrs, ...rest);
}

function element(
  t: string,
  attrs: Record<string, string>,
  ...children: Node[]
) {
  const el = document.createElement(t);
  for (const attr of Object.keys(attrs)) {
    el.setAttribute(attr, attrs[attr]);
  }
  for (const child of children) {
    el.appendChild(child);
  }
  return el;
}

addCss(
  [
    "." + HINT_CLASS + " {",
    "  position: absolute;",
    "  left: 4px;",
    "  margin-top: 4px;",
    "  font-family: monospace;",
    "  font-weight: bold;",
    "  font-size: 14px;",
    "  color: rgb(145, 154, 159);",
    // z-index of left sidebar is 999
    "  z-index: 998;",
    "}",
    "." + HINT_TYPED_CLASS + " {",
    "  color: rgb(206, 217, 224);",
    "}",
    ".log-button ." + HINT_CLASS + " {",
    "  margin-top: 0;",
    "}",
    "#roam-right-sidebar-content {",
    "  position: relative;",
    "}",
    "#roam-right-sidebar-content ." + HINT_CLASS + " {",
    "  left: 5px;",
    "}",
    "#roam-right-sidebar-content .rm-title-display ." + HINT_CLASS + " {",
    "  left: -24px;",
    "}",
    ".rm-title-display ." + HINT_CLASS + " {",
    "  margin-top: 14px;",
    "}",
    "#all-pages-search .table {",
    "  position: relative;",
    "}",
    ".rm-pages-title-text ." + HINT_CLASS + " {",
    "  left: 10px;",
    "  margin-top: 0px;",
    "}",
    "." + LINK_HINT_CLASS + " {",
    "  left: unset !important;",
    "  display: inline;",
    "  margin-top: -14px;",
    "}",
    "." + BREADCRUMBS_CLASS + " ." + HINT_CLASS + " {",
    "  margin-top: -2px;",
    "  margin-left: 5px;",
    "}",
    // Prevents clipping of tips.
    "." + NAVIGATE_CLASS + " .parent-path-wrapper {",
    "  flex: 100 0 0;",
    "  overflow: visible !important;",
    "}",
    "." + BREADCRUMBS_CLASS + " {",
    "  flex: 100 0 0;",
    "  overflow: hidden;",
    "  height: 45px;",
    "  line-height: 45px;",
    "}",
    "." + BREADCRUMBS_CLASS + " > span {",
    "  float: right;",
    "  margin-left: 5px;",
    "}",
    "." + BREADCRUMBS_CLASS + " .rm-page-ref {",
    "  white-space: nowrap;",
    "  overflow: hidden;",
    "  max-width: 256px;",
    "  text-overflow: ellipsis;",
    "  border-left: 0.5px solid #666;",
    "  padding-left: 5px;",
    "}",
    // Shows sidebar toggle
    "." + NAVIGATE_CLASS + " .bp3-icon-menu-closed {",
    "  opacity: initial !important;",
    "}",
    "." + LEFT_SIDEBAR_TOGGLE_CLASS + " {",
    "  width: 0;",
    "  height: 0;",
    "  position: relative;",
    "  top: -22px;",
    "  left: 8px;",
    "}",
    ".roam-sidebar-content ." + LEFT_SIDEBAR_TOGGLE_CLASS + " {",
    "  left: 42px;",
    "}",
    // Fix positioning of sidebar close tip
    "." + RIGHT_SIDEBAR_CLOSE_CLASS + " {",
    "  position: relative;",
    "  width: 0;",
    "  height: 0;",
    "  top: -25px;",
    "  left: 3px;",
    "}",
    "#roam-right-sidebar-content ." + SIDE_PAGE_CLOSE_CLASS + " {",
    "  position: relative;",
    "  width: 0;",
    "  height: 0;",
    "  top: -16px !important;",
    "  left: 4px !important;",
    "}",
  ].join("\n")
);
