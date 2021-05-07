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
	roam42.workBench				 Workbench engine
  roam42.KeyboardLib       imported from another library. so letting it stand as its own object
*/


;(()=>{});

if( typeof window.roam42 == 'undefined' ) {

  window.roam42  = {};
  const scriptVersionMatch = document.currentScript.src.match(/roam42\/(\d\d\d\d-\d\d-\d\d-\d\d-\d\d)\/main.js/);
  if (scriptVersionMatch) {
    roam42.buildID = scriptVersionMatch[1];
  } else {
    fetch('https://api.roamjs.com/versions?limit=1&id=roam42')
      .then(r => r.json())
      .then(({versions}) => {
        roam42.buildID = versions[0] || 'Version Not Found';
      }).catch(() => {
        roam42.buildID = 'Version Not Found';
      })
  }
	
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

    roam42.loader.logo2HC = roam42.host + 'img/logo/42logo-2hc.png';
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

  ( async ()=>{

    roam42.loader.addScriptToPage('roamjs-versioning', 'https://roamjs.com/versioning.js');
    roam42.loader.addScriptToPage( 'libs',  roam42.host + 'dist/libs.js'  );
    roam42.loader.addCSSToPage( 'cssLibs',  roam42.host + 'dist/libs.css' );

    //common shared functions
    roam42.loader.addCSSToPage( 'styleRM',           roam42.host + 'css/styleRM.css'           );
    roam42.loader.addScriptToPage( 'commonFunctions',   roam42.host + 'common/commonFunctions.js' );
    roam42.loader.addScriptToPage( 'commonDatalog',     roam42.host + 'common/commonDatalog.js  ' );
    roam42.loader.addScriptToPage( 'jumpNav'  ,         roam42.host + 'ext/jumpNav.js'            );
    roam42.loader.addScriptToPage( 'message-startup',   roam42.host + 'common/messages.js'        );

    //extension modules
    roam42.loader.addScriptToPage( "settings",          roam42.host + 'ext/settings.js'           );
    roam42.loader.addScriptToPage( 'dateProcessing',    roam42.host + 'ext/dateProcessing.js'     );
    roam42.loader.addScriptToPage( 'r42kb_lib',         roam42.host + 'common/r42kb_lib.js'       );
    roam42.loader.addScriptToPage( 'smartBlocks',       roam42.host + 'ext/smartBlocks.js'        );
//    roam42.loader.addScriptToPage( 'templatePoc',       roam42.host + 'ext/templatepoc.js'        );
    roam42.loader.addScriptToPage( 'jumpToDate',        roam42.host + 'ext/jumpToDate.js'         );
    roam42.loader.addScriptToPage( 'privacyMode',       roam42.host + 'ext/privacyMode.js'        );
    roam42.loader.addScriptToPage( 'roam42Menu',        roam42.host + 'ext/roam42Menu.js'         );
    roam42.loader.addScriptToPage( 'roam42Tutorials',   roam42.host + 'ext/tutorials.js'          );
    roam42.loader.addScriptToPage( 'roamNavigator',     roam42.host + 'ext/roam-navigator.js'     );
    roam42.loader.addScriptToPage( 'smartBlocksCmd',    roam42.host + 'ext/smartBlocksCmd.js'     );
    roam42.loader.addScriptToPage( 'smartBlocksRB',     roam42.host + 'ext/smartBlocksRB.js'      );
    roam42.loader.addScriptToPage( 'timemgmt',          roam42.host + 'ext/timemgmt.js'           );
    roam42.loader.addScriptToPage( 'stats',          		roam42.host + 'ext/stats.js'           );

    //Do not load in iframe windows
    if( window === window.parent  ){
      roam42.loader.addScriptToPage( 'quickReference',    roam42.host + 'ext/quickRef.js'         );
      roam42.loader.addScriptToPage( 'lookupUI',          roam42.host + 'ext/typeaheadUI.js'      );
      roam42.loader.addScriptToPage( 'typeAheadData',     roam42.host + 'ext/typeaheadData.js'    );
      roam42.loader.addScriptToPage( 'formatConverter', 	roam42.host + 'ext/formatConverter.js'  );
      roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');
      roam42.loader.addScriptToPage( 'livePreview',       roam42.host + 'ext/livePreview.js'      );
      roam42.loader.addScriptToPage( 'dailyNote',         roam42.host + 'ext/dailyNotesPopup.js'  );
      roam42.loader.addScriptToPage( 'workBench',    			roam42.host + 'ext/workBench.js'   );
      roam42.loader.addCSSToPage( 'workBenchCss',      roam42.host + 'css/workBench.css'       );
    }
    roam42.loader.addScriptToPage( 'keyEvents',         roam42.host + 'common/keyevents.js'       );

    // Give the libraries a few seconds to get comfy in their new home
    // and then let the extension dance, that is to say,
    // begin initializing the environment with all the cool tools

    var loadingCounter = 0;
    
    const interval = setInterval( async ()=> {
      if (roam42.keyevents) {
        clearInterval(interval);
        roam42.keyevents.loadKeyEvents();
        try { roam42.jumpToDate.component.initialize(); } catch(e){};
        try { roam42.typeAhead.loadTypeAhead(); } catch(e){};
        try { roam42.quickRef.component.initialize(); } catch(e){};
        const initializeSb = (counter) => setTimeout(()=> { 
          if (roam42.smartBlocks) {
            try { roam42.smartBlocks.initialize() } catch(e){};
          } else if (counter > 100) {
            console.error('Failed to initalize Smart blocks after 100 tries');
          } else {
            initializeSb(counter + 1);
          }
        }, 100)
        initializeSb(0);
        const initializeWb = (counter) => setTimeout(()=> { 
          if (roam42.wB) {
            try { roam42.wB.initialize() } catch(e){};
          } else if (counter > 100) {
            console.error('Failed to initalize workbench after 100 tries');
          } else {
            initializeWb(counter + 1);
          }
        }, 100)
        initializeWb(0);
				roam42.jumpnav.loadJumpNav();
				try {
					roam42.user = roam42.common.getUserInformation();
				} catch(e) {}

        try {
          if ( window === window.parent  ) {
            try { await roam42.dailyNotesPopup.component.initialize(); } catch(e){};
          }
        } catch(e) {}
        try {  setTimeout(async ()=>{await roam42.roam42Menu.initialize()}, 2000) } catch(e){};          
      } else {
        if(loadingCounter>30)
          clearInterval(interval);
        else
          loadingCounter += 1;
      }
    }, 3000);
    
  })();

}

