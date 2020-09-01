/* globals jsPanel, Mousetrap, Cookies    */

console.log('Loading daily-notes-popup2.js')
//addScriptToPage( 'dailyNotePopup2', URLScriptServer + 'ext/daily-notes-popup2.js')

var dailyNotesPopup2 =  {
  
  initializedDNP: false,  //tracks if the dnp2 is initialized
  baseUrlRoamDb: '',
  panelDNP: undefined,
  idPanelDNP: 'jsPanelDNP',
  shortcut: 'alt+shift+5',
  
  initialize() {
    console.log('initialize()')
    if( window != window.parent ) { 
      //inside popup - configure to hide window, then exit rest of initializer
      console.log('window != window.parent')
      Mousetrap.unbind(this.shortcut);
      Mousetrap.bind(this.shortcut, ()=>{
        console.log('hi parent window ' + this.shortcut)
        window.parent.document.querySelector('#'+this.idPanelDNP).style.visibility="hidden"
        return false
      });              
      return 
    }     
    
    this.baseUrlRoamDb = `https://roamresearch.com/#/app/${window.location.href.replace('https://roamresearch.com/#/app/','').split('/')[0]}`
    if(this.initializedDNP == false) 
    {
      this.initializedDNP = true
      this.panelDNP = jsPanel.create({
        id: this.idPanelDNP,
        header: 'auto-show-hide',
        headerControls: { smallify: 'remove', maximize: 'remove' },        
        content: '<iframe src="' + this.baseUrlRoamDb + '" id="iframePanelDNP" style="width: 100%; height: 100%;border:0px solid white"></iframe>',
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
        panelSize: '650 300',
        position: { my: 'center-bottom', at: 'center-bottom', offsetX: -10, offsetY: -10 },
        dragit: {
          containment: 10,
          snap: { containment: true, repositionOnSnap: true }
        },        
        boxShadow: 4,
      })
      document.querySelector('#'+this.idPanelDNP).style.visibility="hidden"
      
      //persit UI changes
      document.addEventListener('jspanelresizestop', (event)=>{
        console.log(event.detail)
        if(event.detail=='jsPanelDNP'){
          Cookies.set('DNP_Parameters_Dimensions', JSON.stringify(this.panelDNP.currentData))
          console.log(Cookies.get('DNP_Parameters_Dimensions'))
        }      
      }, false)
      document.addEventListener('jspaneldragstop',   (event)=>{
        console.log(event)
        if(event.detail=='jsPanelDNP'){
          console.log(event.detail)
          Cookies.set('DNP_Parameters_Position',   JSON.stringify(this.panelDNP.options.position))
          console.log(Cookies.get('DNP_Parameters_Position' ))        
        }
      }, false)
      
      // setTimeout(()=>{
      //   const loc = Cookies.get('DNP_Parameters')
      //   const pnl = document.querySelector('#jsPanelDNP')
      //   console.log('tieout')
      //   console.log(loc );
      //   pnl.style.top    = loc.top
      //   pnl.style.left   = loc.left
      //   pnl.style.height = loc.height
      //   pnl.style.width  = loc.width
      // },4000);
      
      //close hides the window
      this.panelDNP.options.onbeforeclose.push( ()=> {
        document.querySelector('#'+this.idPanelDNP).style.visibility="hidden"
        if ( this.panelDNP.status == 'minimized' ) {
          this.panelDNP.normalize()
        }
        return false;
      });
      
      const getDNP_parameters = ()=>{
        if( Cookies.get('DNP_Parameters') ) {
          return JSON.parse( Cookies.get('DNP_Parameters') )
        } else {
          return false
        }
      }

 

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
      },3000)
      
      //add keyboard mapping
      setTimeout( ()=> {
        Mousetrap.unbind(this.shortcut);
        Mousetrap.bind(this.shortcut, ()=>{
          console.log('hi ' + this.shortcut)
          if ( document.querySelector('#'+this.idPanelDNP).style.visibility == "hidden"  ) {
              document.querySelector('#'+this.idPanelDNP).style.visibility="visible"
              var iframe = document.getElementById("iframePanelDNP")
              iframe.focus()
          } else {
              document.querySelector('#'+this.idPanelDNP).style.visibility="hidden"
          }
          return false
        });        
      },5000)
      
    }
  },
}

//load feature code
Mousetrap.unbind('alt+shift+4');
Mousetrap.bind('alt+shift+4', ()=>{
  console.log('hi alt+shift+4')
  try {  document.querySelector("#jsPanelDNP").remove() } catch(e) {}
  addScriptToPage( 'dailyNotePopup2', URLScriptServer + 'ext/daily-notes-popup2.js')
  setTimeout( ()=>{
    this.dailyNotesPopup2.initialize()
  }, 500)
  
  return false
});



