// thank you @VladyslavSitalo for the awesome Roam Toolkit, and the basis for this code
export const LEFT_ARROW = 37;
export const UP_ARROW = 38;
export const RIGHT_ARROW = 39;
export const DOWN_ARROW = 40;
export const BASE_DELAY = 20;

export const delay = (millis: number) => {
  return new Promise((resolve) => setTimeout(resolve, millis));
};

export const getKeyboardEvent = function (
  type: string,
  code: number,
  opts: Partial<KeyboardEventInit>
) {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    keyCode: code,
    ...opts,
  });
};

export const getActiveEditElement = function () {
  // stolen from Surfingkeys. Needs work.
  var element = document.activeElement;
  // on some pages like chrome://history/, input is in shadowRoot of several other recursive shadowRoots.
  while (element.shadowRoot) {
    if (element.shadowRoot.activeElement) {
      element = element.shadowRoot.activeElement;
    } else {
      var subElement = element.shadowRoot.querySelector(
        "input, textarea, select"
      );
      if (subElement) {
        element = subElement;
      }
      break;
    }
  }
  return element;
};

export const simulateSequence = (
  events: { name: string; code: number; opt: Partial<KeyboardEventInit> }[],
  delayOverride: number
) => {
  events.forEach(function (e) {
    return getActiveEditElement().dispatchEvent(
      getKeyboardEvent(e.name, e.code, e.opt)
    );
  });
  return delay(delayOverride || BASE_DELAY);
};

export const simulateKey = (
  code: number,
  delayOverride: number = 0,
  opts: Partial<KeyboardEventInit> = {}
) => {
  return simulateSequence(
    [
      {
        name: "keydown",
        code: code,
        opt: opts,
      },
      {
        name: "keyup",
        code: code,
        opt: opts,
      },
    ],
    delayOverride
  );
};

export const changeHeading = (heading: number, delayOverride: number) => {
  return simulateSequence(
    [
      {
        name: "keydown",
        code: 18,
        opt: {
          altKey: true,
        },
      },
      {
        name: "keydown",
        code: 91,
        opt: {
          metaKey: true,
        },
      },
      {
        name: "keydown",
        code: 48 + heading,
        opt: {
          altKey: true,
          metaKey: true,
        },
      },
      {
        name: "keyup",
        code: 91,
        opt: {
          altKey: true,
        },
      },
      {
        name: "keyup",
        code: 18,
        opt: {},
      },
    ],
    delayOverride
  );
};

export const pressEnter = (delayOverride: number) => {
  return simulateKey(13, delayOverride);
};

export const pressEsc = (delayOverride?: number) => {
  return simulateKey(27, delayOverride);
};

export const pressBackspace = (delayOverride: number) => {
  return simulateKey(8, delayOverride);
};
export const pressTab = (delayOverride: number) => {
  return simulateKey(9, delayOverride);
};
export const pressShiftTab = (delayOverride: number) => {
  return simulateKey(9, delayOverride, {
    shiftKey: true,
  });
};
export const pressDownKey = (delayOverride: number) => {
  return simulateKey(40, delayOverride, {
    shiftKey: true,
  });
};
export const pressCtrlV = (delayOverride: number) => {
  return simulateKey(118, delayOverride, {
    metaKey: true,
  });
};
export const getInputEvent = () => {
  return new Event("input", {
    bubbles: true,
    cancelable: true,
  });
};
