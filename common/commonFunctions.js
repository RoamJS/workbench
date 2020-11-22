/* globals roam42, roam42KeyboardLib, roam42   */

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
  
    roam42.common.navigateUiTo = async function (destinationPage, useShiftKey=false) {
      var uid = await window.roamAlphaAPI.q("[:find ?uid :in $ ?a :where [?e :node/title ?a] [?e :block/uid ?uid]]", destinationPage).flat()[0]
      //page exists, go to it
      if(uid !=  undefined  && useShiftKey==false ) {
        document.location.href= this.baseUrl().href + '/' + uid;
        return true;
      }
      setTimeout(()=>{
        let inPut =  document.getElementById('find-or-create-input');
        inPut.focus();
        roam42.common.setEmptyNodeValue( inPut, destinationPage );
        setTimeout(()=>{
         if( roam42.keyevents.shiftKeyDownTracker==true && useShiftKey==true ) {
            roam42KeyboardLib.simulateKey(13,100,{  shiftKey:true});   
          } else {
            roam42KeyboardLib.pressEnter();
          }
          setTimeout(()=>{
            roam42.common.setEmptyNodeValue( inPut,'' );
          },500);             
          
        },1500)
      },100);   
    }, //navigateUIToDate
  
  
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

      
  roam42.common.sidebarRightToggle = ()=>{
    try {
        document.getElementsByClassName("bp3-icon-more")[0].click();
        document.getElementsByClassName("bp3-text-overflow-ellipsis bp3-fill")[0].click();     
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
    mouseClickEvents.forEach(mouseEventType =>
      element.dispatchEvent( new MouseEvent(mouseEventType, { view: window, bubbles: true, cancelable: true, buttons: 1 }) )
    );
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


  roam42.common.getArticleOfCurrentPage = ()=> {
    var rootOfBlocks = document.getElementsByClassName("roam-log-page")[0];
    var articleContent = null;
      //first attempts to grab the content for the default home apge
    if(rootOfBlocks) {
       articleContent = rootOfBlocks.childNodes[1].getElementsByClassName('rm-block-text');
    } else {
      // if failed, try to attempt content for the current page (which has a different structure than default page)
      rootOfBlocks = document.getElementsByClassName("roam-article")[0];
      articleContent = rootOfBlocks.childNodes[0].getElementsByClassName('rm-block-text');
    }
    return articleContent;
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

  roam42.common.blockDelete = (block)=> {
    if (block.localName == "textarea") {
      roam42KeyboardLib.pressEsc().then(() => roam42KeyboardLib.pressBackspace())
    }
  }

  roam42.common.blockInsertBelow = (block)=>{
    //Block is the HTMLElement of the currently selected block  
    if (block.localName == "textarea") {
      block.selectionStart = block.value.length;
      block.selectionEnd   = block.value.length;
      roam42KeyboardLib.pressEnter()      
    }
  }

   roam42.common.blockInsertAbove = (block)=> {
    //Block is the HTMLElement of the currently selected block  
    if (block.localName == "textarea") {
      var blockEmpty =  block.value.length>0 ? false : true;
      block.selectionStart =0;
      block.selectionEnd = 0;
      roam42KeyboardLib.pressEnter()      
  //    if(blockEmpty){setTimeout(()=>{ roam42KeyboardLib.simulateKey(38) },250) };  //up arrow
    }
  }

  window.roam42.common.testingReloadCommon = () => {
    roam42.loader.addScriptToPage( "Common", roam42.host + 'common/commonFunctions.js');
  };  
   
})();  
