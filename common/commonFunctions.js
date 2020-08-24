// updates an empty text area with a new value. This function does some additional work
// because the textarea in roam is managed by React component, and it wasn't being triggered to 
// update when inserting a value
const setEmptyNodeValue = (element, value) => {
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
const insertAtCaret = (areaId, text) => {
  var txtarea = document.getElementById(areaId)
  var scrollPos = txtarea.scrollTop
  var strPos = 0
  var br =
    txtarea.selectionStart || txtarea.selectionStart == '0'
      ? 'ff'
      : document.selection
      ? 'ie'
      : false;
  if (br == 'ie') {
    txtarea.focus()
    var range = document.selection.createRange()
    range.moveStart('character', -txtarea.value.length)
    strPos = range.text.length;
  } else if (br == 'ff') strPos = txtarea.selectionStart

  var front = txtarea.value.substring(0, strPos)
  var back = txtarea.value.substring(strPos, txtarea.value.length)
  setEmptyNodeValue(txtarea, front + text + back)
  setTimeout( ()=> {
      strPos = strPos + text.length
      if (br == 'ie') {
        txtarea.focus()
        var range = document.selection.createRange()
        range.moveStart("character", -txtarea.value.length)
        range.moveStart("character", strPos)
        range.moveEnd("character", 0)
        range.select()
      } else if (br == 'ff') {
        txtarea.selectionStart = strPos
        txtarea.selectionEnd = strPos
        txtarea.focus()
      }
      txtarea.scrollTop = scrollPos
    }, 100)
}
