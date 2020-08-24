/* global hotkeys,toggleDailyNotes, typeaheadDisplayTextArea,typeaheadDisplayOtherAreas, iziToast,
testingScript, TurndownService , turndownPage, setEmptyNodeValue , parseTextForDates, jumpToDate , displayHelp*/
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
  

  
  //https://stackoverflow.com/questions/40091000/simulate-click-event-on-react-element
  const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
  const simulateMouseClick = (element)=> {
    mouseClickEvents.forEach(mouseEventType =>
      element.dispatchEvent(
        new MouseEvent(mouseEventType, { view: window, bubbles: true, cancelable: true, buttons: 1
        })
      )
    )
  }
  
  const getArticleOfCurrentPage = ()=> {
    var rootOfBlocks = document.getElementsByClassName("roam-log-page")[0]
    var articleContent = null
      //first attempts to grab the content for the default home apge
    if(rootOfBlocks) {
       articleContent = rootOfBlocks.childNodes[1].getElementsByClassName('rm-block-text')
    } else {
      // if failed, try to attempt content for the current page (which has a different structure than default page)
      rootOfBlocks = document.getElementsByClassName("roam-article")[0]
      articleContent = rootOfBlocks.childNodes[0].getElementsByClassName('rm-block-text')
    }
    return articleContent
  }
  
  hotkeys('alt+j, alt+k, alt+∆, alt+˚', function(event, handler) {
    event.preventDefault()
    var articleContent = getArticleOfCurrentPage()
    event.key=='k' || event.key=='˚' ? simulateMouseClick(articleContent[ articleContent.length-1 ]) : simulateMouseClick(articleContent[0])
  });
    
}
