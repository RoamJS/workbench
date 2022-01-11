// roam42.keyevents
//CONFIGURE SHORTCUT KEYS for use in the application
(()=>{

  roam42.keyevents = {};
  roam42.keyevents.shiftKeyDownTracker = false;

  roam42.moveForwardToDate = (bForward) => {
    let jumpDate = chrono.parseDate( document.querySelector('.rm-title-display').innerText );
    let directionTip ='';
    if( jumpDate!=null) {
      if ( bForward ) {
        jumpDate.setDate(jumpDate.getDate()+1);
        directionTip='bounceInRight';
      } else {
        jumpDate.setDate(jumpDate.getDate()-1);
        directionTip='bounceInLeft';
      }
      var dDate = roam42.dateProcessing.getRoamDate( jumpDate )
      roam42.common.navigateUiTo(dDate,false);
    }

    try {
      iziToast.destroy();
      iziToast.show({
        message: [
          "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ][date.getDay()],
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


  roam42.keyevents.loadKeyEvents = ()=> {

    document.addEventListener('keydown', (ev)=> {

      //console.log('alt: ' + ev.altKey  + '  shift: ' + ev.shiftKey + '  ctrl: ' + ev.ctrlKey + '   code: ' + ev.code)

      roam42.keyevents.shiftKeyDownTracker = ev.shiftKey;  //this is used in other modules for tracking shift state

      try { if( roam42.help.keyboardHandlerMessages(ev)  ) {return} } catch(e){};
      try { if( roam42.livePreview.keyboardHandlerLivePreview(ev)           ) {return} } catch(e){};
      try {
        if( ev.altKey==true  && ev.shiftKey==true  && ev.code=='KeyJ' ) {
          ev.preventDefault();
          const roamNativeDate = document.querySelector('div.rm-topbar span.bp3-icon-calendar');
          if (roamNativeDate) {
            roamNativeDate.click();
            setTimeout(() => {
              const day = new Date().getDate();
              const dayEl = Array.from(document.querySelectorAll('.DayPicker-Day'))
                                 .find(d => d.innerText === `${day}`)
              dayEl?.focus?.();
            }, 1);
          }
          return true;
        }
  
        if( ev.ctrlKey==true  && ev.shiftKey==true &&  ev.code=='Comma' ) {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.target.nodeName === 'TEXTAREA') {
            roam42KeyboardLib.pressEsc();
            setTimeout( async ()=> {
              await roam42KeyboardLib.pressEsc();
              roam42.moveForwardToDate(false);
            },300) 
          } else {
              roam42.moveForwardToDate(false);
          }
          return true;
        }
  
        if( ev.ctrlKey==true && ev.shiftKey==true &&  ev.code=='Period' ) {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.target.nodeName === 'TEXTAREA') {
            roam42KeyboardLib.pressEsc();
            setTimeout( async ()=> {
              await roam42KeyboardLib.pressEsc();
              roam42.moveForwardToDate(true);
            },300 );
          } else {
            roam42.moveForwardToDate(true);
          }
          return true
        }
      } catch(e){};
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
				setTimeout(async()=>{await roam42.common.sidebarLeftToggle()},50);
        return;
      }


      //Date NLP
      if (ev.altKey && ev.shiftKey &&  ev.code=='KeyD'  ) {
        event.preventDefault();
        if (ev.target.nodeName === "TEXTAREA") {
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
        return;
      }

      // Daily notes page toggle in and out
      if (ev.altKey  && (ev.key=='y' || ev.code=='KeyY')  ) {
        event.preventDefault();
        console.log ('9')
        if( window != window.parent ) {
        console.log ('iinsdie')
          window.parent.focus();
        } else {
        console.log ('outside')
          // window.parent.document.querySelector('#jsPanelDNP').style.visibility = 'hidden';
          roam42.dailyNotesPopup.component.panelDNP.style.visibility = 'hidden';
          setTimeout(()=> {
            roam42.dailyNotesPopup.component.panelDNP.style.visibility = 'visible';
            document.getElementById('iframePanelDNP').focus();
          },10);
        }
        return;
      }

      //simple markdown
      if (ev.altKey && ev.shiftKey==false &&  ev.code=='KeyM'  ) {
        if (roam42.formatConverterUI && roam42.formatConverter) {
          event.preventDefault();
          roam42.formatConverterUI.show();
        }
        return
      }

      //HTML view
      if (ev.altKey  && ev.shiftKey==true &&  ev.code=='KeyM'  ) {
        if (roam42.formatConverterUI && roam42.formatConverter) {
          event.preventDefault();
          roam42.formatConverterUI.htmlview();
        }
        return
      }

    });
  } // End of Keydown listener

})();