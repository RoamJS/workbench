import { navigateUiTo } from "./commonFunctions";
import { displayMessage } from "./help";

let privacyList: string[] = [];
let observer: MutationObserver = undefined;
let _active = false;
let roamPageWithPrivacyList = "Roam42 Privacy Mode List";

export const keyboardHandler = (ev: KeyboardEvent) => {
  if (window != window.parent) {
    return;
  }
  if (ev.shiftKey && ev.altKey && ev.code == "KeyP") {
    ev.preventDefault();
    toggle();
  }
};

export const active = () => {
  return _active;
};

var flattenObject = function (ob: unknown) {
  var toReturn: Record<string, unknown> = {};
  if (typeof ob === "object") {
    for (var i in ob) {
      if (!ob.hasOwnProperty(i)) continue;

      if (typeof (ob as Record<string, unknown>)[i] == "object") {
        var flatObject = flattenObject((ob as Record<string, unknown>)[i]);
        for (var x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;
          toReturn[i + "." + x] = flatObject[x];
        }
      } else {
        toReturn[i] = (ob as Record<string, unknown>)[i];
      }
    }
  }
  return toReturn;
};

async function getPrivateBlockDetails() {
  //get blocks from page Roam42 Privacy Mode List
  var blocksFromRoam42PrivacyModeList = await window.roamAlphaAPI.q(`
          [:find (pull ?e [ :node/title :block/string :block/children {:block/children ...} ])
            :where
            [?e :node/title "Roam42 Privacy Mode List"]]
        `);

  //loop through blocks and retrive UIDs for all [[page links]] or #tags
  if (blocksFromRoam42PrivacyModeList.length == 0) {
    helpBannerForPrivacyMode();
    return false;
  } else {
    if (blocksFromRoam42PrivacyModeList[0][0].children) {
      const blocksFromNestedRoam42PrivacyModeList = flattenObject(
        blocksFromRoam42PrivacyModeList
      );
      for (const b in blocksFromNestedRoam42PrivacyModeList) {
        var block = (blocksFromNestedRoam42PrivacyModeList[b] as string).trim();
        var hidePageTitleNameOnly = false;
        // FIRST Detect TITLE only redactions
        // the block when added to an array will have "!! " at begining to note its a title only redaction
        if (
          block.substring(0, 4) == "#![[" ||
          block.substring(0, 3) == "![[" ||
          block.substring(0, 2) == "!#"
        ) {
          hidePageTitleNameOnly = true;
          block = block.replace("!#", "#");
          block = block.replace("!#", "#");
          block = block.replace("![[", "[[");
        }
        // SECOND process the reference and push it into priavcyList

        if (block.includes("#[[")) {
          block = block.replace("#[[", "").replace("]]", "");
          block = hidePageTitleNameOnly ? "!! " + block : block;
          if (!privacyList.includes(block)) privacyList.push(block);
        } else if (block.includes("#")) {
          block = block.replace("#", "");
          block = hidePageTitleNameOnly ? "!! " + block : block;
          if (!privacyList.includes(block)) privacyList.push(block);
        } else if (block.includes("[[")) {
          block = block.replace("[[", "");
          block = block.substr(0, block.lastIndexOf("]]"));
          block = hidePageTitleNameOnly ? "!! " + block : block;
          if (!privacyList.includes(block)) privacyList.push(block);
        }
      }
      if (privacyList.length == 0) {
        helpBannerForPrivacyMode();
      } else {
        return true;
      }
    } else {
      helpBannerForPrivacyMode();
      return false;
    }
  }
  return false;
}

const helpBannerForPrivacyMode = async () => {
  await navigateUiTo(roamPageWithPrivacyList);
  _active = false;
  setTimeout(() => {
    displayMessage(
      `Roam42 Privacy Mode List Page is not defined. <br/>
           Please create a block with the [[page name]] or #tag you want <br/>
           included in privacy mode. For more information, please see this <a style="color:white" target="_blank" href="https://roamresearch.com/#/app/roamhacker/page/h6WbrPx10">link.</a>`
    );
  }, 2000);
};

const scanBlocksForPageReferences = () => {
  let pageName = "";
  try {
    pageName =
      document.querySelector<HTMLHeadingElement>(".rm-title-display").innerText;
  } catch (e) {}

  try {
    document
      .querySelectorAll<HTMLHeadingElement>(".rm-search-title")
      .forEach((e) => {
        if (
          privacyList.includes(e.innerText) ||
          privacyList.includes("!! " + e.innerText)
        ) {
          e.parentElement.classList.add("roam42-privacy-block");
        }
      });
    //document.querySelectorAll('.bp3-elevation-3 div[title]')    .rm-search-list-item,  .bp3-elevation-3 div[title],
    setTimeout(() => {
      document
        .querySelectorAll<HTMLDivElement>(
          " .rm-search-list-item, .rm-autocomplete-result"
        )
        .forEach((e) => {
          let s = e.innerText.toString();
          privacyList.forEach((i) => {
            i = i.replace("!! ", "");
            if (
              s.indexOf("#" + i) > -1 ||
              s.indexOf("[[" + i + "]]") > -1 ||
              s == i
            ) {
              e.classList.add("roam42-privacy-block");
            }
          });
        });
    }, 25);
  } catch (e) {}

  if (privacyList.includes(pageName)) {
    //if page is specified for redaction, redact just the ENTIRE PAGE
    document
      .querySelector(".roam-article > div")
      .classList.add("roam42-privacy-block");
  } else if (privacyList.includes("!! " + pageName)) {
    //if page name only is specified for redaction (with "!! " in beginning, redact just the PAGE TITLE
    document
      .querySelector(".rm-title-display")
      .parentElement.classList.add("roam42-privacy-block");
  }

  // handle right side bar page titles
  document
    .querySelectorAll<HTMLDivElement>(".sidebar-content h1 a")
    .forEach((e) => {
      if (privacyList.includes(e.innerText)) {
        //if page is specified for redaction, redact just the sidebar block
        e.parentElement.parentElement.parentElement.classList.add(
          "roam42-privacy-block"
        );
      } else if (privacyList.includes("!! " + e.innerText)) {
        //if page name only is specified for redaction (with "!! " in beginning, redact just the PAGE TITLE in side bar
        e.parentElement.classList.add("roam42-privacy-block");
      }
    });

  // handle left side bar page titles
  document
    .querySelectorAll<HTMLDivElement>(".starred-pages div.page")
    .forEach((e) => {
      if (
        privacyList.includes(e.innerText) ||
        privacyList.includes("!! " + e.innerText)
      ) {
        e.parentElement.classList.add("roam42-privacy-block");
      }
    });

  // All pages search
  document
    .querySelectorAll<HTMLAnchorElement>("a.rm-pages-title-text")
    .forEach((e) => {
      let innerText = e.innerText;
      if (
        privacyList.includes(innerText) ||
        privacyList.includes("!! " + innerText)
      ) {
        e.parentElement.classList.add("roam42-privacy-block");
      }
    });

  document
    .querySelectorAll("textarea, span[data-link-title], span[data-tag]")
    .forEach((e) => {
      if (e.tagName == "TEXTAREA") {
        //TEXT AREA ALLOW DISPLAY
        e.closest(".roam-block-container").classList.remove(
          "roam42-privacy-block"
        );
      } else {
        //DISAblE if certain attributes match predeifned ones from privacy list
        var attributeValue = "";
        if (e.hasAttribute("data-link-title")) {
          attributeValue = e.attributes.getNamedItem("data-link-title").value;
        } else {
          attributeValue = e.attributes.getNamedItem("data-tag").value;
        }
        if (privacyList.includes(attributeValue)) {
          // test for unique conditions
          //KANBAN
          if (e.parentElement.parentElement.classList.contains("kanban-card")) {
            e.closest(".kanban-card").classList.add("roam42-privacy-block");
            return;
          }
          if (
            e.parentElement.parentElement.classList.contains("kanban-title")
          ) {
            e.closest(".kanban-column").classList.add("roam42-privacy-block");
            return;
          }
          //TABLES
          if (e.parentElement.parentElement.parentElement.tagName == "TR") {
            e.parentElement.parentElement.parentElement.classList.add(
              "roam42-privacy-block"
            );
            return;
          }
          //DIAGRAMS
          if (
            e.parentElement.parentElement.parentElement.parentElement.tagName ==
            "foreignObject"
          ) {
            e.parentElement.parentElement.parentElement.classList.add(
              "roam42-privacy-block"
            );
            return;
          }
          // apply default mode to blok
          if (
            e.parentElement.parentElement.parentElement.classList.contains(
              "parent-path-wrapper"
            )
          ) {
            e.closest(".rm-reference-item").classList.add(
              "roam42-privacy-block"
            );
          } else {
            try {
              e.closest(".roam-block-container").classList.add(
                "roam42-privacy-block"
              );
            } catch (err) {
              //parachute!!!
              //if all fails, try at least to concel the current tag
              //trys to wrap the parent/parent, then parent, then finally itself if it cant the parent
              try {
                e.parentElement.parentElement.classList.add(
                  "roam42-privacy-block"
                );
              } catch (e) {
                try {
                  e.parentElement.classList.add("roam42-privacy-block");
                } catch (e) {
                  try {
                    e.classList.add("roam42-privacy-block");
                  } catch (e) {}
                }
              }
            }
          }
        } else if (privacyList.includes("!! " + attributeValue)) {
          e.classList.add("roam42-privacy-block");
        }
      }
    });

  // Process Query titles
  document
    .querySelectorAll<HTMLHeadingElement>(
      ".rm-query-title, .rm-ref-page-view-title"
    )
    .forEach((e) => {
      let s = e.innerText.toString();
      privacyList.forEach((i) => {
        if (
          i.indexOf("!! ") > -1 &&
          s.indexOf("[[" + i.replace("!! ", "") + "]]") > -1
        ) {
          if (!e.hasAttribute("modifiedPrivacyMode")) {
            e.setAttribute("modifiedPrivacyMode", "true");
            e.innerHTML = e.innerHTML.replace(
              "[[" + i.replace("!! ", "") + "]]",
              '<span class="roam42-privacy-block">[[' +
                i.replace("!! ", "") +
                "]]</span>"
            );
          }
        } else if (
          s.indexOf("[[" + i + "]]") > -1 ||
          s == i.replace("!! ", "") ||
          s == i
        ) {
          e.classList.add("roam42-privacy-block");
        }
      });
    });

  // Process Query
  document.querySelectorAll(".rm-query").forEach((e) => {
    let s = e.childNodes;
    e.childNodes.forEach((n) => {
      if (n.nodeType == Node.TEXT_NODE) {
        //text node type
        let s = n.textContent;
        privacyList.forEach((i) => {
          if (
            i.indexOf("!! ") > -1 &&
            s.indexOf("[[" + i.replace("!! ", "") + "]]") > -1
          ) {
            if (!n.parentElement.hasAttribute("modifiedPrivacyMode")) {
              n.parentElement.setAttribute("modifiedPrivacyMode", "true");
              var txt = document.createElement("span");
              txt.innerHTML = s.replace(
                "[[" + i.replace("!! ", "") + "]]",
                '<span class="roam42-privacy-block">[[' +
                  i.replace("!! ", "") +
                  "]]</span>"
              );
              n.replaceWith(txt);
            }
          } else if (s.indexOf("[[" + i + "]]") > -1) {
            e.classList.add("roam42-privacy-block");
          }
        });
      }
    });
  });
}; // end of   scanBlocksForPageReferences()

export const observe = async () => {
  var privacyDefined = await getPrivateBlockDetails();
  if (privacyDefined == false) return false;
  scanBlocksForPageReferences();
  observer = new MutationObserver(scanBlocksForPageReferences);
  observer.observe(document, { childList: true, subtree: true });
  _active = true;
};

export const destroy = () => {
  document
    .querySelectorAll(".roam42-privacy-block")
    .forEach((e) => e.classList.remove("roam42-privacy-block"));
  document
    .querySelectorAll("div[modifiedPrivacyMode]")
    .forEach((e) => e.removeAttribute("modifiedPrivacyMode"));
  observer.disconnect();
  observer = undefined;
  privacyList = [];
  _active = false;
};

export const toggle = () => {
  toggleChildIframes();
  try {
    (
      document.getElementById("roam42-live-preview-iframe") as HTMLIFrameElement
    ).contentWindow.roam42.privacyMode.toggleChildIframes();
    (
      document.getElementById("iframePanelDNP") as HTMLIFrameElement
    ).contentWindow.roam42.privacyMode.toggleChildIframes();
  } catch (e) {}
};

export const toggleChildIframes = () => {
  if (_active) {
    destroy();
  } else {
    observe();
  }
};

export const toggleFeature = (flag: boolean) => {
  if (flag) observe();
  else destroy();
};
