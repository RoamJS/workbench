/* globals roam42, roam42KeyboardLib */

(() => {
    roam42.smartBlocks.addCommands =  async (valueArray)=> {
      //DATE COMMANDS
      valueArray.push({key: 'today (42)',      icon:'time',     value: 'today',     processor:'date'});
      valueArray.push({key: 'tomorrow (42)',   icon:'time',    value: 'tomorrow', processor:'date'});      
      valueArray.push({key: 'yesterday (42)',  icon:'time',     value: 'yesterday', processor:'date'});      
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(  (e)=>{
        valueArray.push({key: `${e} (42)`,       icon:'time',   value: `${e}`,      processor:'date'});
        valueArray.push({key: `Last ${e} (42)`,  icon:'time',   value: `Last ${e}`, processor:'date'});
        valueArray.push({key: `Next ${e} (42)`,  icon:'time',   value: `Next ${e}`, processor:'date'});
      });
      valueArray.push({key: 'Time 24 (42)',      icon:'time',    value: roam42.dateProcessing.getTime24Format(),      processor:'static'});
      valueArray.push({key: 'Time AM/PM (42)',    icon:'time',   value: roam42.dateProcessing.getTimeAPPMFormat(),      processor:'static'});
      valueArray.push({key: 'Serendipity - R a n d o m Block (42)', value: '', icon:'random',    processor:'randomblock'});
      valueArray.push({key: 'Serendipity - R a n d o m Page (42)', value: '',  icon:'random',   processor:'randompage'});
      valueArray.push({key: 'Horizontal Line (42)',   value: ':hiccup [:hr]',  icon:'hl',   processor:'static'});
      valueArray.push({key: 'Workflow Starter (SmartBlock function)', icon:'gear', processor:'function', value: async ()=>{
                        var workflowName = prompt("What is the name of the new workflow?")
                        roam42.common.setEmptyNodeValue( document.querySelector("textarea"), "#42SmartBlock " + workflowName );            
                        await roam42.common.sleep(200);
                        await roam42KeyboardLib.pressEnter();
                        await roam42.common.sleep(200);
                        await roam42KeyboardLib.pressTab();
                      }});
      valueArray.push({key: 'sb42 (SmartBlock function)',                     icon:'gear', value: '#42SmartBlock',          processor:'static'});
      valueArray.push({key: '<% CURSOR %> (SmartBlock function)',             icon:'gear', value: '<%CURSOR%>',             processor:'static'});
      valueArray.push({key: '<% CLIPBOARDCOPY %> (SmartBlock function)',      icon:'gear', value: '<%CLIPBOARDCOPY:&&&%>',  processor:'static'});
      valueArray.push({key: '<% CLIPBOARDPASTETEXT %> (SmartBlock function)', icon:'gear', value: '<%CLIPBOARDPASTETEXT%>', processor:'static'});
      valueArray.push({key: '<% CURRENTBLOCKREF %> (SmartBlock function)',    icon:'gear', value: '<%CURRENTBLOCKREF%>',    processor:'static'});
      valueArray.push({key: '<% DATE %> (SmartBlock function)',               icon:'gear', value: '<%DATE:&&&%>',           processor:'static'});
      valueArray.push({key: '<% FOCUSONBLOCK %> (SmartBlock function)',       icon:'gear', value: '<%FOCUSONBLOCK%>',       processor:'static'});
      valueArray.push({key: '<% IF %> (SmartBlock function)',                 icon:'gear', value: '<%IF:&&&%>',             processor:'static'});      
      valueArray.push({key: '<% THEN %> (SmartBlock function)',               icon:'gear', value: '<%THEN:&&&%>',           processor:'static'});      
      valueArray.push({key: '<% ELSE %> (SmartBlock function)',               icon:'gear', value: '<%ELSE:&&&%>',           processor:'static'});      
      valueArray.push({key: '<% IFDAYOFMONTH %> (SmartBlock function)',       icon:'gear', value: '<%IFDAYOFMONTH:&&&%>',   processor:'static'});
      valueArray.push({key: '<% IFDAYOFWEEK %> (SmartBlock function)',        icon:'gear', value: '<%IFDAYOFWEEK:&&&%>',    processor:'static'});
      valueArray.push({key: '<% INPUT %> (SmartBlock function)',              icon:'gear', value: '<%INPUT:&&&%>',          processor:'static'});
      valueArray.push({key: '<% JAVASCRIPT %> (SmartBlock function)',         icon:'gear', value: '<%JAVASCRIPT:&&&%>',     processor:'static'});            
      valueArray.push({key: '<% JAVASCRIPTASYNC %> (SmartBlock function)',    icon:'gear', value: '<%JAVASCRIPTASYNC:&&&%>',processor:'static'});            
      valueArray.push({key: '<% NOBLOCKOUTPUT %> (SmartBlock function)',      icon:'gear', value: '<%NOBLOCKOUTPUT%>',      processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCK %> (SmartBlock function)',        icon:'gear', value: '<%RANDOMBLOCK%>',        processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCKFROM %> (SmartBlock function)',    icon:'gear', value: '<%RANDOMBLOCKFROM:&&&%>',processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCKMENTION %> (SmartBlock function)', icon:'gear', value: '<%RANDOMBLOCKMENTION:&&&%>',processor:'static'});
      valueArray.push({key: '<% RANDOMPAGE %> (SmartBlock function)',         icon:'gear', value: '<%RANDOMPAGE%>',         processor:'static'});
      valueArray.push({key: '<% RESOLVEBLOCKREF %> (SmartBlock function)',    icon:'gear', value: '<%RESOLVEBLOCKREF:&&&%>',processor:'static'});
      valueArray.push({key: '<% TIME %> (SmartBlock function)',               icon:'gear', value: '<%TIME%>',               processor:'static'});
      valueArray.push({key: '<% TIMEAMPM %> (SmartBlock function)',           icon:'gear', value: '<%TIMEAMPM%>',           processor:'static'});
      valueArray.push({key: '<% GET %> (SmartBlock function)',                icon:'gear', value: '<%GET:&&&%>',            processor:'static'});
      valueArray.push({key: '<% SET %> (SmartBlock function)',                icon:'gear', value: '<%SET:&&&%>',            processor:'static'});
      valueArray.push({key: '<% CLEARVARS %> (SmartBlock function)',          icon:'gear', value: '<%CLEARVARS%>',          processor:'static'});
    };  

    roam42.smartBlocks.proccessBlockWithSmartness = async (textToProcess)=>{
      let ifCommand = null;  // null if no IF, true process THEN, false process ELSE
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLEARVARS\%\>)/g, async (match, name)=>{
        roam42.smartBlocks.activeWorkflow.vars = new Object();    
        return '';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CURRENTBLOCKREF\%\>)/g, async (match, name)=>{
        let tID = await roam42.common.asyncQuerySelector(document,'textarea.rm-block-input');
        let UID = tID.id;
        let results = '((' + UID.substring( UID.length -9) + '))';
        return results;
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RESOLVEBLOCKREF:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var uid = match.replace('<%RESOLVEBLOCKREF:','').replace('%>','').replace('((','').replace('))','').trim();
        var queryResults = await roam42.common.getBlockInfoByUID(uid);
        if(queryResults==null) 
          return match + '--> Block Ref is not valid <--'; //no results, return origional
        else
          return queryResults[0][0].string;
      });      
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%GET:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%GET:','').replace('%>','');
        var vValue = roam42.smartBlocks.activeWorkflow.vars[textToProcess];
        if(vValue==undefined) vValue = `--> Variable ${textToProcess} not SET <--`
        return vValue;   
      });      
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%JAVASCRIPT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var scriptToRun = match.replace('<%JAVASCRIPT:','').replace('%>','').trim();
        if(scriptToRun.substring(0,13)=='```javascript')
          scriptToRun = scriptToRun.substring(13,scriptToRun.length-3);   
        var results = new Function(scriptToRun.toString())();
        return results;
      });           
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%JAVASCRIPTASYNC:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var scriptToRun = match.replace('<%JAVASCRIPTASYNC:','').replace('%>','').trim();
        if(scriptToRun.substring(0,13)=='```javascript')
          scriptToRun = scriptToRun.substring(13,scriptToRun.length-3); 
        var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        var results = new AsyncFunction(scriptToRun.toString())();
        return results;
      });           
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%INPUT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%INPUT:','').replace('%>','');
        if(textToProcess.includes('\%\%')) {
          var splitPrompt = textToProcess.split('\%\%');
          return prompt( splitPrompt[0],  splitPrompt[1] )
        } else {
          return prompt(textToProcess.toString());        
        }
      });
      //Random block command
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCK\%\>)/g, async (match, name)=>{
        return '((' + await roam42.common.getRandomBlock(1) + '))';
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return roam42.smartBlocks.getRandomBlocks(textToProcess);
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCKFROM:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return '((' + await roam42.smartBlocks.getRandomBlocksFrom(match) + '))';
      });       
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCKMENTION:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return '((' + await roam42.smartBlocks.getRandomBlocksMention(match) + '))';
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMPAGE\%\>)/g, async (match, name)=>{
        return await roam42.smartBlocks.getRandomPage();
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIME\%\>)/g, async (match, name)=>{
        return roam42.dateProcessing.getTime24Format()
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIMEAMPM\%\>)/g, async (match, name)=>{
        return roam42.dateProcessing.getTimeAPPMFormat();
      });           
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%DATE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%DATE:','').replace('%>','').trim();
        return roam42.dateProcessing.parseTextForDates(textToProcess).trim();
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFWEEK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%IFDAYOFWEEK:','').replace('%>','').trim();
        var day = String(new Date().getDay());
        if(day=='0') day='7'; //sunday
        if(textToProcess.replaceAll(' ','').split(',').includes(day)) 
          return ''; //
        else 
          return roam42.smartBlocks.exclusionBlockSymbol
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFMONTH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%IFDAYOFMONTH:','').replace('%>','').trim();
        if(textToProcess.replaceAll(' ','').split(',').includes( String(new Date().getDate()) ) ) 
          return ''; //
        else 
          return roam42.smartBlocks.exclusionBlockSymbol
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLIPBOARDCOPY:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToWrite = match.replace('<%CLIPBOARDCOPY:','').replace('%>','');
        await navigator.clipboard.writeText( textToWrite );
        return ' ';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLIPBOARDPASTETEXT\%\>)/g, async (match, name)=>{
        var cb = await navigator.clipboard.readText();
        await roam42.common.sleep(50);        
        return cb;
      });      

      //ALWAYS at end of process
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%NOBLOCKOUTPUT\%\>)/g, async (match, name)=>{
        return roam42.smartBlocks.exclusionBlockSymbol;
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IF:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%IF:','').replace('%>','');
        try {
          if(eval(textToProcess)) 
            ifCommand = true;
          else
            ifCommand = false;
        } catch(e) { return '<%IF%> Failed with error: ' + e }
        return '';   
      });      
      if(ifCommand!=null){
        if(ifCommand==true){
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%ELSE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{return ''});          
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%THEN:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            return match.replace('<%THEN:','').replace('%>','');
          });
        } else {
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%THEN:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{return ''});
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%ELSE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            return match.replace('<%ELSE:','').replace('%>','');
          });
        }
      }      
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%FOCUSONBLOCK\%\>)/g, async (match, name)=>{
        //if assigned, will zoom to this location later
        roam42.smartBlocks.focusOnBlock = document.activeElement.id; //if CURSOR, then make this the position block in end
        return ''; 
      });       
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%SET:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%SET:','').replace('%>','');
        roam42.smartBlocks.activeWorkflow.vars[textToProcess.substring(0,textToProcess.search(','))] = textToProcess.substring(textToProcess.search(',')+1,);
        return '';   
      });    
      if(textToProcess.includes(roam42.smartBlocks.exclusionBlockSymbol)) return roam42.smartBlocks.exclusionBlockSymbol; //skip this block
      return textToProcess; //resert new text
    }
    
  window.roam42.smartBlocks.testingReloadCmds = () => {
    roam42.loader.addScriptToPage( "smartBlocks", roam42.host + 'ext/smartBlocksCmds.js');
  };
    
})();
