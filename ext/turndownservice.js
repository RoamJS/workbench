/* globals TurndownService */

// Uses the javscript library from https://github.com/domchristie/turndown
// creates a very simply markdown file based on the current view



function turndownPage() {
  var turndownService = new TurndownService({
    blankReplacement: function() {
      return '';
    }
  });
  turndownService.addRule('h1', {
    filter: ['h1'],
    replacement: (content)=> {
      return '\n\r' + content.replace(/(\r\n|\n|\r)/gm, '') + '\n=============';
    }
  });
  turndownService.addRule('h2', {
    filter: ['h2'],
    replacement: function(content) {
      return '\n\r' + content.replace(/(\r\n|\n|\r)/gm, '') + '\n-----';
    }
  });
  turndownService.addRule('h3', {
    filter: ['h3'],
    replacement: function(content) {
      return '\n\r### '  + content.replace(/(\r\n|\n|\r)/gm, '') + '\n  ';
    }
  });

  var markdown = turndownService.turndown($('div.roam-article div').prop('outerHTML'));
  var winPrint = window.open(
    '',
    '',
    'left=0,top=0,width=800,height=600,toolbar=0,scrollbars=0,status=0'
  );
  winPrint.document.write(
    '<pre>' + markdown.replace(/(\n)/gm, '\n') + '</pre>'
  );
  winPrint.document.close();
}
