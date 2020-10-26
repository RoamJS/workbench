/* global  roam42, loadKeyEvents, loadTypeAhead, loadJumpNav, jumpToDateComponent, 
           rmQuickRefenceSystem, device, displayStartup,
           loadAutoComplete
*/

/* roam42 namespace structure

  roam42                   Root
  roam42.loader            Initialization of roam42 enviroment
  roam42.help              help system
  roam42.keyevents         global handler for keyevents (some modules have their own key handling)
  roam42.jumpnav           jump navigation
  roam42.quickRef          quick reference system
  roam42.dailyNotesPopup   Dialy notes popup
  roam42.livePreview       Live preview features
  roam42.common            shared commands
  roam42.dateProcessing    Date functions
  roam42.privacyMode       Redacts content from your Roam
  roam42.formatConverter   converts current page to various formats   
  roam42.KeyboardLib        imported from another library. so letting it stand as its own object
*/

;(()=>{});

if( typeof window.roam42 == 'undefined' ) { 

  window.roam42     =   {};
  roam42.buildID = 'Roam<sup>42</sup> 2020-10-26';
  roam42.host    = document.currentScript.src.replace('main.js','');

  // roam42.loader 
  (()=>{
    roam42.loader =  {};

    const URLScriptServer =  document.currentScript.src.replace('main.js','');
    const disabledFeatures = typeof window.disabledFeatures !== 'undefined' ? window.disabledFeatures : [];

    const addElementToPage = (element, tagId, typeT )=> {
      try { document.getElementById(tagId).remove() } catch(e){};  //Delete any existing reference
      if(disabledFeatures && disabledFeatures.indexOf(tagId) > -1) { return }; //Exit if disabled
      Object.assign(element, { type:typeT, async:false, tagId:tagId } );
      document.getElementsByTagName('head')[0].appendChild(element);  
    }

    roam42.loader.logo2HC = 'https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2F42logo-2hc.png?v=1599851355892';
    roam42.loader.disabledFeatures = typeof window.disabledFeatures !== 'undefined' ? window.disabledFeatures : [];

    roam42.loader.addScriptToPage = (tagId, script)=> {
      addElementToPage(Object.assign(document.createElement('script'),{src:script}) , tagId, 'text/javascript');
    }

    roam42.loader.addModuleToPage = (tagId, script)=> {
      addElementToPage(Object.assign(document.createElement('script'),{src:script}) , tagId, 'module');
    }

    roam42.loader.addCSSToPage = (tagId, cssToAdd)=> {
      addElementToPage(Object.assign(document.createElement('link'),{href:cssToAdd, rel: 'stylesheet'} ) , tagId, 'text/css');
    }

  })();

  // ****************************************************
  // Load roam42 components
  // ****************************************************

  ( ()=>{

    //load all 3rd party libraries 
    roam42.loader.addScriptToPage( 'JQUERY',          'https://code.jquery.com/jquery-3.5.1.min.js'                                 );
    roam42.loader.addScriptToPage( 'JSCOOKIE',        'https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js'             );
    roam42.loader.addScriptToPage( 'MOUSETRAP',       'https://cdn.jsdelivr.net/npm/mousetrap@1.6.5/mousetrap.min.js'               );
    roam42.loader.addScriptToPage( 'CHRONO',          'https://cdn.jsdelivr.net/npm/chrono-node@1.4.8/dist/chrono.min.js'           );
    roam42.loader.addScriptToPage( 'jsFlatpickr',     'https://cdn.jsdelivr.net/npm/flatpickr'                                      );
       roam42.loader.addCSSToPage( 'cssFlatpckr',     'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'               );
       roam42.loader.addCSSToPage( 'cssFlatpckrThme',  roam42.host + 'css/airbnb.css'                                               );
    roam42.loader.addScriptToPage( 'jsJsPanel',       'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.min.js'       );
       roam42.loader.addCSSToPage( 'cssJsPanel',      'https://cdn.jsdelivr.net/npm/jspanel4@4.11.0-beta/dist/jspanel.min.css'      );

    //Do not load in iframe windows
    if( window === window.parent  ){
     roam42.loader.addScriptToPage( 'TYPEAHEAD',       'https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js' );
     roam42.loader.addScriptToPage( 'TURNDOWN',        'https://unpkg.com/turndown/dist/turndown.js'                                );
     roam42.loader.addScriptToPage( 'popperjs',        'https://unpkg.com/@popperjs/core@2'                                         );
     roam42.loader.addScriptToPage( 'tippyjs',         'https://unpkg.com/tippy.js@6'                                               );
        roam42.loader.addCSSToPage( 'cssTippyjs',      'https://unpkg.com/tippy.js@6/themes/light-border.css'                       );  
     roam42.loader.addScriptToPage( 'iziToast',        'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/js/iziToast.min.js'   );
        roam42.loader.addCSSToPage( 'cssiziToast',     'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/css/iziToast.min.css' );
     roam42.loader.addScriptToPage( 'deviceDetection', 'https://unpkg.com/current-device/umd/current-device.min.js'                 );
     roam42.loader.addScriptToPage( 'marked-lib',       roam42.host + 'libs/marked.min.js' ); //https://github.com/markedjs/marked
    }

    //common shared functions
       roam42.loader.addCSSToPage( 'styleRM',           roam42.host + 'css/styleRM.css'           );
    roam42.loader.addScriptToPage( 'commonFunctions',   roam42.host + 'common/commonFunctions.js' );
    roam42.loader.addScriptToPage( 'commonDatalog',     roam42.host + 'common/commonDatalog.js  ' );
    roam42.loader.addScriptToPage( 'keyEvents',         roam42.host + 'common/keyevents.js'       );
    roam42.loader.addScriptToPage( 'jumpNav'  ,         roam42.host + 'ext/jumpNav.js'            );
    roam42.loader.addScriptToPage( 'message-startup',   roam42.host + 'messages.js'               );

    //extension modules
    roam42.loader.addScriptToPage( 'dateProcessing',    roam42.host + 'ext/dateProcessing.js'     );
    roam42.loader.addScriptToPage( 'r42kb_lib',         roam42.host + 'common/r42kb_lib.js'       );
    roam42.loader.addScriptToPage( 'templatePoc',       roam42.host + 'ext/templatepoc.js'        );
    roam42.loader.addScriptToPage( 'jumpToDate',        roam42.host + 'ext/jumpToDate.js'         );
    roam42.loader.addScriptToPage( 'autocomplete',      roam42.host + 'ext/autoComplete.js'       );
    roam42.loader.addScriptToPage( 'privacyMode',       roam42.host + 'ext/privacyMode.js'        );
    roam42.loader.addScriptToPage( 'roam42Menu',        roam42.host + 'ext/roam42Menu.js'         );
    roam42.loader.addScriptToPage( 'roam42Tutorials',   roam42.host + 'ext/tutorials.js'          );

    //Do not load in iframe windows
    if( window === window.parent  ){
      roam42.loader.addScriptToPage( 'quickReference',    roam42.host + 'ext/quickRef.js'  );
      roam42.loader.addScriptToPage( 'turnDown',          roam42.host + 'ext/turndownservice.js'  );
      roam42.loader.addScriptToPage( 'roamNavigator',     roam42.host + 'ext/roam-navigator.js'   );
      roam42.loader.addScriptToPage( 'lookupUI',          roam42.host + 'ext/typeaheadUI.js'      );
      roam42.loader.addScriptToPage( 'typeAheadData',     roam42.host + 'ext/typeaheadData.js'    );
      roam42.loader.addScriptToPage( 'formatConverter', 	roam42.host + 'ext/formatConverter.js');
      roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');      
    }

    // Give the libraries a few seconds to get comfy in their new home 
    // and then let the extension dance, that is to say,
    // begin initializing the environment with all the cool tools
    setTimeout(()=>{

        // Dont display in iframe
      // if( window === window.parent ) {
      //     roam42.help.displayStartup(5000);  
      // }

      setTimeout(()=>{
        try {
          if ( device.mobile() == false && window === window.parent  ) { 
            roam42.loader.addScriptToPage( 'livePreview',     roam42.host + 'ext/livePreview.js'  );
            roam42.loader.addScriptToPage( 'dailyNote',       roam42.host + 'ext/dailyNotesPopup.js' );
          }
        } catch(e) {}
        setTimeout(()=>{
          roam42.keyevents.loadKeyEvents();
          roam42.autocomplete.loadAutoComplete();
          roam42.jumpnav.loadJumpNav();
          try { roam42.typeAhead.loadTypeAhead();     } catch(e){};
          try { roam42.jumpToDate.component.initialize();  } catch(e){};
          try { roam42.quickRef.component.initialize(); } catch(e){};
          try { roam42.dailyNotesPopup.component.initialize(); } catch(e){};
          try { roam42.roam42Menu.Initialize(); } catch(e){};
          
        }, 1000);      
      }, 2000);
    }, 5000);

  })();

}

