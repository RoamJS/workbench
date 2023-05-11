import React from "react";
import { Classes, Dialog, MenuItem } from "@blueprintjs/core";
import updateBlock from "roamjs-components/writes/updateBlock";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import type { OnloadArgs } from "roamjs-components/types";
import { addCommand } from "./workBench";
import AutocompleteInput from "roamjs-components/components/AutocompleteInput";
import { get } from "../settings";
import extractRef from "roamjs-components/util/extractRef";
import isLiveBlock from "roamjs-components/queries/isLiveBlock";

type Entry = { word: string; definition: string; type: string };

export let enabled = false;

const dictionaries: Record<string, (s: string) => Promise<Entry[]>> = {
  default: (s: string) =>
    fetch(`https://api.datamuse.com/words?sp=${s}*&md=dp`)
      .then((res) => res.json())
      .then((e) =>
        (e as { word: string; tags?: string[]; defs?: string[] }[]).map((i) => {
          const type = i.tags?.[0] || "Unknown";
          return {
            word: i.word,
            type,
            definition: (i.defs?.[0] || "No definition found.").replace(
              new RegExp(`^${type}\\s`),
              ""
            ),
          };
        })
      ),
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
  const itemToQuery = React.useCallback((e?: Entry) => e?.word || "", []);
  const filterOptions = React.useCallback((opts: Entry[], q: string) => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () =>
        dictionaries.default(q).then((newOpts) => {
          if (
            opts.length !== newOpts.length ||
            !opts.every(
              (o, i) =>
                o.word === newOpts[i].word &&
                o.type === newOpts[i].type &&
                o.definition === newOpts[i].definition
            )
          ) {
            setOptions(newOpts);
          }
        }),
      500
    );
    return opts;
  }, []);
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={"Workbench Dictionary"}>
      <div className={Classes.DIALOG_BODY}>
        <AutocompleteInput
          value={value}
          setValue={setValue}
          filterOptions={filterOptions}
          options={options}
          placeholder={"search"}
          itemToQuery={itemToQuery}
          onNewItem={onNewItem}
          onConfirm={async () => {
            if (!value) return;
            const formatUid = extractRef(format);
            const handleLegacy = (format: string) => {
              const content = format
                .replace(/{word}/g, value.word)
                .replace(/{type}/g, value.type)
                .replace(/{definition}/g, value.definition);
              if (!uid) {
                renderToast({
                  content,
                  id: "roamjs-workbench-dict",
                  position: "bottom-right",
                });
                onClose();
              } else {
                const existing = getTextByBlockUid(uid);
                updateBlock({
                  text: `${existing}${content}`,
                  uid,
                }).then(onClose);
              }
            };
            if (isLiveBlock(formatUid)) {
              if (window.roamjs.extension.smartblocks) {
                window.roamjs.extension.smartblocks
                  .triggerSmartblock({
                    srcUid: formatUid,
                    targetUid:
                      uid ||
                      (await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid()) ||
                      window.roamAlphaAPI.util.dateToPageUid(new Date()),
                    variables: value,
                  })
                  .then(onClose);
              } else {
                handleLegacy(getTextByBlockUid(formatUid));
              }
            } else {
              handleLegacy(format);
            }
          }}
          autoFocus
          renderItem={({ item, onClick, active }) => {
            return (
              <MenuItem
                onClick={onClick}
                active={active}
                text={
                  <div>
                    <b className="block">{item?.word}</b>
                    <span>
                      <i>{item?.type}</i> {item?.definition}
                    </span>
                  </div>
                }
              />
            );
          }}
        />
      </div>
    </Dialog>
  );
};

export const typeAheadLookup = () => {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  const format = get("Dictionary format") || undefined;
  renderOverlay({ Overlay: TypeAhead, props: { uid, format } });
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
