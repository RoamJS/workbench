 /* globals roam42, Mousetrap,getPageUidByTitle */

(()=>{
  roam42.formatConverter = {};
  roam42.formatConverter.formatter = {};
  roam42.formatConverter.currentPageName = '';

  roam42.common.sleep = m => new Promise(r => setTimeout(r, m))
  
  roam42.common.currentPageUID = async ()=> {
    var uid = '';
    if(window.location.href.includes('page')) {
      uid = window.location.href.replace(roam42.common.baseUrl().href + '/','')
    } else {
      uid = await roam42.common.getPageUidByTitle(roam42.dateProcessing.getRoamDate(new Date()))
    }
    return uid;    
  }
  
  roam42.common.getBlockInfoByUID = async (uid, withChildren=false)=>{
    try {
      let q = `[:find 
                  (pull ?page 
                     [:node/title  
                      :block/string   
                      :block/uid
                      :block/heading  
                      :block/props 
                      :entity/attrs 
                      :block/open 
                      :block/text-align 
                      :children/view-type
                      :block/order 
                      ${withChildren ? '{:block/children ...}' : '' }
                     ]) 
                  :where 
                      [?page :block/uid "${uid}"] 
                ]`;
        var results = await window.roamAlphaAPI.q(q);
        if(results.length == 0 ) return null;
        return results;
      } catch(e) {
        return null;
      }
  }

  
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
        if(refs != null){
          for(const e of refs){
            let uid = e.replaceAll('(','').replaceAll(')','');
            let results = await roam42.common.getBlockInfoByUID(uid, false);
            blockText = blockText.replace(e, results[0][0].string);
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
  
  roam42.formatConverter.formatter.pureText_SpaceIndented = async (blockText, node, level)=> {
    let leadingSpaces = level > 1 ?  '  '.repeat(level-1)  : '' ;      
    output += leadingSpaces + blockText + '\n'
  }
  
  roam42.formatConverter.formatter.pureText_TabIndented = async (blockText, node, level)=> {
    let leadingSpaces = level > 1 ?  '\t'.repeat(level-1)  : '' ;      
    output += leadingSpaces + blockText + '\n'
  }
  
  roam42.formatConverter.formatter.markdownGithub = async (blockText, node, level, parent)=> {
    level = level -1;
    if(node.title){ output += blockText + '\n\n'; return; }
    if(node.heading == 1) blockText = '# '   + blockText;
    if(node.heading == 2) blockText = '## '  + blockText;
    if(node.heading == 3) blockText = '### ' + blockText;
    // process todo's
    if(blockText.substring(0,12) == '{{[[TODO]]}}') {
      blockText = blockText.replace('{{[[TODO]]}}','[ ]');
    } else if(blockText.substring(0,8) == '{{TODO}}') {
      blockText = blockText.replace('{{TODO}}','[ ]');
    } else if(blockText.substring(0,12) == '{{[[DONE]]}}') {
      blockText = blockText.replace('{{[[DONE]]}}','[x]');
    } else if(blockText.substring(0,12) == '{{[[DONE]]}}') {
      blockText = blockText.replace('{{[[DONE]]}}','[x]');
    } 
    blockText = blockText.replace('::', ':');
    if(level>0) {
      //handle indenting (first level is treated as no level, second level treated as first level)
      level = level -1;
      if(parent["view-type"] == 'numbered') {
        output += '    '.repeat(level) + '1. ';      
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
  
