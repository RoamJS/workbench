/* globals  logo2HC, Mousetrap ,iziToast, getArticleOfCurrentPage, simulateMouseClick,simulateMouseClickRight,
            saveLocationParametersOfTextArea, restoreLocationParametersOfTexArea, KeyboardLib, simulateMouseOver   
            sidebarRightToggle, sidebarLeftToggle, sidebarLeftToggle, sidebarRightToggle  
*/

const loadJumpNav = () => {
 Mousetrap.prototype.stopCallback = function () { return false }
  Mousetrap.bind([
        // block: expand, collapse, ref, add action
        'ctrl+j x', 'ctrl+j l', 'ctrl+j r', 'ctrl+j a', 'meta+j x', 'meta+j l', 'meta+j r', 'meta+j a',   'alt+j x', 'alt+j l', 'alt+j r', 'alt+j a',   
        // block align left,center, right, justify
        'ctrl+j 1', 'ctrl+j 2', 'ctrl+j 3', 'ctrl+j 4', 'meta+j 1', 'meta+j 2', 'meta+j 3', 'meta+j 4',   'alt+j 1', 'alt+j 2', 'alt+j 3', 'alt+j 4',  
        // page: first node last node
        'ctrl+j t', 'ctrl+j b', 'ctrl+ t',              'meta+j t', 'meta+j b', 'meta+ t',                'alt+j t', 'alt+j b', 'alt+ t',          
        // page: expand/collapse open in side
        'ctrl+j e', 'ctrl+j c', 'ctrl+j o',             'meta+j e', 'meta+j c', 'meta+j o',               'alt+j e', 'alt+j c', 'alt+j o',
        // page: toggle linked references, unlinked references
        'ctrl+j i', 'ctrl+j u',                         'meta+j i', 'meta+j u',                           'alt+j i', 'alt+j u',
        // page: Expand All/Collapse parents or children  in linked references, unlinked references
        'ctrl+j f', 'ctrl+j d', 'ctrl+j p',             'meta+j f', 'meta+j d', 'meta+j p',               'alt+j f', 'alt+j d', 'alt+j p',
        // help for javigation
         'ctrl+j h','ctrl+j q',                      'meta+j h', 'meta+j q',                   'alt+j h'  ,'alt+j q',        
        // Side bars
        'ctrl+j n','ctrl+j m',                      'meta+j n', 'meta+j m',                   'alt+j n', 'alt+j m',    
        // daily notes and lookup
        'ctrl+j ,','ctrl+j .',                      'meta+j ,', 'meta+j .',                   'alt+j ,', 'alt+j .',    
      ], (event, handler)=> { 
      handler = handler.replace('meta','ctrl')
      handler = handler.replace('alt', 'ctrl')

     //GOTO top/bottom of page
      if(['ctrl+j t', 'ctrl+j b'].includes(handler)) {
        // var articleContent = getArticleOfCurrentPage()
        // handler=='ctrl+j b' || handler=='˚' ? simulateMouseClick(articleContent[ articleContent.length-1 ]) : simulateMouseClick(articleContent[0])        
        // setTimeout(()=>{
          var articleContent = getArticleOfCurrentPage()
          handler=='ctrl+j b' || handler=='˚' ? simulateMouseClick(articleContent[ articleContent.length-1 ]) : simulateMouseClick(articleContent[0])        
        // },100)
        return false
      }    

      // BLOCKS: fun with blocks
      if(['ctrl+j x', 'ctrl+j l', 'ctrl+j r', 'ctrl+j a',  'ctrl+j 1', 'ctrl+j 2', 'ctrl+j 3', 'ctrl+j 4' ].includes(handler)) {
        var locFacts = saveLocationParametersOfTextArea(event.target)
        var parentControlNode = ''
        if( document.getElementById(locFacts.id).parentNode.parentNode.tagName == 'DIV') {
          parentControlNode =  document.getElementById(locFacts.id).parentNode  
        } else {
          //climb up higher one node in chain
          parentControlNode =  document.getElementById(locFacts.id).parentNode.parentNode  
        }
        simulateMouseClickRight(parentControlNode.previousSibling.childNodes[1])
        setTimeout(()=>{
          switch(handler)  {
            case 'ctrl+j x': // expand block
              document.querySelector('.bp3-popover-content > div> ul').childNodes[3].childNodes[0].click()
              restoreLocationParametersOfTexArea(locFacts)
              break
            case 'ctrl+j l':      // collapse block
              document.querySelector('.bp3-popover-content > div> ul').childNodes[4].childNodes[0].click()                    
              restoreLocationParametersOfTexArea(locFacts)
              break
            case 'ctrl+j r':      // copy block ref
              simulateMouseClick( document.querySelector('.bp3-popover-content > div> ul').childNodes[0].childNodes[0] )            
              restoreLocationParametersOfTexArea(locFacts)
              break
            case 'ctrl+j a':      // add reaction
              setTimeout(()=>{
                simulateMouseOver(document.querySelector('.bp3-popover-content > div> ul').childNodes[5].childNodes[0].childNodes[0] )
              },50)
              return false
              break
            case 'ctrl+j 1':     // left allign block
              simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[0] )
              KeyboardLib.pressEsc()
              break
            case 'ctrl+j 2':     // center allign block
              simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[1] )
              KeyboardLib.pressEsc()
              break
            case 'ctrl+j 3':     // right allign block
              simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[2] )
              KeyboardLib.pressEsc()
              break
            case 'ctrl+j 4':     // justify allign block
              simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[3] )
              KeyboardLib.pressEsc()
              break
          }
          restoreLocationParametersOfTexArea(locFacts)        
        },100)
        return false
      }

      // PAGE: Paging all Hitchhikers
      if(['ctrl+j e', 'ctrl+j c', 'ctrl+j o'  ].includes(handler)) {
        var locFacts =  (event.srcElement.localName == "textarea")  ? saveLocationParametersOfTextArea(event.target) : ''
        var zoomedView = 0  // 0 if page is not zoomed, 1 if zoomed
        try {
          simulateMouseClickRight(document.querySelector('.rm-title-display'))          
        } catch(e) {
          simulateMouseClickRight(document.querySelectorAll('.simple-bullet-outer')[0])
          zoomedView = 1  
        }
        setTimeout(()=>{
          switch(handler) {
            case 'ctrl+j e':
              document.querySelector('.bp3-popover-content > div> ul').childNodes[2+zoomedView].childNodes[0].click()
              break;
            case 'ctrl+j c':
              document.querySelector('.bp3-popover-content > div> ul').childNodes[3+zoomedView].childNodes[0].click()
              break;          
            case 'ctrl+j o':
              document.querySelector('.bp3-popover-content > div> ul').childNodes[1+zoomedView].childNodes[0].click()
              break;          
          }
          if(locFacts!='') {
            setTimeout(()=>{
              restoreLocationParametersOfTexArea(locFacts)
            },400)
          }
        },100)
        return false
      }

    // PAGE: expand childern of linked and unlinked references
      if(['ctrl+j f', 'ctrl+j d', 'ctrl+j p',  ].includes(handler)) {
          switch(handler) {
            case 'ctrl+j f': //toggle parents
              document.querySelectorAll('.rm-title-arrow-wrapper .bp3-icon-caret-down').forEach( (element)=>{
                simulateMouseClick(element)
              })
              break;          
            case 'ctrl+j d':
              document.querySelectorAll('.rm-reference-item  .simple-bullet-outer').forEach( (element)=>{
                simulateMouseClickRight(element)
                document.querySelector('.bp3-popover-content > div> ul').childNodes[3].childNodes[0].click()
              })
              break;          
            case 'ctrl+j p':
              document.querySelectorAll('.rm-reference-item  .simple-bullet-outer').forEach( (element)=>{
                simulateMouseClickRight(element)
                document.querySelector('.bp3-popover-content > div> ul').childNodes[4].childNodes[0].click()
              })
              break;          
          }
        return false
      }

    
      // PAGE: toggle linked and unlinked references
      if(['ctrl+j i', 'ctrl+j u',  ].includes(handler)) {
          switch(handler) {
            case 'ctrl+j i':
              document.querySelector('.rm-reference-container .rm-caret').click()
              document.querySelector('.rm-reference-container .rm-caret').scrollIntoView()
              break;          
            case 'ctrl+j u':
              document.querySelector('.rm-reference-main > div > div:nth-child(2) > div > span > span').click()
              document.querySelector('.rm-reference-main > div > div:nth-child(2) > div > span > span').scrollIntoView()
              break;          
          }
        return false
      }

      if(handler=='ctrl+j q' ) { displayHelp() }
      if(handler=='ctrl+j h' ) { displayJumpNavHelp() }

      if(handler=='ctrl+j n' ) { sidebarLeftToggle() }
      if(handler=='ctrl+j m' ) { sidebarRightToggle() }

      if(handler=='ctrl+j ,' ) { dailyNotesPopup2.toggleVisible() }
      if(handler=='ctrl+j .' ) { typeAheadLookup() }
    
      return false
    
    })

  const displayJumpNavHelp = ()=> { 
   iziToast.destroy(); 
   iziToast.show({
      title: 'Roam42 Jump Nav Commands',
      message: `
<div style="position:absolute;top:-110px;right:-15px;z-index:1000;">
  <img width="70px" src="${logo2HC}"></img>
</div>
<br/>
<pre style="max-width:260px">
<b>Page</b>
 T Top of page
 B Bottom of page
 E Expand all
 C Collapse all
 O Open this page in side bar

<b>Linked/Unlinked Refs</b>
 I Toggle Linked refs
 U Toggle Unlinked refs
 F Toggle Parents (page level) 
 D Expand children  
 P Collapse children  

<b>Blocks</b>
 R Copy block ref
 X Expand all
 L Collapse all
 1 Align left
 2 Center align  
 3 Align right
 4 Justify
 A Reaction

<b>Others</b>
 n Toggle left sidebar
 m Toggle right sidebar
 q Roam42 Help
 , Daily Notes Popup
 . Dictionary

</pre>
      `.trim(),
      theme: 'dark',
      progressBar: true,
      animateInside: true,
      close: false,
      timeout: 30000,
      closeOnClick: true,
      maxWidth: '300px',
      displayMode: 2
    });
  }
} 