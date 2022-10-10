import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import { DAILY_NOTE_PAGE_REGEX } from "roamjs-components/date/constants";
import ReactDOM from "react-dom";
import {
  Button,
  Checkbox,
  Intent,
  Popover,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
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

const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    const archivedDefault = !!get("decoratorsMoveArchives");
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
    unloads.add(() => moveTodosObserver.disconnect());
    unloads.add(() => moveTagsObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
