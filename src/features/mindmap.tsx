import addStyle from "roamjs-components/dom/addStyle";
import { OnloadArgs, TreeNode } from "roamjs-components/types/native";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import { addCommand } from "./workBench";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import {
  Button,
  Classes,
  Dialog,
  Drawer,
  Intent,
  Label,
  MenuItem,
  Position,
} from "@blueprintjs/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ITransformResult, Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS, refreshHook } from "markmap-view";
import { format } from "date-fns";
import fileSaver from "file-saver";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";

const transformer = new Transformer();
const CLASSNAME = "roamjs-markmap-class";
const NODE_CLASSNAME = "roamjs-mindmap-node";
const SVG_ID = "roamjs-markmap";
const RENDERED_TODO =
  '<span><label class="check-container"><input type="checkbox" disabled=""><span class="checkmark"></span></label></span>';
const RENDERED_DONE =
  '<span><label class="check-container"><input type="checkbox" checked="" disabled=""><span class="checkmark"></span></label></span>';
const IMAGE_REGEX = /<img src="(.*?)" alt="">/;

const transformRoot = ({ root }: Partial<ITransformResult>) => {
  if (root.c) {
    root.c = root.c.filter((child) => child.v !== "" || child.c?.length);
    root.c.forEach((child) => transformRoot({ root: child }));
  }
  root.v = root.v
    .replace(/{{(?:\[\[)?TODO(?:\]\])?}}/g, (s) => RENDERED_TODO)
    .replace(/{{(?:\[\[)?DONE(?:\]\])?}}/g, (s) => RENDERED_DONE);
  if (IMAGE_REGEX.test(root.v) && root.p) {
    root.p.s = [300, 300];
  }
};

const shiftClickListener = (e: MouseEvent) => {
  if (e.shiftKey) {
    const target = e.target as HTMLElement;
    if (target.tagName === "SPAN" && target.className === NODE_CLASSNAME) {
      const blockUid = target.getAttribute("data-block-uid");
      const baseUrl = window.location.href.replace(/\/page\/.*$/, "");
      window.location.assign(`${baseUrl}/page/${blockUid}`);
    }
  }
};

const EXPORT_FORMATS = ["PNG", "OPML"] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

const ImagePreview = ({ src }: { src: string }): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen]);
  return (
    <>
      <style>
        {`.roamjs-img-dialog {
  z-index: 2100;
}
.roamjs-img-dialog .bp3-dialog {
  position: absolute;
  top: 32px;
  bottom: 32px;
  left: 32px;
  right: 32px;
  width: unset;
  background-color: transparent;
}`}
      </style>
      <img src={src} onClick={onClick} data-roamjs-image-preview />
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        portalClassName={"roamjs-img-dialog"}
        style={{ paddingBottom: 0 }}
        canEscapeKeyClose
        canOutsideClickClose
      >
        <img src={src} onClick={onClose} />
      </Dialog>
    </>
  );
};

const MarkmapPanel: React.FunctionComponent<
  RoamOverlayProps<{
    getMarkdown: () => string;
  }>
> = ({ getMarkdown, isOpen, onClose }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const openExport = useCallback(
    () => setIsExportOpen(true),
    [setIsExportOpen]
  );
  const closeExport = useCallback(
    () => setIsExportOpen(false),
    [setIsExportOpen]
  );
  const [loaded, setLoaded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const expand = useCallback(() => setIsFullScreen(true), [setIsFullScreen]);
  const collapse = useCallback(() => setIsFullScreen(false), [setIsFullScreen]);
  const markmapRef = useRef<Markmap>(null);
  const unload = useCallback(() => {
    Array.from(document.getElementsByClassName(CLASSNAME)).forEach((e) =>
      e.parentElement.removeChild(e)
    );
    markmapRef.current.destroy();
  }, [markmapRef]);
  const loadMarkmap = useCallback(() => {
    const { root, features } = transformer.transform(getMarkdown());
    const { styles, scripts } = transformer.getUsedAssets(features);
    styles.forEach(({ type, data }) => {
      if (type === "stylesheet") {
        data["class"] = CLASSNAME;
      }
    });
    scripts.forEach(({ type, data }) => {
      if (type === "script") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data["class"] = CLASSNAME;
      }
    });
    loadCSS(styles);
    loadJS(scripts, { getMarkmap: () => ({ refreshHook }) });
    // markmapRef.current = Markmap.create(`#${SVG_ID}`, null, root);
    markmapRef.current = new Markmap(`#${SVG_ID}`, null);
    markmapRef.current.state.data = root;
    markmapRef.current.initializeData(root);
    transformRoot({ root });
    markmapRef.current.renderData();
    markmapRef.current.fit();
  }, [markmapRef, getMarkdown]);
  const containerRef = useRef<HTMLDivElement>(null);
  const refresh = useCallback(() => {
    unload();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", SVG_ID);
    svg.setAttribute("style", "width: 100%; height: 100%");
    containerRef.current.insertBefore(svg, containerRef.current.firstChild);
    loadMarkmap();
  }, [loadMarkmap, unload, containerRef]);
  const close = useCallback(() => {
    setLoaded(false);
    unload();
    const article = document.getElementsByClassName(
      "roam-article"
    )[0] as HTMLDivElement;
    article.style.paddingBottom = "120px";
    onClose();
  }, [setLoaded, unload, onClose]);
  useEffect(() => {
    if (isOpen) {
      setLoaded(true);
      document.addEventListener("click", shiftClickListener);
      window.addEventListener("popstate", refresh);
      return () => {
        document.removeEventListener("click", shiftClickListener);
        window.removeEventListener("popstate", refresh);
      };
    }
  }, [setLoaded, isOpen]);
  useEffect(() => {
    if (containerRef.current && loaded) {
      const overlay = containerRef.current.closest(
        ".bp3-overlay-container"
      ) as HTMLDivElement;
      const content = containerRef.current.closest(
        ".bp3-overlay-content"
      ) as HTMLDivElement;
      if (overlay && content) {
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "2000";
        content.style.pointerEvents = "initial";
        const height = content.offsetHeight;
        const article = document.getElementsByClassName(
          "roam-article"
        )[0] as HTMLDivElement;
        article.style.paddingBottom = `${height + 120}px`;
        loadMarkmap();
      }
    }
  }, [containerRef.current, loaded, loadMarkmap]);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>(
    EXPORT_FORMATS[0]
  );
  const exporter = useCallback(async () => {
    const filename = `${format(
      new Date(),
      "yyyyMMddhhmmss"
    )}_mindmap.${activeFormat.toLowerCase()}`;
    if (activeFormat === "PNG") {
      const svgElement = document.getElementById(SVG_ID);

      const canvas = document.createElement("canvas");
      canvas.width = svgElement.parentElement.offsetWidth;
      canvas.height = svgElement.parentElement.offsetHeight;
      const ctx = canvas.getContext("2d");
      const data = new XMLSerializer().serializeToString(svgElement);
      const img = new Image(canvas.width, canvas.height);
      img.onload = () => {
        document.body.appendChild(canvas);
        document.body.appendChild(img);
        // hack to allow image to paint on safari
        setTimeout(() => {
          ctx.drawImage(img, 0, 0);
          const uri = canvas.toDataURL("image/png");
          fileSaver(uri, filename);
          img.remove();
          canvas.remove();
        }, 1);
      };
      img.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(data)}`;
    } else if (activeFormat === "OPML") {
      const uid =
        await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
      const title = getPageTitleByPageUid(uid) || getTextByBlockUid(uid);
      const tree = getFullTreeByParentUid(uid);
      tree.text = tree.text || title;
      const toOpml = (node: TreeNode): string =>
        `<outline text="${resolveRefs(node.text)
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}">${node.children
          .map(toOpml)
          .join("")}</outline>`;
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
<head>
<title>${title}</title>
</head>
<body>
${toOpml(tree)}
</body>
</opml>`;
      fileSaver(content, filename);
    }
  }, [activeFormat]);
  useEffect(() => {
    if (containerRef.current) {
      const content = containerRef.current.closest(
        ".bp3-overlay-content"
      ) as HTMLDivElement;
      if (content) {
        if (isFullScreen) {
          content.style.top = "0";
          content.style.height = "100%";
        } else {
          content.style.top = null;
          content.style.height = null;
        }
        refresh();
      }
    }
  }, [isFullScreen, containerRef, refresh]);
  return (
    <Drawer
      onClose={close}
      title="Mind map Panel"
      isOpen={isOpen}
      position={Position.BOTTOM}
      hasBackdrop={false}
      canOutsideClickClose={false}
      canEscapeKeyClose
      enforceFocus={false}
      autoFocus={false}
    >
      <div
        id={"roamjs-mindmap-container"}
        ref={containerRef}
        style={{ height: "100%", position: "relative" }}
      >
        <svg id={SVG_ID} style={{ width: "100%", height: "100%" }} />
        <style>
          {`.roamjs-mindmap-exporter {
  z-index: 2000;
}`}
        </style>
        <Dialog
          isOpen={isExportOpen}
          onClose={closeExport}
          title={"Export Mind map"}
          portalClassName={"roamjs-mindmap-exporter"}
        >
          <div className={Classes.DIALOG_BODY}>
            <Label>
              Format
              <MenuItemSelect
                activeItem={activeFormat}
                onItemSelect={(i) => setActiveFormat(i)}
                items={[...EXPORT_FORMATS]}
                popoverProps={{ portalClassName: "roamjs-mindmap-exporter" }}
                ButtonProps={{
                  // blueprint select still uses popover 1, which has a bug of not putting the class name on the actual portal
                  onClick: () =>
                    setTimeout(() => {
                      Array.from(
                        document.getElementsByClassName(
                          "roamjs-mindmap-exporter"
                        )
                      )
                        .map((d) => d.closest(".bp3-portal") as HTMLDivElement)
                        .filter((d) => !!d)
                        .forEach((d) => (d.style.zIndex = "2000"));
                    }, 1),
                }}
              />
            </Label>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                intent={Intent.PRIMARY}
                text={"Export"}
                onClick={exporter}
              />
            </div>
          </div>
        </Dialog>
        <Button
          minimal
          icon={"export"}
          onClick={openExport}
          style={{ position: "absolute", top: 8, right: 100 }}
        />
        <Button
          minimal
          icon={"refresh"}
          onClick={refresh}
          style={{ position: "absolute", top: 8, right: 54 }}
        />
        <Button
          minimal
          icon={isFullScreen ? "collapse-all" : "fullscreen"}
          onClick={isFullScreen ? collapse : expand}
          style={{ position: "absolute", top: 8, right: 8 }}
        />
      </div>
    </Drawer>
  );
};

const toMarkdown = ({ c, i }: { c: TreeNode; i: number }): string =>
  `${"".padStart(i * 4, " ")}- ${
    c.heading ? `${"".padStart(c.heading, "#")} ` : ""
  }<span class="${NODE_CLASSNAME} roamjs-block-view" data-block-uid="${
    c.uid
  }" id="roamjs-mindmap-node-${c.uid}">${resolveRefs(c.text.trim()).replace(
    /\^\^(.*?)\^\^/,
    (_, inner) => `<span class="rm-highlight">${inner}</span>`
  )}</span>${c.children
    .filter((nested) => !!nested.text || nested.children.length)
    .map((nested) => `\n${toMarkdown({ c: nested, i: i + 1 })}`)
    .join("")}`;

const expandEmbeds = (c: TreeNode) => {
  c.children.forEach(expandEmbeds);
  c.text = c.text.replace(
    /({{(?:\[\[)?embed(?:\]\]): \(\((..........?)\)\)}})/,
    (_, __, blockuid) => {
      const newNodes = getFullTreeByParentUid(blockuid);
      c.children.push(...newNodes.children);
      return newNodes.text;
    }
  );
};

const replaceTags = (c: TreeNode) => {
  c.children.forEach(replaceTags);
  c.text = c.text.replace(
    /#([\w\d/_-]*)/,
    (_, tag) =>
      `<span class="rm-page-ref--tag" data-tag="${tag}">#${tag}</span>`
  );
};

const hideTagChars = (c: TreeNode) => {
  c.children.forEach(hideTagChars);
  c.text = c.text.replace(/#|\[\[|\]\]/g, "");
};

const hideImageText = (c: TreeNode) => {
  c.children.forEach(hideImageText);
  c.text = c.text.replace(/!\[\]\((.*?)\)/, "");
};

const getMarkdown = (): string => {
  const match = window.location.href.match("/page/(.*)$");
  const uid = match
    ? match[1]
    : window.roamAlphaAPI.util.dateToPageUid(new Date());
  const nodes = getFullTreeByParentUid(uid).children;
  nodes.forEach((c) => expandEmbeds(c));
  nodes.forEach((c) => replaceTags(c));
  // const hideTags = config.some((t) => /hide tags/i.test(t.text));
  // if (hideTags) {
  //   nodes.forEach((c) => hideTagChars(c));
  // }
  // const hideImages = config.some((t) => /hide images/i.test(t.text));
  // if (hideImages) {
  //   nodes.forEach((c) => hideImageText(c));
  // }
  return nodes.map((c) => toMarkdown({ c, i: 0 })).join("\n");
};

const unloads = new Set<() => void>();
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  if (flag) {
    const style = addStyle(`span.${NODE_CLASSNAME} {
    width: 300px;
    display: inline-block;
    word-break: break-word;
    white-space: normal;
  }
  
  span.${NODE_CLASSNAME} img {
    max-width: 300px;
    max-height: 300px;
  }
  `);
    style.remove();

    unloads.add(
      addCommand(
        {
          label: "Open Mind map",
          callback: () => {
            renderOverlay({
              Overlay: MarkmapPanel,
              props: {
                getMarkdown,
              },
            });
          },
        },
        extensionAPI
      )
    );

    const imagePreviewObserver = createHTMLObserver({
      tag: "span",
      className: NODE_CLASSNAME,
      useBody: true,
      callback: (s: HTMLSpanElement) => {
        Array.from(s.getElementsByTagName("img"))
          .filter((i) => !i.hasAttribute("data-roamjs-image-preview"))
          .forEach((i) => {
            const span = document.createElement("span");
            i.parentElement.insertBefore(span, i);
            ReactDOM.render(<ImagePreview src={i.src} />, span);
            i.remove();
          });
      },
    });
    unloads.add(() => imagePreviewObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
