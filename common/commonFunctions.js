// roam42.common
(()=>{

  roam42.common = {};

  roam42.common.sleep = m => new Promise(r => setTimeout(r, m))

  roam42.common.baseUrl = () => {
    const url = new URL(window.location.href);
    const parts = url.hash.split('/');
    url.hash = parts.slice(0, 3).concat(['page']).join('/');
    return url;
  };

	roam42.common.navigateUiTo = async function (destinationPage, openInSideBar=false, sSidebarType = 'outline') {
		//sSidebarType = block, outline, graph
		const prefix = destinationPage.substring(0,2);
		const suffix = destinationPage.substring(destinationPage.length-2,destinationPage.length);
		if(sSidebarType=='outline' && ( prefix == '((' && suffix == '))' ) ) //test if block ref to open in block mode
			sSidebarType = 'block'; //chnage to block mode
		if( ( prefix == '[[' && suffix == ']]' ) || ( prefix == '((' && suffix == '))' ) )
			destinationPage = destinationPage.substring(2,destinationPage.length-2);
		let uid = await roam42.common.getPageUidByTitle(destinationPage);
		if(uid == '')  {
			//test if UID for zooming in, if not create page
			uid = await roam42.common.getBlockInfoByUID(destinationPage);
			if(uid == null) { //not a page, nor UID so create page
				if(destinationPage.length>255)	
					destinationPage = destinationPage.substring(0,254);
				await roam42.common.createPage( destinationPage );
				await roam42.common.sleep(50);
				uid = await await roam42.common.getPageUidByTitle(destinationPage);
			} else {
				uid = destinationPage; //seems to be a UID, zoom it
			}
		}
		if( openInSideBar==false ) 
			document.location.href= this.baseUrl().href + '/' + uid;
		else {
			await roamAlphaAPI.ui.rightSidebar.addWindow( { window: { "block-uid": uid, type: sSidebarType }} );
		}
	}, //navigateUIToDate

	roam42.common.commandPaletteAdd = async (label, callBack)=>{
		return	await roamAlphaAPI.ui.commandPalette.addCommand({label: label, callback: callBack });
	};

  roam42.common.sortObjectByKey = async o => {
    return o.sort(function(a, b) {
      return a.key.localeCompare(b.key);
    });
  };

  roam42.common.sortObjectsByOrder = async o => {
    return o.sort(function(a, b) {
      return a.order - b.order;
    });
  };

  roam42.common.asyncQuerySelector = async (node, query) => {
    try {
      return await (query ? node.querySelector(query) : node);
    } catch (error) {
      console.error(`Cannot find ${query ? `${query} in`: ''} ${node}.`, error);
      return null;
    }
  };

	roam42.common.rightSidebarClose = async ( iWindow , bRestoreLocation = true )=>{
		//iWindow = 0 to close all windows, otherwise the number of the window to close
		if(await roamAlphaAPI.ui.rightSidebar.getWindows().length>0){
			let restoreLocation = bRestoreLocation ? roam42.common.saveLocationParametersOfTextArea( document.activeElement ) : null;
			await roamAlphaAPI.ui.rightSidebar.open();
			await roam42.common.sleep(250);
			var panes = document.querySelectorAll('.sidebar-content .bp3-icon-cross');
			if( iWindow == 0) {
				numberOfPanes = panes.length;
				for(let i=0;i<=numberOfPanes-1;i++) {
					roam42.common.simulateMouseClick( document.querySelector('.sidebar-content .bp3-icon-cross') );
					await roam42.common.sleep(100);
				}
			}	else {
				roam42.common.simulateMouseClick( panes[ iWindow -1 ] );
			}
			if(bRestoreLocation) roam42.common.restoreLocationParametersOfTexArea(restoreLocation);
			await roam42.common.sleep(300);
		}
	}

	roam42.common.swapWithSideBar = async (paneNumber=1)=>{
		const panes = await roamAlphaAPI.ui.rightSidebar.getWindows();
		if(panes.length==0) {
			roam42.help.displayMessage('No open side windows to swap with.',5000);
			return;
		}
		const mainPageUID = await roam42.common.currentPageUID()
		let paneToSwap = await roamAlphaAPI.ui.rightSidebar.getWindows()[paneNumber-1]['page-uid'];
		if(paneToSwap == undefined) paneToSwap = await roamAlphaAPI.ui.rightSidebar.getWindows()[paneNumber-1]['block-uid'];
		if(paneToSwap != undefined) {
			roam42.common.navigateUiTo(paneToSwap,false); //move to main window
			roam42.common.navigateUiTo(mainPageUID,true); //move to side bar main page
			await roam42.common.sleep(500);
			await roam42.common.rightSidebarClose(paneNumber+1,false);
		}
	}	

  roam42.common.sidebarRightToggle = ()=>{
    try {
			if(document.querySelector('#roam-right-sidebar-content'))
			 	roamAlphaAPI.ui.rightSidebar.close();
			else
				roamAlphaAPI.ui.rightSidebar.open();
    } catch(e) {console.log(e)}
  }

  roam42.common.sidebarLeftToggle = ()=> {
    var event = new MouseEvent('mouseover', { 'view': window, 'bubbles': true, 'cancelable': true });
    try {
      //try to open menu
      document.getElementsByClassName("bp3-icon-menu-closed")[0].click();
      roam42.common.simulateMouseOver(document.getElementsByClassName("roam-article")[0]); //.dispatchEvent(event)
    } catch(e) {
      try {
        document.getElementsByClassName("bp3-icon-menu")[0].dispatchEvent(event);
      } catch(e) {} //if on ipad, the above command fails, so go to next step
      setTimeout(()=>{
        document.getElementsByClassName("bp3-icon-menu-open")[0].click();
      },100);
    }
  }

  //https://stackoverflow.com/questions/40091000/simulate-click-event-on-react-element
  const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
  roam42.common.simulateMouseClick = (element)=> {
		try{
			mouseClickEvents.forEach(mouseEventType =>
				element.dispatchEvent( new MouseEvent(mouseEventType, { view: window, bubbles: true, cancelable: true, buttons: 1 }) )
			);
		} catch(e) {}
  }

  const mouseClickEventsRight = ['contextmenu'];
  roam42.common.simulateMouseClickRight = (element)=> {
    mouseClickEventsRight.forEach(mouseEventType =>
      element.dispatchEvent( new MouseEvent(mouseEventType, { view: window, bubbles: true, cancelable: true, buttons: 1 }) )
    );
  }

  const mouseOverEvents = ['mouseover'];
  roam42.common.simulateMouseOver = (element)=> {
    mouseOverEvents.forEach(mouseEventType =>
      element.dispatchEvent( new MouseEvent(mouseEventType, { view: window, bubbles: true, cancelable: true, buttons: 1 }) )
    );
  }

  //grabs the selection information of a ext area
  roam42.common.saveLocationParametersOfTextArea = element => {
    return {
      id:         element.id,
      selStart:   element.selectionStart,
      selEnd:     element.selectionEnd
    }
  }

  //activates a block and sets its selection area
  roam42.common.restoreLocationParametersOfTexArea = locationFacts => {
    setTimeout(()=>{
      roam42.common.simulateMouseClick( document.getElementById(locationFacts.id) );
      setTimeout(()=>{
        document.getElementById(locationFacts.id).selectionStart = locationFacts.selStart;
        document.getElementById(locationFacts.id).selectionEnd = locationFacts.selEnd;
      },100);
    },100);
  }

  // updates an empty text area with a new value. This function does some additional work
  // because the textarea in roam is managed by React component, and it wasn't being triggered to
  // update when inserting a value
  roam42.common.setEmptyNodeValue = (element, value) => {
    const e = new Event('input', { bubbles: true });
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      'value'
    ).set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else {
      valueSetter.call(element, value);
    }
    element.dispatchEvent(e);
  }

  //Inserts text at the current cursor location in a textara
  roam42.common.insertAtCaret = (areaId, text) => {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br =
      txtarea.selectionStart || txtarea.selectionStart == '0'
        ? 'ff'
        : document.selection
        ? 'ie'
        : false;
    if (br == 'ie') {
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart('character', -txtarea.value.length);
      strPos = range.text.length;
    } else if (br == 'ff') strPos = txtarea.selectionStart;

    var front = txtarea.value.substring(0, strPos);
    var back = txtarea.value.substring(strPos, txtarea.value.length);
    roam42.common.setEmptyNodeValue(txtarea, front + text + back);
    setTimeout( ()=> {
        strPos = strPos + text.length;
        if (br == 'ie') {
          txtarea.focus();
          var range = document.selection.createRange();
          range.moveStart("character", -txtarea.value.length);
          range.moveStart("character", strPos);
          range.moveEnd("character", 0);
          range.select();
        } else if (br == 'ff') {
          txtarea.selectionStart = strPos;
          txtarea.selectionEnd = strPos;
          txtarea.focus();
        }
        txtarea.scrollTop = scrollPos;
      }, 100);
  }

  roam42.common.replaceAsync = (string, searchValue, replacer) => {
    //https://github.com/dsblv/string-replace-async#readme
    try {
      if (typeof replacer === "function") {
        // 1. Run fake pass of `replace`, collect values from `replacer` calls
        // 2. Resolve them with `Promise.all`
        // 3. Run `replace` with resolved values
        var values = [];
        String.prototype.replace.call(string, searchValue, function () {
          values.push(replacer.apply(undefined, arguments));
          return "";
        });
        return Promise.all(values).then(function (resolvedValues) {
          return String.prototype.replace.call(string, searchValue, function () {
            return resolvedValues.shift();
          });
        });
      } else {
        return Promise.resolve(
          String.prototype.replace.call(string, searchValue, replacer)
        );
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

	roam42.common.currentActiveBlockUID = ()=> {
    if (document.activeElement.localName == "textarea") 
			return document.activeElement.id.slice(-9);
		else
			return null;
	}

  roam42.common.blockDelete = (block)=> {
		if (block.localName == "textarea") {
			setTimeout(async ()=>{
				await roam42.common.moveCursorToPreviousBlock(block);
				await roam42.common.sleep(100);
				await roam42.common.deleteBlock( block.id.slice(-9) );
			},50)
		}
  }

  roam42.common.blockInsertBelow = (block)=>{
    //Block is the HTMLElement of the currently selected block
		if (block.localName == "textarea") {
			setTimeout(async ()=>{
				let newUID  =	await roam42.common.createSiblingBlock(block.id.slice(-9), '', true );
				await roam42.common.sleep(50);
				roam42.common.simulateMouseClick(document.querySelector(`div[id$='${newUID}']`))
			},50);
		}
  }

   roam42.common.blockInsertAbove = (block)=> {
    //Block is the HTMLElement of the currently selected block
		if (block.localName == "textarea") {
			setTimeout(async ()=>{
				let newUID  =	await roam42.common.createSiblingBlock(block.id.slice(-9), '', false );
				await roam42.common.sleep(50);
				roam42.common.simulateMouseClick(document.querySelector(`div[id$='${newUID}']`))
			},50);
		}
  }

	roam42.common.moveCursorToNextBlock = (block)=>{
		//Block is the HTMLElement of the currently selected block
		if (block.localName == "textarea") {
			setTimeout(async ()=>{
				block.selectionStart = block.value.length;
				block.selectionEnd   = block.value.length;
				await roam42KeyboardLib.simulateKey(40) //up arrow
				let newLocation = document.activeElement;
				newLocation.selectionStart = newLocation.value.length;
				newLocation.selectionEnd   = newLocation.value.length;
			},10);

		}
	}  

   roam42.common.moveCursorToPreviousBlock = (block)=> {
    //Block is the HTMLElement of the currently selected block
    if (block.localName == "textarea") {
			setTimeout(async ()=>{
				block.selectionStart =0;
				block.selectionEnd = 0;
				await roam42KeyboardLib.simulateKey(38) //up arrow
				let newLocation = document.activeElement;
				newLocation.selectionStart = newLocation.value.length;
				newLocation.selectionEnd   = newLocation.value.length;
			},10);
		}
	}

  roam42.common.startOfWeek = (date)=> {
    var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }



  window.roam42.common.testingReloadCommon = () => {
    roam42.loader.addScriptToPage( "Common", roam42.host + 'common/commonFunctions.js');
  };



})();
