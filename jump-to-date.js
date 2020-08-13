//Datepicker based on: https://flatpickr.js.org/

let flCalendar = []
let jDiv = []
let jInput = []

//Toggles the date picker display
const jumpToDate = () =>	{
  if(jDiv.style.visibility == 'hidden' || jDiv.style.visibility == '') {
    jInput.placeholder = 'Jump to date'
    jDiv.style.visibility = 'visible'
    jInput.style.visibility = 'visible'
    jInput.focus()
    KeyboardLib.pressDownKey()
  } else {
    jDiv.style.visibility = 'hidden'
    jInput.style.visibility = 'hidden'
    flCalendar.close()
  }
}

//Initialization for Date picker
const loadJumpToDatePicker = ()=> {
  $(document.body).append(`
  <div id="jumptoDatePicker">
    <input class="jumptoDatePickerInput" id="jumptoDateInput" type="text" placeholder="" style="width:330px;border:0px"></input>
  </div>
`.trim() )  
  flatpickr("#jumptoDateInput", { dateFormat: "m-d-Y", weekNumbers: true })
  flCalendar = document.querySelector("#jumptoDateInput")._flatpickr;
  
  flCalendar.config.onValueUpdate.push( function(selectedDates, dateStr, instance) {
      jDiv.style.visibility = 'hidden'
      jInput.style.visibility = 'hidden'
      let inPut =  document.getElementById('find-or-create-input')
      inPut.focus()
      setEmptyNodeValue(inPut, getRoamDate(dateStr))
      setTimeout(()=>{
        KeyboardLib.pressEnter()
      },250)             
  })
  
  flCalendar.config.onClose.push( function(selectedDates, dateStr, instance) {
    jDiv.style.visibility = 'hidden'
    jInput.style.visibility = 'hidden'
    setTimeout( ()=>{
      flCalendar.clear()
    },500)
  })
  
  jDiv   = document.querySelector('#jumptoDatePicker')
  jInput = document.querySelector('#jumptoDateInput')

}
