function roam42Test(){
    livePreviewStatusToast()    
}

//load feature code
Mousetrap.unbind('alt+shift+4');
Mousetrap.bind('alt+shift+4', ()=>{
  try {  
  } catch(e) {}  
  addScriptToPage( 'roam42Tester',      URLScriptServer + 'ext/roam42-tester.js'    )
  setTimeout( ()=>{
    roam42Test()
  }, 300)
  return false
})

