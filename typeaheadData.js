/* globals insertAtCaret, toastr */

//this is a test API based on the wordnet DB. This illustrates calling into a REST API

var typeaheadQueryURL = 'https://wordnet.glitch.me/query?search=%QUERY'
var typeaheadDisplayField = 'word'

function typeaheadResult(d) {
  return   '<div class="th-item">' +
              '<div class="th-term">'  +   d.word         + '</div>' +
              '<div class="th-def">'   +   d.definition   + '</div>'  +
          '</div>'
} 

function displayDataInToast(d) {
    toastr.info(d.definition, d.word + ' (' + d.type + ')' )
}

function insertDataIntoNode(currentTextArea, d) {
  var insertVal =  '**' + d.word + '** (' + d.type + ') \n'  + d.definition
  insertAtCaret(currentTextArea, insertVal)
}