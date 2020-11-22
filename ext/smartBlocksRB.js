/* globals roam42 */

(() => {

  roam42.smartBlocks.getRandomPage = async () => {
  	var page = await roam42.common.getRandomPage(1);
    return "[[" + page[0][0] + "]]";
  }

  roam42.smartBlocks.getRandomBlocksFrom = async (textToProcess) => {
    var paramter = textToProcess.replace('<%RANDOMBLOCKFROM:','').replace('%>','').trim();

    var result = "";
    if (await roam42.common.isPage(paramter)) {
      var result = await roam42.common.getRandomBlockFromPage(paramter);
    }

    if (await roam42.common.isBlockRef(paramter)) {
      return await roam42.common.getRandomBlockFromBlock(paramter);
    }

    return result;
  }

  roam42.smartBlocks.getRandomBlocksMention = async (textToProcess) => {
    var paramter = textToProcess.replace('<%RANDOMBLOCKMENTION:','').replace('%>','').trim();
    var result = "";
    if (await roam42.common.isPage(paramter)) {
      return await roam42.common.getRandomBlockMentioningPage(paramter);
    }

    if (await roam42.common.isBlockRef(paramter)) {
      return await roam42.common.getRandomBlockMentioningBlockRef(paramter);
    }

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
