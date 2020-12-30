/* globals roam42, roam42KeyboardLib, Tribute */

(() => {
  roam42.smartBlocks = {};
  roam42.smartBlocks.activeWorkflow = {};
  roam42.sb = (roam42.smartBlocks.activeWorkflow);
  roam42.smartBlocks.activeWorkflow.vars = new Object();  //used to store variables during running a Workflow
  roam42.smartBlocks.activeWorkflow.name = ''; //name of currently running workflow
  roam42.smartBlocks.activeWorkflow.UID  = ''; //uid where the SB originates from
  roam42.smartBlocks.activeWorkflow.startingBlockTextArea = ''; //HTML element ID of starting point for the workflow action
  roam42.smartBlocks.activeWorkflow.startingBlockContents = ''; //Text contents of the block from when the SB was initaited
  roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = ''; // text from current block IN the workflow being procssed
  roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = '';            //the HTML Element ID of current point of execution
  roam42.smartBlocks.activeWorkflow.focusOnBlock = ''; // if set with <%FOCUSONBLOCK%> Will move to this block for focus mode after workflow
  roam42.smartBlocks.activeWorkflow.arrayToWrite = []; // use to output multiple blocks from a command
  roam42.smartBlocks.activeWorkflow.onBlockExitCode = ''; //code executed at end of block
  roam42.smartBlocks.activeWorkflow.forceDelayAferNewBlock = 0; //used by CURRENTBLOCKREF to force a delay after enter so roam can sync changes from  previouis enter
  roam42.smartBlocks.exclusionBlockSymbol = 'NOUTNOUTNOUTNOUT'; //used to indicate a block is not to be inserted
  roam42.smartBlocks.replaceFirstBlock    = 'SBRPLCSBRPLCSBRPLC'; //used to indicate a block is not to be inserted
  roam42.smartBlocks.customCommands = [];
  roam42.smartBlocks.SmartBlockPopupHelpEnabled = true;

  roam42.smartBlocks.initialize = async ()=>{
    var smartBlockTrigger = "jj";
    //determine if user has created a custom trigger
    let customTrigger = await roam42.settings.get("SmartBlockTrigger");
    if(customTrigger!=null && customTrigger.length>0) {
      var newTrigger = customTrigger.replaceAll('\"','').trim();
      if(newTrigger.length>0)
        smartBlockTrigger = customTrigger;
    }
    var popupHelpEnabled = await roam42.settings.get("SmartBlockPopupHelp")
    if(popupHelpEnabled!=null & popupHelpEnabled=='disabled')
      roam42.smartBlocks.SmartBlockPopupHelpEnabled = false;


    roam42.smartBlocks.UserDefinedWorkflowsList = async (hideWorkflow=false) => {
      let sbList = await roam42.common.getBlocksReferringToThisPage("42SmartBlock");
      let results = [];
      for(var sb of sbList ) {
        try {
          var sKey  = sb[0].string.replace('#42SmartBlock','');
          var bHide = sKey.search('<%HIDE%>')>0 ? true : false;
          sKey = sKey.replace('<%HIDE%>','').trim();
          sKey = sKey.replace('<%NOCURSOR%>','').trim();
          if(sKey.trim()!='') {
            if(hideWorkflow==false || hideWorkflow==true && bHide == false)
              results.push({  key: sKey.trim(),  value: sb[0].uid, processor:'blocks', fullCommand: sb[0].string});
          }
        } catch(e) {}
      }
      return results = await roam42.common.sortObjectByKey(results);
    };

    roam42.smartBlocks.activeWorkflow.outputAdditionalBlock = async (blockText, reprocessBlock)=> {
      // blockText - text that should be writen out to a block
      // reprocess - will run the block through the processor one more time
      await roam42.smartBlocks.activeWorkflow.arrayToWrite.push({'text': blockText, reprocess: reprocessBlock  });
    }

    const insertSnippetIntoBlock = async ( textToInsert, removeIfCursor = true, startPosistionOffset=2 )=> {
      console.log('removeIfCursor',removeIfCursor)
      setTimeout(async()=>{
        var txtarea = document.activeElement;
        var strPos = txtarea.selectionStart;
        var front = txtarea.value.substring(0, strPos-startPosistionOffset);
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
        console.log('new value set')
        var e = new Event('input', { bubbles: true });
        txtarea.dispatchEvent(e);
        if(startPos>=0) { 
          await roam42.common.sleep(700);
          document.activeElement.setSelectionRange(startPos,startPos);
        }
      },50)
    }
    roam42.smartBlocks.insertSnippetIntoBlock = insertSnippetIntoBlock;

    const applyViewType = async (node)=>{    //applies the document type for the bullet level
      try {
        //test if the current view-type is the same as the applied type
        var currentBlock = document.querySelector('textarea.rm-block-input');
        try {
          var currentViewType = currentBlock.parentElement.parentElement.querySelector('.rm-bullet').className;
          if(node['view-type']=='bullet'   && currentViewType=='rm-bullet ') return; //trying to set to a bullet, but already a bullet
          if(node['view-type']=='document' && currentViewType=='rm-bullet  opacity-none') return; //trying to set to a document, but already a document
          if(node['view-type']=='numbered' && currentViewType=='rm-bullet  rm-bullet--numbered') return; //trying to set to a number, but already a number
        } catch(e) {}
        var blockId = currentBlock.id;
        var parentControlNode = currentBlock.parentNode;
        roam42.common.simulateMouseClickRight(
          currentBlock.closest('.rm-block-main').querySelector('.rm-bullet'))
        await roam42.common.sleep(500);
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
      } catch(e) {
        console.log('View type change failed with error',e)
      }
      roam42.common.simulateMouseClick(document.getElementById(blockId));
      await roam42.common.sleep(100);
      document.activeElement.setSelectionRange(document.activeElement.textLength,document.activeElement.textLength);

    }

    roam42.smartBlocks.outputArrayWrite = async ()=> {
      let countOfblocksToInsert = roam42.smartBlocks.activeWorkflow.arrayToWrite.length
      if(countOfblocksToInsert>0) {
        let blocksInserted = 1;
        for(let sb of roam42.smartBlocks.activeWorkflow.arrayToWrite) {
          var textToInsert = sb.text;
          if(sb.reprocess == true) textToInsert =  await roam42.smartBlocks.proccessBlockWithSmartness(textToInsert);
          var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          let txtarea = document.querySelector("textarea.rm-block-input");
          setValue.call(txtarea, textToInsert );
          var e = new Event('input', { bubbles: true });
          txtarea.dispatchEvent(e);
          //PRESS ENTER
          if(blocksInserted!=countOfblocksToInsert){
            blocksInserted+=1;
            let currentBlockId = document.querySelector('textarea.rm-block-input').id
            await roam42KeyboardLib.pressEnter(50);
            await roam42.common.sleep(100);
            if( currentBlockId == document.querySelector('textarea.rm-block-input').id ) {
              await roam42KeyboardLib.pressEnter(50);
            }
          }
          if(blocksInserted % 10 == 0) //SmartBlocks coffee break to allow Roam to catch its breath
              await roam42.common.sleep(100);
        }
        //reset for next run
        await roam42.common.sleep(100);
        roam42.smartBlocks.activeWorkflow.arrayToWrite = [];
      }
    }

    const blocksToInsert = item => {
      //cleanup
      setTimeout(async () => {
        roam42.smartBlocks.sbBomb(item);
      }, 300); // end setTimeout
      return ' ';
    };

    roam42.smartBlocks.sbBomb = async (item, skipCursorRelocation=false, sbCallingSB=false)=>{
        //make sure we are in the textarea that started this insert (tribute menu may have closed focus on text area)
        var removeTributeTriggerSpacer=2;
        //by default we don't use date references from the daily note pages.
        if(sbCallingSB==false)
          roam42.smartBlocks.activeWorkflow.vars['DATEBASISMETHOD'] = null;            //sets the date to override today

        if(document.activeElement.type !='textarea') {
          roam42.common.simulateMouseClick(document.getElementById(roam42.smartBlocks.activeTributeTextAreaId));
          await roam42.common.sleep(100);
          var textarea = document.querySelector('textarea.rm-block-input');
          var newValue = textarea.value;
          var startPos = newValue.search(roam42.smartBlocks.tributeMenuTrigger);
          newValue = newValue.replace(roam42.smartBlocks.tributeMenuTrigger,'');
          var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          setValue.call(textarea,newValue);
          var e = new Event('input', { bubbles: true });
          textarea.dispatchEvent(e);
          await roam42.common.sleep(100);
          textarea.setSelectionRange(startPos,startPos);
          await roam42.common.sleep(100);
          removeTributeTriggerSpacer=0;
        }
        try {
            roam42.smartBlocks.textBoxObserver.disconnect(); //stop observing blocks during insertion
              if(item.original.help && roam42.smartBlocks.SmartBlockPopupHelpEnabled){
                roam42.help.displayMessage('<img height="22px" src="https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Fgear.png?v=1605994815962">'+
                                           ' ' + item.original.help,20000);
              }
            var currentSmartBlockCommand = item.original.fullCommand + '';

            if(skipCursorRelocation==false) {
              roam42.smartBlocks.activeWorkflow.startingBlockTextArea = document.activeElement.id;
              roam42.smartBlocks.activeWorkflow.startingBlockContents = document.activeElement.value;
            }
            if(item.original.processor=='date')   insertSnippetIntoBlock( await roam42.dateProcessing.parseTextForDates(item.original.value).trim() );
            if(item.original.processor=='function') await item.original.value();
            if(item.original.processor=='static') insertSnippetIntoBlock( item.original.value, false );
            if(item.original.processor=='randomblock') insertSnippetIntoBlock( '((' + await roam42.common.getRandomBlock(1) + '))' );
            if(item.original.processor=='randompage') insertSnippetIntoBlock(await roam42.smartBlocks.getRandomPage());
            if(item.original.processor=='blocks') {

              var results = await roam42.common.getBlockInfoByUID( item.original.value, true );
              roam42.smartBlocks.activeWorkflow.name = item.original.key;
              roam42.smartBlocks.activeWorkflow.UID  = item.original.value;
              roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = '';
              roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = '';
              roam42.smartBlocks.activeWorkflow.arrayToWrite = [];
              roam42.smartBlocks.activeWorkflow.onBlockExitCode = '';
              roam42.smartBlocks.exitTriggered = false; // if true will force the workflow to stop

              //loop through array outline and insert into Roam
              if (results[0][0].children.length == 1 && !results[0][0].children[0].children) {
                //has no children, just insert text into block and safe it
                var processedText = await roam42.smartBlocks.proccessBlockWithSmartness( results[0][0].children[0].string);
                processedText = await roam42.smartBlocks.processBlockAfterBlockInserted(processedText);
                roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = processedText;
                roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = document.activeElement.id;
                if( !processedText.includes(roam42.smartBlocks.exclusionBlockSymbol) )
                  if(!processedText.includes(roam42.smartBlocks.replaceFirstBlock)) {
                    await insertSnippetIntoBlock( processedText, true, removeTributeTriggerSpacer );
                    await roam42.smartBlocks.processBlockAfterBlockInserted(processedText);
                    await roam42.smartBlocks.processBlockOnBlockExit();
                  }
                await roam42.smartBlocks.outputArrayWrite();
              } else {
                //has children, start walking through the nodes and insert them
                let blockInsertCounter = 0 //used to track how many inserts performed so we can take a coffee break at 19, to let Roam catch up
                let firstBlock = true    //handles the first block specially
                var currentOutlineLevel = 1;
                roam42.smartBlocks.activeWorkflow.focusOnBlock = '' // if set with <%FOCUSONBLOCK%> Will move to this block for focus mode after workflow

                // LOOPSTRUCTURE ---------------
                var loopStructure = async (parentNode, level) => {

                  if(roam42.smartBlocks.exitTriggered==true) return;
                  let orderedNode = await roam42.common.sortObjectsByOrder(parentNode);

                  for (var i = 0; i < orderedNode.length; i++) {
                    var n = orderedNode[i];
                    //TEXT INSERTION HAPPENING HERE
                    var insertText = n.string;
                    if (insertText == "") insertText = " "; //space needed in empty cell to maintaing indentation on empty blocks
                    roam42.smartBlocks.activeWorkflow.currentSmartBlockBlockBeingProcessed = insertText;
                    roam42.smartBlocks.activeWorkflow.currentSmartBlockTextArea = document.activeElement.id;

                    if(roam42.smartBlocks.activeWorkflow.forceDelayAferNewBlock>0) { //used by CURRENTREFBLOCK
                      await roam42.common.sleep(roam42.smartBlocks.activeWorkflow.forceDelayAferNewBlock);
                      roam42.smartBlocks.activeWorkflow.forceDelayAferNewBlock=0;
                    }

                    if(insertText.match(/\<\%(\s*[\S\s]*?)\%\>/)) //process if it has a command
                      insertText = await roam42.smartBlocks.proccessBlockWithSmartness(insertText);

                    //test for EXIT command
                    if(roam42.smartBlocks.exitTriggered == true) return;

                    if( !insertText.includes(roam42.smartBlocks.exclusionBlockSymbol) ) {
                      if (firstBlock==true && document.activeElement.value.length>2) {
                        firstBlock = false;
                        insertText = await roam42.smartBlocks.processBlockAfterBlockInserted(insertText);
                        var txtarea = document.querySelector("textarea.rm-block-input");
                        var strPos = txtarea.selectionStart;
                        var front = txtarea.value.substring(0, strPos);
                        var back = txtarea.value.substring(strPos, txtarea.value.length);
                        var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        setValue.call(txtarea, front + insertText + back );
                        var e = new Event('input', { bubbles: true });
                        txtarea.dispatchEvent(e);
                        await roam42.common.sleep(100);
                        await roam42.smartBlocks.processBlockOnBlockExit()
                      } else {
                        if (firstBlock==false) {
                          let currentBlockId = document.querySelector('textarea.rm-block-input').id
                          await roam42KeyboardLib.pressEnter(150);
                          if(currentBlockId==document.querySelector('textarea.rm-block-input').id ) await roam42KeyboardLib.pressEnter(50);

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
                        }
                        firstBlock=false;

                        insertText = await roam42.smartBlocks.processBlockAfterBlockInserted(insertText);

                        //https://stackoverflow.com/questions/45659576/trigger-change-events-when-the-value-of-an-input-changed-programmatically-react
                        let txtarea = document.querySelector("textarea.rm-block-input");
                        var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        setValue.call(txtarea, insertText );
                        var e = new Event('input', { bubbles: true });
                        txtarea.dispatchEvent(e);

                      }

                      if (n.heading) { // apply HEADINGS
                        // windows and chrome os
                        await roam42KeyboardLib.simulateKey(Number(n.heading)+48,200,{ctrlKey:true,altKey:true}); //49 is key 1
                        // mac OS
                        await roam42KeyboardLib.simulateKey(Number(n.heading)+48,200,{metaKey:true,altKey:true}); //49 is key 1
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
                        await roam42.common.sleep(1000);
                      }

                      if(roam42.smartBlocks.exitTriggered==true) return;

                      blockInsertCounter += 1;
                      if(blockInsertCounter > 9) {  //SmartBlocks coffee break to allow Roam to catch its breath
                          blockInsertCounter = 0;
                          await roam42.common.sleep(100);
                      }

                      await roam42.smartBlocks.outputArrayWrite()

                      await roam42.smartBlocks.processBlockOnBlockExit()

                      if(roam42.smartBlocks.exitTriggered==true) return;

                      if (n.children) await loopStructure(n.children, level + 1);
                    }  //end of exclsionBlockSymbol test

                  }
                }; //END of LOOPSTRUCTURE

                if (results[0][0].children){
                  await loopStructure(results[0][0].children, 1); //only process if has children
                }

               }

                //END of processing of blocks in loop
                // FOCUS on block
                if(roam42.smartBlocks.activeWorkflow.focusOnBlock!='' && skipCursorRelocation==false)
                  await roam42KeyboardLib.simulateKey(79,200,{ctrlKey:true})

              //SET cursor location
               if(skipCursorRelocation==false) {
                roam42.common.simulateMouseClick(document.getElementById(roam42.smartBlocks.activeWorkflow.startingBlockTextArea));
                  setTimeout(()=>{
                    try {
                      if(document.activeElement.value.includes('<%CURSOR%>')) {
                        var newValue = document.querySelector('textarea.rm-block-input').value;
                        document.activeElement.value = '';
                        insertSnippetIntoBlock(newValue);
                      }
                      else
                        document.activeElement.setSelectionRange(document.activeElement.value.length,document.activeElement.value.length);
                    } catch(e) {}
                  },200);
               }
               // NOCURSOR - dont show a curosr after it runs
               if(currentSmartBlockCommand.includes('<%NOCURSOR%>')){
                  setTimeout(async ()=>{ //let other commands process before exiting block edit
                    await roam42.common.sleep(500);
                    await roam42KeyboardLib.pressEsc(50);
                    await roam42KeyboardLib.pressEsc(50);
                  },400);
               }
            } // end IF


          if(sbCallingSB==false)
            roam42.smartBlocks.activeWorkflow.vars['DATEBASISMETHOD'] = null;            //sets the date to override today
          //start observing mutations again
          roam42.smartBlocks.textBoxObserver.observe(document, { childList: true, subtree: true });
        } catch(e) {
          console.log(e);
          //start observing mutations again
          roam42.smartBlocks.textBoxObserver.observe(document, { childList: true, subtree: true });
        }
      return " ";
    };



    roam42.smartBlocks.buttonClickHandler = async (target)=>{
      if(target.tagName=='BUTTON') {
        var block = target.closest('.roam-block');
        if (!block) {
          return;
        }
        var blockInfo = (await roam42.common.getBlockInfoByUID(block.id.substring( block.id.length -9)))[0][0].string;
        if(blockInfo.includes( target.textContent + ':42SmartBlock:' )) {
          const regex = new RegExp(`{{((${target.textContent})(:42SmartBlock:)(.*?))}}`);
          var commandInBlock = blockInfo.match(regex); //param 2=workflowname, 3 params
          var params = commandInBlock[1].split(':')
          var userCommands = await roam42.smartBlocks.UserDefinedWorkflowsList();
          var sbCommand = userCommands.find(e => e.key == params[2]);
          if(sbCommand==undefined){
            //no valid SB, highlight text
            roam42.help.displayMessage('<b>' + params[0] + '</b> - Cannot find this #42SmartBlock',3000);
          } else {
          //valid SB, remove it andrun it
          var removeButton = true;
          try {
            for(var v of params[3].split(',')) {
              var newVar = v.split('=');
              if(newVar.length)
                roam42.smartBlocks.activeWorkflow.vars[newVar[0]] = newVar[1];
              if(newVar[0]=='42RemoveButton' && newVar[1]=='false')
                removeButton = false;
            }
          } catch(e) {};
          var results = await roam42.common.getBlockInfoByUID( sbCommand.value, true );
          var paddingSpaces = '';
          var paddingLength = 0;
          //test if SB has children, if not, the insertion needs to be handled differently
          if (results[0][0].children.length == 1 && !results[0][0].children[0].children) {
            paddingSpaces = '  ';
            paddingLength = 2;
          }
          await roam42.common.simulateMouseClick(block);
          await roam42.common.sleep(100);
          var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          var cursorLocation = null;
          if(removeButton == true) {
            cursorLocation = blockInfo.search(commandInBlock[0]) + paddingLength;
            setValue.call(document.activeElement, blockInfo.replace(commandInBlock[0],paddingSpaces));
          }
          else {
            cursorLocation = blockInfo.search(commandInBlock[0]) + commandInBlock[0].length + paddingLength;
            setValue.call(document.activeElement, blockInfo.replace(commandInBlock[0],commandInBlock[0] + paddingSpaces));
          }
          var e = new Event('input', { bubbles: true });
          document.activeElement.dispatchEvent(e);
          await roam42.common.sleep(200);
          document.activeElement.setSelectionRange(cursorLocation,cursorLocation);
          await roam42.common.sleep(100);
          await blocksToInsert({original: sbCommand});
          }
        }
      }

    }

    roam42.smartBlocks.buttonClick = async (e) =>{
      await roam42.smartBlocks.buttonClickHandler(e.target);
      return ' ';
    }

    document.addEventListener("click",roam42.smartBlocks.buttonClick,false);

    roam42.smartBlocks.activeTributeTextAreaId = '';
    roam42.smartBlocks.tributeMenuTrigger = '';
    roam42.smartBlocks.scanForNewTextAreas = (mutationList, observer) => {

      var ta = document.querySelector("textarea.rm-block-input");
      if (!ta || ta.getAttribute("r42sb") != null) return; //no text area or this text box is already r42 active

      document.querySelectorAll('.tribute-container').forEach(d=>d.remove());//cleanup old menu still in memory

      ta.setAttribute("r42sb", "active");

      //tribute is the autocomplete dropdown that appears in a text area
      var tribute = new Tribute({
        trigger: smartBlockTrigger,
        requireLeadingSpace: false,
        itemClass: 'tribute-item',
        menuItemTemplate: function(item) {
          var img = '';
          switch(item.original.icon) {
            case 'hl':
              img = 'https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Fhr.png?v=1605996193520';
              break;
            case 'random':
              img = 'https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Frandom.png?v=1605996193519';
              break;
            case 'list':
              img = 'https://cdn.glitch.com/463389d2-59ec-4fdc-b3c8-674037563d0e%2Flist.png?v=1606820752757';
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
                    let results = await roam42.smartBlocks.UserDefinedWorkflowsList(true);
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
      document.removeEventListener("click",roam42.smartBlocks.buttonClick,false);
      roam42.smartBlocks.textBoxObserver.disconnect();
      roam42.smartBlocks.textBoxObserver = {};
      roam42.smartBlocks.initialize = {};
    } catch (e) {}
    roam42.loader.addScriptToPage( "smartBlocks", roam42.host + 'ext/smartBlocks.js');
    setTimeout(()=>roam42.loader.addScriptToPage( 'smartBlocksCmd',roam42.host + 'ext/smartBlocksCmd.js'), 3000);
    setTimeout(()=>roam42.smartBlocks.initialize(), 5000);
    setTimeout(()=>roam42.timemgmt.testingReload(), 4000);
  };
})();