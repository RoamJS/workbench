import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import { transformSync } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { loadSettings } from "../src/features/livePreviewSettings";

test("unloading during a slow initial migration cannot restart features or create panels", async () => {
  const dom = new JSDOM("<body></body>");
  const previous = new Map(
    ["window", "document", "Event"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ])
  );
  for (const key of previous.keys())
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: dom.window[key],
    });
  dom.window.React = {};
  let afterUnload = false;
  const lateFeatures: string[] = [];
  let latePanels = 0;
  let lateStyles = 0;
  const addStyle = () => {
    if (afterUnload) lateStyles += 1;
    return dom.window.document.createElement("style");
  };
  const evaluate = (source: string, load: (id: string) => unknown) => {
    const module = { exports: {} as Record<string, unknown> };
    new Function("require", "module", "exports", source)(
      load,
      module,
      module.exports
    );
    return module.exports;
  };
  try {
    const wrapper = evaluate(
      fs.readFileSync(
        require.resolve("roamjs-components/util/runExtension"),
        "utf8"
      ),
      (id) => {
        if (id === "tslib") return require("tslib");
        if (id === "../dom/addStyle") return addStyle;
        if (id === "react-dom")
          return { unmountComponentAtNode: () => undefined };
        if (id === "./env")
          return {
            getRoamJSExtensionIdEnv: () => "workbench",
            getRoamJSVersionEnv: () => "test",
            getNodeEnv: () => "development",
          };
        if (id === "use-sync-external-store/shim")
          return { useSyncExternalStore: () => undefined };
        if (id === "./extensionApiContext")
          return { provideExtensionApi: () => undefined };
        if (id === "./apiPost") return () => Promise.resolve();
        if (id === "../components/Toast")
          return () => {
            throw new Error("Unexpected startup error");
          };
        throw new Error(`Unexpected wrapper dependency: ${id}`);
      }
    );
    const compiled = transformSync(
      fs.readFileSync(path.resolve(__dirname, "../src/index.ts"), "utf8"),
      { loader: "ts", format: "cjs" }
    ).code;
    const extension = evaluate(compiled, (id) => {
      if (id === "roamjs-components/util/runExtension") return wrapper;
      if (id === "roamjs-components/dom/addStyle") return addStyle;
      if (id === "roamjs-components/components/Toast")
        return { render: () => undefined };
      if (id === "./features/livePreviewSettings") return { loadSettings };
      if (id === "./settings") return { get: () => undefined };
      if (id === "./components/SettingsTable") return () => () => null;
      if (id.startsWith("./features/"))
        return {
          setVersion: () => undefined,
          toggleFeature: (flag: boolean) => {
            if (afterUnload && flag) lateFeatures.push(id);
          },
        };
      throw new Error(`Unexpected entry dependency: ${id}`);
    }).default as { onload: (args: unknown) => void; onunload: () => void };
    let release: (() => void) | undefined;
    const values = new Map<string, unknown>([["alert", true]]);
    extension.onload({
      extension: { version: "test" },
      extensionAPI: {
        settings: {
          get: (key: string) => values.get(key),
          set: (key: string, value: unknown) =>
            new Promise<void>((resolve) => {
              release = () => {
                values.set(key, value);
                resolve();
              };
            }),
          panel: {
            create: () => {
              if (afterUnload) latePanels += 1;
            },
          },
        },
      },
    });
    await new Promise(setImmediate);
    expect(release).toBeDefined();
    afterUnload = true;
    extension.onunload();
    release?.();
    await new Promise(setImmediate);
    await new Promise(setImmediate);
    expect(lateFeatures).toEqual([]);
    expect(latePanels).toBe(0);
    expect(lateStyles).toBe(0);
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    dom.window.close();
  }
});
