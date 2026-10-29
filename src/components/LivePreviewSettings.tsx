import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Button,
  Dialog,
  FormGroup,
  HTMLSelect,
  H4,
  Icon,
  InputGroup,
  Spinner,
} from "@blueprintjs/core";
import { OnloadArgs } from "roamjs-components/types";
import {
  clampGeometry,
  DEFAULT_SETTINGS,
  getDefaultGeometry,
  getPresetWidth,
  getSettingsExampleGeometry,
  LivePreviewSettings as Settings,
  MIN_HEIGHT,
  MIN_WIDTH,
  normalizeDimension,
  normalizeSettings,
  PreviewState,
  resolveDimension,
  Viewport,
  WidthPreset,
} from "../features/livePreviewModel";
import { loadSettings, saveSettings } from "../features/livePreviewSettings";
import LivePreviewWindow from "./LivePreviewWindow";
import { useLivePreviewStyles } from "./livePreviewStyles";

export type LivePreviewSettingsProps = {
  extensionAPI: OnloadArgs["extensionAPI"];
  onClose: () => void;
  isOpen?: boolean;
  initialSettings?: Settings;
};

type NumericField = "width" | "height" | "delay";
type FieldValues = Record<NumericField, string>;
const SAMPLE_ROWS = [
  "Write one clear idea per note.",
  "Give the idea a title you would search for.",
  "Connect the idea to something you already know.",
  "A useful note is a starting point for the next thought.",
];
const PRESET_WIDTHS = { small: 360, medium: 480, large: 640 };
const MODIFIER_LABELS = {
  Alt: "Option / Alt",
  Control: "Control",
  Meta: "Command / Meta",
  Shift: "Shift",
};
const fieldsFor = (settings: Settings): FieldValues => ({
  width: String(settings.width),
  height: String(settings.height),
  delay: String(settings.delay),
});
let nextSettingsId = 0;

const LivePreviewSettings = ({
  extensionAPI,
  onClose,
  isOpen = true,
  initialSettings,
}: LivePreviewSettingsProps): React.ReactElement => {
  useLivePreviewStyles();
  const [id] = useState(
    () => `workbench-live-preview-settings-${++nextSettingsId}`
  );
  const [draft, setDraft] = useState<Settings>(
    initialSettings ?? DEFAULT_SETTINGS
  );
  const draftRef = useRef(draft);
  const [fields, setFields] = useState<FieldValues>(() => fieldsFor(draft));
  const fieldsRef = useRef(fields);
  const dirtyFields = useRef(new Set<NumericField>());
  const [loading, setLoading] = useState(!initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Changes appear here as you make them.");
  const [bounds, setBounds] = useState<Viewport>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [controlsCollapsed, setControlsCollapsed] = useState(
    () => window.innerWidth < 760
  );
  const boundsRef = useRef(bounds);
  const [sample, setSample] = useState<PreviewState | null>(null);
  const sampleRef = useRef(sample);
  const [sampleEpoch, setSampleEpoch] = useState(0);
  const sampleRows = useRef([...SAMPLE_ROWS]);
  const controlsRef = useRef<HTMLDivElement>(null);
  const sampleHostRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const openTimer = useRef<ReturnType<typeof setTimeout>>();
  const allowHoverDismiss = useRef(false);
  const interacting = useRef(false);
  const mounted = useRef(true);

  const replaceSample = useCallback((next: PreviewState | null): void => {
    sampleRef.current = next;
    setSample(next);
  }, []);

  const replaceDraft = useCallback((next: Settings): void => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  const replaceFields = useCallback((next: FieldValues): void => {
    fieldsRef.current = next;
    setFields(next);
  }, []);

  const clearTimers = useCallback((): void => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  const makeSample = useCallback(
    ({ settings }: { settings: Settings }): PreviewState => {
      const geometry = getSettingsExampleGeometry({
        settings,
        viewport: boundsRef.current,
        controls: controlsRef.current?.getBoundingClientRect(),
      });
      return {
        id: `${id}-example`,
        uid: "example-page",
        title: "Evergreen notes",
        pinned: false,
        minimized: false,
        widthPreset: settings.widthPreset,
        geometry: clampGeometry({
          geometry,
          viewport: boundsRef.current,
        }),
      };
    },
    [id]
  );

  const applySampleSize = useCallback(
    (settings: Settings): void => {
      clearTimeout(closeTimer.current);
      allowHoverDismiss.current = false;
      const previous = sampleRef.current ?? makeSample({ settings });
      const desired = getDefaultGeometry({
        settings,
        viewport: boundsRef.current,
      });
      replaceSample({
        ...previous,
        widthPreset: settings.widthPreset,
        geometry: clampGeometry({
          geometry: {
            ...previous.geometry,
            width: desired.width,
            height: desired.height,
          },
          viewport: boundsRef.current,
          minimized: previous.minimized,
        }),
      });
    },
    [makeSample, replaceSample]
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    const result = initialSettings
      ? Promise.resolve(initialSettings)
      : loadSettings(extensionAPI.settings);
    result
      .then((loaded) => {
        if (!active) return;
        const next = normalizeSettings(loaded);
        replaceDraft(next);
        replaceFields(fieldsFor(next));
        dirtyFields.current.clear();
        sampleRows.current = [...SAMPLE_ROWS];
        setSampleEpoch((value) => value + 1);
        replaceSample(makeSample({ settings: next }));
        allowHoverDismiss.current = false;
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(
          "Settings could not be loaded. Close this window and try again."
        );
        setLoading(false);
      });
    return () => {
      active = false;
      clearTimers();
    };
  }, [
    isOpen,
    extensionAPI.settings,
    initialSettings,
    replaceDraft,
    replaceFields,
    replaceSample,
    makeSample,
    clearTimers,
  ]);

  useLayoutEffect(() => {
    if (!isOpen || loading) return;
    const measure = (): void => {
      const next = { width: window.innerWidth, height: window.innerHeight };
      boundsRef.current = next;
      setBounds(next);
      if (sampleRef.current) applySampleSize(draftRef.current);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isOpen, loading, applySampleSize]);

  const openSample = useCallback(
    (explicit = false): void => {
      clearTimers();
      allowHoverDismiss.current = !explicit;
      const previous = sampleRef.current;
      const next = previous ?? makeSample({ settings: draftRef.current });
      replaceSample(
        explicit ? { ...next, pinned: true, minimized: false } : next
      );
      setStatus(
        explicit
          ? "Pinned. Close it when you are finished."
          : "Move into the example to edit it."
      );
    },
    [clearTimers, makeSample, replaceSample]
  );

  const requestSample = useCallback(
    (
      event: Pick<MouseEvent, "altKey" | "ctrlKey" | "metaKey" | "shiftKey">
    ): void => {
      clearTimers();
      const current = draftRef.current;
      const held = {
        Alt: event.altKey,
        Control: event.ctrlKey,
        Meta: event.metaKey,
        Shift: event.shiftKey,
      };
      if (current.trigger === "modifier" && !held[current.modifier]) return;
      openTimer.current = setTimeout(() => openSample(), current.delay);
    },
    [clearTimers, openSample]
  );

  const scheduleClose = useCallback((): void => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      if (
        !allowHoverDismiss.current ||
        interacting.current ||
        sampleRef.current?.pinned
      )
        return;
      const panel = sampleHostRef.current?.querySelector(
        ".roamjs-workbench-live-preview-window"
      );
      if (
        panel?.matches(":hover") ||
        panel?.contains(document.activeElement) ||
        linkRef.current?.matches(":hover")
      )
        return;
      replaceSample(null);
    }, Math.max(250, draftRef.current.delay));
  }, [replaceSample]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        draftRef.current.trigger === "modifier" &&
        event.key === draftRef.current.modifier &&
        linkRef.current?.matches(":hover")
      ) {
        event.preventDefault();
        requestSample(event);
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (
        draftRef.current.trigger === "modifier" &&
        event.key === draftRef.current.modifier
      )
        clearTimeout(openTimer.current);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, requestSample]);

  const updateSetting = (patch: Partial<Settings>): void => {
    if (
      patch.trigger !== undefined ||
      patch.modifier !== undefined ||
      patch.delay !== undefined
    )
      clearTimers();
    const next = normalizeSettings({ ...draftRef.current, ...patch });
    replaceDraft(next);
    if (
      patch.width !== undefined ||
      patch.height !== undefined ||
      patch.widthPreset !== undefined
    )
      applySampleSize(next);
  };

  const commitField = (field: NumericField): Settings => {
    if (!dirtyFields.current.has(field)) return draftRef.current;
    const raw = fieldsRef.current[field].trim();
    const current = draftRef.current;
    let next = current;
    if (field === "delay") {
      next = {
        ...current,
        delay:
          raw && Number.isFinite(Number(raw))
            ? Math.min(10000, Math.max(0, Math.round(Number(raw))))
            : current.delay,
      };
    } else {
      const value = normalizeDimension({
        value: raw,
        fallback: current[field],
      });
      const dimension =
        typeof value === "number"
          ? Math.min(
              10000,
              Math.max(field === "width" ? MIN_WIDTH : MIN_HEIGHT, value)
            )
          : value;
      next = {
        ...current,
        [field]: dimension,
        ...(field === "width" && raw ? { widthPreset: "custom" as const } : {}),
      };
    }
    dirtyFields.current.delete(field);
    replaceDraft(next);
    replaceFields({ ...fieldsRef.current, [field]: String(next[field]) });
    if (field !== "delay") applySampleSize(next);
    return next;
  };

  const changeField = ({
    field,
    value,
  }: {
    field: NumericField;
    value: string;
  }): void => {
    if (field === "delay") clearTimers();
    dirtyFields.current.add(field);
    replaceFields({ ...fieldsRef.current, [field]: value });
    const normalized =
      field === "delay"
        ? Number(value)
        : normalizeDimension({ value, fallback: NaN });
    if (
      !value.trim() ||
      (typeof normalized === "number" && !Number.isFinite(normalized))
    )
      return;
    if (field === "delay")
      updateSetting({
        delay: Math.min(10000, Math.max(0, Number(normalized))),
      });
    else
      updateSetting({
        [field]: normalized,
        ...(field === "width" ? { widthPreset: "custom" } : {}),
      });
  };

  const changePreset = (widthPreset: WidthPreset): void => {
    dirtyFields.current.delete("width");
    const width =
      widthPreset === "full"
        ? getPresetWidth({ preset: "full", viewportWidth: bounds.width })
        : widthPreset === "custom"
        ? draftRef.current.width
        : PRESET_WIDTHS[widthPreset];
    replaceFields({ ...fieldsRef.current, width: String(width) });
    updateSetting({ widthPreset, width });
  };

  const changeSample = (patch: Partial<PreviewState>): void => {
    const previous = sampleRef.current;
    if (!previous) return;
    const next = { ...previous, ...patch };
    replaceSample(next);
    if (!patch.geometry) return;
    const widthChanged =
      Math.abs(patch.geometry.width - previous.geometry.width) >= 1;
    const heightChanged =
      Math.abs(patch.geometry.height - previous.geometry.height) >= 1;
    if (!widthChanged && !heightChanged) return;
    const nextDraft = {
      ...draftRef.current,
      ...(widthChanged
        ? {
            width: Math.round(patch.geometry.width),
            widthPreset: "custom" as const,
          }
        : {}),
      ...(heightChanged ? { height: Math.round(patch.geometry.height) } : {}),
    };
    replaceDraft(nextDraft);
    replaceFields(fieldsFor(nextDraft));
    dirtyFields.current.clear();
    setStatus("Default size follows the example.");
  };

  const cancel = (): void => {
    if (!saving) {
      clearTimers();
      onClose();
    }
  };
  const save = async (): Promise<void> => {
    for (const field of ["width", "height", "delay"] as const)
      commitField(field);
    setSaving(true);
    setError("");
    try {
      await saveSettings(extensionAPI.settings, draftRef.current);
      if (mounted.current) {
        clearTimers();
        onClose();
      }
    } catch {
      if (mounted.current)
        setError(
          "Settings could not be saved. Your changes are still here; please try again."
        );
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  const fullWidth = getPresetWidth({
    preset: "full",
    viewportWidth: bounds.width,
  });
  const widthValue =
    draft.widthPreset === "full" && !dirtyFields.current.has("width")
      ? String(Math.round(fullWidth))
      : fields.width;
  const desired = getDefaultGeometry({ settings: draft, viewport: bounds });
  const requestedHeight = resolveDimension({
    value: draft.height,
    axis: "height",
    viewport: bounds,
    fallback: 380,
  });
  const fitsAvailableSpace =
    (draft.widthPreset !== "full" &&
      typeof draft.width === "number" &&
      desired.width < draft.width) ||
    desired.height < requestedHeight;
  const fitHint = [
    draft.widthPreset === "full" ? "Full available width" : "",
    fitsAvailableSpace ? "Fits available space" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog
      className="roamjs-workbench-live-preview-settings-layout"
      isOpen={isOpen}
      aria-labelledby={`${id}-title`}
      onClose={cancel}
      canOutsideClickClose={false}
      canEscapeKeyClose={!saving}
      autoFocus
      enforceFocus
      usePortal
    >
      <div className="roamjs-workbench-live-preview-settings" ref={controlsRef}>
        <header className="roamjs-workbench-live-preview-settings-header">
          <H4 id={`${id}-title`}>Live Preview settings</H4>
          <Button
            minimal
            small
            icon={controlsCollapsed ? "chevron-down" : "chevron-up"}
            aria-label={
              controlsCollapsed ? "Expand settings" : "Collapse settings"
            }
            title={controlsCollapsed ? "Expand settings" : "Collapse settings"}
            onClick={() => setControlsCollapsed((collapsed) => !collapsed)}
          />
          <Button
            minimal
            small
            icon="cross"
            aria-label="Cancel settings"
            onClick={cancel}
            disabled={saving}
          />
        </header>
        {!controlsCollapsed && (
          <>
            {loading ? (
              <div className="roamjs-workbench-live-preview-settings-loading">
                <Spinner size={24} />
              </div>
            ) : (
              <div className="roamjs-workbench-live-preview-settings-grid">
                <div className="roamjs-workbench-live-preview-settings-form">
                  <FormGroup label="Open a preview" labelFor={`${id}-trigger`}>
                    <HTMLSelect
                      id={`${id}-trigger`}
                      value={draft.trigger}
                      fill
                      data-setting="trigger"
                      onChange={(event) =>
                        updateSetting({
                          trigger: event.currentTarget
                            .value as Settings["trigger"],
                        })
                      }
                      options={[
                        { label: "Hover over a page link", value: "hover" },
                        {
                          label: "Hold a key while hovering",
                          value: "modifier",
                        },
                      ]}
                    />
                  </FormGroup>
                  {draft.trigger === "modifier" && (
                    <FormGroup label="Modifier key" labelFor={`${id}-modifier`}>
                      <HTMLSelect
                        id={`${id}-modifier`}
                        value={draft.modifier}
                        fill
                        data-setting="modifier"
                        onChange={(event) =>
                          updateSetting({
                            modifier: event.currentTarget
                              .value as Settings["modifier"],
                          })
                        }
                        options={Object.entries(MODIFIER_LABELS).map(
                          ([value, label]) => ({ value, label })
                        )}
                      />
                    </FormGroup>
                  )}
                  <div className="roamjs-workbench-live-preview-setting-label">
                    <label htmlFor={`${id}-delay`}>Hover delay</label>
                    <InputGroup
                      id={`${id}-delay`}
                      type="number"
                      min={0}
                      max={10000}
                      value={fields.delay}
                      data-setting="delay"
                      rightElement={
                        <span className="roamjs-workbench-live-preview-unit">
                          ms
                        </span>
                      }
                      onChange={(event) =>
                        changeField({
                          field: "delay",
                          value: event.currentTarget.value,
                        })
                      }
                      onBlur={() => commitField("delay")}
                    />
                  </div>
                  <input
                    className="roamjs-workbench-live-preview-delay-range"
                    aria-label="Hover delay"
                    type="range"
                    min={0}
                    max={1500}
                    step={50}
                    value={Math.min(1500, draft.delay)}
                    onChange={(event) => {
                      const delay = Number(event.currentTarget.value);
                      dirtyFields.current.delete("delay");
                      replaceFields({
                        ...fieldsRef.current,
                        delay: String(delay),
                      });
                      updateSetting({ delay });
                    }}
                  />
                  <div className="roamjs-workbench-live-preview-range-labels">
                    <span>Immediate</span>
                    <span>1.5 seconds</span>
                  </div>
                  <div className="roamjs-workbench-live-preview-default-size">
                    <h4>Default size</h4>
                    <FormGroup label="Width preset" labelFor={`${id}-preset`}>
                      <HTMLSelect
                        id={`${id}-preset`}
                        value={draft.widthPreset}
                        fill
                        data-setting="preset"
                        onChange={(event) =>
                          changePreset(event.currentTarget.value as WidthPreset)
                        }
                        options={[
                          { label: "Small", value: "small" },
                          { label: "Medium", value: "medium" },
                          { label: "Large", value: "large" },
                          { label: "Full", value: "full" },
                          { label: "Custom", value: "custom" },
                        ]}
                      />
                    </FormGroup>
                    <div className="roamjs-workbench-live-preview-dimensions">
                      <label htmlFor={`${id}-width`}>
                        Width
                        <InputGroup
                          id={`${id}-width`}
                          value={widthValue}
                          data-setting="width"
                          inputMode="decimal"
                          rightElement={
                            typeof draft.width === "number" ? (
                              <span className="roamjs-workbench-live-preview-unit">
                                px
                              </span>
                            ) : undefined
                          }
                          onChange={(event) =>
                            changeField({
                              field: "width",
                              value: event.currentTarget.value,
                            })
                          }
                          onBlur={() => commitField("width")}
                        />
                      </label>
                      <span aria-hidden>×</span>
                      <label htmlFor={`${id}-height`}>
                        Height
                        <InputGroup
                          id={`${id}-height`}
                          value={fields.height}
                          data-setting="height"
                          inputMode="decimal"
                          rightElement={
                            typeof draft.height === "number" ? (
                              <span className="roamjs-workbench-live-preview-unit">
                                px
                              </span>
                            ) : undefined
                          }
                          onChange={(event) =>
                            changeField({
                              field: "height",
                              value: event.currentTarget.value,
                            })
                          }
                          onBlur={() => commitField("height")}
                        />
                      </label>
                    </div>
                    <p className="roamjs-workbench-live-preview-help">
                      Resize the example to find a comfortable size.
                    </p>
                  </div>
                  <p className="roamjs-workbench-live-preview-settings-note">
                    Resize the floating sample anywhere on screen. Collapse
                    these controls for more space. Changes apply to new previews
                    after saving.
                  </p>
                </div>
                <section
                  className="roamjs-workbench-live-preview-example"
                  aria-label="Live example page"
                >
                  <div className="roamjs-workbench-live-preview-example-heading">
                    <div>
                      <h4>Example page</h4>
                      <p>The sample floats beside these controls.</p>
                    </div>
                    <Button
                      minimal
                      small
                      icon="reset"
                      text="Reset example"
                      onClick={() => {
                        clearTimers();
                        allowHoverDismiss.current = false;
                        sampleRows.current = [...SAMPLE_ROWS];
                        setSampleEpoch((value) => value + 1);
                        replaceSample(
                          makeSample({ settings: draftRef.current })
                        );
                        setStatus(
                          "Example reset. Your settings are unchanged."
                        );
                      }}
                    />
                  </div>
                  <div className="roamjs-workbench-live-preview-example-launcher">
                    <div className="roamjs-workbench-live-preview-example-source">
                      <div className="roamjs-workbench-live-preview-example-context">
                        Preview playground
                      </div>
                      <span>Try </span>
                      <Button
                        minimal
                        small
                        elementRef={linkRef}
                        className="roamjs-workbench-live-preview-example-link"
                        text="[[Evergreen notes]]"
                        onPointerEnter={(event) =>
                          requestSample(event.nativeEvent)
                        }
                        onPointerLeave={() => {
                          clearTimeout(openTimer.current);
                          scheduleClose();
                        }}
                        onClick={() => openSample(true)}
                      />
                      <p>
                        {draft.trigger === "modifier"
                          ? `Hold ${
                              MODIFIER_LABELS[draft.modifier]
                            } and hover the link.`
                          : "Hover the link to test your delay."}
                      </p>
                    </div>
                    {!sample && (
                      <Button
                        text="Show preview"
                        onClick={() => openSample(true)}
                      />
                    )}
                  </div>
                  <div
                    className="roamjs-workbench-live-preview-example-status"
                    role="status"
                    aria-live="polite"
                  >
                    <span>{status}</span>
                    {fitHint && <span>{fitHint}</span>}
                  </div>
                </section>
              </div>
            )}
            {error && (
              <div
                className="roamjs-workbench-live-preview-settings-error"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="roamjs-workbench-live-preview-settings-actions">
              <span>
                <Icon icon="lab-test" size={13} />
                Sample content only
              </span>
              <div>
                <Button text="Cancel" onClick={cancel} disabled={saving} />
                <Button
                  intent="primary"
                  text="Save settings"
                  loading={saving}
                  disabled={loading || (!!error && !sample)}
                  onClick={() => void save()}
                />
              </div>
            </div>
          </>
        )}
      </div>
      {!loading && sample && (
        <div
          className="roamjs-workbench-live-preview-example-layer"
          ref={sampleHostRef}
        >
          <LivePreviewWindow
            preview={sample}
            onChange={changeSample}
            onClose={() => {
              clearTimers();
              replaceSample(null);
              setStatus("Hover the example link to open a new preview.");
            }}
            bounds={bounds}
            zIndex={1}
            onPointerEnter={() => clearTimeout(closeTimer.current)}
            onPointerLeave={scheduleClose}
            onFocus={() => clearTimeout(closeTimer.current)}
            onBlur={scheduleClose}
            onInteractionStart={() => {
              interacting.current = true;
              clearTimers();
            }}
            onInteractionEnd={() => {
              interacting.current = false;
            }}
          >
            <div
              className="roamjs-workbench-live-preview-sample"
              key={sampleEpoch}
            >
              <div className="roamjs-workbench-live-preview-sample-origin">
                <Icon icon="link" size={12} />
                Example page
              </div>
              <h2>Evergreen notes</h2>
              <div>
                {SAMPLE_ROWS.map((original, index) => (
                  <div
                    className="roamjs-workbench-live-preview-sample-row"
                    key={`${sampleEpoch}-${index}`}
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      spellCheck={false}
                      role="textbox"
                      aria-label={`Example block ${index + 1}`}
                      onInput={(event) => {
                        sampleRows.current[index] =
                          event.currentTarget.textContent ?? "";
                      }}
                      onBlur={() =>
                        setStatus("Sample edits stay in this example.")
                      }
                    >
                      {sampleRows.current[index] ?? original}
                    </div>
                  </div>
                ))}
              </div>
              <div className="roamjs-workbench-live-preview-sample-references">
                <Icon icon="chevron-right" size={12} /> 8 Linked References
              </div>
            </div>
          </LivePreviewWindow>
        </div>
      )}
    </Dialog>
  );
};

export default LivePreviewSettings;
