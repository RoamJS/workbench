/* globals jsPanel, Mousetrap, Cookies    */

console.log('Loading daily-notes-popup2.js')
//addScriptToPage( 'dailyNotePopup2', URLScriptServer + 'ext/daily-notes-popup2.js')

var dailyNotesPopup2 =  {
  
  initializedDNP:       false,  //tracks if the dnp2 is initialized
  baseUrlRoamDb:        '',
  panelDNP:             undefined,
  idPanelDNP:           'jsPanelDNP',
  shortcut:             'alt+shift+5',
  panelViewedFirstTime: false,
  
  initialize() {
    console.log('initialize()')
    //add keyboard mapping
    Mousetrap.unbind(this.shortcut)
    Mousetrap.bind(this.shortcut, ()=>{
      console.log(this.shortcut)
      if( this.panelViewedFirstTime == false ) {
        this.panelViewedFirstTime = true
        this.drawUI()
      }  else {
        this.toggleVisible()
      }
      return false        
    })  
  },
  
  drawUI() {
    if( window != window.parent ) { 
      //inside popup - configure to hide window, then exit rest of initializer
      console.log('window != window.parent')
      Mousetrap.unbind(this.shortcut);
      Mousetrap.bind(this.shortcut, ()=>{
        window.parent.document.querySelector('#'+this.idPanelDNP).visibility = 'hidden'
        window.parent.focus()
        return false
      });              
      return 
    }     
    
    this.baseUrlRoamDb = `https://roamresearch.com/#/app/${window.location.href.replace('https://roamresearch.com/#/app/','').split('/')[0]}`
    if(this.initializedDNP == false) 
    {
      var loc = Cookies.get('DNP_Parameters_Dimensions') ? JSON.parse( Cookies.get('DNP_Parameters_Dimensions') ) : ''
      var lWidth   = 650
      var lHeight  = 300
      var lPosition = 'center-bottom' 
      var lX = -10
      var lY = -10
      if( loc != '' )  {    
        lWidth  = loc.width
        lHeight = loc.height 
        lPosition = 'left-top'
        lX = loc.left
        lY = loc.top
      }
      
      this.initializedDNP = true
      this.panelDNP = jsPanel.create({
        id: this.idPanelDNP,
        header: 'auto-show-hide',
        headerControls: { smallify: 'remove', maximize: 'remove' },        
        // content: '<div id="dnpFrameWrapper"></div>', 
        content: '<iframe src="' + this.baseUrlRoamDb + '" id="iframePanelDNP" style="top:-1px;bottom:-1px;width:100%;height:100%; border:0px solid white"></iframe>' ,
        headerTitle: '<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:200px;color:white !important;padding-top:2px;">Daily Notes</div>',
        iconfont: [
          'bp3-button bp3-minimal bp3-small bp3-icon-small-minus', 
          'bp3-button bp3-minimal bp3-small bp3-icon-chevron-down',  
          'bp3-button bp3-minimal bp3-small bp3-icon-expand-all', 
          'bp3-button bp3-minimal bp3-small bp3-icon-maximize', 
          'bp3-button bp3-minimal bp3-small bp3-icon-cross'
          ],
        onwindowresize: true,
        resizeit: {  minWidth: 400, minHeight: 200, },
        panelSize: { width: lWidth, height: lHeight},
        position: { my: lPosition, at: lPosition, offsetX: lX, offsetY: lY },
        // position: { minLeft:20000 },
        container: '.roam-app',
        dragit: {
          containment: 4,
          snap: { containment: true, repositionOnSnap: true }
        },        
        boxShadow: 4,
      })

      //customize the internal view
      setTimeout( ()=> {
        var iframe = document.getElementById('iframePanelDNP')
        var style = document.createElement('style')
        style.textContent = ` 
            .bp3-icon-more, .bp3-icon-menu, .bp3-icon-menu-open, .bp3-icon-graph, #buffer, .roam-sidebar-container {
              display: none !important;
            }
            .roam-article {
                padding: 0px 20px 20px !important;
            }
            h1.rm-title-display {
                margin-top: 0px !important;
                margin-bottom: 8px !important;
          }
        `;
        iframe.contentDocument.head.appendChild(style)
        this.addPanelEvents()
      },3000)
      
    }
  },
  
  addPanelEvents() {
    this.panelDNP.options.onbeforeclose.push( ()=> {  //close hides the window
      this.toggleVisible()
      return false
    });
    //persit UI changes
    document.addEventListener('jspanelresizestop', (event)=>{
      console.log('jspanelresizestop ' + event.detail)
      if(event.detail=='jsPanelDNP' && this.panelDNP.style.left !='20000px' ){
        Cookies.set('DNP_Parameters_Dimensions', JSON.stringify(this.panelDNP.currentData))
        console.log(Cookies.get('DNP_Parameters_Dimensions'))
      }      
    }, false)
    document.addEventListener('jspaneldragstop',   (event)=>{
      console.log(event)
      if(event.detail=='jsPanelDNP' && this.panelDNP.style.left !='20000px' ){
        Cookies.set('DNP_Parameters_Dimensions', JSON.stringify(this.panelDNP.currentData))
        Cookies.set('DNP_Parameters_Position',   JSON.stringify(this.panelDNP.options.position))
        console.log(Cookies.get('DNP_Parameters_Dimensions' ))        
        console.log(Cookies.get('DNP_Parameters_Position' ))        
      }
    }, false)
  },
  
  toggleVisible() {
    // document.querySelector('#'+this.idPanelDNP).style.visibility="hidden"
    console.log('toggle')
    if( this.panelDNP.style.visibility == 'hidden' ) {
      this.panelDNP.style.visibility = 'visible'
    } else {
      this.panelDNP.normalize()
      this.panelDNP.style.visibility = 'hidden'
    }
  },

}

//load feature code
Mousetrap.unbind('alt+shift+4');
Mousetrap.unbind('alt+shift+5');
Mousetrap.bind('alt+shift+4', ()=>{
  console.log('hi alt+shift+4')
  try {  
    document.querySelector("#jsPanelDNP").remove() 
    document.querySelector("#dnpFrameWrapper").remove() 
  } catch(e) {}
  addScriptToPage( 'dailyNotePopup2', URLScriptServer + 'ext/daily-notes-popup2.js')
  setTimeout( ()=>{
    this.dailyNotesPopup2.initialize()
  }, 500)
  return false
});


