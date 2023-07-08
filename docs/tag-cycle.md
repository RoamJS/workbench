# Overview

Define custom Tag cycles tied to a keyboard shortcut!

# Usage

Toggle the Tag Cycle module on inside WorkBench.

![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamjs%2FxZciac9bXv.png?alt=media&token=a4cce612-1818-46e0-b8ce-2e3daa5824a1)

This extension is configurable via the `roam/js/tag-cycle` page.

For every cycle you want, make a block denoting the keyboard shortcut that will trigger that cycle. Then as children of that block, create one block for each text in the cycle.

Now when you're in a given block, the keyboard shortcut will replace text in your block based on the cycle you defined!

The format of a keyboard shortcut is deliminated by `+`. The following modifiers are supported:

- CTRL
- CMD
- WIN
- ALT

Additionally, could use `SHIFT`, but it should added after the modifier. The Key pressed is the last component.

This is what it would look like for Roam's native TODO/DONE cycle:

- CTRL+Enter
  -
  - TODO
  - DONE

Here is what I use for my project tracking:

![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamjs%2Fp49pagGUfi.png?alt=media&token=b14a4d63-1aaa-4c26-8e96-4c4ff89daee9)

Note that this means entering an empty block will clear the previous element, and append the next element when no other element is found. Blank bullets only append a text to the block when it is a part of only \***\*one\*\*** keystroke.

By default, empty blocks will cycle to a `[[]]` tag. To use a `#[[]]` tag instead, add 'HASH' to the end of the keyboard shortcut like this:

- CTRL+Enter HASH
  -
  - TODO
  - DONE

If instead of tags, you would like to cycle through raw text, add RAW to the end of the shortcut. Like this:

- CTRL+Enter RAW
  -
  - TODO
  - DONE

By default, empty blocks will cycle the next entry to the end of the block. To prepend to the block instead, add FRONT to the end of the shortcut. Like this:

- CTRL+Enter FRONT
  -
  - TODO
  - DONE

Front could combine with some of the other modifiers above. So to fully reproduce Roam's native tag cycle, it would look like this:

- CTRL+Enter FRONT RAW
  -
  - TODO
  - DONE

If you change the blocks on the configuration page, the changes will take effect as soon as you navigate away from the blocks.

# Demo

[Video](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamjs%2FTW-wl1cIFC.mp4?alt=media&token=e0662427-66dd-47e6-8ffc-ccd712b4d500)
