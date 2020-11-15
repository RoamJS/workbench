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

  roam42.smartBlocks.getRandomBlocks = async (textToProcess)=> {
    var randomBlockParam = textToProcess.replace('<%RANDOMBLOCK:','').replace('%>','').trim();

    const isPage = randomBlockParam => {
    	var page_exists = roam42.common.pageExists(randomBlockParam);
    	if (page_exists) { 
    		return true;
    	}

    	return false;
    }

  	if (randomBlockParam == '') {
    	result =  '((' + await roam42.common.getRandomBlock(1) + '))'
    	return result;
  	}

  	if (isPage(randomBlockParam)) {
    	result =  await roam42.common.getRandomBlockRefferingToPage(randomBlockParam);
    	return result;
  	}

    return '((' + await roam42.common.getRandomBlock(1) + '))'
  }
  
  window.roam42.smartBlocks.testingReloadRandomBlocks = () => {
    roam42.loader.addScriptToPage( "smartBlocksRB", roam42.host + 'ext/smartBlocksRB.js');
  };
})();
