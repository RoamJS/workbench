
// only run this code if not already in iframe
if( window === window.parent ) {
  var baseUrlRoamDb = `https://roamresearch.com/#/app/${window.location.href.replace('https://roamresearch.com/#/app/','').split('/')[0]}` 
 
  window.dnaVisible = false;
  window.initialized = false;

  try {
      document.getElementById('dnapopup').remove()
  }
  catch(err) {}

  $(document.body).append(`
    <div id="dnapopup">  
      <div id="dnaborder">
      <iframe src="${baseUrlRoamDb}" id="dnaiframe"></iframe>
      </div>
   </div>
  `.trim() )  
  }

function initializeIframe() {
  if( window.initialized == false ) {
    window.initialized = true
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

    iframe.contentWindow.document.body.insertAdjacentHTML('beforeend',`
    <div style="position:absolute; top:1px; left:1px; z-index:1000;" onclick="closeDailyNotePopup()">[X]</div>
    `)

  } 

} 

function closeDailyNotePopup(){
  parent.focus()
  window.parent.document.getElementById('dnapopup').style.visibility = 'hidden'
    
}

function toggleDailyNotes() {
  initializeIframe()

    if( window === window.parent ) {
      if(window.dnaVisible==false) {
        document.getElementById('dnapopup').style.visibility = 'visible'
        window.dnaVisible = true
      } else {
        document.getElementById('dnapopup').style.visibility = 'hidden'
        window.dnaVisible = false
      }
    } else {
      closeDailyNotePopup()
    }
}