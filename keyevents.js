/* global hotkeys, typeaheadDisplayTextArea,typeaheadDisplayOtherAreas, TurndownService , turndownPage*/

//based on the libary https://wangchujiang.com/hotkeys/


//CONFIGURE SHORTCUT KEYS for use in the application

function loadKeyEvents() {
  
  //alt+.  - in a textarea will pull up the search box
  hotkeys("alt+.", function(event, handler) {
    console.log("alt+.", event.srcElement.localName);
      if(event.srcElement.localName=='textarea') {
        typeaheadDisplayTextArea(event.srcElement.id);
      } else {
        typeaheadDisplayOtherAreas()
      }
  });

  //alt+t  - in a textarea will insert a template of text
  hotkeys("alt+t", function(event, handler) {
    console.log("alt+t");
    if (event.srcElement.localName == "textarea") {
      event.target.value = "{{[[TODO]]}} #urgent  " + event.target.value;
    }
  });

  //convert page to markdown
  hotkeys("alt+m", function(event, handler) {
    console.log("alt+m");
    turndownPage()    
  });
  
  //RELOAD SCRIPT defined here
  hotkeys("alt+q", function(event, handler) {
    console.log("alt+q");
    $.getScript(testingScript)
      .done(function(script, textStatus) {
        console.log(textStatus);
      })
      .fail(function(jqxhr, settings, exception) {
        $("div.log").text("Triggered ajaxError handler.");
      });
  });

  //allow support for textarea editing
  hotkeys.filter = function(event) {
    var tagName = (event.target || event.srcElement).tagName;
    hotkeys.setScope(
      /^(INPUT|TEXTAREA|SELECT)$/.test(tagName) ? "input" : "other"
    );
    return true;
  };
}