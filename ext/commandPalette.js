// Command Palette
// Typeahead based on: https://github.com/corejavascript/typeahead.js/

;(async ()=>{
  roam42.cp = {};
	roam42.cp.enabled = false;
	roam42.cp.active  = false;
	roam42.cp.keyboardShortcut = 'ctrl+;';

	roam42.cp.initialize = async ()=> {

		// Default is that CP is enabled, but during testing is turned off.
		if( await roam42.settings.get('CommandPaletteEnabled') != 'on') 
			return;
		else
			roam42.cp.enabled = true;

		roam42.cp.getIsEnabled = ()=> {
			if( Cookies.get('cp_IsEnabled') === 'true' )
				return true
			else 
				return false
		};

		roam42.cp.setIsEnabled = (val)=> {
			if(val == true) 
				Cookies.set('cp_IsEnabled', 'true', { expires: 365 });
			 else 
				Cookies.set('cp_IsEnabled', 'false', { expires: 365 });
		};

		roam42.cp.toggleActiveState = ()=> {
			let currentState = roam42.cp.getIsEnabled();
			roam42.cp.active = !currentState;
			roam42.cp.setIsEnabled( !currentState );
		};

		roam42.cp.active = roam42.cp.getIsEnabled();
		
		roam42.cp.UI_Visible = false;
		roam42.cp.triggeredState = {}; //tracks state of when the CP was triggered
		roam42.cp.triggeredState.activeElementId  = null;
		roam42.cp.triggeredState.selectedNodes  = null;	
		roam42.cp.triggeredState.activeElementSelectionStart = null;
		roam42.cp.triggeredState.activeElementSelectionEnd   = null;
		roam42.cp.keystate = {};			//tracks key state of CP input control
		roam42.cp._sources = [];			//sources for looking up and returning commands
		roam42.cp._commands = [];			//commands visible in CP

		await appendCP_HTML_ToBody();

		$('#roam42-cp-input').typeahead(
			{ hint: false, highlight: true, minLength: 0, autoselect: true },
			{ name: 'basicnav', display: 'display', limit:20, async: true, 
				source: async (query, syncResults, asyncResults)=> {
									var results = [];
									if( query.length == 0 ) {
										iMax = roam42.cp._commands.length<20 ? roam42.cp._commands.length-1 : 19;
										for(let i = 0; i < iMax; i++) {
											if( roam42.cp._commands[i].context == '*' )
												await results.push(roam42.cp._commands[i]);
										}
									} else {
										if(roam42.cp._sources.length>0) {
											let context = '*'; //default to anywhere
											if( roam42.cp.triggeredState.activeElementId != null) context ='-'; //context: textarea
											if( roam42.cp.triggeredState.selectedNodes.length > 0) context ='+'; //context: multiple nodes
											// await roam42.cp._sources.forEach(async(source)=>{ await source.sourceCallBack(context, query, results) } );
											for await (source of await roam42.cp._sources)
												await source.sourceCallBack(context, query, results);
										}
									}
									asyncResults( results );
								}			
			 }
		);

		// perform command
		$('#roam42-cp-input').bind('typeahead:select',  
				(ev, suggestion)=> {
					$('#roam42-cp-input').typeahead('close');
					roam42.cp.toggleVisible();
					setTimeout( async()=>{
						switch(suggestion.context) {
							case '-': //textarea block edit
								await roam42KeyboardLib.pressEsc(100);
								await restoreCurrentBlockSelection();
								break
							case '+': //multipe blocks selected
								break
						}
						await suggestion.cmd(suggestion);
					},200);
		});

		$('#roam42-cp-input').on('keydown', function(e) { roam42.cp.keystate = e; if(e.key == 'Escape') inputFieldFocusOutListener(); } );

		$('#roam42-cp-input').on('keyup', function(e) { roam42.cp.keystate = e });
		
		//assign trigger to keyboard
		let shortcut = await roam42.settings.get('CommandPaletteShortcut');
		if(shortcut != null) roam42.cp.keyboardShortcut = shortcut;

		Mousetrap.unbind( roam42.cp.keyboardShortcut ); //do this in case of a reset
		Mousetrap.bind( roam42.cp.keyboardShortcut ,()=>{ 
				if(!roam42.cp.active) return;
				//capture States
				roam42.cp.triggeredState.activeElementId = document.activeElement.type == 'textarea' ? document.activeElement.id : null;
				roam42.cp.triggeredState.activeElementSelectionStart = document.activeElement.selectionStart;
				roam42.cp.triggeredState.activeElementSelectionEnd   = document.activeElement.selectionEnd;
				roam42.cp.triggeredState.selectedNodes = document.querySelectorAll('.block-highlight-blue .roam-block');	
				roam42.cp.toggleVisible(); 
			return false; 
		});

		let restoreCurrentBlockSelection = async()=>{
			roam42.common.simulateMouseClick( document.getElementById( roam42.cp.triggeredState.activeElementId ) );
			await roam42.common.sleep(150);
			document.activeElement.selectionStart = roam42.cp.triggeredState.activeElementSelectionStart;
			document.activeElement.selectionEnd   = roam42.cp.triggeredState.activeElementSelectionEnd;
		};

		let inputFieldFocusOutListener = (e)=>{ 
			if(roam42.cp.UI_Visible) {
				roam42.cp.toggleVisible();
				if( roam42.cp.triggeredState.activeElementId != null ) setTimeout(async ()=>{restoreCurrentBlockSelection()}, 200);
			}
		};

		try{ document.querySelector('#roam42-cp-input').removeEventListener('focusout', inputFieldFocusOutListener) } catch(e) {};
		document.querySelector('#roam42-cp-input').addEventListener('focusout', inputFieldFocusOutListener);

		roam42.cp.toggleVisible = async ()=> {
			const cpControl = document.querySelector('#roam42-cp-container');
			if(roam42.cp.UI_Visible) {
				$(`#roam42-cp-input`).typeahead('val', '');
				cpControl.style.visibility='hidden';
			} else {
				cpControl.style.visibility='visible';
				document.querySelector('#roam42-cp-input').focus();
			}
			roam42.cp.UI_Visible = !roam42.cp.UI_Visible;
		}
		
		// SOURCES ===================================

			roam42.cp.sourceAdd = async ( sourceName,  callBackFunction )=> {
				//callback receives query and the results object for appending commands
				let source = await roam42.cp._sources.find(source => source.name === sourceName)
				if( source === undefined)
					roam42.cp._sources.push( { name: sourceName, sourceCallBack: callBackFunction } );
				else
					source.sourceCallBack = callBackFunction;
			}

			await roam42.cp.sourceAdd( "SmartBlocks", async (context, query, results)=>{
				if( context != '-' ) return;
				let queryLowerCase = query.toLowerCase();
				let sbList =  await roam42.smartBlocks.UserDefinedWorkflowsList();
				await roam42.smartBlocks.addCommands( sbList );
				for await (sb of sbList) {
					if( sb['key'].toLowerCase().includes(queryLowerCase))
				 		await results.push( { display: sb['key'], cmd: async (cmdInfo)=> roam42.smartBlocks.sbBomb({original: cmdInfo.info}),  context: '-', info: sb });
				}
			});

			await roam42.cp.sourceAdd( "Built-in Roam commands", async (context, query, results)=>{
				let queryLowerCase = query.toLowerCase();
				for await (el of roam42.cp._commands) {
					if( el.searchText.includes(queryLowerCase))
						if( el.context == '*' || el.context == context ) //applies to all contexts, so include
							await results.push(el);
				}
			});

			await roam42.cp.sourceAdd( "Page Name Navigation Commands", async (context, query, results)=>{
					let pagequery = `[:find ?title ?uid
													:in $ ?title-fragment
													:where  [?e :node/title ?title]
																	[(re-pattern ?title-fragment) ?re]
																	[(re-find ?re ?title)]
																	[?e :block/uid ?uid]]`;
					let pages = await window.roamAlphaAPI.q(pagequery,'(?i)'+query);
					if(pages && pages.length>0)
						for await (page of pages) 
							await results.push( {display: page[0], cmd: async (cmdInfo)=> roam42.common.navigateUiTo(cmdInfo.display, roam42.cp.keystate.shiftKey),  
																	 context: '*', pageInfo: page} );
			});


		// Commands ===================================

			// Format for command array
			// display: text displayed in search
			// cmd: command to be run depending on its type
			// context: command works in the defined context
			//				  * = anywhere
			//					- = from a textarea
			//				  + = multipblock selection 
			roam42.cp._commands.push( { 
				display: 'Daily Notes', 
				cmd: ()=>{ roam42.common.navigateUiTo( roam42.dateProcessing.getRoamDate(new Date()), roam42.cp.keystate.shiftKey ) }, 
				searchText: 'dailynotes',
				context: '*'
			});

			roam42.cp.commandAddRunFromAnywhere = async ( textToDisplay, callbackFunction )=> {
				roam42.cp._commands.push( { display: textToDisplay, searchText:textToDisplay.toLowerCase(), cmd: callbackFunction, context: '*' } );
			}

			roam42.cp.commandAddRunFromBlock = ( textToDisplay, callbackFunction )=> {
				roam42.cp._commands.push( { display: textToDisplay, searchText:textToDisplay.toLowerCase(), cmd: callbackFunction, context: '-' } );
			}

			roam42.cp.commandAddRunFromMultiBlockSelection = ( textToDisplay, callbackFunction )=> {
				roam42.cp._commands.push( { display: textToDisplay, searchText:textToDisplay.toLowerCase(), cmd: callbackFunction, context: '-' } );
			}


			// TEMPLATE: 
			// roam42.cp.commandAdd("text", ()=>{};
			// try{ roam42.cp.commandAdd("text", ()=>{}) } catch(e) {};
				roam42.cp.commandAddRunFromAnywhere("All Pages",()=>{document.location.href=roam42.common.baseUrl().href.replace('page','') + '/search'});
				roam42.cp.commandAddRunFromAnywhere("Graph Overview", ()=>{document.location.href=roam42.common.baseUrl().href.replace('page','') + '/graph'});
				try{ roam42.cp.commandAddRunFromAnywhere("Roam42 Privacy Mode (alt-shift-p)", roam42.privacyMode.toggle) } catch(e){};
				try{ roam42.cp.commandAddRunFromAnywhere("Roam42 Converter (alt-m)", roam42.formatConverterUI.show) } catch(e){};
				try{ roam42.cp.commandAddRunFromAnywhere("Roam42 Web View (alt-shift-m)", roam42.formatConverterUI.htmlview) } catch(e){};
				try{ roam42.cp.commandAddRunFromAnywhere("Roam42 Help", roam42.quickRef.component.toggleQuickReference) } catch(e) {};
				try{ roam42.cp.commandAddRunFromAnywhere("Roam42 Tutorials", roam42.tutorials.show) } catch(e) {};
				try{ roam42.cp.commandAddRunFromAnywhere("Roam42 Graph DB Stats", roam42.stats.displayGraphStats) } catch(e) {};

				try{ roam42.cp.commandAddRunFromAnywhere("Goto next day - Roam42 (ctrl-shift-.)", ()=>{ roam42.jumpToDate.component.moveForwardToDate(true) }) } catch(e) {};
				try{ roam42.cp.commandAddRunFromAnywhere("Goto previous day - Roam42 (ctrl-shift-.)", ()=>{ roam42.jumpToDate.component.moveForwardToDate(false) }) } catch(e) {};


				roam42.cp.commandAddRunFromBlock('Heading 1 (Alt+Shift+1)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j 5')} );
				roam42.cp.commandAddRunFromBlock('Heading 2 (Alt+Shift+2)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j 6')} );
				roam42.cp.commandAddRunFromBlock('Heading 3 (Alt+Shift+3)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j 7')} );

				roam42.cp.commandAddRunFromBlock('Copy Block Reference - Jump Nav (Meta-j r)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j r')} );
				roam42.cp.commandAddRunFromBlock('Copy Block Reference as alias - Jump Nav (Meta-j s)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j s')} );

				roam42.cp.commandAddRunFromAnywhere("Reload Command Palette", ()=>{ roam42.cp.testReload() });

		
	} // End of INITIALIZE


	// HTML Body ===================================
		const appendCP_HTML_ToBody = ()=> {
			$(document.body).append(`
				<div id="roam42-cp-container" style="visibility:hidden">
					<input class="typeahead" id="roam42-cp-input" type="text">
				</div>
				<style id="roam42-cp-container-style">
					#roam42-cp-container {
						position: absolute;
						left: 50%;
						top:0px;
						transform: translate(-50%, 0%);
						border: 4px solid #555;
						background-color: #555;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
						height: 30px;
						width:350px;
						z-index: 1000;
					}

					#roam42-cp-container .typeahead {
						line-height:14px !important;
						font-size: 12pt !important;
						height: 14px !important;
						border-radius: 0px;
						width: 343px;
						padding-left: 3px !important;
						background-color: #777;
						color: #ddd !important;
					}

					#roam42-cp-container .tt-input:focus {
						border-color: #777 !important;
					}

					#roam42-cp-container .tt-menu {
						background-color: #777;
						border-radius: 0px; !important;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33) !important;
						color: #ddd !important;
						top: 13px !important;
						left:-4px !important;
						padding-top: 0px !important;
						padding-bottom: 0px !important;
						width:350px;
					}

					#roam42-cp-container .tt-highlight {
						background-color: darkblue !important
					}
					
					#roam42-cp-container .tt-suggestion {
						line-height:16px;
						font-size: 12pt;
						padding-left: 7px !important;
					}

			</style>`);
	
	} //end of module

  roam42.cp.testReload = ()=>{
    roam42.loader.addScriptToPage( "commandPalette", roam42.host + 'ext/commandPalette.js');
		setTimeout(async ()=>{
			// cleanup controls if being reinitialized
			try{ document.querySelector('#roam42-cp-container').remove() } catch(e) {};
			try{ document.querySelector('#roam42-cp-container-style').remove() } catch(e) {};
			await roam42.cp.initialize();
		},1000);
  }

})();
