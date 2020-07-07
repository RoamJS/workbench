## General features

### live preview of ttttag
- hover mouse over tag and a live preview will showup. See code for credits to author of this feature


## Keyboard shortcuts to activate various features:

### Help ( ALT + SHIFT + J )
- Simple listing of avaible commands in the UI as a notification

### Natural language date recognition  (  ALT+SHIFT+D )
- Type in text like **Call Jim on Friday at 3p and ask about a golf match on saturday** 
  and press ALT+SHIFT+D and your text is replaced with: 
  **Call Jim [[July 3rd, 2020]] 3:00pm and ask about a golf match [[July 4th, 2020]]**  

- Other examples of recognized text
  - Today, Tomorrow, Yesterday, Last Friday, etc
  - 17 August 2013 
  - This Friday from 13:00 - 16.00
  - 5 days ago
  - 2 weeks from now
  - last Saturday
  - Sat Aug 17 2013 18:40 
  - 2014-11-30


### WordNet search ( ALT + SHIFT + . )
ALT + . - brings up a pop dictionary, based on the [Princeton University WordNet Dictionary](https://wordnet.princeton.edu/)
- If activated while editing a node in the outline, the selected defintion will be inserted into the document
- If acrivated while not editing, the definition will apprear in a popup toaster alert. It stays visible for 2 minutes. If you click on it, it disappears

### Strikeout (ALT + SHIFT + T)
-- strikes out selected text or entire line

### TODO next action ( ALT + SHIFT + A)
- inserts into the current node **{{{TODO}}}} #na**
- the text that is inserted can be modified in keyevents.js

### TODO weekend action ( ALT + SHIFT + W)
- inserts into the current node **{{{TODO}}}} #weekend**
- the text that is inserted can be modified in keyevents.js


### Convert to markdown ( ALT  + M)
- Converts current page to markdown text
- very simple conversion for now, no heirarchy supported
