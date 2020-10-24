 /* globals roam42, Mousetrap,getPageUidByTitle */

(()=>{
  roam42.formatConverter = {};
  roam42.formatConverter.formatter = {};
  roam42.formatConverter.currentPageName = '';
  
  var sortObjectsByOrder = async (o)=>{
     return o.sort(function (a, b) {
      return a.order - b.order;
    });
  }
  
  var sortObjectByString = async (o)=>{
     return o.sort(function (a, b) {
      return a.string.localeCompare(b.string)
    });
  }

  var walkDocumentStructureAndFormat = async (node, level, outputFunction, parent )=>{
    if(typeof node.title != 'undefined') {          // Title of page
      outputFunction(node.title, node, 0);
      roam42.formatConverter.currentPageName = node.title;
    } else if(typeof node.string != 'undefined' ) { // Text of a block
      // check if there are embeds and convert text to that
      let blockText = node.string;
      // First: check for block embed
     blockText = blockText.replaceAll('\{\{embed:','\{\{\[\[embed\]\]\:');    
      let embeds = blockText.match(/\{\{\[\[embed\]\]\: \(\(.+?\)\)\}\}/g);
      if(embeds != null){
        for(const e of embeds){
          let uid = e.replace('{{[[embed]]: ','').replace('}}',''); 
          uid = uid.replaceAll('(','').replaceAll(')','');
          let embedResults = await roam42.common.getBlockInfoByUID(uid, true);
          blockText = await blockText.replace(e, embedResults[0][0].string);
          outputFunction(blockText, node, level, parent);
          //see if embed has children
          if(typeof embedResults[0][0].children != 'undefined' && level < 30) {
            let orderedNode = await sortObjectsByOrder(embedResults[0][0].children)
            for(let i in await sortObjectsByOrder(embedResults[0][0].children)) {
              await walkDocumentStructureAndFormat(orderedNode[i], level + 1, (embedResults, node, level,)=> {
                outputFunction(embedResults, node, level,parent)
              }, embedResults[0][0])
            }
          }
        }
      }  else {
        // Second: check for block refs
        let refs = blockText.match(/\(\(.+?\)\)/g);
        if(refs != null ){
          for(const e of refs){
            let uid = e.replaceAll('(','').replaceAll(')','');
            let results = await roam42.common.getBlockInfoByUID(uid, false);
            if(results) blockText = blockText.replace(e, results[0][0].string);
          }
        }
        outputFunction(blockText, node, level, parent);
      }
    }
    // If block/node has children nodes, process them
    if(typeof node.children != 'undefined') {
      let orderedNode = await sortObjectsByOrder(node.children)
      for(let i in await sortObjectsByOrder(node.children)) 
        await walkDocumentStructureAndFormat(orderedNode[i], level + 1, outputFunction, node)
    } 
  }

  var roamPageMarkdownScrubber = blockText=> {
    if(blockText.substring(0,9)  == "{{[[query" || blockText.substring(0,7) == "{{query" ) return '';
    if(blockText.substring(0,12) == "{{attr-table" ) return '';
    if(blockText.substring(0,15) == "{{[[mentions]]:" ) return '';
    blockText = blockText.replaceAll('{{TODO}}',       'TODO');
    blockText = blockText.replaceAll('{{[[TODO]]}}',   'TODO');
    blockText = blockText.replaceAll('{{DONE}}',       'DONE');
    blockText = blockText.replaceAll('{{[[DONE]]}}',   'DONE');
    blockText = blockText.replaceAll('{{[[table]]}}',  '');
    blockText = blockText.replaceAll('{{[[kanban]]}}', '');
    blockText = blockText.replaceAll('{{mermaid}}',    '');
    blockText = blockText.replaceAll('{{word-count}}',    '');
    blockText = blockText.replaceAll('{{date}}',    '');
    blockText = blockText.replaceAll('{{diagram}}',    '');
    blockText = blockText.replaceAll('{{POMO}}',    '');
    blockText = blockText.replaceAll('{{slider}}',    '');
    blockText = blockText.replaceAll('{{TaoOfRoam}}',    '');
    blockText = blockText.replaceAll('{{orphans}}',    '');
    blockText = blockText.replace('::', ':');
    blockText = blockText.replaceAll(/\(\((.+?)\)\)/g, '$1');
    blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, '$1');
    return blockText;
  }
  
  var roamMarkdownScrubber = blockText=> {
    blockText = blockText.replace('::', ':');
    blockText = blockText.replaceAll(/\*\*(.+?)\*\*/g, '$1');
    blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, '$1');
    blockText = blockText.replaceAll(/\^\^(.+?)\^\^/g, '$1');
    blockText = blockText.replaceAll(/\~\~(.+?)\~\~/g, '$1');
    return blockText;
  }
  
  roam42.formatConverter.formatter.pureText_SpaceIndented = async (blockText, node, level)=> {
    if(node.title) return; 
    blockText = roamPageMarkdownScrubber(blockText);
    blockText = roamMarkdownScrubber(blockText);
    let leadingSpaces = level > 1 ?  '  '.repeat(level-1)  : '' ;
    output += leadingSpaces + blockText + '\n'
  }
  
  roam42.formatConverter.formatter.pureText_TabIndented = async (blockText, node, level)=> {
    if(node.title) return; 
    blockText = roamPageMarkdownScrubber(blockText);
    blockText = roamMarkdownScrubber(blockText);
    let leadingSpaces = level > 1 ?  '\t'.repeat(level-1)  : '' ;      
    output += leadingSpaces + blockText + '\n'
  }
  
  //todo: strip out roam stuff ( [[]] {{}})
  
  roam42.formatConverter.formatter.markdownGithub = async (blockText, node, level, parent)=> {
    level = level -1;
    if(node.title) return; 
    if(node.heading == 1) blockText = '# '   + blockText;
    if(node.heading == 2) blockText = '## '  + blockText;
    if(node.heading == 3) blockText = '### ' + blockText;
    // process todo's
    var todoPrefix = level > 0 ? '' : '- '; //todos on first level need a dash before them
    if(blockText.substring(0,12) == '{{[[TODO]]}}') {
      blockText = blockText.replace('{{[[TODO]]}}',todoPrefix + '[ ]');
    } else if(blockText.substring(0,8) == '{{TODO}}') {
      blockText = blockText.replace('{{TODO}}',todoPrefix + '[ ]');
    } else if(blockText.substring(0,12) == '{{[[DONE]]}}') {
      blockText = blockText.replace('{{[[DONE]]}}',todoPrefix + '[x]');
    } else if(blockText.substring(0,12) == '{{[[DONE]]}}') {
      blockText = blockText.replace('{{[[DONE]]}}',todoPrefix + '[x]');
    } 
    blockText = roamPageMarkdownScrubber(blockText);
    
    if(level>0 && blockText.substring(0,3)!='```') {
      //handle indenting (first level is treated as no level, second level treated as first level)
      if(parent["view-type"] == 'numbered') {
        output += '    '.repeat(level-1) + '1. ';      
      } else {
        output += '  '.repeat(level) + '- ';
      }
    } else { //level 1, add line break before
      blockText =  '\n' + blockText ;      
    }      
    output += blockText + '  \n';
  }
  
  
  var output = '';
  
  roam42.formatConverter.iterateThroughTree = async (uid, formatterFunction)=>{
    var results = await roam42.common.getBlockInfoByUID(uid, true)
    output = '';
    await walkDocumentStructureAndFormat(results[0][0], 0, formatterFunction);
    return output;
  } 


  window.roam42.formatConverter.testingReload = ()=>{
    roam42.loader.addScriptToPage( 'formatConverter', 	roam42.host + 'ext/formatConverter.js');
    roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');
    setTimeout(()=>{
      roam42.markdown.iterateThroughTree(document.querySelector('.rm-title-display').innerText, roam42.formatConverter.formatter.pureText )
    }, 600)
  }  
})();
  
