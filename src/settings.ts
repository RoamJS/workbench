// There are a bunch of legacy Roam42 features that uses this settings system - plan is to migrate those over time
// once I see which features actually get usage, then delete this file

import getBlockUidsAndTextsReferencingPage from "roamjs-components/queries/getBlockUidsAndTextsReferencingPage";

const normalizeSpaces = (value: string) =>
  value.replace(/[\u200B\u200C\u200D\uFEFF]/gu, "").replace(/\s+/gu, " ");

export const get = (settingName: string) => {
  let customTrigger = getBlockUidsAndTextsReferencingPage("42Setting");
  let result = null;

  for (let s of customTrigger) {
    const normalizedText = normalizeSpaces(s.text);
    if (normalizedText.includes(settingName)) {
      result = normalizedText
        .replace("#42Setting ", "")
        .replace("#[[42Setting]] ", "")
        .replace("[[42Setting]] ", "")
        .replace(settingName, "")
        .trim();
      break;
    }
  }
  return result;
};
