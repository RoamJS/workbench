 /* globals roam42, Mousetrap, jsPanel, displayMessage */

//TODO
// Find all block refs and convert them to their nomral output

(()=>{
  roam42.formatConverterUI = {};
  
  let formatConverterUITextArea = null;
  
  roam42.formatConverterUI.changeFormat = async ()=> {
    var uid = await roam42.common.currentPageUID();
    switch(document.getElementById('r42formatConverterSelection').value) {
      case 'puretext_Tab':
        formatConverterUITextArea.value =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.pureText_TabIndented );    
        break;
      case 'puretext_Space':
        formatConverterUITextArea.value =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.pureText_SpaceIndented );    
        break;
      case 'markdown_Github':
        formatConverterUITextArea.value =  await roam42.formatConverter.iterateThroughTree(uid, roam42.formatConverter.formatter.markdownGithub );    
        break;
    }
  }  
  
  roam42.formatConverterUI.copyToClipboard = async ()=> {
    navigator.clipboard.writeText( formatConverterUITextArea.value );
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
    if(document.querySelector('#r42Markdown')) return;
    
    let panelTitle = 'Roam<sup>42</sup> Format Converter (Experimental)';
    
    jsPanel.create({
      id: 'r42Markdown',
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
    <option value="puretext_Space">Text with space indent</option>
    <option value="puretext_Tab">Text with tab indent</option>
    <option value="markdown_Github">GitHub Flavored Markdown</option>
  </select>
  <div style="float:right"><button onclick="roam42.formatConverterUI.changeFormat()">Refresh</button></div>
  <div style="float:right"><button onclick="roam42.formatConverterUI.copyToClipboard()">Copy</button></div>
  <div style="float:right"><button onclick="roam42.formatConverterUI.saveToFile()">Save to File</button></div>
</div>
<div style="margin-left:10px;margin-right:10px;height:90%;background-color:red">
  <textarea id='formatConverterUITextArea' style="font-family: monospace;width:100%;height:100%;"></textarea>
</div>
`,
    callback: async function () {
      formatConverterUITextArea = document.getElementById('formatConverterUITextArea'); 
      setTimeout(async ()=>{
        roam42.formatConverterUI.changeFormat()
      }, 100)
    },
  })    
} //END roam42.formatConverterUI.show

  
  window.roam42.formatConverterUI.testingReload = ()=>{
    roam42.loader.addScriptToPage( 'formatConverter', 	roam42.host + 'ext/formatConverter.js');
    roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');
    setTimeout(async ()=>{
      roam42.formatConverterUI.show()
    }, 500)  
  }   

})();
  
