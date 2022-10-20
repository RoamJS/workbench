import setDay from "date-fns/setDay";
import dateFnsFormat from "date-fns/format";
import parse from "date-fns/parse";
import addWeeks from "date-fns/addWeeks";
import subWeeks from "date-fns/subWeeks";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import TextPanel from "roamjs-components/components/ConfigPanels/TextPanel";
import FlagPanel from "roamjs-components/components/ConfigPanels/FlagPanel";
import getSettingValueFromTree from "roamjs-components/util/getSettingValueFromTree";
import { render } from "roamjs-components/components/Toast";
import type { TreeNode } from "roamjs-components/types/native";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleValueByHtmlElement from "roamjs-components/dom/getPageTitleValueByHtmlElement";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import toFlexRegex from "roamjs-components/util/toFlexRegex";
import createBlock from "roamjs-components/writes/createBlock";
import createPage from "roamjs-components/writes/createPage";

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

const createWeeklyPage = (pageName: string) => {
  const weekUid = createPage({ title: pageName });
  const tree = getFullTreeByParentUid(getPageUidByPageTitle(CONFIG)).children;
  const format = getFormat(tree);
  const [, day, dayFormat] = format.match(new RegExp(DATE_REGEX.source));
  const firstDateFormatted = pageName.match(
    new RegExp(
      `^${format
        .replace(/{(.*?)}/g, "(.*?)")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]")}$`
    )
  )[1];
  const date = parse(firstDateFormatted, dayFormat, new Date());
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
export const toggleFeature = (flag: boolean) => {
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
              },
              {
                title: "auto load",
                Panel: FlagPanel,
                description:
                  "Automatically load the current weekly note on initial Roam load of daily note page",
              },
              {
                title: "auto tag",
                Panel: FlagPanel,
                description:
                  "Automatically tag the weekly page on all the related daily pages when it's created",
                defaultValue: true,
              },
              {
                title: "auto embed",
                Panel: FlagPanel,
                description:
                  "Automatically embed the related daily pages into a newly created weekly page",
              },
            ],
          },
        ],
      },
    }).then((a) => unloads.add(() => a.observer.disconnect()));
    
    const goToThisWeek = () => {
      const format = getFormat();
      const today = new Date();
      const weekStartsOn = DAYS.indexOf(
        format.match(new RegExp(DATE_REGEX.source))?.[1] || "sunday"
      ) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const pageName = format.replace(DATE_REGEX, (_, day, f) => {
        const dayOfWeek = setDay(today, DAYS.indexOf(day), { weekStartsOn });
        return dateFnsFormat(dayOfWeek, f);
      });
      navigateToPage(pageName);
    };

    const keydownListener = (e: KeyboardEvent) => {
      if (
        e.code === "KeyW" &&
        (e.altKey ||
          (e.ctrlKey && e.shiftKey && window.roamAlphaAPI.platform.isIOS))
      ) {
        e.preventDefault();
        e.stopPropagation();
        goToThisWeek();
      }
    };
    document.addEventListener("keydown", keydownListener);
    unloads.add(() => document.removeEventListener("keydown", keydownListener));

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
          .map((d, i) => parse(d, formats[i], new Date()));
        return {
          dateArray,
          formats,
          valid:
            dateArray.length && dateArray.every((s) => !isNaN(s.valueOf())),
        };
      }
      return { dateArray: [], formats, valid: false };
    };

    const hashListener = (newUrl: string) => {
      document.getElementById("roamjs-weekly-mode-nav")?.remove?.();
      const urlUid = newUrl.match(/\/page\/(.*)$/)?.[1];
      if (urlUid) {
        const title = getPageTitleByPageUid(urlUid);
        if (title === CONFIG) {
          formatCache.current = "";
          return;
        }
        const { dateArray, valid, formats } = getFormatDateData(title);
        if (valid) {
          const prevTitle = dateArray.reduce(
            (prev, cur, i) =>
              prev.replace(
                dateFnsFormat(cur, formats[i]),
                dateFnsFormat(subWeeks(cur, 1), formats[i])
              ),
            title
          );
          const nextTitle = dateArray.reduce(
            (prev, cur, i) =>
              prev.replace(
                dateFnsFormat(cur, formats[i]),
                dateFnsFormat(addWeeks(cur, 1), formats[i])
              ),
            title
          );
          setTimeout(() => {
            const header = document.querySelector(
              ".roam-article h1.rm-title-display"
            ) as HTMLHeadingElement;
            const headerContainer = header.parentElement;
            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "flex";
            buttonContainer.style.justifyContent = "space-between";
            buttonContainer.style.marginBottom = "32px";
            buttonContainer.id = "roamjs-weekly-mode-nav";
            headerContainer.appendChild(buttonContainer);

            const makeButton = (pagename: string, label: string) => {
              const button = document.createElement("button");
              button.className = "bp3-button";
              button.onclick = () => navigateToPage(pagename);
              button.innerText = label;
              buttonContainer.appendChild(button);
            };
            makeButton(prevTitle, "Last Week");
            makeButton(nextTitle, "Next Week");
          });
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
      callback: (header: HTMLHeadingElement) => {
        const title = getPageTitleValueByHtmlElement(header);
        const { valid } = getFormatDateData(title);
        if (valid) {
          header.onmousedown = (e) => {
            if (!e.shiftKey) {
              render({
                id: "week-uid",
                content: "Weekly Note Titles Cannot be Changed",
              });
              e.stopPropagation();
            }
          };
        }
      },
    });
    unloads.add(() => h1Observer.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
