import setDay from "date-fns/setDay";
import _dateFnsFormat from "date-fns/format";
import _parse from "date-fns/parse";
import addWeeks from "date-fns/addWeeks";
import subWeeks from "date-fns/subWeeks";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import TextPanel from "roamjs-components/components/ConfigPanels/TextPanel";
import FlagPanel from "roamjs-components/components/ConfigPanels/FlagPanel";
import getSettingValueFromTree from "roamjs-components/util/getSettingValueFromTree";
import { render as renderToast } from "roamjs-components/components/Toast";
import type { OnloadArgs, TreeNode } from "roamjs-components/types/native";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleValueByHtmlElement from "roamjs-components/dom/getPageTitleValueByHtmlElement";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import toFlexRegex from "roamjs-components/util/toFlexRegex";
import createBlock from "roamjs-components/writes/createBlock";
import createPage from "roamjs-components/writes/createPage";
import { addCommand } from "./workBench";
import {
  Field,
  UnionField,
} from "roamjs-components/components/ConfigPanels/types";

const ID = "weekly-notes";
const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const DATE_REGEX = new RegExp(`{(${DAYS.join("|")}):(.*?)}`, "g");
const FORMAT_DEFAULT_VALUE = "{monday:MM/dd yyyy} - {sunday:MM/dd yyyy}";
const CONFIG = `roam/js/${ID}`;

const formatCache = { current: "" };
const getFormat = (tree?: TreeNode[]) =>
  formatCache.current ||
  (formatCache.current = getSettingValueFromTree({
    key: "format",
    defaultValue: FORMAT_DEFAULT_VALUE,
    tree:
      tree || getFullTreeByParentUid(getPageUidByPageTitle(CONFIG)).children,
  }));

const dateFnsFormat = (...args: Parameters<typeof _dateFnsFormat>) => {
  try {
    return _dateFnsFormat(args[0], args[1], {
      useAdditionalWeekYearTokens: true,
    });
  } catch (e) {
    renderToast({
      id: "weekly-notes-error",
      content: `Invalid date format: ${(e as Error).message}`,
      intent: "danger",
    });
    return null;
  }
};

const parse = (...args: Parameters<typeof _parse>) => {
  try {
    return _parse(args[0], args[1], args[2], {
      useAdditionalWeekYearTokens: true,
    });
  } catch (e) {
    renderToast({
      id: "weekly-notes-error",
      content: `Invalid date format: ${(e as Error).message}`,
      intent: "danger",
    });
    return null;
  }
};

const createWeeklyPage = (pageName: string) => {
  const weekUid = createPage({ title: pageName });
  const tree = getFullTreeByParentUid(getPageUidByPageTitle(CONFIG)).children;
  const format = getFormat(tree);
  const [, day, dayFormat] = format.match(new RegExp(DATE_REGEX.source)) || [];
  const firstDateFormatted = pageName.match(
    new RegExp(
      `^${format
        .replace(/{(.*?)}/g, "(.*?)")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]")}$`
    )
  )?.[1];
  if (!firstDateFormatted) {
    return weekUid;
  }
  const date = parse(firstDateFormatted, dayFormat, new Date());
  if (!date) {
    return weekUid;
  }
  const weekStartsOn = DAYS.indexOf(day) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const autoTag = tree.some((t) => toFlexRegex("auto tag").test(t.text));
  const autoEmbed = tree.some((t) => toFlexRegex("auto embed").test(t.text));
  DAYS.forEach((_, i) => {
    const dayDate = setDay(date, i, { weekStartsOn });
    const title = window.roamAlphaAPI.util.dateToPageTitle(dayDate);
    if (autoTag) {
      Promise.resolve(
        getPageUidByPageTitle(title) || createPage({ title })
      ).then((parentUid) =>
        createBlock({ node: { text: `#[[${pageName}]]` }, parentUid })
      );
    }
    if (autoEmbed) {
      weekUid.then((parentUid) =>
        createBlock({
          node: { text: `{{[[embed]]:[[${title}]]}}` },
          parentUid,
          order: (i - weekStartsOn + 7) % 7,
        })
      );
    }
  });
  return weekUid;
};

const navigateToPage = (pageName: string) => {
  const existingPageUid = getPageUidByPageTitle(pageName);
  const { pageUid, timeout } = existingPageUid
    ? { pageUid: existingPageUid, timeout: 1 }
    : { pageUid: createWeeklyPage(pageName), timeout: 500 };
  setTimeout(() => {
    if (pageUid) {
      Promise.resolve(pageUid).then((uid) =>
        window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid } })
      );
    }
  }, timeout);
};

const unloads = new Set<() => void>();
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  if (flag) {
    createConfigObserver({
      title: CONFIG,
      config: {
        tabs: [
          {
            id: "home",
            fields: [
              {
                title: "format",
                Panel: TextPanel,
                defaultValue: FORMAT_DEFAULT_VALUE,
                description:
                  "Format of your weekly page titles. When changing the format, be sure to rename your old weekly pages.",
              } as Field<UnionField>,
              {
                title: "auto load",
                Panel: FlagPanel,
                description:
                  "Automatically load the current weekly note on initial Roam load of daily note page",
              } as Field<UnionField>,
              {
                title: "auto tag",
                Panel: FlagPanel,
                description:
                  "Automatically tag the weekly page on all the related daily pages when it's created",
                defaultValue: true,
              } as Field<UnionField>,
              {
                title: "auto embed",
                Panel: FlagPanel,
                description:
                  "Automatically embed the related daily pages into a newly created weekly page",
              } as Field<UnionField>,
            ],
          },
        ],
      },
    }).then((a) => unloads.add(() => a.observer?.disconnect()));

    const goToThisWeek = () => {
      const format = getFormat();
      const today = new Date();
      const weekStartsOn = DAYS.indexOf(
        format.match(new RegExp(DATE_REGEX.source))?.[1] || "sunday"
      ) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const pageName = format.replace(DATE_REGEX, (_, day, f) => {
        const dayOfWeek = setDay(today, DAYS.indexOf(day), { weekStartsOn });
        return dateFnsFormat(dayOfWeek, f) ?? "";
      });
      navigateToPage(pageName);
    };
    const defaultHotkey = window.roamAlphaAPI.platform.isPC
      ? "alt-w"
      : "ctrl-shift-w";
    unloads.add(
      addCommand(
        {
          label: "Go To Weekly Note",
          callback: () => goToThisWeek(),
          defaultHotkey: defaultHotkey,
        },
        extensionAPI
      )
    );

    const getFormatDateData = (title: string) => {
      const format = getFormat();
      const formats: string[] = [];
      const formatRegex = new RegExp(
        `^${format
          .replace(DATE_REGEX, (_, __, og) => {
            formats.push(og);
            return "(.*?)";
          })
          .replace(/\[/g, "\\[")
          .replace(/\]/g, "\\]")}$`
      );
      const exec = formatRegex.exec(title);
      if (exec) {
        const dateArray = exec
          .slice(1)
          .map((d, i) => {
            return parse(d, formats[i], new Date());
          })
          .filter((d): d is Date => !!d);
        return {
          dateArray,
          formats,
          valid:
            dateArray.length &&
            dateArray.every((s) => s && !isNaN(s.valueOf())),
        };
      }
      return { dateArray: [], formats, valid: false };
    };

    const hashListener = (newUrl: string) => {
      // Clean up navigation buttons when navigating away
      document.getElementById("roamjs-weekly-mode-nav")?.remove?.();

      // Clear format cache when visiting config page
      const urlUid = newUrl.match(/\/page\/(.*)$/)?.[1];
      if (urlUid) {
        const title = getPageTitleByPageUid(urlUid);
        if (title === CONFIG) {
          formatCache.current = "";
        }
      }
    };
    const wrappedListener = (e: HashChangeEvent) => hashListener(e.newURL);
    window.addEventListener("hashchange", wrappedListener);
    hashListener(window.location.href);
    unloads.add(() =>
      window.removeEventListener("hashchange", wrappedListener)
    );

    const autoLoad = getFullTreeByParentUid(
      getPageUidByPageTitle(CONFIG)
    ).children.some((t) => toFlexRegex("auto load").test(t.text));
    if (autoLoad && !window.location.hash.includes("/page/")) {
      goToThisWeek();
    }

    const h1Observer = createHTMLObserver({
      tag: "H1",
      className: "rm-title-display",
      callback: (header: HTMLElement) => {
        const title = getPageTitleValueByHtmlElement(header);
        const { dateArray, valid, formats } = getFormatDateData(title);
        if (valid) {
          // Prevent title editing
          header.onmousedown = (e) => {
            if (!e.shiftKey) {
              renderToast({
                id: "week-uid",
                content: "Weekly Note Titles Cannot be Changed",
              });
              e.stopPropagation();
            }
          };

          // Remove any existing navigation buttons
          document.getElementById("roamjs-weekly-mode-nav")?.remove?.();

          // Calculate previous and next week titles
          const formattedDateArray = dateArray
            .map((d, i) => ({
              cur: dateFnsFormat(d, formats[i]),
              prev: dateFnsFormat(subWeeks(d, 1), formats[i]),
              next: dateFnsFormat(addWeeks(d, 1), formats[i]),
            }))
            .filter(
              (info): info is { cur: string; prev: string; next: string } =>
                !!info.cur && !!info.prev && !!info.next
            );
          const prevTitle = formattedDateArray.reduce(
            (acc, info) => acc.replace(info.cur, info.prev),
            title
          );
          const nextTitle = formattedDateArray.reduce(
            (acc, info) => acc.replace(info.cur, info.next),
            title
          );

          // Create navigation buttons below the header
          const headerContainer = header.parentElement;
          const buttonContainer = document.createElement("div");
          buttonContainer.style.display = "flex";
          buttonContainer.style.justifyContent = "space-between";
          buttonContainer.style.marginBottom = "32px";
          buttonContainer.id = "roamjs-weekly-mode-nav";
          headerContainer?.appendChild(buttonContainer);

          const makeButton = (pagename: string, label: string) => {
            const button = document.createElement("button");
            button.className = "bp3-button";
            button.onclick = () => navigateToPage(pagename);
            button.innerText = label;
            buttonContainer.appendChild(button);
          };
          makeButton(prevTitle, "Last Week");
          makeButton(nextTitle, "Next Week");
        }
      },
    });
    unloads.add(() => h1Observer.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
