import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import getChildrenLengthByPageUid from "roamjs-components/queries/getChildrenLengthByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import { Tooltip } from "@blueprintjs/core";
import addStyle from "roamjs-components/dom/addStyle";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import ReactDOM from "react-dom";
import { get } from "../settings";

const LIVE_PREVIEW_ATTRIBUTE = "data-roamjs-workbench-augment-tag";

const TooltipContent = ({
  tag,
  open,
  close,
}: {
  tag: string;
  open: (e: MouseEvent, modifier?: string) => void;
  close: () => void;
}) => {
  const uid = useMemo(() => getPageUidByPageTitle(tag), [tag]);
  const numChildren = useMemo(() => getChildrenLengthByPageUid(uid), [uid]);
  const height = useMemo(() => {
    const val = get("LivePreviewHeight");
    return /^\d+$/.test(val) ? Number(val) : val;
  }, []);
  const width = useMemo(() => {
    const val = get("LivePreviewWidth");
    return /^\d+$/.test(val) ? Number(val) : val;
  }, []);
  const [isEmpty, setIsEmpty] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document
      .getElementById("roamjs-workbench-live-preview-container")
      ?.remove?.();
    let newIsEmpty = true;
    if (numChildren) {
      const el = document.createElement("div");
      el.onmouseenter = open;
      el.id = "roamjs-workbench-live-preview-container";
      window.roamAlphaAPI.ui.components.renderBlock({
        uid,
        el,
      });
      containerRef.current.appendChild(el);
      containerRef.current.parentElement.style.padding = "0";
      newIsEmpty = false;
    }
    setIsEmpty(newIsEmpty);
  }, [uid, containerRef, numChildren, tag, setIsEmpty, open]);
  return (
    <div
      style={{ width, height }}
      onMouseOver={(e) => open(e.nativeEvent)}
      onMouseLeave={close}
      className={"relative overflow-auto"}
    >
      <div
        ref={containerRef}
        className={"roamjs-workbench-live-preview"}
        style={{
          paddingTop: !isEmpty ? 16 : 0,
        }}
      >
        {isEmpty && (
          <span>
            Page <i>{tag}</i> is empty.
          </span>
        )}
      </div>
    </div>
  );
};

type Props = {
  tag: string;
  timeout: number;
  registerMouseEvents: (a: {
    open: (e: MouseEvent, modifier?: string) => void;
    close: () => void;
  }) => void;
};

const LivePreview = ({ tag, registerMouseEvents, timeout }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const openRef = useRef<boolean>(false);
  const timeoutRef = useRef(0);
  const open = useCallback(
    (e: MouseEvent, modifier?: string) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        const state = /shift/i.test(modifier)
          ? e.shiftKey
          : /(meta|cmd|command)/i.test(modifier)
          ? e.metaKey
          : /(ctrl|control)/i.test(modifier)
          ? e.ctrlKey
          : /(opt|alt)/i.test(modifier)
          ? e.altKey
          : true;
        setIsOpen(state);
        openRef.current = state;
        timeoutRef.current = null;
      }, timeout);
    },
    [setIsOpen, timeoutRef, openRef]
  );
  const close = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (openRef.current) {
      timeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
        openRef.current = false;
        timeoutRef.current = null;
      }, timeout);
    }
  }, [setIsOpen, timeoutRef, openRef]);
  useEffect(() => {
    if (!loaded) setLoaded(true);
  }, [loaded, setLoaded]);
  useEffect(() => {
    if (loaded) {
      registerMouseEvents({ open, close });
    }
  }, [loaded, close, open, registerMouseEvents]);
  const ref = useRef<Tooltip>(null);
  useEffect(() => {
    ref.current.reposition();
  }, [tag]);
  return (
    <Tooltip
      content={<TooltipContent tag={tag} open={open} close={close} />}
      placement={"right"}
      isOpen={isOpen}
      ref={ref}
      popoverClassName={"roamjs-workbench-livepreview-toolip"}
    >
      <span />
    </Tooltip>
  );
};

export let enabled = false;
let livePreviewObserver: MutationObserver;
const unmounts = new Set<() => void>();

export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (flag) {
    livePreviewObserver = createHTMLObserver({
      useBody: true,
      tag: "SPAN",
      className: "rm-page-ref",
      callback: (s: HTMLSpanElement) => {
        const tag =
          s.getAttribute("data-tag") ||
          s.parentElement.getAttribute("data-link-title");
        if (!s.getAttribute(LIVE_PREVIEW_ATTRIBUTE)) {
          s.setAttribute(LIVE_PREVIEW_ATTRIBUTE, "true");
          const modifier = get("LivePreviewModifier");
          const parent = document.createElement("span");
          const unmount = () => {
            ReactDOM.unmountComponentAtNode(parent);
            parent.remove();
            unmounts.delete(unmount);
          };
          unmounts.add(unmount);
          ReactDOM.render(
            <LivePreview
              tag={tag}
              timeout={Number(get("LivePreviewDelay")) || 100}
              registerMouseEvents={({ open, close }) => {
                s.addEventListener("mouseover", (e) => open(e, modifier));
                s.addEventListener("mouseleave", close);
              }}
            />,
            parent
          );
          s.appendChild(parent);
        }
      },
    });
    addStyle(
      `.roamjs-workbench-live-preview>div>div>.rm-block-main,
.roamjs-workbench-live-preview>div>div>.rm-inline-references,
.roamjs-workbench-live-preview>div>div>.rm-block-children>.rm-multibar {
  display: none;
}

.roamjs-workbench-live-preview>div>div>.rm-block-children {
  margin-left: -4px;
}

.roamjs-workbench-live-preview {
  overflow-y: scroll;
}

.roamjs-workbench-livepreview-toolip.bp3-tooltip .bp3-popover-content, .bp3-tooltip .bp3-heading {
  color: black;
}

.roamjs-workbench-livepreview-toolip.bp3-tooltip .bp3-popover-content {
  background: white;
  padding: 0;
}`,
      "roamjs-workbench-livepreview-css"
    );
  } else {
    livePreviewObserver?.disconnect();
    unmounts.forEach((u) => u());
    document
      .querySelectorAll(`span[${LIVE_PREVIEW_ATTRIBUTE}=true]`)
      .forEach((s) => s.removeAttribute(LIVE_PREVIEW_ATTRIBUTE));
    document.getElementById("roamjs-workbench-livepreview-css")?.remove();
  }
};
