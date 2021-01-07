/* globals roam42, chrono */

(() => {
  roam42.timemgmt = {};
  roam42.timemgmt.smartBlocks = {};
  roam42.timemgmt.smartBlocks.commands = {};

  roam42.timemgmt.breadCrumbsByUID = async (uid, separator = ' > ', includePageTitle=false,  includePath=true) =>{
    uid = uid.replace('((','').replace('))','');
    var parents = await roam42.common.getBlockParentUids(uid);
    var path = '';
    if(parents.length>0) { // contains a path
      if(includePageTitle)
        path = '[[' + parents[0][1].title + ']]' + separator;
      if(includePath)
        for(let block of parents)
          path +=  '((' + block[0].uid + '))' + separator;
      path = path.substring(0,path.length - separator.length);
      return path;
    } else if(includePageTitle){ //no path
        var parent = await roam42.common.getPageNamesFromBlockUidList([uid]);
        return '[[' + parent[0][1].title + ']]' + separator;
    } else
      return ''
  }

  roam42.timemgmt.outputTaskBlocks =  async (tasksToProcess,textToProcess,commandMatch,params,maxToReturn=10000)=> {
    let outputCount = 0;
    for(let block of tasksToProcess) {
      if( outputCount <= maxToReturn -1 ) { 
        let bOutputBlock = true;
        if(params) {
          let blockText = block.taskString.toLowerCase();
          for(let t of params) {
            let tokenText = t.toLowerCase();
            if(tokenText.substring(0,1)=='-') {
              let searchFor = tokenText.substring(1,tokenText.length);
              if(blockText.includes(searchFor)) bOutputBlock = false;
            }
            else
              if(!blockText.includes(tokenText)) bOutputBlock = false;
          }
        } 
        if(bOutputBlock == true && outputCount <= maxToReturn-1) {
          outputCount  += 1;
          let newText = textToProcess.replace(commandMatch,`((${block.taskUID}))`)
          newText = await roam42.common.replaceAsync(newText, /(\<\%PAGE\%\>)/g, async (match, name)=>{
            return `[[${block.pageTitle}]]`;
          });
          newText = await roam42.common.replaceAsync(newText, /(\<\%UID\%\>)/g, async (match, name)=>{
            return `${block.taskUID}`;
          });
          newText = await roam42.common.replaceAsync(newText, /(\<\%PATH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
            let commandToProcess = match.replace('<%PATH:','').replace('%>','');
            let vValue = roam42.timemgmt.breadCrumbsByUID(block.taskUID, commandToProcess);
            return vValue;
          });
          newText = await roam42.smartBlocks.proccessBlockWithSmartness(newText);
          await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(newText,false);
        }
      } 
    } // end FOR
     // return '';
    if(outputCount>=1)
      return roam42.smartBlocks.replaceFirstBlock;
    else
      return roam42.smartBlocks.exclusionBlockSymbol;
  }

  var parseTodoRequestString =(requestString)=>{
    var limitOutputCount = null;
    var queryParameters  = null;
    if(requestString.includes(',')) {
      limitOutputCount = Number(requestString.substring(0,requestString.search(',')));
      queryParameters = (requestString.substring(requestString.search(',')+1,requestString.length)).split(',');
    } else
      limitOutputCount=requestString;
    return {limitCount: limitOutputCount, params: queryParameters};
  }

  roam42.timemgmt.getAllTasks = async ()=>{
    //returns array with format [{"uid":"","string":""},{"title":"","uid":""}] first is task, second is parent of task
    var todoUIDs = [];
    for(var task of await roam42.common.getBlocksReferringToThisPage('TODO'))
      try {
        todoUIDs.push(task[0].uid);
      } catch(e) {}
    return await roam42.common.getPageNamesFromBlockUidList(todoUIDs);
  }

  //DUE TODAY FUNCTIONS
  roam42.timemgmt.todosDueToday = async (limitOutputCount = 50)=>{
    var todayDate = roam42.dateProcessing.parseTextForDates('today');
    var outputTODOs = [];
    var outputCounter = 1;
    for(var task of await roam42.timemgmt.getAllTasks()) {
      try {
        var taskString = task[0].string + ' ';
        if(taskString.substring(0,12)!='{{[[query]]:') {
          if(outputCounter < limitOutputCount && taskString.includes('{{[[TODO]]}}') && taskString.includes(todayDate)) {
            outputCounter += 1;
            outputTODOs.push({taskUID: task[0].uid, taskString:task[0].string, pageTitle: task[1].title})
          }
        }
      } catch(e) {}
    }
    return outputTODOs;
  }

  // DUE TODAY Used in menu to directly insert TODOS
  roam42.timemgmt.smartBlocks.todosDueToday = async ()=> {
    for(var task of await roam42.timemgmt.todosDueToday())
      try {
        await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${task.taskUID}))`);
      } catch(e) {}
    await roam42.smartBlocks.outputArrayWrite()
  }

  // DUE TODAY COMMAND to use in workflow
  roam42.timemgmt.smartBlocks.commands.todosDueToday = async (requestString, textToProcess, commandMatch)=> {
    var request = parseTodoRequestString(requestString);
    var results = await roam42.timemgmt.todosDueToday(10000);
    return roam42.timemgmt.outputTaskBlocks(results, textToProcess, commandMatch, request.params, request.limitCount);
  }

  // OVERDUE Used in menu to directly insert TODOS
  roam42.timemgmt.smartBlocks.todosOverdue = async ()=> {
    for(var task of await roam42.timemgmt.todosOverdue(100,true,false)) {
      try {
        await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${task.taskUID}))`);
      } catch(e) {}
    }
    if(roam42.smartBlocks.activeWorkflow.arrayToWrite.length>10) {
      if(confirm("Would you like to insert " + roam42.smartBlocks.activeWorkflow.arrayToWrite.length + " blocks refs with Overdue TODOS?"))
        await roam42.smartBlocks.outputArrayWrite()
    } else
        await roam42.smartBlocks.outputArrayWrite()
  }

  // OVERDUE COMMAND to use in workflow
  roam42.timemgmt.smartBlocks.commands.todosOverdue = async (requestString, includeDNP=false, textToProcess, commandMatch)=> {
    var request = parseTodoRequestString(requestString);
    var results = await roam42.timemgmt.todosOverdue(10000,true,includeDNP);
    return roam42.timemgmt.outputTaskBlocks(results, textToProcess, commandMatch, request.params, request.limitCount);
  }


  roam42.timemgmt.smartBlocks.todosOverduePlusDNP = async ()=> {
    for(var task of await roam42.timemgmt.todosOverdue(100,true,true))
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${task.taskUID}))`);
    if(roam42.smartBlocks.activeWorkflow.arrayToWrite.length>10) {
      if(confirm("Would you like to insert " + roam42.smartBlocks.activeWorkflow.arrayToWrite.length + " blocks refs with Overdue+DNP TODOS?"))
        await roam42.smartBlocks.outputArrayWrite()
    } else
        await roam42.smartBlocks.outputArrayWrite()
  }

  // FUTURE Used in menu to directly insert TODOS
  roam42.timemgmt.smartBlocks.todosFuture = async ()=> {
    for(var task of await roam42.timemgmt.todosFuture(100,true,false))
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${task.taskUID}))`);
    if(roam42.smartBlocks.activeWorkflow.arrayToWrite.length>10) {
      if(confirm("Would you like to insert " + roam42.smartBlocks.activeWorkflow.arrayToWrite.length + " blocks refs with Overdue TODOS?"))
        await roam42.smartBlocks.outputArrayWrite()
    } else
        await roam42.smartBlocks.outputArrayWrite()
  }

  roam42.timemgmt.smartBlocks.todosFuturePlusDNP = async ()=> {
    for(var task of await roam42.timemgmt.todosFuture(100,true,true))
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${task.taskUID}))`);
    if(roam42.smartBlocks.activeWorkflow.arrayToWrite.length>10) {
      if(confirm("Would you like to insert " + roam42.smartBlocks.activeWorkflow.arrayToWrite.length + " blocks refs with Overdue+DNP TODOS?"))
        await roam42.smartBlocks.outputArrayWrite()
    } else
        await roam42.smartBlocks.outputArrayWrite()
  }

  // FUTURE COMMAND to use in workflow
  roam42.timemgmt.smartBlocks.commands.todosFuture = async (requestString, includeDNP=false, textToProcess, commandMatch)=> {
    var request = parseTodoRequestString(requestString);
    var results = await roam42.timemgmt.todosFuture(10000,true,includeDNP);
    return roam42.timemgmt.outputTaskBlocks(results, textToProcess, commandMatch, request.params, request.limitCount);
  }

  // UNDATED
  roam42.timemgmt.smartBlocks.todoNotDated = async ()=> {
    for(var task of await roam42.timemgmt.todoNotDated(100))
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${task.taskUID}))`);
    if(roam42.smartBlocks.activeWorkflow.arrayToWrite.length>10) {
      if(confirm("Would you like to insert " + roam42.smartBlocks.activeWorkflow.arrayToWrite.length + " blocks refs with undated TODOS?"))
        await roam42.smartBlocks.outputArrayWrite()
    } else
        await roam42.smartBlocks.outputArrayWrite()
  }

  // UNDATED COMMAND to use in workflow
  roam42.timemgmt.smartBlocks.commands.todoNotDated = async (requestString = 50, textToProcess, commandMatch)=> {
    var request = parseTodoRequestString(requestString);
    var results = await roam42.timemgmt.todoNotDated(10000);
    return roam42.timemgmt.outputTaskBlocks(results, textToProcess, commandMatch, request.params, request.limitCount);
  }

  roam42.timemgmt.todosOverdue = async (limitOutputCount = 50, sortAscending=true, includeDNPTasks=true)=>{
    var yesterday = roam42.dateProcessing.testIfRoamDateAndConvert(roam42.dateProcessing.parseTextForDates('yesterday'));
    var outputTODOs = [];
    var outputCounter = 0;

    //STEPS: (1) loop through each tag to see if it is a date before today (2) Also check if page name is dated
    for(var task of await roam42.timemgmt.getAllTasks()) {
      if(outputCounter < limitOutputCount) {
        var taskWasOutputted=false; //tracks for this loop if thee was an output
        var testForPages=null;
        var taskString = task[0].string + ' ';
        if(taskString.substring(0,12)!='{{[[query]]:') {
          if(taskString.includes('{{[[TODO]]}}')) //confirm there is a TODO in the string properly formatted
            testForPages = taskString.replace('[[TODO]]','').match(/\[\[(\s*[\S\s]*?)\]\]/g)
          if(testForPages!=null) {
            for(let page of testForPages) {
              try {
                var testForDate =  roam42.dateProcessing.testIfRoamDateAndConvert(page);
                if(testForDate && testForDate <= yesterday) {
                  outputCounter+=1;
                  taskWasOutputted=true;
                  outputTODOs.push({taskUID: task[0].uid, taskString: task[0].string, pageTitle: task[1].title, date:testForDate})
                }
              } catch(e) {}
            }
          } //end of testForPages!=null
        }
        //This task has no date, but check if it is on a DNP, thus inherits the date
        if(includeDNPTasks && taskWasOutputted==false) {
          try {
            var pageNameIsDate = roam42.dateProcessing.testIfRoamDateAndConvert(task[1].title);
            if(pageNameIsDate && pageNameIsDate <= yesterday) {
                  outputCounter+=1;
                  outputTODOs.push({taskUID: task[0].uid, taskString: task[0].string, pageTitle: task[1].title, date:pageNameIsDate })
            }
          } catch(e) {}
        } //end of includeDNPTasks
      } // end outputCounter < limitOutputCount
    } //end of for
    return outputTODOs.sort((a, b) =>  a.pageTitle-b.pageTitle ).
                       sort((a, b) => sortAscending ? a.date-b.date : b.date-a.date );
  }

  roam42.timemgmt.todosFuture = async (limitOutputCount = 50, sortAscending=true, includeDNPTasks=true)=>{
    var tomorrow = roam42.dateProcessing.testIfRoamDateAndConvert(roam42.dateProcessing.parseTextForDates('tomorrow'));
    var outputTODOs = [];
    var outputCounter = 0;
    //STEPS: (1) loop through each tag to see if it is a date before today (2) Also check if page name is dated
    for(var task of await roam42.timemgmt.getAllTasks()) {
      if(outputCounter < limitOutputCount) {
        var taskWasOutputted=false; //tracks for this loop if thee was an output
        var testForPages=null;
        var taskString = task[0].string + ' ';
        if(taskString.substring(0,12)!='{{[[query]]:') {
          if(taskString.includes('{{[[TODO]]}}')) //confirm there is a TODO in the string properly formatted
            testForPages = taskString.replace('[[TODO]]','').match(/\[\[(\s*[\S\s]*?)\]\]/g)
          if(testForPages!=null) {
            for(let page of testForPages) {
              try {
                var testForDate = roam42.dateProcessing.testIfRoamDateAndConvert(page);
                if(testForDate && testForDate >= tomorrow) {
                  outputCounter+=1;
                  taskWasOutputted=true;
                  outputTODOs.push({taskUID: task[0].uid, taskString: task[0].string, pageTitle: task[1].title, date:testForDate})
                }
              } catch(e) {}
            }
          } //end of testForPages!=null
        }
        //This task has no date, but check if it is on a DNP, thus inherits the date
        if(includeDNPTasks && taskWasOutputted==false) {
          try {
            var pageNameIsDate = roam42.dateProcessing.testIfRoamDateAndConvert(task[1].title);
            if(pageNameIsDate && pageNameIsDate >= tomorrow) {
                  outputCounter+=1;
                  outputTODOs.push({taskUID: task[0].uid, taskString: task[0].string, pageTitle: task[1].title, date:pageNameIsDate })
            }
          } catch(e) {}
        } //end of includeDNPTasks
      } // end outputCounter < limitOutputCount
    } //end of for
    return outputTODOs.sort((a, b) =>  a.pageTitle-b.pageTitle ).
                       sort((a, b) => sortAscending ? a.date-b.date : b.date-a.date );
  }

  roam42.timemgmt.todoNotDated = async (limitOutputCount = 100)=>{
    var outputTODOs = [];
    var outputCounter = 1;
    for(var task of await roam42.timemgmt.getAllTasks()) {
      var taskString = task[0].string + ' ';
      if(taskString.substring(0,12)!='{{[[query]]:') {
        var testForPages = taskString.replace('[[TODO]]','').replace('[[TODO]]','').match(/\[\[(\s*[\S\s]*?)\]\]/g)
        var todoContainsDate = false;
        if(testForPages) {
          for(let page of testForPages) {
            try {
              var testForDate = roam42.dateProcessing.testIfRoamDateAndConvert(page);
              if(testForDate)
                todoContainsDate = true
            } catch(e) {}
          }
        } // end of first IF
        // console.log(todoContainsDate)
        if(outputCounter < limitOutputCount && todoContainsDate==false){
          outputCounter+=1;
          var taskString = task[0].string.replace('{{[[TODO]]}}','').trim();
          outputTODOs.push({taskUID: task[0].uid, taskString: task[0].string, taskSort:taskString, pageTitle: task[1].title})
        }
        todoContainsDate = false;
      }
    } //end of for
    return outputTODOs.sort((a, b) => a.taskSort.localeCompare(b.taskSort));
  }

  window.roam42.timemgmt.testingReload = () => {
    roam42.loader.addScriptToPage( "timemgmt", roam42.host + 'ext/timemgmt.js');
    setTimeout(async ()=>{
      // console.clear()
      // console.log(await roam42.timemgmt.todoNotDated(25))
    },2000)
  };
})();

(() => {
  roam42.q = {};
  roam42.q.smartBlocks = {};
  roam42.q.smartBlocks.commands = {};

  //BLOCKMENTIONS
  var tagQuery = async (pageRef)=>{
    var results = [];
    for(var block of await roam42.common.getBlocksReferringToThisPage(pageRef)){
      try {
        results.push({uid: block[0].uid, text:block[0].string})        
      } catch(e) {}
    }
    return results
  }

  var stripToPageName = async (pageName)=>{
    //removes possible leading and trailing characters for a page name
    if(pageName.substring(0,1)=="#") pageName = pageName.substring(1,pageName.length);
    if(pageName.substring(0,2)=="[[")
      if(pageName.substring(pageName.length-2,pageName.length)=="]]")
          pageName = pageName.substring(2, pageName.length-2);
    return pageName;
  }

  //return blocks that reference all the included references
  //pageRefString comma delimited list of page refs
  roam42.q.blockMentions = async (pageRefString, limitOutputCount = 1000)=> {
    var results = [];
    var tokens = pageRefString.split(',')
    var outputCounter = 1;
    if( pageRefString.trim() != '' && tokens.length>0) {
      var firstPage = await stripToPageName(tokens[0]);   //grab first block
      if(tokens.length>1) tokens.shift() //remove first element
      for(var block of await tagQuery(firstPage)) {
        if(outputCounter < limitOutputCount ) {
          var bIncludeRef = true;
          var blockText = block.text.toLowerCase();
          for(var t of tokens) {
            var tokenText = t.toLowerCase();
            if(tokenText.substring(0,1)=='-') {
              var searchFor = tokenText.substring(1,tokenText.length);
              if(blockText.includes(searchFor)) bIncludeRef = false;
            }
            else
              if(!blockText.includes(tokenText)) bIncludeRef = false;
          }
          if(bIncludeRef==true) {
            results.push(block);
            outputCounter+=1;
          }
        }
      } //end for
    }
    return results.sort((a, b) => a.text.localeCompare(b.text));
  }

  roam42.q.smartBlocks.blockMentions = async()=> {
    var requestString = prompt('Name of page or tag reference to search for?')
    if(requestString == null) return;
    var query = await roam42.q.blockMentions(requestString);
    if(query.length>20 && confirm(`There are ${query.length+1} blocks matching your request. Continue with inserting blocks?`)==false) return;
    for(var block of query)
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${block.uid}))`);
    await roam42.smartBlocks.outputArrayWrite()
  }

  roam42.q.smartBlocks.commands.blockMentions = async (requestString, textToProcess)=> {
    var limitOutputCount = Number(requestString.substring(0,requestString.search(',')));
    var bReturnCount = false;
    if(limitOutputCount==-1) {
      limitOutputCount = 2000;
      bReturnCount = true;
    }
    var queryParameters = requestString.substring(requestString.search(',')+1,requestString.length);
    var UIDS = [];
    for(var block of await roam42.q.blockMentions(queryParameters,limitOutputCount+1))
      UIDS.push(block.uid);

    var results =  await roam42.common.getPageNamesFromBlockUidList(UIDS);

    if(bReturnCount==true) return results.length;

    results = results.sort((a, b) => a[0].string.localeCompare(b[0].string));
    for(var block of results) {
      var newText = await roam42.common.replaceAsync(textToProcess, /(\<\%BLOCKMENTIONS:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return `((${block[0].uid}))`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%PAGE\%\>)/g, async (match, name)=>{
        return `[[${block[1].title}]]`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%UID\%\>)/g, async (match, name)=>{
        return `${block[0].uid}`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%PATH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%PATH:','').replace('%>','');
        var vValue = roam42.timemgmt.breadCrumbsByUID(block[0].uid, commandToProcess);
        return vValue;
      });
      newText = await roam42.smartBlocks.proccessBlockWithSmartness(newText);
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(newText,false);
    }
		console.log(results.length)
    if(results.length>0)
      return roam42.smartBlocks.replaceFirstBlock;
    else
      return roam42.smartBlocks.exclusionBlockSymbol;
  }

  //returns date range. Params:
  //  1 - Limit block count
  //  2 - Page name
  //  3 - Start Date   (if 0, no start date) (if -1 start/end date - only return if there is no date included)
  //  4 - End Date     (if 0, no end date)
  //  5 - Sort order
  //  6 - Filter parameters
  roam42.q.smartBlocks.commands.blockMentionsDated = async (requestString, textToProcess)=> {

    var params = requestString.split(',')
    var bReturnCount = false;
    var bReturnUndatedTodos = false;

    if(params.length<4) return 'BLOCKMENTIONSDATED requires atleast 4 parameters';

    var limitOutputCount = params.shift()
    if(limitOutputCount==-1) {
      limitOutputCount = 2000;
      bReturnCount = true;
    }

    var pageRefName = params.shift();

    var startDate = roam42.dateProcessing.parseTextForDates(params.shift()).replace('[[','').replace(']]','');
    var endDate   = roam42.dateProcessing.parseTextForDates(params.shift()).replace('[[','').replace(']]','');

    if(startDate == '-1' && endDate =='-1')
      bReturnUndatedTodos = true;
    else {
      startDate = startDate!=0 ? await Date.parse(chrono.parseDate(startDate)) : Date.parse('1-01-01');
      endDate   = endDate!=0   ? await Date.parse(chrono.parseDate(endDate))   : Date.parse('9999-012-30');
    }

    var sortOrder = params.length>0 ? params.shift() : 'ASC';

    var queryParameters = pageRefName + ',' + params.join(',');

    var UIDS = [];
    for(var block of await roam42.q.blockMentions(queryParameters,2000))
      UIDS.push(block.uid);

    var queryDates = [];
    var outputCounter = 0;
    for(var block of await roam42.common.getPageNamesFromBlockUidList(UIDS)) {
      try{
        var blockText = block[0].string;
        var outputThisBlock = false;
        if(outputCounter < limitOutputCount && blockText.substring(0,12)!='{{[[query]]:') {
          //testing for 2 conditions:
          // 1 if it has a date in range return
          // if user wants undated, return those with no date
          var pageRefs = blockText.replace(`[[${pageRefName}]]`,'').match(/\[\[(\s*[\S\s]*?)\]\]/g)
          if(pageRefs!=null) {
            for(let ref of pageRefs) {
              try {
                var testForDate =  roam42.dateProcessing.testIfRoamDateAndConvert(ref);
                if(bReturnUndatedTodos==false) { //skip this block, it has a date
                  if(testForDate && startDate<=testForDate && endDate>=testForDate )
                    outputThisBlock=true; //has a date, and dates should be outut
                }
                else
                  if(!testForDate) outputThisBlock = true; //if not a date, write out (user requested not dated)
              } catch(e) {}
            }
          }
          else //no page refs at all
            if(bReturnUndatedTodos) outputThisBlock = true;
        }
        if(outputThisBlock){
          outputCounter+=1;
          block[0].date = testForDate;
          queryDates.push(block)
        }
      } catch(e) {}
     } //end of for

    if(bReturnCount==true) return queryDates.length; //return count and exit

    var sortedQueryDates = [];
    switch(sortOrder.toUpperCase()) {
      case 'ASC':
        sortedQueryDates = queryDates.sort((a, b) => a[0].date-b[0].date);
        break;
      case 'DESC':
        sortedQueryDates = queryDates.sort((a, b) => b[0].date-a[0].date );
        break;
      default:
        sortedQueryDates = queryDates; //no nothing, pass query forward
    }

    for(var block of sortedQueryDates) {
      var newText = await roam42.common.replaceAsync(textToProcess, /(\<\%BLOCKMENTIONSDATED:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return `((${block[0].uid}))`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%PAGE\%\>)/g, async (match, name)=>{
        return `[[${block[1].title}]]`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%UID\%\>)/g, async (match, name)=>{
        return `${block[0].uid}`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%PATH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%PATH:','').replace('%>','');
        var vValue = roam42.timemgmt.breadCrumbsByUID(block[0].uid, commandToProcess);
        return vValue;
      });
      newText = await roam42.smartBlocks.proccessBlockWithSmartness(newText);
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(newText,false);
    }
    if(sortedQueryDates.length>0)
      return roam42.smartBlocks.replaceFirstBlock;
    else
      return roam42.smartBlocks.exclusionBlockSymbol;
  }

  //SEARCH

  roam42.q.search = async (searchString, limitOutputCount = 1000)=> {
    var results = [];
    var tokens = searchString.split(',')
    var outputCounter = 1;
    if( searchString.trim() != '' && tokens.length>0) {
      var firstSearchTerm = await stripToPageName(tokens[0]);   //grab first block
      if(tokens.length>1) tokens.shift() //remove first element
      for(var block of await roam42.common.getBlockByPhrase(firstSearchTerm)) {
        if(outputCounter < limitOutputCount ) {
          var bIncludeRef = true;
          var blockText = block[0].string.toLowerCase();
          for(var t of tokens) {
            var tokenText = t.toLowerCase();
            if(tokenText.substring(0,1)=='-') {
              var searchFor = tokenText.substring(1,tokenText.length);
              if(blockText.includes(searchFor)) bIncludeRef = false;
            }
            else
              if(!blockText.includes(tokenText)) bIncludeRef = false;
          }
          if(bIncludeRef==true) {
            results.push(block);
            outputCounter+=1;
          }
        }
      } //end for
    }
    return results.sort((a, b) => a[0].string.localeCompare(b[0].string));
  }

  roam42.q.smartBlocks.search = async()=> {
    var requestString = prompt('Text to search for?')
    if(requestString == null) return;
    var query = await roam42.q.search(requestString);
    if(query.length>20 && confirm(`There are ${query.length+1} blocks matching your request. Continue with inserting blocks?`)==false) return;
    for(var block of query)
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(`((${block[0].uid}))`);
    await roam42.smartBlocks.outputArrayWrite()
  }

  roam42.q.smartBlocks.commands.search = async (requestString, textToProcess)=> {
    var limitOutputCount = Number(requestString.substring(0,requestString.search(',')))+1;
    var queryParameters = requestString.substring(requestString.search(',')+1,requestString.length);
    var outputCounter = 0;
    var UIDS = [];
    for(var block of await roam42.q.search(queryParameters,limitOutputCount)) {
      if(outputCounter < limitOutputCount)
        UIDS.push(block[0].uid)
      outputCounter++;
    }
    var results =  await roam42.common.getPageNamesFromBlockUidList(UIDS);
    for(var block of results) {
      var newText = await roam42.common.replaceAsync(textToProcess, /(\<\%SEARCH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return `((${block[0].uid}))`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%PAGE\%\>)/g, async (match, name)=>{
        return `[[${block[1].title}]]`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%UID\%\>)/g, async (match, name)=>{
        return `${block[0].uid}`;
      });
      newText = await roam42.common.replaceAsync(newText, /(\<\%PATH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var commandToProcess = match.replace('<%PATH:','').replace('%>','');
        var vValue = roam42.timemgmt.breadCrumbsByUID(block[0].uid, commandToProcess);
        return vValue;
      });
      newText = await roam42.smartBlocks.proccessBlockWithSmartness(newText);
      await roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(newText,false);
    }
    if(results.length>0)
      return roam42.smartBlocks.replaceFirstBlock;
    else
      return '';
  }


})();
