import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import { buildSync } from "esbuild";
import path from "node:path";
import { readDailyNotesGeometry } from "../src/features/dailyNotesPopupModel";

const viewport = { width: 1200, height: 800 };

test("saved Daily Notes layout survives the window upgrade", () => {
  expect(
    readDailyNotesGeometry({
      stored: JSON.stringify({ width: 600, height: 400, left: 90, top: 120 }),
      viewport,
    }),
  ).toEqual({ width: 600, height: 400, x: 90, y: 120 });
});

test("invalid saved layout falls back safely and offscreen windows stay reachable", () => {
  for (const stored of [
    "invalid",
    "null",
    "[]",
    '{"left":"bad","height":null}',
  ]) {
    expect(readDailyNotesGeometry({ stored, viewport })).toEqual({
      width: 500,
      height: 344,
      x: 350,
      y: 228,
    });
  }
  const geometry = readDailyNotesGeometry({
    stored: '{"left":2000,"top":2000,"width":-10,"height":5000}',
    viewport,
  });
  expect(geometry.x + geometry.width).toBeLessThanOrEqual(1192);
  expect(geometry.y + geometry.height).toBeLessThanOrEqual(792);
  expect(geometry.width).toBe(280);
});

const setup = ({ delayed = false, fail = false } = {}) => {
  const cachedModules = new Set(Object.keys(require.cache));
  const dom = new JSDOM(
    '<div class="roam-app"><div class="roam-article"><div class="roam-block" data-uid="main-block"></div></div></div>',
    { pretendToBeVisual: true, url: "https://roamresearch.com" },
  );
  const globals = [
    "window",
    "self",
    "document",
    "Element",
    "HTMLElement",
    "Node",
    "navigator",
    "DocumentFragment",
    "Document",
    "CharacterData",
    "DocumentType",
    "NodeList",
    "HTMLCollection",
    "SVGElement",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "MutationObserver",
    "localStorage",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ];
  const previous = new Map(
    globals.map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  globals.forEach((key) =>
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: dom.window[key],
    }),
  );
  const React = require("react");
  const ReactDOM = require("react-dom");
  const commands = new Map<string, () => void>();
  const focus: string[] = [];
  let renders = 0;
  let unmounts = 0;
  let finish: () => void = () => undefined;
  dom.window.roamAlphaAPI = {
    util: { dateToPageUid: () => "11-06-2026" },
    ui: {
      components: {
        renderPage: ({ el }: { el: HTMLElement }) => {
          renders++;
          const paint = () => {
            el.innerHTML =
              '<div class="rm-block-children"><div class="roam-block" data-uid="test-block" contenteditable="true">Today</div></div>';
          };
          if (fail) return Promise.reject(new Error("render failed"));
          if (delayed)
            return new Promise<void>((resolve) => {
              finish = () => {
                paint();
                resolve();
              };
            });
          paint();
        },
        unmountNode: () => {
          unmounts++;
        },
      },
      setBlockFocusAndSelection: ({
        location,
      }: {
        location: Record<string, string>;
      }) => focus.push(location["block-uid"]),
    },
  };
  const compiled = buildSync({
    entryPoints: [
      path.resolve(__dirname, "../src/features/dailyNotesPopup.tsx"),
    ],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    external: [
      "react",
      "react-dom",
      "@blueprintjs/core",
      "roamjs-components/*",
      "../settings",
      "./workBench",
    ],
  });
  const module = {
    exports: {} as {
      component: { toggleVisible: () => void };
      toggleFeature: (flag: boolean, api: unknown) => void;
    },
  };
  const customRequire = (id: string): unknown => {
    if (id === "../settings") return { get: () => "off" };
    if (id === "./workBench")
      return {
        addCommand: ({
          label,
          callback,
        }: {
          label: string;
          callback: () => void;
        }) => {
          commands.set(label, callback);
          return () => commands.delete(label);
        },
      };
    if (id.endsWith("/getFirstChildUidByBlockUid")) return () => "test-block";
    if (id.endsWith("/getUids"))
      return (el: HTMLElement) => ({
        blockUid: el.dataset.uid,
        windowId: "test-window",
      });
    if (id.endsWith("/renderOverlay"))
      return ({
        Overlay,
        props,
        path: parent,
      }: {
        Overlay: unknown;
        props: { onClose: () => void };
        path: HTMLElement;
      }) => {
        const mount = dom.window.document.createElement("div");
        parent.appendChild(mount);
        const close = () => {
          props.onClose();
          ReactDOM.unmountComponentAtNode(mount);
          mount.remove();
        };
        ReactDOM.render(
          React.createElement(Overlay, { isOpen: true, onClose: close }),
          mount,
        );
        return close;
      };
    return require(id);
  };
  new Function("require", "module", "exports", compiled.outputFiles[0].text)(
    customRequire,
    module,
    module.exports,
  );
  const api = module.exports;
  api.toggleFeature(true, {});
  const popup = () =>
    dom.window.document.querySelector<HTMLElement>(
      '[data-preview-id="daily-notes-popup"]',
    )!;
  const click = (action: string) =>
    popup()
      .querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!
      .click();
  return {
    dom,
    api,
    popup,
    click,
    commands,
    focus,
    finish: () => finish(),
    renders: () => renders,
    unmounts: () => unmounts,
    async cleanup() {
      api.toggleFeature(false, {});
      await new Promise((resolve) => setTimeout(resolve, 20));
      for (const key of globals) {
        const descriptor = previous.get(key);
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
      dom.window.close();
      // React/Blueprint cache DOM references; do not leak this window to other suites.
      for (const id of Object.keys(require.cache)) {
        if (!cachedModules.has(id)) delete require.cache[id];
      }
    },
  };
};

test("minimize and restore retain the native page, layout, and draft content", async () => {
  const s = setup();
  try {
    s.api.component.toggleVisible();
    await expect.poll(() => s.focus).toEqual(["test-block"]);
    const initial = s.popup().getAttribute("style");
    expect(s.popup().querySelector('[data-action="pin"]')).toBeNull();
    const content = s.popup().querySelector<HTMLElement>(".roam-block")!;
    content.textContent = "Uncommitted editing state";
    s.click("minimize");
    expect(s.popup().dataset.minimized).toBe("true");
    expect(s.popup().style.top).toBe("212px");
    s.click("minimize");
    expect(s.popup().getAttribute("style")).toBe(initial);
    expect(s.popup().querySelector(".roam-block")).toBe(content);
    expect(content.textContent).toBe("Uncommitted editing state");
    expect(s.renders()).toBe(1);
    s.click("close");
    await expect.poll(s.unmounts).toBe(1);
    s.api.component.toggleVisible();
    await expect.poll(s.renders).toBe(2);
    expect(s.popup()).not.toBeNull();
  } finally {
    await s.cleanup();
  }
});

test("keyboard move and resize persist across reopen; disable removes window and commands", async () => {
  const s = setup();
  try {
    s.api.component.toggleVisible();
    await expect.poll(s.renders).toBe(1);
    const header = s.popup().querySelector<HTMLElement>('[role="group"]')!;
    header.dispatchEvent(
      new s.dom.window.KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        shiftKey: true,
      }),
    );
    const resize = s
      .popup()
      .querySelector<HTMLElement>(".roamjs-workbench-live-preview-resize")!;
    resize.dispatchEvent(
      new s.dom.window.KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
      }),
    );
    await expect
      .poll(
        () =>
          JSON.parse(
            s.dom.window.localStorage.getItem("DNP_Parameters_Dimensions")!,
          ).height,
      )
      .toBe(354);
    const saved = s.popup().getAttribute("style");
    s.api.component.toggleVisible();
    s.api.component.toggleVisible();
    expect(s.popup().getAttribute("style")).toBe(saved);
    s.api.toggleFeature(false, {});
    expect(s.popup()).toBeNull();
    expect(s.commands.size).toBe(0);
  } finally {
    await s.cleanup();
  }
});

test("focus shortcut tolerates no selection and switches between popup and main page", async () => {
  const s = setup();
  try {
    s.api.component.toggleVisible();
    await expect.poll(() => s.focus.length).toBe(1);
    s.dom.window.getSelection()!.removeAllRanges();
    s.commands.get("Daily Notes Popup - Toggle Focus")!();
    expect(s.focus.at(-1)).toBe("test-block");
    s.popup().querySelector<HTMLElement>(".roam-block")!.focus();
    s.commands.get("Daily Notes Popup - Toggle Focus")!();
    expect(s.focus.at(-1)).toBe("main-block");
  } finally {
    await s.cleanup();
  }
});

test("closing during native page loading cancels focus and unmounts after rendering", async () => {
  const s = setup({ delayed: true });
  try {
    s.api.component.toggleVisible();
    await expect.poll(s.renders).toBe(1);
    s.click("close");
    s.finish();
    await expect.poll(s.unmounts).toBe(1);
    expect(s.focus).toEqual([]);
  } finally {
    await s.cleanup();
  }
});

test("native rendering failure leaves close controls available", async () => {
  const s = setup({ fail: true });
  try {
    s.api.component.toggleVisible();
    await expect
      .poll(() => s.popup()?.querySelector('[role="alert"]')?.textContent)
      .toContain("could not be opened");
    s.click("close");
    await expect.poll(s.unmounts).toBe(1);
  } finally {
    await s.cleanup();
  }
});
