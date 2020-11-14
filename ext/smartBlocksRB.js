/* globals roam42, roam42KeyboardLib, Tribute */

(() => {

  roam42.smartBlocks.randomBlocks = async (textToProcess)=> {
    return '((' + await roam42.common.getRandomBlock(1) + '))'
  }
  
  window.roam42.smartBlocks.testingReloadRandomBlocks = () => {
    roam42.loader.addScriptToPage( "smartBlocksRB", roam42.host + 'ext/smartBlocksRB.js');
  };
})();
