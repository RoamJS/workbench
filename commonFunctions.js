//Inserts text at the current cursor location in a textara
function insertAtCaret(areaId,text) {
  var txtarea = document.getElementById(areaId);
  var scrollPos = txtarea.scrollTop;
  var strPos = 0;
  var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
    "ff" : (document.selection ? "ie" : false ) );
  if (br == "ie") { 
    txtarea.focus();
    var range = document.selection.createRange();
    range.moveStart ('character', -txtarea.value.length);
    strPos = range.text.length;
  }
  else if (br == "ff") strPos = txtarea.selectionStart;

  var front = (txtarea.value).substring(0,strPos);  
  var back = (txtarea.value).substring(strPos,txtarea.value.length); 
  txtarea.value=front+text+back;
  strPos = strPos + text.length;
  if (br == "ie") { 
    txtarea.focus();
    var range = document.selection.createRange();
    range.moveStart ('character', -txtarea.value.length);
    range.moveStart ('character', strPos);
    range.moveEnd ('character', 0);
    range.select();
  }
  else if (br == "ff") {
    txtarea.selectionStart = strPos;
    txtarea.selectionEnd = strPos;
    txtarea.focus();
  }
  txtarea.scrollTop = scrollPos;
}

// Insert text inot a textarea field, which is used by roam
// for editing nodes in your outline
function insertIntoNode(textareaID, str) {
  console.log('insertIntoNode')
  var el = document.getElementById(textareaID)
  console.log(el.tagName)
  
  //not sure why, but I can't get the node to accept new text so easily, this is what I ended up with
  if ( el.textContent == '') {
    el.textContent = str
    el.dispatchEvent(new Event('input', { 'bubbles': true }))
    el.scrollTop = el.scrollHeight; 
    setTimeout(function(){ 
      el.value = el.value 
      el.select(); 
      el.selectionStart = el.selectionEnd;
      el.dispatchEvent(new Event('input', { 'bubbles': true }))
    }, 100); 
  } else {
    //this doesn't totally work. requires typing some characater after insert or enter
//    el.value = el.textContent + str
    insertAtCaret(textareaID, str)
    el.dispatchEvent(new Event('input', { 'bubbles': true }));
  } 
 
}
