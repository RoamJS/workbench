import {
  clampGeometry,
  DEFAULT_SETTINGS,
  Geometry,
  isWidthPreset,
  LivePreviewSettings,
  normalizeDimension,
  normalizeModifier,
  normalizeSettings,
  PreviewState,
  Viewport,
} from "./livePreviewModel";

export type SettingsApi = {
  get: (key: string) => unknown;
  set: (key: string, value: string) => unknown;
};

export const SETTINGS_KEY = "live-preview-settings-v1";
export const PINNED_WINDOWS_KEY = "live-preview-pinned-windows-v1";
export const LEGACY_SETTING_KEYS = {
  width: "LivePreviewWidth",
  height: "LivePreviewHeight",
  modifier: "LivePreviewModifier",
  delay: "LivePreviewDelay",
} as const;

type Listener = (settings: LivePreviewSettings) => void;
const listeners = new WeakMap<SettingsApi, Set<Listener>>();
const loading = new WeakMap<SettingsApi, Promise<LivePreviewSettings>>();
const writes = new WeakMap<SettingsApi, Promise<unknown>>();

const parseStoredValue = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const writeValue = ({
  api,
  key,
  value,
}: {
  api: SettingsApi;
  key: string;
  value: unknown;
}): Promise<unknown> => {
  const pending = (writes.get(api) ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => api.set(key, JSON.stringify(value)));
  writes.set(api, pending);
  return pending;
};

export const loadSettings = (
  api: SettingsApi,
  getLegacy?: (key: string) => unknown
): Promise<LivePreviewSettings> => {
  const existing = api.get(SETTINGS_KEY);
  if (existing !== undefined && existing !== null) {
    return Promise.resolve(normalizeSettings(parseStoredValue(existing)));
  }
  const pending = loading.get(api);
  if (pending) return pending;
  const migrate = async (): Promise<LivePreviewSettings> => {
    const width = getLegacy?.(LEGACY_SETTING_KEYS.width);
    const height = getLegacy?.(LEGACY_SETTING_KEYS.height);
    const modifier = normalizeModifier(
      getLegacy?.(LEGACY_SETTING_KEYS.modifier)
    );
    const delay = getLegacy?.(LEGACY_SETTING_KEYS.delay);
    const normalizedWidth = normalizeDimension({ value: width, fallback: NaN });
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      width: normalizedWidth,
      height,
      delay,
      trigger: modifier ? "modifier" : "hover",
      modifier,
      widthPreset:
        typeof normalizedWidth === "string" || Number.isFinite(normalizedWidth)
          ? "custom"
          : DEFAULT_SETTINGS.widthPreset,
    });
    await writeValue({ api, key: SETTINGS_KEY, value: settings });
    return settings;
  };
  const result = migrate().finally(() => loading.delete(api));
  loading.set(api, result);
  return result;
};

export const saveSettings = async (
  api: SettingsApi,
  settings: LivePreviewSettings
): Promise<LivePreviewSettings> => {
  const normalized = normalizeSettings(settings);
  await writeValue({ api, key: SETTINGS_KEY, value: normalized });
  listeners.get(api)?.forEach((listener) => listener({ ...normalized }));
  return normalized;
};

export const subscribeSettings = (
  api: SettingsApi,
  listener: Listener
): (() => void) => {
  const subscribers = listeners.get(api) ?? new Set<Listener>();
  subscribers.add(listener);
  listeners.set(api, subscribers);
  return () => {
    subscribers.delete(listener);
    if (!subscribers.size) listeners.delete(api);
  };
};

const readGeometry = (value: unknown): Geometry | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const geometry = value as Record<string, unknown>;
  if (
    !["x", "y", "width", "height"].every(
      (key) =>
        typeof geometry[key] === "number" && Number.isFinite(geometry[key])
    ) ||
    Number(geometry.width) <= 0 ||
    Number(geometry.height) <= 0
  ) {
    return undefined;
  }
  return {
    x: Number(geometry.x),
    y: Number(geometry.y),
    width: Number(geometry.width),
    height: Number(geometry.height),
  };
};

const sanitizePinnedWindows = (value: unknown): PreviewState[] => {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set<string>();
  const seenUids = new Set<string>();
  const result: PreviewState[] = [];
  value.forEach((item: unknown) => {
    if (typeof item !== "object" || item === null) return;
    const record = item as Record<string, unknown>;
    const geometry = readGeometry(record.geometry);
    if (
      record.pinned !== true ||
      typeof record.id !== "string" ||
      !record.id.trim() ||
      typeof record.uid !== "string" ||
      !record.uid.trim() ||
      !geometry ||
      seenIds.has(record.id) ||
      seenUids.has(record.uid)
    ) {
      return;
    }
    seenIds.add(record.id);
    seenUids.add(record.uid);
    result.push({
      id: record.id,
      uid: record.uid,
      title:
        typeof record.title === "string" && record.title.trim()
          ? record.title
          : record.uid,
      geometry,
      pinned: true,
      minimized: record.minimized === true,
      widthPreset: isWidthPreset(record.widthPreset)
        ? record.widthPreset
        : "custom",
    });
  });
  return result;
};

export const readPinnedWindows = (
  api: SettingsApi,
  viewport: Viewport
): PreviewState[] =>
  sanitizePinnedWindows(parseStoredValue(api.get(PINNED_WINDOWS_KEY))).map(
    (preview) => ({
      ...preview,
      geometry: clampGeometry({
        geometry: preview.geometry,
        viewport,
        minimized: preview.minimized,
      }),
    })
  );

export const savePinnedWindows = async (
  api: SettingsApi,
  windows: PreviewState[]
): Promise<void> => {
  await writeValue({
    api,
    key: PINNED_WINDOWS_KEY,
    value: sanitizePinnedWindows(windows),
  });
};
