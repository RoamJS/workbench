 /* globals roam42, Mousetrap, jsPanel, displayMessage, marked */

//TODO
// Find all block refs and convert them to their nomral output

(()=>{
  roam42.formatConverterUI = {};

  let formatConverterUITextArea = null; 
  let clipboardConvertedText = '';
      
  roam42.formatConverterUI.changeFormat = async ()=> {
    var uid = await roam42.common.currentPageUID();
    clipboardConvertedText='';
    switch(document.getElementById('r42formatConverterSelection').value) {
      case 'puretext_Tab':
        clipboardConvertedText =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.pureText_TabIndented );    
        break;
      case 'puretext_Space':
        clipboardConvertedText=  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.pureText_SpaceIndented );    
        break;
      case 'pureText_NoIndentation':
        clipboardConvertedText =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.pureText_NoIndentation );    
        break;
      case 'markdown_Github':
        clipboardConvertedText =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.markdownGithub );    
        break;
      case 'html_Simple':
        clipboardConvertedText =  await   roam42.formatConverter.formatter.htmlSimple(uid);   
        break;
    }
    formatConverterUITextArea.value = clipboardConvertedText;
  }  
  
  roam42.formatConverterUI.copyToClipboard = async ()=> {
    navigator.clipboard.writeText( clipboardConvertedText );
  }
  
  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }  

  roam42.formatConverterUI.saveToFile = async ()=> {
    var dt = new Date().toISOString();
    var filename =  roam42.formatConverter.currentPageName + '-' + new Date().toISOString();
    filename = filename.replace(/(\W+)/gi, '-') + '.txt';
    download( filename , formatConverterUITextArea.value );
    roam42.help.displayMessage('File saved: ' + filename, 3000)
  }

  roam42.formatConverterUI.show = ()=> {
    // if already open, do nothing
    if(document.querySelector('#r42formatConvertUI')) return;
    
    let panelTitle = 'Roam<sup>42</sup> Format Converter (Experimental)';
    
    jsPanel.create({
      id: 'r42formatConvertUI',
      headerControls: { maximize: 'remove'},
      headerTitle: `<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:300px;color:white !important;padding-top:2px;">${panelTitle}</div>`,
      iconfont: [
        'bp3-button bp3-minimal bp3-small bp3-icon-small-minus', 
        'bp3-button bp3-minimal bp3-small bp3-icon-chevron-down',  
        'bp3-button bp3-minimal bp3-small bp3-icon-chevron-up', 
        'custom-maximize', 
        'bp3-button bp3-minimal bp3-small bp3-icon-cross'
      ],      
      contentSize: { width: () => window.innerWidth * 0.7, height: () => window.innerHeight * 0.4 },
      theme: 'light',
      contentOverflow: 'hidden',
      onwindowresize: true,
      dragit: { containment: 10, snap: { containment: true, repositionOnSnap: true } },
      position: { my: 'center-bottom', at: 'center-bottom', offsetX: +10, offsetY: -10 },
      content: `
      <div style="padding:10px">
        Output format: 
        <select id="r42formatConverterSelection" onchange="roam42.formatConverterUI.changeFormat()">
          <option value="puretext_Space">Text with space indentation</option>
          <option value="puretext_Tab">Text with tab indentation</option>
          <option value="pureText_NoIndentation">Text with no indentation</option>
          <option value="markdown_Github">GitHub Flavored Markdown</option>
          <option value="html_Simple">HTML</option>
        </select>
        <div style="float:right"><div title="Refresh view based on current page" class="bp3-button bp3-minimal bp3-small bp3-icon-refresh" onclick="roam42.formatConverterUI.changeFormat()"></div></div>
        <div style="float:right"><div title="Copy to clipboard" class="bp3-button bp3-minimal bp3-small bp3-icon-clipboard" onclick="roam42.formatConverterUI.copyToClipboard()"></div></div>
        <div style="float:right"><div title="Save to a file" class="bp3-button bp3-minimal bp3-small bp3-icon-floppy-disk"  onclick="roam42.formatConverterUI.saveToFile()"></div></div>
      </div>
      <div style="margin-left:10px;margin-right:10px;height:90%;">
        <textarea id='formatConverterUITextArea' style="font-family: monospace;width:100%;height:100%;"></textarea>
      </div>
      `,
          callback: async function () {
            formatConverterUITextArea = document.getElementById('formatConverterUITextArea'); 
            setTimeout(async ()=>{
              // document.querySelector('#r42formatConvertUI').style.backgroundColor='red !important';
              roam42.formatConverterUI.changeFormat()
            }, 100)
          },
        })    
      } //END roam42.formatConverterUI.show
  
  roam42.formatConverterUI.htmlview = async ()=> {
//     var roam42PrintViewPageUID = await roam42.common.getPageUidByTitle('Roam42 Settings');
//     if(roam42PrintViewPageUID) {
//       let blocks = await roam42.common.getBlockInfoByUID(roam42PrintViewPageUID, true);
//       console.log(blocks)
//       for(var b in blocks[0][0].children) {
//         console.log(blocks[0][0].children[b])
//         if(blocks[0][0].children[b].string.includes('PrintPreviewCSS')){
          
//         };
//       }
//     }
    var uid = await roam42.common.currentPageUID();
    var md =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.markdownGithub );   
    marked.setOptions({
      gfm: true,
      xhtml: false
    });
    var results = marked(md);
    var winPrint = await window.open('','','left=50,top=100,width=1000,height=600,toolbar=0,scrollbars=0,status=0');
    winPrint.document.write(results);        
    setTimeout(()=>{
      const addElementToPage = (element, tagId, typeT )=> {
        Object.assign(element, { type:typeT, async:false, tagId:tagId } );
        winPrint.document.getElementsByTagName('head')[0].appendChild(element);  
      }
      const addCSSToPage = (tagId, cssToAdd)=> {
        addElementToPage(Object.assign(winPrint.document.createElement('link'),{href:cssToAdd, rel: 'stylesheet'} ) , tagId, 'text/css');
      }
     addCSSToPage('myStyle', roam42.host + 'css/markdown/default.css');  
     winPrint.document.title = "Roam42 Viewer"
    }, 50)
  }
  
  window.roam42.formatConverterUI.testingReload = ()=>{
    if(document.querySelector('#r42formatConvertUI')) document.querySelector('#r42formatConvertUI').remove();
    roam42.loader.addScriptToPage( 'formatConverter', 	roam42.host + 'ext/formatConverter.js');
    roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');
    setTimeout(async ()=>{
     // roam42.formatConverterUI.show()
      roam42.formatConverterUI.htmlview()
    }, 500)  
  }   

})();
  
