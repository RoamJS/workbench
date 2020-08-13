// Great code example. thank you bro:  https://gist.github.com/thesved/79371d0c1dd34b6750c846368b323113
// Updated with code from @erik_newhard https://gist.github.com/everruler12

/*
 * Roam template PoC by @ViktorTabori
 * 0.1alpha
 *
 * How to install it:
 *  - go to `roam/js` page`
 *  - make a new node: {{[[roam/js]]}}
 *  - put this code under that node
 *  - set type to javascript and allow the js to run
 *  - create a template page with some content: [[template]]/test
 *  - write :test: to you daily page and see what happens
 *
 * known issues:
 *  - looks hacky
 *  - for longer templates it messes up some lines
 */
function include_script(url) {

    var script = document.createElement('script')
    script.src = url
    script.type = 'text/javascript'

    // check if script is already included, and include if not
    const scripts = Array.from(document.getElementsByTagName('script'))

    if (scripts.filter(x => x.src == url).length == 0)
        document.getElementsByTagName('head').item(0).appendChild(script)

}

// Moment.js https://momentjs.com/
include_script('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min.js')

function replace_variables(tmp) {
    variables = [{
        syntax: "::current_time::",
        fn() {
            return moment().format('HH:mm')
        }
    }, {
        syntax: "::today::",
        fn() {
            return `[[${moment().format('MMMM Do, YYYY')}]]`
        }
    }]

    return variables.reduce((acc, transform) => {
        var re = new RegExp(transform.syntax, "g")
        return acc.replace(re, transform.fn())
    }, tmp)
}



document.addEventListener('input', function(e) {
    if ('_templateHook' in window) {
        setTimeout(function() {
            window._templateHook(e);
        }, 0);
    }
});

window._templateHook = async function(e) {
    // logging
    window._e = e;

    // exit if not target
    var elem = e.target
    if (elem.nodeName != 'TEXTAREA' || e.data != ':') return;

    console.log('ok', elem.value, elem);

    // nativeValueSetter to bypass
    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;

    // resolve templates
    var tab = 0;
    var text = elem.value;
    elem.value.replace(/:([^:]+):/g, async function(_, v, position) {
        // lookup template
        var tmp = getTemplate(v);

        // if no result
        if (!tmp) {
            return _;
        }

        tmp = replace_variables(tmp)

        console.log('template:', v, tmp);

        // remove first 
        tmp = tmp.replace(/^\s*- /, '').split("\n");

        // process first line
        var line = tmp.shift();
        text = text.replace(_, line);

         // handle heading
            heading = (line.match(/^\s*- (#*) /) || ['', ''])[1].length;
            if (heading > 0) {
              console.log('heading:', heading, line.match(/^\s*- (#*) /));
              KeyboardLib.changeHeading(heading);
            }

            // set element value
            elem = KeyboardLib.getActiveEditElement();
            line = line.replace(/^\s*- ### /, '');
            line = line.replace(/^\s*- ## /, '');
            line = line.replace(/^\s*- # /, '');
            line = line.replace(/^\s*- ?/, '');
            
            if (line == '') line = ' ';
            setEmptyNodeValue(elem, line)
           if (line.includes('#')) { 
             await KeyboardLib.delay(250);
             await KeyboardLib.pressEnter();
           }
            // console.log('dispatch event');
            // elem.dispatchEvent(new Event('input', {
            //     bubbles: true,
            //     cancelable: true
            // }));

            await KeyboardLib.delay(150);

        // process lines
        while (tmp.length) {
            // get new line
            elem.focus();
            elem.selectionStart = elem.value.length;
            elem.selectionEnd = elem.value.length;

            // get new line and row
            await KeyboardLib.pressEnter();
            elem = KeyboardLib.getActiveEditElement();
            line = tmp.shift();

            // handle tabs
            tab = line.match(/^\s*/)[0].length / 2 - tab; // tab difference
            console.log('tab:', tab);
            if (tab > 0) {
                for (var i = 0; i < tab; i++) {
                    await KeyboardLib.pressTab()
                }
            } else if (tab < 0) {
                for (var i = 0; i < -tab; i++) {
                    await KeyboardLib.pressShiftTab();
                }
            }
            tab = line.match(/^\s*/)[0].length / 2; // save current tab length

            // handle heading
            heading = (line.match(/^\s*- (#*) /) || ['', ''])[1].length;
            if (heading > 0) {
              console.log('heading:', heading, line.match(/^\s*- (#*) /));
              KeyboardLib.changeHeading(heading);
            }

            // set element value
            elem = KeyboardLib.getActiveEditElement();
            line = line.replace(/^\s*- ### /, '');
            line = line.replace(/^\s*- ## /, '');
            line = line.replace(/^\s*- # /, '');
            line = line.replace(/^\s*- ?/, '');
            
            if (line == '') line = ' ';
            setEmptyNodeValue(elem, line)
           if (line.includes('#')) { 
             await KeyboardLib.delay(250);
             await KeyboardLib.pressEnter();
           }
            // console.log('dispatch event');
            // elem.dispatchEvent(new Event('input', {
            //     bubbles: true,
            //     cancelable: true
            // }));

            await KeyboardLib.delay(150);

        }
    });
}

window.getTemplate = function(name) {
    /* resolve node function by @ViktorTabori
     * id: node id
     * level: depth needed for indention
     * trail: list of ids to avoid loops
     * resolve: resolve block references and embeds starting with an exclamation mark: !{{embed:((blockid))}} and !((blockid))
     * skipFirstPrefix: no prefix, needed for block embeds and references
     * stop: doesn't resolve children, needed for block reference resolution
     */
    function resolveNode(id, level, trail, resolve, skipFirstPrefix, stop) {
        var level = level || 0; // for indentation
        var trail = Object.assign({}, trail); // to avoid loops
        var prefix = skipFirstPrefix ? '' : ' '.repeat(2 * Math.max(level - 1, 0)) + '- '; // indention starting from level 2
        var newLine = skipFirstPrefix && stop ? '' : "\n"; // no new line when we resolve simple block references
        var ret = '';

        // avoid loops: skip if trail already contains id
        if (trail[id]) return;
        trail[id] = true;

        // get node info
        var node = window.roamAlphaAPI.pull("[*]", id);

        // node order
        var order = node[':block/order'] || 0;

        // add heading to prefix
        if (node[':block/heading'] && node[':block/heading'] > 0) {
            prefix += '#'.repeat(node[':block/heading']) + ' ';
        }

        // current node string
        if (typeof node[':block/string'] != 'undefined') {
            // resolve block EMBEDs
            var regexEmbed = resolve ? /!?{{\[*embed\]*\s*:\s*\(\(([^\)]*)\)\)\s*}}/ig : /!{{\[*embed\]*\s*:\s*\(\(([^\)]*)\)\)\s*}}/ig;
            node[':block/string'] = node[':block/string'].replace(regexEmbed, function(_, v) {
                var uid = v.trim();
                var id = window.roamAlphaAPI.q("[:find ?e :in $ ?a :where [?e :block/uid ?a]]", uid);
                if (id.length == 0) {
                    return _;
                }
                var block = resolveNode(id[0][0], level, trail, true, true); // resolve node, no prefix
                if (typeof block != 'undefined') { // for loops we got back undefined
                    return block;
                } else {
                    return 'LOOP:' + _;
                }
            });

            // resolve block REFERENCEs
            var regexReference = resolve ? /!?\(\(([^\)]*)\)\)/ig : /!\(\(([^\)]*)\)\)/ig;
            node[':block/string'] = node[':block/string'].replace(regexReference, function(_, v) {
                var uid = v.trim();
                var id = window.roamAlphaAPI.q("[:find ?e :in $ ?a :where [?e :block/uid ?a]]", uid);
                if (id.length == 0) {
                    return _;
                }
                var block = resolveNode(id[0][0], level, trail, true, true, true); // resolve node, no prefix, don't resolve children
                if (typeof block != 'undefined') { // for loops we got back undefined
                    return block;
                } else {
                    return 'LOOP:' + _;
                }
            });


            // add block text to return
            ret += prefix + node[':block/string'] + newLine;
        }

        // handle children
        if (node[':block/children'] && !stop) {
            var children = [];
            var tmp;

            // get children data
            for (var i in node[':block/children']) {
                tmp = resolveNode(node[':block/children'][i][':db/id'], level + 1, trail);
                if (typeof tmp != 'undefined') {
                    children.push(tmp);
                }
            }

            // sort children in order
            children.sort(function(a, b) {
                return a.order - b.order
            })

            // concat children text
            ret += children.map(function(i) {
                return i.txt
            }).join('');
        }

        // return based on how deep we are in the graph
        if (level == 0 || skipFirstPrefix) {
            return ret;
        } else {
            return {
                txt: ret,
                order: order
            };
        }
    }

    // check API endpoint
    if (!window.roamAlphaAPI || !window.roamAlphaAPI.q || !window.roamAlphaAPI.pull) return; // no api endpoint

    // search node ID
    var nodeId; // page we look for
    var search = ['template', '[[template]]']; // search for template in template/name, [[template]]/name, ...
    for (var i in search) {
        nodeId = window.roamAlphaAPI.q("[:find ?e :in $ ?a :where [?e :node/title ?a]]", search[i] + '/' + name);
        if (nodeId.length) {
            nodeId = nodeId[0][0];
            break;
        }
    }

    if (!nodeId || nodeId.length == 0) return; // no such template

    return resolveNode(nodeId);
}

window.KeyboardLib = {
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
            return KeyboardLib.getActiveEditElement().dispatchEvent(KeyboardLib.getKeyboardEvent(e.name, e.code, e.opt));
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