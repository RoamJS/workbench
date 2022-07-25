//@ts-ignore
import jsPanel from "jspanel4";

const windowListener = function (e: MessageEvent) {
  if (
    e.data === "roamquickrefclosewindow"
  ) {
    document.querySelector<HTMLElement>("#rqrQuickReferencePanel").style.visibility =
      "hidden";
  }
}

export const toggle = (flag: boolean) => {
  if (flag) component.initialize();
  else {
    window.removeEventListener("message", windowListener);
    document.querySelector<HTMLElement>("#rqrQuickReferencePanel").remove();
  }
}

export const component = {
  rqrQuickReferencePanel: "",
  rqrQuickReferencePanel_isInitiallyPositioned: false,

  keyboardHandler(ev: KeyboardEvent) {
    if (ev.ctrlKey == true && ev.shiftKey == true && ev.code == "KeyQ") {
      ev.preventDefault();
      this.toggleQuickReference();
      return true;
    }
  },

  toggleQuickReference() {
    if (this.rqrQuickReferencePanel_isInitiallyPositioned == false) {
      this.rqrQuickReferencePanel_isInitiallyPositioned = true;
    }
    if (
      document.querySelector<HTMLElement>("#rqrQuickReferencePanel").style.visibility ==
      "hidden"
    ) {
      document.querySelector<HTMLElement>("#rqrQuickReferencePanel").style.visibility =
        "visible";
      var iframe = document.getElementById("iframeRqrQuickReferencePanel");
      iframe.focus();
    } else {
      document.querySelector<HTMLElement>("#rqrQuickReferencePanel").style.visibility =
        "hidden";
    }
  },

  initialize() {
    this.rqrQuickReferencePanel = jsPanel.create({
      id: "rqrQuickReferencePanel",
      headerControls: {
        maximize: "remove",
      },
      // borderRadius: '.8rem',
      headerTitle:
        '<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:300px;color:white !important;padding-top:2px;">Quick Reference for Roam<sup>42</sup> and Roam</div>',
      iconfont: [
        "bp3-button bp3-minimal bp3-small bp3-icon-small-minus",
        "bp3-button bp3-minimal bp3-small bp3-icon-chevron-down",
        "bp3-button bp3-minimal bp3-small bp3-icon-chevron-up",
        "custom-maximize",
        "bp3-button bp3-minimal bp3-small bp3-icon-cross",
      ],
      contentSize: {
        width: 590,
        height: 405,
      },
      resizeit: {
        disable: true,
      },
      theme: "light",
      contentOverflow: "hidden",
      content: `<iframe src="https://roamjs.com/quickref/index.html" id="iframeRqrQuickReferencePanel" style="width: 100%; height: 100%;"></iframe>`,
      onwindowresize: true,
      dragit: {
        containment: 10,
        snap: {
          containment: true,
          repositionOnSnap: true,
        },
      },
      position: {
        my: "right-bottom",
        at: "right-bottom",
        offsetX: -10,
        offsetY: -10,
      },
    });

    document.querySelector<HTMLElement>("#rqrQuickReferencePanel").style.visibility =
      "hidden";

    this.rqrQuickReferencePanel.options.onbeforeclose.push(() => {
      document.querySelector<HTMLElement>("#rqrQuickReferencePanel").style.visibility =
        "hidden";
      if (
        this.rqrQuickReferencePanel.status == "minimized" ||
        this.rqrQuickReferencePanel.status == "smallified"
      ) {
        this.rqrQuickReferencePanel.normalize();
      }
      return false;
    });


    window.addEventListener("message", windowListener);
  }, //initialize
};
