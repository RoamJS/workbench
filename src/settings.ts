// There are a bunch of legacy Roam42 features that uses this settings system - plan is to migrate those over time 
// once I see which features actually get usage, then delete this file

import getBlockUidsAndTextsReferencingPage from "roamjs-components/queries/getBlockUidsAndTextsReferencingPage";

export const get = (settingName: string) => {
  let customTrigger = getBlockUidsAndTextsReferencingPage("42Setting");
  var result = null;
  for (let s of customTrigger) {
    if (s.text.includes(settingName)) {
      result = s.text
        .replace("#42Setting ", "")
        .replace("#[[42Setting]] ", "")
        .replace(settingName, "")
        .trim();
      break;
    }
  }
  return result;
};
