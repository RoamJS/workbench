/* globals roam42, insertAtCaret, iziToast */

//this is a test API based on the wordnet DB. This illustrates calling into a REST API

(()=>{

  roam42.typeAhead.typeaheadQueryURL = 'https://wordnet.glitch.me/query?search=%QUERY'
  roam42.typeAhead.typeaheadDisplayField = 'word'

  roam42.typeAhead.typeaheadResult = d => {
    return   `<div class="th-item">
                <div class="th-term"> ${d.word}       </div>
                <div class="th-def">  ${d.definition} </div> 
            </div>`    
  } 

  roam42.typeAhead.displayDataInToast = d => { 
    let display = `<b>${d.word}</b><br/> ${d.definition}`
    iziToast.show({
      message:  display,
      progressBar: true,
      animateInside: true,
      close: true,
      maxWidth:250,
      timeout: 60000,
      closeOnClick: true,
      displayMode: 2
    });  

  }

  roam42.typeAhead.insertDataIntoNode = (currentTextArea, d) => {
    roam42.common.insertAtCaret(currentTextArea, `**${d.word}** (${d.type})\n ${d.definition}` );
  }

})();