window.roam42KeyboardLib = {
    // thank you @VladyslavSitalo for the awesome Roam Toolkit, and the basis for this code
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    BASE_DELAY: 20,

    delay(millis) {
        return new Promise(resolve => setTimeout(resolve, millis))
    },
    getKeyboardEvent: function(type, code, opts) {
        return new KeyboardEvent(type, {
            bubbles: true,
            cancelable: true,
            keyCode: code,
            ...opts,
        })
    },
    getActiveEditElement: function() {
        // stolen from Surfingkeys. Needs work.
        var element = document.activeElement
        // on some pages like chrome://history/, input is in shadowRoot of several other recursive shadowRoots.
        while (element.shadowRoot) {
            if (element.shadowRoot.activeElement) {
                element = element.shadowRoot.activeElement
            } else {
                var subElement = element.shadowRoot.querySelector('input, textarea, select')
                if (subElement) {
                    element = subElement
                }
                break
            }
        }
        return element
    },
    async simulateSequence(events, delayOverride) {
        ;
        events.forEach(function(e) {
            return roam42KeyboardLib.getActiveEditElement().dispatchEvent(roam42KeyboardLib.getKeyboardEvent(e.name, e.code, e.opt));
        });
        return this.delay(delayOverride || this.BASE_DELAY);
    },
    async simulateKey(code, delayOverride, opts) {
        return this.simulateSequence([{
            name: 'keydown',
            code: code,
            opt: opts
        }, {
            name: 'keyup',
            code: code,
            opt: opts
        }], delayOverride);
    },
    async changeHeading(heading, delayOverride) {
        return this.simulateSequence(
            [
              {
                    name: 'keydown',
                    code: 18,
                    opt: {
                        altKey: true
                    }
                },
                {
                    name: 'keydown',
                    code: 91,
                    opt: {
                        metaKey: true
                    }
                },
                {
                    name: 'keydown',
                    code: 48 + heading,
                    opt: {
                        altKey: true,
                        metaKey: true
                    }
                },
                {
                    name: 'keyup',
                    code: 91,
                    opt: {
                        altKey: true
                    }
                },
                {
                    name: 'keyup',
                    code: 18,
                    opt: {}
                }
            ],
            delayOverride);
    },
    async pressEnter(delayOverride) {
        return this.simulateKey(13, delayOverride)
    },
    async pressEsc(delayOverride) {
        return this.simulateKey(27, delayOverride)
    },
    async pressBackspace(delayOverride) {
        return this.simulateKey(8, delayOverride)
    },
    async pressTab(delayOverride) {
        return this.simulateKey(9, delayOverride)
    },
    async pressShiftTab(delayOverride) {
        return this.simulateKey(9, delayOverride, {
            shiftKey: true
        })
    },
    async pressDownKey(delayOverride) {
        return this.simulateKey(40, delayOverride, {
            shiftKey: true
        })
    },
    async pressCtrlV(delayOverride) {
        return this.simulateKey(118, delayOverride, {
            metaKey: true
        })
    },
    getInputEvent() {
        return new Event('input', {
            bubbles: true,
            cancelable: true,
        })
    },
}
