//based on typeahead http://www.runningcoder.org/jquerytypeahead/documentation/

;(async ()=>{
	roam42.stats = {};

	//some stats based on work of zsolt: https://roamresearch.com/#/app/Zsolt-Blog/page/WUn5PuTDV

	const queryNonCodeBlocks = `[:find (count ?s) . :with ?e  :where [?e :block/string ?s]  
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
  								 [(clojure.string/starts-with? ?s ":q ")]))]`;

	const queryNonCodeBlockCharacters = `[:find (sum ?size) . :with ?e :where  
					(or-join [?s ?e] (and [?e :block/string ?s] 
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
  								 [(clojure.string/starts-with? ?s ":q ")]))) 
					[?e :node/title ?s]) [(count ?s) ?size]]`;


let queryNonCodeBlockWords = `[:find (sum ?n) :with ?e :where (or-join [?s ?e]
	            (and [?e :block/string ?s]
								(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")]
												[(clojure.string/starts-with? ?s "{{")]
												[(clojure.string/starts-with? ?s "<%")]
												[(clojure.string/starts-with? ?s ":q ")])))
								[?e :node/title ?s])
							[(re-pattern "${String.fromCharCode(91,92,92,119,39,93,43)}") ?pattern]
							[(re-seq ?pattern ?s) ?w]
							[(count ?w) ?n]]`;

	const queryCodeBlocks = `[:find (count ?s) . :with ?e  :where [?e :block/string ?s] 
					(or  [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")]
							 [(clojure.string/starts-with? ?s "{{")]
							 [(clojure.string/starts-with? ?s "<%")]
							 [(clojure.string/starts-with? ?s ":q ")])]`;

	const queryCodeBlockCharacters = `[:find (sum ?size) . :with ?e :where [?e :block/string ?s] 
					(or  [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")]
							 [(clojure.string/starts-with? ?s "{{")]
							 [(clojure.string/starts-with? ?s "<%")]
							 [(clojure.string/starts-with? ?s ":q ")]) 
					[(count ?s) ?size]]`;

	const queryBlockquotes = `[:find (count ?s) . :with ?e :where [?e :block/string ?s][(clojure.string/starts-with? ?s "> ")]]`;

	const queryFireBaseAttachements= `[:find (count ?e) . :where [?e :block/string ?s][(clojure.string/includes? ?s "https://firebasestorage.googleapis.com")]]`;

	const queryExternalLinks = `[:find (count ?e) . :where [?e :block/string ?s] (not [(clojure.string/includes? ?s "https://firebasestorage.googleapis.com")]) (or [(clojure.string/includes? ?s "https://")] [(clojure.string/includes? ?s "https://")])]`;

	roam42.stats.displayGraphStats = async ()=> {		
		console.log('roam42.stats.displayGraphStats')
		roam42.help.displayMessage(`
		Graph Database stats <br/>
		========================== <br/><br/>
		Pages:  ${await roamAlphaAPI.q('[:find (count ?p) :where [?p :node/title _]]')[0]} <br/><br/>
		Text Blocks / Words / Characters:<br/> 
		${await roamAlphaAPI.q(queryNonCodeBlocks)} / ${await roamAlphaAPI.q(queryNonCodeBlockWords)} /  ${await roamAlphaAPI.q(queryNonCodeBlockCharacters)} <br/><br/>
		Code Blocks / Characters:<br/> 
		${await roamAlphaAPI.q(queryCodeBlocks)} / ${await roamAlphaAPI.q(queryCodeBlockCharacters)} <br/><br/>
		Block Quotes: ${await roamAlphaAPI.q(queryBlockquotes)} <br/><br/>
		
		Interconnections (refs):  ${await roamAlphaAPI.q('[:find (count ?r) . :with ?e :where [?e :block/refs ?r] ]]')} <br/><br/>

		TODO: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "TODO"][?be :block/refs ?e]]')} <br/>
		DONE: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "DONE"][?be :block/refs ?e]]')} <br/>
		query: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "query"][?be :block/refs ?e]]')} <br/>
		embed: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "embed"][?be :block/refs ?e]]')} <br/>
		table: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "table"][?be :block/refs ?e]]')} <br/>
		kanban: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "kanban"][?be :block/refs ?e]]')} <br/>
		video: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "video"][?be :block/refs ?e]]')} <br/>
		roam/js: ${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "roam/js"][?be :block/refs ?e]]')} <br/>

		<br/>
		Firebase Links: ${await roamAlphaAPI.q(queryFireBaseAttachements)} <br/>
		http Links: ${await roamAlphaAPI.q(queryExternalLinks)} <br/>

		<br/><br/>
		<a href="https://roamresearch.com/#/app/Zsolt-Blog/page/WUn5PuTDV" target=_blank>Click for more info on method of calculations"</a>
		`,60000);

	}

  roam42.stats.testReload = ()=>{
    roam42.loader.addScriptToPage( 'roam42stats',  roam42.host + 'ext/stats.js'    );
		setTimeout(()=>{
				roam42.stats.displayGraphStats();
		},1000)
  }

})();



