/* global danceMonkey, loadKeyEvents, toastr, loadTypeAhead, displayHelp */


// Function to dynamically add a new JS script to the current site 
function addScriptToPage(tagId, scriptToLoad) {
  //Delete any existing reference added earlier to this script
  var old = document.getElementById(tagId) 
  if(old){ old.remove()}

  var s = document.createElement('script')
    s.type  = 'text/javascript'
    s.src   = scriptToLoad
    s.id    = tagId
    s.async = false
    document.getElementsByTagName('head')[0].appendChild(s)
}

// Function to dynamically add a new CSS File to the current site 
function addCSSToPage(tagId, cssToAdd) {
  //Delete any existing reference added earlier to this script
  var old = document.getElementById(tagId) 
  if(old){ old.remove()}

  var cssLink = document.createElement('link')
    cssLink.type  = 'text/css' 
    cssLink.rel   = 'stylesheet';  
    cssLink.href  = cssToAdd
    cssLink.id    = tagId
    cssLink.async = false
    document.getElementsByTagName('head')[0].appendChild(cssLink)
}


//load all 3rd party libraries 
addScriptToPage( 'JQUERY',          'https://code.jquery.com/jquery-3.5.1.min.js'                                )
addScriptToPage( 'HOTKEYJS',        'https://unpkg.com/hotkeys-js/dist/hotkeys.min.js'                           )
addScriptToPage( 'TYPEAHEAD',       'https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js' )
addScriptToPage( 'TURNDOWN',        'https://unpkg.com/turndown/dist/turndown.js'                                )
   addCSSToPage( 'TOASTCSS',        'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/css/toastr.min.css' )
addScriptToPage( 'TOASTR',          'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js'   )
addScriptToPage( 'CHRONO',          'https://cdn.jsdelivr.net/npm/chrono-node@1.4.6/dist/chrono.min.js'          )
addScriptToPage( 'ISMOBILE',        'https://cdn.jsdelivr.net/npm/ismobilejs@1/dist/isMobile.min.js'             )


//load all custom files 
   addCSSToPage( 'myCSS',           'https://roammonkey.glitch.me/styleRM.css'           )
addScriptToPage( 'myCOMMONFUNCT',   'https://roammonkey.glitch.me/commonFunctions.js'    )
addScriptToPage( 'myTURNDOWN',      'https://roammonkey.glitch.me/turndownservice.js'    )
addScriptToPage( 'myDATEPROCESS',   'https://roammonkey.glitch.me/dateProcessing.js'     )
addScriptToPage( 'myKEYEVENTS',     'https://roammonkey.glitch.me/keyevents.js'          )
addScriptToPage( 'myTYPEAHEADDATA', 'https://roammonkey.glitch.me/typeaheadData.js'      )
addScriptToPage( 'myTYPEAHEADUI',   'https://roammonkey.glitch.me/typeaheadUI.js'        )
addScriptToPage( 'myROAMLIVE',      'https://roammonkey.glitch.me/roam-live-preview.js'  )
addScriptToPage( 'myROAMLIVE',      'https://roammonkey.glitch.me/dailynotespopup.js'  )



// Give the libraries a few seconds to get comfy in their new home 
// and then let the monkey dance, that is to say,
// begin initializing the environment with all the cool tools
setTimeout(function(){
  loadKeyEvents()
  loadTypeAhead()
  
  toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-bottom-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "600000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }
  
  // Dont display in iframe
  if( window === window.parent ) {
    displayHelp(3000)
  }
}, 3000);



