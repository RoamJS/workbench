{
roam42.wB.commandAddRunFromAnywhere("All Pages",()=>{document.location.href=roam42.common.baseUrl().href.replace('page','') + '/search'});
roam42.wB.commandAddRunFromAnywhere("Graph Overview", ()=>{document.location.href=roam42.common.baseUrl().href.replace('page','') + '/graph'});
roam42.wB.commandAddRunFromAnywhere("Right Sidebar - close window panes (rscwp)", async ()=>{ 
	await roam42KeyboardLib.pressEsc(100);
	await roam42KeyboardLib.pressEsc(100);
	await roam42.common.rightSidebarClose(0, false); 
	await restoreCurrentBlockSelection(); 
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
			console.log(paneInfo);
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
			}
		} else {
			for(i=0; i<=roam42.wB.triggeredState.selectedNodes.length-1; i++) {
				const blockToMove =  roam42.wB.triggeredState.selectedNodes[i].querySelector('.rm-block-text').id.slice(-9);
				if(makeBlockRef==true) { 
					await roam42.common.createSiblingBlock(blockToMove, `((${blockToMove}))`);
					await roam42.common.sleep(100);
				}
				roam42.common.moveBlock(destinationUID, iLocation,blockToMove);
			}
		}
		zoomUID = roam42.wB.triggeredState.selectedNodes[0].id.slice(-9);	
	}
	else if(roam42.wB.triggeredState.activeElementId!=null) {
		if(destinationUID!=roam42.wB.triggeredState.activeElementId.slice(-9)) {//single block move
			let blockToMove = roam42.wB.triggeredState.activeElementId.slice(-9);
			if(makeBlockRef==true) { 
				await roam42.common.createSiblingBlock(blockToMove, `((${blockToMove}))`);
				await roam42.common.sleep(100);
			}
			roam42.common.moveBlock(destinationUID, iLocation, blockToMove);
			zoomUID = uid;
		}
	}
	
	if(zoom>0) await roam42.common.sleep(150);
	if(zoom==1 && zoomUID !=0) //open in  side bar
		roam42.common.navigateUiTo(zoomUID, true, 'block');
	else if(zoom==2 && zoomUID !=0) //jump to in main page
		roam42.common.navigateUiTo(zoomUID, false);
}; 
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
		await roam42.common.sleep(50);
		destinationPage = await roam42.common.getPageUidByTitle(parsedDate);
	}
	setTimeout( ()=>{ roam42.wB.path.launch( (async (uid)=>{ moveBlocks(uid, 0, 0)}), excludeSelectedBlocks(), destinationPage, parsedDate ) },200);
};
roam42.wB.commandAddRunFromBlock('Move Block - DNP (mbd)', async ()=>{ MoveBlockDNP() } );
roam42.wB.commandAddRunFromMultiBlockSelection('Move Blocks - DNP (mbds)', async ()=>{ MoveBlockDNP() } );

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

roam42.wB.commandAddRunFromAnywhere("Reload workBench (rwb)", async ()=>{ 
	await roam42.common.sleep(100);
	await roam42.wB.restoreCurrentBlockSelection();
	roam42.wB.testReload(); 
});

} //end of module