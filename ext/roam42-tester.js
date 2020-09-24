console.log('init tester')
function roam42Test(ev){
  blockDuplicate(ev)
}

function blockDelete(block) {
  if (block.localName == "textarea") {
    roam42KeyboardLib.pressEsc().then(() => roam42KeyboardLib.pressBackspace())
  }
}

function blockInsertBelow(block){
  //Block is the HTMLElement of the currently selected block  
  if (block.localName == "textarea") {
    block.selectionStart = block.value.length;
    block.selectionEnd   = block.value.length;
    roam42KeyboardLib.pressEnter()      
  }
}

function blockInsertAbove(block){
  //Block is the HTMLElement of the currently selected block  
  if (block.localName == "textarea") {
    var blockEmpty =  block.value.length>0 ? false : true;
    block.selectionStart =0;
    block.selectionEnd = 0;
    roam42KeyboardLib.pressEnter()      
    if(blockEmpty){setTimeout(()=>{ roam42KeyboardLib.simulateKey(38) },50) };  //up arrow
  }
}


Mousetrap.unbind('alt+shift+5');
Mousetrap.bind('alt+shift+5', (event, handler)=>{
  try {  
  } catch(e) {}  
  addScriptToPage( 'roam42Tester',      URLScriptServer + 'ext/roam42-tester.js'    )
  setTimeout( ()=>{
    roam42Test(event)
  }, 300)
  return false
})

