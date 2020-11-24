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
 
  roam42.common.isPage = async (title)=> {
    try {   
      var page = await window.roamAlphaAPI.q(`
          [:find ?e 
              :where [?e :node/title "${title}"]]`);

      return page.length > 0 ? true: false;
    } catch(e) { return ''; }
  } 

  roam42.common.isBlockRef = async (uid)=> {
    try {   
      if (uid.startsWith("((")) {
        uid = uid.slice(2, uid.length);
        uid = uid.slice(0, -2);      
      }

      var block_ref = await window.roamAlphaAPI.q(`
          [:find ?e 
              :where [?e :block/uid "${uid}"]]`);

      return block_ref.length > 0 ? true: false;
    } catch(e) { return ''; }
  } 

  roam42.common.getPageNamesFromBlockUidList =async  (blockUidList)=> {
    //blockUidList ex ['sdfsd', 'ewfawef']
    var rule = '[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]';
    var query = `[:find  (pull ?block [:block/uid :block/string])(pull ?page [:node/title :block/uid])
                                     :in $ [?block_uid_list ...] %
                                     :where
                                      [?block :block/uid ?block_uid_list]
                                     [?page :node/title]
                                     (ancestor ?block ?page)]`;
    var results = await window.roamAlphaAPI.q(query, blockUidList, rule);
    return results;
  }  
  
  roam42.common.getBlocksReferringToThisPage = async (title)=> {
    try {   
      return await window.roamAlphaAPI.q(`
          [:find (pull ?refs [:block/string :block/uid {:block/children ...}]) 
              :where [?refs :block/refs ?title][?title :node/title "${title}"]]`);
    } catch(e) { return ''; }
  } 

  roam42.common.getBlocksReferringToThisBlockRef = async (uid)=> {
    try {   
      return await window.roamAlphaAPI.q(`
          [:find (pull ?refs [:block/string :block/uid {:block/children ...}]) 
              :where [?refs :block/refs ?block][?block :block/uid "${uid}"]]`);
    } catch(e) { return ''; }
  } 

  roam42.common.pageExists = async (page_title)=>{
    var results = await window.roamAlphaAPI.q(`[:find ?e :where [?e :node/title "${page_title}"]]`);
    if (results.length == 0) {
      return false;
    }

    return true;
  }

  roam42.common.getRandomPage = async ()=>{
    var results = await window.roamAlphaAPI.q(`[:find [(rand 1 ?page)] :where [?e :node/title ?page]]`);
    return results;
  }

  roam42.common.getRandomBlock = async ()=>{
    var results = await window.roamAlphaAPI.q(`[:find [(rand 1 ?blocks)] :where [?e :block/uid ?blocks]]`);
    return results
  }
  
  roam42.common.getRandomBlockMentioningPage = async (page_title)=>{
    var results = await roam42.common.getBlocksReferringToThisPage(page_title);
    if (results.length == 0) {
      return "";
    }

    var random_result = results[Math.floor(Math.random() * results.length)];
    return random_result[0].uid
  }

  roam42.common.getRandomBlockMentioningBlockRef = async (block_ref)=>{
    if (block_ref.startsWith("((")) {
      block_ref = block_ref.slice(2, block_ref.length);
      block_ref = block_ref.slice(0, -2);      
    }
    
    var results = await roam42.common.getBlocksReferringToThisBlockRef(block_ref);
    if (results.length == 0) {
      return "";
    }

    var random_result = results[Math.floor(Math.random() * results.length)];
    return random_result[0].uid
  }

  roam42.common.getRandomBlockFromPage = async (page_title)=>{
    var rule = '[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]';

    var query = `[:find  (pull ?block [:block/uid])
                                 :in $ ?page_title %
                                 :where
                                 [?page :node/title ?page_title]
                                 (ancestor ?block ?page)]`;

    var results = await window.roamAlphaAPI.q(query, page_title, rule);
    var random_result = results[Math.floor(Math.random() * results.length)];

    return random_result[0].uid;
  }

  roam42.common.getRandomBlockFromBlock = async (uid)=>{
    if (uid.startsWith("((")) {
      uid = uid.slice(2, uid.length);
      uid = uid.slice(0, -2);      
    }

    var rule = '[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]';

    var query = `[:find  (pull ?block [:block/uid])
                                 :in $ ?uid %
                                 :where
                                 [?page :block/uid ?uid]
                                 (ancestor ?block ?page)]`;

    var results = await window.roamAlphaAPI.q(query, uid, rule);
    var random_result = results[Math.floor(Math.random() * results.length)];

    return random_result[0].uid;
  }

  window.roam42.common.testingReloadDatalog = () => {
    roam42.loader.addScriptToPage( "smartBlocks", roam42.host + 'common/commonDatalog.js');
  };  

})();  
