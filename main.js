/* global  loadKeyEvents, loadTypeAhead, jumpToDateComponent, rmQuickRefenceSystem, device, displayStartup */

const disabledFeatures = typeof window.disabledFeatures !== 'undefined' ? window.disabledFeatures : []; 

function addScriptToPage(tagId, script) {
  addElementToPage(Object.assign(document.createElement('script'),{src:script}) , tagId, 'text/javascript')
}

function addModuleToPage(tagId, script) {
  addElementToPage(Object.assign(document.createElement('script'),{src:script}) , tagId, 'module')
}

function addCSSToPage(tagId, cssToAdd) {
  addElementToPage(Object.assign(document.createElement('link'),{href:cssToAdd, rel: 'stylesheet'} ) , tagId, 'text/css')
}

function addElementToPage(element, tagId, typeT ) {
  try { document.getElementById(tagId).remove() } catch(e){}  //Delete any existing reference
  if(disabledFeatures && disabledFeatures.indexOf(tagId) > -1) { return } //Exit if disabled
  Object.assign(element, { type:typeT, async:false, tagId:tagId } )
  document.getElementsByTagName('head')[0].appendChild(element)  
}

const URLScriptServer =  document.currentScript.src.replace('main.js','')

//load all 3rd party libraries 
addScriptToPage( 'JQUERY',          'https://code.jquery.com/jquery-3.5.1.min.js'                                )
addScriptToPage( 'JSCOOKIE',        'https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js'            )
addScriptToPage( 'HOTKEYJS',        'https://unpkg.com/hotkeys-js/dist/hotkeys.min.js'                           )
addScriptToPage( 'iziToast',        'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/js/iziToast.min.js'   )
   addCSSToPage( 'cssiziToast',     'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/css/iziToast.min.css' )
addScriptToPage( 'TYPEAHEAD',       'https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js' )
addScriptToPage( 'TURNDOWN',        'https://unpkg.com/turndown/dist/turndown.js'                                )
addScriptToPage( 'CHRONO',          'https://cdn.jsdelivr.net/npm/chrono-node@1.4.8/dist/chrono.min.js'          )
addScriptToPage( 'jsFlatpickr',     'https://cdn.jsdelivr.net/npm/flatpickr'                                     )
   addCSSToPage( 'cssFlatpckr',     'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'              )
   addCSSToPage( 'cssFlatpckrThme',  URLScriptServer + 'css/airbnb.css'                        )
addScriptToPage( 'jsJsPanel',       'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.js'          )
   addCSSToPage( 'cssJsPanel',      'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.css'         )
addScriptToPage( 'deviceDetection', 'https://unpkg.com/current-device/umd/current-device.min.js'                 )

//common shared functions
   addCSSToPage( 'styleRM',         URLScriptServer + 'css/styleRM.css'           )
addScriptToPage( 'commonFunctions', URLScriptServer + 'common/commonFunctions.js' )
addScriptToPage( 'keyEvents',       URLScriptServer + 'common/keyevents.js'       )
addScriptToPage( 'message-startup', URLScriptServer + 'messages.js'       )

//extension modules
addScriptToPage( 'quickReference',  URLScriptServer + 'ext/quick-reference.js'    )
addScriptToPage( 'turnDown',        URLScriptServer + 'ext/turndownservice.js'    )
addScriptToPage( 'dateProcessing',  URLScriptServer + 'ext/dateProcessing.js'     )
addScriptToPage( 'typeAheadData',   URLScriptServer + 'ext/typeaheadData.js'      )
addScriptToPage( 'lookupUI',        URLScriptServer + 'ext/typeaheadUI.js'        )
addScriptToPage( 'templatePoc',     URLScriptServer + 'ext/templatepoc.js'        )
addScriptToPage( 'jumpToDate',      URLScriptServer + 'ext/jump-to-date.js'       )

// Give the libraries a few seconds to get comfy in their new home 
// and then let the extension dance, that is to say,
// begin initializing the environment with all the cool tools
setTimeout(()=>{

    // Dont display in iframe
  if( window === window.parent ) {
      displayStartup(6000)  
  }
  
  setTimeout(()=>{
    if ( device.mobile() == false ) { 
      //these tools don't work well on mobile device
      addScriptToPage( 'livePreview',     URLScriptServer + 'ext/roam-live-preview.js'  )
      addScriptToPage( 'dailyNote',       URLScriptServer + 'ext/dailynotespopup.js'    )
    }
    loadKeyEvents()
    try { loadTypeAhead()                   } catch(e) {}
    try { jumpToDateComponent.initialize()  } catch(e) {}
    try { rmQuickRefenceSystem.initialize() } catch(e) {}
  }, 2000)
  
}, 5000);



