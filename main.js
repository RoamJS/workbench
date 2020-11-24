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
  roam42.formatConverterUI UI to roam42.formatConverter    
  roam42.smartBlocks       SmartBlocks engine    
  roam42.KeyboardLib       imported from another library. so letting it stand as its own object
*/

;(()=>{});

if( typeof window.roam42 == 'undefined' ) { 

  window.roam42     =   {};
  roam42.buildID = 'Roam<sup>42</sup> 2020-11-24a (BeebleBrox) ';
  
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
    roam42.loader.addScriptToPage( 'JQUERY',           roam42.host + 'dist/jquery/jquery-3.5.1.min.js'                                 );
    roam42.loader.addScriptToPage( 'JSCOOKIE',         roam42.host + 'dist/jscookie/js.cookie-3.0.0-rc.1.min.js'                                 );
    roam42.loader.addScriptToPage( 'MOUSETRAP',        roam42.host + 'dist/mousetrap/mousetrap-1.6.5.min.js' );
    roam42.loader.addScriptToPage( 'chrono',           roam42.host + 'dist/chrono/chrono-1.4.8.min.js' );
    roam42.loader.addScriptToPage( 'jsFlatpickr',      roam42.host + 'dist/flatpickr/flatpickr-4.6.6.min.js' );
       roam42.loader.addCSSToPage( 'cssFlatpckr',      roam42.host + 'dist/flatpickr/flatpickr.min.css' );
       roam42.loader.addCSSToPage( 'cssFlatpckrThme',  roam42.host + 'css/airbnb.css' );
    roam42.loader.addScriptToPage( 'jsJsPanel',        roam42.host + 'dist/jspanel/jspanel-4.11.1.min.js' );
       roam42.loader.addCSSToPage( 'cssJsPanel',       roam42.host + 'dist/jspanel/jspanel.min.css' );
    roam42.loader.addScriptToPage( 'tributeJS',        roam42.host + 'dist/tribute/tribute.min.js' );

    //Do not load in iframe windows
    if( window === window.parent  ){
     roam42.loader.addScriptToPage( 'TYPEAHEAD',       roam42.host + 'dist/typeahead/typeahead-0.11.1.bundle.js' );
     roam42.loader.addScriptToPage( 'popperjs',        roam42.host + 'dist/popperjs/popperjs-core-2.5.4.js'                                         );
     roam42.loader.addScriptToPage( 'tippyjs',         roam42.host + 'dist/tippy/tippy-6.2.7.min.js' );
        roam42.loader.addCSSToPage( 'cssTippyjs',      roam42.host + 'dist/tippy/light-border.css' );
      
      
     roam42.loader.addScriptToPage( 'iziToast',        roam42.host + 'dist/iziToast/iziToast-1.4.0.min.js' );
        roam42.loader.addCSSToPage( 'cssiziToast',     roam42.host + 'dist/iziToast/iziToast.min.css' );
     roam42.loader.addScriptToPage( 'deviceDetection', roam42.host + 'dist/deviceDetection/current-device.min.js' );
     roam42.loader.addScriptToPage( 'marked-lib',      roam42.host + 'dist/marked/marked.min.js' ); //https://github.com/markedjs/marked
    }

    //common shared functions
       roam42.loader.addCSSToPage( 'styleRM',           roam42.host + 'css/styleRM.css'           );
    roam42.loader.addScriptToPage( 'commonFunctions',   roam42.host + 'common/commonFunctions.js' );
    roam42.loader.addScriptToPage( 'commonDatalog',     roam42.host + 'common/commonDatalog.js  ' );
    roam42.loader.addScriptToPage( "settings",          roam42.host + 'ext/settings.js');    
    roam42.loader.addScriptToPage( 'keyEvents',         roam42.host + 'common/keyevents.js'       );
    roam42.loader.addScriptToPage( 'jumpNav'  ,         roam42.host + 'ext/jumpNav.js'            );
    roam42.loader.addScriptToPage( 'message-startup',   roam42.host + 'messages.js'               );

    //extension modules
    roam42.loader.addScriptToPage( 'dateProcessing',    roam42.host + 'ext/dateProcessing.js'     );
    roam42.loader.addScriptToPage( 'r42kb_lib',         roam42.host + 'common/r42kb_lib.js'       );
    roam42.loader.addScriptToPage( 'smartBlocks',       roam42.host + 'ext/smartBlocks.js'        );
    roam42.loader.addScriptToPage( 'templatePoc',       roam42.host + 'ext/templatepoc.js'        );
    roam42.loader.addScriptToPage( 'jumpToDate',        roam42.host + 'ext/jumpToDate.js'         );
    roam42.loader.addScriptToPage( 'autocomplete',      roam42.host + 'ext/autoComplete.js'       );
    roam42.loader.addScriptToPage( 'privacyMode',       roam42.host + 'ext/privacyMode.js'        );
    roam42.loader.addScriptToPage( 'roam42Menu',        roam42.host + 'ext/roam42Menu.js'         );
    roam42.loader.addScriptToPage( 'roam42Tutorials',   roam42.host + 'ext/tutorials.js'          );
    roam42.loader.addScriptToPage( 'roamNavigator',     roam42.host + 'ext/roam-navigator.js'     );
    roam42.loader.addScriptToPage( 'smartBlocksCmd',    roam42.host + 'ext/smartBlocksCmd.js'     );
    roam42.loader.addScriptToPage( 'smartBlocksRB',     roam42.host + 'ext/smartBlocksRB.js'      );

    //Do not load in iframe windows
    if( window === window.parent  ){
      roam42.loader.addScriptToPage( 'quickReference',    roam42.host + 'ext/quickRef.js'  );
      roam42.loader.addScriptToPage( 'lookupUI',          roam42.host + 'ext/typeaheadUI.js'      );
      roam42.loader.addScriptToPage( 'typeAheadData',     roam42.host + 'ext/typeaheadData.js'    );
      roam42.loader.addScriptToPage( 'formatConverter', 	roam42.host + 'ext/formatConverter.js');
      roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');      
      roam42.loader.addScriptToPage( 'livePreview',       roam42.host + 'ext/livePreview.js'  );
      roam42.loader.addScriptToPage( 'focuesMode',        roam42.host + 'ext/focusMode.js'  );
    }

    // Give the libraries a few seconds to get comfy in their new home 
    // and then let the extension dance, that is to say,
    // begin initializing the environment with all the cool tools
    setTimeout(()=>{

      setTimeout(()=>{
        try {
          if ( device.mobile() == false && window === window.parent  ) { 
            roam42.loader.addScriptToPage( 'dailyNote',       roam42.host + 'ext/dailyNotesPopup.js' );
          }
        } catch(e) {}
        setTimeout(async ()=>{
          roam42.keyevents.loadKeyEvents();
          roam42.autocomplete.loadAutoComplete();
          roam42.jumpnav.loadJumpNav();
          try { roam42.typeAhead.loadTypeAhead();              } catch(e){};
          try { roam42.jumpToDate.component.initialize();      } catch(e){};
          try { roam42.quickRef.component.initialize();        } catch(e){};
          try { roam42.dailyNotesPopup.component.initialize(); } catch(e){};
          try { roam42.roam42Menu.initialize();                } catch(e){};
          try { await roam42.smartBlocks.initialize();               } catch(e){};
        }, 1000);      
      }, 2000);
    }, 5000);

  })();

}

