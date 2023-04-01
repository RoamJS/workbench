import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import createPage from "roamjs-components/writes/createPage";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import type { OnloadArgs, RoamBasicNode } from "roamjs-components/types";
import extractTag from "roamjs-components/util/extractTag";
import addStyle from "roamjs-components/dom/addStyle";
import createTagRegex from "roamjs-components/util/createTagRegex";
import { addCommand } from "./workBench";

export let active = false;
const roamPageWithPrivacyList = "WorkBench Privacy Mode List";
const privacyClassName = "privacyClassName";

const getPrivateBlockDetails = () => {
  const parentUid = getPageUidByPageTitle(roamPageWithPrivacyList);
  const blocksFromPrivacyModeList = getBasicTreeByParentUid(parentUid);

  if (blocksFromPrivacyModeList.length == 0) {
    return [];
  } else {
    const blocksFromNestedPrivacyModeList = blocksFromPrivacyModeList.flatMap(
      function flatten(n): RoamBasicNode[] {
        return [n].concat(n.children.flatMap(flatten));
      }
    );
    return blocksFromNestedPrivacyModeList.map((b) => {
      const block = b.text.trim();
      const pageTitleOnly = /^!/.test(block);
      const title = extractTag(block.replace(/^!/, ""));
      return { title, pageTitleOnly };
    });
  }
};

const scanBlocksForPageReferences = (
  privacyList: ReturnType<typeof getPrivateBlockDetails>
) => {
  const isPrivate = new Set(privacyList.map((p) => p.title));
  const isPageTitleOnly = Object.fromEntries(
    privacyList.map(({ title, pageTitleOnly }) => [title, pageTitleOnly])
  );
  const pageName =
    document.querySelector<HTMLHeadingElement>(".rm-title-display")?.innerText;

  document
    .querySelectorAll<HTMLHeadingElement>(".rm-search-title")
    .forEach((e) => {
      if (isPrivate.has(e.innerText)) {
        e.parentElement.classList.add(privacyClassName);
      }
    });
  setTimeout(() => {
    document
      .querySelectorAll<HTMLDivElement>(
        " .rm-search-list-item, .rm-autocomplete-result"
      )
      .forEach((e) => {
        const s = e.innerText.toString();
        privacyList.forEach(({ title }) => {
          const regex = createTagRegex(title);
          if (regex.test(title)) {
            e.classList.add(privacyClassName);
          }
        });
      });
  }, 25);

  if (isPrivate.has(pageName)) {
    if (isPageTitleOnly[pageName]) {
      document
        .querySelector(".rm-title-display")
        .parentElement.classList.add(privacyClassName);
    } else {
      document
        .querySelector(".roam-article > div")
        .classList.add(privacyClassName);
    }
  }

  // handle right side bar page titles
  document
    .querySelectorAll<HTMLDivElement>(".sidebar-content h1 a")
    .forEach((e) => {
      if (isPrivate.has(e.innerText)) {
        if (isPageTitleOnly[e.innerText]) {
          e.parentElement.classList.add(privacyClassName);
        } else {
          e.parentElement.parentElement.parentElement.classList.add(
            privacyClassName
          );
        }
      }
    });

  // handle left side bar page titles
  document
    .querySelectorAll<HTMLDivElement>(".starred-pages div.page")
    .forEach((e) => {
      if (isPrivate.has(e.innerText)) {
        e.parentElement.classList.add(privacyClassName);
      }
    });

  // All pages search
  document
    .querySelectorAll<HTMLAnchorElement>("a.rm-pages-title-text")
    .forEach((e) => {
      if (isPrivate.has(e.innerText)) {
        e.parentElement.classList.add(privacyClassName);
      }
    });

  document
    .querySelectorAll("textarea, span[data-link-title], span[data-tag]")
    .forEach((e) => {
      if (e.tagName == "TEXTAREA") {
        //TEXT AREA ALLOW DISPLAY
        e.closest(".roam-block-container").classList.remove(privacyClassName);
      } else {
        //DISAblE if certain attributes match predeifned ones from privacy list
        const attributeValue = e.hasAttribute("data-link-title")
          ? e.attributes.getNamedItem("data-link-title").value
          : e.attributes.getNamedItem("data-tag").value;
        if (isPrivate.has(attributeValue)) {
          if (isPageTitleOnly[attributeValue]) {
            e.classList.add(privacyClassName);
          } else {
            //KANBAN
            if (
              e.parentElement.parentElement.classList.contains("kanban-card")
            ) {
              e.closest(".kanban-card").classList.add(privacyClassName);
            }
            if (
              e.parentElement.parentElement.classList.contains("kanban-title")
            ) {
              e.closest(".kanban-column").classList.add(privacyClassName);
            }
            //TABLES
            if (e.parentElement.parentElement.parentElement.tagName == "TR") {
              e.parentElement.parentElement.parentElement.classList.add(
                privacyClassName
              );
            }
            //DIAGRAMS
            if (
              e.parentElement.parentElement.parentElement.parentElement
                .tagName == "foreignObject"
            ) {
              e.parentElement.parentElement.parentElement.classList.add(
                privacyClassName
              );
            }
            // apply default mode to blok
            if (
              e.parentElement.parentElement.parentElement.classList.contains(
                "parent-path-wrapper"
              )
            ) {
              e.closest(".rm-reference-item").classList.add(privacyClassName);
            } else {
              e.closest(".roam-block-container").classList.add(
                privacyClassName
              );
            }
          }
        }
      }
    });

  // Process Query titles
  document
    .querySelectorAll<HTMLHeadingElement>(
      ".rm-query-title, .rm-ref-page-view-title"
    )
    .forEach((e) => {
      const s = e.innerText;
      const regex = createTagRegex(s);
      privacyList.forEach((i) => {
        if (regex.test(i.title)) {
          if (isPageTitleOnly) {
            if (!e.hasAttribute("modifiedPrivacyMode")) {
              e.setAttribute("modifiedPrivacyMode", "true");
              e.innerHTML = e.innerHTML.replace(
                regex,
                `<span class="${privacyClassName}">[[${i.title}]]</span>`
              );
            }
          } else {
            e.classList.add(privacyClassName);
          }
        }
      });
    });

  // Process Query
  document.querySelectorAll(".rm-query").forEach((e) => {
    e.childNodes.forEach((n) => {
      if (n.nodeType == Node.TEXT_NODE) {
        //text node type
        const regex = createTagRegex(n.textContent);
        privacyList.forEach((i) => {
          if (regex.test(i.title)) {
            if (i.pageTitleOnly) {
              if (!n.parentElement.hasAttribute("modifiedPrivacyMode")) {
                n.parentElement.setAttribute("modifiedPrivacyMode", "true");
                const txt = document.createElement("span");
                txt.innerHTML = n.textContent.replace(
                  regex,
                  `<span class="${privacyClassName}">[[${i.title}]]</span>`
                );
                n.replaceWith(txt);
              }
            } else {
              e.classList.add(privacyClassName);
            }
          }
        });
      }
    });
  });
};

let observer: MutationObserver = undefined;

const toggleOff = () => {
  document
    .querySelectorAll(`.${privacyClassName}`)
    .forEach((e) => e.classList.remove(privacyClassName));
  document
    .querySelectorAll("div[modifiedPrivacyMode]")
    .forEach((e) => e.removeAttribute("modifiedPrivacyMode"));
  observer?.disconnect();
  observer = undefined;
};

export const toggle = async () => {
  active = !active;
  if (active) {
    const privacyDefined = await getPrivateBlockDetails();
    if (!privacyDefined.length) {
      await window.roamAlphaAPI.ui.mainWindow.openPage({
        page: { title: roamPageWithPrivacyList },
      });
      active = false;
      renderToast({
        content: `[[${roamPageWithPrivacyList}]] page is not defined.
        Please create a block with the [[page name]] or #tag you want
        included in privacy mode in [[${roamPageWithPrivacyList}]]. For more information, please visit the [docs](https://roamjs.com/extensions/workbench/privacy_mode).`,
        intent: "warning",
        id: "workbench-warning",
      });
    } else {
      scanBlocksForPageReferences(privacyDefined);
      observer = new MutationObserver(() =>
        scanBlocksForPageReferences(privacyDefined)
      );
      observer.observe(document, { childList: true, subtree: true });
    }
  } else {
    toggleOff();
  }
};

export let enabled = false;

let wbCommand: () => void;
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  enabled = flag;
  if (flag) {
    if (
      !window.roamAlphaAPI.pull("[:db/id]", [
        ":node/title",
        roamPageWithPrivacyList,
      ])
    ) {
      createPage({ title: roamPageWithPrivacyList });
    }
    addStyle(
      `.${privacyClassName}, .${privacyClassName} * {
        color: transparent !important;
        background: transparent !important;
        border-left: black !important;
      }

      .${privacyClassName}, .${privacyClassName} *::before {
        content: none !important;
        color: transparent !important;
        background: black !important;
      }

      .${privacyClassName} img {
        display:none;
      }`,
      "workbench-privacy-css"
    );
    wbCommand = addCommand(
      {
        label: "Toggle Privacy Mode",
        callback: toggle,
        defaultHotkey: "alt-shift-p",
      },
      extensionAPI
    );
  } else {
    toggleOff();
    wbCommand?.();
    document.getElementById("workbench-privacy-css")?.remove();
  }
};
