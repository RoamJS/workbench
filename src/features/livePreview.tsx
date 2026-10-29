import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { OnloadArgs } from "roamjs-components/types";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import LivePreviewWindow from "../components/LivePreviewWindow";
import { get } from "../settings";
import {
  clampGeometry,
  getDefaultGeometry,
  LivePreviewSettings,
  PreviewState,
  Viewport,
} from "./livePreviewModel";
import {
  loadSettings,
  readPinnedWindows,
  savePinnedWindows,
  subscribeSettings,
} from "./livePreviewSettings";

const NativePage = ({ uid }: { uid: string }): JSX.Element => {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    // Roam owns this nested React root, including its editable block state.
    const rendered = window.roamAlphaAPI.ui.components.renderPage({ uid, el });
    Promise.resolve(rendered).catch(() => {
      if (!disposed) setFailed(true);
    });
    return () => {
      disposed = true;
      void Promise.resolve(rendered)
        .then(
          () => window.roamAlphaAPI.ui.components.unmountNode({ el }),
          () => window.roamAlphaAPI.ui.components.unmountNode({ el })
        )
        .catch((error: unknown) =>
          console.error("WorkBench could not unmount a preview", error)
        );
    };
  }, [uid]);
  return (
    <>
      {failed && (
        <p role="alert">
          This page could not be opened. Close the preview and try again.
        </p>
      )}
      <div ref={host} className="workbench-live-preview-page" />
    </>
  );
};

export const getPreviewViewport = (): Viewport => {
  const workspace = document
    .querySelector(".roam-main")
    ?.getBoundingClientRect();
  return workspace && workspace.width >= 280
    ? {
        left: Math.max(0, workspace.left),
        top: Math.max(0, workspace.top),
        width:
          Math.min(window.innerWidth, workspace.right) -
          Math.max(0, workspace.left),
        height: window.innerHeight - Math.max(0, workspace.top),
      }
    : { width: window.innerWidth, height: window.innerHeight };
};

const modifierHeld = (
  event: MouseEvent | KeyboardEvent,
  settings: LivePreviewSettings
): boolean =>
  settings.trigger === "hover" ||
  {
    Alt: event.altKey,
    Control: event.ctrlKey,
    Meta: event.metaKey,
    Shift: event.shiftKey,
  }[settings.modifier];

const getLink = (target: EventTarget | null): HTMLElement | null =>
  target instanceof Element
    ? target.closest<HTMLElement>(".rm-page-ref")
    : null;

const getLinkTitle = (link: HTMLElement): string =>
  link.getAttribute("data-tag") ||
  link.closest("[data-link-title]")?.getAttribute("data-link-title") ||
  link.getAttribute("data-link-title") ||
  "";

const mountPreviews = ({
  extensionAPI,
  initialSettings,
}: {
  extensionAPI: OnloadArgs["extensionAPI"];
  initialSettings: LivePreviewSettings;
}): (() => void) => {
  const mount = document.createElement("div");
  mount.id = "workbench-live-preview-windows";
  // Share Roam's stacking context so its menus and lifted dialogs stay above previews.
  (document.querySelector(".roam-app") ?? document.body).appendChild(mount);
  const api = extensionAPI.settings;
  let settings = initialSettings;
  let windows = readPinnedWindows(api, getPreviewViewport()).flatMap(
    (preview) => {
      const title = getPageTitleByPageUid(preview.uid);
      return title ? [{ ...preview, title }] : [];
    }
  );
  let stackingOrder = windows.map(({ id }) => id);
  let source: HTMLElement | null = null;
  let openTimer = 0;
  let closeTimer = 0;
  let saveTimer = 0;
  let disposed = false;
  let interacting = false;
  const hovered = new Set<string>();

  const persist = (): void => {
    window.clearTimeout(saveTimer);
    void savePinnedWindows(api, windows).catch((error: unknown) => {
      console.error("WorkBench could not save pinned previews", error);
    });
  };
  const scheduleSave = (): void => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persist, 200);
  };
  const clearClose = (): void => window.clearTimeout(closeTimer);
  const focused = (): boolean => {
    const focusedId = document.activeElement
      ?.closest("[data-preview-id]")
      ?.getAttribute("data-preview-id");
    return windows.some(
      (preview) => !preview.pinned && preview.id === focusedId
    );
  };
  const closeTransient = (): void => {
    clearClose();
    closeTimer = window.setTimeout(() => {
      if (disposed || interacting || focused() || hovered.size) return;
      windows = windows.filter((preview) => preview.pinned);
      render();
    }, Math.max(250, settings.delay));
  };
  const update = (id: string, patch: Partial<PreviewState>): void => {
    const previous = windows.find((preview) => preview.id === id);
    const persistenceChanged =
      (patch.pinned !== undefined && patch.pinned !== previous?.pinned) ||
      (patch.minimized !== undefined &&
        patch.minimized !== previous?.minimized);
    windows = windows.map((preview) =>
      preview.id === id ? { ...preview, ...patch } : preview
    );
    render();
    if (persistenceChanged) persist();
    else scheduleSave();
  };
  const close = (id: string): void => {
    windows = windows.filter((preview) => preview.id !== id);
    hovered.delete(id);
    render();
    persist();
  };
  const activate = (id: string): void => {
    if (
      !windows.some((preview) => preview.id === id) ||
      stackingOrder[stackingOrder.length - 1] === id
    )
      return;
    // Moving a DOM node during pointerdown can cancel the button's ensuing click.
    stackingOrder = [
      ...stackingOrder.filter((candidate) => candidate !== id),
      id,
    ];
    render();
  };
  const render = (): void => {
    if (disposed) return;
    hovered.forEach((id) => {
      if (!windows.some((preview) => preview.id === id)) hovered.delete(id);
    });
    stackingOrder = stackingOrder.filter((id) =>
      windows.some((preview) => preview.id === id)
    );
    windows.forEach(({ id }) => {
      if (!stackingOrder.includes(id)) stackingOrder.push(id);
    });
    ReactDOM.render(
      <div className="roamjs-workbench-live-preview-layer">
        {windows.map((preview) => (
          <LivePreviewWindow
            key={preview.id}
            preview={preview}
            bounds={getPreviewViewport()}
            zIndex={200 + stackingOrder.indexOf(preview.id)}
            onChange={(patch) => update(preview.id, patch)}
            onClose={() => close(preview.id)}
            onActivate={() => activate(preview.id)}
            onPointerEnter={() => {
              hovered.add(preview.id);
              clearClose();
            }}
            onPointerLeave={() => {
              hovered.delete(preview.id);
              closeTransient();
            }}
            onFocus={() => {
              clearClose();
              activate(preview.id);
            }}
            onBlur={closeTransient}
            onInteractionStart={() => {
              interacting = true;
              clearClose();
              update(preview.id, { pinned: true });
            }}
            onInteractionEnd={() => {
              interacting = false;
              persist();
            }}
          >
            <NativePage uid={preview.uid} />
          </LivePreviewWindow>
        ))}
      </div>,
      mount
    );
  };
  const scheduleOpen = (event: MouseEvent | KeyboardEvent): void => {
    window.clearTimeout(openTimer);
    if (!source || !modifierHeld(event, settings)) return;
    const link = source;
    const title = getLinkTitle(link);
    if (!title) return;
    openTimer = window.setTimeout(() => {
      if (disposed || source !== link || !link.isConnected) return;
      const uid = getPageUidByPageTitle(title);
      if (!uid) return;
      const existing = windows.find((preview) => preview.uid === uid);
      if (existing) {
        activate(existing.id);
        return;
      }
      if (focused() || interacting) return;
      windows = windows.filter((preview) => preview.pinned);
      windows.push({
        id: `live-preview-${uid}`,
        uid,
        title,
        pinned: false,
        minimized: false,
        widthPreset: settings.widthPreset,
        geometry: getDefaultGeometry({
          settings,
          viewport: getPreviewViewport(),
          anchor: link.getBoundingClientRect(),
        }),
      });
      clearClose();
      render();
    }, settings.delay);
  };
  const onOver = (event: PointerEvent): void => {
    const link = getLink(event.target);
    if (!link || getLink(event.relatedTarget) === link) return;
    // Native links remain clickable in temporary previews; pinned windows can spawn another preview.
    const enclosing = link
      .closest("[data-preview-id]")
      ?.getAttribute("data-preview-id");
    if (
      enclosing &&
      windows.some((preview) => preview.id === enclosing && !preview.pinned)
    )
      return;
    source = link;
    clearClose();
    scheduleOpen(event);
  };
  const onOut = (event: PointerEvent): void => {
    if (
      !source ||
      getLink(event.target) !== source ||
      getLink(event.relatedTarget) === source
    )
      return;
    source = null;
    window.clearTimeout(openTimer);
    closeTransient();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      window.clearTimeout(openTimer);
      windows = windows.filter((preview) => preview.pinned);
      render();
    } else if (!event.repeat && event.key === settings.modifier && source) {
      scheduleOpen(event);
    }
  };
  const onKeyUp = (event: KeyboardEvent): void => {
    if (settings.trigger === "modifier" && !modifierHeld(event, settings))
      window.clearTimeout(openTimer);
  };
  const onResize = (): void => {
    windows = windows.map((preview) => ({
      ...preview,
      geometry: clampGeometry({
        geometry: preview.geometry,
        viewport: getPreviewViewport(),
        minimized: preview.minimized,
      }),
    }));
    render();
    scheduleSave();
  };
  const unsubscribe = subscribeSettings(api, (next) => {
    settings = next;
    window.clearTimeout(openTimer);
  });
  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerout", onOut);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", onResize);
  window.addEventListener("pagehide", persist);
  render();
  return () => {
    disposed = true;
    window.clearTimeout(openTimer);
    clearClose();
    persist();
    unsubscribe();
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pagehide", persist);
    ReactDOM.unmountComponentAtNode(mount);
    mount.remove();
  };
};

export let enabled = false;
let cleanup: (() => void) | undefined;
let generation = 0;

export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
): void => {
  enabled = flag;
  const current = ++generation;
  cleanup?.();
  cleanup = undefined;
  if (!flag) return;
  void loadSettings(extensionAPI.settings, get)
    .then((settings) => {
      if (!enabled || current !== generation) return;
      cleanup = mountPreviews({ extensionAPI, initialSettings: settings });
    })
    .catch((error: unknown) =>
      console.error("WorkBench Live Preview could not start", error)
    );
};
