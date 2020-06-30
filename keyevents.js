/* global hotkeys, typeaheadDisplayTextArea,typeaheadDisplayOtherAreas, 
testingScript, TurndownService , turndownPage, setEmptyNodeValue  */

//based on the libary https://wangchujiang.com/hotkeys/

var testingScript = 'https://roammonkey.glitch.me/commonFunctions.js'


//CONFIGURE SHORTCUT KEYS for use in the application


function loadKeyEvents() {

  //In a textarea will insert a template of text
  hotkeys('alt+shift+u', function(event, handler) {
    event.preventDefault()
    if (event.srcElement.localName == "textarea") {
      setEmptyNodeValue(document.getElementById(event.srcElement.id), '{{[[TODO]]}} #urgent  ' + event.target.value)
      document.getElementById(event.srcElement.id).focus()
    }
  });

  //In a textarea will strike out text
  hotkeys('alt+t', function(event, handler) {
    event.preventDefault()
    if (event.srcElement.localName == 'textarea') {
      console.log(event.srcElement.id);

      if (document.queryCommandSupported("insertText")) {
        if (window.getSelection().toString() == "") {
          setEmptyNodeValue(document.getElementById(event.srcElement.id), "~~" + event.srcElement.innerHTML + "~~")
        } else {
          document.execCommand(
            "insertText",
            false,
            "~~" + window.getSelection().toString() + "~~"
          );
        }
      }
    }
  });

  
  
  //alt+.  - in a textarea will pull up the search box
  hotkeys('alt+.', function(event, handler) {
    event.preventDefault()
      if(event.srcElement.localName=='textarea') {
        typeaheadDisplayTextArea(event.srcElement.id);
      } else {
        typeaheadDisplayOtherAreas()
      }
  });


  //convert page to markdown
  hotkeys('alt+m', function(event, handler) {
    console.log('alt+m');
    turndownPage()    
  });
  
  //RELOAD SCRIPT defined here
  hotkeys('alt+q', function(event, handler) {
    console.log('alt+q');
    $.getScript(testingScript)
      .done(function(script, textStatus) {
        console.log(textStatus);
      })
      .fail(function(jqxhr, settings, exception) {
        $('div.log').text('Triggered ajaxError handler.');
      });
  });

  //allow support for textarea editing
  hotkeys.filter = function(event) {
    var tagName = (event.target || event.srcElement).tagName;
    hotkeys.setScope(
      /^(INPUT|TEXTAREA|SELECT)$/.test(tagName) ? 'input' : 'other'
    );
    return true;
  };
}