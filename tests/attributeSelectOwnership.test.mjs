import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { transformSync } from "esbuild";
import { JSDOM } from "jsdom";

const featureCode = transformSync(
  fs.readFileSync(
    new URL("../src/features/attributeSelect.tsx", import.meta.url),
    "utf8",
  ) + "\nexport { AttributeButton, AttributeConfigPanel };",
  { loader: "tsx", format: "cjs" },
).code;
const brokerCode = transformSync(
  fs.readFileSync(
    new URL("../src/shared/featureOwnership.ts", import.meta.url),
    "utf8",
  ),
  { loader: "ts", format: "cjs" },
).code;
const flush = () => new Promise((resolve) => setImmediate(resolve));

const setup = ({ missingPage = false } = {}) => {
  const dom = new JSDOM(
    '<main><section><div><h1>roam/js/attribute-select</h1></div></section><div class="roam-block"><span class="rm-attr-ref" data-link-uid="status-page"></span></div></main>',
  );
  const { document } = dom.window;
  document.querySelector("h1").innerText = "roam/js/attribute-select";
  const observers = [];
  const rendered = [];
  const unmounted = [];
  const hookCleanups = [];
  const hookUpdates = [];
  const hookStateValues = [];
  const timers = new Map();
  const existingWorkbench = { otherFeature: true };
  dom.window.roamjs = { extension: { workbench: existingWorkbench } };
  dom.window.roamAlphaAPI = {
    data: {
      fast: { q: () => [["attributes"]] },
      block: { update() {} },
      backend: { q: async () => [] },
    },
  };
  let pageExists = !missingPage;
  let finishCreation;
  let created = 0;
  const loadBroker = () => {
    const module = { exports: {} };
    vm.runInNewContext(brokerCode, {
      module,
      exports: module.exports,
      window: dom.window,
      AbortController,
      console,
    });
    return module.exports;
  };
  const localBroker = loadBroker();
  const mocks = {
    react: {
      createElement: (type, props, ...children) => ({
        type,
        props: { ...props, children },
      }),
      useRef: (current) => ({ current }),
      useState: (initial) => [
        hookStateValues.length
          ? hookStateValues.shift()
          : typeof initial === "function"
            ? initial()
            : initial,
        (value) => hookUpdates.push(value),
      ],
      useMemo: (callback) => callback(),
      useEffect: (callback) => {
        const cleanup = callback();
        if (cleanup) hookCleanups.push(cleanup);
      },
    },
    "react-dom": {
      render: (element, root) => rendered.push({ element, root }),
      unmountComponentAtNode: (root) => unmounted.push(root),
    },
    "@blueprintjs/core": { Classes: { DIALOG_BODY: "bp3-dialog-body" } },
    "@blueprintjs/select": {},
    "../shared/featureOwnership": localBroker,
    "roamjs-components/dom/createHTMLObserver": (options) => {
      const selector = options.tag === "H1" ? "h1" : ".rm-attr-ref";
      document.querySelectorAll(selector).forEach(options.callback);
      const observer = {
        ...options,
        disconnected: false,
        disconnect() {
          this.disconnected = true;
        },
      };
      observers.push(observer);
      return observer;
    },
    "roamjs-components/util/getSubTree": ({ key }) => ({
      uid: key,
      children: key === "options" ? [{ text: "<%TODAY%>" }] : [],
    }),
    "roamjs-components/util/getSettingValueFromTree": () => "text",
    "roamjs-components/queries/getTextByBlockUid": () => "Status:: Backlog",
    "roamjs-components/queries/getPageTitleByPageUid": () => "Status",
    "roamjs-components/dom/getBlockUidFromTarget": () => "testblock",
    "roamjs-components/queries/getBasicTreeByParentUid": () => [
      { text: "Status", uid: "status-config", children: [] },
    ],
    "roamjs-components/queries/getPageUidByPageTitle": () =>
      pageExists ? "configuid" : "",
    "roamjs-components/writes/createPage": () => {
      created += 1;
      return new Promise((resolve) => {
        finishCreation = () => {
          pageExists = true;
          resolve("configuid");
        };
      });
    },
    "roamjs-components/dom/addStyle": (text) => {
      const style = document.createElement("style");
      style.textContent = text;
      document.head.appendChild(style);
      return style;
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(featureCode, {
    module,
    exports: module.exports,
    document,
    window: dom.window,
    console,
    setTimeout: (callback) => {
      timers.set(1, callback);
      return 1;
    },
    clearTimeout: (id) => timers.delete(id),
    require: (name) => mocks[name] ?? (() => {}),
  });
  let standaloneStarts = 0;
  let standaloneStops = 0;
  const standalone = () =>
    loadBroker().registerFeatureProvider({
      feature: "attribute-select",
      id: "roamjs.attribute-select",
      priority: 100,
      start() {
        assert.equal(
          document.querySelectorAll(
            "#attribute-select-config, style, [data-roamjs-attribute-select]",
          ).length,
          0,
          "previous owner's resources must be removed before takeover",
        );
        standaloneStarts += 1;
        const marker = document.createElement("aside");
        marker.id = "standalone-owner";
        document.body.appendChild(marker);
      },
      stop() {
        standaloneStops += 1;
        document.getElementById("standalone-owner")?.remove();
      },
    });
  return {
    api: module.exports,
    window: dom.window,
    document,
    observers,
    rendered,
    unmounted,
    existingWorkbench,
    hookCleanups,
    hookUpdates,
    hookStateValues,
    timers,
    standalone,
    created: () => created,
    finishCreation: () => finishCreation(),
    standaloneStarts: () => standaloneStarts,
    standaloneStops: () => standaloneStops,
    close: () => dom.window.close(),
  };
};

const assertWorkbench = (s) => {
  assert.equal(
    s.document.querySelectorAll("#attribute-select-config").length,
    1,
  );
  assert.equal(s.document.querySelectorAll("style").length, 1);
  assert.equal(s.document.querySelector(".rm-attr-ref").children.length, 1);
  assert.equal(typeof s.existingWorkbench.refreshAttributeSelect, "function");
};
const assertStopped = (s) => {
  assert.equal(
    s.document.querySelectorAll(
      "#attribute-select-config, style, [data-roamjs-configuid], [data-roamjs-attribute-select]",
    ).length,
    0,
  );
  assert.equal(s.existingWorkbench.refreshAttributeSelect, undefined);
};

test("separately bundled registries hand ownership to standalone and restore WorkBench without changing its enabled setting", async () => {
  const s = setup();
  try {
    await s.api.toggleFeature(true);
    assertWorkbench(s);
    const standalone = s.standalone();
    await standalone.ready;
    assertStopped(s);
    assert.ok(s.observers.every((observer) => observer.disconnected));
    assert.equal(s.window.roamjs.extension.workbench, s.existingWorkbench);
    assert.equal(s.existingWorkbench.otherFeature, true);
    await standalone.release();
    assertWorkbench(s);
    assert.equal(s.created(), 0);
    assert.equal(s.standaloneStarts(), 1);
    await s.api.toggleFeature(false);
    assertStopped(s);
    assert.ok(s.unmounted.length >= 4);
  } finally {
    s.close();
  }
});

test("standalone loads first; WorkBench stays suspended and disabling it prevents automatic resumption", async () => {
  const s = setup();
  try {
    const standalone = s.standalone();
    await standalone.ready;
    await s.api.toggleFeature(true);
    await s.api.toggleFeature(true);
    assertStopped(s);
    assert.equal(s.observers.length, 0);
    await s.api.toggleFeature(false);
    await standalone.release();
    assertStopped(s);
    assert.equal(s.observers.length, 0);
    await s.api.toggleFeature(true);
    assertWorkbench(s);
    await s.api.toggleFeature(false);
  } finally {
    s.close();
  }
});

test("unloading during initial page creation cannot mount a late WorkBench runtime", async () => {
  const s = setup({ missingPage: true });
  try {
    const loading = s.api.toggleFeature(true);
    await flush();
    assert.equal(s.created(), 1);
    const unloading = s.api.toggleFeature(false);
    s.finishCreation();
    await Promise.all([loading, unloading]);
    assertStopped(s);
    assert.equal(s.observers.length, 0);
  } finally {
    s.close();
  }
});

test("takeover waits for pending startup to settle while cancelling its ability to mount", async () => {
  const s = setup({ missingPage: true });
  try {
    const loading = s.api.toggleFeature(true);
    await flush();
    const standalone = s.standalone();
    await flush();
    assert.equal(s.standaloneStarts(), 0);
    s.finishCreation();
    await Promise.all([loading, standalone.ready]);
    assertStopped(s);
    assert.equal(s.standaloneStarts(), 1);
    assert.equal(s.observers.length, 0);
    await standalone.release();
    assertWorkbench(s);
    await s.api.toggleFeature(false);
  } finally {
    s.close();
  }
});

test("old observer, configuration and refresh callbacks cannot reactivate a suspended or resumed generation", async () => {
  const s = setup();
  try {
    await s.api.toggleFeature(true);
    const config = s.rendered.find(
      ({ element }) => element.props?.onAdd,
    ).element;
    const refresh = s.existingWorkbench.refreshAttributeSelect;
    const oldObservers = [...s.observers];
    const staleCallbacks = () => {
      config.props.onAdd("Status");
      config.props.onRemove("Status");
      refresh();
      oldObservers.forEach((observer) =>
        observer.callback(
          s.document.querySelector(
            observer.tag === "H1" ? "h1" : ".rm-attr-ref",
          ),
        ),
      );
    };
    const standalone = s.standalone();
    await standalone.ready;
    const observerCount = s.observers.length;
    await Promise.resolve().then(staleCallbacks);
    assert.equal(s.observers.length, observerCount);
    assertStopped(s);
    assert.ok(s.document.getElementById("standalone-owner"));
    await standalone.release();
    const resumedCount = s.observers.length;
    staleCallbacks();
    assert.equal(s.observers.length, resumedCount);
    assertWorkbench(s);
    await s.api.toggleFeature(false);
  } finally {
    s.close();
  }
});

test("removing Roam containers unmounts owned roots and clears their owner markers", async () => {
  const s = setup();
  try {
    await s.api.toggleFeature(true);
    const section = s.document.querySelector("section");
    const attribute = s.document.querySelector(".rm-attr-ref");
    section.remove();
    attribute.remove();
    s.observers.forEach((observer) => observer.removeCallback());
    assert.equal(attribute.children.length, 0);
    assert.equal(attribute.hasAttribute("data-roamjs-attribute-select"), false);
    assert.equal(section.hasAttribute("data-roamjs-configuid"), false);
    assert.equal(section.querySelector("#attribute-select-config"), null);
    assert.equal(s.unmounted.length, 2);
    await s.api.toggleFeature(false);
  } finally {
    s.close();
  }
});

const findElement = (element, predicate) => {
  if (!element || typeof element !== "object") return;
  if (predicate(element)) return element;
  for (const child of element.props?.children?.flat(Infinity) || []) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
};

test("an attribute-discovery result after suspension cannot update state or open another owner's picker", async () => {
  const s = setup();
  try {
    await s.api.toggleFeature(true);
    let resolveQuery;
    s.window.roamAlphaAPI.data.backend.q = () =>
      new Promise((resolve) => {
        resolveQuery = resolve;
      });
    let opened = 0;
    const picker = s.document.createElement("div");
    picker.className = "attribute-select-autocomplete-select";
    const button = s.document.createElement("button");
    button.addEventListener("click", () => {
      opened += 1;
    });
    picker.appendChild(button);
    s.document.body.appendChild(picker);
    const tree = s.api.AttributeConfigPanel({ onAdd() {}, onRemove() {} });
    findElement(
      tree,
      (element) => element.props?.text === "Add Attribute",
    ).props.onClick();
    const pending = s.timers.get(1)();
    const initialUpdates = s.hookUpdates.length;
    await s.api.toggleFeature(false);
    s.hookCleanups.forEach((cleanup) => cleanup());
    resolveQuery([[{ ":node/title": "New attribute" }]]);
    await pending;
    assert.equal(s.hookUpdates.length, initialUpdates);
    assert.equal(opened, 0);
    assert.equal(s.timers.size, 0);
  } finally {
    s.close();
  }
});

test("a delayed SmartBlocks result cannot update an unmounted or suspended attribute button", async () => {
  const s = setup();
  try {
    await s.api.toggleFeature(true);
    let resolveSmartBlocks;
    s.window.roamjs.extension.smartblocks = {
      triggerSmartblock: () =>
        new Promise((resolve) => {
          resolveSmartBlocks = resolve;
        }),
    };
    s.hookStateValues.push(true, [], "");
    s.api.AttributeButton({ attributeName: "Status", uid: "status-block" });
    const initialUpdates = s.hookUpdates.length;
    await s.api.toggleFeature(false);
    s.hookCleanups.forEach((cleanup) => cleanup());
    resolveSmartBlocks([{ text: "Late option" }]);
    await flush();
    assert.equal(s.hookUpdates.length, initialUpdates);
    assertStopped(s);
  } finally {
    s.close();
  }
});
