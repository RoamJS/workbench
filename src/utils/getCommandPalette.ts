import { OnloadArgs } from "roamjs-components/types/native";

const getCommandPalette = (extensionAPI: OnloadArgs["extensionAPI"]) => {
  if (extensionAPI.ui) return extensionAPI.ui.commandPalette;
  return window.roamAlphaAPI.ui.commandPalette;
};

export default getCommandPalette;
