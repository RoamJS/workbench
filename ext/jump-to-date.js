/* globals jsPanel, KeyboardLib, flatpickr, setEmptyNodeValue, getRoamDate, chrono, iziToast */
// INFO: Provides a quick way to jump between daily notes pages using a calendar
// Datepicker based on: https://flatpickr.js.org/

var jumpToDateComponent = {

  rqrJumpToDatePanel: '',
  flCalendar: [],

  baseUrl() {
    // https://roamresearch.com/#/app/roam-toolkit/page/03-24-2020
    const url = new URL(window.location.href);
    const parts = url.hash.split('/');

    url.hash = parts.slice(0, 3).join('/');
    return url;
  },

  getWeekDay(date){
    //Create an array containing each day, starting with Sunday.
    var weekdays = new Array(
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    );
    //Use the getDay() method to get the day.
    var day = date.getDay();
    //Return the element that corresponds to that index.
    return weekdays[day];
  },
  
  moveForwardToDate(bForward){
    let jumpDate = chrono.parseDate( document.querySelector('.rm-title-display').innerText )
    let directionTip =''
    let calIcon =''
    if( jumpDate!=null) { 
      if ( bForward ) {
        jumpDate.setDate(jumpDate.getDate()+1)
        directionTip='bounceInRight'
      } else {
        jumpDate.setDate(jumpDate.getDate()-1)
        directionTip='bounceInLeft'
      }
      this.navigateUIToDate(jumpDate)
    }  
    
    iziToast.destroy();
    iziToast.show({
      message: this.getWeekDay(jumpDate),
      theme: 'dark',
      transitionIn: directionTip,
      position: 'center',
      icon: 'bp3-button bp3-minimal bp3-icon-pivot',
      progressBar: true,
      animateInside: false,
      close: false,
      timeout: 1500,
      closeOnClick: true,
      displayMode: 2
    });
  },

  //Toggles the date picker display
  jumpToDate(){
    this.flCalendar.clear()
    this.rqrJumpToDatePanel.reposition({ 
      my: 'right-top',
      at: 'right-top',
      offsetX: -10, 
      offsetY: 45 
    })

    var jump = document.querySelector('#rqrJumpToDatePanel')
    var jInput = document.querySelector('#jumptoDateInput')

    if ( jump.style.visibility == 'hidden' | jump.style.visibility == ''  ) {
        jump.style.visibility='visible'
        jInput.style.visibility='visible'  
    } else {
        this.flCalendar.close()
        jump.style.visibility='hidden'
        jInput.style.visibility='hidden'  
        return
    }    

    jInput.placeholder = 'Jump to date'
    jInput.style.visibility='visible'
    jInput.focus()
    KeyboardLib.pressDownKey()
  }, //jumpToDate

  jumpToDateFromButton() {
    let jump = document.querySelector('#rqrJumpToDatePanel') 
    if( jump.style.visibility=='hidden' || jump.style.visibility=='') {
      KeyboardLib.pressEsc()
      setTimeout( ()=>{
        this.jumpToDate()  
      }, 100 )    
    }
  }, //jumpToDateFromButton

  navigateUIToDate(destinationDate) {
    let inPut =  document.getElementById('find-or-create-input')
    inPut.focus()
    setEmptyNodeValue( inPut, getRoamDate( destinationDate ) )
    setTimeout(()=>{
      KeyboardLib.pressEnter()
      setTimeout(()=>{
        setEmptyNodeValue( inPut,'' )
      },250)             
    },250)             
  }, //navigateUIToDate

  initialize()  {
    document.addEventListener('keydown', (e)=> {
      if( e.altKey==true  && e.shiftKey==true  && e.keyCode==74 ) {
        e.preventDefault();
        if (event.srcElement.localName == 'textarea') {
          KeyboardLib.pressEsc()
          setTimeout( ()=> {
            KeyboardLib.pressEsc()
            this.jumpToDate()            
          },300 )
        } else {
          this.jumpToDate()    
        }
      }

      if( e.ctrlKey==true  && e.shiftKey==true &&  e.keyCode==188 ) {
        e.preventDefault();
        if (event.srcElement.localName == 'textarea') {
          KeyboardLib.pressEsc()
          setTimeout( ()=> {
            KeyboardLib.pressEsc()
            this.moveForwardToDate(false)
          },300 )
        } else {
            this.moveForwardToDate(false)
        }
      }

      if( e.ctrlKey==true && e.shiftKey==true &&  e.keyCode==190 ) {
        e.preventDefault();
        if (event.srcElement.localName == 'textarea') {
          KeyboardLib.pressEsc()
          setTimeout( ()=> {
            KeyboardLib.pressEsc()
            this.moveForwardToDate(true)
          },300 )
        } else {
          this.moveForwardToDate(true)
        }
      }
    }) // addEventListener

 // Create ROAM button
    try {
      var jump = document.createElement("div")
        jump.className = 'bp3-button bp3-minimal bp3-small bp3-icon-pivot'
        jump.setAttribute('style','position:relative;left:2px')
        jump.onclick = ()=>{ this.jumpToDateFromButton()}  
      var spacer = document.createElement("div")
        spacer.setAttribute('style','flex: 0 0 3px')    
      document.querySelector('.roam-topbar .flex-h-box').appendChild(spacer)
      document.querySelector('.roam-topbar .flex-h-box').appendChild(jump)

    } catch(e) {
      console.log('could not add toolbar buton - see module jump-to-date.js ')
      console.log(e)
    }

    // Cereate floating control
    this.rqrJumpToDatePanel = jsPanel.create({
      id: 'rqrJumpToDatePanel',
      header: false,
      borderRadius: '.8rem',
      contentSize: {
          width:  365,
          height: 345
      },
      resizeit: {
          disable: true
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

    this.rqrJumpToDatePanel.options.onbeforeclose.push(function() {
      document.querySelector('#rqrJumpToDatePanel').style.visibility='hidden'
      document.querySelector('#jumptoDateInput').style.visibility='hidden'
      return false;
    })

    flatpickr("#jumptoDateInput", { dateFormat: "Y-m-d", weekNumbers: true })

    this.flCalendar = document.querySelector("#jumptoDateInput")._flatpickr;

    this.flCalendar.config.onValueUpdate.push( (selectedDates, dateStr, instance)=> {
      instance.close()
      this.navigateUIToDate(selectedDates[0])
    })

    this.flCalendar.config.onClose.push( (selectedDates, dateStr, instance)=> {
      this.rqrJumpToDatePanel.close()
      setTimeout( ()=>{
        this.flCalendar.clear()
      },500)
    })
                              
    
  }, //initialize()

  
}  // jumpToDateComponent
