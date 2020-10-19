/* globals roam42 */

(()=>{
  roam42.common.getPageUidByTitle = async (title)=> {
    try {
      return await window.roamAlphaAPI.q(`[:find ?uid :where [?e :node/title "${title}"][?e :block/uid ?uid ] ]`)[0].toString();
    } catch(e) { return ''; }
  } 
})();  
