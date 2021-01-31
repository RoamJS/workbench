/* globals roam42, jsPanel, roam42KeyboardLib, flatpickr, setEmptyNodeValue, getRoamDate,
           chrono, iziToast, tippy, shiftKeyDownTracker
*/
// INFO: Provides a quick way to jump between daily notes pages using a calendar
// Datepicker based on: https://flatpickr.js.org/


// roam42.jumpToDate
(()=>{

  roam42.jumpToDate = {};

  roam42.jumpToDate.component = {

    rqrJumpToDatePanel: '',
    flCalendar: [],

    keyboardHandler(ev) {
      if( ev.altKey==true  && ev.shiftKey==true  && ev.code=='KeyJ' ) {
        ev.preventDefault();
            this.jumpToDate();
        return true;
      }

      if( ev.ctrlKey==true  && ev.shiftKey==true &&  ev.code=='Comma' ) {
        ev.preventDefault();
        if (event.srcElement.localName == 'textarea') {
          roam42KeyboardLib.pressEsc();
          setTimeout( async ()=> {
            await roam42KeyboardLib.pressEsc();
            this.moveForwardToDate(false);
          },300 )
        } else {
            this.moveForwardToDate(false);
        }
        return true;
      }

      if( ev.ctrlKey==true && ev.shiftKey==true &&  ev.code=='Period' ) {
        ev.preventDefault();
        if (event.srcElement.localName == 'textarea') {
          roam42KeyboardLib.pressEsc();
          setTimeout( async ()=> {
            await roam42KeyboardLib.pressEsc();
            this.moveForwardToDate(true);
          },300 );
        } else {
          this.moveForwardToDate(true);
        }
        return true
      }

    }, // addEventListener


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
      let jumpDate = chrono.parseDate( document.querySelector('.rm-title-display').innerText );
      let directionTip ='';
      let calIcon ='';
      if( jumpDate!=null) {
        if ( bForward ) {
          jumpDate.setDate(jumpDate.getDate()+1);
          directionTip='bounceInRight';
        } else {
          jumpDate.setDate(jumpDate.getDate()-1);
          directionTip='bounceInLeft';
        }
        this.navigateUIToDate(jumpDate, false);
      }

      try {
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
      } catch(e) {}
    },

    //Toggles the date picker display
    jumpToDate(){
      roam42KeyboardLib.simulateKey(16); //this fixes some bug with shift
      this.flCalendar.clear();
      this.flCalendar.setDate(new Date());
      this.rqrJumpToDatePanel.reposition({
        my: 'right-top',
        at: 'right-top',
        offsetX: -10,
        offsetY: 45
      });

      var jump = document.querySelector('#rqrJumpToDatePanel');
      var jInput = document.querySelector('#jumptoDateInput');

      if ( jump.style.visibility == 'hidden' | jump.style.visibility == ''  ) {
          jump.style.visibility='visible';
          jInput.style.visibility='visible';
      } else {
          this.flCalendar.close()
          jump.style.visibility='hidden';
          jInput.style.visibility='hidden';
          return
      }

      jInput.placeholder = 'Jump to date';
      jInput.style.visibility='visible';
      jInput.focus();
      roam42KeyboardLib.pressDownKey();
      roam42KeyboardLib.simulateKey(16); //this fixes some bug with shift
    }, //jumpToDate

    jumpToDateFromButton() {
      let jump = document.querySelector('#rqrJumpToDatePanel');
      if( jump.style.visibility=='hidden' || jump.style.visibility=='') {
        setTimeout( ()=>{
          this.jumpToDate();
        }, 100 )
      } else {
        jump.style.visibility=='hidden'; //close Jump to date
      }
    }, //jumpToDateFromButton

    async navigateUIToDate(destinationDate, useShiftKey) {
      var dDate = roam42.dateProcessing.getRoamDate( destinationDate )
      var uid = await roam42.common.getPageUidByTitle(dDate); 
			if(uid=='') {
				await roam42.common.createPage(dDate);
				await roam42.common.sleep(100);
				uid = await roam42.common.getPageUidByTitle(dDate);
			}
			//page exists, go to it
      if(uid !=  undefined  && (useShiftKey==false || roam42.keyevents.shiftKeyDownTracker==false && useShiftKey==true) ) {
        document.location.href= this.baseUrl() + '/page/' + uid;
        return;
      }
      let inPut =  document.getElementById('find-or-create-input');
      inPut.focus();
      roam42.common.setEmptyNodeValue( inPut, dDate );
      setTimeout(()=>{
       if( roam42.keyevents.shiftKeyDownTracker==true && useShiftKey==true ) {
          roam42KeyboardLib.simulateKey(13,100,{  shiftKey:true});
        } else {
          roam42KeyboardLib.pressEnter();
        }
        setTimeout(()=>{
          roam42.common.setEmptyNodeValue( inPut,'' );
        },250);
      },1000);
    }, //navigateUIToDate

    initialize()  {

   // Create ROAM42 jump to date button
      try {
        var jump = document.createElement("div");
          jump.id='roam42-button-jumptodate';
          jump.className = 'bp3-button bp3-minimal bp3-small bp3-icon-pivot';
          jump.setAttribute('style','position:relative;left:2px');
          jump.onclick = ()=>{ this.jumpToDateFromButton()};
        var spacer = document.createElement("div");
          spacer.setAttribute('style','flex: 0 0 3px');
        document.querySelector('.rm-topbar').appendChild(spacer);
        document.querySelector('.rm-topbar').appendChild(jump);

      } catch(e) {
        console.log('could not add toolbar buton - see module jump-to-date.js ');
        console.log(e);
      }

      if( window === window.parent  ){
        tippy('#roam42-button-jumptodate', {
          content: `<div class="bp3-popover-content">Jump to Date<sup>42</sup></div>`,
          allowHTML: true,
          arrow: false,
          theme: 'light-border',
        });
      }

      // Create floating control
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
      });


      this.rqrJumpToDatePanel.options.onbeforeclose.push(function() {
        document.querySelector('#rqrJumpToDatePanel').style.visibility='hidden';
        document.querySelector('#jumptoDateInput').style.visibility='hidden';
        return false;
      });

      flatpickr("#jumptoDateInput", { dateFormat: "Y-m-d", weekNumbers: true, locale:{firstDayOfWeek:1} });

      this.flCalendar = document.querySelector("#jumptoDateInput")._flatpickr;

      this.flCalendar.config.onValueUpdate.push( (selectedDates, dateStr, instance)=> {
        instance.close();
        this.navigateUIToDate(selectedDates[0],true);
      })

      this.flCalendar.config.onClose.push( (selectedDates, dateStr, instance)=> {
        this.rqrJumpToDatePanel.close();
        setTimeout( ()=>{
          this.flCalendar.clear();
        },500);
      })


    }, //initialize()


  }  // component


})();
