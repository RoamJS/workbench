import { expect, test } from "@playwright/test";
import { transformSync } from "esbuild";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";

type Context = { "block-uid": string; "read-only?"?: boolean };
type Command = {
  label: string;
  callback: (context?: Context) => Promise<void>;
};
const createHarness = () => {
  const dom = new JSDOM("<body></body>");
  const palette = new Map<string, Command>();
  const blockMenu = new Map<string, Command>();
  const selectionMenu = new Map<string, Command>();
  const updates: { block: { uid: string; open: boolean } }[] = [];
  const toasts: { intent: string; content: string }[] = [];
  const state = {
    selected: [] as string[],
    individual: [] as string[],
    focused: null as string | null,
    failUid: null as string | null,
  };
  const menu = (commands: Map<string, Command>) => ({
    addCommand: (command: Command) => commands.set(command.label, command),
    removeCommand: ({ label }: { label: string }) => commands.delete(label),
  });
  const ui = {
    multiselect: {
      getSelected: () => state.selected.map((uid) => ({ "block-uid": uid })),
    },
    individualMultiselect: { getSelectedUids: () => state.individual },
    getFocusedBlock: () =>
      state.focused ? { "block-uid": state.focused } : null,
    blockContextMenu: menu(blockMenu),
    msContextMenu: menu(selectionMenu),
  };
  const compiled = transformSync(
    fs.readFileSync(
      path.resolve(__dirname, "../src/features/blockOpenDefaults.ts"),
      "utf8",
    ),
    { loader: "ts", format: "cjs" },
  ).code;
  const module = { exports: {} };
  new Function("window", "document", "require", "module", "exports", compiled)(
    {
      roamAlphaAPI: {
        ui,
        data: {
          block: {
            update: async (update: (typeof updates)[number]) => {
              if (update.block.uid === state.failUid) throw new Error("Denied");
              updates.push(update);
            },
          },
        },
      },
    },
    dom.window.document,
    (id: string) =>
      id === "roamjs-components/components/Toast"
        ? { render: (toast: (typeof toasts)[number]) => toasts.push(toast) }
        : require(id),
    module,
    module.exports,
  );
  const register = () =>
    (
      module.exports as typeof import("../src/features/blockOpenDefaults")
    ).registerBlockOpenDefaults({
      addPaletteCommand: (command) => {
        palette.set(command.label, command);
        return () => palette.delete(command.label);
      },
    });
  const unload = register();
  return {
    dom,
    palette,
    blockMenu,
    selectionMenu,
    state,
    ui,
    updates,
    toasts,
    unload,
    register,
  };
};

for (const [word, open] of [
  ["collapsed", false],
  ["expanded", true],
] as const) {
  test(`${word}: selection takes priority over focus and duplicate blocks update once`, async () => {
    const h = createHarness();
    h.state.selected = ["selected1", "selected2"];
    h.state.individual = ["selected2"];
    h.state.focused = "focused01";
    await h.palette.get(`Set shared default to ${word}`)!.callback();
    expect(h.updates).toEqual([
      { block: { uid: "selected1", open } },
      { block: { uid: "selected2", open } },
    ]);
    expect(h.toasts.at(-1)?.intent).toBe("success");
    h.dom.window.close();
  });

  test(`${word}: no selection falls back to the focused block only`, async () => {
    const h = createHarness();
    h.state.focused = "focused01";
    await h.palette.get(`Set shared default to ${word}`)!.callback();
    expect(h.updates).toEqual([{ block: { uid: "focused01", open } }]);
    h.dom.window.close();
  });

  test(`${word}: right-click targets the clicked block rather than unrelated focus or selection`, async () => {
    const h = createHarness();
    h.state.focused = "focused01";
    h.state.selected = ["selected1"];
    await h.blockMenu.get(`(WB) Set shared default to ${word}`)!.callback({
      "block-uid": "clicked01",
    });
    expect(h.updates).toEqual([{ block: { uid: "clicked01", open } }]);
    h.dom.window.close();
  });

  test(`${word}: both right-click menus support the selected group`, async () => {
    const h = createHarness();
    h.state.selected = ["selected1", "selected2"];
    const label = `(WB) Set shared default to ${word}`;
    await h.blockMenu.get(label)!.callback({ "block-uid": "selected1" });
    expect(h.updates.map(({ block }) => block)).toEqual([
      { uid: "selected1", open },
      { uid: "selected2", open },
    ]);
    h.updates.length = 0;
    await h.selectionMenu.get(label)!.callback();
    expect(h.updates.map(({ block }) => block)).toEqual([
      { uid: "selected1", open },
      { uid: "selected2", open },
    ]);
    h.dom.window.close();
  });
}

test("individual multiselect works without drag selection", async () => {
  const h = createHarness();
  h.state.individual = ["selected1", "selected2"];
  h.state.focused = "focused01";
  await h.palette.get("Set shared default to collapsed")!.callback();
  expect(h.updates.map(({ block }) => block.uid)).toEqual([
    "selected1",
    "selected2",
  ]);
  h.dom.window.close();
});

test("legacy DOM selection works when native selection is unavailable", async () => {
  const h = createHarness();
  Reflect.deleteProperty(h.ui, "multiselect");
  Reflect.deleteProperty(h.ui, "individualMultiselect");
  h.state.focused = "focused01";
  h.dom.window.document.body.innerHTML = `
    <div class="block-highlight-blue"><div class="roam-block" id="block-input-main-selected1"></div></div>
    <div class="block-highlight-blue"></div>`;
  await h.palette.get("Set shared default to collapsed")!.callback();
  expect(h.updates).toEqual([{ block: { uid: "selected1", open: false } }]);
  h.dom.window.close();
});

test("no target warns without changing blocks; multiselect menu does not fall back to stale focus", async () => {
  const h = createHarness();
  await h.palette.get("Set shared default to collapsed")!.callback();
  expect(h.toasts.at(-1)?.intent).toBe("warning");
  h.state.focused = "focused01";
  await h.selectionMenu.get("(WB) Set shared default to expanded")!.callback();
  expect(h.updates).toEqual([]);
  expect(h.toasts.at(-1)?.intent).toBe("warning");
  h.dom.window.close();
});

test("read-only context does not mutate a block", async () => {
  const h = createHarness();
  await h.blockMenu.get("(WB) Set shared default to collapsed")!.callback({
    "block-uid": "readonly1",
    "read-only?": true,
  });
  expect(h.updates).toEqual([]);
  h.dom.window.close();
});

test("a rejected write reports failure without claiming success", async () => {
  const h = createHarness();
  h.state.selected = ["selected1", "selected2"];
  h.state.failUid = "selected2";
  await h.palette.get("Set shared default to collapsed")!.callback();
  expect(h.updates).toHaveLength(1);
  expect(h.toasts.map(({ intent }) => intent)).toEqual(["danger"]);
  h.dom.window.close();
});

test("unload removes both commands from every menu and re-enable registers once", () => {
  const h = createHarness();
  for (const menu of [h.palette, h.blockMenu, h.selectionMenu])
    expect(menu.size).toBe(2);
  h.unload();
  for (const menu of [h.palette, h.blockMenu, h.selectionMenu])
    expect(menu.size).toBe(0);
  const unload = h.register();
  for (const menu of [h.palette, h.blockMenu, h.selectionMenu])
    expect(menu.size).toBe(2);
  unload();
  h.dom.window.close();
});
