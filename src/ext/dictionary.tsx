import AutocompleteInput from "roamjs-components/components/AutocompleteInput";
import React from "react";
import { Classes, Dialog } from "@blueprintjs/core";
import updateBlock from "roamjs-components/writes/updateBlock";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";

type Entry = { word: string; definition: string; type: string };

export let enabled = false;
const formatEntry = (d: Entry) => `**${d.word}** (${d.type})
${d.definition}`;

export const displayDataInToast = (d: Entry) => {
  renderToast({
    content: formatEntry(d),
    id: "roamjs-workbench-dict",
    position: "bottom-right",
  });
};

const TypeAhead = ({
  uid,
  isOpen,
  onClose,
}: RoamOverlayProps<{ uid?: string }>) => {
  const [value, setValue] = React.useState<string>();
  const [options, setOptions] = React.useState<Entry[]>([]);
  const timeoutRef = React.useRef(0);
  React.useEffect(() => {
    window.clearTimeout(timeoutRef.current);
    if (value) {
      timeoutRef.current = window.setTimeout(
        () =>
          fetch(`https://wordnet.glitch.me/query?search=${value}`)
            .then((res) => res.json())
            .then(setOptions),
        1000
      );
    }
  }, [value]);
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={"Workbench Dictionary"}>
      <div className={Classes.DIALOG_BODY}>
        <AutocompleteInput
          value={value}
          setValue={setValue}
          options={options.map((w) => w.word)}
          placeholder={"search"}
          onConfirm={() => {
            const entry = options.find((o) => o.word === value);
            if (!uid) {
              displayDataInToast(entry);
              onClose();
            } else {
              const existing = getTextByBlockUid(uid);
              updateBlock({
                text: existing
                  ? `${existing}\n${formatEntry(entry)}`
                  : formatEntry(entry),
                uid,
              }).then(onClose);
            }
          }}
          autoFocus
          // renderOption={typeaheadResult}
        />
      </div>
    </Dialog>
  );
};

export const typeAheadLookup = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  renderOverlay({ Overlay: TypeAhead, props: { uid } });
};

const keydownListener = (ev: KeyboardEvent) => {
  if (ev.altKey && ev.shiftKey && (ev.code == "Period" || ev.key == "˘")) {
    ev.preventDefault();
    ev.stopPropagation();
    typeAheadLookup();
  }
};

export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (flag) {
    document.addEventListener("keydown", keydownListener);
  } else {
    document.getElementById("rmSearch")?.remove?.();
    document.removeEventListener("keydown", keydownListener);
  }
};

// export const typeaheadResult = (d: Entry) => {
//   return `<div class="th-item">
//               <div class="th-term"> ${d.word}       </div>
//               <div class="th-def">  ${d.definition} </div>
//           </div>`;
// };
