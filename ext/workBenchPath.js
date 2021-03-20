// workBenchPath

{
	console.log('roam42.wB.path')
	roam42.wB.path = {};

	roam42.wB.path.initialize = async ()=> {
		roam42.wB.path.level = 0;		// tracks level of path nav. 0 is page level, 1 is child blocks		
		roam42.wB.path.UI_Visible = false;
		roam42.wB.path.trailUID 	 = null; //UID path
		roam42.wB.path.trailString = null; //string path

		await appendCP_HTML_ToBody();

		await typeAheadCreate();

		roam42.wB.path.toggleVisible = async ()=> {
			const wbControl = document.querySelector('#roam42-wB-path-container');
			if(roam42.wB.path.UI_Visible) {
				roam42.wB.path.trailUID 	 = null; //UID path
				roam42.wB.path.trailString = null; //string path
				$(`#roam42-wB-path-input`).typeahead('val', '');
				// $(`#roam42-wB-path-input`).typeahead('close');
				$(`#roam42-wB-path-PathDisplay`).text('>');
				wbControl.style.visibility='hidden';
			} else {
				// $(`#roam42-wB-path-input`).typeahead('close');
				roam42.wB.path.level = 0;	//reset path level
				wbControl.style.visibility='visible';
				document.querySelector('#roam42-wB-path-input').focus();
			}
			roam42.wB.path.UI_Visible = !roam42.wB.path.UI_Visible;
		}
		
	} // End of INITIALIZE

	// SOURCES ===================================

	const levelPages = async(query, results)=>{
		let pagequery = `[:find ?title ?uid
										:in $ ?title-fragment
										:where  [?e :node/title ?title]
														[(re-pattern ?title-fragment) ?re]
														[(re-find ?re ?title)]
														[?e :block/uid ?uid]]`;
		let pages = await window.roamAlphaAPI.q(pagequery,'(?i)'+query);		
		if(pages && pages.length>0){
			for await (page of pages) 
				await results.push( {display: page[0].substring(0,255), uid: page[1]} );
		}
	};

	const levelBlocks = async(query, results)=>{
		if(roam42.wB.path.trailUID == null || roam42.wB.path.trailUID.length==0) return; 
		const blocksAtThisLevel = (await roam42.common.getBlockInfoByUID(
																			roam42.wB.path.trailUID[roam42.wB.path.trailUID.length-1],true))[0][0].children;	
		if(blocksAtThisLevel && blocksAtThisLevel.length>0)	{
			const blocksAtThisLevelSort = await roam42.common.sortObjectsByOrder( blocksAtThisLevel );
			for await (block of blocksAtThisLevelSort){
				if(query.length==0) {
					let blockString = block.string.trim().length==0 ? '-' : block.string.trim();
					await results.push( {display: blockString.substring(0,400), uid: block.uid  } );
				} else if( block.string.toLowerCase().includes( query.toLowerCase()) )
					await results.push( {display: block.string.substring(0,400), uid: block.uid  } );
			}
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
								}			
			 }
		).on('keydown', this, function (event) {
			//remove last block in path if backspace pressed (and nothing in block)
			if(	event.key == 'Backspace' && roam42.wB.path.trailUID.length > 0 && document.getElementById('roam42-wB-path-input').value.length==0) { 
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

		Mousetrap.unbind( 'ctrl ctrl' ); //do this in case of a reset
		Mousetrap.bind( 'ctrl ctrl' ,()=>{ 
				roam42.wB.path.toggleVisible(); 
			return false; 
		});

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
			$(`#roam42-wB-path-PathDisplay`).text('path > ');
		}
	};

	// HTML Body ===================================
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
	
	}; //end of module

	roam42.wB.path.initialize();
  roam42.wB.path.testReload = ()=>{
		console.clear()
		console.log('reloading wB path')
		try{ document.querySelector('#roam42-wB-path-container').remove() } catch(e) {};
		try{ document.querySelector('#roam42-wB-path-container-style').remove() } catch(e) {};
		setTimeout(async ()=>{
	    roam42.loader.addScriptToPage( "workBenchPath", roam42.host + 'ext/workBenchPath.js');
		},1000);
  };

};