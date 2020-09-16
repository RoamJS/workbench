/* globals Mousetrap, Cookies, simulateMouseClick, iziToast  */

const getAutoComplete_IsEnabled = ()=>{
  if( Cookies.get('AutoComplete_IsEnabled') === 'false' ) {
    return false
  } else {
    return true
  }
}

const setAutoComplete_IsEnabled = (val)=>{
  if(val == true) {
    Cookies.set('AutoComplete_IsEnabled', 'true') 
  } else {
    Cookies.set('AutoComplete_IsEnabled', 'false')     
  }
}

const autoCompleteStatusToast = ()=> {
  var status = getAutoComplete_IsEnabled()
  iziToast.show({
    timeout: 20000,
    theme: 'dark',
    title: 'Autocomplete',
    message: 'Status:',
    position: 'bottomRight', 
    progressBarColor: 'rgb(0, 255, 184)',
    buttons: [
    ['<button>Enabled</button>', function (instance, toast) {
        setAutoComplete_IsEnabled(true)
        instance.hide({transitionOut: 'fadeOutUp'}, toast, 'buttonName');
        iziToast.show({
          message: `Please refresh the browser window for the change to take effect`,
          theme: 'dark',
          progressBar: true,
          animateInside: true,
          close: false,  
          timeout: 10000,  
          closeOnClick: true,  
          displayMode: 2  
        })          
    }, status], 
    ['<button>Disabled</button>', function (instance, toast) {
        setAutoComplete_IsEnabled(false)
        instance.hide({transitionOut: 'fadeOutDown'}, toast, 'buttonName');
        setTimeout( ()=>{
          iziToast.show({
            message: `Please refresh the browser window for the change to take effect`,
            theme: 'dark',
            progressBar: true,
            animateInside: true,
            close: false,  
            timeout: 10000,  
            closeOnClick: true,  
            displayMode: 2  
          })          
        },500)
    }, !status], 
    ]
  })  
}


const loadAutoComplete = ()=> {
  if(getAutoComplete_IsEnabled() == true ) {
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
}

