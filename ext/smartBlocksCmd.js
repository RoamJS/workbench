/* globals roam42, roam42KeyboardLib,chrono, iziToast, dayjs */

(() => {
    roam42.smartBlocks.addCommands =  async (valueArray)=> {
      //DATE COMMANDS
      valueArray.push({key: 'today (42)',      icon:'time',     value: 'today',     processor:'date'});
      valueArray.push({key: 'tomorrow (42)',   icon:'time',    value: 'tomorrow', processor:'date'});
      valueArray.push({key: 'yesterday (42)',  icon:'time',     value: 'yesterday', processor:'date'});
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(  (e)=>{
        valueArray.push({key: `This ${e} (42)`,  icon:'time',   value: `This ${e}`,      processor:'date'});
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
      valueArray.push({key: 'Workflow (SmartBlock Starter)', icon:'gear', processor:'function', value: async ()=>{
                        var workflowName = prompt("What is the name of the new workflow?")
                        roam42.common.setEmptyNodeValue( document.querySelector("textarea"), "#42SmartBlock " + workflowName );
                        await roam42.common.sleep(200);
                        await roam42KeyboardLib.pressEnter();
                        await roam42.common.sleep(200);
                        await roam42KeyboardLib.pressTab();
                      }});
      valueArray.push({key: 'Button (SmartBlock Starter)', icon:'gear', processor:'function', value: async ()=>{
                        var caption    = prompt("What is the name of the caption of the button?")
                        if(!caption) return;
                        var smartBlock = prompt("What is the name of the SmartBlock?")
                        if(!smartBlock) return;
                        roam42.smartBlocks.insertSnippetIntoBlock(`{{${caption}:42SmartBlock:${smartBlock}}}`);
                      }, help:'<b>SmartBlock Button</b><br/><br/>Button Syntax:<br>{{caption:42SmartBlock:Name of SmartBlock}}:<br>{{caption:42SmartBlock:Name of SmartBlock:var1=value1}}'});

      valueArray.push({key: '42sb (SmartBlock Command)',                     icon:'gear', value: '#42SmartBlock',          processor:'static'});
      valueArray.push({key: '<% BLOCKMENTIONS: %> (SmartBlock Command)',      icon:'gear', value: '<%BLOCKMENTIONS:&&&%>',  processor:'static',
                             help:'<b>BLOCKMENTIONS</b><br/>Returns list of blocks mentioned<br/><br/>1: Max blocks to return<br/>2: Page or Tag Name<br/>3: (opt) filtering '});
      valueArray.push({key: '<% BLOCKMENTIONSDATED: %> (SmartBlock Command)', icon:'gear', value: '<%BLOCKMENTIONSDATED:&&&%>',  processor:'static',
                             help:'<b>BLOCKMENTIONSDATED</b><br/>Returns list of blocks mentioned<br/> based on date range<br/>' +
                                   '<br/>1: Max blocks to return<br/>2: Page or Tag Name<br/>3: Start Date<br/>4. End Date<br/>5: Sort (ASC,DESC,NONE)<br/>6: (opt) filtering '});
      valueArray.push({key: '<% BREADCRUMBS: %> (SmartBlock Command)',      icon:'gear', value: '<%BREADCRUMBS:&&&%>',  processor:'static',
                             help:'<b>BREADCRUMBS</b><br/>Returns a list of<br/> parent block refs to a <br/>given block ref<br/><br/>1: Block reference<br/>2: Separator used between blok references'});
      valueArray.push({key: '<% SEARCH: %> (SmartBlock Command)',             icon:'gear', value: '<%SEARCH:&&&%>',         processor:'static',
                             help:'<b>SEARCH</b><br/>Search all blocks for string of text<br/><br/>1: Max blocks to return<br/>2: String for search (case-sensitive)<br/>3: (opt) filtering '});
      valueArray.push({key: '<% DATEBASIS: %> (SmartBlock Command)',icon:'gear', value: '<%DATEBASIS:&&&%>',processor:'static',
                             help:'<b>DATEBASIS</b><br/>Time machine mode<br/><br/>1: Date basis for date commands<br/>DNP for daily page<br/>NLP for other dates<br/>Defaults to TODAY at start of<br/>each workflow '});
      valueArray.push({key: '<% CURSOR %> (SmartBlock Command)',             icon:'gear', value: '<%CURSOR%>',             processor:'static',
                             help:'<b>CURSOR</b><br/>Defines where cursor<br/> should be located after<br/> the workflow completes.'});
      valueArray.push({key: '<% CLIPBOARDCOPY: %> (SmartBlock Command)',      icon:'gear', value: '<%CLIPBOARDCOPY:&&&%>',  processor:'static',
                             help:'<b>CLIPBOARDCOPY</b><br/>Writes text to the clipboard<br/><br/>1: text'});
      valueArray.push({key: '<% CLIPBOARDPASTETEXT %> (SmartBlock Command)',      icon:'gear', value: '<%CLIPBOARDPASTETEXT%>',  processor:'static',
                             help:'<b>CLIPBOARDPASTETEXT</b><br/>Pastes the from the clipboard'});
      valueArray.push({key: '<% NOCURSOR %> (SmartBlock Command)', icon:'gear', value: '<%NOCURSOR%>', processor:'static',
                             help:'<b>NOCURSOR</b><br/>Only use in #42SmartBlock<br/>definition. Use to exit out of<br/>edit mode after SmartBlock runs.'});
      valueArray.push({key: '<% CONCAT: %> (SmartBlock Command)',             icon:'gear', value: '<%CONCAT:&&&%>',         processor:'static',
                             help:'<b>CONCAT</b><br/>Combines a comma separated list<br/> of strings into one string<br/><br/>1: comma separated list'});
      valueArray.push({key: '<% CURRENTBLOCKREF: %> (SmartBlock Command)',    icon:'gear', value: '<%CURRENTBLOCKREF:&&&%>',    processor:'static',
                             help:'<b>CURRENTBLOCKREF</b><br/>Sets a variable to the <br/>block UID for the current block<br/><br/>1. Variable name'});
      valueArray.push({key: '<% CURRENTPAGENAME: %> (SmartBlock Command)',    icon:'gear', value: '<%CURRENTPAGENAME%>',    processor:'static',
                             help:'<b>CURRENTPAGENAME</b><br/>Returns the current page name the smart block is running in.'});
      valueArray.push({key: '<% DATE: %> dd (SmartBlock Command)',               icon:'gear', value: '<%DATE:&&&%>',           processor:'static',
                             help:'<b>DATE</b><br/>Returns a Roam formatted<br/>dated page reference.<br/><br/>1: NLP expression<br/>2: optional: format for returned <br/>date, example: YYYY-MM-DD'});
      valueArray.push({key: '<% EXIT %> (SmartBlock Command)',               icon:'gear', value: '<%EXIT%>',               processor:'static',
                             help:'<b>EXIT</b><br/>Stops the workflow from<br/>going further after<br/>completing the current block'});
      valueArray.push({key: '<% FOCUSONBLOCK %> (SmartBlock Command)',       icon:'gear', value: '<%FOCUSONBLOCK%>',       processor:'static',
                             help:'<b>FOCUSONBLOCK</b><br/>Will focus on the<br/>current block after the<br/>workflow finshes. '});
      valueArray.push({key: '<% INDENT %> (SmartBlock Command)',       icon:'gear', value: '<%INDENT%>',       processor:'static',
                       help:'<b>INDENT</b><br/>Indents the current block if <br/>indentation can be done at current block. '});
      valueArray.push({key: '<% UNINDENT %> (SmartBlock Command)',       icon:'gear', value: '<%UNINDENT%>',       processor:'static',
                       help:'<b>UNINDENT</b><br/>Unidents at the current block if <br/>it can be done at current block. '});
      valueArray.push({key: '<% HIDE: %> (SmartBlock Command)',      icon:'gear', value: '<%HIDE%>',      processor:'static',
                             help:'<b>HIDE</b><br/>Directive used with SmartBlock<br/> parent block to indicate this block is<br/> hidden from menu'});
      valueArray.push({key: '<% IF: %> (SmartBlock Command)',                 icon:'gear', value: '<%IF:&&&%>',             processor:'static',
                             help:'<b>IF</b><br/>Evaluates a condition for true.<br/>Use with THEN & ELSE.<br/><br/>1: Logic to be evaluated<br/>'});
      valueArray.push({key: '<% THEN: %> (SmartBlock Command)',               icon:'gear', value: '<%THEN:&&&%>',           processor:'static',
                             help:'<b>THEN</b><br/>Used with IF when<br/>IF is true<br/><br/>1: Text to be inserted'});
      valueArray.push({key: '<% ELSE: %> (SmartBlock Command)',               icon:'gear', value: '<%ELSE:&&&%>',           processor:'static',
                             help:'<b>ELSE</b><br/>Used with IF when<br/>IF is false<br/><br/>1: Text to be inserted'});
      valueArray.push({key: '<% IFTRUE: %> (SmartBlock Command)',             icon:'gear', value: '<%IFTRUE:&&&%>',         processor:'static',
                             help:'<b>IFTRUE</b><br/>Test if parameter is true<br/>If true, the block<br/> is output<br/><br/>1: Logic to be evaluated'});
      valueArray.push({key: '<% IFDAYOFMONTH: %> (SmartBlock Command)',       icon:'gear', value: '<%IFDAYOFMONTH:&&&%>',   processor:'static',
                             help:'<b>IFDAYOFMONTH</b><br/>Compares today\'s date<br/><br/><br/>1: Comma separated list of days<br/> Example: 5,10,15'});
      valueArray.push({key: '<% IFDAYOFWEEK: %> (SmartBlock Command)',        icon:'gear', value: '<%IFDAYOFWEEK:&&&%>',    processor:'static',
                             help:'<b>IFDAYOFWEEK</b><br/>Compares today\'s date<br/><br/><br/>1: Comma separated list<br/>of days of week<br/>1 is Monday<br/> 7 is Sunday <br/> Example: 1,3'});
      valueArray.push({key: '<% INPUT: %> (SmartBlock Command)',              icon:'gear', value: '<%INPUT:&&&%>',          processor:'static',
                             help:'<b>INPUT</b><br/>Prompts user for input<br/>which will then be<br/>inserted into block<br/><br/>1: text to display in prompt. <br/>Add a @@ followed by <br/>text for a default value<br/>'});
      valueArray.push({key: '<% JAVASCRIPT: %> (SmartBlock Command)',         icon:'gear', value: '<%JAVASCRIPT:&&&%>',     processor:'static',
                             help:'<b>JAVASCRIPT</b><br/>JavaScript code to run<br/><br/>1. JavaScipt code'});
      valueArray.push({key: '<% J: %> JavaScript Shortcut (SmartBlock Command)', icon:'gear', value: '<%J:&&&%>',           processor:'static',
                             help:'<b>J</b><br/>JavaScript code to run<br/><br/>1. JavaScipt code'});
      valueArray.push({key: '<% JAVASCRIPTASYNC: %> (SmartBlock Command)',    icon:'gear', value: '<%JAVASCRIPTASYNC:&&&%>',processor:'static',
                             help:'<b>JAVASCRIPTASYNC</b><br/>Asynchronous JavaScript code to run<br/><br/>1. JavaScipt code'});
      valueArray.push({key: '<% JA: %> JavaScript Async Shortcut (SmartBlock Command)', icon:'gear', value: '<%JA:&&&%>',   processor:'static',
                             help:'<b>JA</b><br/>Asynchronous JavaScript code to run<br/><br/>1. JavaScipt code'});
      valueArray.push({key: '<% NOTIFICATION: %> (SmartBlock Command)', icon:'gear', value: '<%NOTIFICATION:&&&%>',         processor:'static',
                             help:'<b>NOTIFICATION</b><br/>Displays notification window<br/><br/>1: Seconds<br/>2: Message'});
      valueArray.push({key: '<% NOBLOCKOUTPUT: %> (SmartBlock Command)',      icon:'gear', value: '<%NOBLOCKOUTPUT%>',      processor:'static',
                             help:'<b>NOBLOCKOUTPUT</b><br/>No content output from a block'});
      valueArray.push({key: '<% ONBLOCKEXIT: %> (SmartBlock Command)',    icon:'gear', value: '<%ONBLOCKEXIT:&&&%>',processor:'static',
                             help:'<b>ONBLOCKEXIT</b><br/>Asynchronous JavaScript code to <br/>run after a block has been<br/>processed by Roam42<br/>1. JavaScipt code<br/>Return value not processed'});
      valueArray.push({key: '<% PAGE %> subcommand (SmartBlock Command)',    icon:'gear', value: '<%PAGE%>',               processor:'static',
                             help:'<b>PAGE</b><br/>For commands that support<br/>the PAGE directive, a <br/>page reference is outpu'});
      valueArray.push({key: '<% PATH: %> subcommand (SmartBlock Command)',                icon:'gear', value: '<%PATH:&&&%>',            processor:'static',
                             help:'<b>PATH</b><br/>For supported commands returns the breadcrumb path<br/><br/>1. Separator between parent blocks'});
      valueArray.push({key: '<% UID %> subcommand (SmartBlock Command)',    icon:'gear', value: '<%UID%>',               processor:'static',
                             help:'<b>UID</b><br/>For commands that support<br/>the UID directive, a <br/>Block ref UID  is outpu'});
      valueArray.push({key: '<% RANDOMBLOCK %> (SmartBlock Command)',        icon:'gear', value: '<%RANDOMBLOCK%>',        processor:'static',
                             help:'<b>RANDOMBLOCK</b><br/>Returns random block from graph'});
      valueArray.push({key: '<% RANDOMBLOCKFROM: %> (SmartBlock Command)',    icon:'gear', value: '<%RANDOMBLOCKFROM:&&&%>',processor:'static',
                             help:'<b>RANDOMBLOCKFROM</b><br/>Returns a random child<br/> block from a page<br/> or block ref<br/><br/>1: Page name or UID'});
      valueArray.push({key: '<% RANDOMBLOCKMENTION: %> (SmartBlock Command)',icon:'gear',value:'<%RANDOMBLOCKMENTION:&&&%>',processor:'static',
                             help:'<b>RANDOMBLOCKMENTION</b><br/>Returns random block where<br/>page ref mentioned<br/><br/>1: Page name without [[]] or #'});
      valueArray.push({key: '<% RANDOMPAGE %> (SmartBlock Command)',         icon:'gear', value: '<%RANDOMPAGE%>',         processor:'static',
                             help:'<b>RANDOMPAGE</b><br/>Returns random page from graph'});
      valueArray.push({key: '<% REPEAT: %> (SmartBlock Command)',    icon:'gear', value: '<%REPEAT:&&&%>',processor:'static',
                             help:'<b>REPEAT</b><br/>Repeats the current block<br/> a number of specified times<br/><br/>1. Number of times for repeat'});
      valueArray.push({key: '<% RESOLVEBLOCKREF: %> (SmartBlock Command)',    icon:'gear', value: '<%RESOLVEBLOCKREF:&&&%>',processor:'static',
                             help:'<b>RESOLVEBLOCKREF</b><br/>Convert block ref to text<br/><br/>1. Block reference'});
      valueArray.push({key: '<% RESOLVEBLOCKREFATEND: %> (SmartBlock Command)',icon:'gear',value: '<%RESOLVEBLOCKREFATEND:&&&%>',processor:'static',
                             help:'<b>RESOLVEBLOCKREFATEND</b><br/>Convert block ref<br/> to text, as last<br/> step in processing block<br/><br/>1. Block reference'});
      valueArray.push({key: '<% 42SETTING: %> (SmartBlock Command)',icon:'gear',value: '<%42SETTING:&&&%>',processor:'static',
                             help:'<b>42SETTING</b><br/>Returns a value for a #42Setting<br/><br/>1. Setting name'});
      valueArray.push({key: '<% SMARTBLOCK: %> (SmartBlock Command)',         icon:'gear', value: '<%SMARTBLOCK:&&&%>',processor:'static',
                             help:'<b>SMARTBLOCK (Experimental)</b><br/>Runs another SmartBlock<br/><br/>1. SmartBlock name'});
      valueArray.push({key: '<% TIME %> (SmartBlock Command)',               icon:'gear', value: '<%TIME%>',               processor:'static',
                             help:'<b>TIME</b><br/>Returns time in 24 hour format'});
      valueArray.push({key: '<% TIMEAMPM: %> (SmartBlock Command)',           icon:'gear', value: '<%TIMEAMPM%>',           processor:'static',
                             help:'<b>TIMEAMPM</b><br/>Returns time in AM/PM format.'});
      valueArray.push({key: '<% TODOTODAY: %> (SmartBlock Command)',          icon:'gear', value: '<%TODOTODAY:20&&&%>',    processor:'static',
                             help:'<b>TODOTODAY</b><br/>Returns a list of block refs<br/> of TODOs for today<br/><br/>1. Max # blocks<br/>2. optional filter values'});
      valueArray.push({key: '<% TODOOVERDUE: %> (SmartBlock Command)',        icon:'gear', value: '<%TODOOVERDUE:20&&&%>',  processor:'static',
                             help:'<b>TODOOVERDUE</b><br/>Returns a list of block refs<br/> of TODOs that are Overdue<br/><br/>1.  Max # blocks<br/>2. optional filter values'});
      valueArray.push({key: '<% TODOOVERDUEDNP: %> (SmartBlock Command)',     icon:'gear', value: '<%TODOOVERDUEDNP:20&&&%>',  processor:'static',
                             help:'<b>TODOOVERDUEDNP</b><br/>Returns a list of block refs<br/> of TODOs that are Overdue<br/>including DNP TODOs<br/><br/>1.  Max # blocks<br/>2. optional filter values'});
      valueArray.push({key: '<% TODOFUTURE: %> (SmartBlock Command)',         icon:'gear', value: '<%TODOFUTURE:20&&&%>',  processor:'static',
                             help:'<b>TODOFUTURE</b><br/>Returns a list of block refs<br/> of TODOs that are due<br/> in the future<br/><br/>1.  Max # blocks<br/>2. optional filter values'});
      valueArray.push({key: '<% TODOFUTUREDNP: %> (SmartBlock Command)',      icon:'gear', value: '<%TODOFUTUREDNP:20&&&%>',  processor:'static',
                             help:'<b>TODOFUTUREDNP</b><br/>Returns a list of block refs<br/> of TODOs that are <br/>due in the future<br/>including DNP TODOs<br/><br/>1.  Max # blocks<br/>2. optional filter values'});
      valueArray.push({key: '<% TODOUNDATED: %> (SmartBlock Command)',        icon:'gear', value: '<%TODOUNDATED:20&&&%>',  processor:'static',
                             help:'<b>TODOUNDATED</b><br/>Returns a list of block refs<br/> of TODOs with no date<br/><br/>1. Max # blocks<br/>2. optional filter values'});
      valueArray.push({key: '<% GET: %> (SmartBlock Command)',                icon:'gear', value: '<%GET:&&&%>',            processor:'static',
                             help:'<b>GET</b><br/>Returns a variable<br/><br/>1. Variable name'});
      valueArray.push({key: '<% SET: %> (SmartBlock Command)',                icon:'gear', value: '<%SET:&&&%>',            processor:'static',
                             help:'<b>SET</b><br/>Create a variable in memory<br/><br/>1. Variable name<br/>2: Value of variable'});
      valueArray.push({key: '<% CLEARVARS: %> (SmartBlock Command)',          icon:'gear', value: '<%CLEARVARS%>',          processor:'static',
                             help:'<b>CLEARVARS</b><br/>Clears all <br/>variables from memory'});
      roam42.smartBlocks.customCommands.forEach(v => valueArray.push(v));
    };

    roam42.smartBlocks.resolveBlockRef = async (blockref)=>{
      if(blockref.includes('[[')) {
        blockref = blockref.replace('#[[','');
        blockref = await roam42.common.replaceAsync(blockref, /\[\[/g, async (match, name)=>{return ''});
        blockref = await roam42.common.replaceAsync(blockref, /\]\]/g, async (match, name)=>{return ''});
        return blockref;
      } else {
        blockref = blockref.replace('((','').replace('))','').trim();
        var queryResults = await roam42.common.getBlockInfoByUID(blockref);
        if(queryResults==null)
          return blockref + ''; //no results, return origional
        else
          return queryResults[0][0].string;
      }
    }

    roam42.smartBlocks.proccessBlockWithSmartness = async (textToProcess)=>{
      let ifCommand = null;  // null if no IF, true process THEN, false process ELSE

      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%REPEAT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var blockCommand = await roam42.common.replaceAsync(textToProcess, /(\<\%GET:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%GET:','').replace('%>','');
          var vValue = roam42.smartBlocks.activeWorkflow.vars[commandToProcess];
          return vValue;
        });
        var repeatCount;
        await roam42.common.replaceAsync(blockCommand, /(\<\%REPEAT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          repeatCount = match.replace('<%REPEAT:','').replace('%>','');
          return ''
        });
        blockCommand = await roam42.common.replaceAsync(blockCommand, /(\<\%REPEAT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{return ''});
        if(Number(repeatCount)>0) {
          for(var i=0; i< Number(repeatCount); i++)
           await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(blockCommand, true);
        }
        return roam42.smartBlocks.exclusionBlockSymbol; // roam42.smartBlocks.replaceFirstBlock;
      });
      if(textToProcess.includes(roam42.smartBlocks.exclusionBlockSymbol)) return ''

      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLEARVARS\%\>)/g, async (match, name)=>{
        roam42.smartBlocks.activeWorkflow.vars = new Object();
        return '';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%42SETTING:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%42SETTING:','').replace('%>','');
        var vValue = await roam42.settings.get(commandToProcess);
        if(vValue==null) vValue = `--> Setting ${commandToProcess} not found in your graph <--`
        return vValue;
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%GET:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%GET:','').replace('%>','');
        var vValue = roam42.smartBlocks.activeWorkflow.vars[commandToProcess];
        if(vValue==undefined) vValue = `--> Variable ${commandToProcess} not SET <--`
        return vValue;
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CURRENTPAGENAME\%\>)/g, async (match) => {
        const container = document.activeElement.closest(".roam-log-page") 
          || document.activeElement.closest(".rm-sidebar-outline") 
          || document.activeElement.closest(".roam-article") 
          || document;
        const heading = container.getElementsByClassName("rm-title-display")[0] 
          || container.getElementsByClassName("rm-zoom-item-content")[0];
        return  Array.from(heading.childNodes).find(
          (n) => n.nodeName === "#text" || n.nodeName === "SPAN"
        ).textContent;
				return x;
      });			
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLIPBOARDPASTETEXT\%\>)/g, async (match, name)=>{
        var cb = await navigator.clipboard.readText();
        await roam42.common.sleep(50);
        return cb;
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RESOLVEBLOCKREF:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%RESOLVEBLOCKREF:','').replace('%>','').trim();
        return roam42.smartBlocks.resolveBlockRef(commandToProcess);
      });

      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFTRUE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%IFTRUE:','').replace('%>','');
        try {
          if(eval(commandToProcess)==false) {
            return roam42.smartBlocks.exclusionBlockSymbol;
          }
        } catch(e) { return '<%IFTRUE%> Failed with error: ' + e }
        return '';
      });

      // IFTRUE prevents us from going forward if was FALSE
      if(!textToProcess.includes(roam42.smartBlocks.exclusionBlockSymbol))  {
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%DATEBASIS)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%DATEBASIS:','').replace('%>','').trim();
          if(commandToProcess=='DNP')
            roam42.smartBlocks.activeWorkflow.vars['DATEBASISMETHOD'] = 'DNP';
          else  {
            roam42.smartBlocks.activeWorkflow.vars['DATEBASISMETHOD'] = null; //reset basis to default
            var dt = roam42.dateProcessing.parseTextForDates(commandToProcess).replace('[[','').replace(']]','');
            roam42.smartBlocks.activeWorkflow.vars['DATEBASISMETHOD'] = chrono.parseDate(dt);
          }
          return roam42.smartBlocks.exclusionBlockSymbol;
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%J:)/g, async (match, name)=>{
          return  match.replace('<%J:','<%JAVASCRIPT:')
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%JA:)/g, async (match, name)=>{
          return  match.replace('<%JA:','<%JAVASCRIPTASYNC:')
        });
        //gives JS a hook into current text to be output
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
          var results = await new AsyncFunction(scriptToRun.toString())();
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
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCKFROM:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          return '((' + await roam42.smartBlocks.getRandomBlocksFrom(match) + '))';
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCKMENTION:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          return '((' + await roam42.smartBlocks.getRandomBlocksMention(match) + '))';
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMPAGE\%\>)/g, async (match, name)=>{
          return await roam42.smartBlocks.getRandomPage();
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%BREADCRUMBS:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var textToProcess = match.replace('<%BREADCRUMBS:','').replace('%>','');
          var blockUID  = textToProcess.substring(0,textToProcess.search(','));
          var separator = textToProcess.substring(textToProcess.search(',')+1,);          
          var results = null;
          if(blockUID.substring(0,1)=='+') { //page name only
            results = await roam42.timemgmt.breadCrumbsByUID(blockUID.substring(1,blockUID.length), separator, true,  false);
          } else if(blockUID.substring(0,1)=='-') { //page name only
            results = await roam42.timemgmt.breadCrumbsByUID(blockUID.substring(1,blockUID.length), separator, false, true);
          } else {
            results = await roam42.timemgmt.breadCrumbsByUID(blockUID, separator, true,  true);
          }
          return results;
        });
       textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIME\%\>)/g, async (match, name)=>{
          return roam42.dateProcessing.getTime24Format()
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIMEAMPM\%\>)/g, async (match, name)=>{
          return roam42.dateProcessing.getTimeAPPMFormat();
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%DATE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%DATE:','').replace('%>','').trim();
          if(!commandToProcess.includes(',')) //no formatting command, return a roam date
           return roam42.dateProcessing.parseTextForDates(commandToProcess).trim();
          else {
            //formatting command provided, return a format
            var nlpText = commandToProcess.substring(0,commandToProcess.search(','));
            var formatText = commandToProcess.substring(nlpText.length+1,commandToProcess.length);
            var dt = roam42.dateProcessing.parseTextForDates(nlpText).trim().replace('[[','').replace(']]','');
            return dayjs( chrono.parseDate(dt) ).format(formatText);
          }
        });

        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFWEEK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%IFDAYOFWEEK:','').replace('%>','').trim();
          var day = '';
					try { //try for "smart date" in context
						day = String(chrono.parseDate(roam42.dateProcessing.parseTextForDates('today')).getDay());
					} catch(e) {
						// fall back to today
						day = String(chrono.parseDate('today').getDay());
					}
          if(day=='0') day='7'; //sunday
          if(commandToProcess.replaceAll(' ','').split(',').includes(day))
            return ''; //
          else
            return roam42.smartBlocks.exclusionBlockSymbol
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFMONTH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%IFDAYOFMONTH:','').replace('%>','').trim();
          var day = '';
					try { //try for "smart date" in context
						day = String(chrono.parseDate(roam42.dateProcessing.parseTextForDates('today')).getDate());
					} catch(e) {
						// fall back to today
						day = String(chrono.parseDate('today').getDate());
					}
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
        // process CUSTOM commands
        for (const { value, processor } of roam42.smartBlocks.customCommands) {
          textToProcess = await roam42.common.replaceAsync(textToProcess, new RegExp(value, 'g'), processor);
        }

        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IF:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%IF:','').replace('%>','');
          try {
            if(eval(commandToProcess))
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
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CONCAT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
         var commandToProcess = match.replace('<%CONCAT:','').replace('%>','');
         commandToProcess = await roam42.common.replaceAsync(commandToProcess, /\\,/g, async (match, name)=>'&&comma;;');
         commandToProcess = await roam42.common.replaceAsync(commandToProcess, /,/g,   async (match, name)=>'');
         commandToProcess = await roam42.common.replaceAsync(commandToProcess, /\&\&comma\;\;/g,   async (match, name)=>',');
         return commandToProcess;
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RESOLVEBLOCKREFATEND:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%RESOLVEBLOCKREFATEND:','').replace('%>','').trim();
          return roam42.smartBlocks.resolveBlockRef(commandToProcess);
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%NOTIFICATION:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var commandToProcess = match.replace('<%NOTIFICATION:','').replace('%>','').trim();
          var params = commandToProcess.split(',');
          iziToast.show({message:params[1],timeout:Number(params[0]*1000),theme:'dark',progressBar:true,animateInside:true,close:true,closeOnClick:true,displayMode:2});
          return ''
        });
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%SET:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
          var textToProcess = match.replace('<%SET:','').replace('%>','');
          roam42.smartBlocks.activeWorkflow.vars[textToProcess.substring(0,textToProcess.search(','))] = textToProcess.substring(textToProcess.search(',')+1,);
          return '';
        });
        //ALWAYS at end of process
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%NOBLOCKOUTPUT\%\>)/g, async (match, name)=>{
          return roam42.smartBlocks.exclusionBlockSymbol;
        });
        //test for EXIT command
        textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%EXIT\%\>)/g, async (match, name)=>{
          roam42.smartBlocks.exitTriggered=true;
          return '';
        });
        if(roam42.smartBlocks.exitTriggered==true) return textToProcess;   //exit procesing

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
            return await roam42.timemgmt.smartBlocks.commands.todosDueToday(commandToProcess,textToProcess,match);
          });
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOOVERDUE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            var commandToProcess = match.replace('<%TODOOVERDUE:','').replace('%>','').trim();
            return await roam42.timemgmt.smartBlocks.commands.todosOverdue(commandToProcess,false,textToProcess, match);
          });
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOOVERDUEDNP:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            var commandToProcess = match.replace('<%TODOOVERDUEDNP:','').replace('%>','').trim();
            return await roam42.timemgmt.smartBlocks.commands.todosOverdue(commandToProcess,true,textToProcess, match);
          });
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOFUTURE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            var commandToProcess = match.replace('<%TODOFUTURE:','').replace('%>','').trim();
            return await roam42.timemgmt.smartBlocks.commands.todosFuture(commandToProcess,false,textToProcess, match);
          });
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOFUTUREDNP:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            var commandToProcess = match.replace('<%TODOFUTUREDNP:','').replace('%>','').trim();
            return await roam42.timemgmt.smartBlocks.commands.todosFuture(commandToProcess,true,textToProcess, match);
          });
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TODOUNDATED:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            var commandToProcess = match.replace('<%TODOUNDATED:','').replace('%>','').trim();
            return await roam42.timemgmt.smartBlocks.commands.todoNotDated(commandToProcess, textToProcess, match);
          });
          textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%SMARTBLOCK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            var commandToProcess = match.replace('<%SMARTBLOCK:','').replace('%>','').trim();
            var userCommands = await roam42.smartBlocks.UserDefinedWorkflowsList();
            var sbCommand = userCommands.find(e => e.key == commandToProcess);
            if(sbCommand==undefined){
              roam42.help.displayMessage(commandToProcess + ' is not a valid Roam42 SmartBlock',3000);
              return '---- SmartBlock:  **' + commandToProcess + '**  does not exist. ----'
            } else {
              await roam42.smartBlocks.sbBomb({original: sbCommand},true,true);
              return roam42.smartBlocks.exclusionBlockSymbol
            }
          });
        } //if for MULTIBLOCK
      } //if ifTrueDefinedStopProcessing

      return textToProcess; //resert new text
    }

    roam42.smartBlocks.processBlockAfterBlockInserted = async (textToProcess)=> {
      if(!textToProcess.match(/\<\%(\s*[\S\s]*?)\%\>/)) //process if it has a command
        return textToProcess

      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%UNINDENT\%\>)/g, async (match, name)=>{
        await roam42KeyboardLib.pressShiftTab(500);
        return '';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%INDENT\%\>)/g, async (match, name)=>{
        await roam42KeyboardLib.pressTab(500);
        return '';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CURRENTBLOCKREF:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%CURRENTBLOCKREF:','').replace('%>','');
        let UID = document.querySelector("textarea.rm-block-input").id;
        roam42.smartBlocks.activeWorkflow.vars[commandToProcess]='((' + UID.substring( UID.length -9) + '))';
        roam42.smartBlocks.activeWorkflow.forceDelayAferNewBlock = 900;
        return '';
      });
      await roam42.common.replaceAsync(textToProcess, /(\<\%CURSOR\%\>)/g, async (match, name)=>{
        roam42.smartBlocks.activeWorkflow.startingBlockTextArea = document.activeElement.id; //if CURSOR, then make this the position block in end
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%FOCUSONBLOCK\%\>)/g, async (match, name)=>{
        //if assigned, will zoom to this location later
        roam42.smartBlocks.activeWorkflow.focusOnBlock = document.activeElement.id; //if CURSOR, then make this the position block in end
        return '';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%ONBLOCKEXIT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var scriptToRun = match.replace('<%ONBLOCKEXIT:','').replace('%>','').trim();
        if(scriptToRun.substring(0,13)=='```javascript')
          scriptToRun = scriptToRun.substring(13,scriptToRun.length-3);
        roam42.smartBlocks.activeWorkflow.onBlockExitCode = scriptToRun;
        return '';
      });
      return textToProcess;
    }

    roam42.smartBlocks.processBlockOnBlockExit = async ()=>{
      if(roam42.smartBlocks.activeWorkflow.onBlockExitCode!='') {
        var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        var results = await new AsyncFunction( roam42.smartBlocks.activeWorkflow.onBlockExitCode )();
        roam42.smartBlocks.activeWorkflow.onBlockExitCode='';
      }
    }
})();
