import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  Classes,
  Dialog,
  InputGroup,
  Menu,
  MenuItem,
  PopoverPosition,
  Popover,
  Button,
  TextArea,
} from "@blueprintjs/core";
import updateBlock from "roamjs-components/writes/updateBlock";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import useArrowKeyDown from "roamjs-components/hooks/useArrowKeyDown";

// copied + pasted Autocomplete Input from RoamJS components bc there were
// a couple of minor differences that made it hard to use in this case

type Entry = { word: string; definition: string; type: string };

export type AutocompleteInputProps = {
  value: string;
  setValue: (q: string) => void;
  onConfirm?: (e: Entry) => void;
  options?: Entry[];
  placeholder?: string;
  autoFocus?: boolean;
};

const AutocompleteInput = ({
  value,
  setValue,
  onConfirm,
  options = [],
  placeholder = "Enter value",
  autoFocus,
}: AutocompleteInputProps): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const [isTyping, setIsTyping] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const { activeIndex, onKeyDown } = useArrowKeyDown<Entry>({
    onEnter: onConfirm,
    results: options,
    menuRef,
  });
  useEffect(() => {
    if (!options.length || !isTyping) close();
    else open();
  }, [options, close, open, isTyping]);
  return (
    <Popover
      portalClassName={"roamjs-autocomplete-input"}
      targetClassName={"roamjs-autocomplete-input-target"}
      captureDismiss={true}
      isOpen={isOpen}
      onOpened={open}
      minimal
      autoFocus={false}
      enforceFocus={false}
      position={PopoverPosition.BOTTOM_LEFT}
      modifiers={{
        flip: { enabled: false },
        preventOverflow: { enabled: false },
      }}
      content={
        <Menu className={"max-h-64 overflow-auto max-w-md"} ulRef={menuRef}>
          {options.map((t, i) => (
            <MenuItem
              text={
                <div>
                  <p>
                    <b>{t.word}</b> - <i>({t.type})</i>
                  </p>
                  <p>{t.definition}</p>
                </div>
              }
              active={activeIndex === i}
              key={i}
              multiline
              onClick={() => {
                onConfirm(t);
              }}
            />
          ))}
        </Menu>
      }
      target={
        <InputGroup
          value={value || ""}
          onChange={(e) => {
            setIsTyping(true);
            setValue(e.target.value);
          }}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            } else {
              onKeyDown(e);
            }
          }}
          onClick={() => setIsTyping(true)}
          onBlur={(e) => {
            if (
              e.relatedTarget === null ||
              !(e.relatedTarget as HTMLElement).closest?.(
                ".roamjs-autocomplete-input"
              )
            ) {
              setIsTyping(false);
            }
          }}
          inputRef={inputRef}
        />
      }
    />
  );
};

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
        500
      );
    }
  }, [value]);
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={"Workbench Dictionary"}>
      <div className={Classes.DIALOG_BODY}>
        <AutocompleteInput
          value={value}
          setValue={setValue}
          options={options}
          placeholder={"search"}
          onConfirm={(entry) => {
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
