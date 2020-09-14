/* globals Mousetrap        */

// THIS IS AN EXPERIMENT. Still not working, and not stable

console.log('sidebar-panel.js loading')


function roam42Test() {
  sbDetach()
}

function sbDetach() {
  var idForNewPanel = "sbd" + Math.round(Math.random() * 100000000).toString()
  console.log(idForNewPanel)
  
   this.panelDNP = jsPanel.create({
    // id: this.idForNewPanel,
    header: 'auto-show-hide',
    // headerControls: { smallify: 'remove', maximize: 'remove' },        
    content: `<div style="position:absolute;left:1px;top:1px;right:1px;bottom:1px;"id='${idForNewPanel}'>
              </div>` ,
//     headerTitle: '<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:200px;color:white !important;padding-top:2px;">Daily Notes</div>',
    iconfont: [
      'bp3-button bp3-minimal bp3-small bp3-icon-small-minus', 
      'bp3-button bp3-minimal bp3-small bp3-icon-chevron-down',  
      'bp3-button bp3-minimal bp3-small bp3-icon-expand-all', 
      'bp3-button bp3-minimal bp3-small bp3-icon-maximize', 
      'bp3-button bp3-minimal bp3-small bp3-icon-cross'
      ],
    onwindowresize: true,
    resizeit: {  minWidth: 300, minHeight: 300, },

    contentOverflow: 'hidden',
    // position: {
    //     my: 'right-center',
    //     at: 'left-center',
    //     of: document.body
    // },
    // callback: (panel)=> {
    //   panel.querySelector('#iframePanelDNP').onload = function(){
    //     document.querySelector(`#${idForNewPanel} div.jsPanel-content`).appendChild(document.querySelector('#roam-right-sidebar-content').childNodes[0])
    //   }
    // },
    dragit: {
       containment: [10, 10, 10,10],
    },        
    boxShadow: 4,
  })
  
  setTimeout( ()=>{
    // document.querySelector(`#${idForNewPanel}`).appendChild( document.querySelector('#roam-right-sidebar-content').childNodes[0].cloneNode(true) )
     document.querySelector(`#${idForNewPanel}`).appendChild( document.querySelector('#roam-right-sidebar-content').childNodes[0])
      // document.querySelector(`#${idForNewPanel}`).appendChild( document.querySelector('#right-sidebar'))
    
  },500)

//#roam-right-sidebar-content > div:nth-child(1)
  
// interact('#roam-right-sidebar-content > div')
 // $("#roam-right-sidebar-content > div").draggable()

  
}


//load feature code
Mousetrap.unbind('alt+shift+5');
Mousetrap.bind('alt+shift+5', ()=>{
  console.log('alt+shift+5 triggered')
  try {  
  } catch(e) {}  
  // addScriptToPage( 'interactJS',    'https://code.jquery.com/ui/1.12.1/jquery-ui.js'         )
  addScriptToPage( 'roam42Tester',  'https://roamhacker-lab.glitch.me/ext/sidebar-detach.js'    )
  setTimeout( ()=>{
    roam42Test()
  }, 300)
  return false
})


