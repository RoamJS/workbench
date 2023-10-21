import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import { DAILY_NOTE_PAGE_REGEX } from "roamjs-components/date/constants";
import ReactDOM from "react-dom";
import {
  Button,
  Checkbox,
  Classes,
  Dialog,
  Intent,
  Popover,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
import Color from "color";
import { getParseInline } from "roamjs-components/marked";
import { addDays } from "date-fns";
import addYears from "date-fns/addYears";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DAILY_NOTE_PAGE_TITLE_REGEX } from "roamjs-components/date/constants";
import createPage from "roamjs-components/writes/createPage";
import getChildrenLengthByPageUid from "roamjs-components/queries/getChildrenLengthByPageUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import getUids from "roamjs-components/dom/getUids";
import getUidsFromId from "roamjs-components/dom/getUidsFromId";
import updateBlock from "roamjs-components/writes/updateBlock";
import createBlock from "roamjs-components/writes/createBlock";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import { get } from "../settings";
import localStorageGet from "roamjs-components/util/localStorageGet";
import localStorageSet from "roamjs-components/util/localStorageSet";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import createHashtagObserver from "roamjs-components/dom/createHashtagObserver";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import createBlockObserver from "roamjs-components/dom/createBlockObserver";
import getReferenceBlockUid from "roamjs-components/dom/getReferenceBlockUid";
import type { OnloadArgs } from "roamjs-components/types";

const TODO_REGEX = /{{(\[\[)?TODO(\]\])?}}\s*/;

type RoamBlockEl = HTMLDivElement | HTMLTextAreaElement | null;

const MoveTodoMenu = ({
  blockUid,
  p,
  removeListener,
  archivedDefault,
  move,
}: {
  blockUid: string;
  p: HTMLElement;
  archivedDefault: boolean;
  removeListener: () => void;
  move?: boolean;
}): React.ReactElement => {
  const tomorrow = useMemo(() => {
    const title = getPageTitleByBlockUid(blockUid);
    let ref = DAILY_NOTE_PAGE_TITLE_REGEX.test(title)
      ? window.roamAlphaAPI.util.pageTitleToDate(title)
      : new Date();
    if (!ref) ref = new Date();
    return addDays(ref, 1);
  }, []);
  const maxDate = useMemo(() => {
    // https://github.com/palantir/blueprint/issues/877
    return addYears(tomorrow, 5);
  }, [tomorrow]);
  const [target, setTarget] = useState(tomorrow);
  const unmountRef = useRef(0);
  const unmount = useCallback(() => {
    unmountRef.current = window.setTimeout(() => {
      ReactDOM.unmountComponentAtNode(p);
    }, 200);
  }, [unmountRef]);
  const clear = useCallback(() => {
    clearTimeout(unmountRef.current);
  }, [unmountRef]);

  useEffect(() => {
    if (p && p.parentElement) {
      const parentElement = p.parentElement;
      const handleMouseLeave = () => unmount();
      const handleMouseEnter = () => clear();
      parentElement.onmouseleave = handleMouseLeave;
      parentElement.addEventListener("mouseenter", handleMouseEnter);

      return () => {
        if (parentElement) {
          parentElement.removeEventListener("mouseleave", handleMouseLeave);
          parentElement.removeEventListener("mouseenter", handleMouseEnter);
        }
      };
    }
  }, [clear, unmount, p]);

  const [loading, setLoading] = useState(false);
  const [archive, setArchive] = useState(archivedDefault);

  const onMove = async () => {
    setLoading(true);

    const highlightedBlocks = Array.from(
      document.getElementsByClassName("block-highlight-blue")
    );
    const additionalBlockUids = highlightedBlocks
      .map((blockElement) => {
        const roamBlockEl: RoamBlockEl =
          blockElement.querySelector(".roam-block");
        if (!roamBlockEl) return;
        return getUids(roamBlockEl).blockUid;
      })
      .filter((uid) => uid !== null && uid !== blockUid);
    const blockUids = [blockUid, ...additionalBlockUids];

    const targetDate = window.roamAlphaAPI.util.dateToPageTitle(target);
    const parentUid = getPageUidByPageTitle(targetDate);

    return (
      parentUid ? Promise.resolve(parentUid) : createPage({ title: targetDate })
    )
      .then((parentUid) => {
        const order = getChildrenLengthByPageUid(parentUid);
        return Promise.all(
          blockUids.map((buid, i) => {
            if (!buid) return Promise.resolve();
            const text = getTextByBlockUid(buid);
            const children = getShallowTreeByParentUid(buid);
            return move
              ? window.roamAlphaAPI.moveBlock({
                  block: { uid: buid },
                  location: { "parent-uid": parentUid, order: order + i },
                })
              : createBlock({
                  node: { text: `${text} [*](((${buid})))` },
                  order: order + i,
                  parentUid,
                }).then((uid) =>
                  Promise.all([
                    updateBlock({
                      uid: buid,
                      text: TODO_REGEX.test(text)
                        ? `${text.replace(
                            /{{(\[\[)?TODO(\]\])?}}\s*/,
                            `[→](((${uid}))) {{[[${
                              archive ? "ARCHIVED" : "DONE"
                            }]]}} `
                          )}`
                        : `[→](((${uid})))`,
                    }),
                    ...children.map((c, order) =>
                      window.roamAlphaAPI.moveBlock({
                        block: { uid: c.uid },
                        location: { "parent-uid": uid, order },
                      })
                    ),
                  ])
                );
          })
        );
      })
      .then(() => {
        Array.from(
          document.getElementsByClassName("block-highlight-blue")
        ).forEach((d) => d.classList.remove("block-highlight-blue"));
        removeListener();
      })
      .catch((e) => {
        renderToast({
          id: "move-todo-failure",
          content: `Error: ${e.message}`,
        });
      })
      .finally(unmount);
  };

  const onTodoClick = () => {
    const elements = Array.from(
      document.getElementsByClassName("block-highlight-blue")
    );

    const blockIds = elements
      .map((el) => el.querySelector(".roam-block")?.id)
      .filter((id): id is string => id !== null && id !== undefined)
      .filter((d) => {
        const textContent = getTextByBlockUid(getUidsFromId(d).blockUid);
        return /{{\[\[TODO\]\]}}/.test(textContent);
      });

    setTimeout(() => {
      blockIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;
        const container = element.closest(".roam-block-container");
        container?.classList.add("block-highlight-blue");
      });
    }, 1);
  };

  return (
    <Popover
      target={
        <Tooltip content={"Move to Another Date"}>
          <Button
            minimal
            icon={"play"}
            style={{ minHeight: 18, height: 18, width: 18, minWidth: 18 }}
            onClick={onTodoClick}
          />
        </Tooltip>
      }
      content={
        <div
          style={{ padding: 16 }}
          onMouseEnter={clear}
          onMouseMove={clear}
          onMouseLeave={unmount}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DatePicker
            value={target}
            onChange={(s) => s && setTarget(s)}
            minDate={tomorrow}
            maxDate={maxDate}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              onClick={onMove}
              intent={Intent.PRIMARY}
              disabled={loading}
              text={loading ? <Spinner size={Spinner.SIZE_SMALL} /> : "Move"}
            />
            {window.roamjs.loaded.has("todont") && (
              <Checkbox
                label={"Archive"}
                checked={archive}
                onChange={(e) =>
                  setArchive((e.target as HTMLInputElement).checked)
                }
              />
            )}
          </div>
        </div>
      }
    />
  );
};

const renderTodoButton = ({
  p,
  blockUid,
  archivedDefault = false,
  move,
}: {
  p: HTMLElement;
  blockUid: string;
  archivedDefault?: boolean;
  move?: boolean;
}): void => {
  const block = p.parentElement;
  if (!block) return;
  const onEnter = () =>
    !p.childElementCount &&
    ReactDOM.render(
      <MoveTodoMenu
        p={p}
        blockUid={blockUid}
        removeListener={() => block.removeEventListener("mouseenter", onEnter)}
        archivedDefault={archivedDefault}
        move={move}
      />,
      p
    );
  block.addEventListener("mouseenter", onEnter);
};

const settings = [
  "Move Todos Enabled",
  "Move Tags Enabled",
  "Context Enabled",
  "Hex Color Preview Enabled",
] as const;
const DecoratorSettings = ({ isOpen, onClose }: RoamOverlayProps) => {
  const [opts, setOpts] = useState(() =>
    JSON.parse(localStorageGet("decorators") || "{}")
  );
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      enforceFocus={false}
      autoFocus={false}
    >
      <div className={Classes.DIALOG_BODY}>
        {settings.map((setting) => (
          <Checkbox
            checked={opts[setting]}
            key={setting}
            label={setting}
            onChange={(e) =>
              setOpts({
                ...opts,
                [setting]: (e.target as HTMLInputElement).checked,
              })
            }
          />
        ))}
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            text={"Save"}
            onClick={() => {
              localStorageSet("decorators", JSON.stringify(opts));
              toggleDecorations(false);
              toggleDecorations(true);
              renderToast({
                content: "Successfully saved new decorators!",
                id: "decorators-saved",
              });
              onClose();
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  if (flag) {
    extensionAPI.ui.commandPalette.addCommand({
      label: "(WB) Toggle Block Decorators",
      callback: () => renderOverlay({ Overlay: DecoratorSettings }),
    });
    toggleDecorations(true);
  } else {
    extensionAPI.ui.commandPalette.removeCommand({
      label: "(WB) Toggle Block Decorators",
    });
    unloads.forEach((u) => u());
    unloads.clear();
  }
};

const unloads = new Set<() => void>();
export const toggleDecorations = (flag: boolean) => {
  if (flag) {
    const archivedDefault = !!get("decoratorsMoveArchives"); // Improve the UX for this if feature is re-requested

    const opts = JSON.parse(localStorageGet("decorators") || "{}") as Record<
      (typeof settings)[number],
      boolean
    >;
    if (opts["Move Todos Enabled"]) {
      const moveTodosObserver = createHTMLObserver({
        tag: "LABEL",
        className: "check-container",
        callback: (e: HTMLElement) => {
          const l = e as HTMLLabelElement;
          const input = l.getElementsByTagName("input")[0];
          if (!input.checked) {
            const blockUid = getBlockUidFromTarget(input);
            const title = getPageTitleByBlockUid(blockUid);
            if (DAILY_NOTE_PAGE_REGEX.test(title)) {
              const block = input.closest(".roam-block") as HTMLDivElement;
              if (block && !block.hasAttribute("data-roamjs-move-ref")) {
                block.setAttribute("data-roamjs-move-ref", "true");
                const p = document.createElement("span");
                p.onmousedown = (e) => e.stopPropagation();
                block.appendChild(p);
                renderTodoButton({
                  p,
                  blockUid,
                  archivedDefault,
                });
              }
            }
          }
        },
      });
      unloads.add(() => moveTodosObserver.disconnect());
    }
    if (opts["Move Tags Enabled"]) {
      const moveTagsObserver = createHTMLObserver({
        tag: "SPAN",
        className: "rm-page-ref",
        callback: (s: HTMLSpanElement) => {
          const blockUid = getBlockUidFromTarget(s);
          const title = getPageTitleByBlockUid(blockUid);
          if (DAILY_NOTE_PAGE_REGEX.test(title)) {
            const block = s.closest(".roam-block") as HTMLDivElement;
            if (block && !block.hasAttribute("data-roamjs-move-ref")) {
              block.setAttribute("data-roamjs-move-ref", "true");
              const p = document.createElement("span");
              p.onmousedown = (e) => e.stopPropagation();
              block.appendChild(p);
              renderTodoButton({
                p,
                blockUid,
                archivedDefault,
                move: true,
              });
            }
          }
        },
      });
      unloads.add(() => moveTagsObserver.disconnect());
    }
    if (opts["Context Enabled"]) {
      const getRoamUrl = (blockUid?: string): string =>
        `${window.location.href.replace(/\/page\/.*$/, "")}${
          blockUid ? `/page/${blockUid}` : ""
        }`;
      const context = {
        pagesToHrefs: (page: string, ref?: string) =>
          ref ? getRoamUrl(ref) : getRoamUrl(getPageUidByPageTitle(page)),
        blockReferences: (ref: string) => ({
          text: getTextByBlockUid(ref),
          page: getPageTitleByBlockUid(ref),
        }),
        components: (): false => {
          return false;
        },
      };

      const getParseRoamMarked = (): Promise<(s: string) => string> =>
        getParseInline().then(
          (parseInline) => (text: string) => parseInline(text, context)
        );
      const init = async () => {
        const parseRoamMarked = await getParseRoamMarked();
        const parentTagObserver = createHashtagObserver({
          attribute: "data-roamjs-context-parent",
          callback: (s) => {
            if (s.getAttribute("data-tag") === "parent") {
              const uid = getBlockUidFromTarget(s);
              const parentUid = getParentUidByBlockUid(uid);
              const parentText = getTextByBlockUid(parentUid);
              s.className = "rm-block-ref dont-focus-block";
              s.style.userSelect = "none";
              s.innerHTML = parseRoamMarked(parentText);
              s.onmousedown = (e) => e.stopPropagation();
              s.onclick = (e) => {
                if (e.shiftKey) {
                  openBlockInSidebar(parentUid);
                } else {
                  window.roamAlphaAPI.ui.mainWindow.openBlock({
                    block: { uid: parentUid },
                  });
                }
              };
            }
          },
        });
        unloads.add(() => parentTagObserver.disconnect());
      };
      init();

      const pageTagObserver = createHashtagObserver({
        attribute: "data-roamjs-context-page",
        callback: (s) => {
          if (s.getAttribute("data-tag") === "page") {
            const uid = getBlockUidFromTarget(s);
            const page = getPageTitleByBlockUid(uid);
            s.className = "";
            const leftBracket = document.createElement("span");
            leftBracket.className = "rm-page-ref__brackets";
            leftBracket.innerText = "[[";
            const pageRef = document.createElement("span");
            pageRef.tabIndex = -1;
            pageRef.className = "rm-page-ref rm-page-ref--link";
            pageRef.innerText = page;
            const rightBracket = document.createElement("span");
            rightBracket.className = "rm-page-ref__brackets";
            rightBracket.innerText = "]]";
            s.innerHTML = "";
            s.style.userSelect = "none";
            s.appendChild(leftBracket);
            s.appendChild(pageRef);
            s.appendChild(rightBracket);
            s.onmousedown = (e) => e.stopPropagation();
            s.onclick = (e) => {
              const uid = getPageUidByPageTitle(page);
              if (e.shiftKey) {
                openBlockInSidebar(uid);
              } else {
                window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid } });
              }
            };
          }
        },
      });
      unloads.add(() => pageTagObserver.disconnect());
    }
    if (opts["Hex Color Preview Enabled"]) {
      const HEX_COLOR_PREVIEW_CLASSNAME = "roamjs-hex-color-preview";
      const css = document.createElement("style");
      css.id = "roamjs-hex-color-preview-css";
      css.textContent = `input.${HEX_COLOR_PREVIEW_CLASSNAME} {
          width: 16px;
          height: 16px;
          margin-left: 4px;
          border: none;
          outline: none;
          appearance: none;
          padding: 1px;
          color: unset;
          background-color: unset;
        }
        /* Remove the color well for Firefox */
        input.roamjs-hex-color-preview::-moz-color-swatch-wrapper {
            padding: 0;
        }
        input.roamjs-hex-color-preview::-moz-color-swatch {
            border: none;
        }
        /* Remove the color well for Chrome */
        input.roamjs-hex-color-preview::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        input.roamjs-hex-color-preview::-webkit-color-swatch {
            border: none;
        }
      `;
      document.head.appendChild(css);
      unloads.add(() => css.remove());

      type BlockReference = { title: string };
      const getRefTitlesByBlockUid = (uid: string): string[] => {
        const queryResult = window.roamAlphaAPI.q(
          `[:find (pull ?r [:node/title]) :where [?e :block/refs ?r] [?e :block/uid "${uid}"]]`
        );
        return (queryResult as BlockReference[][]).map(
          (b) => b[0]?.title || ""
        );
      };

      const renderColorPreviews = (
        container: HTMLElement,
        blockUid: string
      ) => {
        const refs = getRefTitlesByBlockUid(blockUid);
        const renderedRefs = Array.from(
          container.getElementsByClassName("rm-page-ref--tag")
        );
        refs
          .filter((r) => r.length)
          .forEach((r) => {
            try {
              const c = Color(`#${r}`);
              const previewIdPrefix = `hex-color-preview-${blockUid}-${r}-`;

              // Filter out spans that do not match the current reference or already have a color preview.
              const renderedRefSpans = renderedRefs.filter(
                (s) =>
                  s.getAttribute("data-tag") === r &&
                  (!s.lastElementChild ||
                    !s.lastElementChild.id.startsWith(previewIdPrefix))
              );

              renderedRefSpans.forEach((renderedRef, i) => {
                const newInput = document.createElement("input");
                newInput.type = "color";
                newInput.value = c.hex();
                if (newInput.value.toLocaleLowerCase() === "#ffffff")
                  newInput.style.boxShadow = "inset 0 0 0 1px hsla(0,0%,0%,.2)";
                newInput.className = HEX_COLOR_PREVIEW_CLASSNAME;
                newInput.id = `${previewIdPrefix}${i}`;
                newInput.onmousedown = (e) => e.stopPropagation();
                renderedRef.appendChild(newInput);
                newInput.onchange = async (e) => {
                  const target = e.target as HTMLInputElement;
                  const newColor = target.value;
                  const uid = getBlockUidFromTarget(target);
                  const blockText = getTextByBlockUid(uid);
                  const newText = blockText.replace(
                    new RegExp(`#${r}`, "g"),
                    newColor
                  );
                  await window.roamAlphaAPI.updateBlock({
                    block: { uid, string: newText },
                  });
                  target.value = newColor;
                  toggleDecorations(false);
                  setTimeout(() => {
                    toggleDecorations(true);
                  }, 100);
                };
              });
            } catch (e) {
              const error = e as Error;
              if (
                !error.message ||
                !error.message.startsWith("Unable to parse color from string")
              ) {
                throw e;
              }
            }
          });
      };

      const previewObservers = createBlockObserver(
        (b) => renderColorPreviews(b, getUids(b).blockUid),
        (s) => {
          const blockUid = getReferenceBlockUid(s, "rm-block-ref");
          renderColorPreviews(s, blockUid);
        }
      );
      unloads.add(() => previewObservers.forEach((po) => po.disconnect()));
    }
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
