import { useLayoutEffect } from "react";

export const LIVE_PREVIEW_STYLES = `
.roamjs-workbench-live-preview-layer { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.roamjs-workbench-live-preview-window {
  --lp-background: #fff;
  --lp-text: #293740;
  --lp-muted: #6a7a85;
  --lp-line: #e1e7eb;
  --lp-link: #246da6;
  --lp-active: #edf5fc;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  pointer-events: auto;
  color: var(--lp-text);
  background: var(--lp-background);
  border: 1px solid var(--lp-line);
  border-radius: 7px;
  box-shadow: 0 12px 32px rgba(37,58,76,.15);
  overflow: visible;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
}
.roamjs-workbench-live-preview-header,
.roamjs-workbench-live-preview-header *,
.roamjs-workbench-live-preview-scroll,
.roamjs-workbench-live-preview-resize { box-sizing: border-box; }
.roamjs-workbench-live-preview-header {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 43px;
  flex: 0 0 43px;
  padding: 6px 7px 6px 11px;
  border-bottom: 1px solid var(--lp-line);
  border-radius: 7px 7px 0 0;
  background: var(--lp-background);
  touch-action: none;
  cursor: grab;
  user-select: none;
}
.roamjs-workbench-live-preview-header:active { cursor: grabbing; }
.roamjs-workbench-live-preview-header:focus-visible { outline: 2px solid var(--lp-link); outline-offset: -2px; }
.roamjs-workbench-live-preview-page-icon { color: var(--lp-muted); flex: 0 0 auto; }
.roamjs-workbench-live-preview-title { flex: 1; min-width: 0; font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roamjs-workbench-live-preview-controls { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
.roamjs-workbench-live-preview-controls .bp3-button { min-width: 28px; min-height: 28px; color: var(--lp-muted); padding: 4px 5px; border-radius: 4px; }
.roamjs-workbench-live-preview-controls .bp3-button.bp3-active { color: var(--lp-link); background: var(--lp-active); }
.roamjs-workbench-live-preview-controls .bp3-button .bp3-icon { color: inherit; }
.roamjs-workbench-live-preview-window[data-minimized="true"] .roamjs-workbench-live-preview-header { border-bottom: 0; border-radius: 7px; }
.roamjs-workbench-live-preview-scroll { flex: 1; min-height: 0; overflow: auto; margin-bottom: 20px; overscroll-behavior: contain; scrollbar-gutter: stable; }
.roamjs-workbench-live-preview-scroll[hidden] { display: none; }
.workbench-live-preview-page { padding: 20px 24px 18px 32px; min-width: 0; }
.workbench-live-preview-page .rm-title-display { margin: 0 0 18px; font-size: 26px; line-height: 1.25; min-width: 0; overflow-wrap: anywhere; }
.workbench-live-preview-page .rm-title-display-container .rm-title-icon { margin-top: 4px; }
.workbench-live-preview-page .rm-block-separator { min-width: 8px; }
.roamjs-workbench-live-preview-window .roamjs-workbench-live-preview-resize.bp3-button {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 1;
  min-width: 22px;
  width: 22px;
  min-height: 20px;
  height: 20px;
  padding: 3px;
  border-radius: 0 0 7px 0;
  color: var(--lp-muted);
  cursor: nwse-resize;
  touch-action: none;
}
.roamjs-workbench-live-preview-resize .bp3-icon > svg { width: 11px; height: 11px; }
.bp3-dark .roamjs-workbench-live-preview-window:not([data-embedded="true"]) {
  --lp-background: #282e35;
  --lp-text: #e7edf2;
  --lp-muted: #a8b6c1;
  --lp-line: #3d4852;
  --lp-link: #91c5ef;
  --lp-active: #30485c;
}
.bp3-dark .roamjs-workbench-live-preview-example-layer .roamjs-workbench-live-preview-window {
  --lp-background: #fff;
  --lp-text: #293740;
  --lp-muted: #6a7a85;
  --lp-line: #e1e7eb;
  --lp-link: #246da6;
  --lp-active: #edf5fc;
}
.roamjs-workbench-live-preview-settings-layout.bp3-dialog {
  position: fixed; inset: 0; width: 100vw; height: 100vh; max-width: none; max-height: none;
  padding: 0; margin: 0; border: 0; background: transparent; box-shadow: none;
  overflow: visible; pointer-events: none; transform: none !important;
}
.roamjs-workbench-live-preview-settings {
  position: fixed; top: 24px; left: 24px; z-index: 2; width: 360px; max-width: calc(100vw - 32px);
  max-height: calc(100vh - 48px); display: flex; flex-direction: column; padding: 0;
  border: 1px solid #e1e7eb; border-radius: 8px; background: #fff; color: #293740;
  box-shadow: 0 8px 28px rgba(0,0,0,.18); overflow: hidden; pointer-events: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.roamjs-workbench-live-preview-settings * { box-sizing: border-box; }
.roamjs-workbench-live-preview-settings-header { display: flex; align-items: center; gap: 4px; padding: 17px 16px 17px 22px; flex-shrink: 0; }
.roamjs-workbench-live-preview-settings-header .bp3-heading { flex: 1; margin: 0; color: #293740; font-size: 18px; line-height: 1.3; font-weight: 600; }
.roamjs-workbench-live-preview-settings-header .bp3-button { color: #6a7a85; }
.roamjs-workbench-live-preview-settings-grid { min-height: 0; min-width: 0; overflow-x: hidden; overflow-y: auto; background: #fff; }
.roamjs-workbench-live-preview-settings-form { padding: 3px 24px 20px; }
.roamjs-workbench-live-preview-example-layer { position: fixed; inset: 0; z-index: 1; pointer-events: none; }
.roamjs-workbench-live-preview-settings .bp3-form-group { margin-bottom: 20px; }
.roamjs-workbench-live-preview-settings .bp3-label { color: #293740; font-size: 13px; font-weight: 500; }
.roamjs-workbench-live-preview-settings .bp3-input, .roamjs-workbench-live-preview-settings .bp3-html-select select {
  color: #293740; background: #fff; box-shadow: inset 0 0 0 1px #d6dfe5; font-size: 13px; height: 35px; border-radius: 4px;
}
.roamjs-workbench-live-preview-settings .bp3-html-select { width: 100%; }
.roamjs-workbench-live-preview-setting-label { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.roamjs-workbench-live-preview-setting-label > label { font-size: 13px; font-weight: 500; margin: 0; }
.roamjs-workbench-live-preview-setting-label .bp3-input-group { width: 90px; }
.roamjs-workbench-live-preview-unit { display: inline-flex; align-items: center; height: 35px; padding-right: 9px; color: #70818d; font-size: 12px; }
.roamjs-workbench-live-preview-delay-range { display: block; width: 100%; accent-color: #2d76ac; margin: 0; }
.roamjs-workbench-live-preview-range-labels { display: flex; justify-content: space-between; margin-top: 7px; color: #76858f; font-size: 11px; }
.roamjs-workbench-live-preview-default-size { margin: 22px 0 0; }
.roamjs-workbench-live-preview-default-size > h4 { margin: 0 0 14px; font-size: 13px; font-weight: 500; color: #293740; }
.roamjs-workbench-live-preview-dimensions { display: grid; grid-template-columns: minmax(0,1fr) 10px minmax(0,1fr); gap: 7px; align-items: end; }
.roamjs-workbench-live-preview-dimensions label { font-size: 12px; color: #687984; margin: 0; }
.roamjs-workbench-live-preview-dimensions .bp3-input-group { margin-top: 7px; }
.roamjs-workbench-live-preview-dimensions > span { padding-bottom: 10px; color: #8998a2; }
.roamjs-workbench-live-preview-help { font-size: 12px; color: #6a7a85; line-height: 1.6; margin: 12px 0 0; }
.roamjs-workbench-live-preview-settings-note { font-size: 12px; color: #7a8993; line-height: 1.65; margin: 18px 0 0; }
.roamjs-workbench-live-preview-example { min-width: 0; padding: 18px 24px; border-top: 1px solid #edf0f2; }
.roamjs-workbench-live-preview-example-heading { display: flex; justify-content: space-between; gap: 8px 12px; flex-wrap: wrap; align-items: flex-start; }
.roamjs-workbench-live-preview-example-heading h4 { font-size: 14px; font-weight: 600; color: #293740; margin: 0 0 5px; }
.roamjs-workbench-live-preview-example-heading p { font-size: 12px; color: #71818c; margin: 0; }
.roamjs-workbench-live-preview-example-heading .bp3-button { color: #647785; font-size: 12px; }
.roamjs-workbench-live-preview-example-launcher { margin: 14px 0; }
.roamjs-workbench-live-preview-example-source { padding: 0; }
.roamjs-workbench-live-preview-example-context { color: #75858f; font-size: 11px; margin-bottom: 14px; }
.roamjs-workbench-live-preview-example-link.bp3-button { color: #246da6; padding: 0 3px; min-height: 24px; line-height: 1.4; }
.roamjs-workbench-live-preview-example-source > p { color: #7a8993; font-size: 11px; margin: 5px 0 0; }
.roamjs-workbench-live-preview-sample { padding: 19px 22px 18px; color: #293740; line-height: 1.55; font-size: 14px; }
.roamjs-workbench-live-preview-sample-origin { font-size: 11px; color: #6a7a85; display: flex; gap: 6px; align-items: center; margin-bottom: 12px; }
.roamjs-workbench-live-preview-sample h2 { font-size: 22px; font-weight: 600; line-height: 1.25; margin: 0 0 18px; color: #293740; }
.roamjs-workbench-live-preview-sample-row { position: relative; padding-left: 18px; margin: 11px 0; }
.roamjs-workbench-live-preview-sample-row::before { position: absolute; left: 2px; top: 9px; content: ""; width: 5px; height: 5px; background: #9aa8b2; border-radius: 50%; }
.roamjs-workbench-live-preview-sample-row:nth-child(2) { margin-left: 18px; padding-left: 20px; border-left: 1px solid #e1e7eb; }
.roamjs-workbench-live-preview-sample-row:nth-child(2)::before { left: 7px; }
.roamjs-workbench-live-preview-sample-row [contenteditable] { min-height: 22px; outline-offset: 2px; border-radius: 2px; overflow-wrap: anywhere; }
.roamjs-workbench-live-preview-sample-row [contenteditable]:focus-visible { outline: 2px solid #246da6; }
.roamjs-workbench-live-preview-sample-references { border-top: 1px solid #e1e7eb; padding-top: 14px; margin-top: 23px; color: #6a7a85; font-size: 12px; }
.roamjs-workbench-live-preview-example-status { color: #75858f; font-size: 11px; line-height: 1.5; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; min-height: 18px; }
.roamjs-workbench-live-preview-example-empty { position: absolute; inset: 125px 12px 12px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; color: #82909a; font-size: 12px; text-align: center; }
.roamjs-workbench-live-preview-settings-actions { display: flex; flex-shrink: 0; justify-content: space-between; align-items: center; gap: 14px; padding: 16px 24px; flex-wrap: wrap; border-top: 1px solid #edf0f2; background: #fff; }
.roamjs-workbench-live-preview-settings-actions > span { display: flex; align-items: center; gap: 6px; color: #7c8a94; font-size: 11px; }
.roamjs-workbench-live-preview-settings-actions > div { display: flex; gap: 8px; margin-left: auto; }
.roamjs-workbench-live-preview-settings-actions .bp3-button:not(.bp3-intent-primary) { background: #fff; color: #293740; box-shadow: inset 0 0 0 1px #d6dfe5; }
.roamjs-workbench-live-preview-settings-error { color: #a82a2a; font-size: 12px; padding: 0 26px 14px; }
.roamjs-workbench-live-preview-settings-loading { min-height: 570px; display: flex; justify-content: center; align-items: center; }
@media (max-width: 620px) {
  .roamjs-workbench-live-preview-settings { top: 16px; left: 16px; max-height: calc(100vh - 32px); }
  .roamjs-workbench-live-preview-sample { padding-left: 17px; padding-right: 17px; }
}
@media (pointer: coarse) {
  .roamjs-workbench-live-preview-header { padding-top: 0; padding-bottom: 0; }
  .roamjs-workbench-live-preview-controls .bp3-button { min-height: 42px; min-width: 40px; }
  .roamjs-workbench-live-preview-window .roamjs-workbench-live-preview-resize.bp3-button { width: 40px; height: 36px; }
  .roamjs-workbench-live-preview-scroll { margin-bottom: 36px; }
  .roamjs-workbench-live-preview-sample-row [contenteditable] { font-size: 16px; }
}
`;

let users = 0;
let styleElement: HTMLStyleElement | undefined;

export const useLivePreviewStyles = (): void => {
  useLayoutEffect(() => {
    users += 1;
    if (!styleElement?.isConnected) {
      styleElement = document.createElement("style");
      styleElement.dataset.roamjsWorkbenchLivePreview = "true";
      styleElement.textContent = LIVE_PREVIEW_STYLES;
      document.head.appendChild(styleElement);
    }
    return () => {
      users -= 1;
      if (users === 0) {
        styleElement?.remove();
        styleElement = undefined;
      }
    };
  }, []);
};
