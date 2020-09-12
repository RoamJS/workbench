/* global hotkeys,toggleDailyNotes, typeaheadDisplayTextArea,typeaheadDisplayOtherAreas, iziToast, simulateMouseClick
testingScript, Mousetrap, TurndownService , turndownPage, setEmptyNodeValue , parseTextForDates, jumpToDate , displayHelp, getArticleOfCurrentPage*/
//based on the libary https://wangchujiang.com/hotkeys/

//CONFIGURE SHORTCUT KEYS for use in the application
const loadKeyEvents = () => {
  
  //enable hotkeys globally
  hotkeys.filter = function(event) {
    var tagName = (event.target || event.srcElement).tagName;
    hotkeys.setScope(
      /^(INPUT|TEXTAREA|SELECT)$/.test(tagName) ? 'input' : 'other'
    )
    return true;
  }
  
  // hotkeys('alt+shift+h', function(event, handler) {
  //   event.preventDefault()
  //   displayHelp(10000)
  // });

  Mousetrap(document.getElementById("find-or-create-input")).bind('shift+space',()=>{
    setTimeout(()=>{
      simulateMouseClick ( document.querySelectorAll('.rm-search-title')[1] )
    },200)
    return false
  })
  
  Mousetrap(document.getElementById("textarea.rm-block-input")).bind('shift+space',()=>{
    if(document.querySelector(".bp3-elevation-3")){
      setTimeout(()=>{
        if( document.querySelector('.rm-autocomplete-result').parentElement.childElementCount > 1) {
          document.querySelector(".bp3-elevation-3").childNodes[1].click()        
        } else {
          document.querySelector(".bp3-elevation-3").childNodes[0].click()  
        }
        setTimeout(()=> document.execCommand("insertText",false," "),100)
      },200)
    }
    return false
  })
  
  hotkeys('alt+shift+d', function(event, handler) {
    event.preventDefault()
    if (event.srcElement.localName == "textarea") {
      var processText = parseTextForDates( event.target.value )
      setEmptyNodeValue(document.getElementById(event.srcElement.id), processText )
    }
  });
  
  hotkeys('alt+shift+.', function(event, handler) {
    event.preventDefault()
      if(event.srcElement.localName=='textarea') {
        typeaheadDisplayTextArea(event.srcElement.id)
      } else {
        typeaheadDisplayOtherAreas()
      }
  });
  
  hotkeys('alt+shift+a', function(event, handler) {
    event.preventDefault()
    if (event.srcElement.localName == "textarea") {
      if (document.queryCommandSupported("insertText")) {
          setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #na  " + event.srcElement.innerHTML )
      }
    }
  });
  
  hotkeys('alt+shift+w', function(event, handler) {
    event.preventDefault()
    if (event.srcElement.localName == "textarea") {
      if (document.queryCommandSupported("insertText")) {
          setEmptyNodeValue(document.getElementById(event.srcElement.id),  "{{[[TODO]]}} #weekend  " + event.srcElement.innerHTML )
      }
    }
  });
  
  hotkeys('alt+shift+t', function(event, handler) {
    event.preventDefault()
    if (event.srcElement.localName == 'textarea') {
      if (document.queryCommandSupported("insertText")) {
        if (window.getSelection().toString() == "") {
          setEmptyNodeValue(document.getElementById(event.srcElement.id), "~~" + event.srcElement.innerHTML + "~~")
        } else {
          document.execCommand(
            "insertText",
            false,
            "~~" + window.getSelection().toString() + "~~"
          )
        }
      }
    }
  })

  hotkeys('alt+m', function(event, handler) {
    event.preventDefault()
    turndownPage()    
  });
  
}