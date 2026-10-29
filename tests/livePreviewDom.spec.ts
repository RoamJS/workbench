import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import { buildSync } from "esbuild";
import path from "node:path";
import { DEFAULT_SETTINGS } from "../src/features/livePreviewModel";
import { SETTINGS_KEY } from "../src/features/livePreviewSettings";
import { LIVE_PREVIEW_STYLES } from "../src/components/livePreviewStyles";

test("native page event boundaries retain an unpinned preview until the pointer leaves its window", async () => {
  const dom = new JSDOM(
    '<div class="roam-app"><span class="rm-page-ref" data-tag="Example">Example</span></div>',
    { pretendToBeVisual: true }
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
    pull: () => ({ ":block/uid": "example-1", ":node/title": "Example" }),
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
        unmountNode: () => undefined,
      },
    },
  };
  const compiled = buildSync({
    entryPoints: [path.resolve(__dirname, "../src/features/livePreview.tsx")],
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
    exports: {} as { toggleFeature: (flag: boolean, api: unknown) => void },
  };
  new Function("require", "module", "exports", compiled.outputFiles[0].text)(
    require,
    module,
    module.exports
  );
  const { toggleFeature } = module.exports;
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
  } finally {
    toggleFeature(false, api as Parameters<typeof toggleFeature>[1]);
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
