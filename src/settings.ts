import { getBlocksReferringToThisPage } from "./commonFunctions";

export const get = (settingName: string) => {
  let customTrigger = getBlocksReferringToThisPage("42Setting");
  var result = null;
  for (let s of customTrigger) {
    if (s[0].string.toString().includes(settingName)) {
      result = s[0].string
        .toString()
        .replace("#42Setting ", "")
        .replace("#[[42Setting]] ", "")
        .replace(settingName, "")
        .trim();
      break;
    }
  }
  return result;
};
