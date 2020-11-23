/* globals roam42, roam42KeyboardLib, Tribute */

(() => {
  roam42.smartBlocks = {};
  roam42.smartBlocks.activeWorkflow = {}
  roam42.smartBlocks.activeWorkflow.vars = new Object();  //used to store variables during running a Workflow  
  roam42.smartBlocks.activeWorkflow.name = ''; //name of currently running workflow  
  roam42.smartBlocks.activeWorkflow.UID  = ''; //uid where the SB originates from
  roam42.smartBlocks.activeWorkflow.startingBlockTextArea = ''; //HTML element ID of starting point for the workflow action
  roam42.smartBlocks.activeWorkflow.startingBlockContents = ''; //Text contents of the block from when the SB was initaited
  roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = ''; // text from current block IN the workflow being procssed
  roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = '';            //the HTML Element ID of current point of execution
  roam42.smartBlocks.activeWorkflow.focusOnBlock = ''; // if set with <%FOCUSONBLOCK%> Will move to this block for focus mode after workflow
  roam42.smartBlocks.activeWorkflow.arrayToWrite = []; // use to output multiple blocks from a command
  roam42.smartBlocks.exclusionBlockSymbol = '!!!!****!!!!****!!!!****!!!!****!!!!****'; //used to indicate a block is not to be inserted
  
  roam42.smartBlocks.initialize = async ()=>{
    var smartBlockTrigger = ";;";
    //determine if user has created a custom trigger
    let customTrigger = await roam42.settings.get("SmartBlockTrigger");
    if(customTrigger!=null && customTrigger.length>0) {
      var newTrigger = customTrigger.replaceAll('\"','').trim();
      if(newTrigger.length>0)
        smartBlockTrigger = customTrigger;
    }
    
    roam42.smartBlocks.UserDefinedWorkflowsList = async () => {
      let sbList = await roam42.common.getBlocksReferringToThisPage("42SmartBlock");
      let results = [];
      for(var sb of sbList ) {
          var sKey =  await roam42.common.replaceAsync(sb[0].string,"#42SmartBlock", ()=>{return ''});
          results.push({  key: sKey.trim(),  value: sb[0].uid,processor:'blocks'});
      }
      return results = await roam42.common.sortObjectByKey(results);
    };
    
    roam42.smartBlocks.activeWorkflow.outputAdditionalBlock = async (blockText, reprocessBlock)=> {
      // blockText - text that should be writen out to a block
      // reprocess - will run the block through the processor one more time
      await roam42.smartBlocks.activeWorkflow.arrayToWrite.push({'text': blockText, reprocess: reprocessBlock  });
    }
    
    const insertSnippetIntoBlock = async ( textToInsert, removeIfCursor = true )=> {
      setTimeout(async()=>{
        var txtarea = document.activeElement;
        var strPos = txtarea.selectionStart;
        var front = txtarea.value.substring(0, strPos-2);
        var back = txtarea.value.substring(strPos, txtarea.value.length);
        var newValue =  front + textToInsert + back;
        var startPos = -1;
        if (removeIfCursor == false ) { //remove for static function
          startPos = newValue.search('&&&');
          newValue = newValue.replace('&&&', '');
        }    
        if (removeIfCursor) {  //remove for general isnertions
          startPos = newValue.search('<%CURSOR%>');
          newValue = newValue.replace('<%CURSOR%>','');
        }      
        if(newValue=='') newValue=' ';
        var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;      
        setValue.call(txtarea, newValue );
        var e = new Event('input', { bubbles: true });
        txtarea.dispatchEvent(e);          
        setTimeout(async()=>{
          if(startPos>=0) document.activeElement.setSelectionRange(startPos,startPos)
        },25)      
      },50)
    }
    
    const applyViewType = async (node)=>{
      //applies the document type for the bullet level
      var blockId = document.querySelector('textarea.rm-block-input').id;
      var parentControlNode = document.querySelector('textarea.rm-block-input').parentNode;  
      roam42.common.simulateMouseClickRight(
        document.querySelector('textarea.rm-block-input').closest('.flex-h-box').querySelector('.simple-bullet-outer'))
      await roam42.common.sleep(100);
      var menuItem1 = document.querySelector('.bp3-popover-content > div> ul').childNodes[9].innerText;
      var menuItem2 = document.querySelector('.bp3-popover-content > div> ul').childNodes[10].innerText;
      var menuItemToClick = false;
      switch (node['view-type']) {
        case 'bullet':
          if(menuItem1=='View as Bulleted List') 
            menuItemToClick=1;
          if(menuItem2=='View as Bulleted List') 
            menuItemToClick=2;
          break;
        case 'document':
          if(menuItem1=='View as Document') 
            menuItemToClick=1;
          if(menuItem2=='View as Document') 
            menuItemToClick=2;
          break;
        case 'numbered':
          if(menuItem1=='View as Numbered List') 
            menuItemToClick=1;
          if(menuItem2=='View as Numbered List') 
            menuItemToClick=2;
          break;
      }
      if(menuItemToClick == false) 
        await roam42KeyboardLib.pressEsc(100);
      else
        document.querySelector('.bp3-popover-content > div> ul').childNodes[8 + menuItemToClick  ].childNodes[0].click();
      await roam42.common.sleep(100);
      roam42.common.simulateMouseClick(document.getElementById(blockId));
      await roam42.common.sleep(100);
      document.activeElement.setSelectionRange(document.activeElement.textLength,document.activeElement.textLength);          
    }
    
    const outputArrayWrite = async ()=> {
        let blockInsertCounter = 0;
        if(roam42.smartBlocks.activeWorkflow.arrayToWrite.length>0) {
          for(let sb of roam42.smartBlocks.activeWorkflow.arrayToWrite) {
            var textToInsert = sb.text;
            if(sb.reprocess == true) textToInsert =  await roam42.smartBlocks.proccessBlockWithSmartness(textToInsert);
            var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            let txtarea = document.querySelector("textarea.rm-block-input");
            setValue.call(txtarea, textToInsert );
            var e = new Event('input', { bubbles: true });
            txtarea.dispatchEvent(e);  
            //PRESS ENTER 
            {
              let currentBlockId = document.querySelector('textarea.rm-block-input').id
              await roam42KeyboardLib.pressEnter(50);
              await roam42.common.sleep(100);
              if( currentBlockId == document.querySelector('textarea.rm-block-input').id ) {
                await roam42KeyboardLib.pressEnter(50);
              }
            }          
            blockInsertCounter += 1;
            if(blockInsertCounter > 9) {  //SmartBlocks coffee break to allow Roam to catch its breath
                blockInsertCounter = 0;
                await roam42.common.sleep(100);                  
            }            
          }
          //reset for next run
          await roam42.common.sleep(100);
          roam42.smartBlocks.activeWorkflow.arrayToWrite = [];
        }      
    }

    const blocksToInsert = item => {
      setTimeout(async () => {        
        //make sure we are in the textarea that started this insert (tribute menu may have closed focus on text area)
        if(document.activeElement.type !='textarea') {
          roam42.common.simulateMouseClick(document.getElementById(roam42.smartBlocks.activeTributeTextAreaId));
          await roam42.common.sleep(100);    
          var textarea = document.querySelector('textarea.rm-block-input'); 
          var newValue = textarea.value;
          var startPos = newValue.search(roam42.smartBlocks.tributeMenuTrigger);
          newValue = newValue.replace(roam42.smartBlocks.tributeMenuTrigger,'');          
          textarea.value = newValue;
          await roam42.common.sleep(100);
          textarea.setSelectionRange(startPos,startPos);
          await roam42.common.sleep(100);
        }      
        try {          
            roam42.smartBlocks.textBoxObserver.disconnect(); //stop observing blocks during insertion
            if(item.original.processor=='date')   insertSnippetIntoBlock( await roam42.dateProcessing.parseTextForDates(item.original.value).trim() );
            if(item.original.processor=='function') await item.original.value();
            if(item.original.processor=='static') insertSnippetIntoBlock( item.original.value, false );
            if(item.original.processor=='randomblock') insertSnippetIntoBlock( '((' + await roam42.common.getRandomBlock(1) + '))' );
            if(item.original.processor=='randompage') insertSnippetIntoBlock(await roam42.smartBlocks.getRandomPage());
            if(item.original.processor=='blocks') {

              var results = await roam42.common.getBlockInfoByUID( item.original.value, true );
              roam42.smartBlocks.activeWorkflow.name = item.original.key;
              roam42.smartBlocks.activeWorkflow.UID  = item.original.value;
              roam42.smartBlocks.activeWorkflow.startingBlockTextArea = document.activeElement.id;
              roam42.smartBlocks.activeWorkflow.startingBlockContents = document.activeElement.value;
              roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = '';
              roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = '';
              roam42.smartBlocks.activeWorkflow.arrayToWrite = [];
              
              //loop through array outline and insert into Roam
              if (results[0][0].children.length == 1 && !results[0][0].children[0].children) {
                //has no children, just insert text into block and safe it
                var processedText = await roam42.smartBlocks.proccessBlockWithSmartness( results[0][0].children[0].string);
                roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = processedText;
                roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = document.activeElement.id;
                if( !processedText.includes(roam42.smartBlocks.exclusionBlockSymbol) )
                  insertSnippetIntoBlock( processedText );
                await outputArrayWrite()
              } else {
                //has children, start walking through the nodes and insert them
                let blockInsertCounter = 0 //used to track how many inserts performed so we can take a coffee break at 19, to let Roam catch up
                let firstBlock = true    //handles the first block specially
                var currentOutlineLevel = 1;
                roam42.smartBlocks.activeWorkflow.focusOnBlock = '' // if set with <%FOCUSONBLOCK%> Will move to this block for focus mode after workflow
              
                var loopStructure = async (parentNode, level) => {
                  let orderedNode = await roam42.common.sortObjectsByOrder(parentNode);
                  
                  for (var i = 0; i < orderedNode.length; i++) {
                    //indent/unindent if needed
                    if (currentOutlineLevel < level) {
                      for (var inc = currentOutlineLevel; inc < level; inc++) {
                        await roam42KeyboardLib.pressTab(50);
                        currentOutlineLevel += 1;
                      }
                    } else if (currentOutlineLevel > level) {
                      for (var inc = currentOutlineLevel; inc > level; inc--) {
                        await roam42KeyboardLib.pressShiftTab(50);
                        currentOutlineLevel -= 1;
                      }
                    }
                    var n = orderedNode[i];
                    //TEXT INSERTION HAPPENING HERE
                    var insertText = n.string;
                    if (insertText == "") insertText = " "; //space needed in empty cell to maintaing indentation on empty blocks
                    roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = insertText;                
                    roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = document.activeElement.id;
                    insertText = await roam42.smartBlocks.proccessBlockWithSmartness(insertText);
                    if( !insertText.includes(roam42.smartBlocks.exclusionBlockSymbol) ) {
                      if (firstBlock==true && document.activeElement.value.length>2) {
                        firstBlock = false;
                        var txtarea = document.querySelector("textarea.rm-block-input");
                        var strPos = txtarea.selectionStart;
                        var front = txtarea.value.substring(0, strPos);
                        var back = txtarea.value.substring(strPos, txtarea.value.length);
                        var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        setValue.call(txtarea, front + insertText + back );
                        var e = new Event('input', { bubbles: true });
                        txtarea.dispatchEvent(e);                        
                      } else {
                        let txtarea = document.querySelector("textarea.rm-block-input");
                        await roam42.common.replaceAsync(insertText, /(\<\%CURSOR\%\>)/g, async (match, name)=>{
                          roam42.smartBlocks.activeWorkflow.startingBlockTextArea = document.activeElement.id; //if CURSOR, then make this the position block in end
                        }); 
                        //https://stackoverflow.com/questions/45659576/trigger-change-events-when-the-value-of-an-input-changed-programmatically-react
                        var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        setValue.call(txtarea, insertText );
                        var e = new Event('input', { bubbles: true });
                        txtarea.dispatchEvent(e);  
                      }

                      //see if heading needs to be assigned (MUST DO THIS SLOWLY)
                      if (n.heading) {
                        var ev = {};
                        ev.target = document.querySelector("textarea.rm-block-input");
                        roam42.jumpnav.jumpCommand( ev, "ctrl+j " + (Number(n.heading) + 4) ); //base is 4
                        // var id = document.querySelector("textarea.rm-block-input").id;
                        await roam42KeyboardLib.pressEsc(500);
                        // roam42.common.simulateMouseClick( document.querySelector("#" + id) );
                      }
                      
                      if(n['view-type']) 
                        await applyViewType(n);
                      
                      if (n["text-align"] && n["text-align"] != "left") {

                        var ev = {};
                        ev.target = document.querySelector("textarea.rm-block-input");
                        switch (n["text-align"]) {
                          case "center":
                            roam42.jumpnav.jumpCommand(ev, "ctrl+j 2"); //base is 4
                            break;
                          case "right":
                            roam42.jumpnav.jumpCommand(ev, "ctrl+j 3"); //base is 4
                            break;
                          case "justify":
                            roam42.jumpnav.jumpCommand(ev, "ctrl+j 4"); //base is 4
                            break;
                        }
                        // var id = document.querySelector("textarea.rm-block-input").id;
                        await roam42.common.sleep(500);
                        // roam42.common.simulateMouseClick(document.querySelector("#" + id));
                      }

                      //PRESS ENTER 
                      {
                        let currentBlockId = document.querySelector('textarea.rm-block-input').id
                        await roam42KeyboardLib.pressEnter(50);
                        await roam42.common.sleep(100);
                        if( currentBlockId == document.querySelector('textarea.rm-block-input').id ) {
                          await roam42KeyboardLib.pressEnter(50);
                        }
                      }

                      blockInsertCounter += 1;
                      if(blockInsertCounter > 9) {  //SmartBlocks coffee break to allow Roam to catch its breath
                          blockInsertCounter = 0;
                          await roam42.common.sleep(100);                  
                      }
                      
                      await outputArrayWrite()
                      
                      if (n.children) await loopStructure(n.children, level + 1);
                    } 
                  }
                }; //END of LOOPSTRUCTURE

                if (results[0][0].children){
                  await loopStructure(results[0][0].children, 1); //only process if has children
                }
                //delete last blok inserted
                await roam42.common.sleep(100);                
                roam42.common.blockDelete(document.activeElement);
                await roam42.common.sleep(100);                
                
                //Do a FOCUS on BLOCK
                if(roam42.smartBlocks.activeWorkflow.focusOnBlock!='') {
                  roam42.common.simulateMouseClick(document.getElementById(roam42.smartBlocks.activeWorkflow.focusOnBlock));   
                  await roam42.common.sleep(100);
                  let parentControlNode =  document.activeElement.parentNode;                    
                  roam42.common.simulateMouseClickRight(parentControlNode.previousSibling.childNodes[1]);
                  document.querySelector('.bp3-popover-content > div> ul').childNodes[1].childNodes[0].click();
                  await roam42.common.sleep(100);
                }
                //SET cursor location
               roam42.common.simulateMouseClick(document.getElementById(roam42.smartBlocks.activeWorkflow.startingBlockTextArea));
                setTimeout(()=>{
                  if(document.activeElement.value.includes('<%CURSOR%>'))    {
                    var newValue = document.querySelector('textarea.rm-block-input').value;
                    document.activeElement.value = '';
                    insertSnippetIntoBlock(newValue);
                  }
                  else
                    document.activeElement.setSelectionRange(document.activeElement.value.length,document.activeElement.value.length);                              
                },200);                
              }
              
            } // end IF
          //start observing mutations again
          roam42.smartBlocks.textBoxObserver.observe(document, { childList: true, subtree: true });   
        } catch(e) {
          console.log(e);
          //start observing mutations again
          roam42.smartBlocks.textBoxObserver.observe(document, { childList: true, subtree: true });  
        } 
      }, 300); // end setTimeout
      return " ";
    };
    
    roam42.smartBlocks.activeTributeTextAreaId = '';
    roam42.smartBlocks.tributeMenuTrigger = '';
    roam42.smartBlocks.scanForNewTextAreas = (mutationList, observer) => {
      var ta = document.querySelector("textarea.rm-block-input");
      if (!ta || ta.getAttribute("r42sb") != null) return; //no text area or this text box is already r42 active

      ta.setAttribute("r42sb", "active");
      
      //tribute is the autocomplete dropdown that appears in a text area
      var tribute = new Tribute({
        trigger: smartBlockTrigger,
        requireLeadingSpace: false,
        menuItemTemplate: function(item) {
          var img = '';
          switch(item.original.icon) {
            case 'hl':
              img = 'https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Fhr.png?v=1605996193520';
              break;
            case 'random':
              img = 'https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Frandom.png?v=1605996193519';
              break;
            case 'gear':
              img = 'https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Fgear.png?v=1605994815962';   
              break;
            case 'time':
              img = 'https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Fclock-time-7.png?v=1605996193660';
              break;
            default:
              img = "https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Flego3blocks.png?v=1605993127860";
          }          
          return `<img width="15px" src="${img}"> `
                  + item.string;
        },
        menuItemLimit: 25,
        values:   async (text, cb) => {
                    let results = await roam42.smartBlocks.UserDefinedWorkflowsList();
                    await roam42.smartBlocks.addCommands( results );
                    cb( results );
                  },
        lookup: "key",
        fillAttr: "value",
        selectTemplate: blocksToInsert
      });

      tribute.attach(ta);
      roam42.smartBlocks.activeTributeTextAreaId = ta.id;

      ta.addEventListener("tribute-replaced", function(e) {
        roam42.smartBlocks.tributeMenuTrigger = e.detail.context.mentionTriggerChar + e.detail.context.mentionText;
      });      
    
    }; // End of scanForNewTextAreas
    
    roam42.smartBlocks.textBoxObserver = new MutationObserver( roam42.smartBlocks.scanForNewTextAreas );
    roam42.smartBlocks.textBoxObserver.observe(document, { childList: true, subtree: true });
  } // end of INITIALIZE

  window.roam42.smartBlocks.testingReload = () => {
    try {
      roam42.smartBlocks.textBoxObserver.disconnect();
      roam42.smartBlocks.textBoxObserver = {};
      roam42.smartBlocks.initialize = {};
    } catch (e) {}
    roam42.loader.addScriptToPage( "smartBlocks", roam42.host + 'ext/smartBlocks.js');
    setTimeout(()=>roam42.smartBlocks.initialize(), 2000)
    setTimeout(()=>roam42.loader.addScriptToPage( "smartBlocks", roam42.host + 'ext/smartBlocksCmds.js'), 4000)    
  };
})();