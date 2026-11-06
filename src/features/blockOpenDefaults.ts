import getUidsFromId from "roamjs-components/dom/getUidsFromId";
import { render as renderToast } from "roamjs-components/components/Toast";

type PaletteCommand = {
  label: string;
  callback: () => Promise<void>;
};

const getSelectedBlockUids = (): string[] => {
  const ui = window.roamAlphaAPI.ui as typeof window.roamAlphaAPI.ui & {
    multiselect?: { getSelected: () => { "block-uid": string }[] };
  };
  const selected = [
    ...(ui.multiselect?.getSelected() ?? []).map((b) => b["block-uid"]),
    ...(ui.individualMultiselect?.getSelectedUids() ?? []),
  ];
  if (!selected.length) {
    document.querySelectorAll(".block-highlight-blue").forEach((element) => {
      const block = element.matches(".roam-block")
        ? element
        : element.querySelector(".roam-block");
      if (block?.id) selected.push(getUidsFromId(block.id).blockUid);
    });
  }
  return [...new Set(selected.filter(Boolean))];
};

const setBlockOpenDefaults = async ({
  uids,
  open,
}: {
  uids: string[];
  open: boolean;
}): Promise<void> => {
  if (!uids.length) {
    renderToast({
      id: "workbench-block-open-default",
      intent: "warning",
      content: "Select or focus a block first.",
    });
    return;
  }
  try {
    for (const uid of uids) {
      await window.roamAlphaAPI.data.block.update({ block: { uid, open } });
    }
    renderToast({
      id: "workbench-block-open-default",
      intent: "success",
      content: `Shared default set to ${open ? "expanded" : "collapsed"} for ${
        uids.length
      } ${uids.length === 1 ? "block" : "blocks"}.`,
      timeout: 3000,
    });
  } catch {
    renderToast({
      id: "workbench-block-open-default",
      intent: "danger",
      content:
        "Could not update every block's shared default. Some blocks may have been changed.",
    });
  }
};

export const registerBlockOpenDefaults = ({
  addPaletteCommand,
}: {
  addPaletteCommand: (command: PaletteCommand) => () => void;
}): (() => void) => {
  const { blockContextMenu, msContextMenu } = window.roamAlphaAPI.ui;
  const unloads: (() => void)[] = [];
  for (const open of [false, true]) {
    const label = `Set shared default to ${open ? "expanded" : "collapsed"}`;
    unloads.push(
      addPaletteCommand({
        label,
        callback: async () => {
          const selected = getSelectedBlockUids();
          const focused =
            window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
          await setBlockOpenDefaults({
            uids: selected.length ? selected : focused ? [focused] : [],
            open,
          });
        },
      }),
    );
    const menuLabel = `(WB) ${label}`;
    blockContextMenu.addCommand({
      label: menuLabel,
      callback: async (context) => {
        if (context["read-only?"]) return;
        const uid = context["block-uid"];
        const selected = getSelectedBlockUids();
        await setBlockOpenDefaults({
          uids: selected.includes(uid) ? selected : uid ? [uid] : [],
          open,
        });
      },
    });
    msContextMenu.addCommand({
      label: menuLabel,
      callback: async () =>
        setBlockOpenDefaults({ uids: getSelectedBlockUids(), open }),
    });
    unloads.push(
      () => blockContextMenu.removeCommand({ label: menuLabel }),
      () => msContextMenu.removeCommand({ label: menuLabel }),
    );
  }
  return () => unloads.forEach((unload) => unload());
};
