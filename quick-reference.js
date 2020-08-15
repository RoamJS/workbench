/* globals jsPanel */

let rqrQuickReferencePanel = ''
let rqrQuickReferencePanel_isInitiallyPositioned = false

document.addEventListener('keydown', (e)=> {
  if( e.ctrlKey==true  &&  e.key=='H' ) {
    e.preventDefault();
    if ( rqrQuickReferencePanel_isInitiallyPositioned == false ) { 
      rqrQuickReferencePanel.reposition('center')
      rqrQuickReferencePanel_isInitiallyPositioned = true;
    }
    if ( document.querySelector('#rqrQuickReferencePanel').style.visibility == "hidden"  ) {
        document.querySelector('#rqrQuickReferencePanel').style.visibility="visible"
        var iframe = document.getElementById("iframeRqrQuickReferencePanel")
        iframe.focus()
    } else {
        document.querySelector('#rqrQuickReferencePanel').style.visibility="hidden"
    }
  }
})

rqrQuickReferencePanel = jsPanel.create({
    id: 'rqrQuickReferencePanel',
    headerControls: {
        maximize: 'remove'
    },
    borderRadius: '.8rem',
    headerTitle: '      Quick Reference for Roam',
    contentSize: {
        width:  605,
        height: 405
    },
    theme: 'light',
    contentOverflow: 'hidden',
    content: '<iframe src="https://roam-quickref.glitch.me/" id="iframeRqrQuickReferencePanel" style="width: 100%; height: 100%;"></iframe>',
    position: {
      my: 'left-top',
      at: 'left-top',
      offsetX: 10000,
      offsetY: 69
    }
})

document.querySelector('#rqrQuickReferencePanel').style.visibility="hidden"

rqrQuickReferencePanel.options.onbeforeclose.push(function() {
  document.querySelector('#rqrQuickReferencePanel').style.visibility="hidden"
  return false;
});

rqrQuickReferencePanel.options.onstatuschange.push(function(panel, status) {
    console.log(status)
    // do whatever needs to be done ...
});

	let eventMethodRQR = window.addEventListener
			? "addEventListener"
			: "attachEvent";
	let eventerRQR = window[eventMethodRQR];
	let messageEvent = eventMethodRQR === "attachEvent"
		? "onmessage"
		: "message";

	eventerRQR(messageEvent, function (e) {	
		if (e.data === "roamquickrefclosewindow" || e.message === "roamquickrefclosewindow") {
      document.querySelector('#rqrQuickReferencePanel').style.visibility='hidden'
    }		
	});

