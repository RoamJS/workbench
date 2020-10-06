/* globals   roam42, tippy, getRoamNavigator_IsEnabled     */

// roam42.roam42Menu 
(()=>{
  
  roam42.roam42Menu = {};
  roam42.roam42Menu.tippy = {};
  
  roam42.roam42Menu.Initialize = ()=> {
    //create menu item
    var menu = document.createElement("div");
      menu.id='roam42-menu';
      menu.innerHTML = `<img src="https://cdn.glitch.com/e6cdf156-cbb9-480b-96bc-94e406043bd1%2Funnamed.png?v=1602012386463" height="26px"/>`
      
    
      // menu.innerHTML = `<img src="${roam42.loader.logo2HC}" height="30px"/>`
      menu.setAttribute('style','position:relative;left:2px');
    var spacer = document.createElement("div");
      spacer.id="roam42-menu-spacer"
      spacer.setAttribute('style','flex: 0 0 3px');    
    document.querySelector('.roam-topbar .flex-h-box').appendChild(spacer);
    document.querySelector('.roam-topbar .flex-h-box').appendChild(menu);

    roam42.roam42Menu.tippy = tippy('#roam42-menu', {
      allowHTML: true,
      interactive: true,
      interactiveBorder: 5,
      theme: 'light-border',
      arrow: true,
      trigger: 'click',
      onShow(instance) {  instance.setContent( roam42.roam42Menu.displayMenu() ) },
    });

  }
    
  roam42.roam42Menu.displayMenu = ()=>{
    let menu = '';
    menu += `<div><ul class="bp3-menu">`
    
    if( roam42.dailyNotesPopup != undefined ) {
      menu += `<li class="">
                  <a class="bp3-menu-item bp3-popover-dismiss">
                    <div class="bp3-text-overflow-ellipsis bp3-fill" onclick="roam42.roam42Menu.tippy[0].hide(); roam42.dailyNotesPopup.component.toggleVisible();">
                      Daily Notes Popup <span style="font-size:7pt">(Alt-Shift-,)</span>
                    </div>
                  </a>
                </li>`
    }
    
    if( roam42.turndownPage != undefined ) {
      menu += `<li class="">
                  <a class="bp3-menu-item bp3-popover-dismiss">
                    <div class="bp3-text-overflow-ellipsis bp3-fill" onclick="roam42.roam42Menu.tippy[0].hide(); roam42.typeAhead.typeAheadLookup();">
                      Dictionary <span style="font-size:7pt">(Alt-Shift-.)</span>
                    </div>
                  </a>
                </li>`
    }    
    
    if( roam42.privacyMode  != undefined ) {
      menu += `<li class="">
                  <a class="bp3-menu-item bp3-popover-dismiss">
                    <div class="bp3-text-overflow-ellipsis bp3-fill" onclick="roam42.roam42Menu.tippy[0].hide(); roam42.privacyMode.toggle();">
                      Privacy Mode <span style="font-size:7pt">(Ctrl+Alt-P)</span>
                    </div>
                  </a>
                </li>`
    }    
    
    menu += `<hr style="margin:0px; padding:0px">`
    if( roam42.roamNavigator != undefined ) {
      menu += `<li class="" >
            <a class="bp3-menu-item bp3-popover-dismiss">
              <div class="bp3-text-overflow-ellipsis bp3-fill" onclick=" roam42.roam42Menu.tippy[0].hide(); roamNavigatorStatusToast()">
               Jump Nav <span style="font-size:7pt">${getRoamNavigator_IsEnabled() ? ' (Active)' : '(Disabled)'  }
              </div>
            </a>
          </li>`
    }
    
    if( roam42.livePreview != undefined ) {
      menu += `<li class="" >
            <a class="bp3-menu-item bp3-popover-dismiss">
               <div class="bp3-text-overflow-ellipsis bp3-fill" onclick="roam42.roam42Menu.tippy[0].hide(); roam42.livePreview.livePreviewStatusToast()">
                Live Preview <span style="font-size:7pt">${roam42.livePreview.getRoamLivePreviewState() > 0 ? ' (Active)' : '(Disabled)'  }
              </div>
            </a>
          </li>`
    }
    
    if( roam42.autocomplete != undefined ) {
      menu += `<li class="" >
            <a class="bp3-menu-item bp3-popover-dismiss">
               <div class="bp3-text-overflow-ellipsis bp3-fill" onclick="roam42.roam42Menu.tippy[0].hide(); roam42.autocomplete.autoCompleteStatusToast()">
                Auto-complete <span style="font-size:7pt">${roam42.autocomplete.getAutoComplete_IsEnabled() > 0 ? ' (Active)' : '(Disabled)'  }
              </div>
            </a>
          </li>`
    }    

    menu += `<hr style="margin:0px; padding:0px">`
    
    if( roam42.dailyNotesPopup != undefined ) {
      menu += `<li class="">
                  <a class="bp3-menu-item bp3-popover-dismiss">
                    <div class="bp3-text-overflow-ellipsis bp3-fill" onclick="roam42.roam42Menu.tippy[0].hide(); roam42.help.displayHelp(10000);">
                      Help (TBD) <span style="font-size:7pt">(Alt-Shift-H)</span>
                    </div>
                  </a>
                </li>`
    }    

    menu += `<hr style="margin:0px; padding:0px">`
    menu += `<span style="padding-left:5px;font-size:5pt;margin-bottom:10px;color:ligthgrey;">${roam42.buildID}</span> `

    menu += `</ul></div>`

    return menu;
  }
  
  roam42.roam42Menu.testingReload = ()=>{
    try {  
      document.querySelector('#roam42-menu').remove()
      document.querySelector('#roam42-menu-spacer').remove()
    } catch(e) {}  
    roam42.loader.addScriptToPage( 'roam42Menu',  roam42.host + 'ext/roam42Menu.js'    )
    setTimeout(()=>{
      roam42.roam42Menu.Initialize()
    }, 500)
  }


})();