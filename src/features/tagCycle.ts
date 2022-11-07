import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import type { PullBlock, TreeNode } from "roamjs-components/types/native";
import getUids from "roamjs-components/dom/getUids";

const fixCursorById = ({
  id,
  start,
  end,
  focus,
}: {
  id: string;
  start: number;
  end: number;
  focus?: boolean;
}): number =>
  window.setTimeout(() => {
    const textArea = document.getElementById(id) as HTMLTextAreaElement;
    if (focus) {
      textArea.focus();
    }
    textArea.setSelectionRange(start, end);
  }, 100);

const replaceText = ({
  before,
  after,
  prepend,
}: {
  before: string;
  after: string;
  prepend?: boolean;
}): void => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  const id = textArea.id;
  const oldValue = textArea.value;
  const start = textArea.selectionStart;
  const end = textArea.selectionEnd;
  const text = !before
    ? prepend
      ? `${after} ${oldValue}`
      : `${oldValue}${after}`
    : oldValue.replace(`${before}${!after && prepend ? " " : ""}`, after);
  const { blockUid } = getUids(textArea);
  window.roamAlphaAPI.updateBlock({ block: { string: text, uid: blockUid } });
  const diff = text.length - oldValue.length;
  if (diff !== 0) {
    let index = 0;
    const maxIndex = Math.min(
      Math.max(oldValue.length, text.length),
      Math.max(start, end) + 1
    );
    for (index = 0; index < maxIndex; index++) {
      if (oldValue.charAt(index) !== text.charAt(index)) {
        break;
      }
    }
    const newStart = index > start ? start : start + diff;
    const newEnd = index > end ? end : end + diff;
    if (newStart !== start || newEnd !== end) {
      fixCursorById({
        id,
        start: newStart,
        end: newEnd,
      });
    }
  }
};

const replaceTagText = ({
  before,
  after,
  addHash = false,
  prepend = false,
}: {
  before: string;
  after: string;
  addHash?: boolean;
  prepend?: boolean;
}): void => {
  if (before) {
    const textArea = document.activeElement as HTMLTextAreaElement;
    if (textArea.value.includes(`#[[${before}]]`)) {
      replaceText({
        before: `#[[${before}]]`,
        after: after ? `#[[${after}]]` : "",
        prepend,
      });
    } else if (textArea.value.includes(`[[${before}]]`)) {
      replaceText({
        before: `[[${before}]]`,
        after: after ? `[[${after}]]` : "",
        prepend,
      });
    } else if (textArea.value.includes(`#${before}`)) {
      const hashAfter = after.match(/(\s|\[\[.*\]\]|[^\x00-\xff])/)
        ? `#[[${after}]]`
        : `#${after}`;
      replaceText({
        before: `#${before}`,
        after: after ? hashAfter : "",
        prepend,
      });
    }
  } else if (addHash) {
    const hashAfter = after.match(/(\s|\[\[.*\]\]|[^\x00-\xff])/)
      ? `#[[${after}]]`
      : `#${after}`;
    replaceText({ before: "", after: hashAfter, prepend });
  } else {
    replaceText({ before: "", after: `[[${after}]]`, prepend });
  }
};

type IdsCallback = (ids: number[]) => void;
type DiffOptions = {
  addedCallback?: IdsCallback;
  removedCallback?: IdsCallback;
  callback?: (before: PullBlock, after: PullBlock) => void;
};

const diffChildren = (
  before: PullBlock,
  after: PullBlock,
  { addedCallback, removedCallback, callback }: DiffOptions
) => {
  const beforeChildren = new Set(
    (before?.[":block/children"] || []).map((d) => d[":db/id"])
  );
  const afterChildren = new Set(
    (after?.[":block/children"] || []).map((d) => d[":db/id"])
  );
  if (afterChildren.size > beforeChildren.size && addedCallback) {
    addedCallback(
      Array.from(afterChildren).filter((b) => !beforeChildren.has(b) && !!b)
    );
  } else if (beforeChildren.size > afterChildren.size && removedCallback) {
    removedCallback(
      Array.from(beforeChildren).filter((b) => !afterChildren.has(b) && !!b)
    );
  }
  if (callback) {
    callback(before, after);
  }
};

const watchBlock = ({
  blockUid,
  ...options
}: { blockUid: string } & DiffOptions) => {
  const args = [
    "[:block/children :block/string]",
    `[:block/uid "${blockUid}"]`,
    (before: PullBlock, after: PullBlock) =>
      before && after && diffChildren(before, after, options),
  ] as const;
  window.roamAlphaAPI.data.addPullWatch(...args);
  return () => window.roamAlphaAPI.data.removePullWatch(...args);
};

const watchPage = ({
  title,
  addedCallback,
  removedCallback,
}: {
  title: string;
} & Pick<DiffOptions, "addedCallback" | "removedCallback">) => {
  const args = [
    "[:block/children]",
    `[:node/title "${title}"]`,
    (before: PullBlock, after: PullBlock) => {
      before &&
        after &&
        diffChildren(before, after, { addedCallback, removedCallback });
    },
  ] as const;
  window.roamAlphaAPI.data.addPullWatch(...args);
  return () => window.roamAlphaAPI.data.removePullWatch(...args);
};

const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    const config: { [blockUid: string]: EventListener } = {};
    const blockUidsByKeystroke: { [keystroke: string]: Set<string> } = {};
    const root = document.getElementsByClassName("roam-app")[0] || document;

    const cleanConfig = (blockUid = "") => {
      if (config[blockUid]) {
        root.removeEventListener("keydown", config[blockUid]);
        delete config[blockUid];
        const uids = Object.values(blockUidsByKeystroke).find((v) =>
          v.has(blockUid)
        );
        if (uids) {
          uids.delete(blockUid);
        }
      }
    };
    const configureShortcut = (shortcut: {
      text: string;
      children: TreeNode[];
      uid: string;
    }) => {
      const parts = shortcut.text.split("+").map((s) => s.toUpperCase().trim());
      const modifier = parts[0];
      const isShift = parts[1] === "SHIFT";
      const keyParts = parts[parts.length - 1].split(" ") || [""];
      const key = keyParts[0];
      const modifiers = keyParts.slice(1).map((s) => s.toUpperCase());
      const cycle = shortcut.children.map((c) => c.text.trim());
      const sortedCycle = cycle
        .map((tag, index) => ({ tag, index }))
        .sort((a, b) => b.tag.length - a.tag.length);
      const isTriggered = (e: KeyboardEvent) => {
        if (modifier === "ALT" && !e.altKey) {
          return false;
        }
        if (modifier === "OPT" && !e.altKey) {
          return false;
        }
        if (modifier === "CMD" && !e.metaKey) {
          return false;
        }
        if (modifier === "WIN" && !e.metaKey) {
          return false;
        }
        if (modifier === "CTRL" && !e.ctrlKey) {
          return false;
        }
        if (isShift && !e.shiftKey) {
          return false;
        }
        if (key === "SPACE" && e.key === " ") {
          return true;
        }
        if (key === e.key.toUpperCase()) {
          return true;
        }
        return false;
      };
      cleanConfig(shortcut.uid);
      const keyStroke = [...parts.slice(0, parts.length - 1), key].join("+");
      if (blockUidsByKeystroke[keyStroke]) {
        blockUidsByKeystroke[keyStroke].add(shortcut.uid);
      } else {
        blockUidsByKeystroke[keyStroke] = new Set([shortcut.uid]);
      }
      config[shortcut.uid] = (async (e: Event) => {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "TEXTAREA") {
          if (isTriggered(e as KeyboardEvent)) {
            const textarea = element as HTMLTextAreaElement;
            for (let i = 0; i < sortedCycle.length; i++) {
              const { tag: tag1, index } = sortedCycle[i];
              if (
                (textarea.value.includes(tag1) &&
                  modifiers.includes("RAW") &&
                  tag1) ||
                (textarea.value.includes(`#[[${tag1}]]`) && tag1) ||
                (textarea.value.includes(`[[${tag1}]]`) && tag1) ||
                (textarea.value.includes(`#${tag1}`) && tag1) ||
                (!tag1 && blockUidsByKeystroke[keyStroke].size === 1)
              ) {
                const tag2 = cycle[(index + 1 + cycle.length) % cycle.length];
                const prepend = modifiers.includes("FRONT");
                if (modifiers.includes("RAW")) {
                  await replaceText({ before: tag1, after: tag2, prepend });
                } else {
                  await replaceTagText({
                    before: tag1,
                    after: tag2,
                    addHash: modifiers.includes("HASH"),
                    prepend,
                  });
                }
                e.preventDefault();
                e.stopPropagation();
                break;
              }
            }
          }
        }
      }) as EventListener;
      root.addEventListener("keydown", config[shortcut.uid]);
      unloads.add(() =>
        root.removeEventListener("keydown", config[shortcut.uid])
      );
    };

    const isValidShortcut = (t: Pick<TreeNode, "text">) =>
      /^(CTRL|CMD|ALT|OPT|WIN)(\s*)\+/i.test(t.text);

    const watchTagCycleBlockUid = (blockUid = "") => {
      const shortcutCallback = () => {
        const shortcut = getFullTreeByParentUid(blockUid);
        if (isValidShortcut(shortcut)) {
          configureShortcut({ ...shortcut, uid: blockUid });
        }
      };
      unloads.add(
        watchBlock({
          blockUid,
          addedCallback: (addedIds) => {
            addedIds
              .map(
                (id) =>
                  window.roamAlphaAPI.pull("[:block/uid]", id)[":block/uid"]
              )
              .forEach(
                (uid) =>
                  uid &&
                  unloads.add(
                    watchBlock({
                      blockUid: uid,
                      callback: shortcutCallback,
                    })
                  )
              );
            shortcutCallback();
          },
          removedCallback: shortcutCallback,
          callback: shortcutCallback,
        })
      );
    };

    getFullTreeByParentUid(getPageUidByPageTitle("roam/js/tag-cycle"))
      .children.map((t) => {
        watchTagCycleBlockUid(t.uid);
        t.children.forEach((v) =>
          watchBlock({
            blockUid: v.uid,
            callback: () => {
              const c = getFullTreeByParentUid(t.uid);
              return isValidShortcut(c) && configureShortcut(c);
            },
          })
        );
        return t;
      })
      .filter(isValidShortcut)
      .forEach(configureShortcut);

    unloads.add(
      watchPage({
        title: "roam/js/tag-cycle",
        addedCallback: (ids) => {
          ids
            .map(
              (id) => window.roamAlphaAPI.pull("[:block/uid]", id)[":block/uid"]
            )
            .forEach(watchTagCycleBlockUid);
        },
        removedCallback: (ids) => {
          ids
            .map(
              (id) => window.roamAlphaAPI.pull("[:block/uid]", id)[":block/uid"]
            )
            .map(cleanConfig);
        },
      })
    );
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
