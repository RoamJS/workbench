import { expect, test } from "@playwright/test";
import {
  clampGeometry,
  DEFAULT_SETTINGS,
  getDefaultGeometry,
  getSettingsExampleGeometry,
  getWidthPresetAfterResize,
  normalizeSettings,
  PreviewState,
} from "../src/features/livePreviewModel";
import {
  LEGACY_SETTING_KEYS,
  loadSettings,
  PINNED_WINDOWS_KEY,
  readPinnedWindows,
  savePinnedWindows,
  saveSettings,
  SETTINGS_KEY,
  SettingsApi,
  subscribeSettings,
} from "../src/features/livePreviewSettings";

const createApi = (initial: Record<string, unknown> = {}) => {
  const values = new Map<string, unknown>(Object.entries(initial));
  const calls: { key: string; value: string }[] = [];
  const api: SettingsApi = {
    get: (key) => values.get(key),
    set: async (key, value) => {
      calls.push({ key, value });
      values.set(key, value);
    },
  };
  return { api, calls, values };
};

const pinned: PreviewState = {
  id: "preview-1",
  uid: "page-uid1",
  title: "Evergreen notes",
  geometry: { x: 90, y: 120, width: 480, height: 380 },
  pinned: true,
  minimized: false,
  widthPreset: "medium",
};

test("migrates legacy dimensions, modifier aliases, and a zero delay once", async () => {
  const { api, calls } = createApi();
  const reads: string[] = [];
  const legacy: Record<string, unknown> = {
    [LEGACY_SETTING_KEYS.width]: "600px",
    [LEGACY_SETTING_KEYS.height]: "50vh",
    [LEGACY_SETTING_KEYS.modifier]: " COMMAND ",
    [LEGACY_SETTING_KEYS.delay]: "0",
  };
  const getLegacy = (key: string): unknown => {
    reads.push(key);
    return legacy[key];
  };
  const settings = await loadSettings(api, getLegacy);
  expect(settings).toEqual({
    trigger: "modifier",
    modifier: "Meta",
    delay: 0,
    widthPreset: "custom",
    width: 600,
    height: "50vh",
  });
  expect(await loadSettings(api, getLegacy)).toEqual(settings);
  expect(reads).toHaveLength(4);
  expect(calls.map((call) => call.key)).toEqual([SETTINGS_KEY]);
});

test("concurrent initial loads share one migration", async () => {
  const { api, calls } = createApi();
  const results = await Promise.all([loadSettings(api), loadSettings(api)]);
  expect(results).toEqual([DEFAULT_SETTINGS, DEFAULT_SETTINGS]);
  expect(calls).toHaveLength(1);
});

test("existing extension settings take precedence over legacy graph settings", async () => {
  const saved = {
    ...DEFAULT_SETTINGS,
    delay: 0,
    width: 720,
    widthPreset: "custom",
  };
  const { api, calls } = createApi({ [SETTINGS_KEY]: JSON.stringify(saved) });
  const settings = await loadSettings(api, () => {
    throw new Error("Existing settings must not read the graph again");
  });
  expect(settings).toEqual(saved);
  expect(calls).toEqual([]);
});

for (const [alias, expected] of [
  ["shift", "Shift"],
  ["ctrl", "Control"],
  ["control", "Control"],
  ["cmd", "Meta"],
  ["command", "Meta"],
  ["meta", "Meta"],
  ["opt", "Alt"],
  ["option", "Alt"],
  ["alt", "Alt"],
]) {
  test(`preserves the ${alias} legacy modifier`, async () => {
    const { api } = createApi();
    const settings = await loadSettings(api, (key) =>
      key === LEGACY_SETTING_KEYS.modifier ? alias : undefined,
    );
    expect(settings.trigger).toBe("modifier");
    expect(settings.modifier).toBe(expected);
  });
}

test("invalid dimensions and delay fall back without accepting CSS injection", () => {
  expect(
    normalizeSettings({
      width: "url(https://example.com)",
      height: "10px; position:fixed",
      delay: -1,
      modifier: "unsupported",
    }),
  ).toEqual(DEFAULT_SETTINGS);
});

test("custom viewport dimensions remain relative and previews fit beside a link", () => {
  expect(
    getDefaultGeometry({
      settings: {
        ...DEFAULT_SETTINGS,
        widthPreset: "custom",
        width: "50vw",
        height: "50vh",
      },
      viewport: { width: 1000, height: 800, left: 100, top: 50 },
      anchor: { left: 850, right: 900, top: 100, bottom: 120 },
    }),
  ).toEqual({ x: 342, y: 100, width: 500, height: 400 });
});

test("Full fills available workspace width while retaining chosen height", () => {
  expect(
    getDefaultGeometry({
      settings: { ...DEFAULT_SETTINGS, widthPreset: "full", height: 300 },
      viewport: { width: 900, height: 700, left: 160, top: 40 },
    }),
  ).toEqual({ x: 168, y: 48, width: 884, height: 300 });
});

test("clamps restored geometry to a smaller viewport without hiding the header", () => {
  const geometry = { x: 2000, y: 1500, width: 1200, height: 1000 };
  expect(
    clampGeometry({ geometry, viewport: { width: 320, height: 500 } }),
  ).toEqual({
    x: 8,
    y: 8,
    width: 304,
    height: 484,
  });
  expect(
    clampGeometry({
      geometry,
      viewport: { width: 320, height: 500 },
      minimized: true,
    }),
  ).toEqual({ x: 8, y: 448, width: 304, height: 484 });
});

test("vertical-only resize preserves a width preset", () => {
  expect(
    getWidthPresetAfterResize({
      previousPreset: "large",
      previousWidth: 640,
      width: 640,
    }),
  ).toBe("large");
  expect(
    getWidthPresetAfterResize({
      previousPreset: "large",
      previousWidth: 640,
      width: 641,
    }),
  ).toBe("custom");
});

test("minimizing, saving, and restoring retain the expanded window height", async () => {
  const { api } = createApi();
  const viewport = { width: 1000, height: 800 };
  const original = { x: 80, y: 160, width: 480, height: 420 };
  const minimizedGeometry = clampGeometry({
    geometry: original,
    viewport,
    minimized: true,
  });
  expect(minimizedGeometry).toEqual(original);
  await savePinnedWindows(api, [
    { ...pinned, geometry: minimizedGeometry, minimized: true },
  ]);
  const [restored] = readPinnedWindows(api, viewport);
  expect(restored.minimized).toBe(true);
  expect(
    clampGeometry({
      geometry: restored.geometry,
      viewport,
      minimized: false,
    }),
  ).toEqual(original);
});

test("pinned storage excludes transient, malformed, and duplicate windows", async () => {
  const { api, values } = createApi({
    [PINNED_WINDOWS_KEY]: JSON.stringify([
      { ...pinned, geometry: { x: 2000, y: 1200, width: 1500, height: 900 } },
      { ...pinned, id: "duplicate-page" },
      { ...pinned, uid: "duplicate-id" },
      { ...pinned, id: "transient", uid: "transient", pinned: false },
      { ...pinned, id: "bad", uid: "bad", geometry: { x: 10 } },
      null,
    ]),
  });
  const restored = readPinnedWindows(api, { width: 800, height: 600 });
  expect(restored).toHaveLength(1);
  expect(restored[0].geometry).toEqual({ x: 8, y: 8, width: 784, height: 584 });
  await savePinnedWindows(api, [
    pinned,
    { ...pinned, id: "hover", uid: "hover", pinned: false },
  ]);
  expect(JSON.parse(String(values.get(PINNED_WINDOWS_KEY)))).toEqual([pinned]);
});

test("reading settings or saved windows never clears persisted pins", async () => {
  const { api, calls } = createApi({
    [PINNED_WINDOWS_KEY]: JSON.stringify([pinned]),
  });
  await loadSettings(api);
  expect(readPinnedWindows(api, { width: 1000, height: 800 })).toEqual([
    pinned,
  ]);
  expect(calls.every((call) => call.key !== PINNED_WINDOWS_KEY)).toBe(true);
});

test("settings subscribers are scoped and unsubscribe without affecting storage", async () => {
  const first = createApi();
  const second = createApi();
  const observed: number[] = [];
  const unsubscribe = subscribeSettings(first.api, (settings) =>
    observed.push(settings.delay),
  );
  await saveSettings(second.api, { ...DEFAULT_SETTINGS, delay: 100 });
  await saveSettings(first.api, { ...DEFAULT_SETTINGS, delay: 0 });
  unsubscribe();
  await saveSettings(first.api, { ...DEFAULT_SETTINGS, delay: 500 });
  expect(observed).toEqual([0]);
  expect((await loadSettings(first.api)).delay).toBe(500);
});

test("queued pin updates cannot be overwritten by a slower earlier save", async () => {
  const values = new Map<string, string>();
  let finishFirst: (() => void) | undefined;
  let count = 0;
  const api: SettingsApi = {
    get: (key) => values.get(key),
    set: async (key, value) => {
      if (++count === 1)
        await new Promise<void>((resolve) => {
          finishFirst = resolve;
        });
      values.set(key, value);
    },
  };
  const first = savePinnedWindows(api, [pinned]);
  const second = savePinnedWindows(api, []);
  await Promise.resolve();
  await Promise.resolve();
  expect(finishFirst).toBeDefined();
  finishFirst?.();
  await Promise.all([first, second]);
  expect(readPinnedWindows(api, { width: 1000, height: 800 })).toEqual([]);
});

test("settings sample opens beside controls using the whole viewport", () => {
  const geometry = getSettingsExampleGeometry({
    settings: DEFAULT_SETTINGS,
    viewport: { width: 1436, height: 1108 },
    controls: { left: 24, right: 384, top: 24, bottom: 900 },
  });
  expect(geometry).toEqual({ x: 408, y: 24, width: 480, height: 380 });
});

test("Full example uses viewport width and does not reduce the requested height to a nested stage", () => {
  expect(
    getSettingsExampleGeometry({
      settings: { ...DEFAULT_SETTINGS, widthPreset: "full", height: 700 },
      viewport: { width: 1436, height: 1108 },
      controls: { left: 24, right: 384, top: 24, bottom: 900 },
    }),
  ).toMatchObject({ x: 8, width: 1420, height: 700 });
});

test("narrow example opens below collapsed controls and stays in the viewport", () => {
  expect(
    getSettingsExampleGeometry({
      settings: { ...DEFAULT_SETTINGS, widthPreset: "small" },
      viewport: { width: 390, height: 667 },
      controls: { left: 16, right: 374, top: 16, bottom: 76 },
    }),
  ).toEqual({ x: 8, y: 84, width: 360, height: 380 });
});

test("settings sample reads inherited rectangle coordinates returned by the browser", () => {
  const controls = Object.create(
    Object.defineProperties(
      {},
      {
        left: { get: () => 16 },
        right: { get: () => 374 },
        top: { get: () => 16 },
        bottom: { get: () => 76 },
      },
    ),
  ) as { left: number; right: number; top: number; bottom: number };
  expect(Object.keys(controls)).toEqual([]);
  expect(
    getSettingsExampleGeometry({
      settings: { ...DEFAULT_SETTINGS, widthPreset: "small" },
      viewport: { width: 390, height: 667 },
      controls,
    }),
  ).toEqual({ x: 8, y: 84, width: 360, height: 380 });
});
