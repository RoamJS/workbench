{
roam42.wB.commandAddRunFromAnywhere("All Pages",()=>{document.location.href=roam42.common.baseUrl().href.replace('page','') + '/search'});
roam42.wB.commandAddRunFromAnywhere("Graph Overview", ()=>{document.location.href=roam42.common.baseUrl().href.replace('page','') + '/graph'});
roam42.wB.commandAddRunFromAnywhere("Right Sidebar - close window panes (rscwp)", async ()=>{ 
	await roam42KeyboardLib.pressEsc(100);
	await roam42KeyboardLib.pressEsc(100);
	await roam42.common.rightSidebarClose(0, false); 
	try { await restoreCurrentBlockSelection() } catch(e){}
});
roam42.wB.commandAddRunFromAnywhere("Sidebars - swap with main window (swap)", async ()=>{  
	await roam42.common.swapWithSideBar();
});

roam42.wB.commandAddRunFromAnywhere("Sidebars - swap with main window & choose window (swc)", async ()=>{
	const panes = await roamAlphaAPI.ui.rightSidebar.getWindows();
	if(panes.length==0) {
		roam42.help.displayMessage('No open side windows to swap with.',5000);
		return;
	}
	let outputString = '';
	let iCounter = 1;
	for (pane of panes) {
		let paneUID = pane['type']=='block' ? pane['block-uid'] : pane['page-uid'];
		if(paneUID != undefined) {
			let paneInfo = (await roam42.common.getBlockInfoByUID( paneUID, false, true))[0][0];
			if(paneInfo.title)
				outputString += (iCounter + ': ' + paneInfo.title + '\n').substring(0,100);
			else
				outputString += (iCounter + ': ' + paneInfo.parents[0].title + ' > ' + paneInfo.string + '\n').substring(0,100);
			iCounter +=1;
		}
	}
	let paneToSwap = prompt('Which window pane to swap? (type number)\n\n' + outputString, 1);
	if(paneToSwap!=null &&  paneToSwap != '' ) {
		paneToSwap = Number(paneToSwap);
		if(paneToSwap!=NaN && paneToSwap>0 && paneToSwap<= panes.length)
			await roam42.common.swapWithSideBar(paneToSwap);
		else
			roam42.help.displayMessage('Not  a valid number for a sidebar pane',5000);
	}
});

roam42.wB.commandAddRunFromAnywhere("Sidebars - open both (sob)", async ()=>{  
	await roamAlphaAPI.ui.rightSidebar.open();
	await roam42.common.sleep(100);  
	try {
		var event = new MouseEvent('mouseover', { 'view': window, 'bubbles': true, 'cancelable': true });
		document.getElementsByClassName("bp3-icon-menu")[0].dispatchEvent(event);
	} catch(e) {} //if on ipad, the above command fails, so go to next step
	setTimeout(()=>{
		document.getElementsByClassName("bp3-icon-menu-open")[0].click();
	},100);
	if(roam42.wB.triggeredState.activeElementId != null) {
		await roam42.common.sleep(500);
		await roam42.common.rightSidebarClose(0, false); 
		await restoreCurrentBlockSelection(); 
	}
});
roam42.wB.commandAddRunFromAnywhere("Sidebars - close both (scb)", async ()=>{  
	await roamAlphaAPI.ui.rightSidebar.close();  
	await roam42.common.sleep(100);  	
	try { document.getElementsByClassName("bp3-icon-menu")[0].dispatchEvent(event) } catch(e) {} //if on ipad, the above command fails, so go to next step
	try {
			document.getElementsByClassName("bp3-icon-menu-closed")[0].click();
			roam42.common.simulateMouseOver(document.getElementsByClassName("roam-article")[0]); //.dispatchEvent(event)
	} catch(e) {};
	if(roam42.wB.triggeredState.activeElementId != null) {
		await roam42.common.sleep(500);
		await roam42.common.rightSidebarClose(0, false); 
		await restoreCurrentBlockSelection(); 
	}
});
const moveBlocks = async (destinationUID, iLocation, zoom=0, makeBlockRef = false)=> {
	//zoom  = 0  do nothing, 1 move blocks opened in sidebar, 2, zoomed in main window
	let zoomUID = 0;
	if( roam42.wB.triggeredState.selectedNodes != null) {
		if(iLocation==0) { //adding to top
			for(i=roam42.wB.triggeredState.selectedNodes.length-1; i>=0; i--) {
				const blockToMove = roam42.wB.triggeredState.selectedNodes[i].querySelector('.rm-block-text').id.slice(-9);
				if(makeBlockRef==true) { 
					await roam42.common.createSiblingBlock(blockToMove, `((${blockToMove}))`);
					await roam42.common.sleep(100);
				}
				roam42.common.moveBlock(destinationUID, iLocation, blockToMove);
				if(zoomUID ==0) zoomUID = destinationUID; //go to first block in move
			}
		} else {
			for(i=0; i<=roam42.wB.triggeredState.selectedNodes.length-1; i++) {
				const blockToMove =  roam42.wB.triggeredState.selectedNodes[i].querySelector('.rm-block-text').id.slice(-9);
				if(makeBlockRef==true) { 
					await roam42.common.createSiblingBlock(blockToMove, `((${blockToMove}))`);
					await roam42.common.sleep(100);
				}
				roam42.common.moveBlock(destinationUID, iLocation, blockToMove);
				if(zoomUID ==0) zoomUID = destinationUID; //go to first block in move
			}
		}
	}
	else if(roam42.wB.triggeredState.activeElementId!=null) {
		if(destinationUID!=roam42.wB.triggeredState.activeElementId.slice(-9)) {//single block move
			let blockToMove = roam42.wB.triggeredState.activeElementId.slice(-9);
			if(makeBlockRef==true) { 
				await roam42.common.createSiblingBlock(blockToMove, `((${blockToMove}))`);
				await roam42.common.sleep(100);
			}
			roam42.common.moveBlock(destinationUID, iLocation, blockToMove);
			zoomUID = blockToMove;	
		}
	}
	if(zoom>0) await roam42.common.sleep(150);
	if(zoom==1 && zoomUID !=0) //open in  side bar
		roam42.common.navigateUiTo(zoomUID, true, 'block');
	else if(zoom==2 && zoomUID !=0) //jump to in main page
		roam42.common.navigateUiTo(zoomUID, false);
}; 

roam42.wB.moveBlocks = moveBlocks;

const excludeSelectedBlocks = ()=>{
	let nodes = [];
	if(roam42.wB.triggeredState.activeElementId != null)
		nodes = [roam42.wB.triggeredState.activeElementId.slice(-9)];
	else if(roam42.wB.triggeredState.selectedNodes != null) 
		for (node of roam42.wB.triggeredState.selectedNodes)
			nodes.push(node.querySelector('.rm-block-text').id.slice(-9));
	return nodes;
};
//move block
roam42.wB.commandAddRunFromBlock('Move Block - to bottom (mbb)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - to bottom (mbb)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromBlock('Move Block - to top (mbt)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0)}, excludeSelectedBlocks(),null,null,true)});
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - to top (mbt)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0)}, excludeSelectedBlocks(),null,null,true)});				

//move block and leave block ref
roam42.wB.commandAddRunFromBlock('Move Block - to bottom with block ref (mbbr)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000, 0, true)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - to bottom with block ref (mbbr)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000, 0, true)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromBlock('Move Block - to top with block Ref (mbtr)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0, 0, true)}, excludeSelectedBlocks(),null,null,true)});
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - to top with block refs (mbtr)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0, 0, true)}, excludeSelectedBlocks(),null,null,true)});				

//move block & zoom
roam42.wB.commandAddRunFromBlock('Move Block - to bottom & zoom (mbbz)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000, 2)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - to bottom & zoom (mbbz)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000,2)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromBlock('Move Block - to top & zoom (mbtz)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0, 2)}, excludeSelectedBlocks(),null,null,true)});
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - to top & zoom (mbtz)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0, 2)}, excludeSelectedBlocks(),null,null,true)});
//move block & sidebar
roam42.wB.commandAddRunFromBlock('Move Block - to bottom & sidebar (mbbs)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000, 1)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks -to bottom & sidebar (mbbs)', async ()=>{ roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 10000,1)}, excludeSelectedBlocks(),null,null,true) });
roam42.wB.commandAddRunFromBlock('Move Block - to top & sidebar (mbts)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0, 1)}, excludeSelectedBlocks(),null,null,true)});
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks -to top & sidebar (mbts)', async ()=>{roam42.wB.path.launch(async (uid)=>{ moveBlocks(uid, 0, 1)}, excludeSelectedBlocks(),null,null,true)});

roam42.wB.commandAddRunFromAnywhere("Open Page (opp)", async ()=>{roam42.wB.path.launch(async (uid)=>{roam42.common.navigateUiTo(uid)},[],null,null,true) });
roam42.wB.commandAddRunFromAnywhere("Open Page in Sidebar (ops)", async ()=>{roam42.wB.path.launch(async (uid)=>{roam42.common.navigateUiTo(uid,true)},[],null,null,true) });

const MoveBlockDNP =  async ()=>{ 
	let dateExpression = prompt('Move this block to the top of what date?', 'Tomorrow');
	if(dateExpression == null) return;
	let parsedDate = roam42.dateProcessing.parseTextForDates(dateExpression)
	if(parsedDate==dateExpression) { 
		roam42.help.displayMessage('Invalid date: ' + dateExpression ,5000);
		return;
	} else
		parsedDate = parsedDate.substring(2,parsedDate.length-3);
	//move the block, and leave behind a block ref
	let startingBlockUID = roam42.sb.startingBlockTextArea.slice(-9);
	let destinationPage = await roam42.common.getPageUidByTitle(parsedDate);
	if(destinationPage=='') {
		//DNP does not exist, create it before going further
		await roam42.common.createPage(parsedDate);
		await roam42.common.sleep(150);
		destinationPage = await roam42.common.getPageUidByTitle(parsedDate);
	}
	console.log(destinationPage,parsedDate,excludeSelectedBlocks());
	setTimeout( ()=>{ roam42.wB.path.launch( (async (uid)=>{ moveBlocks(uid, 0, 0)}), excludeSelectedBlocks(), destinationPage, parsedDate.toString(),true ) },200);
};
roam42.wB.commandAddRunFromBlock('Move Block - DNP (mbdnp)', async ()=>{ MoveBlockDNP() } );
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - DNP (mbdnp)', async ()=>{ MoveBlockDNP() } );

const pullBlockToThisBlock = async (uidToMove, makeBlockRef = false)=>{
	const activeBlockUID = roam42.wB.triggeredState.activeElementId.slice(-9);
	if(makeBlockRef==true) { 
		await roam42.common.createSiblingBlock(uidToMove, `((${uidToMove}))`);
		await roam42.common.sleep(100);
	}
	await roam42.common.moveBlock(activeBlockUID, 0, uidToMove);
	await roam42.common.sleep(100);
	await roam42.wB.restoreCurrentBlockSelection();

};
roam42.wB.commandAddRunFromBlock('Pull block (pbb)', async ()=>{ roam42.wB.path.launch(async (uid)=>{pullBlockToThisBlock(uid)}, excludeSelectedBlocks()) });
roam42.wB.commandAddRunFromBlock('Pull block and leave block ref (pbr)', async ()=>{ roam42.wB.path.launch(async (uid)=>{pullBlockToThisBlock(uid,true)}, excludeSelectedBlocks()) });


roam42.wB.commandAddRunFromAnywhere('Jump to Block in page (jbp)', async ()=>{
	 roam42.wB.path.launch(async (uid)=>{
		 console.log(uid, roam42.wB.path.trailUID )
		 if(uid!=roam42.wB.path.trailUID[0]){
		   roam42.common.navigateUiTo(roam42.wB.path.trailUID[0], false);
			 await roam42.common.sleep(500);
		 }
		 document.querySelector(`[id*="${uid}"]`).scrollIntoView();
		 await roam42.common.sleep(200);
		 	roam42.common.simulateMouseClick( document.body );
 			await roam42.common.sleep(50);
			roam42.common.simulateMouseClick( document.querySelector(`[id*="${uid}"]`) );
			await roam42.common.sleep(250);
			document.activeElement.selectionStart = document.activeElement.value.length;
			document.activeElement.selectionEnd   = document.activeElement.value.length;
		}, excludeSelectedBlocks(),null,null,true); 
});




try{ roam42.wB.commandAddRunFromAnywhere("Roam42 Privacy Mode (alt-shift-p)", roam42.privacyMode.toggle) } catch(e){};
try{ roam42.wB.commandAddRunFromAnywhere("Roam42 Converter (alt-m)", roam42.formatConverterUI.show) } catch(e){};
try{ roam42.wB.commandAddRunFromAnywhere("Roam42 Web View (alt-shift-m)", roam42.formatConverterUI.htmlview) } catch(e){};
try{ roam42.wB.commandAddRunFromAnywhere("Roam42 Help", roam42.quickRef.component.toggleQuickReference) } catch(e) {};
try{ roam42.wB.commandAddRunFromAnywhere("Roam42 Tutorials", roam42.tutorials.show) } catch(e) {};
try{ roam42.wB.commandAddRunFromAnywhere("Roam42 Graph DB Stats", roam42.stats.displayGraphStats) } catch(e) {};

try{ roam42.wB.commandAddRunFromAnywhere("Goto next day - Roam42 (ctrl-shift-.)", ()=>{ roam42.jumpToDate.component.moveForwardToDate(true) }) } catch(e) {};
try{ roam42.wB.commandAddRunFromAnywhere("Goto previous day - Roam42 (ctrl-shift-.)", ()=>{ roam42.jumpToDate.component.moveForwardToDate(false) }) } catch(e) {};


roam42.wB.commandAddRunFromBlock('Heading 1 (Alt+Shift+1)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j 5')} );
roam42.wB.commandAddRunFromBlock('Heading 2 (Alt+Shift+2)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j 6')} );
roam42.wB.commandAddRunFromBlock('Heading 3 (Alt+Shift+3)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j 7')} );

roam42.wB.commandAddRunFromBlock('Copy Block Reference - Jump Nav (Meta-j r)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j r')} );
roam42.wB.commandAddRunFromBlock('Copy Block Reference as alias - Jump Nav (Meta-j s)', ()=>{ roam42.jumpnav.jumpCommandByActiveElement('ctrl+j s')} );


//DELETE PAGE
const confirmDeletePage = (pageUID, pageTitle)=>{
	iziToast.question({
			timeout: 20000, close: false, overlay: true, displayMode: 'once', id: 'question', color: 'red', zindex: 999, position: 'center',
			message: `Are you sure you want to <span style='color:red'><b>DELETE</b></span> the page? <br><br> <b>${pageTitle}</b> <br><br>`,
			buttons: [
				['<button>NO</button>', (instance, toast)=> {instance.hide({ transitionOut: 'fadeOut' }, toast, 'button') },true],
				['<button><b>YES</b></button>', (instance, toast)=> {
						instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
						roam42.common.navigateUiTo( roam42.dateProcessing.getRoamDate(new Date()) );
						setTimeout( async ()=>{
							await roam42.common.deleteBlock(pageUID);
						}, 500);
				}],
			],
	});
}

const deleteCurrentPage = async ()=>{
	const uid = await roam42.common.currentPageUID();
	const currentPageTitle = (await roam42.common.getBlockInfoByUID(uid))[0][0].title;
	confirmDeletePage(uid, currentPageTitle);
}

const deleteSomePage = async ()=>{
	await roam42.wB.path.launch( async (uid)=>{
		const blockInfo = await roam42.common.getBlockInfoByUID(uid,false,true);
		let currentPageTitle = blockInfo[0][0].title;
		if(currentPageTitle == undefined) {
			currentPageTitle = blockInfo[0][0].parents[0].title;
			uid = blockInfo[0][0].parents[0].uid;
		}
		confirmDeletePage(uid, currentPageTitle);
	},[],null,null,true);
	
}
roam42.wB.commandAddRunFromAnywhere("Delete current page (dcp)",async ()=>{ deleteCurrentPage()})
roam42.wB.commandAddRunFromAnywhere("Delete a page using Path Navigator (dap)",async ()=>{ deleteSomePage()})

//CREATE  PAGE
const createThisPage = (instance, toast, textInput,  shiftKey)=>{
	if(textInput.length>0) {
		setTimeout( async ()=>{
			const pageUID  =  await roam42.common.getPageUidByTitle(textInput)
			if(pageUID!='') {
				roam42.help.displayMessage(`Page <b>${textInput}</b> already exists.`, 5000);
				document.querySelector('#roam42-wB-CreatePage-input').focus();
			} else {
				instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
				await roam42.common.createPage(textInput);
				await roam42.common.sleep(50);
				roam42.common.navigateUiTo( textInput, shiftKey);
			}
		},10);
	}
}
roam42.wB.commandAddRunFromAnywhere("Create a page (cap)",async ()=>{
	let textInput = '';
	iziToast.info({
		timeout: 120000, overlay: true, displayMode: 'once', id: 'inputs', zindex: 999, title: 'Create Page', position: 'center',  drag: false,
    inputs: [
        ['<input type="text" id="roam42-wB-CreatePage-input">', 'keyup', (instance, toast, input, e)=> {
					textInput = input.value;
					document.querySelector('#roam42-wB-createPage-CREATE').style.visibility = input.value.length>0 ? 'visible' : 'hidden';
					if(e.key=='Enter') createThisPage(instance, toast, textInput, e.shiftKey);
        }, true],
    ],
		buttons: [
			['<button id="roam42-wB-createPage-CREATE" style="visibility:hidden"><b>CREATE</b></button>', (instance, toast)=> {
					createThisPage(instance, toast, textInput, false);
			}],
			['<button>CANCEL</button>', (instance, toast)=> {
					instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
			}],
		],
	});	
});


// from https://stackoverflow.com/a/44438404
// replaces all "new line" characters contained in `someString` with the given `replacementString`
const replaceNewLineChars = ((someString, replacementString = ``) => { // defaults to just removing
  const LF = `\u{000a}`; // Line Feed (\n)
  const VT = `\u{000b}`; // Vertical Tab
  const FF = `\u{000c}`; // Form Feed
  const CR = `\u{000d}`; // Carriage Return (\r)
  const CRLF = `${CR}${LF}`; // (\r\n)
  const NEL = `\u{0085}`; // Next Line
  const LS = `\u{2028}`; // Line Separator
  const PS = `\u{2029}`; // Paragraph Separator
  const ZW = `\u{200B}`; // Zero  white space https://www.fileformat.info/info/unicode/char/200b/index.htm
  const lineTerminators = [LF, VT, FF, CR, CRLF, NEL, LS, PS, ZW]; // all Unicode `lineTerminators`
  let finalString = someString.normalize(`NFD`); // better safe than sorry? Or is it?
  for (let lineTerminator of lineTerminators) {
    if (finalString.includes(lineTerminator)) { // check if the string contains the current `lineTerminator`
      let regex = new RegExp(lineTerminator.normalize(`NFD`), `gu`); // create the `regex` for the current `lineTerminator`
      finalString = finalString.replace(regex, replacementString); // perform the replacement
    };
  };
  return finalString.normalize(`NFC`); // return the `finalString` (without any Unicode `lineTerminators`)
});

roam42.wB.commandAddRunFromMultiBlockSelection('Remove blank blocks at current level (rbbcl) - not recursive', async ()=>{
	for(i=roam42.wB.triggeredState.selectedNodes.length-1; i>=0; i--) {
		const blockToAnalyze = roam42.wB.triggeredState.selectedNodes[i].querySelector('.rm-block-text').id.slice(-9);
		const blockInfo = await roam42.common.getBlockInfoByUID( blockToAnalyze, true );
		if( !blockInfo[0][0].children ) { //don't process if it has child blocks
			if (blockInfo[0][0].string.trim().length == 0 || blockInfo[0][0].string == '' ) //this is a blank, should delete
				await roam42.common.deleteBlock(blockToAnalyze);
			else if(blockInfo[0][0].string.trim().length == 1) { //test if this is a line break
				const stringText = replaceNewLineChars( blockInfo[0][0].string.trim() );
				if(stringText.length==0)
					await roam42.common.deleteBlock(blockToAnalyze);
			}
		}
	}
});

roam42.wB.commandAddRunFromAnywhere('workBench - Generate command list',()=>{ 
	iziToast.question({
		timeout: 20000, close: false, overlay: true, displayMode: 'once', id: 'question', color: 'green', zindex: 999, position: 'center',
		message: `Create a page with a list of workBench commands. Proceed?`,
		buttons: [
			['<button><b>YES</b></button>', (instance, toast)=> {
					instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
					setTimeout( async ()=>{
						const userCommands = await roam42.wB.userCommands.UserDefinedCommandList();
						const builtinCommands = await roam42.wB._commands;

						const newPageTitle = '#[[42workBench]] Command List as of ' + dayjs().format('YYYY-MM-DD hh:mm ');
						const newPageUID = await roam42.common.createPage( newPageTitle );

						const userCommandsParentUID = await roam42.common.createBlock(newPageUID, 0, '**User Defined Commands**')
						const userCommandsArray = userCommands.map(c=>c.key)
						await roam42.common.batchCreateBlocks(userCommandsParentUID, 0, userCommandsArray);	

						const builtinCommandsParentUID = await roam42.common.createBlock(newPageUID, 1, '**Built-in Commands**')
						const builtinCommandsArray = builtinCommands.map(c=>c.display);
						await roam42.common.batchCreateBlocks(builtinCommandsParentUID, 0, builtinCommandsArray);

						await roam42.common.navigateUiTo(newPageTitle);
					}, 10);
			}, true],
			['<button>NO</button>', (instance, toast)=> {instance.hide({ transitionOut: 'fadeOut' }, toast, 'button') }],
		],
	});
});

roam42.wB.commandAddRunFromAnywhere("Reload workBench (rwb)", async ()=>{ 
	await roam42.common.sleep(100);
	try{ await roam42.wB.restoreCurrentBlockSelection() } catch(e){}
	roam42.wB.testReload(); 
	roam42.help.displayMessage('Reloading workBench.', 2000);
});

} //end of module