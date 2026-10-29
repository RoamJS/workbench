export type WidthPreset = "small" | "medium" | "large" | "full" | "custom";

export type LivePreviewSettings = {
  trigger: "hover" | "modifier";
  modifier: "Alt" | "Control" | "Meta" | "Shift";
  delay: number;
  widthPreset: WidthPreset;
  width: number | string;
  height: number | string;
};

export type Geometry = { x: number; y: number; width: number; height: number };
export type Viewport = {
  width: number;
  height: number;
  left?: number;
  top?: number;
};
export type PreviewState = {
  id: string;
  uid: string;
  title: string;
  geometry: Geometry;
  pinned: boolean;
  minimized: boolean;
  widthPreset: WidthPreset;
};

export const MIN_WIDTH = 280;
export const MIN_HEIGHT = 180;
export const HEADER_HEIGHT = 44;
export const EDGE = 8;

export const DEFAULT_SETTINGS: LivePreviewSettings = {
  trigger: "hover",
  modifier: "Alt",
  delay: 250,
  widthPreset: "medium",
  width: 480,
  height: 380,
};

export const WIDTH_PRESETS = [
  "small",
  "medium",
  "large",
  "full",
  "custom",
] as const;

const finite = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

export const isWidthPreset = (value: unknown): value is WidthPreset =>
  typeof value === "string" && WIDTH_PRESETS.some((preset) => preset === value);

export const normalizeModifier = (
  value: unknown,
): LivePreviewSettings["modifier"] | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (["alt", "opt", "option"].includes(normalized)) return "Alt";
  if (["ctrl", "control"].includes(normalized)) return "Control";
  if (["meta", "cmd", "command"].includes(normalized)) return "Meta";
  if (normalized === "shift") return "Shift";
  return undefined;
};

const LENGTH = /^(\d+(?:\.\d+)?|\.\d+)\s*(px|%|vw|vh|vmin|vmax|em|rem)?$/i;

export const normalizeDimension = ({
  value,
  fallback,
}: {
  value: unknown;
  fallback: number | string;
}): number | string => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
  if (typeof value !== "string") return fallback;
  const match = LENGTH.exec(value.trim());
  if (!match || Number(match[1]) <= 0) return fallback;
  const unit = match[2]?.toLowerCase();
  return !unit || unit === "px"
    ? Number(match[1])
    : `${Number(match[1])}${unit}`;
};

export const normalizeSettings = (value: unknown): LivePreviewSettings => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const delay =
    typeof record.delay === "number"
      ? record.delay
      : typeof record.delay === "string" && record.delay.trim()
        ? Number(record.delay)
        : NaN;
  return {
    trigger: record.trigger === "modifier" ? "modifier" : "hover",
    modifier: normalizeModifier(record.modifier) ?? DEFAULT_SETTINGS.modifier,
    delay:
      Number.isFinite(delay) && delay >= 0
        ? Math.round(delay)
        : DEFAULT_SETTINGS.delay,
    widthPreset: isWidthPreset(record.widthPreset)
      ? record.widthPreset
      : DEFAULT_SETTINGS.widthPreset,
    width: normalizeDimension({
      value: record.width,
      fallback: DEFAULT_SETTINGS.width,
    }),
    height: normalizeDimension({
      value: record.height,
      fallback: DEFAULT_SETTINGS.height,
    }),
  };
};

export const getPresetWidth = ({
  preset,
  viewportWidth,
}: {
  preset: WidthPreset;
  viewportWidth: number;
}): number => {
  const available = Math.max(1, finite(viewportWidth, 496) - EDGE * 2);
  const widths = { small: 360, medium: 480, large: 640 };
  const width =
    preset === "full"
      ? available
      : preset === "custom"
        ? DEFAULT_SETTINGS.width
        : widths[preset];
  return Math.min(Number(width), available);
};

export const resolveDimension = ({
  value,
  axis,
  viewport,
  fallback,
}: {
  value: number | string;
  axis: "width" | "height";
  viewport: Viewport;
  fallback: number;
}): number => {
  const normalized = normalizeDimension({ value, fallback });
  if (typeof normalized === "number") return normalized;
  const match = LENGTH.exec(normalized);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  const unitSize = {
    "%": viewport[axis] / 100,
    vw: viewport.width / 100,
    vh: viewport.height / 100,
    vmin: Math.min(viewport.width, viewport.height) / 100,
    vmax: Math.max(viewport.width, viewport.height) / 100,
    em: 16,
    rem: 16,
  };
  return amount * (unitSize[unit as keyof typeof unitSize] ?? 1);
};

export const clampGeometry = ({
  geometry,
  viewport,
  minimized = false,
}: {
  geometry: Geometry;
  viewport: Viewport;
  minimized?: boolean;
}): Geometry => {
  const viewportWidth = Math.max(1, finite(viewport.width, 496));
  const viewportHeight = Math.max(1, finite(viewport.height, 396));
  const left = finite(viewport.left ?? 0, 0);
  const top = finite(viewport.top ?? 0, 0);
  const insetX = Math.min(EDGE, (viewportWidth - 1) / 2);
  const insetY = Math.min(EDGE, (viewportHeight - 1) / 2);
  const availableWidth = viewportWidth - insetX * 2;
  const availableHeight = viewportHeight - insetY * 2;
  const width = Math.min(
    availableWidth,
    Math.max(MIN_WIDTH, finite(geometry.width, 480)),
  );
  const height = Math.min(
    availableHeight,
    Math.max(MIN_HEIGHT, finite(geometry.height, 380)),
  );
  const visibleHeight = minimized ? Math.min(HEADER_HEIGHT, height) : height;
  return {
    x: Math.max(
      left + insetX,
      Math.min(
        finite(geometry.x, left + insetX),
        left + viewportWidth - insetX - width,
      ),
    ),
    y: Math.max(
      top + insetY,
      Math.min(
        finite(geometry.y, top + insetY),
        top + viewportHeight - insetY - visibleHeight,
      ),
    ),
    width,
    height,
  };
};

export const getDefaultGeometry = ({
  settings,
  viewport,
  anchor,
}: {
  settings: LivePreviewSettings;
  viewport: Viewport;
  anchor?: { left: number; right: number; top: number; bottom: number };
}): Geometry => {
  const left = viewport.left ?? 0;
  const top = viewport.top ?? 0;
  const width =
    settings.widthPreset === "custom"
      ? resolveDimension({
          value: settings.width,
          axis: "width",
          viewport,
          fallback: 480,
        })
      : getPresetWidth({
          preset: settings.widthPreset,
          viewportWidth: viewport.width,
        });
  const height = resolveDimension({
    value: settings.height,
    axis: "height",
    viewport,
    fallback: 380,
  });
  let x = anchor ? anchor.right + EDGE : left + EDGE;
  let y = anchor ? anchor.top : top + EDGE;
  if (anchor && x + width > left + viewport.width - EDGE) {
    const before = anchor.left - width - EDGE;
    if (before >= left + EDGE) x = before;
    else {
      x = left + EDGE;
      y = anchor.bottom + EDGE;
    }
  }
  return clampGeometry({
    geometry: { x, y, width, height },
    viewport,
  });
};

export const getWidthPresetAfterResize = ({
  previousPreset,
  previousWidth,
  width,
}: {
  previousPreset: WidthPreset;
  previousWidth: number;
  width: number;
}): WidthPreset =>
  Math.abs(width - previousWidth) < 1 ? previousPreset : "custom";

export const getSettingsExampleGeometry = ({
  settings,
  viewport,
  controls,
}: {
  settings: LivePreviewSettings;
  viewport: Viewport;
  controls?: { left: number; right: number; top: number; bottom: number };
}): Geometry =>
  getDefaultGeometry({
    settings,
    viewport,
    anchor: controls
      ? {
          left: controls.left,
          right: controls.right + 16,
          top: controls.top,
          bottom: controls.bottom,
        }
      : undefined,
  });
