/* globals roam42 */

(()=>{

	roam42.common.createUid = ()=>{
		//based on https://github.com/ai/nanoid#js version 3.1.2
		//Roam Research confirmed this library, 9 characters long
		let nanoid=(t=21)=>{let e="",r=crypto.getRandomValues(new Uint8Array(t));for(;t--;){let n=63&r[t];e+=n<36?n.toString(36):n<62?(n-26).toString(36).toUpperCase():n<63?"_":"-"}return e};
		return nanoid(9);
	}

	//API DOCS: https://roamresearch.com/#/app/help/page/0Xd0lmIrF

	roam42.common.createBlock = async (parent_uid, block_order, block_string)=> {
		parent_uid = parent_uid.replace('((','').replace('))','');
		let newUid = roam42.common.createUid();
		await window.roamAlphaAPI.createBlock(
					{	location: {	"parent-uid": parent_uid, order: block_order }, 
						block: 		{ string: block_string.toString() , uid: newUid}
					});
		await roam42.common.sleep(10); //seems a brief pause is need for DB to register the write
		return newUid;
	}

	roam42.common.createSiblingBlock = async (fromUID, newBlockText, bBelow = true )=> {
		//fromUID -- adds at sibling level below this block {order: 2, parentUID: "szmOXpDwT"}
		//this is not an efficient method for bulk inserting
		fromUID = fromUID.replace('((','').replace('))','');
		var blockInfo = await roam42.common.getDirectBlockParentUid(fromUID);
		var orderValue = bBelow ?  1 : 0;
		return await roam42.common.createBlock( blockInfo.parentUID, Number(blockInfo.order) + orderValue, newBlockText.toString() );
	}

	roam42.common.batchCreateBlocks = async (parent_uid, starting_block_order, string_array_to_insert)=> {
		parent_uid = parent_uid.replace('((','').replace('))','');
		await string_array_to_insert.forEach( async (item, counter) => {
				await roam42.common.createBlock(parent_uid, counter+starting_block_order, item.toString()) 
		});
	}

	roam42.common.moveBlock = async (parent_uid, block_order, block_to_move_uid)=> {
		parent_uid = parent_uid.replace('((','').replace('))','');
		return window.roamAlphaAPI.moveBlock(
						{	location: {	"parent-uid": parent_uid, order: block_order }, 
							block: 		{ uid: block_to_move_uid}
						});
	}	
	roam42.common.updateBlock = async (block_uid, block_string, block_expanded=true )=> {
		block_uid = block_uid.replace('((','').replace('))','');
		return window.roamAlphaAPI.updateBlock(
						{	block: { uid: block_uid, string: block_string.toString(), open: block_expanded } });
	}

	roam42.common.deleteBlock = async (block_uid)=> {
		block_uid = block_uid.replace('((','').replace('))','');
		return window.roamAlphaAPI.deleteBlock({block:{uid:block_uid}});
	}
	
	roam42.common.createPage = async (page_title)=> {
		return window.roamAlphaAPI.createPage({page:{title:page_title.toString() }});
	}

	roam42.common.updatePage = async (page_uid, page_new_title)=> {
		return window.roamAlphaAPI.updatePage({page:{uid:page_uid, title: page_new_title}});
	}		

	roam42.common.deletePage = async (page_uid)=> {
		return window.roamAlphaAPI.deletePage({page:{uid:page_uid}});
	}		


	//returns the direct parent block  {order: 2, parentUID: "szmOXpDwT"} 
  roam42.common.getDirectBlockParentUid = async (uid) => {
		var r = await window.roamAlphaAPI.q(`[:find ?uid ?order 
							:where  [?cur_block :block/uid "${uid}"]
											[?cur_block :block/order ?order]
											[?parent :block/children ?cur_block]
											[?parent :block/uid ?uid]
											[?cur_block :block/page ?page]]`);
		return r.length>0 ? {order: r[0][1], parentUID: r[0][0] } : null;
  }

	//gets all parent blocks up to the root
  roam42.common.getBlockParentUids = async (uid) => {
    try {
      var parentUIDs = await window.roamAlphaAPI.q(`[:find (pull ?block [{:block/parents [:block/uid]}]) :in $ [?block-uid ...] :where [?block :block/uid ?block-uid]]`,[uid])[0][0];
			var UIDS = parentUIDs.parents.map(e=> e.uid)
			UIDS.shift();
      return await roam42.common.getPageNamesFromBlockUidList(UIDS)
    } catch (e) { return ''; }
  }

  roam42.common.getPageUidByTitle = async (title)=> {
    try {
      return await window.roamAlphaAPI.q(`[:find ?uid :where [?e :node/title "${title}"][?e :block/uid ?uid ] ]`)[0].toString();
    } catch(e) { return ''; }
  }

  roam42.common.getBlockByPhrase = async (search_phrase)=> {
    var blocks = await window.roamAlphaAPI.q(`[:find (pull ?e [:block/uid :block/string] ) :where [?e :block/string ?contents][(clojure.string/includes? ?contents "${search_phrase}")]]`);
    return blocks;
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

  roam42.common.getBlockInfoByUID = async (uid, withChildren=false, withParents=false)=>{
    try {
      let q = `[:find (pull ?page
                     [:node/title :block/string :block/uid :block/heading :block/props 
                      :entity/attrs :block/open :block/text-align :children/view-type
                      :block/order
                      ${withChildren ? '{:block/children ...}' : '' }
                      ${withParents ? '{:block/parents ...}' : '' }
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
          [:find (pull ?e [:block/string])
              :where [?e :block/uid "${uid}"]]`);

      return (block_ref.length > 0 && block_ref[0][0] != null) ? true: false;
    } catch(e) { return ''; }
  }

  roam42.common.isPageRef = async (uid)=> {
    try {
      if (uid.startsWith("((")) {
        uid = uid.slice(2, uid.length);
        uid = uid.slice(0, -2);
      }

      var block_ref = await window.roamAlphaAPI.q(`
          [:find (pull ?e [:node/title])
              :where [?e :block/uid "${uid}"]]`);

      return (block_ref.length > 0 && block_ref[0][0] != null) ? true: false;
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
    roam42.loader.addScriptToPage( "commonDatalog", roam42.host + 'common/commonDatalog.js');
  };

})();
