import React from "react";
import { Classes, Dialog } from "@blueprintjs/core";
import updateBlock from "roamjs-components/writes/updateBlock";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import type { OnloadArgs } from "roamjs-components/types";
import { addCommand } from "./workBench";
import AutocompleteInput from "roamjs-components/components/AutocompleteInput";

type Entry = { word: string; definition: string; type: string };

export let enabled = false;

const dictionaries: Record<string, (s: string) => Promise<Entry[]>> = {
  default: (s: string) =>
    fetch(`https://api.datamuse.com/sug?s=${s}&md=dp`)
      .then((res) => res.json())
      .then((e) => e as Entry[]),
  wordnet: (s: string) =>
    fetch(`https://wordnet.glitch.me/query?search=${s}`)
      .then((res) => res.json())
      .then((e) => e as Entry[]),
};

const onNewItem = (s: string) => ({ word: s, definition: "", type: "" });

const TypeAhead = ({
  uid,
  format = `**{word}** ({type})\n{definition}`,
  isOpen,
  onClose,
}: RoamOverlayProps<{ uid?: string; format?: string }>) => {
  const [value, setValue] = React.useState<Entry>();
  const [options, setOptions] = React.useState<Entry[]>([]);
  const timeoutRef = React.useRef(0);
  const formatEntry = React.useCallback(
    (e?: Entry) =>
      e
        ? format
            .replace(/{word}/g, e.word)
            .replace(/{type}/g, e.type)
            .replace(/{definition}/g, e.definition)
        : "",
    [format]
  );
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={"Workbench Dictionary"}>
      <div className={Classes.DIALOG_BODY}>
        <AutocompleteInput
          value={value}
          setValue={setValue}
          filterOptions={(opts, q) => {
            window.clearTimeout(timeoutRef.current);
            if (value) {
              timeoutRef.current = window.setTimeout(
                () => dictionaries.default(q).then(setOptions),
                500
              );
            }
            return opts;
          }}
          options={options}
          placeholder={"search"}
          itemToString={formatEntry}
          onNewItem={onNewItem}
          onConfirm={() => {
            if (!value) return;
            if (!uid) {
              renderToast({
                content: formatEntry(value),
                id: "roamjs-workbench-dict",
                position: "bottom-right",
              });
              onClose();
            } else {
              const existing = getTextByBlockUid(uid);
              updateBlock({
                text: `${existing}\n${formatEntry(value)}`,
                uid,
              }).then(onClose);
            }
          }}
          autoFocus
        />
      </div>
    </Dialog>
  );
};

export const typeAheadLookup = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  renderOverlay({ Overlay: TypeAhead, props: { uid } });
};

const unloads = new Set<() => void>();
export const toggleFeature = (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  enabled = flag;
  if (flag) {
    unloads.add(
      addCommand(
        {
          label: "Dictionary Lookup",
          callback: () => typeAheadLookup(),
          defaultHotkey: "alt-shift-.",
        },
        extensionAPI
      )
    );
  } else {
    document.getElementById("rmSearch")?.remove?.();
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
