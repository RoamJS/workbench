// workBenchPath
// roam42.wB.path
//		.initialize() - configures environment by calling appendCP_HTML_ToBody & typeAheadCreate
//		.typeAheadCreate() - configures typeahead (Presentation, data sources, and event handling)
//		Data source functions:
//		.levelPages - returns page names
//		.levelBlocks - returns blocks at the current level. As user drills down throgh block strucure, the UID of one 
//									 block is passed to the next until it reaches the last block in the branch
//	   .formatPathDisplay - displays in the header of this control the current location in the path

{
	//https://github.com/bvaughn/js-search
	roam42.loader.addScriptToPage('js-search', 'https://cdn.jsdelivr.net/npm/js-search@2.0.0/dist/umd/js-search.min.js');
	roam42.wB.path = {};

	roam42.wB.path.initialize = async ()=> {
		roam42.wB.path.level = 0;		// tracks level of path nav. 0 is page level, 1 is child blocks		
		roam42.wB.path.UI_Visible = false;
		roam42.wB.path.trailUID 	 = null; //UID path stored as an array
		roam42.wB.path.trailString = null; //string path stored as an array (same number index as roam42.wb.path.trailUID)
		roam42.wB.path.excludeUIDs = [];	 //array of UID to exclude in output
		roam42.wB.path.callBack    = null; //passes in 4 values: Last UID, last string, UID path and String Path
		roam42.wB.path.allPagesForGraphSearch = null; //search object for page names
		roam42.wB.path.currentPageBlocks = null;	//search object for current page
		roam42.wB.path.canPageBeSelected = false; //can the page be selected in the navigator as a destination point

		roam42.wB.path.launch = (callBackFunction, excludeUIDs = [], startUID=null, startString=null, canPageBeSelected=false)=> {			
			roam42.wB.path.level = 0;	//reset path level
			roam42.wB.path.trailUID 	 = [startUID]; 		//UID path
			roam42.wB.path.trailString = [startString]; //string path
			roam42.wB.path.excludeUIDs = excludeUIDs;
			roam42.wB.path.callBack = callBackFunction;
			roam42.wB.path.canPageBeSelected = canPageBeSelected;
			roam42.wB.path.allPagesForGraphSearch = null;
			roam42.wB.path.currentPageBlocks = null;
			
			if(startUID!=null)
				roam42.wB.path.level=1;
			formatPathDisplay();
			//following lines handles bug in typeahead not refreshing new data SOURCES
			//be VERY Careful when changing
			//START FIX
			setTimeout( ()=>{ $('#roam42-wB-path-input').typeahead('val', '-') },50);
			setTimeout(async ()=>{
				$('#roam42-wB-path-input').typeahead('val', '');
				$('#roam42-wB-path-input').focus();
				setTimeout(async ()=>{roam42.wB.path.toggleVisible()},150);
			},100);

		};

		await appendCP_HTML_ToBody();

		await typeAheadCreate();

		roam42.wB.path.toggleVisible = async ()=> {
			const wControl = document.querySelector('#roam42-wB-path-container');
			if(roam42.wB.path.UI_Visible) {
				$(`#roam42-wB-path-input`).typeahead('val', '');
				$(`#roam42-wB-path-PathDisplay`).text('>');
				wControl.style.visibility='hidden';
			} else {
				roam42.wB.path.allPagesForGraphSearch = new JsSearch.Search('1');
				roam42.wB.path.allPagesForGraphSearch.searchIndex = new JsSearch.UnorderedSearchIndex();
				roam42.wB.path.allPagesForGraphSearch.indexStrategy = new JsSearch.AllSubstringsIndexStrategy();
				roam42.wB.path.allPagesForGraphSearch.addDocuments( await window.roamAlphaAPI.q('[:find ?name ?uid :where [?page :node/title ?name] [?page :block/uid ?uid]]') );
				roam42.wB.path.allPagesForGraphSearch.addIndex('0');
				roam42.wB.path.currentPageBlocks = null;
				wControl.style.visibility='visible';
  			$(`#roam42-wB-path-PathDisplay`).text('Typing page name.... ');
				document.querySelector('#roam42-wB-path-input').focus();
			}
			roam42.wB.path.UI_Visible = !roam42.wB.path.UI_Visible;
		}
		
	} // End of INITIALIZE

	
	var allPagesForGraph = [];
	// SOURCES ===================================

	const levelPages = async(query, results)=>{
		if(roam42.wB.path.allPagesForGraphSearch && roam42.wB.path.allPagesForGraphSearch._documents.length>0) {
			const pages = roam42.wB.path.allPagesForGraphSearch.search(query);
			const sortPages = pages.sort( (a,b)=> a[0].localeCompare(b[0]) );
			for await (page of sortPages) 
				await results.push( {display: page[0].substring(0,255), uid: page[1], img: roam42.host + '/img/wb/page.png'} );
		};
		await results.push( {display: 'Current page (cp)', level: 0, img: roam42.host + '/img/wb/page.png', uid: await roam42.common.currentPageUID() }  );
		await results.push( {display: 'Today DNP', level: 0, img: roam42.host + '/img/wb/page.png', uid: await roam42.common.getPageUidByTitle(roam42.dateProcessing.getRoamDate(new Date())) } );
	};

	const levelBlocks = async(query, results)=>{
		//shows all the child blocks of UID from roam42.wB.path.trailUID
		if(roam42.wB.path.trailUID == null || roam42.wB.path.trailUID.length==0) return; 
		if(roam42.wB.path.currentPageBlocks == null) {
			roam42.wB.path.currentPageBlocks =  new JsSearch.Search('uid');
			roam42.wB.path.currentPageBlocks.searchIndex = new JsSearch.UnorderedSearchIndex();
			roam42.wB.path.currentPageBlocks.indexStrategy = new JsSearch.AllSubstringsIndexStrategy();
			roam42.wB.path.currentPageBlocks.sanitizer = new JsSearch.LowerCaseSanitizer();
			roam42.wB.path.currentPageBlocks.addIndex('blockText');
			roam42.wB.path.currentPageBlocks.addDocuments( await roam42.formatConverter.flatJson( roam42.wB.path.trailUID[0], withIndents=false, false ) );
		}
		const pageLine = 'Page: ' + roam42.wB.path.trailString[0];
		if(roam42.wB.path.currentPageBlocks._documents.length==1) {  //no blocks, mimick empty block
			if(roam42.wB.path.canPageBeSelected==true)
				await results.push( {display: pageLine, uid: roam42.wB.path.trailUID[0], level: 0, img: roam42.host + '/img/wb/page.png' } ); 
		} else if(roam42.wB.path.currentPageBlocks && roam42.wB.path.currentPageBlocks._documents.length>0 && query.length > 0) {
			for await (block of roam42.wB.path.currentPageBlocks.search(query)) {
				let blockOutput = block.blockText.length>0 ? block.blockText.substring(0,255) : ' ';
				await results.push( {display: blockOutput, uid: block.uid, level: block.level, img: roam42.host + '/img/wb/bullet.png' } );
			}
		} else { //no query yet, just show blocks from page
			if(roam42.wB.path.canPageBeSelected==true)
				await results.push( {display: pageLine, uid: roam42.wB.path.trailUID[0], level: 0, img: roam42.host + '/img/wb/page.png' } ); 
			let maxCount = roam42.wB.path.currentPageBlocks._documents.length > 1000 ? 1000: roam42.wB.path.currentPageBlocks._documents.length;
			for(i=1; i<maxCount;i++){
				let block = roam42.wB.path.currentPageBlocks._documents[i];
				let blockOutput = block.blockText.length>0 ? block.blockText.substring(0,255) : ' ';
				await results.push( {display: blockOutput, uid: block.uid,  level: block.level, img: roam42.host + '/img/wb/bullet.png' } );
			}
		}

	};

	const formatPathDisplay = ()=> {
		if(roam42.wB.path.trailString != null && roam42.wB.path.trailString.length>0) {
			let output = roam42.wB.path.trailString.join(' > ');
			if(output.length > 70){
				output = roam42.wB.path.trailString[0] + ' * > '.repeat(roam42.wB.path.trailString.length-2) 
											  + roam42.wB.path.trailString[roam42.wB.path.trailString.length-1] ;				
			}
			if(output.length > 70){
				output = roam42.wB.path.trailString[0].substring(0,25) + '... > * > ' + 
											   roam42.wB.path.trailString[roam42.wB.path.trailString.length-1].substring(0,35);				
			}
			$(`#roam42-wB-path-PathDisplay`).text( output );
		}	else {
			$(`#roam42-wB-path-PathDisplay`).text('Type page name.... ');
		}
	};

	const typeAheadCreate = async ()=>{
		$('#roam42-wB-path-input').typeahead(
			{ hint: true, highlight: true, minLength: 0, autoselect: true },
			{ name: 'basicnav', display: 'display', limit: 10, async: true, 
				source: async (query, syncResults, asyncResults)=> {
									var results = [];
									if(roam42.wB.path.level == 0)
										await levelPages(query, results);
									else 
										await levelBlocks(query, results);
									asyncResults( results );
				},
				templates: {
					suggestion: (val)=>{
						return '<div style="display: flex">' + 
											'<div style="left:5px;width:22px;"><img style="filter: invert(100%)" height="18px" src="' + val.img + '"></div>' +
											'<div style="width:430px"> ' + val.display + '</div>' + 
										'</div>' ;
					}
				}
			 }
		).on('keydown', this, function (event) {
			if(event.key=='Tab' || ( event.key=='Enter' && roam42.wB.path.trailUID.length > 1 ) || ( event.key=='Enter' && event.ctrlKey==true )  ) {
					event.preventDefault();
					if(roam42.wB.path.trailUID == null || roam42.wB.path.trailUID.length == 0) return;
					let outputUID = null;
					let outputText = null;
					if( (event.key=='Enter' && event.ctrlKey==true) && roam42.wB.path.trailUID.length>0  ) { // use the last selection as the lookup
					 	outputUID = roam42.wB.path.trailUID[roam42.wB.path.trailUID.length-1];
						outputText = roam42.wB.path.trailString[roam42.wB.path.trailString.length-1];
					} else { //as tab use the current
					 	outputUID = roam42.wB.path.trailUID[roam42.wB.path.trailUID.length-1];
						outputText = roam42.wB.path.trailString[roam42.wB.path.trailString.length-1];
					}
					roam42.wB.path.level = 0;
					roam42.wB.path.toggleVisible();
					//following lines handles bug in typeahead not refreshing new data SOURCES
					//be VERY Careful when changing
					//START FIX
					setTimeout( ()=>{ $('#roam42-wB-path-input').typeahead('val', '-') },50);
					setTimeout(async ()=>{
						$('#roam42-wB-path-input').typeahead('val', '');
						$('#roam42-wB-path-input').focus();
					},100);
					//END FIX
					setTimeout ( async ()=>{
						//Execute CALLBACK function here
						if(roam42.wB.path.callBack!==null)
							await roam42.wB.path.callBack(outputUID, outputText);
						roam42.wB.path.callBack = null;
					},150);
			} else if ( 			
				(event.key == 'Backspace' && roam42.wB.path.trailUID.length > 0 && document.getElementById('roam42-wB-path-input').value.length==0)
				|| (event.key == 'Backspace' && (event.ctrlKey == true || event.metaKey == true)) ) { 
					//remove last block in path if backspace pressed (and nothing in block)	
					event.preventDefault();
					roam42.wB.path.trailString.pop();
					roam42.wB.path.trailUID.pop();
					if(roam42.wB.path.trailUID.length==0) roam42.wB.path.level = 0;
					formatPathDisplay();
					//following lines handles bug in typeahead not refreshing new data SOURCES
					//be VERY Careful when changing
					//START FIX
					$('#roam42-wB-path-input').typeahead('val', '-');
					setTimeout(async ()=>{
						$('#roam42-wB-path-input').typeahead('val', '');
						$('#roam42-wB-path-input').focus();
					},10);
					//END FIX
				} else if(event.key=='Escape') {
					event.stopPropagation();
					roam42.wB.path.level = 0;
					setTimeout( ()=>{ roam42.wB.path.toggleVisible() },10);
					setTimeout( ()=>{ $('#roam42-wB-path-input').typeahead('val', '-'); },50);				
					setTimeout( ()=>{
						$('#roam42-wB-path-input').typeahead('val', '');
						$('#roam42-wB-path-input').focus();
					},100);
			}
    });

		$('#roam42-wB-path-input').bind('typeahead:select',  
				(ev, suggestion)=> {
					if(roam42.wB.path.level == 0)	{
						roam42.wB.path.level = 1;
						roam42.wB.path.trailString = [suggestion.display]; //string path
						roam42.wB.path.trailUID 	 = [suggestion.uid]; //UID path
					} else {
						roam42.wB.path.trailString.push( suggestion.display ); //string path
						roam42.wB.path.trailUID.push( 	 suggestion.uid ); //UID path
					}
					formatPathDisplay();
					
					//following lines handles bug in typeahead not refreshing new data SOURCES
					//be VERY Careful when changing
					//START FIX
					$('#roam42-wB-path-input').typeahead('val', ' ');
					setTimeout(async ()=>{
						$('#roam42-wB-path-input').typeahead('val', '');
						$('#roam42-wB-path-input').focus();
					},10);
					//END FIX					  
		});

		let inputFieldFocusOutListener = (e)=>{  
			if(roam42.wB.path.UI_Visible) {
				roam42.wB.path.level = 0;
				setTimeout( ()=>{ roam42.wB.path.toggleVisible() },10);
				setTimeout( ()=>{ $('#roam42-wB-path-input').typeahead('val', '-'); },50);				
				setTimeout( ()=>{
					$('#roam42-wB-path-input').typeahead('val', '');
					$('#roam42-wB-path-input').focus();
				},200);
			} 
		};

		try{ document.querySelector('#roam42-wB-path-input').removeEventListener('focusout', inputFieldFocusOutListener) } catch(e) {};
		document.querySelector('#roam42-wB-path-input').addEventListener('focusout', inputFieldFocusOutListener);

	};

	const appendCP_HTML_ToBody = ()=> {
		$(document.body).append(`
			<div id="roam42-wB-path-container" style="visibility:hidden">
				<div id="roam42-wB-path-PathDisplay">></div>
				<div><input class="typeahead" id="roam42-wB-path-input" type="text"></div>
			</div>
			<style id="roam42-wB-path-container-style">
				#roam42-wB-path-container {
					position: absolute;
					left: 50%;
					top:0px;
					transform: translate(-50%, 0%);
					border: 4px solid DarkSlateGray;
					background-color: DarkSlateGray;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
					height: 50px;
					width:450px;
					z-index: 1000;
				}
				#roam42-wB-path-PathDisplay {				
					color: #ddd;
					font-size: 10pt;
					height:14pt;
					padding-left:3px;
					position: relative;
					top:-2px;
				}

				#roam42-wB-path-container .typeahead {
					line-height:12px !important;
					font-size: 10pt !important;
					height: 14px !important;
					border-radius: 0px;
					width: 443px;
					padding-left: 3px !important;
					background-color: #777;
					color: #ddd !important;
				}

				#roam42-wB-path-container .tt-input:focus {
					border-color: #777 !important;
				}

				#roam42-wB-path-container .tt-menu {
					background-color: DarkSlateGray;
					border-radius: 0px; !important;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33) !important;
					color: #ddd !important;
					top: 12px !important;
					left:-4px !important;
					padding-top: 0px !important;
					padding-bottom: 0px !important;
					width:450px;
				}

				#roam42-wB-path-container .tt-highlight {
					background-color: DarkSlateGray !important
				}
				
				#roam42-wB-path-container .tt-suggestion {
					line-height:12px;
					font-size: 10pt;
					padding-left: 7px !important;
				}

		</style>`);
	
	};  //end of appendCP_HTML_ToBody

	roam42.wB.path.initialize();
  roam42.wB.path.testReload = ()=>{
		console.clear()
		console.log('reloading wB path')
		try{ document.querySelector('#roam42-wB-path-container').remove() } catch(e) {};
		try{ document.querySelector('#roam42-wB-path-container-style').remove() } catch(e) {};
		setTimeout(async ()=>{
	    roam42.loader.addScriptToPage( "workBenchPath", roam42.host + 'ext/workBenchPath.js');
		},4000);
  };

  roam42.wB.path.fromwB_TestReload = ()=>{
		try{ document.querySelector('#roam42-wB-path-container').remove() } catch(e) {};
		try{ document.querySelector('#roam42-wB-path-container-style').remove() } catch(e) {};
  };
};