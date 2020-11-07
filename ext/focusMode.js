/* globals roam42, Mousetrap,getPageUidByTitle, marked*/
/* Contributor: https://twitter.com/leekeifon1 */

(() => {
  roam42.focusMode = {};
  let startFocusMode = false;

  roam42.focusMode.keyboardHandler = ev => {
    if (window != window.parent) { return; }
    if (ev.shiftKey && ev.altKey && ev.code == "KeyF") {
      ev.preventDefault();
      roam42.focusMode.toggle();
    }
  };

  roam42.focusMode.active = () => {
    return startFocusMode;
  };
  
  roam42.focusMode.toggle = () => {
    startFocusMode = !startFocusMode;
    if (!startFocusMode) {
      removeFocusModeOpacity();
      observerTextarea.disconnect();
    } else {
      observerTextarea.observe(document.querySelector(".roam-main"), { childList: true, subtree: true });
      scanTextarea();
    }
  };

  const removeFocusModeOpacity = () => {
    var blocks = document.querySelectorAll( ".roam-block.dont-unfocus-block.hoverparent.rm-block-text" );
    blocks.forEach(block => {
      block.style.opacity = null;
    });
  };

  const setFocusModeOpacity = (opacity = 0.3) => {
    var blocks = document.querySelectorAll(".roam-block.dont-unfocus-block.hoverparent.rm-block-text");
    blocks.forEach(block => {
      block.style.opacity = opacity;
    });
  };

  const scanTextarea = mutationsList => {
    // const targetNodes = document.getElementsByTagName('textarea').get;
    console.log(mutationsList);
    const text_area = document.querySelector("textarea.rm-block-input.rm-block-text");
    // if enter active mode, then I add opacity
    // when I'm out active mode, then I remove all opacity
    if (text_area == null) {
      removeFocusModeOpacity();
    } else {
      setFocusModeOpacity();
    }
  };

  const observerTextarea = new MutationObserver(scanTextarea);

  window.roam42.focusMode.testingReload = () => {
    roam42.loader.addScriptToPage( "formatConverter", roam42.host + "ext/focusMode.js" );
    setTimeout(async () => {}, 500);
  };
})();
