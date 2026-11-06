import { clampGeometry, Geometry, Viewport } from "./livePreviewModel";

export const readDailyNotesGeometry = ({
  stored,
  viewport,
}: {
  stored: string | null;
  viewport: Viewport;
}): Geometry => {
  const fallback = {
    width: 500,
    height: 344,
    x: (viewport.width - 500) / 2,
    y: (viewport.height - 344) / 2,
  };
  try {
    const saved: unknown = stored ? JSON.parse(stored) : null;
    if (saved && typeof saved === "object") {
      const value = saved as Record<string, unknown>;
      const dimension = (key: string, defaultValue: number): number =>
        typeof value[key] === "number" && Number.isFinite(value[key])
          ? (value[key] as number)
          : defaultValue;
      return clampGeometry({
        geometry: {
          width: dimension("width", fallback.width),
          height: dimension("height", fallback.height),
          x: dimension("left", fallback.x),
          y: dimension("top", fallback.y),
        },
        viewport,
      });
    }
  } catch {
    // Invalid legacy layout must not prevent opening today's notes.
  }
  return clampGeometry({ geometry: fallback, viewport });
};
