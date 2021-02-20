//based on typeahead http://www.runningcoder.org/jquerytypeahead/documentation/

;(async ()=>{
	roam42.stats = {};

	roam42.stats.displayGraphStats = async ()=> {		
		console.log('roam42.stats.displayGraphStats')
		roam42.help.displayMessage(`
		Graph Database stats <br/>
		========================== <br/><br/>
		Total Pages:  ${await roamAlphaAPI.q('[:find (count ?p) :where [?p :node/title _]]')[0]} <br/><br/>
		Total Blocks: ${await roamAlphaAPI.q('[:find (count ?b) :where [?b :block/uid _]]')[0]} <br/><br/>
		Total Links:  ${await roamAlphaAPI.q('[:find (count ?r) :with ?b :where [?b :block/refs ?r]]')[0]} <br/><br/>
		Total Characters: ${
			Number(await roamAlphaAPI.q('[:find (sum ?size) :where [_ :block/string ?s] [(count ?s) ?size]]')[0]) + Number(await roamAlphaAPI.q('[:find (sum ?size) :where [_ :node/title ?s] [(count ?s) ?size]]')[0])} <br/><br/>

		Total TODO: ${(await roam42.common.getBlocksReferringToThisPage('TODO')).length} <br/>
		Total DONE: ${(await roam42.common.getBlocksReferringToThisPage('DONE')).length} <br/><br/>
		Total QUERY: ${(await roam42.common.getBlocksReferringToThisPage('query')).length} <br/><br/>
		Total roam/js: ${(await roam42.common.getBlocksReferringToThisPage('roam/js')).length} <br/><br/>
		`,60000);

	}

  roam42.stats.testReload = ()=>{
    roam42.loader.addScriptToPage( 'roam42stats',  roam42.host + 'ext/stats.js'    );
		setTimeout(()=>{
				roam42.stats.displayGraphStats();
		},1000)
  }

})();