/* globals iziToast */

// only run this code if not already in iframe
if( window === window.parent ) {
  var baseUrlRoamDb = `https://roamresearch.com/#/app/${window.location.href.replace('https://roamresearch.com/#/app/','').split('/')[0]}` 
 
  window.dnaVisible = false;
  window.initializedDNP = false;
}

function initializeIframe() {
  if( window.initializedDNP == false ) {
    
    iziToast.show({
      message: `
      <b>Starting Daily Notes Popup . . .</b>
      <p>It takes a few seconds the first time you start it up</p>
    `.trim(),
      theme: 'dark',
      position: 'center',
      progressBar: true,
      animateInside: true,
      close: false,  
      timeout: 5000,  
      closeOnClick: true,  
      displayMode: 2  
    });  
    
    window.initializedDNP = true
    try { document.getElementById('dnapopup').remove() } catch(err) {}
    
    $(document.body).append(`
      <div id="dnapopup">  
        <div id="dnaborder">
        <iframe src="${baseUrlRoamDb}" id="dnaiframe"></iframe>
        </div>
     </div>
    `.trim() )  
    
    setTimeout( ()=> {
      var iframe = document.getElementById('dnaiframe')
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

      setTimeout(()=>{
        iframe.contentWindow.document.body.insertAdjacentHTML('beforeend',`
          <div style="position:absolute; top:10px; left:20px; z-index:1000;" class="bp3-button bp3-minimal bp3-small bp3-icon-cross" onclick="closeDailyNotePopup()"></div>
        `)     
      }, 8000)
      
    },3000)
  } 
} 

function closeDailyNotePopup(){
  parent.focus()
  let dn = window.parent.document.getElementById('dnapopup')
  dn.style.right = '12500px' 
  dn.style.left =  '12000px'
  dn.style.visibility = 'hidden'
  window.dnaVisible = false
}

function toggleDailyNotes() {
  initializeIframe()
    if( window === window.parent ) {
      let dn = document.getElementById('dnapopup')
      if(window.dnaVisible==false) {
        dn.style.right = 'calc((100% - 720px) / 2)' 
        dn.style.left =  'calc((100% - 720px) / 2)'
        dn.style.visibility = 'visible'
        window.dnaVisible = true
      } else {
        dn.style.right = '12500px' 
        dn.style.left =  '12000px'
        dn.style.visibility = 'hidden'
        window.dnaVisible = false
      }
    } else {
      closeDailyNotePopup()
    }
}