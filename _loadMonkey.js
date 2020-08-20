/* global  loadKeyEvents, toastr, loadTypeAhead, displayHelp, displayStartup, loadJumpToDatePicker */

const ignoredFeatures = typeof window.ignoredFeatures !== 'undefined' ? window.ignoredFeatures : []; 

// Function to dynamically add a new JS script to the current site 
function addScriptToPage(tagId, scriptToLoad) {
  //Delete any existing reference added earlier to this script
  var old = document.getElementById(tagId) 
  if(old){ old.remove()}

  if(ignoredFeatures && ignoredFeatures.indexOf(tagId) > -1) {
    return;
  }

  var s = document.createElement('script')
    s.type  = 'text/javascript'
    s.src   = scriptToLoad
    s.id    = tagId
    s.async = false
    document.getElementsByTagName('head')[0].appendChild(s)
}

// Function to dynamically add a new JS script to the current site 
function addModuleToPage(tagId, scriptToLoad) {
  //Delete any existing reference added earlier to this script
  var old = document.getElementById(tagId) 
  if(old){ old.remove()}

  var s = document.createElement('script')
    s.type  = 'module'
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


const URLScriptServer =  document.currentScript.src.replace('_loadMonkey.js','')

//load all 3rd party libraries 
addScriptToPage( 'JQUERY',          'https://code.jquery.com/jquery-3.5.1.min.js'                                )
addScriptToPage( 'JSCOOKIE',        'https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js'            )
addScriptToPage( 'HOTKEYJS',        'https://unpkg.com/hotkeys-js/dist/hotkeys.min.js'                           )
addScriptToPage( 'TYPEAHEAD',       'https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js' )
addScriptToPage( 'TURNDOWN',        'https://unpkg.com/turndown/dist/turndown.js'                                )
   addCSSToPage( 'TOASTCSS',         URLScriptServer + 'toastr.css'                                              )
addScriptToPage( 'TOASTR',          'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js'   )
addScriptToPage( 'CHRONO',          'https://cdn.jsdelivr.net/npm/chrono-node@1.4.6/dist/chrono.min.js'          )
addScriptToPage( 'ISMOBILE',        'https://cdn.jsdelivr.net/npm/ismobilejs@1/dist/isMobile.min.js'             )
addScriptToPage( 'jsFlatpickr',     'https://cdn.jsdelivr.net/npm/flatpickr'                                     )
   addCSSToPage( 'cssFlatpckr',     'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'              )
   addCSSToPage( 'cssFlatpckrThme', 'https://npmcdn.com/flatpickr/dist/themes/airbnb.css'                        )
addScriptToPage( 'jsJsPanel',       'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.js'               )
   addCSSToPage( 'cssJsPanel',      'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.css'              )


//load all custom files 
   addCSSToPage( 'myCSS',           URLScriptServer + 'styleRM.css'           )
addScriptToPage( 'myCOMMONFUNCT',   URLScriptServer + 'commonFunctions.js'    )
addScriptToPage( 'myRQR',           URLScriptServer + 'quick-reference.js'    )
addScriptToPage( 'myTURNDOWN',      URLScriptServer + 'turndownservice.js'    )
addScriptToPage( 'myDATEPROCESS',   URLScriptServer + 'dateProcessing.js'     )
addScriptToPage( 'myKEYEVENTS',     URLScriptServer + 'keyevents.js'          )
addScriptToPage( 'myTYPEAHEADDATA', URLScriptServer + 'typeaheadData.js'      )
addScriptToPage( 'myTYPEAHEADUI',   URLScriptServer + 'typeaheadUI.js'        )
addScriptToPage( 'myROAMLIVE',      URLScriptServer + 'roam-live-preview.js'  )
addScriptToPage( 'myDailyNote',     URLScriptServer + 'dailynotespopup.js'    )
addScriptToPage( 'mytemplatepoc',   URLScriptServer + 'templatepoc.js'        )
addScriptToPage( 'myJUMPTODATE',    URLScriptServer + 'jump-to-date.js'       )


// Give the libraries a few seconds to get comfy in their new home 
// and then let the monkey dance, that is to say,
// begin initializing the environment with all the cool tools
setTimeout(function(){
  loadKeyEvents()
  loadTypeAhead()
  loadJumpToDatePicker()
  
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
    setTimeout(()=>{
      displayStartup(3000)      
    },5000)
  }
}, 1000);



