/* globals roam42, Cookies, roamNavigatorSettings, iziToast */

'use strict';
{
  roam42.roamNavigator = {};

  // Set to true to enable debug logging.
  const DEBUG = false;

  // Symbol used to indicate the enter key.
  const ENTER_SYMBOL = '⏎';

  // Key to start navigation.  Alt + this key will also trigger
  // navigation.
  const START_NAVIGATE_KEY = 'g';

  // Key sequence to navigate to daily notes.
  const DAILY_NOTES_KEY = 'g';

  // Key sequence to navigate to graph overview.
  const GRAPH_OVERVIEW_KEY = 'o' + ENTER_SYMBOL;

  // Key sequence to navigate to all pages view.
  const ALL_PAGES_KEYS = 'ap';

  // Key sequence prefix for sidebar blocks.
  const SIDEBAR_BLOCK_PREFIX = 's';

  // Key sequence prefix for sidebar close buttons.
  const CLOSE_BUTTON_PREFIX = 'x';

  // Key sequence for last block.
  const LAST_BLOCK_KEY = 'b';

  // Key to scroll up a bit.
  const SCROLL_UP_KEY = 'ArrowUp';

  // Key to scroll down a bit.
  const SCROLL_DOWN_KEY = 'ArrowDown';

  // Key to scroll a half page down and half page up with shift.
  const BIG_SCROLL_KEY = ' ';

  // Key to toggle left sidebar visibility.
  const LEFT_SIDEBAR_KEY = '`';

  // Maximum number of breadcrumbs (recent pages) to keep track of /
  // attempt to display.
  const MAX_BREADCRUMB_COUNT = 15;

  function readSetting(name, initial) {
    if (window.roamNavigatorSettings && name in window.roamNavigatorSettings) {
      return roamNavigatorSettings[name];
    } else {
      return initial;
    }
  }

  const getRoamNavigator_IsEnabled = ()=>{
    if( Cookies.get('RoamNavigator_IsEnabled') === 'true' ) {
      return true
    } else {
      return false
    }
  }
  window.getRoamNavigator_IsEnabled = getRoamNavigator_IsEnabled

  const setRoamNavigator_IsEnabled = (val)=>{
    if(val == true) {
      Cookies.set('RoamNavigator_IsEnabled', 'true', { expires: 365 })
    } else {
      Cookies.set('RoamNavigator_IsEnabled', 'false', { expires: 365 })
    }
  }

  let roamNavigatorEnabled = getRoamNavigator_IsEnabled()

  const roamNavigatorStatusToast = ()=> {
    var status = getRoamNavigator_IsEnabled()
    iziToast.show({
      timeout: 20000,
      theme: 'dark',
      title: 'Deep Jump Navigation',
      message: 'Status:',
      position: 'bottomRight',
      progressBarColor: 'rgb(0, 255, 184)',
      displayMode: 2,
      buttons: [
      ['<button>Enabled</button>', function (instance, toast) {
          setRoamNavigator_IsEnabled(true)
          roamNavigatorEnabled = true
          instance.hide({transitionOut: 'fadeOutUp'}, toast, 'buttonName');
      }, status],
      ['<button>Disabled</button>', function (instance, toast) {
          setRoamNavigator_IsEnabled(false)
          roamNavigatorEnabled = false
          instance.hide({transitionOut: 'fadeOutDown'}, toast, 'buttonName');
      }, !status],
      ]
    })
  }

  window.roamNavigatorStatusToast = roamNavigatorStatusToast

  //Roam42: End

  // Set to true to activate navigation mode when body is focused.
  const ACTIVATE_ON_NO_FOCUS =
        readSetting('activate-on-no-focus', false);

  // Set to true to activate navigation mode on startup.
  const ACTIVATE_ON_STARTUP =
        readSetting('activate-on-startup', false);

  // Set to true to respond to scroll keys outside navigate mode.
  const SCROLL_OUTSIDE_NAVIGATE_MODE =
        readSetting('scroll-outside-navigate-mode', true);

  // Set to true to enable display of recent pages list.
  const BREADCRUMBS_ENABLED =
        readSetting('breadcrumbs-enabled', true);

  // Set to true to display recent pages list, even when not in
  // navigation mode.
  const BREADCRUMBS_ALWAYS_VISIBLE =
        readSetting('breadcrumbs-always-visible', false);

  // 'navigate' (g) attempts to assign keys to items based on their
  // names. In some case there might not be a concise labeling. This
  // sets the limit on key sequence length for things based on
  // prefixes.
  //
  // Note that this isn't really a knob for users, as more than 2
  // won't fit well.
  const MAX_NAVIGATE_PREFIX = 2;

  // MUTABLE. This is a set of keys to ignore for keypress / keyup
  // events. This solves an issue where keypresses involved in
  // navigation can get handled elsewhere (especially textareas).
  let keysToIgnore = {};

  // MUTABLE. Stores whether a block was highlighted last time the DOM
  // was mutated.
  let blockWasHighlighted = false;

  // MUTABLE. Indicates to the mutation observer that the changes
  // occurred while executing roam-navigator code that mutates DOM,
  // and so the changes should be ignored.
  let domMutationLevel = 0;

  function initialize() {
    document.addEventListener('keydown', (ev) => {
      debug('keydown', ev);
      debug('keysToIgnore', keysToIgnore);
      if (keyIsModifier(ev)) {
        return;
      }
      // Ignore keystrokes pressed with modifier keys, as they might
      // be used by other extensions.

      if (!roamNavigatorEnabled) {
        // navigator disabled, don't go further
        return;
      }

      if (ev.ctrlKey ||
          (ev.altKey && (isNavigating() || ev.key !== START_NAVIGATE_KEY))) {
        delete keysToIgnore[ev.key];
        return;
      }
      if (isNavigating()) {
        if (getInputTarget(ev)) {
          warn('Ending navigate mode as keypress target is input');
          endNavigate();
        } else {
          keysToIgnore[ev.key] = true;
          handleNavigateKey(ev);
        }
        return;
      } else if (ev.key === START_NAVIGATE_KEY) {
        const inputTarget = getInputTarget(ev);
        if (ev.altKey || !inputTarget) {
          ev.stopImmediatePropagation();
          ev.preventDefault();
          keysToIgnore = {};
          // Deslect input before navigating
          if (inputTarget) {
            inputTarget.blur();
          }
          // Deselect block highlight before navigating.
          if (isBlockHighlighted()) {
            click(document.body);
            setTimeout(navigate);
          } else {
            navigate();
          }
          return;
        }
      } else if (SCROLL_OUTSIDE_NAVIGATE_MODE &&
                 !getInputTarget(ev) &&
                 handleScrollKey(ev)) {
        return;
      }
      delete keysToIgnore[ev.key];
    }, true);

    document.addEventListener('keypress', (ev) => {
      debug('keypress', ev);
      debug('keysToIgnore', keysToIgnore);
      if (isNavigating() || keysToIgnore[ev.key]) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      }
    }, true);

    document.addEventListener('keyup', (ev) => {
      debug('keyup', ev);
      debug('keysToIgnore', keysToIgnore);
      if (isNavigating() || keysToIgnore[ev.key]) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        delete keysToIgnore[ev.key];
      }
    }, true);

    let isReady = false;
    let initiatedNavigation = false;

    const handleChange = throttle(20, () => {
      const blockHighlighted = isBlockHighlighted();
      const bodyFocused = document.activeElement === document.body;
      debug('DOM mutation. blockHighlighted = ', blockHighlighted,
          'blockWasHighlighted = ', blockWasHighlighted);
      if (isNavigating()) {
        if (ACTIVATE_ON_NO_FOCUS && roamNavigatorEnabled && blockHighlighted && bodyFocused) {
          handleFocusIn();
        } else {
          if (!setupNavigateCrashed) {
            setupNavigate(false);
          }
          registerScrollHandlers();
        }
      } else if (ACTIVATE_ON_STARTUP && isReady && !initiatedNavigation && roamNavigatorEnabled) {
        if (!setupNavigateCrashed) {
          navigate();
        }
      } else if (ACTIVATE_ON_NO_FOCUS &&
                 !blockHighlighted &&
                 blockWasHighlighted &&
                 bodyFocused) {
        handleFocusOut();
      }
      if (ACTIVATE_ON_STARTUP && isReady && !initiatedNavigation && roamNavigatorEnabled) {
        initiatedNavigation = true;
      }
      blockWasHighlighted = blockHighlighted;
      updateBreadcrumbs();
    });

    window.addEventListener('resize', handleScrollOrResize);

    const observer = new MutationObserver(() => {
      if (!domMutationLevel) {
        handleChange();
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Watch for DOM changes, to know when to re-render tips.
    if (ACTIVATE_ON_NO_FOCUS  && roamNavigatorEnabled) {
      document.addEventListener('focusout', (ev) => {
        if (getInputTarget(ev) && document.activeElement === document.body) {
          handleFocusOut();
        }
      });
      document.addEventListener('focusin', (ev) => {
        if (getInputTarget(ev) && isNavigating()) {
          handleFocusIn();
        }
      });
    }

    // Activate on startup, once the DOM is sufficiently populated.
    if (ACTIVATE_ON_STARTUP) {
      persistentlyFind(() => getById('right-sidebar'),
          () => {
            isReady = true;
            handleChange();
          });
    }
  }

  function keyIsModifier(ev) {
    return (ev.key === 'Shift') ||
      (ev.key === 'Meta') ||
      (ev.key === 'Control') ||
      (ev.key === 'Alt');
  }

  function getInputTarget(ev) {
    const element = ev.target || ev.srcElement;
    if (element.tagName == 'INPUT' ||
        element.tagName == 'SELECT' ||
        element.tagName == 'TEXTAREA' ||
        element.isContentEditable) {
      return element;
    } else {
      return null;
    }
  }

  function registerScrollHandlers() {
    const rightScroller = getById('roam-right-sidebar-content');
    if (rightScroller) {
      rightScroller.removeEventListener('scroll', handleScrollOrResize);
      rightScroller.addEventListener('scroll', handleScrollOrResize);
    }
    let mainScroller = getUniqueClass(document, 'roam-body-main');
    if (mainScroller && mainScroller.firstChild) {
      mainScroller = mainScroller.firstChild;
      mainScroller.removeEventListener('scroll', handleScrollOrResize);
      mainScroller.addEventListener('scroll', handleScrollOrResize);
    }
  }

  const handleScrollOrResize = throttle(100, () => {
    if (isNavigating()) {
      setupNavigate(true);
    }
  });

  function handleFocusIn() {
    debug('Ending navigate due to focusin event or block selection appearing');
    endNavigate();
  }

  function handleFocusOut() {
    // This delay is for efficiency in the case that a focusout
    // is rapidly followed by a focusin, such as when pressing
    // enter to create a new bullet.
    setTimeout(() => {
      if (!isNavigating() && document.activeElement === document.body) {
        debug('Navigating due to focusout or block selection disappearing');
        navigate();
      }
    }, 50);
  }

  function isBlockHighlighted() {
    return document.body.querySelector('.block-highlight-blue') !== null;
  }

  /*
  var IS_CHROME = /Chrom/.test(navigator.userAgent) &&
    /Google Inc/.test(navigator.vendor);
  */

  const HINT_CLASS = 'roam_navigator_hint';
  const HINT_TYPED_CLASS = 'roam_navigator_hint_typed';
  const LINK_HINT_CLASS = 'roam_navigator_link_hint';
  const NAVIGATE_CLASS = 'roam_navigator_navigating';
  const LEFT_SIDEBAR_TOGGLE_CLASS = 'roam_navigator_left_sidebar_toggle';
  const RIGHT_SIDEBAR_CLOSE_CLASS = 'roam_navigator_right_sidebar_close';
  const SIDE_PAGE_CLOSE_CLASS = 'roam_navigator_side_page_close';

  // MUTABLE. When set, this function should be called when navigate mode
  // finished.
  let finishNavigate = null;

  // MUTABLE. Current set of navigate options.
  let currentNavigateOptions = {};

  // MUTABLE. Prefixes used in last assignment of navigate options to keys.
  let currentNavigatePrefixesUsed = {};

  // MUTABLE. Map from uids to navigate options.
  let currentUidToNavigateOptionsMap = {};

  // MUTABLE. Used to avoid infinite recursion of 'setupNavigate' due to it
  // being called on mutation of DOM that it mutates.
  let oldNavigateOptions = {};

  // MUTABLE. Current set of link options.
  let currentLinkOptions = {};

  // MUTABLE. Keys the user has pressed so far.
  let navigateKeysPressed = '';

  // MUTABLE. Whether setupNavigate crashed last time.
  let setupNavigateCrashed = false;

  // Switches to a navigation mode, where navigation targets are annotated
  // with letters to press to click.
  function navigate() {
    if (isNavigating()) {
      throw new Error('Invariant violation: navigate while already navigating');
    }

    // Since the projects list can get reconstructed, watch for changes and
    // reconstruct the shortcut tips.  A function to unregister the mutation
    // observer is passed in.
    oldNavigateOptions = {};
    currentNavigateOptions = {};
    currentNavigatePrefixesUsed = {};
    currentUidToNavigateOptionsMap = {};
    navigateKeysPressed = '';

    finishNavigate = () => {
      if (!BREADCRUMBS_ALWAYS_VISIBLE) {
        clearBreadcrumbs();
      }
    };

    setupNavigate(false);
  }

  function endNavigate() {
    if (!isNavigating()) {
      throw new Error('Invariant violation: endNavigate while not navigating.');
    }
    finishNavigate();
    finishNavigate = null;
    oldNavigateOptions = {};
    currentNavigateOptions = {};
    closeSidebarIfOpened();
    removeOldTips(false);
    if (matchingClass(NAVIGATE_CLASS)(document.body)) {
      document.body.classList.remove(NAVIGATE_CLASS);
    }
  }

  // Assigns key bindings to various parts of the UI, with visual tips
  // next to them.  This function should be re-invoked every time the
  // DOM refreshes, in order to ensure they are displayed. It
  // overrides the keyboard handler such that it temporarily expects a
  // key.
  function setupNavigate(onlyLinks) {
    updateBreadcrumbs();
    // ensureSidebarOpen();
    if (!matchingClass(NAVIGATE_CLASS)(document.body)) {
      document.body.classList.add(NAVIGATE_CLASS);
    }
    debug('Creating navigation shortcut tips');
    try {
      if (!onlyLinks) {
        const {navigateOptions, navigatePrefixesUsed, uidToNavigateOptionsMap} =
              collectNavigateOptions();
        // Avoid infinite recursion. See comment on oldNavigateOptions.
        let different = false;
        for (const key of Object.keys(navigateOptions)) {
          const oldOption = oldNavigateOptions[key];
          if (!oldOption) {
            different = true;
            break;
          } else if (oldOption.element !== navigateOptions[key].element) {
            different = true;
            break;
          }
        }
        currentNavigateOptions = navigateOptions;
        currentNavigatePrefixesUsed = navigatePrefixesUsed;
        currentUidToNavigateOptionsMap = uidToNavigateOptionsMap;
        oldNavigateOptions = navigateOptions;
        if (different) {
          debug('Different set of navigation options, so re-setting them.');
        } else {
          debug('Same set of navigation options, so not re-rendering.');
          setupNavigateCrashed = false;
          return;
        }
      }

      // Reset aliasings before populating links.
      for (const uid of Object.keys(currentUidToNavigateOptionsMap)) {
        const option = currentUidToNavigateOptionsMap[uid];
        option.aliased = [];
      }

      currentLinkOptions = collectLinkOptions(
          currentNavigateOptions,
          currentNavigatePrefixesUsed,
          currentUidToNavigateOptionsMap);

      // Finish navigation immediately if no tips to render.
      if (!rerenderTips(onlyLinks) && finishNavigate) {
        endNavigate();
      }
    } catch (ex) {
      setupNavigateCrashed = true;
      endNavigate();
      throw ex;
    }
    setupNavigateCrashed = false;
  }

  function collectNavigateOptions() {
    const uidToNavigateOptionsMap = {};
    const sidebar = getUniqueClass(document, 'roam-sidebar-container');
    // Initialize a list of elements to bind to keys for
    // navigation. Starts out with some reserved keys that will
    // later be removed.
    const navigateItems = [{
      mustBeKeys: SIDEBAR_BLOCK_PREFIX,
    }, {
      mustBeKeys: LAST_BLOCK_KEY,
    }, {
      mustBeKeys: CLOSE_BUTTON_PREFIX,
    }];

    // Add top level navigations to the list of navigateItems
    if (sidebar) {
      withClass(sidebar, 'log-button', (logButton) => {
        const text = logButton.innerText;
        if (text.includes('DAILY NOTES') ||
            text === DAILY_NOTES_KEY + '\nDAILY NOTES') {
          const option = {
            element: logButton,
            mustBeKeys: DAILY_NOTES_KEY,
            keepGoing: true,
            isNavigateOption: true,
          };
          navigateItems.push(option);
          uidToNavigateOptionsMap[DAILY_NOTES_UID] = option;
        } else if (text.includes('GRAPH OVERVIEW') ||
                   text === GRAPH_OVERVIEW_KEY + '\nGRAPH OVERVIEW') {
          const option = {
            element: logButton,
            mustBeKeys: GRAPH_OVERVIEW_KEY,
            keepGoing: true,
            isNavigateOption: true,
          };
          navigateItems.push(option);
          uidToNavigateOptionsMap[GRAPH_OVERVIEW_UID] = option;
        } else if (text.includes('ALL PAGES') ||
                   text === ALL_PAGES_KEYS + '\nALL PAGES') {
          const option = {
            element: logButton,
            mustBeKeys: ALL_PAGES_KEYS,
            keepGoing: true,
            isNavigateOption: true,
          };
          navigateItems.push(option);
          uidToNavigateOptionsMap[ALL_PAGES_UID] = option;
        } else {
          error('Unhandled .log-button:', text);
        }
      });

      // Add starred shortcuts to the list of navigateItems
      withUniqueClass(sidebar, 'starred-pages', all, (starredPages) => {
        withTag(starredPages, 'a', (item) => {
          withUniqueClass(item, 'page', all, (page) => {
            const text = page.innerText;
            navigateItems.push({
              element: item,
              mustBeKeys: null,
              text: preprocessItemText(text),
              initials: getItemInitials(text),
              isNavigateOption: true,
              keepGoing: true,
            });
          });
        });
      });
    }

    withUniqueClass(document, 'roam-topbar', all, (topbar) => {
      const buttonClasses = ['bp3-icon-menu', 'bp3-icon-menu-open'];
      const button = getUniqueClass(topbar, buttonClasses);
      if (button) {
        navigateItems.push({
          element: button,
          mustBeKeys: LEFT_SIDEBAR_KEY,
          keepGoing: true,
          extraClasses: [LEFT_SIDEBAR_TOGGLE_CLASS],
        });
      }
    });

    withUniqueClass(document, 'roam-sidebar-container', all, (sidebar) => {
      const button = getUniqueClass(sidebar, 'bp3-icon-menu-closed');
      if (button) {
        navigateItems.push({
          element: button,
          mustBeKeys: LEFT_SIDEBAR_KEY,
          keepGoing: true,
          extraClasses: [LEFT_SIDEBAR_TOGGLE_CLASS],
        });
      }
    });

    // Assign key sequences to all of the navigateItmes
    const {options: navigateOptions, prefixesUsed: navigatePrefixesUsed} =
      assignKeysToItems(navigateItems);

    // Remove reserved keys.
    delete navigateOptions[SIDEBAR_BLOCK_PREFIX];
    delete navigateOptions[LAST_BLOCK_KEY];
    delete navigateOptions[CLOSE_BUTTON_PREFIX];

    // For links that have a uid, collect a map from that to the options.
    for (const keySequence of Object.keys(navigateOptions)) {
      const option = navigateOptions[keySequence];
      if (option.element && option.element.attributes['href']) {
        const href = option.element.attributes['href'].value;
        if (href[0] === '/') {
          const uidMatchResult = ID_FROM_HASH_REGEX.exec(href.slice(1));
          if (uidMatchResult) {
            const uid = uidMatchResult[1];
            uidToNavigateOptionsMap[uid] = option;
          }
        }
      }
    }

    // Add key sequences for every block in article.
    const article = getUniqueClass(document, 'roam-article');
    if (article && article.firstChild) {
      const lastBlock = findLastBlock(article.firstChild);
      addBlocks(navigateOptions, article, lastBlock, '');
    }

    // Add key sequences for every block in sidebar.
    const rightSidebarContent = getById('roam-right-sidebar-content');
    if (rightSidebarContent) {
      withId('right-sidebar', (rightSidebar) => {
        addBlocks(
            navigateOptions,
            rightSidebar,
            findLastBlock(rightSidebar),
            SIDEBAR_BLOCK_PREFIX);
        withUniqueClass(rightSidebar, 'bp3-icon-menu-open', all, (button) => {
          navigateOptions['sc'] = {
            element: button,
            keepGoing: true,
            extraClasses: [RIGHT_SIDEBAR_CLOSE_CLASS],
          };
        });
        let closeButtonCounter = 0;
        withClass(rightSidebar, 'bp3-icon-cross', (closeButton) => {
          if (closeButtonCounter < CLOSE_BUTTON_KEYS.length) {
            const key = 'x' + CLOSE_BUTTON_KEYS[closeButtonCounter];
            navigateOptions[key] = {
              element: closeButton,
              keepGoing: true,
              extraClasses: [SIDE_PAGE_CLOSE_CLASS],
            };
          }
          closeButtonCounter++;
        });
      });
    }

    // Add key sequences for every page in "All Pages" list.
    const allPagesSearch = getById('all-pages-search');
    if (allPagesSearch) {
      addBlocks(navigateOptions, allPagesSearch, null, '');
    }

    return {navigateOptions, navigatePrefixesUsed, uidToNavigateOptionsMap};
  }

  function findLastBlock(el) {
    const firstLogPage = getFirstClass(el, 'roam-log-page');
    const container =
          firstLogPage ? getFirstClass(firstLogPage, 'flex-v-box') : el;
    if (container) {
      // TODO: inefficient to query all blocks twice.
      const query = '.rm-block-text, #block-input-ghost';
      return findLast(all, selectAll(container, query));
    }
    return null;
  }

  function addBlocks(navigateOptions, el, lastBlock, prefix) {
    let offset = 0;
    const blocks = el.querySelectorAll([
      '.rm-block-text',
      '.rm-title-display',
      '.rm-pages-title-text',
      '#block-input-ghost',
    ].join(', '));
    const maxDigits =
          Math.floor(Math.log10(Math.max(1, blocks.length - 1))) + 1;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const istr = (i + offset).toString();
      let key = prefix;
      if (block === lastBlock) {
        key += LAST_BLOCK_KEY;
        offset -= 1;
      } else {
        key += i == 0 || istr.length === maxDigits ? istr : istr + ENTER_SYMBOL;
      }
      navigateOptions[key] = {
        element: block,
        mustBeKeys: key,
        keepGoing: not(matchingClass('rm-block-text'))(block),
      };
    }
  }

  function collectLinkOptions(
      navigateOptions,
      navigatePrefixesUsed,
      uidToNavigateOptionsMap) {
    const linksByUid = Object.assign({}, uidToNavigateOptionsMap);

    // Add key sequences for every link in article.
    const article = getUniqueClass(document, 'roam-article');
    if (article) {
      addLinks(linksByUid, navigateOptions, article);
    }

    // Add key sequences for every link in right sidebar.
    withId('right-sidebar', (rightSidebar) => {
      addLinks(linksByUid, navigateOptions, rightSidebar);
    });

    const breadcrumbsContainer = getUniqueClass(document, BREADCRUMBS_CLASS);
    if (breadcrumbsContainer) {
      addLinks(linksByUid, navigateOptions, breadcrumbsContainer);
    }

    const linkItems = [];
    for (const uid of Object.keys(linksByUid)) {
      const option = linksByUid[uid];
      if (!option['isNavigateOption']) {
        linkItems.push(option);
      }
    }

    const {options} =
          assignKeysToItems(linkItems, navigateOptions, navigatePrefixesUsed);

    return options;
  }


  function addLinks(linksByUid, navigateOptions, container) {
    const links = container.querySelectorAll([
      '.rm-page-ref',
      'a',
    ].join(', '));
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const boundingRect = link.getBoundingClientRect();
      const visible =
            container.classList.contains(BREADCRUMBS_CLASS) ?
            boundingRect.top < 45 :
            boundingRect.bottom > 50 &&
              boundingRect.top < window.innerHeight - 10;
      if (visible) {
        const parent = link.parentElement;
        let el;
        let uid;
        // let isExternalLink = false;
        if (link.tagName === 'A') {
          if (matchingClass('rm-ref-page-view-title')(parent)) {
            // Link in linked references
            el = parent;
            uid = link.innerText;
          } else if (matchingClass('rm-alias')(link)) {
            el = link;
            uid = link.innerText;
          } else {
            const hrefAttr = link.attributes['href'];
            if (hrefAttr) {
              // External link
              el = link;
              uid = hrefAttr.value;
              // isExternalLink = true;
            } else {
              if (link.parentElement.tagName === 'H1') {
                //TODO: omitting because the tip on sidebar title gets clipped.
                continue;
                /*
                el = link.parentElement;
                uid = link.innerText;
                */
              } else {
                warn('Unexpected <a> element', link);
                continue;
              }
            }
          }
        } else if (matchingClass('rm-page-ref')(link)) {
          const uidAttr = parent.attributes['data-link-uid'];
          if (uidAttr) {
            // Internal link
            el = parent;
            uid = uidAttr.value;
          } else {
            const tagAttr = link.attributes['data-tag'];
            if (tagAttr) {
              // Internal tag
              el = link;
              uid = tagAttr.value;
            } else {
              error('Expected data-tag or data-link-uid attribute on', link);
              continue;
            }
          }
        }
        const existing = linksByUid[uid];
        if (existing) {
          const aliased = existing.aliased;
          aliased.push(el);
        } else {
          const text = link.innerText;
          linksByUid[uid] = {
            element: el,
            mustBeKeys: null,
            text: preprocessItemText(text),
            initials: getItemInitials(text),
            aliased: [],
            extraClasses: [LINK_HINT_CLASS],
            uid: uid,
            keepGoing: true, // !isExternalLink,
          };
        }
      }
    }
  }

  // Add in tips to tell the user what key to press.
  function rerenderTips(onlyLinks) {
    let renderedAny = false;
    withDomMutation(() => {
      updateBreadcrumbs();
      // ensureSidebarOpen();
      removeOldTips(onlyLinks);
      for (const k of Object.keys(currentNavigateOptions)) {
        renderedAny =
          renderTip(k, currentNavigateOptions[k], onlyLinks) || renderedAny;
      }
      for (const k of Object.keys(currentLinkOptions)) {
        const option = currentLinkOptions[k];
        renderedAny = renderTip(k, option, false) || renderedAny;
      }
    });
    // Boolean result is false if navigation mode should be exited due
    // to no tips to render.
    return onlyLinks || renderedAny;
  }

  function renderTip(key, option, skipRenderingMain) {
    const prefix = key.slice(0, navigateKeysPressed.length);
    const rest = key.slice(navigateKeysPressed.length);
    if (prefix === navigateKeysPressed) {
      if (option.element) {
        if (!skipRenderingMain) {
          renderTipInternal(prefix, rest, option.element, option.extraClasses);
        }
      } else {
        error('element not set in', key, option);
      }
      if (option.aliased) {
        for (const el of option.aliased) {
          // HACK: assumes that all aliases are links, which is
          // currently true.
          const extraClasses =
                option.extraClasses ? [...option.extraClasses] : [];
          extraClasses.push(LINK_HINT_CLASS);
          renderTipInternal(prefix, rest, el, extraClasses);
        }
      }
      return true;
    }
    return false;
  }

  function renderTipInternal(prefix, rest, el, extraClasses) {
    const tip = div({'class': HINT_CLASS}, text(rest));
    if (extraClasses) {
      for (const cls of extraClasses) {
        tip.classList.add(cls);
      }
    }
    if (prefix.length > 0) {
      tip.prepend(span({'class': HINT_TYPED_CLASS}, text(prefix)));
    }
    if (matchingClass('rm-block-text')(el) ||
        el.id === 'block-input-ghost') {
      findParent(el, matchingClass('rm-block-main')).prepend(tip);
    } else if (extraClasses && extraClasses.findIndex((x) =>
      x === LEFT_SIDEBAR_TOGGLE_CLASS ||
                 x === RIGHT_SIDEBAR_CLOSE_CLASS ||
                 x === SIDE_PAGE_CLOSE_CLASS) >= 0) {
      // Typically if the parent doesn't exist, then a re-render is
      // scheduled to properly render the sidebar toggle.
      if (el.parentElement) {
        el.parentElement.insertBefore(tip, el);
      }
    } else if (matchingClass('bp3-icon-cross')(el)) {
      el.prepend(tip);
    } else {
      el.prepend(tip);
    }
  }

  /* TODO: remove this or add option for enabling popping sidebar
     open on navigate (I found it jarring in practice).

  function ensureSidebarOpen() {
    withUniqueClass(document, 'roam-topbar', all, (toolbar) => {
      const menu = getUniqueClass(toolbar, 'bp3-icon-menu');
      if (menu) {
        mouseOver(menu);
      }
    });
  }
  */

  function closeSidebarIfOpened() {
    const bodyMain = getUniqueClass(document, 'roam-body-main');
    if (bodyMain) {
      mouseOver(bodyMain);
    }
  }

  // Lowercase and take only alphanumeric.
  function preprocessItemText(txt) {
    let result = '';
    for (let i = 0; i < txt.length; i++) {
      const char = txt[i];
      const lowerChar = char.toLowerCase();
      if (lowercaseCharIsAlpha(lowerChar)) {
        result += lowerChar;
      }
    }
    return result;
  }

  // Lowercase and get initials.
  function getItemInitials(txt) {
    let result = '';
    for (let i = 0; i < txt.length; i++) {
      const char = txt[i];
      const lowerChar = char.toLowerCase();
      if (lowercaseCharIsAlpha(lowerChar) &&
        (i === 0 || txt[i - 1] === ' ' || lowerChar !== char)) {
        result += lowerChar;
      }
    }
    return result;
  }

  function lowercaseCharIsAlpha(char) {
    const code = char.charCodeAt(0);
    return code > 96 && code < 123; // (a-z)
  }

  function filterJumpKeys(keys) {
    return keys
        .replace(DAILY_NOTES_KEY, '')
        .replace(SIDEBAR_BLOCK_PREFIX, '')
        .replace(LAST_BLOCK_KEY, '')
        .replace(CLOSE_BUTTON_PREFIX, '');
  }

  const HOME_ROW_KEYS = 'asdfghjkl';
  const JUMP_KEYS = HOME_ROW_KEYS + 'qwertyuiopzxcvbnm';
  const FILTERED_HOME_ROW_KEYS = filterJumpKeys(HOME_ROW_KEYS);
  const FILTERED_JUMP_KEYS = filterJumpKeys(JUMP_KEYS);
  const CLOSE_BUTTON_KEYS = '0123456789' + JUMP_KEYS;

  // Assign keys to items based on their text.
  function assignKeysToItems(items, otherPrefixesUsed, otherOptions) {
    const options = {};
    let item;
    let keys;
    let prefix;
    const prefixesUsed = {};
    otherPrefixesUsed = otherPrefixesUsed || {};
    otherOptions = otherOptions || {};
    // Ensure none of the results are prefixes or equal to this keysequence.
    const prefixNotAliased = (ks) => {
      for (let i = 1; i <= ks.length; i++) {
        const sliced = ks.slice(0, i);
        if (options[sliced] || otherOptions[sliced]) {
          return false;
        }
      }
      return true;
    };
    const noAliasing = (ks) => {
      if (!prefixNotAliased(ks)) {
        return false;
      }
      // Ensure this is keysequence is not a prefix of any other keysequence.
      if (prefixesUsed[ks] || otherPrefixesUsed[ks]) {
        return false;
      }
      return true;
    };
    const addResult = (ks, x) => {
      const noAlias = noAliasing(ks);
      if (noAlias) {
        options[ks] = x;
        for (let i = 1; i <= ks.length; i++) {
          prefixesUsed[ks.slice(0, i)] = true;
        }
      }
      return noAlias;
    };
    const addViaKeyFunc = (mode, f) => {
      const groups = {};
      for (let j = 0; j < items.length; j++) {
        keys = f(items[j]);
        if (keys) {
          let group = groups[keys];
          if (!group) {
            group = [];
            groups[keys] = group;
          }
          group.push(j);
        }
      }
      const qualifying = [];
      for (keys in groups) {
        if (noAliasing(keys)) {
          const groupItems = groups[keys];
          let qualifies = false;
          if (mode === 'no-shortening') {
            qualifies = true;
          } else if (mode === 'try-shortening') {
            // Prefer shortened key sequences if they are unambiguous.
            for (let sl = MAX_NAVIGATE_PREFIX - 1; sl > 0; sl--) {
              const shortened = keys.slice(0, sl);
              if (noAliasing(shortened)) {
                let found = true;
                for (const otherKeys in groups) {
                  if (otherKeys !== keys &&
                      otherKeys.slice(0, sl) !== shortened) {
                    found = false;
                    break;
                  }
                }
                if (found) {
                  keys = shortened;
                  break;
                }
              } else {
                break;
              }
            }
            // Still allow ambiguous assignments, even if there is no
            // shortening.
            qualifies = true;
          } else {
            error('Inconstiant violation: unexpected mode in addViaKeyFunc');
          }
          if (qualifies) {
            qualifying.push([keys, groupItems[0]]);
          }
        }
      }
      // sort backwards so that deletion works.
      qualifying.sort((a, b) => {
        return b[1] - a[1];
      });
      for (let k = 0; k < qualifying.length; k++) {
        keys = qualifying[k][0];
        const ix = qualifying[k][1];
        item = items[ix];
        if (addResult(keys, item)) {
          items.splice(ix, 1);
        }
      }
    };
    // Handle items with 'mustBeKeys' set.
    addViaKeyFunc('no-shortening', (it) => {
      return it.mustBeKeys;
    });
    // When initials are at least MAX_NAVIGATE_PREFIX in length, prefer
    // assigning those.
    addViaKeyFunc('no-shortening', (it) => {
      const initials = it.initials;
      if (initials && initials.length >= MAX_NAVIGATE_PREFIX) {
        return initials.slice(0, MAX_NAVIGATE_PREFIX);
      } else {
        return null;
      }
    });
    // Attempt to use prefix as the key sequence.
    addViaKeyFunc('try-shortening', (it) => {
      if (it.text) {
        return it.text.slice(0, MAX_NAVIGATE_PREFIX);
      } else {
        return null;
      }
    });
    // For the ones that didn't have unambiguous prefixes, try other character
    // prefixes.
    for (let p = MAX_NAVIGATE_PREFIX - 1; p >= 0; p--) {
      for (let m = 0; m < items.length; m++) {
        item = items[m];
        if (!item.text) {
          continue;
        }
        prefix = item.text.slice(0, MAX_NAVIGATE_PREFIX - 1);
        if (prefixNotAliased(prefix)) {
          for (let n = -1; n < JUMP_KEYS.length; n++) {
            if (n === -1) {
              if (prefix.length > 0) {
                // First, try doubling the last key, easiest to type.
                keys = prefix + prefix[prefix.length - 1];
              } else {
                continue;
              }
            } else {
              keys = prefix + JUMP_KEYS[n];
            }
            if (addResult(keys, item)) {
              items.splice(m, 1);
              m--;
              break;
            }
          }
        }
      }
    }
    // Finally, fallback on choosing arbitrary combinations of characters.
    for (let q = 0; q < items.length; q++) {
      item = items[q];
      let success = false;
      // If item has a uid, then use it to probe a few times, in the
      // hope of finding a more stable option.
      /* eslint-disable */
      if (item.uid &&
          (addResult(uidToJumpKeys(item.uid, FILTERED_HOME_ROW_KEYS, HOME_ROW_KEYS), item) ||
           addResult(uidToJumpKeys(item.uid, FILTERED_HOME_ROW_KEYS, JUMP_KEYS), item) ||
           addResult(uidToJumpKeys(item.uid + '1', FILTERED_HOME_ROW_KEYS, HOME_ROW_KEYS), item) ||
           addResult(uidToJumpKeys(item.uid + '1', FILTERED_HOME_ROW_KEYS, JUMP_KEYS), item) ||
           addResult(uidToJumpKeys(item.uid, FILTERED_JUMP_KEYS, JUMP_KEYS), item))) {
      /* eslint-enable */
        items.splice(q, 1);
        q--;
        continue;
      }
      // TODO: Don't hardcode choosing one or two, instead follow
      // MAX_NAVIGATE_PREFIX
      for (let r = 0; r < JUMP_KEYS.length; r++) {
        if (addResult(JUMP_KEYS[r], item)) {
          items.splice(q, 1);
          q--;
          success = true;
          break;
        }
      }
      if (success) {
        continue;
      }
      for (let s = 0; s < JUMP_KEYS.length; s++) {
        for (let t = -1; t < JUMP_KEYS.length; t++) {
          // Prefer doubling keys.
          const secondKey = t === -1 ? JUMP_KEYS[s] : JUMP_KEYS[t];
          if (addResult(JUMP_KEYS[s] + secondKey, item)) {
            items.splice(q, 1);
            q--;
            success = true;
            break;
          }
        }
        if (success) {
          break;
        }
      }
    }
    // That should have assigned keys to everything, but if there are many
    // similar number of options this case can happen.
    if (items.length !== 0) {
      info('There must be many options, couldn\'t find keys for', items);
    }
    return {options, prefixesUsed};
  }

  function uidToJumpKeys(uid, keys1, keys2) {
    const hash = hashUid(uid) % (keys1.length * keys2.length);
    const ix1 = hash % keys1.length;
    const ix2 = Math.floor((hash - ix1) / keys2.length);
    return keys1[ix1] + keys2[ix2];
  }

  function hashUid(uid) {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = ((hash << 5) - hash) + uid.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function handleScrollKey(ev) {
    if (ev.key === BIG_SCROLL_KEY) {
      // Space to scroll down.  Shift+space to scroll up.
      withContainerToScroll((container) => {
        if (ev.shiftKey) {
          container.scrollBy(0, container.clientHeight / -2);
        } else {
          container.scrollBy(0, container.clientHeight / 2);
        }
      });
      return true;
    } else if (ev.key === SCROLL_UP_KEY) {
      // Up arrow to scroll up a little bit.
      withContainerToScroll((container) => {
        container.scrollBy(0, -40);
      });
      return true;
    } else if (ev.key === SCROLL_DOWN_KEY) {
      // Down arrow to scroll down a little bit.
      withContainerToScroll((container) => {
        container.scrollBy(0, 40);
      });
      return true;
    }
    return false;
  }

  function handleNavigateKey(ev) {
    debug('handleNavigateKey');
    let keepGoing = false;
    try {
      if (handleScrollKey(ev)) {
        keepGoing = true;
      } else if (ev.key === 'Backspace') {
        // Backspace removes keys from list of pressed keys.
        navigateKeysPressed = navigateKeysPressed.slice(0, -1);
        debug('navigateKeysPressed after backspace:', navigateKeysPressed);
        keepGoing = rerenderTips(false);
      /* TODO
      } else if (ev.key === 'x') {
        withUniqueClass(document, 'roam-article', all, roamArticle => {
          extendWithNewBlock(ev, roamArticle.firstChild)
        });
      } else if (ev.key === 'X') {
        withId('roam-right-sidebar-content', extendWithNewBlock);
      */
      } else if (ev.key === 'Escape') {
        keepGoing = false;
      } else {
        const key = eventToKey(ev);
        if (key) {
          navigateKeysPressed += key;
          debug('navigateKeysPressed:', navigateKeysPressed);
          const navigateOption = currentNavigateOptions[navigateKeysPressed];
          const linkOption = currentLinkOptions[navigateKeysPressed];
          if (navigateOption && linkOption) {
            error('Invariant violation: navigate and link option have same key',
                navigateKeysPressed);
          }
          const option = navigateOption || linkOption;
          if (option) {
            const el = option.element;
            keepGoing = option.keepGoing;
            navigateToElement(ev, el);
            // Special case: should not keep going after clicking
            // title to edit.
            if (matchingClass('rm-title-display')(el) && !ev.shiftKey) {
              keepGoing = false;
            }
            // Scroll the clicked thing into view, if needed.
            el.scrollIntoViewIfNeeded();
            // If we're just changing folding, then the user probably wants to
            // stay in navigation mode, so reset and rerender.
            if (keepGoing) {
              navigateKeysPressed = '';
              keepGoing = rerenderTips(false);
            }
          } else {
            keepGoing = rerenderTips(false);
          }
        }
      }
    } finally {
      if (!keepGoing && isNavigating()) {
        endNavigate();
      }
    }
  }

  function eventToKey(ev) {
    if (ev.key === 'Enter') {
      return ENTER_SYMBOL;
    }
    if (ev.key === ':') {
      return ';';
    }
    const digit = stripPrefix('Digit', ev.code);
    if (digit) {
      return digit;
    }
    const result = ev.key.toLowerCase();
    if (result.length === 1) {
      return result;
    }
    warn('Ignoring keypress with length =', result.length, ':', result);
  }

  function navigateToElement(ev, el, f) {
    let scheduleRerender = false;
    let closeSidebar = true;
    if (matchingClass('rm-block-text')(el)) {
      const blockParent = el.parentElement;
      click(el);
      persistentlyFind(() => getUniqueTag(blockParent, 'textarea'),
          (textarea) => {
            textarea.focus();
            const lastPosition = textarea.value.length;
            textarea.setSelectionRange(lastPosition, lastPosition);
            if (f) {
              f(textarea);
            }
          });
      return;
    }
    const clickFunc = ev.shiftKey ? shiftClick : click;
    if (or(matchingClass('rm-ref-page-view-title'),
        matchingClass('rm-title-display'))(el)) {
      withUniqueTag(el, 'span',
          not(matchingClass(HINT_TYPED_CLASS)), clickFunc);
    } else if (matchingClass('bp3-icon-menu')(el)) {
      // Hover to open sidebar
      mouseOver(el);
      closeSidebar = false;
    } else if (matchingClass(
        'bp3-icon-menu-open',
        'bp3-icon-menu-closed')(el)) {
      click(el);
      // Sidebar toggling tip doesn't promptly update, so defer a
      // couple re-renders.
      scheduleRerender = true;
    /* Aborted attempt at opening links in new tab without switching to it
    } else if (el.attributes['href']) {
      if (ev.shiftKey || !IS_CHROME) {
        // Shift on external links causes a normal click, causing
        // focus to switch to new tab.
        click(el);
      } else {
        // This appears to only work in chrome - opens link in a new
        // tab without switching focus.
        debug('MIDDLE CLICK');
        var middleClick = new MouseEvent( 'click', { 'button': 1, 'which': 2 });
        el.dispatchEvent(middleClick);
      }
      */
    } else {
      const pageRef = getUniqueClass(el, 'rm-page-ref');
      if (pageRef) {
        clickFunc(pageRef);
      } else {
        const innerDiv = getUniqueTag(el, 'div',
            not(matchingClass(HINT_CLASS)));
        if (innerDiv) {
          clickFunc(innerDiv);
          setTimeout(() => clickFunc(innerDiv));
        } else {
          clickFunc(el);
        }
      }
    }
    if (closeSidebar) {
      closeSidebarIfOpened();
    }
    if (scheduleRerender) {
      setTimeout(() => {
        rerenderTips(false);
      }, 50);
      setTimeout(() => {
        rerenderTips(false);
      }, 100);
    }
  }

  function withContainerToScroll(f) {
    if (navigateKeysPressed.startsWith(SIDEBAR_BLOCK_PREFIX)) {
      withId('roam-right-sidebar-content', f);
    } else {
      const allPages = getById('all-pages-search');
      if (allPages) {
        withUniqueClass(allPages, 'table', all, f);
      } else {
        withUniqueClass(document, 'roam-body-main', all, (main) => {
          f(main.firstChild);
        });
      }
    }
  }

  /* TODO
  function extendWithNewBlock(ev, el) {
    const lastBlock = getLastClass(el, 'rm-block-text');
    navigateToElement(ev, lastBlock, textarea => {
      const enterEvent = createKeyEvent('keypress', 'z', 0);
      textarea.dispatchEvent(enterEvent);
    });
  }
  */

  // Remove old tips if any still exist.
  function removeOldTips(onlyLinks) {
    // FIXME: I can't quite explain this, but for some reason, querying the
    // list that matches the class name doesn't quite work.  So instead find
    // and remove until they are all gone.
    withDomMutation(() => {
      let toDelete = [];
      do {
        for (let i = 0; i < toDelete.length; i++) {
          const el = toDelete[i];
          el.parentElement.removeChild(el);
        }
        const cls = onlyLinks ? LINK_HINT_CLASS : HINT_CLASS;
        toDelete = document.getElementsByClassName(cls);
      } while (toDelete.length > 0);
    });
  }

  function isNavigating() {
    return finishNavigate !== null;
  }

  /*****************************************************************************
   * Recent history breadcrumbs
   */

  // MUTABLE. Map from graph name to array of recently visited pages.
  // Array elements are { title: "", hash: "", uid: "" }
  const breadcrumbsByGraph = {};

  // Class used for breadcrumbs container.
  const BREADCRUMBS_CLASS = 'roam_navigator_breadcrumbs';

  // Attributes used for link portion of breadcrumbs.
  const LINK_ATTRS = {
    'tabindex': '-1',
    'class': 'rm-page-ref rm-page-ref-link-color',
  };

  // Regex used to extract id from hash portion of url.
  const ID_FROM_HASH_REGEX = /#\/app\/[^\/]*\/page\/([a-zA-Z0-9\-_]*)$/;

  // Regex used to identify if the hash portion of the url is the
  // daily page.
  const IS_DAILY_NOTES_REGEX = /#\/app\/[^\/]*$/;

  // Regex used to identify if the hash portion of the url is the all
  // pages page.
  const IS_ALL_PAGES_REGEX = /#\/app\/[^\/]*\/search$/;

  // Regex used to identify if the hash portion of the url is the
  // graph overview page.
  const IS_GRAPH_OVERVIEW_REGEX = /#\/app\/[^\/]*\/graph$/;

  // Regex used to extract graph name
  const GRAPH_NAME_REGEX = /#\/app\/([^\/]*)/;

  const DAILY_NOTES_UID = 'daily_notes';
  const GRAPH_OVERVIEW_UID = 'graph_overview';
  const ALL_PAGES_UID = 'all_pages';

  function updateBreadcrumbs() {
    if (BREADCRUMBS_ENABLED) {
      const hash = window.location.hash;

      const graphNameResult = GRAPH_NAME_REGEX.exec(hash);
      let graphName = '';
      if (graphNameResult) {
        graphName = graphNameResult[1];
      } else {
        // Omit graphs chooser and other non-graph pages from
        // breadcrumbs list.
        debug('Omitting', hash, 'from breadcrumbs');
      }
      if (!(graphName in breadcrumbsByGraph)) {
        breadcrumbsByGraph[graphName] = [];
      }
      const breadcrumbs = breadcrumbsByGraph[graphName];

      const pageTitleElement =
            document.querySelector('.roam-body-main .rm-title-display > span');
      const pageUidMatchResult = ID_FROM_HASH_REGEX.exec(hash);
      const isDailyPage = IS_DAILY_NOTES_REGEX.exec(hash) !== null;
      const isGraphOverview = IS_GRAPH_OVERVIEW_REGEX.exec(hash) !== null;
      const isAllPages = IS_ALL_PAGES_REGEX.exec(hash) !== null;
      let title;
      let uid;
      if (pageTitleElement) {
        title = pageTitleElement.innerText;
      } else if (!isDailyPage && !isAllPages && !isGraphOverview) {
        if (!pageUidMatchResult) {
          // Fall back on using document title, this is used for cases
          // like the graph overview / all pages.
          title = document.title;
          uid = document.title;
        } else {
          debug('Didn\'t find title element for page');
          return;
        }
      }
      if (isDailyPage) {
        uid = DAILY_NOTES_UID;
        title = 'Daily Notes';
      } else if (isGraphOverview) {
        uid = GRAPH_OVERVIEW_UID;
        title = 'Graph Overview';
      } else if (isAllPages) {
        uid = ALL_PAGES_UID;
        title = 'All Pages';
      } else {
        if (pageUidMatchResult) {
          uid = pageUidMatchResult[1];
        }
      }
      let newBreadcrumb;
      if (uid) {
        newBreadcrumb = {hash, title, uid};
      } else {
        newBreadcrumb = {hash, title};
      }
      let changed = false;
      if (breadcrumbs.length < 1) {
        breadcrumbs.push(newBreadcrumb);
        changed = true;
      }
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
      if (lastBreadcrumb.hash === hash) {
        if (lastBreadcrumb.title !== title) {
          lastBreadcrumb.title = title;
        }
      } else {
        // Remove existing occurrences.
        for (let i = 0; i < breadcrumbs.length; i++) {
          if (breadcrumbs[i].hash === hash) {
            breadcrumbs.splice(i, 1);
          }
        }
        breadcrumbs.push(newBreadcrumb);
        changed = true;
      }
      if (changed) {
        trimExcessBreadcrumbs(breadcrumbs);
        debug('updated breadcrumbs = ', breadcrumbs);
      }
      // Update rendering of breadcrumbs.
      const alreadyVisible =
            selectAll(document, '.' + BREADCRUMBS_CLASS).length > 0;
      const shouldBeVisible = BREADCRUMBS_ALWAYS_VISIBLE || isNavigating();
      if (!shouldBeVisible) {
        clearBreadcrumbs();
      } else if (changed || !alreadyVisible) {
        clearBreadcrumbs();
        renderBreadcrumbs(breadcrumbs);
      }
    }
  }

  function clearBreadcrumbs() {
    withDomMutation(() => {
      withQuery(document, '.' + BREADCRUMBS_CLASS, (container) => {
        container.parentNode.removeChild(container);
      });
    });
  }

  function renderBreadcrumbs(breadcrumbs) {
    withDomMutation(() => {
      const container = div({'class': BREADCRUMBS_CLASS});
      for (let i = breadcrumbs.length - 2; i >= 0; i--) {
        const breadcrumb = breadcrumbs[i];
        const breadcrumbAttrs = {
          'title': breadcrumb.title,
          'data-link-title': breadcrumb.title,
        };
        if ('uid' in breadcrumb) {
          breadcrumbAttrs['data-link-uid'] = breadcrumb['uid'];
        }
        const breadcrumbSpan = span(breadcrumbAttrs);
        breadcrumbSpan.appendChild(span(LINK_ATTRS, text(breadcrumb.title)));
        breadcrumbSpan.onclick = (event) => {
          setTimeout(() => {
            window.location.hash = breadcrumb.hash;
          });
        };
        container.appendChild(breadcrumbSpan);
      }

      const topbar = selectUnique(document, '.roam-topbar > .rm-files-dropzone >  .flex-h-box');
      if (topbar) {
        const buttonClasses = ['bp3-icon-menu', 'bp3-icon-menu-open'];
        const sidebarButton = getUniqueClass(topbar, buttonClasses);
        if (sidebarButton && sidebarButton.nextSibling) {
          topbar.insertBefore(container, sidebarButton.nextSibling);
        } else {
          topbar.insertBefore(container, topbar.firstChild);
        }
      }
    });
  }

  function trimExcessBreadcrumbs(breadcrumbs) {
    if (breadcrumbs.length > MAX_BREADCRUMB_COUNT) {
      breadcrumbs.splice(0, breadcrumbs.length - MAX_BREADCRUMB_COUNT);
    }
  }

  function withDomMutation(f) {
    domMutationLevel += 1;
    try {
      f();
    } finally {
      domMutationLevel -= 1;
    }
  }

  /*****************************************************************************
   * Utilities
   */

  function persistentlyFind(finder, f) {
    persistentlyFindImpl(finder, 0, f);
  }

  function persistentlyFindImpl(finder, n, f) {
    const el = finder();
    if (el) {
      f(el);
    } else if (n > 1000) {
      warn('Giving up on finding after', n, 'retries.');
    } else {
      setTimeout(() => persistentlyFindImpl(finder, n + 1, f), 15);
    }
  }

  function throttle(ivl, f) {
    let prev = 0;
    return () => {
      const now = new Date();
      if (now - prev >= ivl) {
        f();
        prev = now;
      }
    };
  }

  // Simulate a mouse over event.
  function mouseOver(el) {
    const options = {
      bubbles: true,
      cancelable: true,
      view: window,
      target: el,
    };
    el.dispatchEvent(new MouseEvent('mouseover', options));
  }

  // Simulate a mouse click.
  function click(el) {
    const options = {
      bubbles: true,
      cancelable: true,
      view: window,
      target: el,
      which: 1,
      button: 0,
    };
    el.dispatchEvent(new MouseEvent('mousedown', options));
    el.dispatchEvent(new MouseEvent('mouseup', options));
    el.dispatchEvent(new MouseEvent('click', options));
  }

  // Simulate a shift mouse click.
  // eslint-disable-next-line no-unused-vars
  function shiftClick(el) {
    const options = {
      bubbles: true,
      cancelable: true,
      view: window,
      which: 1,
      button: 0,
      shiftKey: true,
      target: el,
    };
    let ev = new MouseEvent('mousedown', options);
    ev.preventDefault();
    el.dispatchEvent(ev);
    ev = new MouseEvent('mouseup', options);
    ev.preventDefault();
    el.dispatchEvent(ev);
    ev = new MouseEvent('click', options);
    ev.preventDefault();
    el.dispatchEvent(ev);
  }

  // eslint-disable-next-line no-unused-vars
  function createKeyEvent(type, key, code) {
    const keyEvent = new Event(type);
    keyEvent.key = key;
    keyEvent.keyCode = code;
    keyEvent.which = code;
    return keyEvent;
  }

  const EXTENSION_NAME = 'roam-navigator';

  function debug(...rest) {
    if (DEBUG) {
      const args = [].slice.call(rest);
      args.unshift(EXTENSION_NAME + ':');
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  function debugWithStack(...rest) {
    if (DEBUG) {
      const args = [].slice.call(rest);
      args.unshift(EXTENSION_NAME + ':');
      args.push('\n' + getStack());
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  // Used to notify about an issue that's expected to sometimes occur during
  // normal operation.
  function info(...rest) {
    const args = [].slice.call(rest);
    args.unshift(EXTENSION_NAME + ':');
    args.push('(this is fine)');
    console.log(...args);
  }

  function warn(...rest) {
    const args = [].slice.call(rest);
    args.unshift(EXTENSION_NAME + ':');
    args.push('\n' + getStack());
    console.warn(...args);
  }

  function error(...rest) {
    const args = [].slice.call(rest);
    args.unshift(EXTENSION_NAME + ':');
    args.push(getStack());
    args.push('Please report this as an issue to http://github.com/mgsloan/roam-navigator');
    console.error(...args);
  }

  // https://stackoverflow.com/a/41586311/1164871
  function getStack() {
    try {
      throw new Error();
    } catch (e) {
      return e.stack;
    }
  }

  // https://github.com/greasemonkey/greasemonkey/issues/2724#issuecomment-354005162
  function addCss(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.documentElement.appendChild(style);
    return style;
  }

  // Alias for document.getElementById
  function getById(id) {
    return document.getElementById(id);
  }


  // Alias for querySelectorAll.
  function selectAll(parent, query) {
    if (!query) {
      // eslint-disable-next-line no-param-reassign
      query = parent;
      // eslint-disable-next-line no-param-reassign
      parent = document;
    }
    return parent.querySelectorAll(query);
  }

  // Uses querySelectorAll, but requires a unique result.
  function selectUnique(parent, query) {
    return findUnique(all, selectAll(parent, query));
  }

  // Users querySelectorAll, requires unique result, and applies the
  // user's function to it.  Logs a warning if there isn't one.
  // eslint-disable-next-line no-unused-vars
  function withUnique(parent, query, f) {
    const result = selectUnique(parent, query);
    if (result) {
      return f(result);
    } else {
      warn('Couldn\'t find unique descendant matching query',
          query, ', instead got', result);
      return null;
    }
  }

  // Uses querySelectorAll, and applies the provided function to each result.
  function withQuery(parent, query, f) {
    const els = selectAll(parent, query);
    for (let i = 0; i < els.length; i++) {
      f(els[i]);
    }
  }

  // Invokes the function for the matching id, or logs a warning.
  function withId(id, f, ...rest) {
    if (rest.length > 0) {
      error('Too many arguments passed to withId', rest);
    }
    const el = getById(id);
    if (el) {
      return f(el);
    } else {
      warn('Couldn\'t find ID', id);
      return null;
    }
  }

  // Invokes the function for every descendant element that matches
  // the class name.
  function withClass(parent, cls, f, ...rest) {
    if (rest.length > 0) {
      error('Too many arguments passed to withClass', rest);
    }
    const els = parent.getElementsByClassName(cls);
    for (let i = 0; i < els.length; i++) {
      f(els[i]);
    }
  }

  // Invokes the function for every descendant element that matches a
  // tag name.
  function withTag(parent, tag, f, ...rest) {
    if (rest.length > 0) {
      error('Too many arguments passed to withTag', rest);
    }
    const els = parent.getElementsByTagName(tag);
    for (let i = 0; i < els.length; i++) {
      f(els[i]);
    }
  }

  // Finds a parentElement which matches the specified
  // predicate. Returns null if element is null.
  function findParent(el0, predicate) {
    if (!el0) return null;
    let el = el0.parentElement;
    if (!el) return null;
    do {
      if (predicate(el)) {
        return el;
      }
      el = el.parentElement;
    } while (el);
    return null;
  }

  // Returns first descendant that matches the specified class and
  // predicate.
  function getFirstClass(parent, cls, predicate) {
    return findFirst(predicate, parent.getElementsByClassName(cls));
  }

  // Returns last descendant that matches the specified class and
  // predicate.
  // eslint-disable-next-line no-unused-vars
  function getLastClass(parent, cls, predicate) {
    return findLast(predicate, parent.getElementsByClassName(cls));
  }

  // Checks that there is only one descendant element that matches the
  // class name and predicate, and returns it. Returns null if it is
  // not found or not unique.
  function getUniqueClass(parent, cls, predicate) {
    let foundElements = [];
    if (cls.constructor === Array) {
      for (let i = 0; i < cls.length; i++) {
        const results = parent.getElementsByClassName(cls[i]);
        foundElements = foundElements.concat(Array.from(results));
      }
    } else {
      foundElements = parent.getElementsByClassName(cls);
    }
    return findUnique(predicate, foundElements);
  }

  // Checks that there is only one descendant element that matches the
  // class name, and invokes the function on it. Logs a warning if
  // there isn't exactly one.
  function withUniqueClass(parent, cls, predicate, f) {
    const result = getUniqueClass(parent, cls, predicate);
    if (result) {
      return f(result);
    } else {
      warn('Couldn\'t find unique descendant with class',
          cls, 'and matching predicate, instead got', result);
      return null;
    }
  }

  // Checks that there is only one descendant element that matches the
  // tag and predicate, and returns it. Returns null if it is not
  // found or not unique.
  function getUniqueTag(parent, tag, predicate) {
    return findUnique(predicate, parent.getElementsByTagName(tag));
  }

  // Checks that there is only one descendant element that matches the
  // tag, and invokes the function on it. Logs a warning if there
  // isn't exactly one.
  function withUniqueTag(parent, tag, predicate, f) {
    const result = getUniqueTag(parent, tag, predicate);
    if (result) {
      return f(result);
    } else {
      warn('Couldn\'t find unique descendant with tag',
          tag, 'and passing predicate');
      return null;
    }
  }


  // Given a predicate, returns the first element that matches. If predicate is
  // null, then it is treated like 'all'.
  function findFirst(predicate, array) {
    const pred = checkedPredicate('findFirst', predicate ? predicate : all);
    for (const i = 0; i < array.length; i++) {
      const el = array[i];
      if (pred(el)) {
        return el;
      }
    }
    return null;
  }

  // Given a predicate, returns the last element that matches. If predicate is
  // null, then it is treated like 'all'.
  function findLast(predicate, array) {
    const pred = checkedPredicate('findLast', predicate ? predicate : all);
    for (let i = array.length - 1; i >= 0; i--) {
      const el = array[i];
      if (pred(el)) {
        return el;
      }
    }
    return null;
  }

  // Given a predicate, returns the only element that matches. If no elements
  // match, or multiple elements match, then nothing gets returned. If predicate
  // is null, then it is treated like 'all'.
  function findUnique(predicate, array) {
    const pred = checkedPredicate('findUnique', predicate ? predicate : all);
    let result = null;
    for (let i = 0; i < array.length; i++) {
      const el = array[i];
      if (pred(el)) {
        if (result === null) {
          result = el;
        } else {
          debugWithStack('findUnique didn\'t find unique element because ' +
                         'there are multiple results. ' +
                         'Here are two:', result, el);
          // Not unique, so return null.
          return null;
        }
      }
    }
    return result;
  }

  // Inverts the result of a predicate.
  function not(p) {
    return (x) => !p(x);
  }

  // Given two predicates, uses || to combine them.
  function or(p1, p2) {
    return (x) =>
      checkedPredicate('left side of or', p1)(x) ||
      checkedPredicate('right side of or', p2)(x);
  }

  function checkedPredicate(context, predicate) {
    return (x) => {
      const bool = predicate(x);
      if (typeof bool !== 'boolean') {
        // TODO: perhaps an exception would be better.
        error('In ' + context + ', expected boolean result from predicate. ',
            'Instead got', bool);
      }
      return bool;
    };
  }

  // Returns string with prefix removed.  Returns null if prefix doesn't
  // match.
  function stripPrefix(prefix, string) {
    const found = string.slice(0, prefix.length);
    if (found === prefix) {
      return string.slice(prefix.length);
    } else {
      return null;
    }
  }

  /*****************************************************************************
   * Predicates (for use with get / with functions above)
   */

  // Predicate which always returns 'true'.
  function all() {
    return true;
  }

  // Returns predicate which returns 'true' if the element has the
  // specified class.
  function matchingClass(cls) {
    return function(el) {
      return el.classList.contains(cls);
    };
  }

  /*****************************************************************************
   * Utilities for creating elements
   */

  function text(x) {
    return document.createTextNode(x);
  }

  function span(...rest) {
    return element('span', ...rest);
  }

  function div(...rest) {
    return element('div', ...rest);
  }

  function element(t, attrs, ...children) {
    const el = document.createElement(t);
    for (const attr of Object.keys(attrs)) {
      el.setAttribute(attr, attrs[attr]);
    }
    for (const child of children) {
      el.appendChild(child);
    }
    return el;
  }

  addCss([
    '.' + HINT_CLASS + ' {',
    '  position: absolute;',
    '  left: 4px;',
    '  margin-top: 4px;',
    '  font-family: monospace;',
    '  font-weight: bold;',
    '  font-size: 14px;',
    '  color: rgb(145, 154, 159);',
    // z-index of left sidebar is 999
    '  z-index: 998;',
    '}',
    '.' + HINT_TYPED_CLASS + ' {',
    '  color: rgb(206, 217, 224);',
    '}',
    '.log-button .' + HINT_CLASS + ' {',
    '  margin-top: 0;',
    '}',
    '.starred-pages .' + HINT_CLASS + ' {',
    '  margin-top: 8px;',
    '}',
    '#roam-right-sidebar-content {',
    '  position: relative;',
    '}',
    '#roam-right-sidebar-content .' + HINT_CLASS + ' {',
    '  left: -24px;',
    '}',
    '.rm-title-display .' + HINT_CLASS + ' {',
    '  margin-top: 14px;',
    '}',
    '#all-pages-search .table {',
    '  position: relative;',
    '}',
    '.rm-pages-title-text .' + HINT_CLASS + ' {',
    '  left: 10px;',
    '  margin-top: 0px;',
    '}',
    '.' + LINK_HINT_CLASS + ' {',
    '  left: unset !important;',
    '  display: inline;',
    '  margin-top: -14px;',
    '}',
    '.' + BREADCRUMBS_CLASS + ' .' + HINT_CLASS + ' {',
    '  margin-top: -2px;',
    '  margin-left: 5px;',
    '}',
    // Prevents clipping of tips.
    '.' + NAVIGATE_CLASS + ' .parent-path-wrapper {',
    '  flex: 100 0 0;',
    '  overflow: visible !important;',
    '}',
    '.' + BREADCRUMBS_CLASS + ' {',
    '  flex: 100 0 0;',
    '  overflow: hidden;',
    '  height: 45px;',
    '  line-height: 45px;',
    '}',
    '.' + BREADCRUMBS_CLASS + ' > span {',
    '  float: right;',
    '  margin-left: 5px;',
    '}',
    '.' + BREADCRUMBS_CLASS + ' .rm-page-ref {',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  max-width: 256px;',
    '  text-overflow: ellipsis;',
    '  border-left: 0.5px solid #666;',
    '  padding-left: 5px;',
    '}',
    // Shows sidebar toggle
    '.' + NAVIGATE_CLASS + ' .bp3-icon-menu-closed {',
    '  opacity: initial !important;',
    '}',
    '.' + LEFT_SIDEBAR_TOGGLE_CLASS + ' {',
    '  width: 0;',
    '  height: 0;',
    '  position: relative;',
    '  top: -22px;',
    '  left: 8px;',
    '}',
    '.roam-sidebar-content .' + LEFT_SIDEBAR_TOGGLE_CLASS + ' {',
    '  left: 42px;',
    '}',
    // Fix positioning of sidebar close tip
    '.' + RIGHT_SIDEBAR_CLOSE_CLASS + ' {',
    '  position: relative;',
    '  width: 0;',
    '  height: 0;',
    '  top: -16px;',
    '  left: 0;',
    '}',
    '#roam-right-sidebar-content .' + SIDE_PAGE_CLOSE_CLASS + ' {',
    '  position: relative;',
    '  width: 0;',
    '  height: 0;',
    '  top: -16px !important;',
    '  left: 4px !important;',
    '}',
  ].join('\n'));

  initialize();
}
