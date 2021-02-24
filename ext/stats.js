//roam42 stat.js

(async ()=>{
	roam42.stats = {};

	//some stats based on work of zsolt: https://roamresearch.com/#/app/Zsolt-Blog/page/WUn5PuTDV

	const queryNonCodeBlocks = `[:find (count ?s) . :with ?e  :where [?e :block/string ?s]  
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
									 [(clojure.string/starts-with? ?s"> ")]
									 [(clojure.string/starts-with? ?s"[[>]] ")]										 
  								 [(clojure.string/starts-with? ?s ":q ")]))]`;

	const queryNonCodeBlockWords = `[:find (sum ?n) :with ?e :where (or-join [?s ?e]
	            (and [?e :block/string ?s]
								(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")]
												[(clojure.string/starts-with? ?s "{{")]
												[(clojure.string/starts-with? ?s "<%")]
												[(clojure.string/starts-with? ?s"> ")]
												[(clojure.string/starts-with? ?s"[[>]] ")]										 
												[(clojure.string/starts-with? ?s ":q ")])))
								[?e :node/title ?s])
							[(re-pattern "${String.fromCharCode(91,92,92,119,39,93,43)}") ?pattern]
							[(re-seq ?pattern ?s) ?w]
							[(count ?w) ?n]]`;

	const queryNonCodeBlockCharacters = `[:find (sum ?size) . :with ?e :where  
					(or-join [?s ?e] (and [?e :block/string ?s] 
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(96,96,96)}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
									 [(clojure.string/starts-with? ?s"> ")]
									 [(clojure.string/starts-with? ?s"[[>]] ")]										 
  								 [(clojure.string/starts-with? ?s ":q ")]))) 
					[?e :node/title ?s]) [(count ?s) ?size]]`;


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

	const queryBlockquotes = `[:find (count ?s) . :with ?e :where [?e :block/string ?s](or [(clojure.string/starts-with? ?s"[[>]] ")] [(clojure.string/starts-with? ?s"> ")])]`;

	let queryBlockquotesWords = `[:find (sum ?n) :with ?e :where (or-join [?s ?e]
	            (and [?e :block/string ?s]
								(or [(clojure.string/starts-with? ?s"> ")]
										[(clojure.string/starts-with? ?s"[[>]] ")]))
							[?e :node/title ?s])
							[(re-pattern "${String.fromCharCode(91,92,92,119,39,93,43)}") ?pattern]
							[(re-seq ?pattern ?s) ?w]
							[(count ?w) ?n]]`;

	const queryBlockquotesCharacters = `[:find (sum ?size) . :with ?e :where (or-join [?s ?e]
								(and [?e :block/string ?s]
								(or [(clojure.string/starts-with? ?s"> ")]
										[(clojure.string/starts-with? ?s"[[>]] ")]))
								[?e :node/title ?s])
								[(count ?s) ?size]]`;

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

		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo(">")},10)'>Block Quotes</a> / Words / Characters: <br/>
		${await roamAlphaAPI.q(queryBlockquotes)} / ${await roamAlphaAPI.q(queryBlockquotesWords)} / ${await roamAlphaAPI.q(queryBlockquotesCharacters)}  <br/><br/>

		Code Blocks / Characters:<br/> 
		${await roamAlphaAPI.q(queryCodeBlocks)} / ${await roamAlphaAPI.q(queryCodeBlockCharacters)} <br/><br/>

		Interconnections (refs):  ${await roamAlphaAPI.q('[:find (count ?r) . :with ?e :where [?e :block/refs ?r] ]]')} <br/><br/>

		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("TODO")},10)'>TODO</a>: 
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "TODO"][?be :block/refs ?e]]')}  <br/>
		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("DONE")},10)'>DONE</a>:  
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "DONE"][?be :block/refs ?e]]')} <br/>
		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("query")},10)'>query</a>:  
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "query"][?be :block/refs ?e]]')} <br/>
		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("embed")},10)'>embed</a>:  
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "embed"][?be :block/refs ?e]]')} <br/>
		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("table")},10)'>table</a>:  
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "table"][?be :block/refs ?e]]')} <br/>
		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("kanban")},10)'>kanban</a>:  
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "kanban"][?be :block/refs ?e]]')} <br/>
		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("video")},10)'>video</a>:  
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "video"][?be :block/refs ?e]]')} <br/>
		<a style="color:lightgrey" onclick='setTimeout(async ()=>{await roam42.common.navigateUiTo("roam/js")},10)'>roam/js</a>:  
		${await roamAlphaAPI.q('[:find (count ?be) . :where [?e :node/title "roam/js"][?be :block/refs ?e]]')} <br/>

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



