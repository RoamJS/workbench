import createIconButton from "roamjs-components/dom/createIconButton";
import createObserver from "roamjs-components/dom/createObserver";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import getFirstChildUidByBlockUid from "roamjs-components/queries/getFirstChildUidByBlockUid";
import createBlock from "roamjs-components/writes/createBlock";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import { createWorker } from "tesseract.js";

const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    const clickCallback = async (htmlTarget: HTMLElement) => {
      const imgContainer = htmlTarget.closest(".hoverparent");
      if (!imgContainer) return;
      const img = imgContainer.getElementsByTagName("img")[0];
      const editButton = imgContainer.getElementsByClassName(
        "bp3-icon-edit"
      )[0] as HTMLButtonElement;
      const { blockUid } = getUidsFromButton(editButton);
      const loadingUid = await createBlock({
        node: { text: "Loading..." },
        parentUid: blockUid,
      });

      const tesseractImage = document.createElement("img");
      const src = URL.createObjectURL(
        await fetch(img.src).then((r) => r.blob())
      );
      tesseractImage.src = src;
      tesseractImage.crossOrigin = "anonymous";

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const timeoutRef = window.setTimeout(() => {
        updateBlock({
          uid: loadingUid,
          text: "Timed out waiting for image to OCR",
        });
      }, 60000);
      tesseractImage.onload = async () => {
        if (!ctx) return;
        canvas.width = tesseractImage.width;
        canvas.height = tesseractImage.height;
        ctx.drawImage(tesseractImage, 0, 0);
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const {
          data: { text },
        } = await worker.recognize(canvas);
        await worker.terminate();
        const textBullets = text.split("\n");
        const bullets = [];
        let currentText = "";
        for (let b = 0; b < textBullets.length; b++) {
          const s = textBullets[b].trim();
          if (s) {
            currentText += ` ${s}`;
          } else {
            bullets.push(
              currentText.startsWith("* ") ||
                currentText.startsWith("- ") ||
                currentText.startsWith("— ")
                ? currentText.substring(2)
                : currentText
            );
            currentText = "";
          }
        }
        await Promise.all(
          bullets.map((text, order) =>
            createBlock({ node: { text }, parentUid: blockUid, order })
          )
        )
          .then(() => deleteBlock(loadingUid))
          .finally(() => window.clearTimeout(timeoutRef));
      };
      tesseractImage.onerror = (...e) => {
        console.log(e);
        updateBlock({
          uid: loadingUid,
          text: `Error: Failed to load image into OCR engine`,
        }).finally(() => window.clearTimeout(timeoutRef));
      };
    };
    const imageObserver = createObserver(() => {
      const imgs = Array.from(document.getElementsByTagName("img"));
      imgs
        .filter((i) => i.className === "rm-inline-img")
        .forEach((img) => {
          const imgContainer = img.closest(".hoverparent");
          if (
            imgContainer &&
            imgContainer.getElementsByClassName(
              "image-extraction-icon-container"
            ).length === 0
          ) {
            const button = createIconButton("search-text");
            button.onclick = (e: MouseEvent) => {
              clickCallback(e.target as HTMLElement);
              e.stopPropagation();
              e.preventDefault();
            };
            button.onmousedown = (e: MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
            };
            button.style.opacity = "0";
            const container = img.closest(".rm-inline-img__resize");
            if (container) {
              container.addEventListener(
                "mouseenter",
                () => (button.style.opacity = "1")
              );
              container.addEventListener(
                "mouseleave",
                () => (button.style.opacity = "0")
              );
            }

            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.right = "0px";
            div.style.top = "24px";
            div.style.zIndex = "10";
            div.className = "image-extraction-icon-container";
            div.appendChild(button);
            imgContainer.appendChild(div);
          }
        });
    });
    unloads.add(() => imageObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
