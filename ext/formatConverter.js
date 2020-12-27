 /* globals roam42, Mousetrap,getPageUidByTitle, marked*/

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


  // output( blockText, nodeCurrent, level, parent, flatten )

  var walkDocumentStructureAndFormat = async (nodeCurrent, level, outputFunction, parent, flatten )=>{
    // console.log('walkDocumentStructureAndFormat ' + flatten)
    if(typeof nodeCurrent.title != 'undefined') {          // Title of page
      outputFunction(nodeCurrent.title, nodeCurrent, 0, parent, flatten);
      roam42.formatConverter.currentPageName = nodeCurrent.title;
    } else if(typeof nodeCurrent.string != 'undefined' ) { // Text of a block
      // check if there are embeds and convert text to that
      let blockText = nodeCurrent.string;
      // First: check for block embed
     blockText = blockText.replaceAll('\{\{embed:','\{\{\[\[embed\]\]\:');
      let embeds = blockText.match(/\{\{\[\[embed\]\]\: \(\(.+?\)\)\}\}/g);
      //Test for block embeds
      if(embeds != null){
        for(const e of embeds){
          let uid = e.replace('{{[[embed]]: ','').replace('}}','');
          uid = uid.replaceAll('(','').replaceAll(')','');
          let embedResults = await roam42.common.getBlockInfoByUID(uid, true);
          try{
            blockText = await blockText.replace(e, embedResults[0][0].string);
            //test if the newly generated block has any block refs
            blockText = await resolveBlockRefsInText(blockText);
            outputFunction(blockText, nodeCurrent, level, parent, flatten);
            //see if embed has children
            if(typeof embedResults[0][0].children != 'undefined' && level < 30) {
              let orderedNode = await sortObjectsByOrder(embedResults[0][0].children)
              for(let i in await sortObjectsByOrder(embedResults[0][0].children)) {
                await walkDocumentStructureAndFormat(orderedNode[i], level + 1, (embedResults, nodeCurrent, level)=> {
                  outputFunction(embedResults, nodeCurrent, level, parent,flatten)
                }, embedResults[0][0], parent, flatten)
              }
            }
          }catch(e){}
        }
      }  else {
        // Second: check for block refs
        blockText = await resolveBlockRefsInText(blockText);
        outputFunction(blockText, nodeCurrent, level, parent, flatten);
      }
    }
    // If block/node has children nodes, process them
    if(typeof nodeCurrent.children != 'undefined') {
      let orderedNode = await sortObjectsByOrder(nodeCurrent.children)
      for(let i in await sortObjectsByOrder(nodeCurrent.children))
        await walkDocumentStructureAndFormat(orderedNode[i], level + 1, outputFunction, nodeCurrent, flatten)
    }
  }

  var resolveBlockRefsInText = async (blockText)=>{
    let refs = blockText.match(/\(\(.+?\)\)/g);
    if(refs != null ){
      for(const e of refs){
        let uid = e.replaceAll('(','').replaceAll(')','');
        let results = await roam42.common.getBlockInfoByUID(uid, false);
        if(results) blockText = blockText.replace(e, results[0][0].string);
      }
    }
    return blockText
  }

  var roamMarkupScrubber = (blockText, removeMarkdown=true)=> {
    if(blockText.substring(0,9)  == "{{[[query" || blockText.substring(0,7) == "{{query" ) return '';
    if(blockText.substring(0,12) == "{{attr-table" ) return '';
    if(blockText.substring(0,15) == "{{[[mentions]]:" ) return '';
    if(blockText.substring(0,8) == ":hiccup " && blockText.includes(':hr') ) return  '---'; // Horizontal line in markup, replace it with MD
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
    blockText = blockText.replace('::', ':');                      // ::
    blockText = blockText.replaceAll(/\(\((.+?)\)\)/g, '$1');      // (())
    blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, '$1');      // [[ ]]  First run
    blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, '$1');      // [[ ]]  second run
    blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, '$1');      // [[ ]]  second run
    // blockText = blockText.replaceAll(/\$\$(.+?)\$\$/g, '$1');      // $$ $$
    blockText = blockText.replaceAll(/\B\#([a-zA-Z]+\b)/g, '$1');  // #hash tag
    blockText = blockText.replaceAll(/\{\{calc: (.+?)\}\}/g,  function(all, match) {
      try{ return eval(match) } catch(e) { return ''}
    });
                                     // calc functions  {{calc: 4+4}}
    if(removeMarkdown) {
      blockText = blockText.replaceAll(/\*\*(.+?)\*\*/g, '$1');    // ** **
      blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, '$1');    // __ __
      blockText = blockText.replaceAll(/\^\^(.+?)\^\^/g, '$1');    // ^^ ^^
      blockText = blockText.replaceAll(/\~\~(.+?)\~\~/g, '$1');    // ~~ ~~
      blockText = blockText.replaceAll(/\!\[(.+?)\]\((.+?)\)/g, '$1 $2'); //images with description
      blockText = blockText.replaceAll(/\!\[\]\((.+?)\)/g, '$1');         //imags with no description
      blockText = blockText.replaceAll(/\[(.+?)\]\((.+?)\)/g, '$1: $2');   //alias with description
      blockText = blockText.replaceAll(/\[\]\((.+?)\)/g, '$1');           //alias with no description
      blockText = blockText.replaceAll(/\[(.+?)\](?!\()(.+?)\)/g, '$1');    //alias with embeded block (Odd side effect of parser)
    } else {
      blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, '\_$1\_');    // convert for use as italics _ _
    }


    return blockText;
  }

  roam42.formatConverter.formatter.pureText_SpaceIndented = async (blockText, nodeCurrent, level, parent, flatten)=> {
    if(nodeCurrent.title) return;
    blockText = roamMarkupScrubber(blockText, true);
    let leadingSpaces = level > 1 ?  '  '.repeat(level-1)  : '' ;
    output += leadingSpaces + blockText + '\n'
  }

  roam42.formatConverter.formatter.pureText_TabIndented = async (blockText, nodeCurrent, level, parent, flatten)=> {
    if(nodeCurrent.title) return;
    try{
      blockText = roamMarkupScrubber(blockText, true);
    } catch(e) {}
    let leadingSpaces = level > 1 ?  '\t'.repeat(level-1)  : '' ;
    output += leadingSpaces + blockText + '\n'
  }

  roam42.formatConverter.formatter.pureText_NoIndentation = async (blockText, nodeCurrent, level, parent, flatten)=> {
    if(nodeCurrent.title) return;
    try{
      blockText = roamMarkupScrubber(blockText, true);
    } catch(e) {}
    output += blockText + '\n'
  }

  roam42.formatConverter.formatter.markdownGithub = async (blockText, nodeCurrent, level, parent, flatten)=> {
    // console.log("1",blockText)
   // console.log(flatten)
    if(flatten==true) {
      level = 0
    } else {
      level = level -1;
    }
    if(nodeCurrent.title){ output += '# '  + blockText; return; };

    //convert soft line breaks, but not with code blocks
    if(blockText.substring(0,3)!= '```')  blockText = blockText.replaceAll('\n', '<br/>');

    if(nodeCurrent.heading == 1) blockText = '# '   + blockText;
    if(nodeCurrent.heading == 2) blockText = '## '  + blockText;
    if(nodeCurrent.heading == 3) blockText = '### ' + blockText;
    // process todo's
    var todoPrefix = level > 0 ? '' : '- '; //todos on first level need a dash before them
    if(blockText.substring(0,12) == '{{[[TODO]]}}') {
      blockText = blockText.replace('{{[[TODO]]}}',todoPrefix + '[ ]');
    } else if(blockText.substring(0,8) == '{{TODO}}') {
      blockText = blockText.replace('{{TODO}}',todoPrefix + '[ ]');
    } else if(blockText.substring(0,12) == '{{[[DONE]]}}') {
      blockText = blockText.replace('{{[[DONE]]}}',todoPrefix + '[x]');
    } else if(blockText.substring(0,8) == '{{DONE}}') {
      blockText = blockText.replace('{{DONE}}',todoPrefix + '[x]');
    }
    // console.log("2",blockText)
    try{
      blockText = roamMarkupScrubber(blockText, false);
    } catch(e) {}
    // console.log("3",blockText)

    if( level > 0 && blockText.substring(0,3)!='```') {
      //handle indenting (first level is treated as no level, second level treated as first level)
      if(parent["view-type"] == 'numbered') {
        output += '    '.repeat(level-1) + '1. ';
      } else {
        output += '  '.repeat(level) + '- ';
      }
    } else { //level 1, add line break before
      blockText =  '\n' + blockText ;
    }
    // console.log("4",blockText)
    output += blockText + '  \n';
  }

  roam42.formatConverter.formatter.htmlSimple = async (uid)=> {
    var md =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.markdownGithub );
    marked.setOptions({
      gfm: true,
      xhtml: false,
      pedantic: false,
    });
    md = md.replaceAll('- [ ] [', '- [ ]&nbsp;&nbsp;['); //fixes odd isue of task and alis on same line
    md = md.replaceAll('- [x] [', '- [x]&nbsp;['); //fixes odd isue of task and alis on same line
    md = md.replaceAll(/\{\{\youtube\: (.+?)\}\} /g, (str,lnk)=>{
      lnk = lnk.replace('youtube.com/','youtube.com/embed/');
      lnk = lnk.replace('youtu.be/','youtube.com/embed/');
      lnk = lnk.replace('watch?v=','');
      return `<iframe width="560" height="315" class="embededYoutubeVieo" src="${lnk}" frameborder="0"></iframe>`
    });


    //lATEX handling
   md = md.replace(/  \- (\$\$)/g, '\n\n$1'); //Latex is centered
    const tokenizer = {
      codespan(src) {
        var match = src.match(/\$\$(.*?)\$\$/);
        if (match) {
          var str = match[0];
              str = str.replaceAll('<br>',' ');
              str = str.replaceAll('<br/>',' ');
              str = `<div>${str}</div>`;
          return { type: 'text', raw: match[0],text: str };
        }
        // return false to use original codespan tokenizer
        return false;
      }
    };
    marked.use({ tokenizer });
    md = marked(md)

    return  `<html>\n
              <head>
              </head>
              <body>\n${md}\n
              </body>\n
            </html>`;
  }

  var output = '';

  roam42.formatConverter.iterateThroughTree = async (uid, formatterFunction, flatten )=>{
    var results = await roam42.common.getBlockInfoByUID(uid, true)
    output = '';
    //nodeCurrent, level, outputFunction, parent, flatten
    await walkDocumentStructureAndFormat(results[0][0], 0, formatterFunction, null, flatten);
    return output;
  }

  window.roam42.formatConverter.testingReload = ()=>{
    roam42.loader.addScriptToPage( 'formatConverter', 	roam42.host + 'ext/formatConverter.js');
    roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');
    setTimeout( async ()=>{
      var uid = await roam42.common.currentPageUID();
      var x =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.markdownGithub, false );
      // console.log( x );
    }, 600)
  }
})();

