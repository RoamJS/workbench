const quickReference: {
  type: string;
  topic: string;
  id: number;
  header?: { c1?: string; c2?: string; c3?: string };
  items: { c1?: string; c2?: string; c3?: string }[];
}[] = [
  {
    type: "keyboard",
    topic: "Roam42 features",
    id: 10,
    header: { c1: "Action", c2: "Primary", c3: "Alternatives" },
    items: [
      { c1: "Roam Quick Reference", c2: "Ctrl-Shift-q", c3: "" },
      { c1: "Convert to date", c2: "Alt-Shift-d", c3: "" },
      { c1: "Jump to date", c2: "Alt-Shift-j", c3: "" },
      { c1: "Next day's note", c2: "Ctrl-Shift-.", c3: "" },
      { c1: "Previous day's note", c2: "Ctrl-Shift-,", c3: "" },
      { c1: "Jump Nav Help", c2: "Meta-j h", c3: "Ctrl-j h" },
      { c1: "", c2: "", c3: "Alt-j h" },
      { c1: "", c2: "", c3: "CMD-j h" },
      {
        c1: "Toggle Deep Nav <em>(must be enabled)</em>",
        c2: "Alt-g or g",
        c3: "Alt-g or g",
      },
      {
        c1: "Live Preview Toggle (must be enabled)",
        c2: "Ctrl-Shift-l",
        c3: "Alt-l",
      },
      { c1: "Sidebar - open left", c2: "Alt-Shift-\\", c3: "" },
      { c1: "Sidebar - open right", c2: "Alt-Shift-/", c3: "" },
      {
        c1: "Daily Notes Popup (must be enabled)",
        c2: "Alt-Shift-,",
        c3: "",
      },
      { c1: "Dictionary", c2: "Alt-Shift-.", c3: "" },
      { c1: "Privacy Mode", c2: "Alt-Shift-p", c3: "" },
      { c1: "Format Converter", c2: "Alt-m", c3: "" },
      { c1: "Web View", c2: "Alt-Shift-m", c3: "" },
      { c1: "Strikeout text", c2: "Alt-Shift-t", c3: "" },
    ],
  },
  {
    type: "featurecenter",
    topic: "Roam42 Jump nav",
    id: 11,
    items: [
      { c1: "Activate Jump Nav", c2: "Meta-j or Alt-j or Ctrl-j or CMD-j" },
      {
        c1: "<em>Press Jump nav key, followed by command below</em>",
        c2: "",
      },
      { c1: "", c2: "" },
      { c1: "<b>Page</b>", c2: "" },
      { c1: "Top of page", c2: "t" },
      { c1: "Bottom of page", c2: "b" },
      { c1: "Expand all", c2: "e" },
      { c1: "Collapse all", c2: "c" },
      { c1: "Open this page in sidebar", c2: "o" },
      { c1: "<b>Linked/Unlinked References</b>", c2: "" },
      { c1: "Toggle Linked Refs", c2: "w" },
      { c1: "Toggle Unlinked Refs", c2: "z" },
      { c1: "Toggle Parents (page level)", c2: "f" },
      { c1: "Expand children", c2: "v" },
      { c1: "Collapse children", c2: "p" },
      { c1: "<b>Blocks<b>", c2: "" },
      { c1: "Copy block ref", c2: "r" },
      { c1: "Copy block ref as alias", c2: "s" },
      { c1: "Expand all", c2: "x" },
      { c1: "Collapse all", c2: "l" },
      { c1: "Insert block above", c2: "i" },
      { c1: "Insert block below", c2: "u" },
      { c1: "Go up a block", c2: "k" },
      { c1: "Go down a block", c2: "j" },
      { c1: "Go to parent block", c2: "g" },
      { c1: "Go to previous sibling", c2: ";" },
      { c1: "Go to next sibling", c2: "'" },

      { c1: "Delete block", c2: "d" },
      { c1: "Align left", c2: "1" },
      { c1: "Center", c2: "2" },
      { c1: "Align right ", c2: "3" },
      { c1: "Justify", c2: "4" },
      { c1: "Add reaction", c2: "a" },
      { c1: "<b>Queries<b>", c2: "" },
      { c1: "Toggle Queries", c2: "y" },
      { c1: "<b>Others<b>", c2: "" },
      { c1: "Toggle left sidebar", c2: "n" },
      { c1: "Toggle right sidebar", c2: "m" },
      { c1: "Roam42 Help", c2: "q" },
      { c1: "Daily Notes Popup", c2: "," },
      { c1: "Dictionary", c2: "." },
    ],
  },
  {
    type: "feature",
    topic: "SmartBlocks",
    id: 12,
    items: [
      {
        c1: "Processing Order",
        c2: "<a target='_blank' href='https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamhacker%2F-GnzmjDA9C.png?alt=media&token=51f66881-04e9-401b-a581-65c47734aaaf'>Diagram of command processing order</a>.",
      },
      {
        c1: "SmartBlock Button",
        c2: "{{caption:42SmartBlock:workflow name}} or vars :variableName1=value1,`",
      },
      {
        c1: "Javascript Development",
        c2: "roam42.smartBlocks.activeWorkflow.vars or roam42.sb.vars['varName']",
      },
      { c1: "---------- Commands ----------", c2: "" },
      {
        c1: "%42SETTING",
        c2: "Roam42 supports the ability to define a setting that is used in the Roam42 engine. A setting is defined with the tag #42Setting followed by the setting name and then the setting value. This can be used by a SmartBlock Builder to store permanent values to be used in a script. <a href='https://www.loom.com/share/474e7e90089d4747be53d19a38dcfb15' target='_blank'>Video</a><br/>1: Name of the setting to retrieve",
      },
      {
        c1: "BLOCKMENTIONS",
        c2: "returns a list of blocks that mention a page reference, with optional filtering. This is a multi-block commands and has some limitations how it interacts with other commands. <a target='_blank' href='https://www.loom.com/share/e7b5cc79438a4875ba8ffef332a6d43a'>Video</a><br/>1: Maximum amount of block references to return.- if set to -1, will return only count of matches <br/>2: Page name or tag name (This parameter is case-sensitive and must match your page or tag name as used in your graph) <br/>3 to X: Optional filtering parameters, with support for include and excluding blocks based on their text with simple text comparison",
      },
      {
        c1: "BLOCKMENTIONSDATED",
        c2: "returns a list of blocks that mention a page reference, based on a specified date range, with optional filtering. This is a multi-block commands and has some limitations how it interacts with other commands.<br/>1: Maximum amount of block references to return. If set to -1, will return only count of matches <br/>2: Page name or tag name (This parameter is case-sensitive and must match your page or tag name as used in your graph)<br/>3: Start date tasks with a date from start date and beyond until parameter 3 (End Date). Date NLP is supported, so you can do something like: Today, yesterday, 2020-12-31 and other formats. Set to 0 for no start date. Set parameter 3 and 4 to -1 to have it return blocks that have no date in them<br/>4: End Date all tasks from the end date and before, until parameter 2 (start date).  Date NLP is supported, so you can do something like: Today, yesterday, 2020-12-31 and other formats. Set to 0 for no end date<br/>5 to X: Sort Order: ASC, DESC, NONE <br/>6: Optional filtering parameters, with support for include and excluding blocks based on their text with simple text comparison. Filters are processed before date processing. This means if filters are designed to include or exclude text, they will be processed before the dates are processed.<br/>",
      },
      {
        c1: "BREADCRUMBS",
        c2: "Returns the path of parents for a given block reference<br/>1: Block Reference UID.  + UID to get back just the parent block - to get back just the path, without the parent block <br/> 2: Separator to be used to separate each parent",
      },
      { c1: "CLEARVARS", c2: "Removes all variables from memory" },
      {
        c1: "CLIPBOARDCOPY",
        c2: "Writes text content to the clipboard.<br/>1. text to be written to the clipboard.",
      },
      {
        c1: "CLIPBOARDPASTETEXT",
        c2: "Reads the text of the clipboard as text",
      },
      {
        c1: "CONCAT",
        c2: "Combines a comma separated list of strings into one string.<br/>1. Comma separated list",
      },
      {
        c1: "CURRENTPAGENAME",
        c2: "Returns the name of the current page. ",
      },
      {
        c1: "CURRENTBLOCKREF",
        c2: "Stores the current block reference in a variable that can be used later by GET or JavaScript.<br/>1. Name of variable",
      },
      {
        c1: "CURSOR",
        c2: "Define where cursor should be located after the workflow completes. if a workflow contains multiple <%CURSOR%> commands, the last instance of it will be used. If there were multiple <%CURSOR%> commands left over after workflow is run, only the last instance is replaced.",
      },
      {
        c1: "DATE",
        c2: "Using Roam42's date natural language processor, to return a properly formatted Roam date is resolved from the provided parameter. An optional second parameter allows you to control the format of the date returned.<br/>1: An expression that will resolve to a date. <br/>2: Optional parameter that tells Roam42 to not return a Roam formatted date, but a date formatted in the format you specify. Roam42 supports the date formats defined here: https://day.js.org/docs/en/parse/string-format",
      },
      {
        c1: "DATEBASIS",
        c2: "Changes the date basis used by Roam42 in determining the context in which dates are calculated. By default TODAY's date is the basis for all commands. <a target='_blank' href='https://youtu.be/czgw0YVH410'>Video</a><br/>1: Date basis to be used in the workflow.  If DNP - will use the date of the Daily Notes Page if the workflow is rune on a DNP. Otherwise provide a NLP date command to determine the date basis",
      },
      {
        c1: "EXIT",
        c2: "Stops the workflow from going further after completing the current block.",
      },
      {
        c1: "FOCUSONBLOCK",
        c2: "Will focus on this block after the workflow finish's running.",
      },
      {
        c1: "GET",
        c2: "Retrieves a variable from memory.<br/>1. Variable name. Should contain only letters and number, no special symbols. Variables are case-sensitive.",
      },
      {
        c1: "GOTOBLOCK",
        c2: "Subcommand works with OPENPAGE and SIDEBARWINDOWOPEN<br/>1. set to 1 for first block, set to -1 for last",
      },
      {
        c1: "IF",
        c2: "Performs simple IF/Then type logic commands. Intended for outputing text, not for processing other commands. Use IFTRUE if needed with other commands. Use in combination with <%THEN%> and <%ELSE%><br/>1. Logic to be evaluated. Uses Javascript like comparison logic.",
      },
      {
        c1: "IFDAYOFMONTH",
        c2: "Using todays date, compares to the day in the month to see if there is a match.<br/>1. a number from 1 to 31 corresponding to the day in the month. Optionally a comma separated list of numbers to test for multiple days.",
      },
      {
        c1: "IFDAYOFWEEK",
        c2: "Using today's date, compares to the parameter to see if there is a match.<br/>1. a number from 1 to 7, 1 is Monday, 2 is Tuesday and so on. Optionally a comma separated list of numbers to test for multiple days.",
      },
      {
        c1: "IFTRUE",
        c2: "Tests the parameter if it is true. If it evaluates to true, the rest of the block is output. if false, the block is skipped (and all child blocks of the IFTRUE block).<br/>1. Logic to be evaluated. Uses Javascript like comparison logic. ",
      },
      {
        c1: "INDENT/UNINDENT",
        c2: "Indent or unindent the current block if possible. Indentation and unindentation may not work in every context. So test carefully.",
      },
      {
        c1: "INPUT",
        c2: "prompts user for input which will then be inserted into the block.<br/>1. Text that will be displayed to the user (required). To provide a default value for the input, use %% as a separator to the first parameter (this parameter is optional)",
      },
      {
        c1: "JAVASCRIPT or J",
        c2: "Executes Javascript code, and the results are inserted into the block.<br/>1. a string of javascript code. Note this can be combined with the RESOLVEBLOCKREF to use a block to store javascript code. ",
      },
      {
        c1: "JAVASCRIPTASYNC or JA",
        c2: "Executes Javascript code using ASYNC, and the results are inserted into the block. Async is good for web services and functions that deal with call backs.<br/>1. a string of javascript code. Note this can be combined with the RESOLVEBLOCKREF to use a block to store javascript code. ",
      },
      {
        c1: "NOBLOCKOUTPUT",
        c2: "Will prevent the block from being output from the workflow, no matter what other commands it contains. This is useful to do operations in the workflow that have no visual rendering (reading clipboard, setting variables).",
      },
      {
        c1: "NOCURSOR",
        c2: "NOCURSOR is a directive that runs at the SmartBlock level. So do not use it in a block as a normal command, but rather in the parent block where the SmartBlock is defined you add this command. Example: #42SmartBlock NameOfSmartBlock <%NOCURSOR%>",
      },
      {
        c1: "NOTIFICATION",
        c2: "Displays a small popup notification message in the lower right.<br/>1: Number of seconds the notification is visible.<br/>2: Message to be displayed. Supports basic HTML elements in the  message.",
      },
      {
        c1: "ONBLOCKEXIT",
        c2: "This is a helper function for JavaScript developers to work with the DOM or to perform post processing. It is called after a block has completely processed by the Roam42, just before the next block from the workflow is processed.  ONBLOCKEXIT accepts async Javascript.",
      },
      {
        c1: "OPENPAGE",
        c2: "Opens or creates a page or block ref<br/>1. Page name or block",
      },
      {
        c1: "RANDOMBLOCK",
        c2: "Serendipity generator. Grabs a random block from your graph and inserts it.",
      },
      {
        c1: "RANDOMBLOCKFROM",
        c2: "returns a random block from a page or a child block from a parent block provided in the parameter.<br/>Option 1: Page name or tag name (Do not include brackets [[]] or hashtag # unless they are a part of the page name)<br/>2. Option 2: Parent block UID",
      },
      {
        c1: "RANDOMBLOCKMENTION",
        c2: " returns a random block from places where the page is referenced.<br/>1. Page name or tag name (Do not include brackets [[]] or hashtag # unless they are a part of the page name).",
      },
      {
        c1: "RANDOMPAGE ",
        c2: "Serendipity generator. Grabs a random page from your graph and inserts it.",
      },
      {
        c1: "REPEAT",
        c2: "Repeats the current block a specified amount of times. <%GET%> works with Repeat as a parameter, but no other commands can be used as a paremeter. NOTE: Do not use with multi-block commands. <a target='_blank' href='https://www.loom.com/share/4620e810a382484daa16db369662b23c'>Video</a>.<br/>1. Count of repeats.",
      },
      {
        c1: "RESOLVEBLOCKREF",
        c2: "Converts a block reference (()) into its text equivalent<br/>1. Block Reference.",
      },
      {
        c1: "RESOLVEBLOCKREFATEND",
        c2: "Does the same things as RESOLVEBLOCKREF, however runs toward the end of the Workflow after most other commands have been run. The parameters and usage are the same as defined for RESOLVEBLOCKREF.",
      },
      {
        c1: "SEARCH",
        c2: "searches all blocks for a specific string of case-sensitive text and returns a list of matching block references, with optional filtering. This is a multi-block commands and has some limitations how it interacts with other commands. <a target='_blank' href='https://www.loom.com/share/63f67de0df854f89bda3386536d38f14'>Video</a><br/>1. List of comma separated parameters.",
      },
      {
        c1: "SIDEBARWINDOWOPEN",
        c2: "Opens or creates a page in the sidebar<br/>1. Page name or block",
      },
      {
        c1: "SIDEBARWINDOWCLOSE",
        c2: "Closes sidebar pane<br/>1. number of side pane to close. Use 0 to close all p",
      },
      {
        c1: "SIDEBARSTATE",
        c2: "Toggles state of sidebars<br/Value of  1 to 4. <br/>1 - open left sidebar <br/>2 - close left side bar <br/>3 - open right side bar <br/>4 - close right sidebar",
      },
      {
        c1: "SMARTBLOCK",
        c2: "This is an experimental feature that is not currently being supported. This means it works reasonably well, but will fail in many cases.<br/>1. Name of SmartBlock.",
      },
      {
        c1: "SET",
        c2: "Sets the value of a variable in memory. Variables are case-sensitive.<br/>1: Variable name <br/>2: Value of the variable.",
      },
      { c1: "TIME", c2: "Inserts the time in 24 hour format." },
      { c1: "TIMEAMPM", c2: "Inserts the time in AM/PM format." },
      {
        c1: "TODOFUTURE",
        c2: "Returns a list of block references of TODOs for future TODOs. That is TODOs that have a dated page reference in them.Includes support for the <%PAGE%> <%PATH%>.<br/>1. Maximum amount of block references to return.",
      },
      {
        c1: "TODOFUTUREDNP",
        c2: "Returns a list of block references of TODOs for future TODOs. That is TODOs that have a dated page reference in them. Additionally TODOs that are on a Daily Notes Page (DNP) without a date on a future date. The idea is if you put a TODO on a DNP in the future, its likely also considered a future task.<br/>1. Maximum amount of block references to return.<br/>2. optional filter parameter based on a comma separated list (case-insensitive). Can use - in front of a word to exclude it.",
      },
      {
        c1: "TODOOVERDUE",
        c2: "Returns a list of block references of TODOs for overdue TODOs. That is TODOs that have a dated page reference in them.<br/>1. Maximum amount of block references to return.<br/>2. optional filter parameter based on a comma separated list (case-insensitive). Can use - in front of a word to exclude it.",
      },
      {
        c1: "TODOOVERDUEDNP",
        c2: "Returns a list of block references of TODOs for overdue TODOs. That is TODOs that have a dated page reference in them. Additionally TODOs that are on a Daily Notes Page (DNP) without a date from the past. The idea is if you put a TODO on a DNP and its not finished, its likely overdue when that date has passed.<br/>1. Maximum amount of block references to return.",
      },
      {
        c1: "TODOTODAY",
        c2: "Returns a list of block references of TODOs for today.<br/>1. Maximum amount of block references to return.<br/>2. optional filter parameter based on a comma separated list (case-insensitive). Can use - in front of a word to exclude it.",
      },
      {
        c1: "TODOUNDATED",
        c2: "Returns a list of block references of TODOs with no date.<br/>1. Maximum amount of block references to return.<br/>2. 2. optional filter parameter based on a comma separated list (case-insensitive). Can use - in front of a word to exclude it.",
      },
    ],
  },
  {
    type: "keyboard",
    id: 1000,
    topic: "Working with lists",
    header: { c1: "Action", c2: "Windows", c3: "Mac" },
    items: [
      { c1: "Search bar", c2: "Ctrl-U", c3: "CMD-U Text" },
      {
        c1: "Navigate up/down in search bar",
        c2: "Ctrl-J / Ctrl-K",
        c3: "Ctrl-J / Ctrl-K",
      },
      { c1: "Search page", c2: "Ctrl-F", c3: "CMD-F" },
      { c1: "Return to page", c2: "Ctrl-Enter", c3: "CMD-Enter" },
      { c1: "Next day's note", c2: "", c3: "Ctrl-Alt-n" },
      { c1: "Previous day's note", c2: "", c3: "Ctrl-Alt-p" },
      {
        c1: "Edit 1st node in page <br>(when nothing selected)",
        c2: "Ctrl-Enter",
        c3: "CMD-Enter",
      },
      { c1: "Daily Notes page", c2: "Alt-D", c3: "Ctrl-Shift-D" },
      {
        c1: "Zoom current block to focus, or will Follow link under cursor",
        c2: "Ctrl-O",
        c3: "Ctrl-O",
      },
    ],
  },
  {
    type: "keyboard",
    id: 1001,
    topic: "Search",
    header: { c1: "Action", c2: "Windows", c3: "Mac" },
    items: [
      { c1: "Search all pages", c2: "Ctrl-U", c3: "CMD-U" },
      {
        c1: "Navigate up/down in search dropdown",
        c2: "Ctrl-J / Ctrl-K",
        c3: "Ctrl-J / Ctrl-K",
      },
      {
        c1: "Page/Block search <br>(must be editing a block)",
        c2: "Ctrl-Shift-9",
        c3: "Ctrl-Shift-9",
      },
      { c1: "Search in current page", c2: "Ctrl-F", c3: "CMD-F" },
    ],
  },
  {
    type: "keyboard",
    id: 1002,
    topic: "Blocks",
    header: { c1: "Action", c2: "Windows", c3: "Mac" },
    items: [
      { c1: "New block", c2: "Enter", c3: "Enter" },
      { c1: "Indent block", c2: "Tab", c3: "Tab" },
      { c1: "Un-indent block", c2: "Shift-Tab", c3: "Shift-Tab" },
      {
        c1: "Go to next block",
        c2: "Down Arrow",
        c3: "Down Arrow / Ctrl-N",
      },
      {
        c1: "Go to previous block",
        c2: "Up Arrow",
        c3: "Shift-Tab / Ctrl-P",
      },
      {
        c1: "Move block up",
        c2: "Alt-Shift-Up Arrow",
        c3: "CMD-Shift-Up Arrow",
      },
      {
        c1: "Move block down",
        c2: "Alt-Shift-Down Arrow",
        c3: "CMD-Shift-Down Arrow",
      },
      { c1: "New line within block", c2: "Shift-Enter", c3: "Shift-Enter" },
      { c1: "Character - move back", c2: "", c3: "Ctrl-B" },
      { c1: "Character - move forward", c2: "", c3: "Ctrl-F" },
      { c1: "Character - delete back", c2: "", c3: "Ctrl-H" },
      { c1: "Character - delete forward", c2: "", c3: "Ctrl-D" },
      { c1: "Move to beginning of block", c2: "", c3: "Ctrl-A" },
      { c1: "Move to end of block", c2: "", c3: "Ctrl-E" },
      {
        c1: "Zoom-in to block",
        c2: "Alt-Right Arrow",
        c3: "CMD-Period (.) <br>CMD-Shift-Period (.) <br><small><i>(Firefox/Safari)",
      },
      {
        c1: "Zoom-out of block",
        c2: "Alt-Left Arrow",
        c3: "CMD-Comma (,) <br>CMD-Shift-Comma (,) <br><small><i>(Firefox/Safari)",
      },
      { c1: "Expand block", c2: "Ctrl-Down Arrow", c3: "CMD-Down Arrow" },
      { c1: "Collapse block", c2: "Ctrl-Up Arrow", c3: "CMD-Up Arrow" },
      { c1: "Select text in current block", c2: "Ctrl-A", c3: "CMD-A" },
      {
        c1: "Select current block",
        c2: "Shift-Up-Up <i>or</i> Shift-Down-Down",
        c3: "Shift-Up-Up <i>or</i> Shift-Down-Down",
      },
      {
        c1: "Select current block & block above",
        c2: "Shift-Up-Up-Up",
        c3: "Shift-Up-Up-Up",
      },
      {
        c1: "Select current block & block below",
        c2: "Shift-Down-Down-Down",
        c3: "Shift-Down-Down-Down",
      },
      {
        c1: "Select all blocks on page",
        c2: "Ctrl-Shift-A",
        c3: "CMD-Shift-A",
      },
      { c1: "Jump to start of block", c2: "Ctrl-Home", c3: "Ctrl-A" },
      { c1: "Jump to end of block", c2: "Ctrl-End", c3: "Ctrl-E" },
    ],
  },
  {
    type: "keyboard",
    id: 1003,
    topic: "Sidebar",
    header: { c1: "Action", c2: "Windows", c3: "Mac" },
    items: [
      { c1: "Toggle open/close right sidebar", c2: "Ctrl+/", c3: "CMD+/" },
      { c1: "Toggle open/close left sidebar", c2: "Ctrl+\\", c3: "CMD+\\" },
      {
        c1: "Open/create page in right Sidebar (from search)",
        c2: "Shift-Enter",
        c3: "Shift-Enter",
      },
      {
        c1: "Open Daily Notes in right Sidebar (from left Sidebar)",
        c2: "Shift-Click",
        c3: "Shift-Click",
      },
      {
        c1: "Open link in right Sidebar",
        c2: "Shift-Click",
        c3: "Shift-Click",
      },
      {
        c1: "Open link in right Sidebar (when editing)",
        c2: "Ctrl-Shift-O",
        c3: "Ctrl-Shift-O",
      },
      {
        c1: "Open mentions in right Sidebar",
        c2: "WinKey-Shift-click",
        c3: "CMD-Shift-Click",
      },
    ],
  },
  {
    type: "keyboard",
    id: 1004,
    topic: "Formatting",
    header: { c1: "Action", c2: "Windows", c3: "Mac" },
    items: [
      {
        c1: "Toggle [[brackets]]",
        c2: "Ctrl-C <small>⇒</small> Ctrl-B",
        c3: "Ctrl-C <small>⇒</small> Ctrl-B",
      },
      {
        c1: "Toggle Block Reference expansion",
        c2: "Ctrl-C <small>⇒</small> Ctrl-R",
        c3: "Ctrl-C <small>⇒</small> Ctrl-R",
      },
      {
        c1: "Toggle your icon",
        c2: "Ctrl-C <small>⇒</small> Ctrl-S",
        c3: "Ctrl-C <small>⇒</small> Ctrl-S",
      },
      {
        c1: "Toggle edit icon",
        c2: "Ctrl-C <small>⇒</small> Ctrl-C <small>⇒</small> Ctrl-S",
        c3: "Ctrl-C <small>⇒</small> Ctrl-C <small>⇒</small> Ctrl-S",
      },
      {
        c1: "Toggle block preview",
        c2: "Ctrl-C <small>⇒</small> Ctrl-P",
        c3: "Ctrl-C <small>⇒</small> Ctrl-P",
      },
      {
        c1: "Cycle [[name/spaces]]",
        c2: "Ctrl-C <small>⇒</small> Ctrl-L",
        c3: "Ctrl-C <small>⇒</small> Ctrl-L",
      },
      {
        c1: "Cycle through node levels (slideshow mode). Works at current node level.",
        c2: "Ctrl-C <small>⇒</small> Ctrl-M",
        c3: "Ctrl-C <small>⇒</small> Ctrl-M",
      },
      { c1: "Heading 0", c2: "Ctrl-Alt-0", c3: "CMD-Alt-0" },
      { c1: "Heading 1", c2: "Ctrl-Alt-1", c3: "CMD-Alt-1" },
      { c1: "Heading 2", c2: "Ctrl-Alt-2", c3: "CMD-Alt-2" },
      { c1: "Heading 3", c2: "Ctrl-Alt-3", c3: "CMD-Alt-3" },
      { c1: "Bold ", c2: "Ctrl-B", c3: "CMD-B" },
      { c1: "Italics ", c2: "Ctrl-I", c3: "CMD-I" },
      { c1: "Latex ", c2: "Alt-Shift+4", c3: "" },
      {
        c1: "Strikethrough",
        c2: "<small><i>(none)</i></small>",
        c3: "CMD-Y",
      },
      {
        c1: "Highlight ",
        c2: "Ctrl-H",
        c3: "CMD-H <br>CMD-Shift-H <br><small><i>(Firefox/Safari)",
      },
      { c1: "Toggle TODO/DONE", c2: "Ctrl-Enter", c3: "CMD-Enter" },
      { c1: "Create web link", c2: "Ctrl-K", c3: "CMD-K" },
    ],
  },
  {
    type: "keyboard",
    id: 1006,
    topic: "Version control",
    header: { c1: "Action", c2: "Windows", c3: "Mac" },
    items: [
      {
        c1: "Add a version of the block",
        c2: "Ctrl-Comma (,)",
        c3: "Ctrl-Comma (,)",
      },
      {
        c1: "Converts selected blocks to versions in a block",
        c2: "Ctrl-Comma (,)",
        c3: "Ctrl-Comma (,)",
      },
      {
        c1: "Converts versioned block into separate blocks",
        c2: "Ctrl-Period (.)",
        c3: "Ctrl-Period (.)",
      },
      {
        c1: "Cycle versions to the right",
        c2: "Ctrl-Shift-Period (.)",
        c3: "Ctrl-Shift-Period (.)",
      },
      {
        c1: "Cycle versions to the left",
        c2: "Ctrl-Shift-Comma (,)",
        c3: "Ctrl-Shift-Comma (,)",
      },
    ],
  },
  {
    type: "keyboard",
    id: 1007,
    topic: "Other shortcuts",
    header: { c1: "Action", c2: "Windows", c3: "Mac" },
    items: [
      { c1: "Slash autocomplete", c2: "/", c3: "/" },
      { c1: "∆ Delta command", c2: "Alt-Enter", c3: "Alt-Enter" },
      {
        c1: "∆ Delta - move with children",
        c2: "Alt-Shift-Enter",
        c3: "Alt-Shift-Enter",
      },
      { c1: "Undo", c2: "Ctrl-Z", c3: "CMD-Z" },
      { c1: "Redo", c2: "Ctrl-Y", c3: "CMD-Shift-Z" },
      {
        c1: "Move cursor forwards",
        c2: "<small><i>(none)</i></small>",
        c3: "Ctrl-F",
      },
      {
        c1: "Move cursor backwards",
        c2: "<small><i>(none)</i></small>",
        c3: "Ctrl-B",
      },
      {
        c1: "Swap characters between cursor",
        c2: "<small><i>(none)</i></small>",
        c3: "Ctrl-T",
      },
      {
        c1: "Block Reference",
        c2: "Ctrl and Drag n drop",
        c3: "OPT and Drag n drop",
      },
      {
        c1: "Block Reference with children",
        c2: "Ctrl-Shift Drag n drop",
        c3: "OPT-Shift Drag n drop",
      },
      {
        c1: "Block Reference video demonstration",
        c2: "<a target='_blank' href='https://www.loom.com/share/7e611c03917e4e8591a5975fd102eb67'>link</a>",
        c3: "",
      },
    ],
  },

  {
    type: "feature",
    id: 1008,
    topic: "Markdown",
    items: [
      { c1: "Bold", c2: "**Bold**" },
      { c1: "Italics", c2: "__Italics__" },
      { c1: "Strikethrough", c2: "~~Strikethrough~~" },
      { c1: "Highlight", c2: "^^Highlight^^" },
      { c1: "Heading 1", c2: "# followed by space" },
      { c1: "Heading 2", c2: "## followed by space" },
      { c1: "Heading 3", c2: "### followed by space" },
      { c1: "LaTeX", c2: "$$E = mc^2$$" },
      { c1: "Inline code", c2: "`Inline code`" },
      { c1: "Code block", c2: "```Code block```" },
      { c1: "Link", c2: "[Link](https://www.example.com)" },
      { c1: "Image", c2: "![Image](www.fillmurray.com/50/50)" },
    ],
  },
  {
    type: "feature",
    id: 1009,
    topic: "Functions",
    items: [
      { c1: "{{alias: }}", c2: "{{alias: ((Block)) Text}}" },
      { c1: "{{attr-table: }}", c2: "{{attr-table: [[Page]]}}" },
      {
        c1: "{{calc: }}",
        c2: "{{calc: 4+5 }} <i>or</i> {{calc: ((Block)) + ((Block))}}",
      },
      { c1: "{{character-count}}", c2: "" },
      {
        c1: "{{[[∆]]:1+2}} ",
        c2: "Delta command - Moving Blocks forward to future dates with tracking alias",
      },
      { c1: "∆ Delta", c2: "∆ consists of 2 arguments" },
      {
        c1: "∆ Delta",
        c2: "+ <b>Argument 1</b> determines how many days until you start it.",
      },
      {
        c1: "∆ Delta",
        c2: 'e.g. {{∆:1+1}}\'s argument 1 is "1", meaning that it starts tomorrow.',
      },
      {
        c1: "∆ Delta",
        c2: "+ <b>Argument 2</b> determines the change in Argument 1 for subsequent intervals.",
      },
      {
        c1: "∆ Delta",
        c2: 'e.g. {{∆: 1+1}}\'s argument 2 is "+1", meaning that the new calculated Argument 1 will be Argument 1 + Argument 2 (1+1=2). The following interval will add Argument 2 to the newly calculated Argument 1 (2+1=3).',
      },
      {
        c1: "∆ Delta",
        c2: "Note:  Currently, division and decimals do not work yet. Use 0 as argument 1 and it will move the block to today's date",
      },
      { c1: "{{word-count}}", c2: "" },
      { c1: "{{chart: }}", c2: "" },
      { c1: "{{date}}", c2: "Creates a date-picker" },
      {
        c1: "{{diagram}}",
        c2: "Nest underneath to add blocks<br>Alt-Drag between two blocks to create a connecting line <br>Atl-Drag a box to create a group <br>Click-Hold-Delete to delete a group",
      },
      { c1: "{{TODO}}", c2: "{{TODO}} <i>or</i> {{DONE}}" },
      {
        c1: "{{encrypt}}",
        c2: "Encrypts a block of text with a passphrase",
      },
      { c1: "{{iframe: }}", c2: "Embed a website into your Roam page" },
      {
        c1: "{{kanban}}",
        c2: "Add columns and cards by nesting bullets below <br>First level nested bullets are columns <br>Second level nested bullets are cards <br>Moving cards will move the blocks below",
      },
      {
        c1: "{{mentions: }}",
        c2: "Pulls in 'Linked References' and 'Unlinked References' sections from a Page",
      },
      {
        c1: "{{or: }}",
        c2: "Creates a simple dropdown list <br>{{or: Apples | Carrots | Bananas}}",
      },
      {
        c1: "{{orphans}}",
        c2: "Provide a list of 'orphaned' blocks that can’t be found on any page, because their parent block was deleted",
      },
      {
        c1: "{{pdf: }}",
        c2: "Upload a pdf with /Upload Image or File <br>{{pdf: https://sitepath/file.pdf}} ",
      },
      {
        c1: "{{POMO}}",
        c2: "Creates a Pomodoro timer with a 25 min timer <br><small><i>There is no alert once it finishes",
      },
      {
        c1: "{{slider}}",
        c2: "Creates a slider from 0 to 10 <br>For pages with multiple authors, you can see thier icon underneath their rating",
      },
      {
        c1: "{{table}}",
        c2: "Creates a table <br>Add column headings and rows using nested bullets below",
      },
      {
        c1: "{{TaoOfRoam}}",
        c2: "Shows a spinning astrolabe, a favourite icon of Roam Research",
      },
      {
        c1: "{{youtube: }}",
        c2: "{{youtube: https://youtu.be/ojwIIzRC8oU}}",
      },
    ],
  },
  {
    type: "feature",
    id: 1010,
    topic: "Embeds",
    items: [
      {
        c1: "{{embed: ((Block))}}",
        c2: "Embeds a Block from elsewhere, including all of its children<br> <small><i>Changes made to the Block will be reflected at the source",
      },
      {
        c1: "{{embed: [[Page]]}}",
        c2: "Embeds a Page from elsewhere, without Linked and Unlinked References <br><small><i>Changes made to the Page will be reflected at the source",
      },
    ],
  },
  {
    type: "feature",
    id: 1011,
    topic: "Queries",
    items: [
      {
        c1: "{{query:}}",
        c2: "Queries are a way to ask questions and filter the answers of your Roam database <br><small><i>Pages and hashtags are interchangeable",
      },
      {
        c1: "{and:",
        c2: "{{query: {and: [[tagA]] [[tagB]]} }} <br><small><i>Shows all results with tagA and tagB",
      },
      {
        c1: "{or:",
        c2: "{{query: {or: [[tagA]] [[tagB]]} }} <br><small><i>Shows all results with tagA or tagB",
      },
      {
        c1: "{not:",
        c2: "{{query: {not: [[tagA]] [[tagB]]} }} <br><small><i>Omits all results with tagA and tagB",
      },
      {
        c1: "{between:",
        c2: "{{query: {between: [[January 1st, 2020]] [[today]]} }} <br><small><i>Shows all results between dates",
      },
      {
        c1: "Date operators",
        c2: "today, tomorrow, yesterday, last week, next week, last month, next month",
      },
      {
        c1: "{and: {not:",
        c2: "{{query: {and: [[tagA]] {not:[[tagB]]} } }} <br><small><i>Shows all results with tagA but not tagB",
      },
      {
        c1: "{and: {between:",
        c2: "{{query: {and: [[tagA]] {between: [[January 1st, 2020]] [[Today]]} } }} <br><small><i>Shows all results with tagA between dates",
      },
      {
        c1: "Self-reference",
        c2: "{{[[query]]: {and:[[tagA]] [[tagB]] {not:[[query]]} } }} <br><small><i>Shows all results with tagA and tagB but not query",
      },
    ],
  },
  {
    type: "example",
    id: 1012,
    topic: "Queries examples",
    items: [
      {
        c1: "{{query: {and: [[Investing]] {or: [[Articles]] [[People]]}}}} <br><small><i>Shows all results with Investing and Articles or Investing and People",
      },
      {
        c1: "{{query: {and: [[Investing]] {or: [[Articles]] [[People]]} {not: [[Startups]]} }}} <br><small><i>Shows all results with Investing and Articles omitting Startups or Investing and People omitting Startups",
      },
      {
        c1: "{{query: {and: [[TODO]] {between: [[April 8th, 2020]] [[March 7th, 2020]]}}}} <br><small><i>Shows all TODO between April 8th, 2020 and March 7th, 2020",
      },
      {
        c1: "{{query: {and: [[TODO]] {between: [[today]] [[last week]]}}}} <br><small><i>Shows all TODO between today and last week",
      },
      {
        c1: "{{query: {and: [[TODO]] {not: [[Overdue]]}{between: [[today]] [[today]]}}}} <br><small><i>Shows all TODO not tagged Overdue today ",
      },
      { c1: "" },
    ],
  },
  {
    type: "feature",
    id: 1013,
    topic: "Other Features",
    items: [
      {
        c1: "/TODO",
        c2: "Creates a check box, when clicked becomes {{DONE}}",
      },
      {
        c1: "/Current Time",
        c2: "Creates a time-stamp of the current time in 24h format",
      },
      {
        c1: "/POMO",
        c2: "Creates a 25 min Pomodoro timer <br><small><i>There is no alert once it finishes",
      },
      {
        c1: "/Date Picker",
        c2: "Allows you to choose a date from a calendar",
      },
      { c1: "/Today", c2: "Today's date" },
      { c1: "/Tomorrow", c2: "Tomorrow's date" },
      { c1: "/Yesterday", c2: "Yesterday's date" },
      { c1: "/Bold", c2: "" },
      { c1: "/Italics", c2: "" },
      { c1: "/Highlight", c2: "" },
      { c1: "/Strikethrough", c2: "" },
      {
        c1: "/Code Inline",
        c2: "Creates a monospaced code inline of the block",
      },
      {
        c1: "/Code Block",
        c2: "Creates a code block allowing snippets of code <br><small><i>Clojure, css, html, and javascript",
      },
      {
        c1: "/Latex",
        c2: "Allows LaTeX stylized text inline of the block",
      },
      { c1: "/Calc", c2: "Inline calculator" },
      { c1: "/Upload", c2: "Upload an image or file" },
      { c1: "/Slider", c2: "Creates a slider from 0 to 10 " },
      { c1: "/Encrypt", c2: "Encrypts a block of text with a passphrase" },
      { c1: "/Diagaram", c2: "Insert a diagram" },
      { c1: "/Table", c2: "Insert a table" },
      { c1: "/Kanban", c2: "Insert a kanban board" },
      { c1: "/YouTube", c2: "Embed a YouTube video" },
      { c1: "/Mentions", c2: "Insert mentions of a Block or Page" },
      { c1: "/Word Count", c2: "Insert word count for page" },
      {
        c1: "/Query",
        c2: "Insert a query <br><small><i>See Queries section above",
      },
      {
        c1: "?disablejs",
        c2: "add this to the URL when starting Roam to disable roam/js <a href='https://youtu.be/_fiWkFlEyPE' target='_blank'>(YouTube Tutorial)</a>",
      },
      {
        c1: "?disablcss",
        c2: "add this to the URL when starting Roam to disable roam/css",
      },
      { c1: ";;", c2: "pulls up the trigger menu for template insertion" },
    ],
  },
  {
    type: "example",
    id: 2000,
    topic: "About",
    items: [
      {
        c1: "This tool is designed to be a Quick Reference to all the features of Roam Research via keyboard, functions and formatting.<br/><br/>",
      },
      {
        c1: "Follow me on Twitter at <a href='https://twitter.com/roamhacker' target='_blank'>@RoamHacker</a><br/>DM me with bugs, suggestions and whatever<br/><br/>",
      },
      {
        c1: "<b>Credits to:</b><br/> <a href='https://www.roamhacks.com/' target='_blank'>RoamHacks.com</a> for their tips <br/><a href='https://twitter.com/beauhaan' target='_blank'>Beau Haan</a> for the creative input, follow him on Twitter <br/><a href='https://twitter.com/billpetro' target='_blank'>Bill Petro</a> for experience and calmness.  ",
      },
      { c1: "" },
      { c1: "<b>Roam resources</b>" },
      {
        c1: "<a href='https://forum.roamresearch.com/' target='_blank'>Roam Support Forums</a> The official support forum for discussing Roam",
      },
      {
        c1: "<a href='https://twitter.com/search?q=%23roamcult' target='_blank'>Twitter</a> Follow <a href='https://twitter.com/RoamResearch' target='_blank'>@RoamResearch</a> and the founder Conor White-Sullivan's account <a href='https://twitter.com/conaw' target='_blank'>@Conaw</a><br><small><i>Search for the <a href='https://twitter.com/search?q=%23roamcult' target='_blank'>#roamcult</a> hashtag",
      },
      {
        c1: "<a href='https://bjosephburch.com/ultimate-roam-shortcuts-cheat-sheet/' target='_blank'>Roam Shortcuts</a> Bernard Joseph Burch has put together Roam Shortcuts guide.",
      },
      {
        c1: "<a href='https://www.roamtips.com/' target='_blank'>RoamTips.com</a> Useful tips to help you master Roam",
      },
      {
        c1: "<a href='https://www.roamstack.com/' target='_blank'>RoamStack.com</a> Tools, techniques, and workflows to get the most out of Roam Research",
      },
      {
        c1: "<a href='https://www.roambrain.com/' target='_blank'>RoamBrain.com</a> An information hub for Roam Research",
      },
      {
        c1: "<a href='https://www.roamtips.com/' target='_blank'>RoamTips.com</a> Useful tips to help you master Roam",
      },
      {
        c1: "<a href='https://twitter.com/RoamFm' target='_blank'>RoamFM Podcast</a> Conversations with #roamcult",
      },
    ],
  },
];

export default quickReference;
