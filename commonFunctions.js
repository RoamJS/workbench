console.log("loading com fun");

function setEmptyNodeValue (element, value) {
  
    const e = new Event('input', { bubbles: true })
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set
    const prototype = Object.getPrototypeOf(element)
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      'value'
    ).set

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value)
    } else {
      valueSetter.call(element, value)
    }
  element.dispatchEvent(e)
}

//Inserts text at the current cursor location in a textara
function insertAtCaret(areaId, text) {
  var txtarea = document.getElementById(areaId);
  var scrollPos = txtarea.scrollTop;
  var strPos = 0;
  var br =
    txtarea.selectionStart || txtarea.selectionStart == "0"
      ? "ff"
      : document.selection
      ? "ie"
      : false;
  if (br == "ie") {
    txtarea.focus();
    var range = document.selection.createRange();
    range.moveStart("character", -txtarea.value.length);
    strPos = range.text.length;
  } else if (br == "ff") strPos = txtarea.selectionStart;

  var front = txtarea.value.substring(0, strPos);
  var back = txtarea.value.substring(strPos, txtarea.value.length);
  txtarea.value = front + text + back;
  strPos = strPos + text.length;
  if (br == "ie") {
    txtarea.focus();
    var range = document.selection.createRange();
    range.moveStart("character", -txtarea.value.length);
    range.moveStart("character", strPos);
    range.moveEnd("character", 0);
    range.select();
  } else if (br == "ff") {
    txtarea.selectionStart = strPos;
    txtarea.selectionEnd = strPos;
    txtarea.focus();
  }
  txtarea.scrollTop = scrollPos;
}

// Insert text inot a textarea field, which is used by roam
// for editing nodes in your outline
function insertIntoNode(textareaID, str) {
  console.log("insertIntoNode");
  var el = document.getElementById(textareaID);
  
  //not sure why, but I can't get the node to accept new text so easily, this is what I ended up with
  if (el.textContent == "") {
    setEmptyNodeValue(el, str)
    el.focus()
  } else {
    //this doesn't totally work. requires typing some characater after insert or enter
    //    el.value = el.textContent + str
    insertAtCaret(textareaID, str);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
