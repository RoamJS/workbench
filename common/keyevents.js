/* global hotkeys,toggleDailyNotes, typeaheadDisplayTextArea,typeaheadDisplayOtherAreas, iziToast, simulateMouseClick
testingScript, TurndownService , turndownPage, setEmptyNodeValue , parseTextForDates, jumpToDate , displayHelp, getArticleOfCurrentPage*/
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
  
  hotkeys('alt+shift+h', function(event, handler) {
    event.preventDefault()
    displayHelp(10000)
  });
  
  hotkeys('alt+shift+/', function(event, handler) {
    event.preventDefault()
    try {
        document.getElementsByClassName("bp3-icon-more")[0].click()
        document.getElementsByClassName("bp3-text-overflow-ellipsis bp3-fill")[0].click()      
    } catch(e) {console.log(e)}
  });
  
  
  hotkeys('alt+shift+\\', function(event, handler) {
    event.preventDefault()
    var event = new MouseEvent('mouseover', { 'view': window, 'bubbles': true, 'cancelable': true });
    try {
      //try to open menu
      document.getElementsByClassName("bp3-icon-menu")[0].dispatchEvent(event)
      setTimeout(()=>{
        document.getElementsByClassName("bp3-icon-menu-open")[0].click()
      },200)
    } catch(e) {
    // if fails, menu open, so need to close it
      document.getElementsByClassName("bp3-icon-menu-closed")[0].click()
      document.getElementsByClassName("roam-article")[0].dispatchEvent(event)
    }     
  });
  
  hotkeys('alt+shift+d', function(event, handler) {
    event.preventDefault()
    if (event.srcElement.localName == "textarea") {
      var processText = parseTextForDates( event.target.value )
      setEmptyNodeValue(document.getElementById(event.srcElement.id), processText )
    }
  });
  
  hotkeys('alt+shift+,', function(event, handler) {
    event.preventDefault()
      toggleDailyNotes()          
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
  

  hotkeys('alt+j, alt+k, alt+∆, alt+˚', function(event, handler) {
    event.preventDefault()
    var articleContent = getArticleOfCurrentPage()
    event.key=='k' || event.key=='˚' ? simulateMouseClick(articleContent[ articleContent.length-1 ]) : simulateMouseClick(articleContent[0])
  });  

}
