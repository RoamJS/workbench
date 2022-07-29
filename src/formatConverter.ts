export const formatter = {};
export const currentPageName = "";
export let enabled = false;
export const toggleFeature = (flag: boolean) => (enabled = flag);

export const show = () => {
  // if already open, do nothing
  if (document.querySelector("#r42formatConvertUI")) return;

  let panelTitle = "Roam<sup>42</sup> Format Converter (Beta)";

  jsPanel.create({
    id: "r42formatConvertUI",
    headerControls: { maximize: "remove" },
    headerTitle: `<div style="font-variant: normal;position:relative;left:5px;z-index:1000;width:300px;color:white !important;padding-top:2px;">${panelTitle}</div>`,
    iconfont: [
      "bp3-button bp3-minimal bp3-small bp3-icon-small-minus",
      "bp3-button bp3-minimal bp3-small bp3-icon-chevron-down",
      "bp3-button bp3-minimal bp3-small bp3-icon-chevron-up",
      "custom-maximize",
      "bp3-button bp3-minimal bp3-small bp3-icon-cross",
    ],
    contentSize: {
      width: () => window.innerWidth * 0.7,
      height: () => window.innerHeight * 0.4,
    },
    theme: "light",
    contentOverflow: "hidden",
    onwindowresize: true,
    dragit: {
      containment: 10,
      snap: { containment: true, repositionOnSnap: true },
    },
    position: {
      my: "center-bottom",
      at: "center-bottom",
      offsetX: +10,
      offsetY: -10,
    },
    content: `
      <div style="padding:10px">
        Output format:
        <select id="r42formatConverterSelection" onchange="roam42.formatConverterUI.changeFormat()">
          <option value="puretext_Space">Text with space indentation</option>
          <option value="puretext_Tab">Text with tab indentation</option>
          <option value="pureText_NoIndentation">Text with no indentation</option>
          <option value="markdown_Github">GitHub Flavored Markdown</option>
          <option value="markdown_Github_flatten">GitHub Flavored Markdown - flatten</option>
          <option value="html_Simple">HTML</option>
          <option value="html_Markdown_Github_flatten">HTML after Markdown Flattening</option>
          <option value="json_Simple">JSON in simple format</option>
					<option value="json_Simple_withIndentation">JSON in simple format with Indentation in text string</option>
        </select>
        <div style="float:right"><div title="Refresh view based on current page" class="bp3-button bp3-minimal bp3-small bp3-icon-refresh" onclick="roam42.formatConverterUI.changeFormat()"></div></div>
        <div style="float:right"><div title="Copy to clipboard" class="bp3-button bp3-minimal bp3-small bp3-icon-clipboard" onclick="roam42.formatConverterUI.copyToClipboard()"></div></div>
        <div style="float:right"><div title="Save to a file" class="bp3-button bp3-minimal bp3-small bp3-icon-floppy-disk"  onclick="roam42.formatConverterUI.saveToFile()"></div></div>
      </div>
      <div style="margin-left:10px;margin-right:10px;height:90%;">
        <textarea id='formatConverterUITextArea' style="font-family: monospace;width:100%;height:100%;"></textarea>
      </div>
      `,
    callback: async function () {
      formatConverterUITextArea = document.getElementById(
        "formatConverterUITextArea"
      );
      setTimeout(async () => {
        // document.querySelector('#r42formatConvertUI').style.backgroundColor='red !important';
        document.getElementById("r42formatConverterSelection")[
          roam42.formatConverterUI.getLastFormat()
        ].selected = true;
        roam42.formatConverterUI.changeFormat();
      }, 100);
    },
  });
}; //END roam42.formatConverterUI.show

export const htmlview = async () => {
  var uid = await roam42.common.currentPageZoomLevelUID();
  var results = await roam42.formatConverter.formatter.htmlSimple(uid);

  var winPrint = await window.open(
    "",
    "",
    "left=50,top=100,width=1000,height=600,toolbar=0,scrollbars=0,status=0"
  );
  results = results.replace("<html>", "<!DOCTYPE html>");
  // add custom css
  var customCSSNode = await roam42.common.getBlocksReferringToThisPage(
    "42WebViewCSS"
  );
  if (customCSSNode.length > 0 && customCSSNode[0][0].children) {
    var childCSS = customCSSNode[0][0].children[0].string;
    if (childCSS.substring(0, 6) == "```css") {
      childCSS = childCSS.replace("```css", "");
      childCSS = childCSS.replace("```", "");
      results = results.replace(
        "</body>",
        "<style>\n" + childCSS + "</style>\n</body>"
      );
    }
  }
  results = results.replace(
    "</body>",
    "\n<script>setTimeout(()=>{renderMathInElement(document.body);},1000)</script>\n</body>"
  );

  winPrint.document.write(results);

  setTimeout(() => {
    const addElementToPage = (element, tagId, typeT) => {
      Object.assign(element, { type: typeT, async: false, tagId: tagId });
      winPrint.document.getElementsByTagName("head")[0].appendChild(element);
    };
    const addCSSToPage = (tagId, cssToAdd) => {
      addElementToPage(
        Object.assign(winPrint.document.createElement("link"), {
          href: cssToAdd,
          rel: "stylesheet",
        }),
        tagId,
        "text/css"
      );
    };
    const addScriptToPage = (tagId, script) => {
      addElementToPage(
        Object.assign(document.createElement("script"), { src: script }),
        tagId,
        "text/javascript"
      );
    };
    addCSSToPage(
      "KatexCSS",
      "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css"
    );
    addScriptToPage(
      "KatexJS",
      "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js"
    );
    addScriptToPage(
      "KatexJS-auto",
      "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/contrib/auto-render.min.js"
    );
    addCSSToPage("myStyle", roam42.host + "css/markdown/default.css");
    winPrint.document.title = "Roam42 Viewer";
  }, 50);
};

var sortObjectsByOrder = async (o) => {
  return o.sort(function (a, b) {
    return a.order - b.order;
  });
};

var sortObjectByString = async (o) => {
  return o.sort(function (a, b) {
    return a.string.localeCompare(b.string);
  });
};

// output( blockText, nodeCurrent, level, parent, flatten )

var walkDocumentStructureAndFormat = async (
  nodeCurrent,
  level,
  outputFunction,
  parent,
  flatten
) => {
  // console.log('walkDocumentStructureAndFormat ' + flatten)
  if (typeof nodeCurrent.title != "undefined") {
    // Title of page
    outputFunction(nodeCurrent.title, nodeCurrent, 0, parent, flatten);
    roam42.formatConverter.currentPageName = nodeCurrent.title;
  } else if (typeof nodeCurrent.string != "undefined") {
    // Text of a block
    // check if there are embeds and convert text to that
    let blockText = nodeCurrent.string;
    // First: check for block embed
    blockText = blockText.replaceAll("{{embed:", "{{[[embed]]:");
    let embeds = blockText.match(/\{\{\[\[embed\]\]\: \(\(.+?\)\)\}\}/g);
    //Test for block embeds
    if (embeds != null) {
      for (const e of embeds) {
        let uid = e.replace("{{[[embed]]: ", "").replace("}}", "");
        uid = uid.replaceAll("(", "").replaceAll(")", "");
        let embedResults = await roam42.common.getBlockInfoByUID(uid, true);
        try {
          blockText = await blockText.replace(e, embedResults[0][0].string);
          //test if the newly generated block has any block refs
          blockText = await resolveBlockRefsInText(blockText);
          outputFunction(blockText, nodeCurrent, level, parent, flatten);
          //see if embed has children
          if (typeof embedResults[0][0].children != "undefined" && level < 30) {
            let orderedNode = await sortObjectsByOrder(
              embedResults[0][0].children
            );
            for (let i in await sortObjectsByOrder(
              embedResults[0][0].children
            )) {
              await walkDocumentStructureAndFormat(
                orderedNode[i],
                level + 1,
                (embedResults, nodeCurrent, level) => {
                  outputFunction(
                    embedResults,
                    nodeCurrent,
                    level,
                    parent,
                    flatten
                  );
                },
                embedResults[0][0],
                parent,
                flatten
              );
            }
          }
        } catch (e) {}
      }
    } else {
      // Second: check for block refs
      blockText = await resolveBlockRefsInText(blockText);
      outputFunction(blockText, nodeCurrent, level, parent, flatten);
    }
  }
  // If block/node has children nodes, process them
  if (typeof nodeCurrent.children != "undefined") {
    let orderedNode = await sortObjectsByOrder(nodeCurrent.children);
    for (let i in await sortObjectsByOrder(nodeCurrent.children))
      await walkDocumentStructureAndFormat(
        orderedNode[i],
        level + 1,
        outputFunction,
        nodeCurrent,
        flatten
      );
  }
};

var resolveBlockRefsInText = async (blockText) => {
  let refs = blockText.match(/\(\(.+?\)\)/g);
  if (refs != null) {
    for (const e of refs) {
      let uid = e.replaceAll("(", "").replaceAll(")", "");
      let results = await roam42.common.getBlockInfoByUID(uid, false);
      if (results) blockText = blockText.replace(e, results[0][0].string);
    }
  }
  return blockText;
};
roam42.formatConverter.resolveBlockRefsInText = resolveBlockRefsInText;

var roamMarkupScrubber = (blockText, removeMarkdown = true) => {
  if (
    blockText.substring(0, 9) == "{{[[query" ||
    blockText.substring(0, 7) == "{{query"
  )
    return "";
  if (blockText.substring(0, 12) == "{{attr-table") return "";
  if (blockText.substring(0, 15) == "{{[[mentions]]:") return "";
  if (blockText.substring(0, 8) == ":hiccup " && blockText.includes(":hr"))
    return "---"; // Horizontal line in markup, replace it with MD
  blockText = blockText.replaceAll("{{TODO}}", "TODO");
  blockText = blockText.replaceAll("{{[[TODO]]}}", "TODO");
  blockText = blockText.replaceAll("{{DONE}}", "DONE");
  blockText = blockText.replaceAll("{{[[DONE]]}}", "DONE");
  blockText = blockText.replaceAll("{{[[table]]}}", "");
  blockText = blockText.replaceAll("{{[[kanban]]}}", "");
  blockText = blockText.replaceAll("{{mermaid}}", "");
  blockText = blockText.replaceAll("{{word-count}}", "");
  blockText = blockText.replaceAll("{{date}}", "");
  blockText = blockText.replaceAll("{{diagram}}", "");
  blockText = blockText.replaceAll("{{POMO}}", "");
  blockText = blockText.replaceAll("{{slider}}", "");
  blockText = blockText.replaceAll("{{TaoOfRoam}}", "");
  blockText = blockText.replaceAll("{{orphans}}", "");
  blockText = blockText.replace("::", ":"); // ::
  blockText = blockText.replaceAll(/\(\((.+?)\)\)/g, "$1"); // (())
  blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, "$1"); // [[ ]]  First run
  blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, "$1"); // [[ ]]  second run
  blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, "$1"); // [[ ]]  second run
  // blockText = blockText.replaceAll(/\$\$(.+?)\$\$/g, '$1');      // $$ $$
  blockText = blockText.replaceAll(/\B\#([a-zA-Z]+\b)/g, "$1"); // #hash tag
  blockText = blockText.replaceAll(
    /\{\{calc: (.+?)\}\}/g,
    function (all, match) {
      try {
        return eval(match);
      } catch (e) {
        return "";
      }
    }
  );
  // calc functions  {{calc: 4+4}}
  if (removeMarkdown) {
    blockText = blockText.replaceAll(/\*\*(.+?)\*\*/g, "$1"); // ** **
    blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, "$1"); // __ __
    blockText = blockText.replaceAll(/\^\^(.+?)\^\^/g, "$1"); // ^^ ^^
    blockText = blockText.replaceAll(/\~\~(.+?)\~\~/g, "$1"); // ~~ ~~
    blockText = blockText.replaceAll(/\!\[(.+?)\]\((.+?)\)/g, "$1 $2"); //images with description
    blockText = blockText.replaceAll(/\!\[\]\((.+?)\)/g, "$1"); //imags with no description
    blockText = blockText.replaceAll(/\[(.+?)\]\((.+?)\)/g, "$1: $2"); //alias with description
    blockText = blockText.replaceAll(/\[\]\((.+?)\)/g, "$1"); //alias with no description
    blockText = blockText.replaceAll(/\[(.+?)\](?!\()(.+?)\)/g, "$1"); //alias with embeded block (Odd side effect of parser)
  } else {
    blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, "_$1_"); // convert for use as italics _ _
  }

  return blockText;
};

roam42.formatConverter.formatter.pureText_SpaceIndented = async (
  blockText,
  nodeCurrent,
  level,
  parent,
  flatten
) => {
  if (nodeCurrent.title) return;
  blockText = roamMarkupScrubber(blockText, true);
  let leadingSpaces = level > 1 ? "  ".repeat(level - 1) : "";
  output += leadingSpaces + blockText + "\n";
};

roam42.formatConverter.formatter.pureText_TabIndented = async (
  blockText,
  nodeCurrent,
  level,
  parent,
  flatten
) => {
  if (nodeCurrent.title) return;
  try {
    blockText = roamMarkupScrubber(blockText, true);
  } catch (e) {}
  let leadingSpaces = level > 1 ? "\t".repeat(level - 1) : "";
  output += leadingSpaces + blockText + "\n";
};

roam42.formatConverter.formatter.pureText_NoIndentation = async (
  blockText,
  nodeCurrent,
  level,
  parent,
  flatten
) => {
  if (nodeCurrent.title) return;
  try {
    blockText = roamMarkupScrubber(blockText, true);
  } catch (e) {}
  output += blockText + "\n";
};

roam42.formatConverter.formatter.markdownGithub = async (
  blockText,
  nodeCurrent,
  level,
  parent,
  flatten
) => {
  // console.log("1",blockText)
  // console.log(flatten)
  if (flatten == true) {
    level = 0;
  } else {
    level = level - 1;
  }
  if (nodeCurrent.title) {
    output += "# " + blockText;
    return;
  }

  //convert soft line breaks, but not with code blocks
  if (blockText.substring(0, 3) != "```")
    blockText = blockText.replaceAll("\n", "<br/>");

  if (nodeCurrent.heading == 1) blockText = "# " + blockText;
  if (nodeCurrent.heading == 2) blockText = "## " + blockText;
  if (nodeCurrent.heading == 3) blockText = "### " + blockText;
  // process todo's
  var todoPrefix = level > 0 ? "" : "- "; //todos on first level need a dash before them
  if (blockText.substring(0, 12) == "{{[[TODO]]}}") {
    blockText = blockText.replace("{{[[TODO]]}}", todoPrefix + "[ ]");
  } else if (blockText.substring(0, 8) == "{{TODO}}") {
    blockText = blockText.replace("{{TODO}}", todoPrefix + "[ ]");
  } else if (blockText.substring(0, 12) == "{{[[DONE]]}}") {
    blockText = blockText.replace("{{[[DONE]]}}", todoPrefix + "[x]");
  } else if (blockText.substring(0, 8) == "{{DONE}}") {
    blockText = blockText.replace("{{DONE}}", todoPrefix + "[x]");
  }
  // console.log("2",blockText)
  try {
    blockText = roamMarkupScrubber(blockText, false);
  } catch (e) {}
  // console.log("3",blockText)

  if (level > 0 && blockText.substring(0, 3) != "```") {
    //handle indenting (first level is treated as no level, second level treated as first level)
    if (parent["view-type"] == "numbered") {
      output += "    ".repeat(level - 1) + "1. ";
    } else {
      output += "  ".repeat(level) + "- ";
    }
  } else {
    //level 1, add line break before
    blockText = "\n" + blockText;
  }
  // console.log("4",blockText)
  output += blockText + "  \n";
};

roam42.formatConverter.formatter.htmlSimple = async (uid) => {
  var md = await roam42.formatConverter.iterateThroughTree(
    uid,
    roam42.formatConverter.formatter.markdownGithub
  );
  marked.setOptions({
    gfm: true,
    xhtml: false,
    pedantic: false,
  });
  md = md.replaceAll("- [ ] [", "- [ ]&nbsp;&nbsp;["); //fixes odd isue of task and alis on same line
  md = md.replaceAll("- [x] [", "- [x]&nbsp;["); //fixes odd isue of task and alis on same line
  md = md.replaceAll(/\{\{\youtube\: (.+?)\}\} /g, (str, lnk) => {
    lnk = lnk.replace("youtube.com/", "youtube.com/embed/");
    lnk = lnk.replace("youtu.be/", "youtube.com/embed/");
    lnk = lnk.replace("watch?v=", "");
    return `<iframe width="560" height="315" class="embededYoutubeVieo" src="${lnk}" frameborder="0"></iframe>`;
  });

  //lATEX handling
  md = md.replace(/  \- (\$\$)/g, "\n\n$1"); //Latex is centered
  const tokenizer = {
    codespan(src) {
      var match = src.match(/\$\$(.*?)\$\$/);
      if (match) {
        var str = match[0];
        str = str.replaceAll("<br>", " ");
        str = str.replaceAll("<br/>", " ");
        str = `<div>${str}</div>`;
        return { type: "text", raw: match[0], text: str };
      }
      // return false to use original codespan tokenizer
      return false;
    },
  };
  marked.use({ tokenizer });
  md = marked(md);

  return `<html>\n
              <head>
              </head>
              <body>\n${md}\n
              </body>\n
            </html>`;
};

roam42.formatConverter.formatter.htmlMarkdownFlatten = async (uid) => {
  var md = await roam42.formatConverter.iterateThroughTree(
    uid,
    roam42.formatConverter.formatter.markdownGithub,
    true
  );
  marked.setOptions({
    gfm: true,
    xhtml: false,
    pedantic: false,
  });
  md = md.replaceAll("- [ ] [", "- [ ]&nbsp;&nbsp;["); //fixes odd isue of task and alis on same line
  md = md.replaceAll("- [x] [", "- [x]&nbsp;["); //fixes odd isue of task and alis on same line
  md = md.replaceAll(/\{\{\youtube\: (.+?)\}\} /g, (str, lnk) => {
    lnk = lnk.replace("youtube.com/", "youtube.com/embed/");
    lnk = lnk.replace("youtu.be/", "youtube.com/embed/");
    lnk = lnk.replace("watch?v=", "");
    return `<iframe width="560" height="315" class="embededYoutubeVieo" src="${lnk}" frameborder="0"></iframe>`;
  });

  //lATEX handling
  md = md.replace(/  \- (\$\$)/g, "\n\n$1"); //Latex is centered
  const tokenizer = {
    codespan(src) {
      var match = src.match(/\$\$(.*?)\$\$/);
      if (match) {
        var str = match[0];
        str = str.replaceAll("<br>", " ");
        str = str.replaceAll("<br/>", " ");
        str = `<div>${str}</div>`;
        return { type: "text", raw: match[0], text: str };
      }
      // return false to use original codespan tokenizer
      return false;
    },
  };
  marked.use({ tokenizer });
  md = marked(md);

  return `<html>\n
              <head>
              </head>
              <body>\n${md}\n
              </body>\n
            </html>`;
};

roam42.formatConverter.flatJson = async (
  uid,
  withIndents = false,
  formatOutputAsJsonString = true
) => {
  //creates a very simple json output in the order of the document
  var results = await roam42.common.getBlockInfoByUID(uid, true);
  var jsonOutput = [];
  if (results == null) return;
  //nodeCurrent, level, outputFunction, parent, flatten
  await walkDocumentStructureAndFormat(
    results[0][0],
    0,
    async (blockText, nodeCurrent, level, parent, flatten) => {
      let blockOutput = roamMarkupScrubber(blockText, true);
      if (withIndents == true)
        blockOutput =
          (level > 1 ? "  ".repeat(level - 1) + " - " : "+ ") + blockOutput;
      try {
        jsonOutput.push({
          uid: nodeCurrent.uid,
          order: nodeCurrent.order,
          parentUID: parent.uid,
          level: level,
          blockText: blockOutput,
        });
      } catch (e) {}
    },
    null,
    false
  );
  if (formatOutputAsJsonString == true)
    output = JSON.stringify(jsonOutput, 0, 2);
  else output = jsonOutput;
  return output;
};

var output = "";

roam42.formatConverter.iterateThroughTree = async (
  uid,
  formatterFunction,
  flatten
) => {
  var results = await roam42.common.getBlockInfoByUID(uid, true);
  output = "";
  //nodeCurrent, level, outputFunction, parent, flatten
  await walkDocumentStructureAndFormat(
    results[0][0],
    0,
    formatterFunction,
    null,
    flatten
  );
  return output;
};

window.roam42.formatConverter.testingReload = () => {
  console.clear();
  roam42.loader.addScriptToPage(
    "formatConverter",
    roam42.host + "ext/formatConverter.js"
  );
  //    roam42.loader.addScriptToPage( 'formatConverterUI', roam42.host + 'ext/formatConverterUI.js');
  setTimeout(async () => {
    var uid = await roam42.common.currentPageUID();
    console.log("uid", uid);
    // console.log(x)
    //roam42.test
  }, 1000);
};

roam42.formatConverterUI = {};

let formatConverterUITextArea = null;
let clipboardConvertedText = "";

roam42.formatConverterUI.getLastFormat = () => {
  var lastValue = Cookies.get("formatConverterUI_lastFormat");
  console.log(lastValue);
  if (lastValue === undefined) {
    return 0;
  } else {
    return lastValue;
  }
};

roam42.formatConverterUI.setLastFormat = (val) => {
  Cookies.set("formatConverterUI_lastFormat", val, { expires: 365 });
};

roam42.formatConverterUI.changeFormat = async () => {
  //save selection state
  roam42.formatConverterUI.setLastFormat(
    document.getElementById("r42formatConverterSelection").selectedIndex
  );
  var uid = await roam42.common.currentPageZoomLevelUID();
  clipboardConvertedText = "";
  switch (document.getElementById("r42formatConverterSelection").value) {
    case "puretext_Tab":
      clipboardConvertedText = await roam42.formatConverter.iterateThroughTree(
        uid,
        roam42.formatConverter.formatter.pureText_TabIndented
      );
      break;
    case "puretext_Space":
      clipboardConvertedText = await roam42.formatConverter.iterateThroughTree(
        uid,
        roam42.formatConverter.formatter.pureText_SpaceIndented
      );
      break;
    case "pureText_NoIndentation":
      clipboardConvertedText = await roam42.formatConverter.iterateThroughTree(
        uid,
        roam42.formatConverter.formatter.pureText_NoIndentation
      );
      break;
    case "markdown_Github":
      clipboardConvertedText = await roam42.formatConverter.iterateThroughTree(
        uid,
        roam42.formatConverter.formatter.markdownGithub
      );
      break;
    case "markdown_Github_flatten":
      clipboardConvertedText = await roam42.formatConverter.iterateThroughTree(
        uid,
        roam42.formatConverter.formatter.markdownGithub,
        true
      );
      break;
    case "html_Simple":
      clipboardConvertedText =
        await roam42.formatConverter.formatter.htmlSimple(uid);
      break;
    case "html_Markdown_Github_flatten":
      clipboardConvertedText =
        await roam42.formatConverter.formatter.htmlMarkdownFlatten(uid);
      break;
    case "json_Simple":
      clipboardConvertedText = await roam42.formatConverter.flatJson(
        uid,
        false,
        true
      );
      break;
    case "json_Simple_withIndentation":
      clipboardConvertedText = await roam42.formatConverter.flatJson(
        uid,
        true,
        true
      );
      break;
  }
  formatConverterUITextArea.value = clipboardConvertedText;
  formatConverterUITextArea.scrollLeft = 0;
  formatConverterUITextArea.scrollTop = 0;
};

roam42.formatConverterUI.copyToClipboard = async () => {
  navigator.clipboard.writeText(clipboardConvertedText);
};

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

roam42.formatConverterUI.saveToFile = async () => {
  var dt = new Date().toISOString();
  var filename =
    roam42.formatConverter.currentPageName + "-" + new Date().toISOString();
  filename = filename.replace(/(\W+)/gi, "-") + ".txt";
  download(filename, formatConverterUITextArea.value);
  roam42.help.displayMessage("File saved: " + filename, 3000);
};

window.roam42.formatConverterUI.testingReload = () => {
  if (document.querySelector("#r42formatConvertUI"))
    document.querySelector("#r42formatConvertUI").remove();
  roam42.loader.addScriptToPage(
    "formatConverter",
    roam42.host + "ext/formatConverter.js"
  );
  roam42.loader.addScriptToPage(
    "formatConverterUI",
    roam42.host + "ext/formatConverterUI.js"
  );
  setTimeout(async () => {
    // roam42.formatConverterUI.show()
    roam42.formatConverterUI.htmlview();
  }, 500);
};
