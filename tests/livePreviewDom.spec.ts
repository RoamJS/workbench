import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import { buildSync } from "esbuild";
import path from "node:path";
import { DEFAULT_SETTINGS } from "../src/features/livePreviewModel";
import {
  PINNED_WINDOWS_KEY,
  SETTINGS_KEY,
} from "../src/features/livePreviewSettings";
import { LIVE_PREVIEW_STYLES } from "../src/components/livePreviewStyles";

test("native previews keep hover boundaries and open block references only when enabled", async () => {
  const dom = new JSDOM(
    '<div class="roam-app"><aside class="roam-sidebar-container"></aside><main class="roam-main"><span class="rm-page-ref" data-tag="Example">Example</span><span class="rm-block-ref" data-uid="target-01"><strong>Referenced block</strong></span></main><aside id="right-sidebar"></aside></div>',
    { pretendToBeVisual: true }
  );
  const workspace = dom.window.document.querySelector(".roam-main")!;
  workspace.getBoundingClientRect = () => ({
    left: 232,
    top: 40,
    right: 700,
    bottom: 768,
    width: 468,
    height: 728,
    x: 232,
    y: 40,
    toJSON: () => ({}),
  });
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
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ];
  const previous = new Map(
    globals.map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ])
  );
  for (const key of globals)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: dom.window[key],
    });
  const values = new Map([
    [SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, delay: 0 })],
  ]);
  const api = {
    settings: {
      get: (key: string) => values.get(key),
      set: (key: string, value: string) => values.set(key, value),
    },
  };
  dom.window.roamAlphaAPI = {
    pull: (pattern: string, ref: string[]) =>
      pattern.includes(":block/string")
        ? ref[1] === "target-01"
          ? { ":block/string": "Referenced block" }
          : null
        : { ":block/uid": "example-1", ":node/title": "Example" },
    ui: {
      components: {
        renderPage: ({ el }: { el: HTMLElement }) => {
          const body = dom.window.document.createElement("div");
          body.className = "native-page-body";
          // Embedded Roam React roots can consume events before the outer React root sees them.
          body.addEventListener("pointerover", (event) =>
            event.stopPropagation()
          );
          body.addEventListener("pointerout", (event) =>
            event.stopPropagation()
          );
          el.appendChild(body);
        },
        renderBlock: ({
          el,
          uid,
          "open?": open,
        }: {
          el: HTMLElement;
          uid: string;
          "open?"?: boolean;
        }) => {
          if (open) el.dataset.renderedBlock = uid;
        },
        unmountNode: () => undefined,
      },
    },
  };
  const compiled = buildSync({
    stdin: {
      contents: `
        export * from "./livePreview";
        export { saveSettings } from "./livePreviewSettings";
      `,
      resolveDir: path.resolve(__dirname, "../src/features"),
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    external: [
      "react",
      "react-dom",
      "@blueprintjs/core",
      "roamjs-components/*",
    ],
  });
  const module = {
    exports: {} as {
      toggleFeature: (flag: boolean, api: unknown) => void;
      getPreviewViewport: () => { width: number; height: number };
      saveSettings: (
        api: typeof api.settings,
        settings: typeof DEFAULT_SETTINGS
      ) => Promise<unknown>;
    },
  };
  new Function("require", "module", "exports", compiled.outputFiles[0].text)(
    require,
    module,
    module.exports
  );
  const { toggleFeature, getPreviewViewport, saveSettings } = module.exports;
  const pointer = (
    target: Element,
    type: string,
    relatedTarget: EventTarget | null
  ): void => {
    target.dispatchEvent(
      new dom.window.MouseEvent(type, { bubbles: true, relatedTarget })
    );
  };
  try {
    expect(getPreviewViewport()).toEqual({
      width: dom.window.innerWidth,
      height: dom.window.innerHeight,
    });
    toggleFeature(true, api as Parameters<typeof toggleFeature>[1]);
    await expect
      .poll(
        () =>
          dom.window.document.querySelectorAll(
            "#workbench-live-preview-windows"
          ).length
      )
      .toBe(1);
    const source = dom.window.document.querySelector(".rm-page-ref")!;
    pointer(source, "pointerover", dom.window.document.body);
    await expect
      .poll(
        () => dom.window.document.querySelectorAll(".native-page-body").length
      )
      .toBe(1);
    const body = dom.window.document.querySelector(".native-page-body")!;
    pointer(source, "pointerout", body);
    pointer(body, "pointerover", source);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(
      dom.window.document.querySelector('[data-pinned="false"]')
    ).not.toBeNull();
    const header = dom.window.document.querySelector(
      ".roamjs-workbench-live-preview-header"
    )!;
    pointer(body, "pointerout", header);
    pointer(header, "pointerover", body);
    pointer(header, "pointerout", body);
    pointer(body, "pointerover", header);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(
      dom.window.document.querySelector('[data-pinned="false"]')
    ).not.toBeNull();
    pointer(body, "pointerout", dom.window.document.body);
    pointer(dom.window.document.body, "pointerover", body);
    await expect
      .poll(
        () => dom.window.document.querySelectorAll("[data-preview-id]").length
      )
      .toBe(0);
    const block = dom.window.document.querySelector(".rm-block-ref strong")!;
    const renderedBlock = () =>
      dom.window.document.querySelector('[data-rendered-block="target-01"]');
    pointer(block, "pointerover", dom.window.document.body);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(renderedBlock()).toBeNull();

    await saveSettings(api.settings, {
      ...DEFAULT_SETTINGS,
      delay: 0,
      includeBlockReferences: true,
    });
    pointer(block, "pointerover", dom.window.document.body);
    await expect.poll(() => Boolean(renderedBlock())).toBe(true);
    dom.window.document
      .querySelector<HTMLButtonElement>('button[aria-label="Pin preview"]')!
      .click();
    await expect
      .poll(() => JSON.parse(values.get(PINNED_WINDOWS_KEY) ?? "[]"))
      .toMatchObject([{ uid: "target-01", kind: "block", pinned: true }]);
    toggleFeature(false, api);
    toggleFeature(true, api);
    await expect.poll(() => Boolean(renderedBlock())).toBe(true);
    expect(renderedBlock()?.closest('[data-pinned="true"]')).not.toBeNull();
  } finally {
    const { act } = require("react-dom/test-utils") as typeof import("react-dom/test-utils");
    act(() => toggleFeature(false, api));
    for (const key of globals) {
      const descriptor = previous.get(key);
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    dom.window.close();
  }
});

test("preview chrome preserves native bullet sizing and aligns person-page icons", () => {
  const dom = new JSDOM(`<style>
    .rm-bullet__inner { box-sizing: content-box; width: 5px; height: 5px; border: 4px solid transparent; }
    .rm-title-icon { margin-top: 30px; }
    ${LIVE_PREVIEW_STYLES}
  </style><section class="roamjs-workbench-live-preview-window"><div class="workbench-live-preview-page"><div class="rm-title-display-container"><span class="rm-title-icon"></span></div><span class="rm-bullet__inner"></span></div></section>`);
  expect(
    dom.window.getComputedStyle(
      dom.window.document.querySelector(".rm-bullet__inner")!
    ).boxSizing
  ).toBe("content-box");
  expect(
    dom.window.getComputedStyle(
      dom.window.document.querySelector(".rm-title-icon")!
    ).marginTop
  ).toBe("4px");
  dom.window.close();
});

test("preview layer sits above both sidebars without intercepting the surrounding page", () => {
  const dom = new JSDOM(`<style>${LIVE_PREVIEW_STYLES}</style>
    <div class="roamjs-workbench-live-preview-layer"><section class="roamjs-workbench-live-preview-window"></section></div>`);
  const layer = dom.window.getComputedStyle(
    dom.window.document.querySelector(".roamjs-workbench-live-preview-layer")!
  );
  expect(Number(layer.zIndex)).toBeGreaterThan(999);
  expect(layer.position).toBe("fixed");
  expect(layer.pointerEvents).toBe("none");
  expect(
    dom.window.getComputedStyle(
      dom.window.document.querySelector(
        ".roamjs-workbench-live-preview-window"
      )!
    ).pointerEvents
  ).toBe("auto");
  dom.window.close();
});
