import React, { useRef } from "react";
import { Button, Icon, Tooltip } from "@blueprintjs/core";
import {
  clampGeometry,
  Geometry,
  HEADER_HEIGHT,
  PreviewState,
  Viewport,
} from "../features/livePreviewModel";
import { useLivePreviewStyles } from "./livePreviewStyles";

export type LivePreviewWindowProps = {
  preview: PreviewState;
  onChange: (patch: Partial<PreviewState>) => void;
  onClose: () => void;
  children: React.ReactNode;
  embedded?: boolean;
  bounds?: Viewport;
  zIndex?: number;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onFocus?: () => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  onActivate?: () => void;
};

type Gesture = {
  pointerId: number;
  x: number;
  y: number;
  geometry: Geometry;
  widthPreset: PreviewState["widthPreset"];
  resize: boolean;
  started: boolean;
  widthChanged: boolean;
};

const LivePreviewWindow = ({
  preview,
  onChange,
  onClose,
  children,
  embedded = false,
  bounds,
  zIndex,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onInteractionStart,
  onInteractionEnd,
  onActivate,
}: LivePreviewWindowProps): React.ReactElement => {
  useLivePreviewStyles();
  const gesture = useRef<Gesture | null>(null);
  const viewport = bounds ?? {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const geometry = clampGeometry({
    geometry: preview.geometry,
    viewport,
    minimized: preview.minimized,
  });

  const startGesture = ({
    event,
    resize,
  }: {
    event: React.PointerEvent<HTMLElement>;
    resize: boolean;
  }): void => {
    if (event.button !== 0) return;
    if (!resize && (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      geometry,
      widthPreset: preview.widthPreset,
      resize,
      started: false,
      widthChanged: false,
    };
  };

  const moveGesture = (event: React.PointerEvent<HTMLElement>): void => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.started && Math.abs(dx) + Math.abs(dy) < 4) return;
    if (!current.started) {
      current.started = true;
      onInteractionStart?.();
    }
    current.widthChanged ||= current.resize && Math.abs(dx) >= 1;
    const next = clampGeometry({
      geometry: current.resize
        ? {
            ...current.geometry,
            width: current.geometry.width + dx,
            height: current.geometry.height + dy,
          }
        : {
            ...current.geometry,
            x: current.geometry.x + dx,
            y: current.geometry.y + dy,
          },
      viewport,
      minimized: !current.resize && preview.minimized,
    });
    onChange({
      geometry: next,
      pinned: true,
      ...(current.resize
        ? {
            minimized: false,
            widthPreset: current.widthChanged ? "custom" : current.widthPreset,
          }
        : {}),
    });
  };

  const endGesture = (event: React.PointerEvent<HTMLElement>): void => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    const started = gesture.current.started;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (started) onInteractionEnd?.();
  };

  const moveWithKeyboard = ({
    event,
    resize,
  }: {
    event: React.KeyboardEvent<HTMLElement>;
    resize: boolean;
  }): void => {
    if (event.target !== event.currentTarget) return;
    if (!/^Arrow(Left|Right|Up|Down)$/.test(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 40 : 10;
    const dx =
      event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const dy =
      event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    onInteractionStart?.();
    onChange({
      pinned: true,
      geometry: clampGeometry({
        geometry: resize
          ? {
              ...geometry,
              width: geometry.width + dx,
              height: geometry.height + dy,
            }
          : { ...geometry, x: geometry.x + dx, y: geometry.y + dy },
        viewport,
        minimized: !resize && preview.minimized,
      }),
      ...(resize
        ? { minimized: false, widthPreset: dx ? "custom" : preview.widthPreset }
        : {}),
    });
    onInteractionEnd?.();
  };

  const pinLabel = preview.pinned ? "Unpin preview" : "Pin preview";
  const minimizeLabel = preview.minimized
    ? "Restore preview"
    : "Minimize in place";

  return (
    <section
      className="roamjs-workbench-live-preview-window"
      role="region"
      aria-label={`${preview.title} preview`}
      data-preview-id={preview.id}
      data-page-uid={preview.uid}
      data-pinned={preview.pinned}
      data-minimized={preview.minimized}
      data-width-preset={preview.widthPreset}
      data-embedded={embedded}
      style={{
        position: embedded ? "absolute" : "fixed",
        left: geometry.x,
        top: geometry.y,
        width: geometry.width,
        height: preview.minimized ? HEADER_HEIGHT : geometry.height,
        zIndex,
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onPointerDownCapture={onActivate}
    >
      <div
        className="roamjs-workbench-live-preview-header flex"
        role="group"
        tabIndex={0}
        aria-label={`Move ${preview.title} preview with arrow keys. Hold Shift for larger steps.`}
        onPointerDown={(event) => startGesture({ event, resize: false })}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onLostPointerCapture={endGesture}
        onKeyDown={(event) => moveWithKeyboard({ event, resize: false })}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          onChange({ minimized: !preview.minimized, pinned: true });
        }}
      >
        <Icon
          icon="document"
          size={14}
          className="roamjs-workbench-live-preview-page-icon"
          aria-hidden
        />
        <span
          className="roamjs-workbench-live-preview-title min-w-0"
          title={preview.title}
        >
          {preview.title}
        </span>
        <div className="roamjs-workbench-live-preview-controls flex">
          <Tooltip content={pinLabel} hoverOpenDelay={500}>
            <Button
              minimal
              small
              icon={preview.pinned ? "unpin" : "pin"}
              active={preview.pinned}
              aria-label={pinLabel}
              aria-pressed={preview.pinned}
              data-action="pin"
              onClick={() => onChange({ pinned: !preview.pinned })}
            />
          </Tooltip>
          <Tooltip content={minimizeLabel} hoverOpenDelay={500}>
            <Button
              minimal
              small
              icon={preview.minimized ? "chevron-down" : "minus"}
              aria-label={minimizeLabel}
              data-action="minimize"
              onClick={() =>
                onChange({ minimized: !preview.minimized, pinned: true })
              }
            />
          </Tooltip>
          <Tooltip content="Close preview" hoverOpenDelay={500}>
            <Button
              minimal
              small
              icon="cross"
              aria-label="Close preview"
              data-action="close"
              onClick={onClose}
            />
          </Tooltip>
        </div>
      </div>
      <div
        className="roamjs-workbench-live-preview-scroll"
        hidden={preview.minimized}
      >
        {children}
      </div>
      {!preview.minimized && (
        <Button
          minimal
          small
          icon="maximize"
          className="roamjs-workbench-live-preview-resize"
          aria-label="Resize preview with arrow keys. Hold Shift for larger steps."
          title="Drag to resize. Arrow keys also work."
          onPointerDown={(event) => startGesture({ event, resize: true })}
          onPointerMove={moveGesture}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onLostPointerCapture={endGesture}
          onKeyDown={(event) => moveWithKeyboard({ event, resize: true })}
        />
      )}
    </section>
  );
};

export default LivePreviewWindow;
