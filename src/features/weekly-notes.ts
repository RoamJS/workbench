import setDay from "date-fns/setDay";
import _dateFnsFormat from "date-fns/format";
import _parse from "date-fns/parse";
import addWeeks from "date-fns/addWeeks";
import subWeeks from "date-fns/subWeeks";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import TextPanel from "roamjs-components/components/ConfigPanels/TextPanel";
import FlagPanel from "roamjs-components/components/ConfigPanels/FlagPanel";
import BlocksPanel from "roamjs-components/components/ConfigPanels/BlocksPanel";
import getSettingValueFromTree from "roamjs-components/util/getSettingValueFromTree";
import { render as renderToast } from "roamjs-components/components/Toast";
import type {
  InputTextNode,
  OnloadArgs,
  RoamBasicNode,
  TreeNode,
} from "roamjs-components/types/native";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleValueByHtmlElement from "roamjs-components/dom/getPageTitleValueByHtmlElement";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getChildrenLengthByParentUid from "roamjs-components/queries/getChildrenLengthByParentUid";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import toFlexRegex from "roamjs-components/util/toFlexRegex";
import getSubTree from "roamjs-components/util/getSubTree";
import stripUid from "roamjs-components/util/stripUid";
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

const hasNodeContent = (node: InputTextNode | RoamBasicNode): boolean =>
  !!node.text.trim() || !!node.children?.some(hasNodeContent);

const hasSmartBlockSyntax = (node: RoamBasicNode): boolean =>
  node.text.includes("<%") || node.children.some(hasSmartBlockSyntax);

type InstalledExtension = {
  id?: string;
  name?: string;
  enabled?: boolean;
  version?: string;
};

const isSmartBlocksEnabled = () => {
  const getInstalledExtensions = (
    window.roamAlphaAPI as typeof window.roamAlphaAPI & {
      extension?: {
        getInstalledExtensions?: () => Record<string, InstalledExtension>;
      };
    }
  ).extension?.getInstalledExtensions;
  if (!getInstalledExtensions) return true;

  try {
    const installedExtensions = getInstalledExtensions();
    const smartblocks = Object.entries(installedExtensions).find(
      ([key, extension]) => {
        const id = (extension.id || key).toLowerCase();
        const name = (extension.name || "").toLowerCase();
        return (
          id === "smartblocks" ||
          id.endsWith("+smartblocks") ||
          name === "smartblocks"
        );
      }
    )?.[1];
    return !!smartblocks && smartblocks.enabled !== false;
  } catch (e) {
    console.error(e);
    return true;
  }
};

const waitForSmartBlocks = () =>
  new Promise<typeof window.roamjs.extension.smartblocks | undefined>(
    (resolve) => {
      const getSmartBlocks = () => window.roamjs?.extension?.smartblocks;
      const smartblocks = getSmartBlocks();
      if (smartblocks) {
        resolve(smartblocks);
        return;
      }
      if (!isSmartBlocksEnabled()) {
        resolve(undefined);
        return;
      }

      const interval = window.setInterval(() => {
        const smartblocks = getSmartBlocks();
        if (smartblocks) {
          cleanup();
          resolve(smartblocks);
        }
      }, 250);
      const timeout = window.setTimeout(() => {
        cleanup();
        resolve(getSmartBlocks());
      }, 1500);
      const handleSmartBlocksLoaded = () => {
        cleanup();
        resolve(getSmartBlocks());
      };
      const cleanup = () => {
        window.clearInterval(interval);
        window.clearTimeout(timeout);
        document.body.removeEventListener(
          "roamjs:smartblocks:loaded",
          handleSmartBlocksLoaded
        );
      };

      document.body.addEventListener(
        "roamjs:smartblocks:loaded",
        handleSmartBlocksLoaded
      );
    }
  );

const createBlocksFromTemplate = async ({
  templateNode,
  pageUid,
}: {
  templateNode: RoamBasicNode;
  pageUid: string;
}) => {
  const startingOrder = getChildrenLengthByParentUid(pageUid);
  await Promise.all(
    stripUid(templateNode.children)
      .filter(hasNodeContent)
      .map((node, order) =>
        createBlock({
          node,
          order: startingOrder + order,
          parentUid: pageUid,
        })
      )
  );
};

const renderWeeklyTemplate = async ({
  tree,
  pageUid,
  date,
}: {
  tree: RoamBasicNode[];
  pageUid: string;
  date?: Date;
}) => {
  const templateNode = getSubTree({
    tree,
    key: "template",
  });
  const templateChildren = templateNode.children.filter(hasNodeContent);
  if (!templateNode.uid || !templateChildren.length) return;

  const useSmartBlocks = templateChildren.some(hasSmartBlockSyntax);
  const smartblocks = useSmartBlocks ? await waitForSmartBlocks() : undefined;
  if (useSmartBlocks && !smartblocks) {
    renderToast({
      content:
        "This weekly note template requires SmartBlocks. Enable SmartBlocks in Roam Depot to use this template.",
      id: "weekly-notes-smartblocks-extension-disabled",
      intent: "warning",
    });
    await createBlocksFromTemplate({ templateNode, pageUid });
  } else if (smartblocks) {
    await smartblocks.triggerSmartblock({
      srcUid: templateNode.uid,
      targetUid: pageUid,
      variables: date ? { DATEBASISMETHOD: date.toJSON() } : undefined,
    });
  } else {
    await createBlocksFromTemplate({ templateNode, pageUid });
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

  weekUid.then(async (pageUid) => {
    const date = firstDateFormatted
      ? parse(firstDateFormatted, dayFormat, new Date())
      : null;

    try {
      if (date) {
        const weekStartsOn = DAYS.indexOf(day) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const autoTag = tree.some((t) => toFlexRegex("auto tag").test(t.text));
        const autoEmbed = tree.some((t) =>
          toFlexRegex("auto embed").test(t.text)
        );
        const tagPromises: Promise<unknown>[] = [];
        const embedPromises: Promise<unknown>[] = [];
        DAYS.forEach((_, i) => {
          const dayDate = setDay(date, i, { weekStartsOn });
          const title = window.roamAlphaAPI.util.dateToPageTitle(dayDate);
          if (autoTag) {
            tagPromises.push(
              Promise.resolve(
                getPageUidByPageTitle(title) || createPage({ title })
              ).then((parentUid) =>
                createBlock({ node: { text: `#[[${pageName}]]` }, parentUid })
              )
            );
          }
          if (autoEmbed) {
            embedPromises.push(
              createBlock({
                node: { text: `{{[[embed]]:[[${title}]]}}` },
                parentUid: pageUid,
                order: (i - weekStartsOn + 7) % 7,
              })
            );
          }
        });
        await Promise.all(embedPromises);
        await renderWeeklyTemplate({ tree, pageUid, date });
        await Promise.all(tagPromises);
      } else {
        await renderWeeklyTemplate({ tree, pageUid });
      }
    } catch (e) {
      console.error(e);
      renderToast({
        id: "weekly-notes-template-error",
        content: `Weekly note template failed: ${(e as Error).message}`,
        intent: "danger",
      });
    }
    return pageUid;
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
              {
                title: "Template",
                Panel: BlocksPanel,
                defaultValue: [],
                description:
                  "Blocks to insert into newly created weekly note pages. Supports SmartBlocks syntax when SmartBlocks is enabled.",
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
      callback: (header: HTMLElement) => {
        const title = getPageTitleValueByHtmlElement(header);
        const { valid } = getFormatDateData(title);
        if (valid) {
          header.onmousedown = (e) => {
            if (!e.shiftKey) {
              renderToast({
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
