// Thanks Bro! gracefully borrowed  from: https://github.com/palashkaria/roam-modifiers
/* globals  roam42, Cookies , iziToast */

// Live preview has 3 states:
// 1 = preview page links
// 2 = preview page links & blocks
// 0 = live preview off



// roam42.livePreview
(async ()=>{

  roam42.livePreview = {};
  roam42.livePreview.state = await roam42.settings.get('LivePreview');
  roam42.livePreview.browserHeight = await roam42.settings.get('LivePreviewHeight');
  roam42.livePreview.browserWidth  = await roam42.settings.get('LivePreviewWidth');
  roam42.livePreview.delay         = Number(await roam42.settings.get('LivePreviewDelay '));

  if(roam42.livePreview.browserHeight==null) roam42.livePreview.browserHeight = '500px';
  if(roam42.livePreview.browserWidth==null)  roam42.livePreview.browserWidth  = '500px';
  if(roam42.livePreview.delay==null)         roam42.livePreview.delay = '100';
  
  if( roam42.livePreview.state == 'off') 
    return;

  roam42.livePreview.roam42LivePreviewState = 0 //off by default

  roam42.livePreview.keyboardHandlerLivePreview = ev => {
    if( ev.ctrlKey==true  &&  ev.key=='L' || ev.altKey==true  &&  ev.key=='l' ) {
      ev.preventDefault();

      roam42.livePreview.toggleRoamLivePreviewState();
      let msg = ''
      switch (roam42.livePreview.getRoamLivePreviewState()) {
        case 1:
          msg = 'Enabled'
          break;
        case 2:
          msg = 'Enabled with block refs'
          break;
        default:
          msg = 'Disabled'
          break;
      }
      iziToast.destroy();
      iziToast.show({
        message: 'Live Preview<br/><b>' + msg + '</b>' ,
        theme: 'dark',
        progressBar: true,
        animateInside: false,
        close: false,
        timeout: 3000,
        closeOnClick: true,
        displayMode: 2
      })
      return true
    }
  }

  roam42.livePreview.getRoamLivePreviewState = ()=>{
    switch (Cookies.get('RoamLivePreview_IsEnabled')) {
      case '1':
        return 1;
      case '2':
        return 2;
      default:
        return 0;
    }
  }

  roam42.livePreview.toggleRoamLivePreviewState = ()=>{
    switch (roam42.livePreview.getRoamLivePreviewState()) {
      case 1:
        roam42.livePreview.setRoamLivePreviewState(2);
        break;
      case 2:
        roam42.livePreview.setRoamLivePreviewState(0);
        break;
      default:
        roam42.livePreview.setRoamLivePreviewState(1);
        break;
    }
  }


  roam42.livePreview.setRoamLivePreviewState = (val)=>{
    Cookies.set('RoamLivePreview_IsEnabled', val, { expires: 365 })
    roam42.livePreview.roam42LivePreviewState = val
  }

  roam42.livePreview.livePreviewStatusToast = ()=> {
    var status = roam42.livePreview.getRoamLivePreviewState()
    iziToast.show({
      timeout: 20000,
      theme: 'dark',
      title: 'Live preview',
      message: 'Status:',
      position: 'bottomRight',
      progressBarColor: 'rgb(0, 255, 184)',
      buttons: [
      ['<button>Enable</button>', function (instance, toast) {
          roam42.livePreview.setRoamLivePreviewState(1);
          instance.hide({transitionOut: 'fadeOutUp'}, toast, 'buttonName');
      }, (status==1)],
      ['<button>Enable with block refs</button>', function (instance, toast) {
          roam42.livePreview.setRoamLivePreviewState(2);
          instance.hide({transitionOut: 'fadeOutDown'}, toast, 'buttonName');
      }, (status==2)],
      ['<button>Disable</button>', function (instance, toast) {
          roam42.livePreview.setRoamLivePreviewState(0)
          instance.hide( {transitionOut:'fadeOutDown'}, toast, 'buttonName');
      }, (status==0) ]
      ]
    })

  }

  
    if( window === window.parent  ){

      'use strict';
      const runInPageContext = (method, ...args) => {
        // will be parsed as a function object.
         // console.log(method);
         // console.log(args);
        const stringifiedMethod = method.toString();

        const stringifiedArgs = JSON.stringify(args);

        const scriptContent = `document.currentScript.innerHTML = JSON.stringify((${stringifiedMethod})(...${stringifiedArgs}));`;

        const scriptElement = document.createElement('script');
        scriptElement.innerHTML = scriptContent;
        document.documentElement.prepend(scriptElement);

        const result = JSON.parse(scriptElement.innerHTML);
        document.documentElement.removeChild(scriptElement);
        //console.log(result);
        return result;
      };
      const getBlockById = (dbId) => {
        const fn = function (dbId) {
          return function (dbId, ...args) {
            return window.roamAlphaAPI.pull(...args, '[*]', dbId);
          };
        };
        return runInPageContext(fn(dbId), dbId);
      };

      const queryFn = (query, ...params) => {
        return runInPageContext(
          function (...args) {
            return window.roamAlphaAPI.q(...args);
          },
          query,
          ...params
        );
      };

      const queryFirst = (query, ...params) => {
        const results = queryFn(query, ...params);
        if (!results || !results[0] || results[0].length < 1) return null;

        return getBlockById(results[0][0]);
      };
      const baseUrl = () => {
        const url = new URL(window.location.href);
        const parts = url.hash.split('/');

        url.hash = parts.slice(0, 3).concat(['page']).join('/');
        return url;
      };
      const getPageByName = (name) => {
        return queryFirst('[:find ?e :in $ ?a :where [?e :node/title ?a]]', name);
      };
      const getPageUrlByName = (name) => {
        const page = getPageByName(name);
        return getPageUrl(page[':block/uid']);
      };
      const getPageUrl = (uid) => {
        return baseUrl().toString() + '/' + uid ;
      };

      const createPreviewIframe = () => {
        const iframe = document.createElement('iframe');
        // const url = getPageUrl('search');
        let url = baseUrl().toString().replace('/page','');
        if(roam42.livePreview.state=='optimized')
          url = url + '?disablejs=true';
        
        const isAdded = (pageUrl) => !!document.querySelector(`[src="${pageUrl}"]`);
        if (isAdded(url)) {
          return;
        }
        iframe.src = url;
        iframe.style.position = 'absolute';
        iframe.style.left = '0';
        iframe.style.top = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.style.height = '0px';
        iframe.style.width = '0px';
        iframe.style.border = '0';
        iframe.style.boxShadow = '0 0 4px 5px rgba(0, 0, 0, 0.2)';
        iframe.style.borderRadius = '8px';
        iframe.id = 'roam42-live-preview-iframe';
        const styleNode = document.createElement('style');

        styleNode.innerHTML = `
          div.roam-app > div.flex-h-box {
            margin-left: 10px !important;
          }
          .roam-article {
            padding: 10px !important;
            margin-top: 10px !important;
          }
          .rm-title-display {
            margin-top: 0px;
          }
          .roam-topbar {
              display: none !important;
          }
          .roam-sidebar-container {
              display: none !important;
          }
          .roam-main {
              padding: 0 !important;
          }
          .roam-body-main {
              top: 0px !important;
              left: 0px !important;
              width: 100% !important;
          }
          #buffer {
              display: none !important;
          }
          iframe {
              display: none !important;
          }
        `;

        iframe.onload = (event) => {
          event.target.contentDocument.body.appendChild(styleNode);
        };
        document.body.appendChild(iframe);
        const htmlElement = document.querySelector('html');
        if (htmlElement) {
          // to reset scroll after adding iframe
          htmlElement.scrollTop = 0;
        }
        return iframe;
      };

        function generateGetBoundingClientRect(x = 0, y = 0) {
          return () => ({
            width: 0,
            height: 0,
            top: y,
            right: x,
            bottom: y,
            left: x,
          });
        }

        const virtualElement = {
          getBoundingClientRect: generateGetBoundingClientRect(),
        };

        document.addEventListener('mousemove', ({ clientX: x, clientY: y }) => {
          virtualElement.getBoundingClientRect = generateGetBoundingClientRect(x+1, y);
        });

      const enableLivePreview = () => {
        let hoveredElement = null;
        let popupTimeout = null;
        let popper = null;
        let externalUrl = false
        let specialDelayMouseOut = false   //used to control the mouseout event in some scenarios
        let specialDelayTimeOutAmount = 200
        const previewIframe = createPreviewIframe();
        var delayTimer = roam42.livePreview.delay;

        //get configuration setting from roam/js
        if(window.roam42LivePreview) {
          delayTimer = window.roam42LivePreview.delay == undefined ? delayTimer : window.roam42LivePreview.delay
        }
        
        roam42.livePreview.roam42LivePreviewState = roam42.livePreview.getRoamLivePreviewState();  //get current state of live preview

        document.addEventListener('mouseover', (e) => {
          // if( e.ctrlKey == false ) { return }
          if( e.ctrlKey == false && roam42.livePreview.roam42LivePreviewState == 0 ) { return };
          let pageIsBlock = false;
          let target = e.target;

          let isPageRef = false;
          let isPageRefTag = target.classList.contains('rm-page-ref-tag');
          let isPageRefNameSpace = target.classList.contains('rm-page-ref-namespace-color');
          let text = '';


          if ( isPageRefTag ) {                                   // # tag
            isPageRef = true;
            text = target.innerText.replace('#','');
          } else {
            if(target.classList.contains('rm-page-ref')) {        //  [[ page ]]
              isPageRef = true;
              pageIsBlock = true;
              text = target.parentElement.getAttribute('data-link-uid');
            }
          }

          //finds odd scenario like: [[[[book]]/smart notes]]
          if( isPageRef == false && target.classList.length==0 &&
               target.parentElement.classList.contains('rm-page-ref') &&
               target.parentElement.parentElement.hasAttribute('data-link-uid')  ){
              isPageRef = true;
              pageIsBlock = true;
              text = target.parentElement.parentElement.getAttribute('data-link-uid')
          }


          if ( isPageRef == false && isPageRefNameSpace ) {
            isPageRef = true;
            text = target.parentElement.getAttribute('data-link-title')
          }

          if (isPageRef == false && target.classList.contains('rm-alias-page') ) {
            isPageRef = true;
            text = target.title.replace('page: ','')
          }
          if (isPageRef == false && target.classList.contains('rm-ref-page-view-title') ) {
            isPageRef = true;
            text = target.innerText
            specialDelayMouseOut = true
            setTimeout(()=> specialDelayMouseOut = false, delayTimer+specialDelayTimeOutAmount)
          }

          if ( !isPageRef  && !isPageRefTag && target.classList.length == 0 && target.parentNode.classList.contains('rm-page-ref') ) {
            isPageRef = true;
            text = target.innerText;
            target = e.target;
          }

          if ( isPageRef == false && target.style.cursor == 'pointer' && target.parentNode.classList.contains('level2') ) {
            isPageRef = true;
            text = target.text;
          }

          // "All Pages" - page
          try{
            if ( isPageRef == false  && target.classList.contains('bp3-text-overflow-ellipsis') && target.firstChild.classList.contains('rm-pages-title-text') ) {
              isPageRef = true
              text = target.firstChild.text;  //firstChild.text
              target = target.parentElement;
            }
          } catch(e) {}

          //preview BLOCK references
          if ( isPageRef == false && (  e.ctrlKey == true || roam42.livePreview.roam42LivePreviewState == 2 ) && ( target.classList.contains('rm-block-ref') || target.classList.contains('rm-alias-block') ) ) {
            pageIsBlock = true;
            let block = target.closest('.roam-block').id;
            let bId = block.substring( block.length -9);
            var q = `[:find ?bstring :in $ ?buid :where [?e :block/uid ?buid][?e :block/string ?bstring] ]`;
            var results = window.roamAlphaAPI.q(q, bId);
            var refNumberInBlock = Array.from(target.closest('.roam-block').querySelectorAll(`.rm-block-ref`)).indexOf(target);
            if(refNumberInBlock<0){refNumberInBlock=0};
            isPageRef = true;
            text = results[0].toString();
            text = text.match(/\(\((.*?)\)\)/g) ;   //results[0][0].refs[refNumberInBlock].uid
            text = text[refNumberInBlock];
            text = text.replaceAll('(','').replaceAll(')','');
            specialDelayMouseOut = true;
            setTimeout(()=> specialDelayMouseOut = false, delayTimer+specialDelayTimeOutAmount);
          }

          // remove '#' for page tags
          if (isPageRef) {
            hoveredElement = target;
            const url = pageIsBlock == true ? getPageUrl(text) : getPageUrlByName(text)
            const isAdded = (pageUrl) =>
              !!document.querySelector(`[src="${pageUrl}"]`);
            const isVisible = (pageUrl) =>
              document.querySelector(`[src="${pageUrl}"]`).style.opacity === '1';
            if ((!isAdded(url) || !isVisible(url)) && previewIframe) {
              setTimeout(()=> {previewIframe.src  = url}, 100)
              previewIframe.style.pointerEvents = 'none';
                            
              if(window.roam42LivePreview) {
                previewIframe.style.height = window.roam42LivePreview.height == undefined  ? '500px' : window.roam42LivePreview.height
                previewIframe.style.width  = window.roam42LivePreview.width  == undefined  ? '500px' : window.roam42LivePreview.width
              } else {
                previewIframe.style.height = roam42.livePreview.browserHeight;
                previewIframe.style.width  = roam42.livePreview.browserWidth;
              }
             }
            if (!popupTimeout) {
              popupTimeout = window.setTimeout(() => {
                previewIframe.contentDocument.querySelector('.roam-article').scrollIntoView()
                if (previewIframe) {
                  previewIframe.style.opacity = '1';
                  previewIframe.style.pointerEvents = 'all';
                  // popper = window.Popper.createPopper(target, previewIframe, {
                  popper = window.Popper.createPopper( virtualElement, previewIframe, {
                    placement: 'right',
                    modifiers: [
                      {
                        name: 'preventOverflow',
                        options: {
                          padding: { top: 48 },
                        },
                      },
                      {
                        name: 'flip',
                        options: {
                          boundary: document.querySelector('#app'),
                        },
                      },
                    ],
                  });
                }
              }, delayTimer + 100)
            }
          }
        });
        document.addEventListener('mouseout', (e) => {

          if(specialDelayMouseOut){
            hoveredElement = null
            return
          }
          const target = e.target;
          const relatedTarget = e.relatedTarget;
          const iframe = document.getElementById('roam42-live-preview-iframe');
          if (
            ( hoveredElement === target && relatedTarget !== iframe) ||
            (target === iframe && relatedTarget !== hoveredElement) ||
            !document.body.contains(hoveredElement)
          ) {
            hoveredElement = null;
            clearTimeout(popupTimeout);
            popupTimeout = null;
            if (iframe) {
              // if (iframe.contentDocument) {
              //   // scroll to top when removed
              //   const scrollContainer = iframe.contentDocument.querySelector(
              //     '.roam-article > div'
              //   );
              //   if (scrollContainer) {
              //     scrollContainer.scrollTop = 0;
              //   }
              // }
              iframe.style.pointerEvents = 'none';
              iframe.style.opacity = '0';
              iframe.style.height = '0';
              iframe.style.width = '0';
            }
            if (popper) {
              popper.destroy();
              popper = null;
            }
          } else {
            //console.log('out', target, event);
          }
        });
      };
      enableLivePreview()
    }

})();
