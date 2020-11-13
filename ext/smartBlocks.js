/* globals roam42, roam42KeyboardLib, Tribute */

(() => {
  roam42.loader.addScriptToPage( "tributeJS", "https://cdnjs.cloudflare.com/ajax/libs/tributejs/5.1.3/tribute.min.js" );
  roam42.loader.addCSSToPage( "tributeCSS", "https://trillian.glitch.me/tribute.css");

  roam42.smartBlocks = {};  
  roam42.smartBlocks.initialize = ()=>{
    const exclusionBlockSymbol = '!!%%**!!%%**!!%%**!!%%**'; //used to indicate a block is not to be inserted

    const addStaticValues =  async (valueArray)=> {
      //DATE COMMANDS
      valueArray.push({key: 'today (42)',           value: 'today',     processor:'date'});
      valueArray.push({key: 'yesterday (42)',       value: 'yesterday', processor:'date'});      
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(  (e)=>{
        valueArray.push({key: `${e} (42)`,          value: `${e}`,      processor:'date'});
        valueArray.push({key: `Last ${e} (42)`,     value: `Last ${e}`, processor:'date'});
        valueArray.push({key: `Next ${e} (42)`,     value: `Next ${e}`, processor:'date'});
      });
      valueArray.push({key: 'yesterday (42)',       value: 'yesterday', processor:'date'});
      valueArray.push({key: 'Time (42)', value: getTime24Format(),     processor:'static'});
      //SmartBlock COMMANDS
      valueArray.push({key: 'Horizontal Line (42)',   value: ':hiccup [:hr]',     processor:'static'});
      valueArray.push({key: '<% INPUT %> (SmartBlock function)',           value: '<%INPUT:%>',                     processor:'static'});
      valueArray.push({key: '<% RESOLVEBLOCKREF %> (SmartBlock function)', value: '<%RESOLVEBLOCKREF:%>', processor:'static'});
      valueArray.push({key: '<% DATE %> (SmartBlock function)',          value: '<%DATE:%>',         processor:'static'});
      valueArray.push({key: '<% IFDAYOFWEEK %> (SmartBlock function)',  value: '<%IFDAYOFWEEK:%>',         processor:'static'});
      valueArray.push({key: '<% IFDAYOFMONTH %> (SmartBlock function)', value: '<%IFDAYOFMONTH:%>',       processor:'static'});
      valueArray.push({key: '<% TIME %> (SmartBlock function)',         value: '<%TIME%>',         processor:'static'});
      valueArray.push({key: '<% TIMEAMPM %> (SmartBlock function)',     value: '<%TIMEAMPM%>',         processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCK %> (SmartBlock function)',  value: '<%RANDOMBLOCK%>',         processor:'static'});
      valueArray.push({key: '<% JAVASCRIPT %> (SmartBlock function)',   value: '<%JAVASCRIPT:%>',         processor:'static'});            
    };

    const sortObjectByKey = async o => {
      return o.sort(function(a, b) {
        return a.key.localeCompare(b.key);
      });
    };

    const sortObjectsByOrder = async o => {
      return o.sort(function(a, b) {
        return a.order - b.order;
      });
    };  

    const valuesForLookup = async (text, cb) => {
      //graab all blocks with #SmartBlock
      let sb = await roam42.common.getBlocksReferringToThisPage(
        "42SmartBlock"
      );
      let results = sb.flatMap(sb => {
        if (sb[0].children)
          // if has children, add it into returned list key: is text, value is UID of block
          return {
            key: sb[0].string.replace("#42SmartBlock", "").trim(),
            value: sb[0].uid,
            processor: 'blocks'
          };
        else return [];
      });
      results = await sortObjectByKey(results);
      addStaticValues( results );
      cb( results );
    };

    const insertSnippetIntoBlock = async (textToInsert)=> {
      var ta = document.querySelector("textarea");
      ta.setSelectionRange(ta.selectionStart - 2, ta.selectionStart + 1); //this deals with extra space added
      roam42.common.insertAtCaret( ta.id, textToInsert );
      setTimeout(()=>ta.setSelectionRange(ta.selectionStart + 1, ta.selectionStart + 2),200); //this deals with extra space added      
    }
    
    const getTime24Format = ()=> {
      var dt = new Date();
      return dt.getHours() + ':' + dt.getMinutes().toString().padStart(2, '0');
    }
    
    //time
    //JAVASCRIPTEVAL

    const proccessBlockWithSmartness = async (textToProcess)=>{
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RESOLVEBLOCKREF:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var uid = match.replace('<%RESOLVEBLOCKREF:','').replace('%>','').replace('((','').replace('))','').trim();
        var queryResults = await roam42.common.getBlockInfoByUID(uid);
        if(queryResults==null) 
          return match + '--> Block Ref is not valid <--'; //no results, return origional
        else
          return queryResults[0][0].string;
      });        
      //Evaluating javascript. Pattern: <%JAVASCRIPT:  NLP text %>
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%JAVASCRIPT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var scriptToRun = match.replace('<%JAVASCRIPT:','').replace('%>','').trim();
        var results = new Function(scriptToRun.toString())();
        return results;
      });           
      //process input commands Pattern: <%input:  NLP text %>  use a %% for prompt then default value
      textToProcess = textToProcess.replaceAll(/(\<\%INPUT:)(\s*[\S\s]*?)(\%\>)/g, (match, p1, p2, p3)=>{
        if(p2.includes('\%\%')) {
          var splitPrompt = p2.split('\%\%');
          return prompt( splitPrompt[0].trim(),  splitPrompt[1].trim() )
        } else {
          return prompt(p2.toString());        
        }
      });
      //Random block command
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCK\%\>)/g, async (match, name)=>{
        return '((' + await roam42.common.getRandomBlock(1) + '))'
      });          
      //Time in 24 hour block command
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIME\%\>)/g, async (match, name)=>{
        return getTime24Format()
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIMEAMPM\%\>)/g, async (match, name)=>{
          var dt = new Date();
          var hours = dt.getHours();
          var minutes = dt.getMinutes();
          var ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          minutes = minutes < 10 ? '0'+minutes : minutes;
          var strTime = hours + ':' + minutes + ' ' + ampm;
          return strTime;
      });           
      //process inline dates. Pattern: <%date:  NLP text %>
      textToProcess = textToProcess.replaceAll(/(\<\%DATE:)(\s*[\S\s]*?)(\%\>)/g, (match, p1, p2, p3)=>{
        return roam42.dateProcessing.parseTextForDates(p2).trim();
      });
      //process inline dates. Pattern: <%IFDAYOFWEEK: day number (comma separatedlist) %>
      textToProcess = textToProcess.replaceAll(/(\<\%IFDAYOFWEEK:)(\s*[\S\s]*?)(\%\>)/g, (match, p1, p2, p3)=>{
        if(p2.replaceAll(' ','').split(',').includes( String(new Date().getDay()) ) ) 
          return ''; //
        else 
          return exclusionBlockSymbol
      });
      //If today is the day of the month. Pattern: <%IFDAYOFMONTH: day number (comma separatedlist) %>
      textToProcess = textToProcess.replaceAll(/(\<\%IFDAYOFMONTH:)(\s*[\S\s]*?)(\%\>)/g, (match, p1, p2, p3)=>{
        if(p2.replaceAll(' ','').split(',').includes( String(new Date().getDate()) ) ) 
          return ''; //
        else 
          return exclusionBlockSymbol
      });
      //RANDOM block
      //resolve block
      if(textToProcess.includes(exclusionBlockSymbol)) return exclusionBlockSymbol; //skip this block
      return textToProcess; //resert new text
    }

    const blocksToInsert = item => {
      setTimeout(async () => {        
        if(item.original.processor=='date')   insertSnippetIntoBlock( await roam42.dateProcessing.parseTextForDates(item.original.value).trim() );
        if(item.original.processor=='static') insertSnippetIntoBlock( item.original.value );
        if(item.original.processor=='randomblock') insertSnippetIntoBlock( '((' + await roam42.common.getRandomBlock(1) + '))' );

        if(item.original.processor=='blocks') {
          var results = await roam42.common.getBlockInfoByUID( item.original.value, true );
          // console.log(results)

          //loop through array outline and insert into Roam
          roam42.test=results;

          if (results[0][0].children.length == 1 && !results[0][0].children[0].children) {
            // console.log('single line')
            //has no children, just insert text into block and safe it
            var processedText = await proccessBlockWithSmartness( results[0][0].children[0].string);
            if( !processedText.includes(exclusionBlockSymbol) )
              insertSnippetIntoBlock( processedText );
          } else {
            // console.log('multiple line')
            //has children, start walking through the nodes and insert them
            var currentOutlineLevel = 1;

            var loopStructure = async (parentNode, level) => {
              let orderedNode = await sortObjectsByOrder(parentNode);
              for (var i = 0; i < orderedNode.length; i++) {
                //indent/unindent if needed
                if (currentOutlineLevel < level) {
                  for (var inc = currentOutlineLevel; inc < level; inc++) {
                    await roam42KeyboardLib.delay(50);
                    await roam42KeyboardLib.pressTab();
                    currentOutlineLevel += 1;
                  }
                } else if (currentOutlineLevel > level) {
                  for (var inc = currentOutlineLevel; inc > level; inc--) {
                    await roam42KeyboardLib.delay(50);
                    await roam42KeyboardLib.pressShiftTab();
                    currentOutlineLevel -= 1;
                  }
                }
                var n = orderedNode[i];
                //TEXT INSERTION HAPPENING HERE
                var insertText = n.string;
                if (insertText == "") insertText = " "; //space needed in empty cell to maintaing indentation on empty blocks
                insertText = await proccessBlockWithSmartness(insertText);
                if( !insertText.includes(exclusionBlockSymbol) ) {
                  roam42.common.setEmptyNodeValue( document.querySelector("textarea"), insertText );            
                  //roam42.common.insertAtCaret( document.querySelector("textarea").id, insertText );
                  if (insertText == " ") {
                    //if had to insert space, remove it
                    await roam42.common.sleep(50);
                    document.querySelector("textarea").setSelectionRange(0, 2); //now remove the spae before next line
                  }
                  //see if heading needs to be assigned
                  if (n.heading) {
                    var ev = {};
                    ev.target = document.querySelector("textarea");
                    roam42.jumpnav.jumpCommand( ev, "ctrl+j " + (Number(n.heading) + 4) ); //base is 4
                    var id = document.querySelector("textarea").id;
                    await roam42KeyboardLib.pressEsc(400);
                    roam42.common.simulateMouseClick( document.querySelector("#" + id) );
                  }
                  if (n["text-align"] && n["text-align"] != "left") {
                    var ev = {};
                    ev.target = document.querySelector("textarea");
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
                    var id = document.querySelector("textarea").id;
                    await roam42KeyboardLib.pressEsc(400);
                    roam42.common.simulateMouseClick(document.querySelector("#" + id));
                  }
                  await roam42KeyboardLib.delay(50);
                  await roam42KeyboardLib.pressEnter();
                  if (/query|table|kanban|embed/.test(insertText))
                    await roam42KeyboardLib.delay(200); //add extra delay for rendeing
                  if (n.children) await loopStructure(n.children, level + 1);
                } 
              }
            }; //END of LOOPSTRUCTURE

            await roam42.common.sleep(100);
            var ta = document.querySelector("textarea");
            ta.setSelectionRange(ta.selectionStart - 2, ta.selectionStart + 1); //this deals with extra space added
            if (results[0][0].children){
              // console.log(results[0][0].children)
              await loopStructure(results[0][0].children, 1); //only process if has children
            }
          }
        } // end IF
      }, 10); // end setTimeout

      return " ";
    };
    
    roam42.smartBlocks.scanForNewTextAreas = (mutationList, observer) => {
      var ta = document.querySelector("textarea");
      if (!ta || ta.getAttribute("r42sb") != null) return; //no text area or this text box is already r42 active

      ta.setAttribute("r42sb", "active");

      //tribute is the autocomplete dropdown that appears in a text area
      var tribute = new Tribute({
        trigger: ";;",
        menuItemTemplate: function(item) {
          return "" + item.string;
        },
        values: valuesForLookup,
        lookup: "key",
        fillAttr: "value",
        selectTemplate: blocksToInsert
      });

      tribute.attach(ta);
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
    setTimeout(()=>roam42.smartBlocks.initialize(), 1000)
  };
})();
