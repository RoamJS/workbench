
const sidebarRightToggle = ()=>{
  try {
      document.getElementsByClassName("bp3-icon-more")[0].click()
      document.getElementsByClassName("bp3-text-overflow-ellipsis bp3-fill")[0].click()      
  } catch(e) {console.log(e)}    
}

const sidebarLeftToggle = ()=> {
  var event = new MouseEvent('mouseover', { 'view': window, 'bubbles': true, 'cancelable': true });
  try {
    //try to open menu
    document.getElementsByClassName("bp3-icon-menu-closed")[0].click()
    simulateMouseOver(document.getElementsByClassName("roam-article")[0]) //.dispatchEvent(event)
  } catch(e) {
    try {
      document.getElementsByClassName("bp3-icon-menu")[0].dispatchEvent(event)
    } catch(e) {} //if on ipad, the above command fails, so go to next step
    setTimeout(()=>{
      document.getElementsByClassName("bp3-icon-menu-open")[0].click()
    },100)
  }     
}


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

const mouseClickEventsRight = ['contextmenu'];
const simulateMouseClickRight = (element)=> {
  mouseClickEventsRight.forEach(mouseEventType =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, { view: window, bubbles: true, cancelable: true, buttons: 1
      })
    )
  )
}

const mouseOverEvents = ['mouseover'];
const simulateMouseOver = (element)=> {
  mouseOverEvents.forEach(mouseEventType =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, { view: window, bubbles: true, cancelable: true, buttons: 1
      })
    )
  )
}

//grabs the selection information of a ext area
const saveLocationParametersOfTextArea = element => {
  return {
    id:         element.id,
    selStart:   element.selectionStart,
    selEnd:     element.selectionEnd
  }
}

//activates a block and sets its selection area
const restoreLocationParametersOfTexArea = locationFacts => {
  setTimeout(()=>{
    simulateMouseClick( document.getElementById(locationFacts.id) )
    setTimeout(()=>{
      document.getElementById(locationFacts.id).selectionStart = locationFacts.selStart
      document.getElementById(locationFacts.id).selectionEnd = locationFacts.selEnd
    },100)
  },100)
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

// updates an empty text area with a new value. This function does some additional work
// because the textarea in roam is managed by React component, and it wasn't being triggered to 
// update when inserting a value
const setEmptyNodeValue = (element, value) => {
    const e = new Event('input', { bubbles: true })
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set
    const prototype = Object.getPrototypeOf(element)
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      'value'
    ).set

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value)
    } else {
      valueSetter.call(element, value)
    }
  element.dispatchEvent(e)
}

//Inserts text at the current cursor location in a textara
const insertAtCaret = (areaId, text) => {
  var txtarea = document.getElementById(areaId)
  var scrollPos = txtarea.scrollTop
  var strPos = 0
  var br =
    txtarea.selectionStart || txtarea.selectionStart == '0'
      ? 'ff'
      : document.selection
      ? 'ie'
      : false;
  if (br == 'ie') {
    txtarea.focus()
    var range = document.selection.createRange()
    range.moveStart('character', -txtarea.value.length)
    strPos = range.text.length;
  } else if (br == 'ff') strPos = txtarea.selectionStart

  var front = txtarea.value.substring(0, strPos)
  var back = txtarea.value.substring(strPos, txtarea.value.length)
  setEmptyNodeValue(txtarea, front + text + back)
  setTimeout( ()=> {
      strPos = strPos + text.length
      if (br == 'ie') {
        txtarea.focus()
        var range = document.selection.createRange()
        range.moveStart("character", -txtarea.value.length)
        range.moveStart("character", strPos)
        range.moveEnd("character", 0)
        range.select()
      } else if (br == 'ff') {
        txtarea.selectionStart = strPos
        txtarea.selectionEnd = strPos
        txtarea.focus()
      }
      txtarea.scrollTop = scrollPos
    }, 100)
}

