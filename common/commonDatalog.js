/* globals roam42 */

(()=>{
  
  roam42.common.getPageUidByTitle = async (title)=> {
    try {
      return await window.roamAlphaAPI.q(`[:find ?uid :where [?e :node/title "${title}"][?e :block/uid ?uid ] ]`)[0].toString();
    } catch(e) { return ''; }
  } 
  
  roam42.common.currentPageUID = async ()=> {
    var uid = '';
    if(window.location.href.includes('page')) {
      uid = window.location.href.replace(roam42.common.baseUrl().href + '/','')
    } else {
      uid = await roam42.common.getPageUidByTitle(roam42.dateProcessing.getRoamDate(new Date()))
    }
    return uid;    
  }
  
  roam42.common.getBlockInfoByUID = async (uid, withChildren=false)=>{
    try {
      let q = `[:find (pull ?page 
                     [:node/title :block/string :block/uid :block/heading :block/props 
                      :entity/attrs :block/open :block/text-align :children/view-type
                      :block/order 
                      ${withChildren ? '{:block/children ...}' : '' }
                     ]) 
                  :where [?page :block/uid "${uid}"]  ]`;
        var results = await window.roamAlphaAPI.q(q);
        if(results.length == 0 ) return null;
        return results;
      } catch(e) {
        return null;
      }
  }
  
  roam42.common.getBlocksReferringToThisPage = async (title)=> {
    try {   
      return await window.roamAlphaAPI.q(`
          [:find (pull ?refs [:block/string :block/uid {:block/children ...}]) 
              :where [?refs :block/refs ?title][?title :node/title "${title}"]]`);
    } catch(e) { return ''; }
  } 
  
})();  
