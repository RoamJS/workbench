/* globals Mousetrap */

const loadAutoComplete = ()=> {

  Mousetrap(document.getElementById("find-or-create-input")).bind('shift+space',()=>{
    setTimeout(()=>{
      simulateMouseClick ( document.querySelectorAll('.rm-search-title')[1] )
    },200)
    return false
  })

  Mousetrap(document.getElementById("textarea.rm-block-input")).bind('shift+space',()=>{
    if(document.querySelector(".bp3-elevation-3")){
      setTimeout(()=>{
        if( document.querySelector('.rm-autocomplete-result').parentElement.childElementCount > 1) {
          document.querySelector(".bp3-elevation-3").childNodes[1].click()        
        } else {
          document.querySelector(".bp3-elevation-3").childNodes[0].click()  
        }
        setTimeout(()=> document.execCommand("insertText",false," "),100)
      },200)
      return false
    }
  })
  
}

