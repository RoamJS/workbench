function roam42Test(){
  dailyNotePoupStatusToast()  
}


function dailyNotePoupStatusToast() {
  iziToast.show({
    timeout: 20000,
    theme: 'dark',
    title: 'Daily Notes Popup',
    message: 'Use this if the Daily Notes Popup stops appearing',
    position: 'bottomRight', 
    progressBarColor: 'rgb(0, 255, 184)',
    buttons: [
      ['<button>Reset Window</button>', function (instance, toast) {
        dailyNotesPopup2=''
        Cookies.remove('DNP_Parameters_Dimensions')
        instance.hide({transitionOut: 'fadeOutUp'}, toast, 'buttonName') 
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
      }, false]
    ]
  })
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

