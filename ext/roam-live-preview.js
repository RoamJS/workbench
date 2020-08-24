// Thanks Bro! gracefully borrowed  from: https://github.com/palashkaria/roam-modifiers
/* globals , Cookies , iziToast */

document.addEventListener('keydown', (e)=> {
  if( e.ctrlKey==true  &&  e.key=='L' ) {
    e.preventDefault();
    setRoamLivePreview_IsEnabled(  !getRoamLivePreview_IsEnabled() )
    
    let msg = ''
    if(getRoamLivePreview_IsEnabled()==true) {
      msg = 'E N A B L E D'
    } else {
      msg = 'Disabled'      
    }  
    iziToast.destroy();
    iziToast.show({
      message: 'Live Preview<br/><b>' + msg + '</b>' ,
      theme: 'dark',
      progressBar: true,
      animateInside: true,
      close: false,
      timeout: 5000,
      closeOnClick: true,
      displayMode: 2
    })
  }
})


const getRoamLivePreview_IsEnabled = ()=>{
  if( Cookies.get('RoamLivePreview_IsEnabled') === 'true' ) {
    return true
  } else {
    return false
  }
}

const setRoamLivePreview_IsEnabled = (val)=>{
  if(val == true) {
    Cookies.set('RoamLivePreview_IsEnabled', 'true') 
  } else {
    Cookies.set('RoamLivePreview_IsEnabled', 'false')     
  }
}


(function () {
  
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
      // https://roamresearch.com/#/app/roam-toolkit/page/03-24-2020
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
      return baseUrl().toString() + '/' + uid;
    };

    const createPreviewIframe = () => {
      const iframe = document.createElement('iframe');
      const url = getPageUrl('search');
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

      iframe.style.height = '0';
      iframe.style.width = '0';
      iframe.style.border = '0';
      iframe.style.boxShadow = '0 0 4px 5px rgba(0, 0, 0, 0.2)';
      iframe.style.borderRadius = '4px';
      iframe.id = 'roam-toolkit-preview-iframe';

      const styleNode = document.createElement('style');
      styleNode.innerHTML = `
              .roam-topbar {
                  display: none !important;
              }
              .roam-body-main {
                  top: 0px !important;
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
        
    const enableLivePreview = () => {
      let hoveredElement = null;
      let popupTimeout = null;
      let popper = null;
      let externalUrl = false
      const previewIframe = createPreviewIframe();
      
      document.addEventListener('mouseover', (e) => {
        // if( e.ctrlKey == false ) { return }
        if( getRoamLivePreview_IsEnabled() == false) { return }
        const target = e.target;

        let isPageRef = target.classList.contains('rm-page-ref');
        let isPageRefTag = target.classList.contains('rm-page-ref-tag');
        
        let text = isPageRefTag ? target.innerText.slice(1) : target.innerText;

        if (isPageRef == false && target.classList.contains('rm-alias-page') ) {
          isPageRef = true
          text = target.title.replace('page: ','') 
        }
        if (isPageRef == false && target.classList.contains('rm-ref-page-view-title') ) {
          isPageRef = true
          text = target.innerText
        }
        
        // console.log( isPageRef , isPageRefTag , target.classList.length)
        if ( !isPageRef  && !isPageRefTag && target.classList.length == 0 && target.parentNode.classList.contains('rm-page-ref') ) {
          isPageRef = true
          text = target.innerText
          target = e.target
        }
        
        // remove '#' for page tags
        if (isPageRef) {
          hoveredElement = target;
          const url = getPageUrlByName(text);
          const isAdded = (pageUrl) =>
            !!document.querySelector(`[src="${pageUrl}"]`);
          const isVisible = (pageUrl) =>
            document.querySelector(`[src="${pageUrl}"]`).style.opacity === '1';
          if ((!isAdded(url) || !isVisible(url)) && previewIframe) {
            previewIframe.src = url;
            previewIframe.style.height = '500px';
            previewIframe.style.width = '500px';
            previewIframe.style.pointerEvents = 'none';
          }
          if (!popupTimeout) {
         //   popupTimeout = window.setTimeout(() => {
              if (previewIframe) {
                previewIframe.style.opacity = '1';
                previewIframe.style.pointerEvents = 'all';

                popper = window.Popper.createPopper(target, previewIframe, {
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
           // }, 100);
          }
        }
      });
      document.addEventListener('mouseout', (e) => {

        const target = e.target;
        const relatedTarget = e.relatedTarget;
        const iframe = document.getElementById('roam-toolkit-preview-iframe');
        if (
          (hoveredElement === target && relatedTarget !== iframe) ||
          (target === iframe && relatedTarget !== hoveredElement) ||
          !document.body.contains(hoveredElement)
        ) {
          hoveredElement = null;
          clearTimeout(popupTimeout);
          popupTimeout = null;
          if (iframe) {
            if (iframe.contentDocument) {
              // scroll to top when removed
              const scrollContainer = iframe.contentDocument.querySelector(
                '.roam-center > div'
              );
              if (scrollContainer) {
                scrollContainer.scrollTop = 0;
              }
            }
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
    var remoteScript = document.createElement('script');
    remoteScript.src =
      'https://unpkg.com/@popperjs/core@2'
    remoteScript.onload = enableLivePreview;
    document.body.appendChild(remoteScript);
  }
})();