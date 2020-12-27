/* globals roam42 */

(() => {
  roam42.settings = {};
  roam42.settings.get = async (settingName)=> {
    let  customTrigger = await roam42.common.getBlocksReferringToThisPage("42Setting");
    var result = null;
    for(let s of customTrigger) {
      if(s[0].string.toString().includes(settingName)) {
        result = s[0].string.toString().replace('#42Setting ','').replace('#[[42Setting]] ','').replace(settingName,'').trim();
        break;
      }
    }
    return result;
  }

  window.roam42.settings.testingReload= () => {
    roam42.loader.addScriptToPage( "settings", roam42.host + 'ext/settings.js');
    setTimeout(async ()=>  console.log( await roam42.settings.get("SmartBlockTrigger") ),1000)
  };
})();






