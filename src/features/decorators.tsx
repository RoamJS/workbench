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
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import createBlockObserver from "roamjs-components/dom/createBlockObserver";
import getReferenceBlockUid from "roamjs-components/dom/getReferenceBlockUid";

const TODO_REGEX = /{{(\[\[)?TODO(\]\])?}}\s*/;

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
    const ref = DAILY_NOTE_PAGE_TITLE_REGEX.test(title)
      ? window.roamAlphaAPI.util.pageTitleToDate(title)
      : new Date();
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
    p.parentElement.onmouseleave = unmount;
    p.parentElement.addEventListener("mouseenter", clear);
  }, [clear, unmount]);
  const [loading, setLoading] = useState(false);
  const [archive, setArchive] = useState(archivedDefault);
  const onClick = () => {
    setLoading(true);
    const blockUids = [
      blockUid,
      ...Array.from(document.getElementsByClassName("block-highlight-blue"))
        .map((d) => getUids(d.querySelector(".roam-block")).blockUid)
        .filter((b) => b !== blockUid),
    ];
    const targetDate = window.roamAlphaAPI.util.dateToPageTitle(target);
    const parentUid = getPageUidByPageTitle(targetDate);
    return (
      parentUid ? Promise.resolve(parentUid) : createPage({ title: targetDate })
    )
      .then((parentUid) => {
        const order = getChildrenLengthByPageUid(parentUid);
        return Promise.all(
          blockUids.map((buid, i) => {
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
  return (
    <Popover
      target={
        <Tooltip content={"Move to Another Date"}>
          <Button
            minimal
            icon={"play"}
            style={{ minHeight: 18, height: 18, width: 18, minWidth: 18 }}
            onClick={() => {
              const blockIds = Array.from(
                document.getElementsByClassName("block-highlight-blue")
              )
                .map((d) => d.querySelector(".roam-block")?.id)
                .filter((d) =>
                  /{{\[\[TODO\]\]}}/.test(
                    getTextByBlockUid(getUidsFromId(d).blockUid)
                  )
                );
              setTimeout(() => {
                blockIds.forEach((id) =>
                  document
                    .getElementById(id)
                    .closest(".roam-block-container")
                    .classList.add("block-highlight-blue")
                );
              }, 1);
            }}
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
            onChange={(s) => setTarget(s)}
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
              onClick={onClick}
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

const render = ({
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
              toggleFeature(false);
              toggleFeature(true);
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

const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    const archivedDefault = !!get("decoratorsMoveArchives"); // Improve the UX for this if feature is re-requested
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Toggle Block Decorators",
      callback: () => renderOverlay({ Overlay: DecoratorSettings }),
    });
    unloads.add(() =>
      window.roamAlphaAPI.ui.commandPalette.removeCommand({
        label: "Toggle Block Decorators",
      })
    );
    const opts = JSON.parse(localStorageGet("decorators") || "{}") as Record<
      typeof settings[number],
      boolean
    >;
    if (opts["Move Todos Enabled"]) {
      const moveTodosObserver = createHTMLObserver({
        tag: "LABEL",
        className: "check-container",
        callback: (l: HTMLLabelElement) => {
          const input = l.getElementsByTagName("input")[0];
          if (!input.checked) {
            const blockUid = getBlockUidFromTarget(input);
            const title = getPageTitleByBlockUid(blockUid);
            if (DAILY_NOTE_PAGE_REGEX.test(title)) {
              const block = input.closest(".roam-block") as HTMLDivElement;
              if (!block.hasAttribute("data-roamjs-move-ref")) {
                block.setAttribute("data-roamjs-move-ref", "true");
                const p = document.createElement("span");
                p.onmousedown = (e) => e.stopPropagation();
                block.appendChild(p);
                render({
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
            if (!block.hasAttribute("data-roamjs-move-ref")) {
              block.setAttribute("data-roamjs-move-ref", "true");
              const p = document.createElement("span");
              p.onmousedown = (e) => e.stopPropagation();
              block.appendChild(p);
              render({
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
      let parseRoamMarked: Awaited<ReturnType<typeof getParseRoamMarked>>;
      getParseRoamMarked().then((f) => (parseRoamMarked = f));
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
      css.textContent = `span.${HEX_COLOR_PREVIEW_CLASSNAME} {
        width: 16px;
        height: 16px;
        display: inline-block;
        margin-left: 4px;
        top: 3px;
        position: relative;
    }`;
      document.head.appendChild(css);
      unloads.add(() => css.remove());
      const getRefTitlesByBlockUid = (uid: string): string[] =>
        window.roamAlphaAPI
          .q(
            `[:find (pull ?r [:node/title]) :where [?e :block/refs ?r] [?e :block/uid "${uid}"]]`
          )
          .map((b: { title: string }[]) => b[0]?.title || "");

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
              const renderedRefSpans = renderedRefs.filter(
                (s) =>
                  s.getAttribute("data-tag") === r &&
                  (!s.lastElementChild ||
                    !s.lastElementChild.id.startsWith(previewIdPrefix))
              );
              renderedRefSpans.forEach((renderedRef, i) => {
                const newSpan = document.createElement("span");
                newSpan.style.backgroundColor = c.string();
                newSpan.className = HEX_COLOR_PREVIEW_CLASSNAME;
                newSpan.id = `${previewIdPrefix}${i}`;
                renderedRef.appendChild(newSpan);
              });
            } catch (e) {
              if (
                !e.message ||
                !e.message.startsWith("Unable to parse color from string")
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
