import Mousetrap from "mousetrap";
import {
  blockDelete,
  blockInsertAbove,
  blockInsertBelow,
  moveCursorToNextBlock,
  moveCursorToPreviousBlock,
  restoreLocationParametersOfTexArea,
  saveLocationParametersOfTextArea,
  sidebarLeftToggle,
  sidebarRightToggle,
  simulateMouseClick,
  simulateMouseClickRight,
  simulateMouseOver,
  sleep,
} from "./commonFunctions";
import { displayMessage } from "./help";
import { component as queryRef } from "./quickRef";
import { component as dailyNotesPopup } from "./dailyNotesPopup";
import { pressEsc, simulateKey } from "./r42kb_lib";
import { get } from "./settings";
import { typeAheadLookup } from "./dictionary";

const oldStopCallback = Mousetrap.prototype.stopCallback;
const bindings = [
  // block: expand, collapse, ref, add action
  "ctrl+j x",
  "ctrl+j l",
  "ctrl+j r",
  "ctrl+j s",
  "ctrl+j a",
  "meta+j x",
  "meta+j l",
  "meta+j s",
  "meta+j r",
  "meta+j a",
  "alt+j x",
  "alt+j l",
  "alt+j s",
  "alt+j r",
  "alt+j a",
  //move up one line, move down one line insert above (k), insert below(j), delete block (d)
  "ctrl+j i",
  "ctrl+j u",
  "meta+j i",
  "meta+j u",
  "alt+j i",
  "alt+j u",
  "ctrl+j k",
  "ctrl+j j",
  "ctrl+j d",
  "meta+j k",
  "meta+j j",
  "meta+j d",
  "alt+j k",
  "alt+j j",
  "alt+j d",
  // block align left,center, right, justify
  "ctrl+j 1",
  "ctrl+j 2",
  "ctrl+j 3",
  "ctrl+j 4",
  "meta+j 1",
  "meta+j 2",
  "meta+j 3",
  "meta+j 4",
  "alt+j 1",
  "alt+j 2",
  "alt+j 3",
  "alt+j 4",
  // headings 1,2,3
  "ctrl+j 5",
  "ctrl+j 6",
  "ctrl+j 7",
  "meta+j 5",
  "meta+j 6",
  "meta+j 7",
  "alt+j 5",
  "alt+j 6",
  "alt+j 7",
  // page: first node last node
  "ctrl+j t",
  "ctrl+j b",
  "meta+j t",
  "meta+j b",
  "alt+j t",
  "alt+j b",
  // page: expand/collapse open in side
  "ctrl+j e",
  "ctrl+j c",
  "ctrl+j o",
  "ctrl+j y",
  "meta+j e",
  "meta+j c",
  "meta+j o",
  "meta+j y",
  "alt+j e",
  "alt+j c",
  "alt+j o",
  "alt+j y",
  // page: toggle linked references, unlinked references
  "ctrl+j w",
  "ctrl+j z",
  "meta+j w",
  "meta+j z",
  "alt+j w",
  "alt+j z",
  // page: Expand All/Collapse parents or children  in linked references, unlinked references
  "ctrl+j f",
  "ctrl+j v",
  "ctrl+j p",
  "meta+j f",
  "meta+j v",
  "meta+j p",
  "alt+j f",
  "alt+j v",
  "alt+j p",
  // help for javigation
  "ctrl+j h",
  "ctrl+j q",
  "meta+j h",
  "meta+j q",
  "alt+j h",
  "alt+j q",
  // Side bars
  "ctrl+j n",
  "ctrl+j m",
  "meta+j n",
  "meta+j m",
  "alt+j n",
  "alt+j m",
  // daily notes and lookup
  "ctrl+j ,",
  "ctrl+j .",
  "meta+j ,",
  "meta+j .",
  "alt+j ,",
  "alt+j .",
  // go to parent block
  "ctrl+j g",
  "ctrl+j ;",
  "ctrl+j '",
  "meta+j g",
  "meta+j ;",
  "meta+j '",
  "alt+j g",
  "alt+j ;",
  "alt+j '",
];

export const loadJumpNav = () => {
  Mousetrap.prototype.stopCallback = function () {
    return false;
  };
  const jumpNavIgnore = get("jumpNavIgnore");
  const ignoreBindings = new Set(jumpNavIgnore ? jumpNavIgnore.split(",") : []);
  Mousetrap.bind(
    bindings.filter(
      (b) => !ignoreBindings.has(b.replace(/^(ctrl|meta|alt)\+j /, ""))
    ),
    (event, handler) => jumpCommand(event.target as Element, handler)
  );
};

export const toggleFeature = (flag: boolean) => {
  if (flag) loadJumpNav();
  else {
    Mousetrap.unbind(bindings);
    Mousetrap.prototype.stopCallback = oldStopCallback;
  }
};

export const jumpCommandByActiveElement = (handler: string) => {
  //use this for calls from other functions without an event handler
  jumpCommand(document.activeElement, handler);
};

export const jumpCommand = (target: Element, handler: string) => {
  handler = handler.replace("meta", "ctrl");
  handler = handler.replace("alt", "ctrl");

  //GOTO top/bottom of page
  if (["ctrl+j t", "ctrl+j b"].includes(handler)) {
    var articleContent = document
      .querySelector(".rm-block-children")
      .querySelectorAll(".roam-block-container");
    handler == "ctrl+j b" || handler == "˚"
      ? simulateMouseClick(
          articleContent[articleContent.length - 1].querySelector(
            ".rm-block-text"
          )
        )
      : simulateMouseClick(articleContent[0].querySelector(".rm-block-text"));
    setTimeout(() => {
      const el = document.activeElement as HTMLTextAreaElement;
      el.setSelectionRange(el.value.length, el.value.length);
    }, 50);
    return false;
  }

  if (
    [
      "ctrl+j j",
      "ctrl+j k",
      "ctrl+j i",
      "ctrl+j u",
      "ctrl+j d",
      "ctrl+j g",
      "ctrl+j ;",
      "ctrl+j '",
    ].includes(handler)
  ) {
    switch (handler) {
      case "ctrl+j j": //go to next block
        moveCursorToNextBlock(target as HTMLTextAreaElement);
        break;
      case "ctrl+j k": //go to previous block
        moveCursorToPreviousBlock(target as HTMLTextAreaElement);
        break;
      case "ctrl+j i": // Insert block above
        blockInsertAbove(target as HTMLTextAreaElement);
        break;
      case "ctrl+j u": // Insert block below
        blockInsertBelow(target as HTMLTextAreaElement);
        break;
      case "ctrl+j d": //  delete block
        blockDelete(target as HTMLTextAreaElement);
        break;
      case "ctrl+j g": //  go to parent block
        setTimeout(async () => {
          await simulateMouseClick(
            target
              .closest(".rm-block-children")
              .parentElement.querySelector(".roam-block")
          );
          await sleep(50);
          let newLocation = document.activeElement as HTMLTextAreaElement;
          newLocation.selectionStart = newLocation.value.length;
          newLocation.selectionEnd = newLocation.value.length;
        }, 10);
        break;
      case "ctrl+j ;": //  previous sibling
        setTimeout(async () => {
          try {
            await simulateMouseClick(
              target
                .closest(".roam-block-container")
                .previousElementSibling.querySelector(".roam-block")
            );
            await sleep(50);
            let newLocation = document.activeElement as HTMLTextAreaElement;
            newLocation.selectionStart = newLocation.value.length;
            newLocation.selectionEnd = newLocation.value.length;
          } catch (e) {}
        }, 10);
        break;
      case "ctrl+j '": //  next sibling
        setTimeout(async () => {
          try {
            await simulateMouseClick(
              target
                .closest(".roam-block-container")
                .nextElementSibling.querySelector(".roam-block")
            );
            await sleep(50);
            let newLocation = document.activeElement as HTMLTextAreaElement;
            newLocation.selectionStart = newLocation.value.length;
            newLocation.selectionEnd = newLocation.value.length;
          } catch (e) {}
        }, 10);
        break;
    }
    return false;
  }

  // BLOCKS references: fun with blocks
  if (["ctrl+j s", "ctrl+j r"].includes(handler)) {
    let uid = target.id.substring(target.id.length - 9);
    switch (handler) {
      case "ctrl+j s": // copy block ref as alias
        setTimeout(async () => {
          var selectedText = window.getSelection().toString();
          var formatToUse = get("CopyRefAsAliasFormat");
          var outputText = "";
          if (selectedText != "" && formatToUse)
            outputText = formatToUse
              .replace("UID", `((${uid}))`)
              .replace("SELECTEDTEXT", selectedText)
              .trim();
          else if (selectedText != "")
            outputText = `"${selectedText}" [*](((${uid})))`;
          else outputText = `[*](((${uid})))`;
          navigator.clipboard.writeText(outputText);
          displayMessage(
            `<b>Roam<sup>42</sup></b><br/>Copied:<br/> ${outputText}`,
            2000
          );
        }, 10);
        break;
      case "ctrl+j r": // copy block ref
        navigator.clipboard.writeText(`((${uid}))`);
        displayMessage(`<b>Roam<sup>42</sup></b><br/>Copied: ((${uid}))`, 2000);
        break;
    }
    return false;
  }

  // BLOCKS: fun with blocks
  if (
    [
      "ctrl+j x",
      "ctrl+j l",
      "ctrl+j s",
      "ctrl+j r",
      "ctrl+j a",
      "ctrl+j 1",
      "ctrl+j 2",
      "ctrl+j 3",
      "ctrl+j 4",
    ].includes(handler)
  ) {
    var locFacts = saveLocationParametersOfTextArea(
      target as HTMLTextAreaElement
    );
    var parentControlNode: ParentNode;
    if (
      (document.getElementById(locFacts.id).parentNode.parentNode as Element)
        .tagName == "DIV"
    ) {
      parentControlNode = document.getElementById(locFacts.id).parentNode;
    } else {
      //climb up higher one node in chain
      parentControlNode = document.getElementById(locFacts.id).parentNode
        .parentNode;
    }
    if (!["ctrl+j x", "ctrl+j l"].includes(handler)) {
      simulateMouseClickRight(
        parentControlNode.previousSibling.childNodes[1] as Element
      );
    }
    setTimeout(() => {
      const uid = document
        .querySelector("textarea.rm-block-input")
        .id.slice(-9);
      switch (handler) {
        case "ctrl+j x": // expand block
          window.roamAlphaAPI.updateBlock({ block: { uid, open: true } });
          window.roamAlphaAPI
            .q(
              `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
            )
            .map((a) => a[0].uid)
            .forEach((u) =>
              window.roamAlphaAPI.updateBlock({ block: { uid: u, open: true } })
            );
          break;
        case "ctrl+j l": // collapse block
          window.roamAlphaAPI.updateBlock({ block: { uid, open: false } });
          window.roamAlphaAPI
            .q(
              `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
            )
            .map((a) => a[0].uid)
            .forEach((u) =>
              window.roamAlphaAPI.updateBlock({
                block: { uid: u, open: false },
              })
            );
          break;
        case "ctrl+j a": // add reaction
          setTimeout(() => {
            simulateMouseOver(
              document.querySelector(".bp3-popover-content > div> ul")
                .childNodes[5].childNodes[0].childNodes[0] as Element
            );
          }, 50);
          return false;
          break;
        case "ctrl+j 1": // left allign block
          simulateMouseClick(
            document.querySelector(".bp3-popover-content .flex-h-box")
              .childNodes[0] as Element
          );
          pressEsc();
          break;
        case "ctrl+j 2": // center allign block
          simulateMouseClick(
            document.querySelector(".bp3-popover-content .flex-h-box")
              .childNodes[1] as Element
          );
          pressEsc();
          break;
        case "ctrl+j 3": // right allign block
          simulateMouseClick(
            document.querySelector(".bp3-popover-content .flex-h-box")
              .childNodes[2] as Element
          );
          pressEsc();
          break;
        case "ctrl+j 4": // justify allign block
          simulateMouseClick(
            document.querySelector(".bp3-popover-content .flex-h-box")
              .childNodes[3] as Element
          );
          pressEsc();
          break;
      }
      restoreLocationParametersOfTexArea(locFacts);
    }, 100);
    return false;
  }

  // Headings
  if (["ctrl+j 5", "ctrl+j 6", "ctrl+j 7"].includes(handler)) {
    switch (handler) {
      case "ctrl+j 5": // heading 1
        simulateKey(49, 200, { ctrlKey: true, altKey: true }); //49 is key 1
        simulateKey(49, 200, { metaKey: true, altKey: true }); //49 is key 1 // mac OS
        break;
      case "ctrl+j 6": // heading 2
        simulateKey(50, 200, { ctrlKey: true, altKey: true }); //49 is key 1
        simulateKey(50, 200, { metaKey: true, altKey: true }); //49 is key 1 // mac OS
        break;
      case "ctrl+j 7": // heading 3
        simulateKey(51, 200, { ctrlKey: true, altKey: true }); //49 is key 1
        simulateKey(51, 200, { metaKey: true, altKey: true }); //49 is key 1 // mac OS
        break;
    }
    return false;
  }

  // PAGE: Paging all Hitchhikers
  if (["ctrl+j e", "ctrl+j c", "ctrl+j o"].includes(handler)) {
    var locFacts =
      target.localName == "textarea"
        ? saveLocationParametersOfTextArea(target as HTMLTextAreaElement)
        : undefined;

    const toRoamDateUid = (d = new Date()) =>
      `${(d.getMonth() + 1).toString().padStart(2, "0")}-${(d.getDate() + 1)
        .toString()
        .padStart(2, "0")}-${d.getFullYear()}`;
    setTimeout(() => {
      const uid =
        window.location.hash.match(/\/page\/(.*)$/)?.[1] || toRoamDateUid();
      switch (handler) {
        case "ctrl+j e":
          window.roamAlphaAPI.updateBlock({ block: { uid, open: true } });
          window.roamAlphaAPI
            .q(
              `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
            )
            .map((a) => a[0].uid)
            .forEach((u) =>
              window.roamAlphaAPI.updateBlock({ block: { uid: u, open: true } })
            );
          break;
        case "ctrl+j c":
          window.roamAlphaAPI.updateBlock({ block: { uid, open: false } });
          window.roamAlphaAPI
            .q(
              `[:find (pull ?p [:block/uid]) :where [?b :block/uid "${uid}"] [?p :block/parents ?b]]`
            )
            .map((a) => a[0].uid)
            .forEach((u) =>
              window.roamAlphaAPI.updateBlock({
                block: { uid: u, open: false },
              })
            );
          break;
        case "ctrl+j o":
          var zoomedView = 0; // 0 if page is not zoomed, 1 if zoomed
          try {
            simulateMouseClickRight(
              document.querySelector(".rm-title-display")
            );
          } catch (e) {
            simulateMouseClickRight(
              document.querySelectorAll(".simple-bullet-outer")[0]
            );
            zoomedView = 1;
          }
          (
            Array.from(
              document.querySelector(".bp3-popover-content > div> ul")
                .childNodes
            ).find((t) => /open in sidebar/i.test((t as HTMLElement).innerText))
              .childNodes[0] as HTMLElement
          ).click();
          break;
      }
      if (locFacts) {
        setTimeout(() => {
          restoreLocationParametersOfTexArea(locFacts);
        }, 400);
      }
    }, 100);
    return false;
  }

  // PAGE: Query
  if (["ctrl+j y"].includes(handler)) {
    console.log(handler);
    switch (handler) {
      case "ctrl+j y": //toggle parents
        document
          .querySelectorAll(".rm-query-title .bp3-icon-caret-down")
          .forEach((element) => {
            simulateMouseClick(element);
          });
        break;
    }
    return false;
  }

  // PAGE: expand childern of linked and unlinked references
  if (["ctrl+j f", "ctrl+j v", "ctrl+j p"].includes(handler)) {
    switch (handler) {
      case "ctrl+j f": //toggle parents
        document
          .querySelectorAll(".rm-title-arrow-wrapper .bp3-icon-caret-down")
          .forEach((element) => {
            simulateMouseClick(element);
          });
        break;
      case "ctrl+j v":
        document
          .querySelectorAll(".rm-reference-item  .block-expand")
          .forEach((element) => {
            simulateMouseClickRight(element);
            (
              document.querySelector(".bp3-popover-content > div> ul")
                .childNodes[3].childNodes[0] as HTMLElement
            ).click();
          });
        break;
      case "ctrl+j p":
        document
          .querySelectorAll(".rm-reference-item  .block-expand")
          .forEach((element) => {
            simulateMouseClickRight(element);
            (
              document.querySelector(".bp3-popover-content > div> ul")
                .childNodes[4].childNodes[0] as HTMLElement
            ).click();
          });
        break;
    }
    return false;
  }

  // PAGE: toggle linked and unlinked references
  if (["ctrl+j w", "ctrl+j z"].includes(handler)) {
    switch (handler) {
      case "ctrl+j w":
        (
          document.querySelector(
            ".rm-reference-container .rm-caret"
          ) as HTMLElement
        ).click();
        document
          .querySelector(".rm-reference-container .rm-caret")
          .scrollIntoView();
        break;
      case "ctrl+j z":
        (
          document.querySelector(
            ".rm-reference-main > div > div:nth-child(2) > div > span > span"
          ) as HTMLElement
        ).click();
        document
          .querySelector(
            ".rm-reference-main > div > div:nth-child(2) > div > span > span"
          )
          .scrollIntoView();
        break;
    }
    return false;
  }

  if (handler == "ctrl+j q") {
    queryRef.toggleQuickReference();
    return false;
  } //roam42.help.displayHelp() };
  if (handler == "ctrl+j h") {
    queryRef.toggleQuickReference();
    return false;
  }

  if (handler == "ctrl+j n") {
    setTimeout(async () => {
      sidebarLeftToggle();
    }, 50);
    return false;
  }
  if (handler == "ctrl+j m") {
    sidebarRightToggle();
    return false;
  }

  if (handler == "ctrl+j ,") {
    dailyNotesPopup.toggleVisible();
    return false;
  }
  if (handler == "ctrl+j .") {
    typeAheadLookup(target);
    return false;
  }

  return false;
};
