/* globals roam42, Mousetrap,getPageUidByTitle, marked*/
/* Contributor: https://twitter.com/leekeifon1 */

(() => {
  roam42.focusMode = {};

  let focusModeStates = readSetting();
  let focusModeStatesIdx = 0; // using mod.

  roam42.focusMode.keyboardHandler = ev => {
    if (window != window.parent) { return; }
    if (ev.metaKey && ev.shiftKey && ev.code == "BracketLeft") {
      focusModeStatesIdx = ((focusModeStatesIdx + focusModeStates.length) - 1) % focusModeStates.length;
      updateFocusMode();
      return false;
    }
    else if (ev.metaKey && ev.shiftKey && ev.code == "BracketRight"){
      focusModeStatesIdx = ((focusModeStatesIdx + focusModeStates.length) + 1) % focusModeStates.length;
      updateFocusMode();
      return false;
    }
  };

  roam42.focusMode.active = () => {return false;};
  
  roam42.focusMode.toggle = () => {};

  function readSetting(name=null, initial=null) {
      return [['nothing'], 
      ['current'],
      ['current', 'children'],
      ['current', 'parent', 'children']]; // todo: for now, it's a fixed cyclic logic.
    }

  const updateFocusMode = (mutationsList=null) => { 
    if(mutationsList !== null && mutationsList[0].target.tagName === "TEXTAREA"){
      return;
    }  
    const text_area = document.querySelector("textarea.rm-block-input.rm-block-text");      
      var currentBlock = null;
      if (text_area !== null) {
        currentBlock = text_area.parentNode.parentNode.parentNode.parentNode;
        removeFocusModeClass();
        setFocusModeClass(selectBlocksByFocusModeState(currentBlock));
      } else {
        removeFocusModeClass();
      }
      
  };

const findParent = (currentBlock) => {
  var parentList = [];
  var parent = currentBlock.parentNode.parentNode.querySelector("div").querySelector(".roam-block");
  if(parent){
    parentList.push(parent);
  }
  return parentList;

}

const findSiblings = (currentBlock) => {
  var siblings = [];
  var prev_sibs = [];
  var next_sibs = [];
  var prev_sib = currentBlock;
  var next_sib = currentBlock;
  do {
    if(prev_sib){
      prev_sib = prev_sib.previousSibling;
      if(prev_sib){
        prev_sibs.push(prev_sib.querySelector('div').querySelector(".roam-block"));
      }
    }
    if(next_sib){
      next_sib = next_sib.nextSibling;
      if(next_sib){
        next_sibs.push(next_sib.querySelector('div').querySelector(".roam-block"));
      }
    }
   } while (prev_sib != null || next_sib != null);
  siblings = prev_sibs.concat(next_sibs);
  return siblings;
}

const findChildren = (currentBlock) => {
  var firstChildBlock = currentBlock.querySelector('.roam-block-container');
  var childrenBlocks = [];
  if(firstChildBlock){
    childrenBlocks.push(firstChildBlock.querySelector('div').querySelector(".roam-block"));
    var siblings = findSiblings(firstChildBlock);
    childrenBlocks = childrenBlocks.concat(siblings);  
  }
  return childrenBlocks;
}


const selectBlocksByFocusModeState = (currentBlock) => {
  var relatedBlocks = {};
  if(currentBlock) {
    var focusModeState = focusModeStates[focusModeStatesIdx];
    focusModeState.forEach(blockType => {
      switch (blockType) {
        case "nothing":
          relatedBlocks[blockType] = null;
          break;
        case "current":
          relatedBlocks[blockType] = [currentBlock.querySelector('textarea').parentNode];
          break;
        case "parent":
          relatedBlocks[blockType] = findParent(currentBlock);
          break;
        case "siblings":
          relatedBlocks[blockType] = findSiblings(currentBlock);
          break;
        case "children":
          relatedBlocks[blockType] = findChildren(currentBlock);
          break;        
        default:
          break;
      }
    });
  } else {
    relatedBlocks['nothing'] = null;
  }
  return relatedBlocks;
};

const setFocusModeClass = (blockType_blocks) => {
  setFocusModeRestBlocks();
  for(let [blockType, blocks] of Object.entries(blockType_blocks)){
    switch (blockType) {
      case "current":
        blocks.forEach(block => {
          removeClassByPrefix(block, 'roam42-focusmode-rest-');
          block.classList.add('roam42-focusmode-current-block');
        });        
        break;
      case "parent":
        blocks.forEach(block => {
          removeClassByPrefix(block, 'roam42-focusmode-rest-');
          block.classList.add('roam42-focusmode-parent-block');
        });
        break;
      case "siblings":
        blocks.forEach(block => {
          removeClassByPrefix(block, 'roam42-focusmode-rest-');
          block.classList.add('roam42-focusmode-siblings-block');
        });
        break;
      case "children":
        blocks.forEach(block => {
          removeClassByPrefix(block, 'roam42-focusmode-rest-');
          block.classList.add('roam42-focusmode-children-block');
        });
        break;        
      case "nothing":
        removeFocusModeClass();
        break;
      default:
        break;
    }
  }
};

const removeFocusModeClass = () => {
  var elements = document.querySelectorAll('div[class*="roam42-focusmode-"]');
  elements.forEach(el => {
    removeClassByPrefix(el, 'roam42-focusmode-');
  });
};

const setFocusModeRestBlocks = () => {
  var restBlocks = document.querySelectorAll( '.roam-block.dont-unfocus-block.hoverparent.rm-block-text');
  restBlocks.forEach(block => {
    block.classList.add('roam42-focusmode-rest-block');
  });
}

function removeClassByPrefix(el, prefix) {
  var regx = new RegExp('\\b' + prefix + '.*\\b', 'g');
  el.className = el.className.replace(regx, '');
  return el;
}

const observerTextarea = new MutationObserver(updateFocusMode);
observerTextarea.observe(document.querySelector(".roam-main"), { childList: true, subtree: true });

  window.roam42.focusMode.testingReload = () => {
    roam42.loader.addScriptToPage( "formatConverter", roam42.host + "ext/focusMode.js" );
    setTimeout(async () => {}, 500);
  };
})();
