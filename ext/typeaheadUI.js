/* global Bloodhound, displayDataInToast, insertDataIntoNode, typeaheadQueryURL, typeaheadResult, typeaheadDisplayField */

/* 
   Library that provides dynamic search is based on https://twitter.github.io/typeahead.js

   See typeaheadData.js for the data implementation. The UI and Data are  partially seperated to 
   make it easier for others to configure the data portion to the specifics of their REST API 
*/

var currentTextArea=''

// This function displays the search ui
// Called by keyevents.js based on defined keystrokes. 
const typeaheadDisplayTextArea = srcElementId =>	{
    currentTextArea = srcElementId 
    $('#rmSearch').show()
    $('#rmSearchBox').focus()
}

const typeaheadDisplayOtherAreas = () =>	{
    currentTextArea = 'OTHERAREAS' 
    $('#rmSearch').show()
    $('#rmSearchBox').focus()
}

var loadTypeAhead = () =>  {
	$(document.body).append(`
    <div id="rmSearch">
      <input class="typeahead" id="rmSearchBox" type="text" placeholder="search"></input>
    </div>
  `.trim() )

	$('#rmSearch .typeahead').typeahead(null, {
	  name: 'mySearch', 
    display: typeaheadDisplayField,
	  source: new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace(''),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: {
                  url: typeaheadQueryURL ,   //defined in typeaheadData.js
                  wildcard: '%QUERY'
                }
    }),
	  templates: { suggestion: function(d) {  return typeaheadResult(d) }} //defined in typeaheadData.js   
	})

	$('.typeahead').bind('typeahead:select', function(ev, data) {
        if( currentTextArea == 'OTHERAREAS' ) { 
          displayDataInToast(data)
        } else { 
          insertDataIntoNode(currentTextArea, data)
        }
  })

	$('.typeahead').bind('typeahead:close', function(ev, data) {
      $('.typeahead').typeahead('val', '')
      $('#rmSearch').hide()      
	})

}