/* globals   Mousetrap ,iziToast, getArticleOfCurrentPage, simulateMouseClick,simulateMouseClickRight,
            saveLocationParametersOfTextArea, restoreLocationParametersOfTexArea, KeyboardLib   */
const loadJumpNav = () => {
 Mousetrap.prototype.stopCallback = function () { return false }
  Mousetrap.bind([
        // block: expand, collapse, ref 
        'ctrl+j e', 'ctrl+j c', 'ctrl+j r',             'meta+j e', 'meta+j c', 'meta+j r',               'alt+j e', 'alt+j c', 'alt+j r',   
        // block align left,center, right, justify
        'ctrl+j 1', 'ctrl+j 2', 'ctrl+j 3', 'ctrl+j 4', 'meta+j 1', 'meta+j 2', 'meta+j 3', 'meta+j 4',   'alt+j 1', 'alt+j 2', 'alt+j 3', 'alt+j 4',  
        // page: first node last node
        'ctrl+j t', 'ctrl+j b', 'ctrl+ t',              'meta+j t', 'meta+j b', 'meta+ t',                'alt+j t', 'alt+j b', 'alt+ t',          
        // page: expand/collapse open in side
        'ctrl+j x', 'ctrl+j l', 'ctrl+j o',             'meta+j x', 'meta+j l', 'meta+j o',               'alt+j x', 'alt+j l', 'alt+j o',
        // help for javigation
        'ctrl+j h',                                     'meta+j h',                                       'alt+j h'                  
      ], (event, handler)=> { 
      console.log(handler)  
      handler = handler.replace('meta','ctrl')
      handler = handler.replace('alt', 'ctrl')
      console.log(handler)
      // try { 
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
        if(['ctrl+j e', 'ctrl+j c', 'ctrl+j r',  'ctrl+j 1', 'ctrl+j 2', 'ctrl+j 3', 'ctrl+j 4' ].includes(handler)) {
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
              case 'ctrl+j e': // expand block
                document.querySelector('.bp3-popover-content > div> ul').childNodes[3].childNodes[0].click()
              restoreLocationParametersOfTexArea(locFacts)
                break
              case 'ctrl+j c':      // collapse block
                document.querySelector('.bp3-popover-content > div> ul').childNodes[4].childNodes[0].click()                    
                restoreLocationParametersOfTexArea(locFacts)
                break
              case 'ctrl+j r':      // copy block ref
                simulateMouseClick( document.querySelector('.bp3-popover-content > div> ul').childNodes[0].childNodes[0] )            
                restoreLocationParametersOfTexArea(locFacts)
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
        if(['ctrl+j x', 'ctrl+j l', 'ctrl+j o',  ].includes(handler)) {
          var locFacts =  (event.srcElement.localName == "textarea")  ? saveLocationParametersOfTextArea(event.target) : ''
          simulateMouseClickRight(document.querySelector('.rm-title-display'))
          setTimeout(()=>{
            switch(handler) {
              case 'ctrl+j x':
                document.querySelector('.bp3-popover-content > div> ul').childNodes[2].childNodes[0].click()
                break;
              case 'ctrl+j l':
                document.querySelector('.bp3-popover-content > div> ul').childNodes[3].childNodes[0].click()
                break;          
              case 'ctrl+j o':
                document.querySelector('.bp3-popover-content > div> ul').childNodes[1].childNodes[0].click()
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
        if(handler=='ctrl+j h' ) { displayJumpNavHelp() }
      // } catch(e) {console.log(e)}
      return false
    })


  const displayJumpNavHelp = ()=> { 
   iziToast.destroy(); 
   iziToast.show({
      title: 'Roam42: Jump Nav',
      message: `
      <br/>
      <b>Activate (Meta-J)</b><br>
      <br/>
      &nbsp;&nbsp;Step 1:&nbsp;press Meta-J (Ctrl Alt CMD)<br/>
      &nbsp;&nbsp;Step 2:&nbsp;release Meta-J keys <br/>
      &nbsp;&nbsp;Step 3:&nbsp;quickly press command key <br/>
      <br/>
      <b>Page navigation commands</b><br/>
      <br/>
      &nbsp;&nbsp;T&nbsp;Top of page<br/>
      &nbsp;&nbsp;B&nbsp;Bottom of page<br/>
      &nbsp;&nbsp;X&nbsp;Expand all<br/>
      &nbsp;&nbsp;L&nbsp;Collapse all<br/>
      &nbsp;&nbsp;O&nbsp;Open this page in side bar<br/>
      <br/>

      <b>Block navigation commands</b><br/>
      <br/>
      &nbsp;&nbsp;E&nbsp;Expand all<br/>
      &nbsp;&nbsp;C&nbsp;Collapse all<br/>
      &nbsp;&nbsp;R&nbsp;Copy block ref<br/>
      <br/>


      <b>Block formatting commands</b><br/>
      <br/>
      &nbsp;&nbsp;1&nbsp;Align left<br/>
      &nbsp;&nbsp;2&nbsp;Center align<br/>
      &nbsp;&nbsp;3&nbsp;Align right<br/>
      &nbsp;&nbsp;4&nbsp;Justify<br/>

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