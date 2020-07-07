console.log('hi world')


// only run this code if not already in iframe
if( window === window.parent ) {
  var baseUrlRoamDb = `https://roamresearch.com/#/app/${window.location.href.replace('https://roamresearch.com/#/app/','').split('/')[0]}` 
 
  window.dnaVisible = false;

  try {
      document.getElementById('dnapopup').remove()
  }
  catch(err) {}

  $(document.body).append(`
    <div id="dnapopup">  
      <iframe src="${baseUrlRoamDb}" id="dnaiframe"></iframe>    
   </div>
  `.trim() )  
}


function toggleDailyNotes() {
      var iframe = document.getElementById('dnaiframe');
      var style = document.createElement('style');
      style.textContent = ` 
                .bp3-icon-more, .bp3-icon-menu, .bp3-icon-graph {
                  display: none !important;
                }
                .roam-article {
                    padding: 1px 10px 10px !important;
                }
                h1.rm-title-display {
                    margin-top: 2px !important;
                    margin-bottom: 5px !important;
              }
            `;

      iframe.contentDocument.head.appendChild(style)

    if( window === window.parent ) {
      if(window.dnaVisible==false) {
        document.getElementById('dnapopup').style.visibility = 'visible'
        window.dnaVisible = true
      } else {
        document.getElementById('dnapopup').style.visibility = 'hidden'
        window.dnaVisible = false
      }
    } else {
      window.parent.document.getElementById('dnapopup').style.visibility = 'hidden'
    }
}