// roam42.dailyNotesPopup
(()=>{

  roam42.dailyNotesPopup = {};

  roam42.dailyNotesPopup.component =  {
    panelDNP:             undefined,
    idPanelDNP:           'jsPanelDNP',

    async initialize() {
      var loadState = await roam42.settings.get('DailyNotePopup'); //if null, feature not loaded

      if( loadState == null) {
				roam42.dailyNotesPopup.state = 'off'; //default state
				return;
			} else
				roam42.dailyNotesPopup.state = loadState;

      var baseUrl = roam42.common.baseUrl().href.replace('page','');
      
      if(roam42.dailyNotesPopup.state == 'optimized')
        baseUrl = baseUrl + '?disablejs=true';
      
      this.panelDNP = jsPanel.create({
        id: this.idPanelDNP,
        header: 'auto-show-hide',
        headerControls: { smallify: 'remove', maximize: 'remove' },
        content: `<div style="position:absolute;left:1px;top:1px;right:1px;bottom:1px;">
                  <iframe src="${baseUrl}" id="iframePanelDNP" style="top:-1px;left:-1px;width:100%;height:100%; border:0px solid white"></iframe>
                  </div>` ,
        headerTitle: '<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:200px;color:white !important;padding-top:2px;">Daily Notes</div>',
        iconfont: [
          'bp3-button bp3-minimal bp3-small bp3-icon-small-minus',
          'bp3-button bp3-minimal bp3-small bp3-icon-chevron-down',
          'bp3-button bp3-minimal bp3-small bp3-icon-expand-all',
          'bp3-button bp3-minimal bp3-small bp3-icon-maximize',
          'bp3-button bp3-minimal bp3-small bp3-icon-cross'
          ],
        onwindowresize: true,
        resizeit: {  minWidth: 300, minHeight: 300, aspectRatio: false },

        contentOverflow: 'hidden',
        position: {
            my: 'right-center',
            at: 'left-center',
            of: document.body
        },
        callback: (panel)=> {
          panel.querySelector('#iframePanelDNP').onload = function(){
            var loc = Cookies.get('DNP_Parameters_Dimensions') ? JSON.parse( Cookies.get('DNP_Parameters_Dimensions') ) : '';
            var lWidth   = 500;
            var lHeight  = 300;
            var lPosition = 'center-bottom';
            var lX = -10;
            var lY = -10;
            if( loc != '' )  {
              lPosition = 'left-top';
              lWidth   = loc.width;
              lHeight  = loc.height;
              lX = loc.left;
              lY = loc.top;
            }
            if( lY  >=  window.innerHeight ) {
              lPosition = 'center-top';
              lY = -10;
            }
            if( lX  >=  window.innerWidth ) {
              lPosition = 'center-top';
              lX = -10;
            }
            panel.style.visibility = 'hidden';
            panel.reposition( {my: lPosition, at: lPosition, offsetX: lX, offsetY: lY });
            panel.resize( {width:lWidth, height:lHeight} );
            roam42.dailyNotesPopup.component.addPanelEvents();
          }
        },
        dragit: {
           containment: [10, 10, 10,10],
        },
        boxShadow: 4,
      })
      //customize the internal view
      setTimeout( ()=> {
        var iframe = document.getElementById('iframePanelDNP');
        var style = document.createElement('style');

        style.textContent = `
  /*          .bp3-icon-more, .bp3-icon-menu, .bp3-icon-menu-open, .bp3-icon-graph, #buffer, .roam-sidebar-container {
               display: none !important;
            }
  */
            .intercom-lightweight-app {
							display: none;
						}
            .roam-article {
              padding: 3px 20px 20px !important;
            }
            h1.rm-title-display {
              margin-top: 8px !important;
              margin-bottom: 8px !important;
              font-size:24px;
          }
        `;
        try {
          iframe.contentDocument.getElementsByClassName("bp3-icon-menu-closed")[0].click();
          simulateMouseOver(iframe.contentDocument.document.getElementsByClassName("roam-article")[0]);
        } catch(e) {} //if on ipad, the above command fails, so go to next step
        iframe.contentDocument.head.appendChild(style);
        iframe.contentDocument.getElementById('app').classList.add('roam42-DNP');
      },12000)

    },

    saveUIChanges(eventName) {
        var UIValues = {
          width:  this.panelDNP.currentData.width.replace('px','') ,
          height: this.panelDNP.currentData.height.replace('px','') ,
          left:   this.panelDNP.currentData.left.replace('px','') ,
          top:    this.panelDNP.currentData.top.replace('px','')
        };
        Cookies.set('DNP_Parameters_Dimensions', JSON.stringify(UIValues), { expires: 365 });
    },

    addPanelEvents() {
      this.panelDNP.options.onbeforeclose.push( ()=> {  //close hides the window
        this.toggleVisible();
        return false;
      });
      document.addEventListener('jspanelresizestop', (event)=>{ if(event.detail=='jsPanelDNP'){this.saveUIChanges('jspanelresizestop')} }, false);
      document.addEventListener('jspaneldragstop',   (event)=>{ if(event.detail=='jsPanelDNP'){this.saveUIChanges('jspaneldragstop')}   }, false);
      document.addEventListener('jspanelfronted',    (event)=>{ if(event.detail=='jsPanelDNP'){this.saveUIChanges('jspanelfronted')}    }, false);
    },

    toggleVisible() {
      if( roam42.dailyNotesPopup.component.panelDNP.style.visibility == 'hidden' ) {
        if(roam42.dailyNotesPopup.component.panelDNP.offsetLeft > window.innerWidth) {
          roam42.dailyNotesPopup.component.panelDNP.offsetLeft = window.innerWidth - roam42.dailyNotesPopup.component.panelDNP.style.width - 10;
        }
        if(roam42.dailyNotesPopup.component.panelDNP.offsetTop+100 > window.innerHeight) {
          roam42.dailyNotesPopup.component.panelDNP.offsetTop = window.innerHeight -100;
        }
        roam42.dailyNotesPopup.component.panelDNP.style.visibility = 'visible';
        document.getElementById('iframePanelDNP').focus();
      } else {
        roam42.dailyNotesPopup.component.panelDNP.normalize();
        roam42.dailyNotesPopup.component.saveUIChanges('toggleVisible');
        roam42.dailyNotesPopup.component.panelDNP.style.visibility = 'hidden';
        parent.focus();
      }
    }

  }

  window.roam42.dailyNotesPopup.testingReload = ()=>{
    if(document.querySelector('#jsPanelDNP')) document.querySelector('#jsPanelDNP').remove();
    roam42.loader.addScriptToPage( 'dailyNotesPopup', 	roam42.host + 'ext/dailyNotesPopup.js');
    setTimeout(async ()=>{
      roam42.dailyNotesPopup.component.initialize();
    }, 500)
  }

  // TODO - Move This
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const addDateToRoamTitleBanners = (titles) => {
    titles.forEach((title) => {
      if (
        title.nextElementSibling &&
        title.nextElementSibling.classList.contains("roam-title-day-banner")
      ) {
        return;
      }
      const [month, date = "", year = ""] = title.innerText.split(" ");
      const dateMatch = date.match(/^(\d{1,2})(st|nd|rd|th),$/);
      const pageDate =
        year &&
        dateMatch &&
        MONTHS.includes(month) &&
        new Date(year, MONTHS.indexOf(month), dateMatch[1]);
      if (pageDate && !isNaN(pageDate.valueOf())) {
        var weekdays = new Array(
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        );
        var day = pageDate.getDay();
        var div = document.createElement("DIV");
        div.className = "roam-title-day-banner";
        div.innerText = weekdays[day];
        div.style.fontSize = "10pt";
        div.style.top =
          -(Number(getComputedStyle(title).marginBottom.replace("px", "")) + 6) +
          "px";
        div.style.position = "relative";
        title.insertAdjacentElement("afterend", div);
      }
    });
  };
  
  const className = "rm-title-display";
  addDateToRoamTitleBanners(document.querySelectorAll(`.${className}`));
  const observerHeadings = new MutationObserver((ms) => {
    const titles = ms
      .flatMap((m) =>
        Array.from(m.addedNodes).filter(
          (d) => /^H\d$/.test(d.nodeName) && d.classList.contains(className)
        )
      )
      .concat(
        ms.flatMap((m) =>
          Array.from(m.addedNodes)
            .filter((n) => n.hasChildNodes())
            .flatMap((d) => Array.from(d.getElementsByClassName(className)))
        )
      );
    addDateToRoamTitleBanners(titles);
  });
  observerHeadings.observe(document.body, {
    childList: true,
    subtree: true,
  });

})();