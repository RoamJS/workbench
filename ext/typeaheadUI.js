/* global roam42, Bloodhound, displayDataInToast, insertDataIntoNode, typeaheadQueryURL, typeaheadResult, typeaheadDisplayField */

/*
   Library that provides dynamic search is based on https://twitter.github.io/typeahead.js

   See typeaheadData.js for the data implementation. The UI and Data are  partially seperated to
   make it easier for others to configure the data portion to the specifics of their REST API
*/

// roam42.typeAhead
(()=>{

  roam42.typeAhead = {};

  roam42.typeAhead.currentTextArea=''

  roam42.typeAhead.typeAheadLookup = ()=> {
    if(event.srcElement.localName=='textarea') {
      roam42.typeAhead.typeaheadDisplayTextArea(event.srcElement.id);
    } else {
      roam42.typeAhead.typeaheadDisplayOtherAreas();
    }
  }

  // This function displays the search ui
  // Called by keyevents.js based on defined keystrokes.
  roam42.typeAhead.typeaheadDisplayTextArea = srcElementId =>	{
      roam42.typeAhead.currentTextArea = srcElementId ;
      $('#rmSearch').show();
      $('#rmSearchBox').focus();
  }

  roam42.typeAhead.typeaheadDisplayOtherAreas = () =>	{
      roam42.typeAhead.currentTextArea = 'OTHERAREAS';
      $('#rmSearch').show();
      $('#rmSearchBox').focus();
  }

  roam42.typeAhead.loadTypeAhead = () =>  {
    $(document.body).append(`
      <div id="rmSearch">
        <input class="typeahead" id="rmSearchBox" type="text" placeholder="search"></input>
      </div>
    `.trim() );

    $('#rmSearch .typeahead').typeahead(null, {
      name: 'mySearch',
      display: roam42.typeAhead.typeaheadDisplayField,
      source: new Bloodhound({
                  datumTokenizer: Bloodhound.tokenizers.obj.whitespace(''),
                  queryTokenizer: Bloodhound.tokenizers.whitespace,
                  remote: {
                    url: roam42.typeAhead.typeaheadQueryURL ,   //defined in typeaheadData.js
                    wildcard: '%QUERY'
                  }
      }),
      templates: { suggestion: function(d) {  return roam42.typeAhead.typeaheadResult(d) }} //defined in typeaheadData.js
    });

    $('.typeahead').bind('typeahead:select', function(ev, data) {
          if( roam42.typeAhead.currentTextArea == 'OTHERAREAS' ) {
            roam42.typeAhead.displayDataInToast(data)
          } else {
            roam42.typeAhead.insertDataIntoNode(roam42.typeAhead.currentTextArea, data)
          }
    });

    $('.typeahead').bind('typeahead:close', function(ev, data) {
        $('.typeahead').typeahead('val', '')
        $('#rmSearch').hide()
    });

  }


})();