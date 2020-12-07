/* globals roam42, roam42KeyboardLib,chrono */

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
      valueArray.push({key: 'Time 24 (42)',         icon:'time',   value: roam42.dateProcessing.getTime24Format(),     processor:'static'});
      valueArray.push({key: 'Time AM/PM (42)',      icon:'time',   value: roam42.dateProcessing.getTimeAPPMFormat(),   processor:'static'});
      valueArray.push({key: 'TODOs for Today (42)', icon:'time',   value: roam42.timemgmt.smartBlocks.todosDueToday,   processor:'function'});
      valueArray.push({key: 'TODOs Overdue (42)',   icon:'time',   value: roam42.timemgmt.smartBlocks.todosOverdue,    processor:'function'});
      valueArray.push({key: 'TODOs Overdue + DNP (42)',   icon:'time',   value: roam42.timemgmt.smartBlocks.todosOverduePlusDNP,    processor:'function'});
      valueArray.push({key: 'TODOs Undated (42)',   icon:'time',         value: roam42.timemgmt.smartBlocks.todoNotDated,  processor:'function'});
      valueArray.push({key: 'TODOs Future (42)',   icon:'time',         value: roam42.timemgmt.smartBlocks.todosFuture,    processor:'function'});
      valueArray.push({key: 'TODOs Future + DNP (42)',   icon:'time',   value: roam42.timemgmt.smartBlocks.todosFuturePlusDNP,    processor:'function'});

      valueArray.push({key: 'Block Mentions List (42)', icon:'list',   value: roam42.q.smartBlocks.blockMentions,   processor:'function'});
      valueArray.push({key: 'Search - plain text (42)', icon:'list',   value: roam42.q.smartBlocks.search,   processor:'function'});
      
      
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
      
      valueArray.push({key: 'sb42 (SmartBlock Command)',                     icon:'gear', value: '#42SmartBlock',          processor:'static'});
      valueArray.push({key: '<% BLOCKMENTIONS: %> (SmartBlock Command)',      icon:'gear', value: '<%BLOCKMENTIONS:&&&%>',  processor:'static'});
      valueArray.push({key: '<% BLOCKMENTIONSDATED: %> (SmartBlock Command)', icon:'gear', value: '<%BLOCKMENTIONSDATED:&&&%>',  processor:'static'});
      valueArray.push({key: '<% SEARCH: %> (SmartBlock Command)',             icon:'gear', value: '<%SEARCH:&&&%>',         processor:'static'});
      valueArray.push({key: '<% DATEBASISDAILYNOTES: %> (SmartBlock Command)',icon:'gear', value: '<%DATEBASISDAILYNOTES%>',processor:'static'});
      valueArray.push({key: '<% DATEBASISTODAY: %> (SmartBlock Command)',      icon:'gear', value: '<%DATEBASISTODAY%>',      processor:'static'});
      valueArray.push({key: '<% CURSOR: %> (SmartBlock Command)',             icon:'gear', value: '<%CURSOR%>',             processor:'static'});
      valueArray.push({key: '<% CLIPBOARDCOPY: %> (SmartBlock Command)',      icon:'gear', value: '<%CLIPBOARDCOPY:&&&%>',  processor:'static'});
      valueArray.push({key: '<% CLIPBOARDPASTETEXT: %> (SmartBlock Command)', icon:'gear', value: '<%CLIPBOARDPASTETEXT%>', processor:'static'});
      valueArray.push({key: '<% CONCAT: %> (SmartBlock Command)',             icon:'gear', value: '<%CONCAT:&&&%>',           processor:'static'});
      valueArray.push({key: '<% CURRENTBLOCKREF: %> (SmartBlock Command)',    icon:'gear', value: '<%CURRENTBLOCKREF%>',    processor:'static'});
      valueArray.push({key: '<% DATE: %> (SmartBlock Command)',               icon:'gear', value: '<%DATE:&&&%>',           processor:'static'});
      valueArray.push({key: '<% EXIT: %> (SmartBlock Command)',               icon:'gear', value: '<%EXIT%>',       processor:'static'});
      valueArray.push({key: '<% FOCUSONBLOCK: %> (SmartBlock Command)',       icon:'gear', value: '<%FOCUSONBLOCK%>',       processor:'static'});
      valueArray.push({key: '<% IF: %> (SmartBlock Command)',                 icon:'gear', value: '<%IF:&&&%>',             processor:'static'});      
      valueArray.push({key: '<% THEN: %> (SmartBlock Command)',               icon:'gear', value: '<%THEN:&&&%>',           processor:'static'});      
      valueArray.push({key: '<% ELSE: %> (SmartBlock Command)',               icon:'gear', value: '<%ELSE:&&&%>',           processor:'static'});      
      valueArray.push({key: '<% IFTHEN: %> (SmartBlock Command)',             icon:'gear', value: '<%IFTHEN:&&&%>',         processor:'static'});      
      valueArray.push({key: '<% IFDAYOFMONTH: %> (SmartBlock Command)',       icon:'gear', value: '<%IFDAYOFMONTH:&&&%>',   processor:'static'});
      valueArray.push({key: '<% IFDAYOFWEEK: %> (SmartBlock Command)',        icon:'gear', value: '<%IFDAYOFWEEK:&&&%>',    processor:'static'});
      valueArray.push({key: '<% INPUT: %> (SmartBlock Command)',              icon:'gear', value: '<%INPUT:&&&%>',          processor:'static'});
      valueArray.push({key: '<% JAVASCRIPT: %> (SmartBlock Command)',         icon:'gear', value: '<%JAVASCRIPT:&&&%>',     processor:'static'});            
      valueArray.push({key: '<% J: %> JavaScript Shortcut (SmartBlock Command)', icon:'gear', value: '<%J:&&&%>',     processor:'static'});            
      valueArray.push({key: '<% JAVASCRIPTASYNC: %> (SmartBlock Command)',    icon:'gear', value: '<%JAVASCRIPTASYNC:&&&%>',processor:'static'});            
      valueArray.push({key: '<% JA: %> JavaScript Async Shortcut (SmartBlock Command)', icon:'gear', value: '<%JA:&&&%>',processor:'static'});            
      valueArray.push({key: '<% NOBLOCKOUTPUT: %> (SmartBlock Command)',      icon:'gear', value: '<%NOBLOCKOUTPUT%>',      processor:'static'});
      valueArray.push({key: '<% PAGE: %> subcommand (SmartBlock Command)',    icon:'gear', value: '<%PAGE%>',               processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCK: %> (SmartBlock Command)',        icon:'gear', value: '<%RANDOMBLOCK%>',        processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCKFROM: %> (SmartBlock Command)',    icon:'gear', value: '<%RANDOMBLOCKFROM:&&&%>',processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCKMENTION: %> (SmartBlock Command)', icon:'gear', value: '<%RANDOMBLOCKMENTION:&&&%>',processor:'static'});
      valueArray.push({key: '<% RANDOMPAGE: %> (SmartBlock Command)',         icon:'gear', value: '<%RANDOMPAGE%>',         processor:'static'});
      valueArray.push({key: '<% RESOLVEBLOCKREF: %> (SmartBlock Command)',    icon:'gear', value: '<%RESOLVEBLOCKREF:&&&%>',processor:'static'});
      valueArray.push({key: '<% RESOLVEBLOCKREFATEND: %> (SmartBlock Command)',    icon:'gear', value: '<%RESOLVEBLOCKREFATEND:&&&%>',processor:'static'});
      valueArray.push({key: '<% SMARTBLOCK: %> (SmartBlock Command)',         icon:'gear', value: '<%SMARTBLOCK:&&&%>',processor:'static'});
      valueArray.push({key: '<% TIME: %> (SmartBlock Command)',               icon:'gear', value: '<%TIME%>',               processor:'static'});
      valueArray.push({key: '<% TIMEAMPM: %> (SmartBlock Command)',           icon:'gear', value: '<%TIMEAMPM%>',           processor:'static'});
      valueArray.push({key: '<% TODOTODAY: %> (SmartBlock Command)',          icon:'gear', value: '<%TODOTODAY:20&&&%>',    processor:'static'});
      valueArray.push({key: '<% TODOOVERDUE: %> (SmartBlock Command)',        icon:'gear', value: '<%TODOOVERDUE:20&&&%>',  processor:'static'});
      valueArray.push({key: '<% TODOOVERDUEDNP: %> (SmartBlock Command)',     icon:'gear', value: '<%TODOOVERDUEDNP:20&&&%>',  processor:'static'});
      valueArray.push({key: '<% TODOFUTURE: %> (SmartBlock Command)',         icon:'gear', value: '<%TODOFUTURE:20&&&%>',  processor:'static'});
      valueArray.push({key: '<% TODOFUTUREDNP: %> (SmartBlock Command)',      icon:'gear', value: '<%TODOFUTUREDNP:20&&&%>',  processor:'static'});
      valueArray.push({key: '<% TODOUNDATED: %> (SmartBlock Command)',        icon:'gear', value: '<%TODOUNDATED:20&&&%>',  processor:'static'});
      valueArray.push({key: '<% GET: %> (SmartBlock Command)',                icon:'gear', value: '<%GET:&&&%>',            processor:'static'});
      valueArray.push({key: '<% SET: %> (SmartBlock Command)',                icon:'gear', value: '<%SET:&&&%>',            processor:'static'});
      valueArray.push({key: '<% CLEARVARS: %> (SmartBlock Command)',          icon:'gear', value: '<%CLEARVARS%>',          processor:'static'});
      roam42.smartBlocks.customCommands.forEach(v => valueArray.push(v));
    };

    roam42.smartBlocks.proccessBlockWithSmartness = async (textToProcess)=>{
      let ifCommand = null;  // null if no IF, true process THEN, false process ELSE
      let exitCommandFound = false; //exit command included
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLEARVARS\%\>)/g, async (match, name)=>{
        console.log('CLEARVARS')
        roam42.smartBlocks.activeWorkflow.vars = new Object();    
        return '';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%GET:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%GET:','').replace('%>','');
        var vValue = roam42.smartBlocks.activeWorkflow.vars[textToProcess];
        if(vValue==undefined) vValue = `--> Variable ${textToProcess} not SET <--`
        return vValue;   
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
          return match + ''; //no results, return origional
        else
          return queryResults[0][0].string;
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFTHEN:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%IFTHEN:','').replace('%>','');
        try {
          if(eval(textToProcess)==false) 
            return roam42.smartBlocks.exclusionBlockSymbol;
        } catch(e) { return '<%IF%> Failed with error: ' + e }
        return '';   
      });        
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%J:)/g, async (match, name)=>{
        return  match.replace('<%J:','<%JAVASCRIPT:')
      });      
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%JA:)/g, async (match, name)=>{
        return  match.replace('<%JA:','<%JAVASCRIPTASYNC:')
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
        var commandToProcess = match.replace('<%INPUT:','').replace('%>','');
        if(commandToProcess.includes('\%\%')) {
          var splitPrompt = commandToProcess.split('\%\%');
          return prompt( splitPrompt[0],  splitPrompt[1] )
        } else {
          return prompt(commandToProcess.toString());        
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
       var commandToProcess = match.replace('<%DATE:','').replace('%>','').trim();
       return roam42.dateProcessing.parseTextForDates(commandToProcess).trim();
      });

      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%DATEBASISDAILYNOTES)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        roam42.smartBlocks.activeWorkflow.vars['DATEBASISDAILYNOTES'] = true;
        return roam42.smartBlocks.exclusionBlockSymbol;   
      });

      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%DATEBASISTODAY)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        roam42.smartBlocks.activeWorkflow.vars['DATEBASISDAILYNOTES'] = false;
        return roam42.smartBlocks.exclusionBlockSymbol; 
      });

      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFWEEK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%IFDAYOFWEEK:','').replace('%>','').trim();
        var day = String(chrono.parseDate(roam42.dateProcessing.parseTextForDates('today')).getDay());
        if(day=='0') day='7'; //sunday
        if(commandToProcess.replaceAll(' ','').split(',').includes(day)) 
          return ''; //
        else 
          return roam42.smartBlocks.exclusionBlockSymbol
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFMONTH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%IFDAYOFMONTH:','').replace('%>','').trim();
        var day = String(chrono.parseDate(roam42.dateProcessing.parseTextForDates('today')).getDate());;
        if(commandToProcess.replaceAll(' ','').split(',').includes( day ) ) 
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
      // process CUSTOM commands
      for (const { value, processor } of roam42.smartBlocks.customCommands) {
        textToProcess = await roam42.common.replaceAsync(textToProcess, new RegExp(value, 'g'), processor); 
      }
      //ALWAYS at end of process
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%NOBLOCKOUTPUT\%\>)/g, async (match, name)=>{
        return roam42.smartBlocks.exclusionBlockSymbol;
      }); 
      //test for EXIT command
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%EXIT\%\>)/g, async (match, name)=>{
        exitCommandFound=true;
        return roam42.smartBlocks.exitBlockCommand; 
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
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFTHEN:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%IFTHEN:','').replace('%>','');
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
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RESOLVEBLOCKREFATEND:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var uid = match.replace('<%RESOLVEBLOCKREFATEND:','').replace('%>','').replace('((','').replace('))','').trim();
        var queryResults = await roam42.common.getBlockInfoByUID(uid);
        if(queryResults==null) 
          return match + ''; //no results, return origional
        else
          return queryResults[0][0].string;
      });      
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CONCAT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
       var commandToProcess = match.replace('<%CONCAT:','').replace('%>','');
       commandToProcess = await roam42.common.replaceAsync(commandToProcess, /\\,/g, async (match, name)=>'&&comma;;');
       commandToProcess = await roam42.common.replaceAsync(commandToProcess, /,/g,   async (match, name)=>'');
       commandToProcess = await roam42.common.replaceAsync(commandToProcess, /\&\&comma\;\;/g,   async (match, name)=>',');
       return commandToProcess;
      });      
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%SET:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%SET:','').replace('%>','');
        roam42.smartBlocks.activeWorkflow.vars[textToProcess.substring(0,textToProcess.search(','))] = textToProcess.substring(textToProcess.search(',')+1,);
        return '';   
      });

      //MULTIBLOCK commands
      //shoud not be run if the block is flagged for nooutput
      if(!textToProcess.includes(roam42.smartBlocks.exclusionBlockSymbol)) { 
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%BLOCKMENTIONS:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandParameters = match.replace('<%BLOCKMENTIONS:','').replace('%>','');
          return await roam42.q.smartBlocks.commands.blockMentions(commandParameters, textToProcess);
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%BLOCKMENTIONSDATED:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandParameters = match.replace('<%BLOCKMENTIONSDATED:','').replace('%>','');
          return await roam42.q.smartBlocks.commands.blockMentionsDated(commandParameters, textToProcess);
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%SEARCH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandParameters = match.replace('<%SEARCH:','').replace('%>','');
          return await roam42.q.smartBlocks.commands.search(commandParameters, textToProcess);
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOTODAY:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%TODOTODAY:','').replace('%>','').trim();
          return await roam42.timemgmt.smartBlocks.commands.todosDueToday(commandToProcess);
        });      
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOOVERDUE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%TODOOVERDUE:','').replace('%>','').trim();
          return await roam42.timemgmt.smartBlocks.commands.todosOverdue(commandToProcess,false);
        });            
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOOVERDUEDNP:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%TODOOVERDUEDNP:','').replace('%>','').trim();
          return await roam42.timemgmt.smartBlocks.commands.todosOverdue(commandToProcess,true);
        });                  
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOFUTURE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%TODOFUTURE:','').replace('%>','').trim();
          return await roam42.timemgmt.smartBlocks.commands.todosFuture(commandToProcess,false);
        });            
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOFUTUREDNP:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%TODOFUTUREDNP:','').replace('%>','').trim();
          return await roam42.timemgmt.smartBlocks.commands.todosFuture(commandToProcess,true);
        });                  
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOUNDATED:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%TODOUNDATED:','').replace('%>','').trim();
          return await roam42.timemgmt.smartBlocks.commands.todoNotDated(commandToProcess,true);
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%SMARTBLOCK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%SMARTBLOCK:','').replace('%>','').trim();
          var userCommands = await roam42.smartBlocks.UserDefinedWorkflowsList();
          var sbCommand = userCommands.find(e => e.key == commandToProcess);
          if(sbCommand==undefined){
            roam42.help.displayMessage(commandToProcess + ' is not a valid Roam42 SmartBlock',3000);
            return '---- SmartBlock:  **' + commandToProcess + '**  does not exist. ----'
          } else {
            await roam42.smartBlocks.sbBomb({original: sbCommand},true);
            return roam42.smartBlocks.exclusionBlockSymbol
          }
        });
      } //if for MULTIBLOCK
        
      if(textToProcess.includes(roam42.smartBlocks.exclusionBlockSymbol))
        if(exitCommandFound)
          return roam42.smartBlocks.exclusionBlockSymbol && roam42.smartBlocks.exitBlockCommand; //skip this block and exit
        else
          return roam42.smartBlocks.exclusionBlockSymbol; //skip this block 
      return textToProcess; //resert new text
    }
    
  // window.roam42.smartBlocks.testingReloadCmds = () => {
  //   roam42.loader.addScriptToPage( "smartBlocks", roam42.host + 'ext/smartBlocksCmds.js');
  // };
    
})();
