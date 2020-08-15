/* globals jsPanel, KeyboardLib, flatpickr, setEmptyNodeValue */
// INFO: Provides a quick way to jump between daily notes pages using a calendar
// Datepicker based on: https://flatpickr.js.org/


let rqrJumpToDatePanel = ''
let rqrJumpToDatePanel_isInitiallyPositioned = false
let flCalendar = []
 

//Assign shortcut key to this feature to ALT+SHIFT+J
document.addEventListener('keydown', (e)=> {
  if( e.altKey==true  &&  e.keyCode==74 ) {
    e.preventDefault();
    if ( rqrJumpToDatePanel_isInitiallyPositioned == false ) { 
      rqrJumpToDatePanel.reposition('center')
      rqrJumpToDatePanel_isInitiallyPositioned = true;
    }
    if (event.srcElement.localName == 'textarea') {
      KeyboardLib.pressEsc()
      setTimeout( ()=> {
        KeyboardLib.pressEsc()
        jumpToDate()            
      },300 )
    } else {
      jumpToDate()    
    }
  }
})


//Toggles the date picker display
const jumpToDate = () =>	{
  let jump = document.querySelector('#rqrJumpToDatePanel')
  let jInput = document.querySelector('#jumptoDateInput')

  if ( jump.style.visibility == 'hidden' | jump.style.visibility == ''  ) {
      jump.style.visibility='visible'
      jInput.style.visibility='visible'  
  } else {
      flCalendar.close()
      jump.style.visibility='hidden'
      jInput.style.visibility='hidden'  
      return
  }    

  jInput.placeholder = 'Jump to date'
  jInput.style.visibility='visible'
  jInput.focus()
  KeyboardLib.pressDownKey()
}

const jumpToDateFromButton = ()=> {
    KeyboardLib.pressEsc()
    setTimeout( ()=> {
      jumpToDate()            
    },100 )
}

//Initialization for Date picker
const loadJumpToDatePicker = ()=> {

  // Create ROAM button
  try {
    var jump = document.createElement("div")
      jump.className = 'bp3-button bp3-minimal bp3-small bp3-icon-pivot'
      jump.setAttribute('onClick', 'jumpToDateFromButton()')
      jump.setAttribute('style','position:relative;left:2px')
    var spacer = document.createElement("div")
      spacer.setAttribute('style','flex: 0 0 3px')    
    document.querySelector('.roam-topbar .flex-h-box').appendChild(spacer)
    document.querySelector('.roam-topbar .flex-h-box').appendChild(jump)
    
  } catch(e) {
    console.log('could not add toolbar buton - see module jump-to-date.js')
    console.log(e)
  }
  
  // Cereate floating control
  rqrJumpToDatePanel = jsPanel.create({
    id: 'rqrJumpToDatePanel',
    header: false,
    borderRadius: '.8rem',
    contentSize: {
        width:  365,
        height: 345
    },
    closeOnEscape: true,
    position: {
      my: 'left-top',
      at: 'left-top',
      offsetX: 10000,
      offsetY: 69
    },
    contentOverflow: 'hidden',
    content: `
      <div id="jumptoDatePicker">
        <input id="jumptoDateInput" type="text" placeholder=""></input>
      </div>
      `.trim()
  })
  rqrJumpToDatePanel.options.onbeforeclose.push(function() {
    document.querySelector('#rqrJumpToDatePanel').style.visibility='hidden'
    document.querySelector('#jumptoDateInput').style.visibility='hidden'
    return false;
  });  
  
  flatpickr("#jumptoDateInput", { dateFormat: "Y-m-d", weekNumbers: true })

  flCalendar = document.querySelector("#jumptoDateInput")._flatpickr;
  
  flCalendar.config.onValueUpdate.push( function(selectedDates, dateStr, instance) {
      rqrJumpToDatePanel.close()
      let inPut =  document.getElementById('find-or-create-input')
      inPut.focus()
      setEmptyNodeValue(inPut, getRoamDate(dateStr))
      setTimeout(()=>{
        KeyboardLib.pressEnter()
      },250)             
  })
  
  flCalendar.config.onClose.push( function(selectedDates, dateStr, instance) {
    rqrJumpToDatePanel.close()
    setTimeout( ()=>{
      flCalendar.clear()
    },500)
  })
  
}

