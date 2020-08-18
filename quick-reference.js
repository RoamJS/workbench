/* globals jsPanel */

let rqrQuickReferencePanel = ''
let rqrQuickReferencePanel_isInitiallyPositioned = false

document.addEventListener('keydown', (e)=> {
  if( e.ctrlKey==true  &&  e.key=='H' ) {
    e.preventDefault();
    if ( rqrQuickReferencePanel_isInitiallyPositioned == false ) { 
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
  // borderRadius: '.8rem',
  headerTitle: '<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:200px;color:black !important;">Quick Reference</div>',
  iconfont: [
    'bp3-button bp3-minimal bp3-small bp3-icon-small-minus', 
    'bp3-button bp3-minimal bp3-small bp3-icon-chevron-down',  
    'bp3-button bp3-minimal bp3-small bp3-icon-chevron-up', 
    'custom-maximize', 
    'bp3-button bp3-minimal bp3-small bp3-icon-cross'
  ],
  contentSize: {
    width:  590,
    height: 405
  },
  resizeit: {
    disable: true
  },
  theme: 'light',
  contentOverflow: 'hidden',
  content: '<iframe src="https://roam-quickref.glitch.me/" id="iframeRqrQuickReferencePanel" style="width: 100%; height: 100%;"></iframe>',
  onwindowresize: true,
  dragit: {
    containment: 10,
    snap: {
      containment: true,
      repositionOnSnap: true
    }
  },
  position: {
    my: 'right-bottom',
    at: 'right-bottom',
    offsetX: -10, 
    offsetY: -10 
  }
  })

document.querySelector('#rqrQuickReferencePanel').style.visibility="hidden"

rqrQuickReferencePanel.options.onbeforeclose.push(function() {
  document.querySelector('#rqrQuickReferencePanel').style.visibility="hidden"
  if (rqrQuickReferencePanel.status == 'minimized') {
    rqrQuickReferencePanel.normalize()
  }
  return false;
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

