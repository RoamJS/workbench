/* globals roam42, jsPanel */

// roam42.tutorials 
(()=>{
  
  roam42.tutorials = {};
  
  roam42.tutorials.show = ()=> {
    // if already open, do nothing
    if(document.querySelector('#r42Tutorials')) return;
    
    jsPanel.create({
      id: 'r42Tutorials',
      headerControls: {
        maximize: 'remove'
      },
      headerTitle: '<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:300px;color:white !important;padding-top:2px;">Tutorials for Roam<sup>42</sup> and Roam</div>',
      iconfont: [
        'bp3-button bp3-minimal bp3-small bp3-icon-small-minus', 
        'bp3-button bp3-minimal bp3-small bp3-icon-chevron-down',  
        'bp3-button bp3-minimal bp3-small bp3-icon-chevron-up', 
        'custom-maximize', 
        'bp3-button bp3-minimal bp3-small bp3-icon-cross'
      ],
      contentSize: {
        width:  590,
        height: 550
      },
      // resizeit: {
      //   disable: true
      // },
      theme: 'light',
      contentOverflow: 'hidden',
      content: '<iframe src="https://roam-quickref.glitch.me/tutorials.html" id="iframeRoam42Tutorials" style="width:100%; height:100%;"></iframe>',
      onwindowresize: true,
      dragit: {
        containment: 10,
        snap: {
          containment: true,
          repositionOnSnap: true
        }
      },
      position: {
        my: 'left-bottom',
        at: 'left-bottom',
        offsetX: +10, 
        offsetY: -10 
      }
    })    

  }
  
  

  roam42.tutorials.testingReload = ()=>{
    try {  
      document.querySelector('#r42Tutorials').remove()
    } catch(e) {}  
    roam42.loader.addScriptToPage( 'roam42Tutorials',  roam42.host + 'ext/tutorials.js'    )
    setTimeout(()=>{
        roam42.tutorials.show() 
    }, 500)
  }
  
})();
