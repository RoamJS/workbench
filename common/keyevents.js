/* global roam42, sidebarRightToggle, sidebarLeftToggle, parseTextForDates, setEmptyNodeValue, typeAheadLookup, turndownPage 
  keyboardHandlerMessages, keyboardHandlerLivePreview, dailyNotesPopup2, jumpToDateComponent, rmQuickRefenceSystem
*/

var shiftKeyDownTracker = false

//CONFIGURE SHORTCUT KEYS for use in the application
const loadKeyEvents = () => {

  document.addEventListener('keydown', (ev)=> {
    shiftKeyDownTracker = ev.shiftKey
  });

  document.addEventListener('keydown', (ev)=> {
    
    //console.log('alt: ' + ev.altKey  + '  shift: ' + ev.shiftKey + '  ctrl: ' + ev.ctrlKey + '   code: ' + ev.code)
    
    shiftKeyDownTracker = ev.shiftKey;  //this is used in other modules for tracking shift state
  
    try { if( roam42.help.keyboardHandlerMessages(ev)  ) {return} } catch(e){};
    try { if( keyboardHandlerLivePreview(ev)           ) {return} } catch(e){};
    try { if( jumpToDateComponent.keyboardHandler(ev ) ) {return} } catch(e){};
    try { if( rmQuickRefenceSystem.keyboardHandler(ev) ) {return} } catch(e){};
    
    //Open right side bar 
    if (ev.altKey && ev.shiftKey &&  ev.code=='Slash' ) { 
      ev.preventDefault();
      sidebarRightToggle();
      return
    }
    
    //open left side bar
    if (ev.altKey && ev.shiftKey && (ev.code=='Backslash' || ev.key=='«') ) { 
      ev.preventDefault();      
      sidebarLeftToggle();
      return
    }  
    
    //Date NLP
    if (ev.altKey && ev.shiftKey &&  ev.code=='KeyD'  ) {  
      event.preventDefault();
      if (event.srcElement.localName == "textarea") {
        var processText = parseTextForDates( event.target.value );
        setEmptyNodeValue(document.getElementById(event.srcElement.id), processText );
      }
      return
    }
  
    //Dictonary Lookup
    if (ev.altKey && ev.shiftKey &&  (ev.code=='Period' || ev.key=='˘')  ) { 
      event.preventDefault();
      typeAheadLookup();
      return
    }

    // Daily notes page
    if (ev.altKey && ev.shiftKey &&  (ev.key=='¯' || ev.code=='Comma')  ) { 
      event.preventDefault();
      if( window != window.parent ) { 
        window.parent.document.querySelector('#jsPanelDNP').style.visibility = 'hidden';
        window.parent.document.focus()
      } else { 
        dailyNotesPopup2.toggleVisible(); 
      }
      return
    }    
    
    //insert todo #na
    if (ev.altKey && ev.shiftKey && ev.code=='KeyA'  ) {     
      event.preventDefault();
      if (event.srcElement.localName == "textarea") {
        if (document.queryCommandSupported("insertText")) {
            setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #na  " + event.srcElement.innerHTML );
        }
      }
      return
    }

    //insert todo #weekend    
    if (ev.altKey && ev.shiftKey && ev.code=='KeyW'  ) {  
      event.preventDefault();
      if (event.srcElement.localName == "textarea") {
        if (document.queryCommandSupported("insertText")) {
            setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #weekend  " + event.srcElement.innerHTML );
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
            setEmptyNodeValue(document.getElementById(event.srcElement.id), "~~" + event.srcElement.innerHTML + "~~");
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
      turndownPage();
      return
    }
    
    
  }); // End of Keydown listener
  
}  
  

  //enable hotkeys globally
//   hotkeys.filter = function(event) {
//     var tagName = (event.target || event.srcElement).tagName;
//     hotkeys.setScope(
//       /^(INPUT|TEXTAREA|SELECT)$/.test(tagName) ? 'input' : 'other'
//     )
//     return true;
//   }
  
//   hotkeys('alt+shift+d', function(event, handler) {
//     event.preventDefault()
//     if (event.srcElement.localName == "textarea") {
//       var processText = parseTextForDates( event.target.value )
//       setEmptyNodeValue(document.getElementById(event.srcElement.id), processText )
//     }
//   });
  
//   hotkeys('alt+shift+.', function(event, handler) {
//     event.preventDefault()
//     typeAheadLookup()
//   });
  
//   hotkeys('alt+shift+a', function(event, handler) {
//     event.preventDefault()
//     if (event.srcElement.localName == "textarea") {
//       if (document.queryCommandSupported("insertText")) {
//           setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #na  " + event.srcElement.innerHTML )
//       }
//     }
//   });
  
//   hotkeys('alt+shift+w', function(event, handler) {
//     event.preventDefault()
//     if (event.srcElement.localName == "textarea") {
//       if (document.queryCommandSupported("insertText")) {
//           setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #weekend  " + event.srcElement.innerHTML )
//       }
//     }
//   });
  
//   hotkeys('alt+shift+t', function(event, handler) {
//     event.preventDefault()
//     if (event.srcElement.localName == 'textarea') {
//       if (document.queryCommandSupported("insertText")) {
//         if (window.getSelection().toString() == "") {
//           setEmptyNodeValue(document.getElementById(event.srcElement.id), "~~" + event.srcElement.innerHTML + "~~")
//         } else {
//           document.execCommand(
//             "insertText",
//             false,
//             "~~" + window.getSelection().toString() + "~~"
//           )
//         }
//       }
//     }
//   })

//   hotkeys('alt+m', function(event, handler) {
//     event.preventDefault()
//     turndownPage()    
//   });
  
