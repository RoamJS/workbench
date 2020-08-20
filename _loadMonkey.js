/* global  loadKeyEvents, loadTypeAhead, displayHelp, displayStartup, jumpToDateComponent, rmQuickRefenceSystem */

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

  if(ignoredFeatures && ignoredFeatures.indexOf(tagId) > -1) {
    return;
  }

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

  if(ignoredFeatures && ignoredFeatures.indexOf(tagId) > -1) {
    return;
  }
  
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
addScriptToPage( 'iziToast',        'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/js/iziToast.min.js'   )
   addCSSToPage( 'cssiziToast',     'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/css/iziToast.min.css' )
addScriptToPage( 'TYPEAHEAD',       'https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js' )
addScriptToPage( 'TURNDOWN',        'https://unpkg.com/turndown/dist/turndown.js'                                )
addScriptToPage( 'CHRONO',          'https://cdn.jsdelivr.net/npm/chrono-node@1.4.6/dist/chrono.min.js'          )
addScriptToPage( 'jsFlatpickr',     'https://cdn.jsdelivr.net/npm/flatpickr'                                     )
   addCSSToPage( 'cssFlatpckr',     'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'              )
   addCSSToPage( 'cssFlatpckrThme', 'https://npmcdn.com/flatpickr/dist/themes/airbnb.css'                        )
addScriptToPage( 'jsJsPanel',       'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.js'          )
   addCSSToPage( 'cssJsPanel',      'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.css'         )

//load all custom files 
   addCSSToPage( 'styleRM',           URLScriptServer + 'styleRM.css'           )
addScriptToPage( 'commonFunctions',   URLScriptServer + 'commonFunctions.js'    )
addScriptToPage( 'quickReference',               URLScriptServer + 'quick-reference.js'    )
addScriptToPage( 'turnDown',          URLScriptServer + 'turndownservice.js'    )
addScriptToPage( 'dateProcessing',    URLScriptServer + 'dateProcessing.js'     )
addScriptToPage( 'keyEvents',         URLScriptServer + 'keyevents.js'          )
addScriptToPage( 'typeAheadData',     URLScriptServer + 'typeaheadData.js'      )
addScriptToPage( 'lookupUI',          URLScriptServer + 'typeaheadUI.js'        )
addScriptToPage( 'livePreview',       URLScriptServer + 'roam-live-preview.js'  )
addScriptToPage( 'dailyNote',         URLScriptServer + 'dailynotespopup.js'    )
addScriptToPage( 'templatePoc',       URLScriptServer + 'templatepoc.js'        )
addScriptToPage( 'jumpToDate',        URLScriptServer + 'jump-to-date.js'       )


// Give the libraries a few seconds to get comfy in their new home 
// and then let the extension dance, that is to say,
// begin initializing the environment with all the cool tools
setTimeout(function(){

  // Dont display in iframe
  if( window === window.parent ) {
      displayStartup(5000)  
  }
  loadKeyEvents()
  try { loadTypeAhead()                   } catch(e) {}
  try { jumpToDateComponent.initialize()  } catch(e) {}
  try { rmQuickRefenceSystem.initialize() } catch(e) {}
  
}, 3000);



