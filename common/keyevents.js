/* global roam42, sidebarLeftToggle, setEmptyNodeValue, typeAheadLookup
  keyboardHandlerMessages, keyboardHandlerLivePreview
*/


//CONFIGURE SHORTCUT KEYS for use in the application

// roam42.keyevents 
(()=>{
  
  roam42.keyevents = {};
  roam42.keyevents.shiftKeyDownTracker = false;

  roam42.keyevents.loadKeyEvents = ()=> {


    document.addEventListener('keydown', (ev)=> {

      //console.log('alt: ' + ev.altKey  + '  shift: ' + ev.shiftKey + '  ctrl: ' + ev.ctrlKey + '   code: ' + ev.code)

      roam42.keyevents.shiftKeyDownTracker = ev.shiftKey;  //this is used in other modules for tracking shift state

      try { if( roam42.help.keyboardHandlerMessages(ev)  ) {return} } catch(e){};
      try { if( roam42.livePreview.keyboardHandlerLivePreview(ev)           ) {return} } catch(e){};
      try { if( roam42.jumpToDate.component.keyboardHandler(ev ) ) {return} } catch(e){};
      try { if( roam42.quickRef.component.keyboardHandler(ev) ) {return} } catch(e){};
      try { if( roam42.privacyMode.keyboardHandler(ev) ) {return} } catch(e){};      

      //Open right side bar 
      if (ev.altKey && ev.shiftKey &&  ev.code=='Slash' ) { 
        ev.preventDefault();
        roam42.common.sidebarRightToggle();
        return
      }

      //open left side bar
      if (ev.altKey && ev.shiftKey && (ev.code=='Backslash' || ev.key=='«') ) { 
        ev.preventDefault();      
        roam42.common.sidebarLeftToggle();
        return
      }  

      //Date NLP
      if (ev.altKey && ev.shiftKey &&  ev.code=='KeyD'  ) {  
        event.preventDefault();
        if (event.srcElement.localName == "textarea") {
          var processText = roam42.dateProcessing.parseTextForDates( event.target.value );
          roam42.common.setEmptyNodeValue(document.getElementById(event.srcElement.id), processText );
        }
        return
      }

      //Dictonary Lookup
      if (ev.altKey && ev.shiftKey &&  (ev.code=='Period' || ev.key=='˘')  ) { 
        event.preventDefault();
        roam42.typeAhead.typeAheadLookup();
        return
      }

      // Daily notes page
      if (ev.altKey && ev.shiftKey &&  (ev.key=='¯' || ev.code=='Comma')  ) { 
        event.preventDefault();
        if( window != window.parent ) { 
          window.parent.document.querySelector('#jsPanelDNP').style.visibility = 'hidden';
        } else { 
          roam42.dailyNotesPopup.component.toggleVisible(); 
        }
        return
      }    

      //insert todo #na
      if (ev.altKey && ev.shiftKey && ev.code=='KeyA'  ) {     
        event.preventDefault();
        if (event.srcElement.localName == "textarea") {
          if (document.queryCommandSupported("insertText")) {
              roam42.common.setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #na  " + event.srcElement.innerHTML );
          }
        }
        return
      }

      //insert todo #weekend    
      if (ev.altKey && ev.shiftKey && ev.code=='KeyW'  ) {  
        event.preventDefault();
        if (event.srcElement.localName == "textarea") {
          if (document.queryCommandSupported("insertText")) {
              roam42.common.setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #weekend  " + event.srcElement.innerHTML );
          }
        }
        return
      }

      //do a strikeout    
      if (ev.altKey && ev.shiftKey && ev.code=='KeyT'  ) {  
        event.preventDefault();
        if (event.srcElement.localName == 'textarea') {
          if (document.queryCommandSupported("insertText")) {
            if (window.getSelection().toString() == "") {
              roam42.common.setEmptyNodeValue(document.getElementById(event.srcElement.id), "~~" + event.srcElement.innerHTML + "~~");
            } else {
              document.execCommand(
                "insertText",
                false,
                "~~" + window.getSelection().toString() + "~~"
              );
            }
          }
        }
        return
      }

      //simple markdown
      if (ev.altKey && ev.shiftKey==false &&  ev.code=='KeyM'  ) {  
        event.preventDefault();
        // roam42.turndownPage();
        roam42.formatConverterUI.show();
        return
      }

      //HTML view
      if (ev.ctrlKey && ev.shiftKey==false &&  ev.code=='KeyM'  ) {  
        event.preventDefault();
        roam42.formatConverterUI.htmlview();
        return
      }
      
    }); 
  } // End of Keydown listener
  
})();