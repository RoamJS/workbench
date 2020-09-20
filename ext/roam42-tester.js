//console.log('init tester')
function roam42Test(){
navigator.clipboard.readText().then(clipText => 
  navigator.clipboard.writeText(`[*](${clipText})`)
);
}



Mousetrap.unbind('alt+shift+5');
Mousetrap.bind('alt+shift+5', (event, handler)=>{
  try {  
  } catch(e) {}  
  addScriptToPage( 'roam42Tester',      URLScriptServer + 'ext/roam42-tester.js'    )
  setTimeout( ()=>{
    roam42Test()
  }, 300)
  return false
})

