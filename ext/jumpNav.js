// roam42.jumpnav
(()=>{

  roam42.jumpnav = {};

  roam42.jumpnav.loadJumpNav = ()=> {
    Mousetrap.prototype.stopCallback = function () { return false }
    roam42.settings.get('jumpNavIgnore').then((jumpNavIgnore) => {
      const ignoreBindings = new Set(jumpNavIgnore ? jumpNavIgnore.split(',') : [])
      Mousetrap.bind([
            // block: expand, collapse, ref, add action
            'ctrl+j x', 'ctrl+j l', 'ctrl+j r', 'ctrl+j s', 'ctrl+j a', 'meta+j x', 'meta+j l', 'meta+j s', 'meta+j r', 'meta+j a',   'alt+j x', 'alt+j l', 'alt+j s', 'alt+j r', 'alt+j a',
          //move up one line, move down one line insert above (k), insert below(j), delete block (d)
            'ctrl+j i', 'ctrl+j u',                         'meta+j i', 'meta+j u',                           'alt+j i', 'alt+j u',
            'ctrl+j k', 'ctrl+j j', 'ctrl+j d',             'meta+j k', 'meta+j j', 'meta+j d',               'alt+j k', 'alt+j j', 'alt+j d',
            // block align left,center, right, justify
            'ctrl+j 1', 'ctrl+j 2', 'ctrl+j 3', 'ctrl+j 4', 'meta+j 1', 'meta+j 2', 'meta+j 3', 'meta+j 4',   'alt+j 1', 'alt+j 2', 'alt+j 3', 'alt+j 4',
            // headings 1,2,3
            'ctrl+j 5', 'ctrl+j 6', 'ctrl+j 7',           'meta+j 5', 'meta+j 6', 'meta+j 7',                'alt+j 5', 'alt+j 6', 'alt+j 7',   
            // page: first node last node      
            'ctrl+j t', 'ctrl+j b',              'meta+j t', 'meta+j b',                'alt+j t', 'alt+j b',
            // page: expand/collapse open in side
            'ctrl+j e', 'ctrl+j c', 'ctrl+j o','ctrl+j y', 'meta+j e', 'meta+j c', 'meta+j o', 'meta+j y',    'alt+j e', 'alt+j c', 'alt+j o', 'alt+j y',
            // page: toggle linked references, unlinked references
            'ctrl+j w', 'ctrl+j z',                         'meta+j w', 'meta+j z',                           'alt+j w', 'alt+j z',
            // page: Expand All/Collapse parents or children  in linked references, unlinked references
            'ctrl+j f', 'ctrl+j v', 'ctrl+j p',             'meta+j f', 'meta+j v', 'meta+j p',               'alt+j f', 'alt+j v', 'alt+j p',
            // help for javigation
            'ctrl+j h','ctrl+j q',                      'meta+j h', 'meta+j q',                   'alt+j h'  ,'alt+j q',
            // Side bars
            'ctrl+j n','ctrl+j m',                      'meta+j n', 'meta+j m',                   'alt+j n', 'alt+j m',
            // daily notes and lookup
            'ctrl+j ,','ctrl+j .',                      'meta+j ,', 'meta+j .',                   'alt+j ,', 'alt+j .',
            // go to parent block
            'ctrl+j g','ctrl+j ;','ctrl+j \'',  'meta+j g', 'meta+j ;', 'meta+j \'', 'alt+j g', 'alt+j ;', 'alt+j \'',
            
        ].filter(b => !ignoreBindings.has(b.replace(/^(ctrl|meta|alt)\+j /, ''))), (event, handler)=>  roam42.jumpnav.jumpCommand(event, handler) )
    });
  }

	roam42.jumpnav.jumpCommandByActiveElement = (handler)=> {
		//use this for calls from other functions without an event handler
		let event = {};
		event.target = document.activeElement;
		roam42.jumpnav.jumpCommand(event, handler);
	};

  roam42.jumpnav.jumpCommand = (event, handler)=> {
        handler = handler.replace('meta','ctrl')
        handler = handler.replace('alt', 'ctrl')

       //GOTO top/bottom of page
        if(['ctrl+j t', 'ctrl+j b'].includes(handler)) {
            var articleContent = document.querySelector(".rm-block-children").querySelectorAll('.roam-block-container');
            handler=='ctrl+j b' || handler=='˚' ? roam42.common.simulateMouseClick(articleContent[ articleContent.length-1 ].querySelector('.rm-block-text')) : roam42.common.simulateMouseClick(articleContent[0].querySelector('.rm-block-text'));
						setTimeout(()=>{ document.activeElement.setSelectionRange(document.activeElement.value.length,document.activeElement.value.length) },50);
					return false
        }

        if([ 'ctrl+j j', 'ctrl+j k', 'ctrl+j i', 'ctrl+j u', 'ctrl+j d', 'ctrl+j g', 'ctrl+j ;', 'ctrl+j \'' ].includes(handler)) {
            switch(handler)  {
              case 'ctrl+j j':  //go to next block
  							roam42.common.moveCursorToNextBlock(event.srcElement);
                break;
              case 'ctrl+j k': //go to previous block
	              roam42.common.moveCursorToPreviousBlock(event.srcElement);
                break;
              case 'ctrl+j i': // Insert block above
                roam42.common.blockInsertAbove(event.srcElement);
                break;
              case 'ctrl+j u': // Insert block below
                roam42.common.blockInsertBelow(event.srcElement);
                break;
              case 'ctrl+j d': //  delete block
                roam42.common.blockDelete(event.srcElement);
                break;
              case 'ctrl+j g': //  go to parent block
								setTimeout(async()=> {
									await roam42.common.simulateMouseClick(event.target.closest('.rm-block-children').parentElement.querySelector('.roam-block'));
									await roam42.common.sleep(50);
									let newLocation = document.activeElement;
									newLocation.selectionStart = newLocation.value.length;
									newLocation.selectionEnd   = newLocation.value.length;
								},10);
                break;
              case 'ctrl+j ;': //  previous sibling
								setTimeout(async()=> {
									try {
										await roam42.common.simulateMouseClick(event.target.closest('.roam-block-container').previousSibling.querySelector('.roam-block'));
										await roam42.common.sleep(50);
										let newLocation = document.activeElement;
										newLocation.selectionStart = newLocation.value.length;
										newLocation.selectionEnd   = newLocation.value.length;
									 } catch(e){}
								},10);
                break;
              case 'ctrl+j \'': //  next sibling
								setTimeout(async()=> {
									try{
										await roam42.common.simulateMouseClick(event.target.closest('.roam-block-container').nextSibling.querySelector('.roam-block'));
										await roam42.common.sleep(50);
										let newLocation = document.activeElement;
										newLocation.selectionStart = newLocation.value.length;
										newLocation.selectionEnd   = newLocation.value.length;
									} catch(e) {}
								},10);
                break;
            }
          return false;
        }


        // BLOCKS references: fun with blocks
        if(['ctrl+j s', 'ctrl+j r'].includes(handler)) {
					let uid = event.target.id.substring( event.target.id.length -9)
					switch(handler)  {
						case 'ctrl+j s':      // copy block ref as alias
							setTimeout(async()=>{
								var selectedText = window.getSelection().toString();
								var formatToUse = await roam42.settings.get("CopyRefAsAliasFormat");
								var outputText = '';
								if(selectedText != '' && formatToUse)
									outputText = formatToUse.replace('UID',`((${uid}))`).replace('SELECTEDTEXT',selectedText).trim();
								else if (selectedText != '')
									outputText = `"${selectedText}" [*](((${uid})))`;
								else
									outputText = `[*](((${uid})))`;
								navigator.clipboard.writeText(outputText);
								roam42.help.displayMessage(`<b>Roam<sup>42</sup></b><br/>Copied:<br/> ${outputText}`,2000);
							},10);
							break;
						case 'ctrl+j r':      // copy block ref
							navigator.clipboard.writeText(`((${uid}))`) ;
							roam42.help.displayMessage(`<b>Roam<sup>42</sup></b><br/>Copied: ((${uid}))`,2000);
							break;
					}
          return false;
        }

        // BLOCKS: fun with blocks
        if(['ctrl+j x', 'ctrl+j l', 'ctrl+j s', 'ctrl+j r', 'ctrl+j a',  'ctrl+j 1', 'ctrl+j 2', 'ctrl+j 3', 'ctrl+j 4'].includes(handler)) {
          var locFacts = roam42.common.saveLocationParametersOfTextArea(event.target);
          var parentControlNode = '';
          if( document.getElementById(locFacts.id).parentNode.parentNode.tagName == 'DIV') {
            parentControlNode =  document.getElementById(locFacts.id).parentNode;
          } else {
            //climb up higher one node in chain
            parentControlNode =  document.getElementById(locFacts.id).parentNode.parentNode;
          }
          roam42.common.simulateMouseClickRight(parentControlNode.previousSibling.childNodes[1]);
          setTimeout(()=>{
            switch(handler)  {
              case 'ctrl+j x': // expand block
                document.querySelector('.bp3-popover-content > div> ul').childNodes[3].childNodes[0].click();
                roam42.common.restoreLocationParametersOfTexArea(locFacts);
                break;
              case 'ctrl+j l':      // collapse block
                document.querySelector('.bp3-popover-content > div> ul').childNodes[4].childNodes[0].click();
                roam42.common.restoreLocationParametersOfTexArea(locFacts);
                break;
              case 'ctrl+j a':      // add reaction
                setTimeout(()=>{
                  roam42.common.simulateMouseOver(document.querySelector('.bp3-popover-content > div> ul').childNodes[5].childNodes[0].childNodes[0] );
                },50)
                return false
                break;
              case 'ctrl+j 1':     // left allign block
                roam42.common.simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[0] );
                roam42KeyboardLib.pressEsc();
                break;
              case 'ctrl+j 2':     // center allign block
                roam42.common.simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[1] );
                roam42KeyboardLib.pressEsc();
                break;
              case 'ctrl+j 3':     // right allign block
                roam42.common.simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[2] );
                roam42KeyboardLib.pressEsc();
                break;
              case 'ctrl+j 4':     // justify allign block
                roam42.common.simulateMouseClick( document.querySelector('.bp3-popover-content .flex-h-box').childNodes[3] );
                roam42KeyboardLib.pressEsc()
                break;
            }
            roam42.common.restoreLocationParametersOfTexArea(locFacts)
          },100)
          return false
        }
    
        // Headings
        if(['ctrl+j 5', 'ctrl+j 6', 'ctrl+j 7' ].includes(handler)) {
          switch(handler)  {
            case 'ctrl+j 5':     // heading 1
              roam42KeyboardLib.simulateKey(49,200,{ctrlKey:true,altKey:true}); //49 is key 1
              roam42KeyboardLib.simulateKey(49,200,{metaKey:true,altKey:true}); //49 is key 1 // mac OS                  
              break;              
            case 'ctrl+j 6':     // heading 2
              roam42KeyboardLib.simulateKey(50,200,{ctrlKey:true,altKey:true}); //49 is key 1
              roam42KeyboardLib.simulateKey(50,200,{metaKey:true,altKey:true}); //49 is key 1 // mac OS
              break;              
            case 'ctrl+j 7':     // heading 3
              roam42KeyboardLib.simulateKey(51,200,{ctrlKey:true,altKey:true}); //49 is key 1
              roam42KeyboardLib.simulateKey(51,200,{metaKey:true,altKey:true}); //49 is key 1 // mac OS
            break;                   
          }
          return false
        }
    

        // PAGE: Paging all Hitchhikers
        if(['ctrl+j e', 'ctrl+j c', 'ctrl+j o'].includes(handler)) {
          var locFacts =  (event.srcElement.localName == "textarea")  ? roam42.common.saveLocationParametersOfTextArea(event.target) : ''
          var zoomedView = 0  // 0 if page is not zoomed, 1 if zoomed
          try {
            roam42.common.simulateMouseClickRight(document.querySelector('.rm-title-display'));
          } catch(e) {
            roam42.common.simulateMouseClickRight(document.querySelectorAll('.simple-bullet-outer')[0]);
            zoomedView = 1;
          }
          setTimeout(()=>{
            switch(handler) {
              case 'ctrl+j e':
                document.querySelector('.bp3-popover-content > div> ul').childNodes[2+zoomedView].childNodes[0].click();
                break;
              case 'ctrl+j c':
                document.querySelector('.bp3-popover-content > div> ul').childNodes[3+zoomedView].childNodes[0].click();
                break;
              case 'ctrl+j o':
                document.querySelector('.bp3-popover-content > div> ul').childNodes[1+zoomedView].childNodes[0].click();
                break;
            }
            if(locFacts!='') {
              setTimeout(()=>{
                roam42.common.restoreLocationParametersOfTexArea(locFacts);
              },400)
            }
          },100)
          return false
        }

        // PAGE: Query
        if(['ctrl+j y' ].includes(handler)) {
          console.log(handler)
            switch(handler) {
              case 'ctrl+j y': //toggle parents
                document.querySelectorAll('.rm-query-title .bp3-icon-caret-down').forEach( (element)=>{
                  roam42.common.simulateMouseClick(element);
                });
                break;
            }
          return false
        }


      // PAGE: expand childern of linked and unlinked references
        if(['ctrl+j f', 'ctrl+j v', 'ctrl+j p',  ].includes(handler)) {
            switch(handler) {
              case 'ctrl+j f': //toggle parents
                document.querySelectorAll('.rm-title-arrow-wrapper .bp3-icon-caret-down').forEach( (element)=>{
                  roam42.common.simulateMouseClick(element);
                })
                break;
              case 'ctrl+j v':
                document.querySelectorAll('.rm-reference-item  .block-expand').forEach( (element)=>{
                  roam42.common.simulateMouseClickRight(element);
                  document.querySelector('.bp3-popover-content > div> ul').childNodes[3].childNodes[0].click();
                })
                break;
              case 'ctrl+j p':
                document.querySelectorAll('.rm-reference-item  .block-expand').forEach( (element)=>{
                  roam42.common.simulateMouseClickRight(element);
                  document.querySelector('.bp3-popover-content > div> ul').childNodes[4].childNodes[0].click();
                })
                break;
            }
          return false
        }


        // PAGE: toggle linked and unlinked references
        if(['ctrl+j w', 'ctrl+j z',  ].includes(handler)) {
            switch(handler) {
              case 'ctrl+j w':
                document.querySelector('.rm-reference-container .rm-caret').click();
                document.querySelector('.rm-reference-container .rm-caret').scrollIntoView();
                break;
              case 'ctrl+j z':
                document.querySelector('.rm-reference-main > div > div:nth-child(2) > div > span > span').click();
                document.querySelector('.rm-reference-main > div > div:nth-child(2) > div > span > span').scrollIntoView();
                break;
            }
          return false
        }

        if(handler=='ctrl+j q' ) { roam42.quickRef.component.toggleQuickReference(); return false; }; //roam42.help.displayHelp() };
        if(handler=='ctrl+j h' ) { roam42.quickRef.component.toggleQuickReference(); return false; };

        if(handler=='ctrl+j n' ) { setTimeout(async ()=>{roam42.common.sidebarLeftToggle()},50);  return false; };
        if(handler=='ctrl+j m' ) { roam42.common.sidebarRightToggle(); return false; };

        if(handler=='ctrl+j ,' ) { roam42.dailyNotesPopup.component.toggleVisible(); return false; };
        if(handler=='ctrl+j .' ) { roam42.typeAhead.typeAheadLookup(); return false; };

        return false

      }

})();


