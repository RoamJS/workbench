/* globals roam42, roam42KeyboardLib, Tribute */

(() => {

  roam42.smartBlocks.getRandomPage = async () => {
  	var page = await roam42.common.getRandomPage(1);
    return await "[[" + page[0][0] + "]]";
  }

  roam42.smartBlocks.getRandomBlocksFromPage = async (textToProcess) => {
    var page_title = textToProcess.replace('<%RANDOMBLOCKFROMPAGE:','').replace('%>','').trim();
  	result = await roam42.common.getRandomBlockFromPage(page_title);
  	return result;
  }

  roam42.smartBlocks.getRandomBlocksMentioningPage = async (textToProcess) => {
    var page_title = textToProcess.replace('<%RANDOMBLOCKMENTION:','').replace('%>','').trim();
  	result = await roam42.common.getRandomBlockMentioningPage(page_title);
  	return result;
  }

  roam42.smartBlocks.getRandomBlocks = async (textToProcess)=> {
    var randomBlockParam = textToProcess.replace('<%RANDOMBLOCK:','').replace('%>','').trim();
    return '((' + await roam42.common.getRandomBlock(1) + '))'
  }
  
  window.roam42.smartBlocks.testingReloadRandomBlocks = () => {
    roam42.loader.addScriptToPage( "smartBlocksRB", roam42.host + 'ext/smartBlocksRB.js');
  };
})();
