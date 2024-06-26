# Overview

WorkBench's decorated blocks displays various configurable features around blocks for quick actions.

![](media/short-demo-decorated-blocks.gif)

# How to Use

Toggle the Decorated Blocks module on inside WorkBench.

![](media/toggle-decorated-blocks.png)

Once enabled, a command will become enabled, `Toggle Block Decorators`. This will open a dialog allowing the user to specify which type of block decorations they would like to their graph.

It's possible to assign a unique hotkey to this command, should you prefer to do so. To accomplish this, navigate to either `Settings` > `Hotkeys` or the WorkBench Extension Settings.

The following decorations are supported:

## Move Todos Enabled

![](media/decorated-blocks-move-todos.png)

On a Daily Notes Page, When you hover over a block that contains a `TODO`, a right facing triangle will appear to the right.

Clicking this button will will bring up a date time popover, giving users the option to move the block to a future date.

## Move Tags Enabled

![](media/decorated-blocks-move-tags.png)

On a Daily Notes Page, When you hover over a tag (eg. `#someTag` or `[[someTag]]`), a right facing triangle will appear to the right.

Clicking this button will will bring up a date time popover, giving users the option to move the block to a future date.

## Context Enabled

![](media/decorated-blocks-context.png)

Enabling this will

- replace a `#parent` tag with a rendering of the parent block
- a `#page` tag with a rendering of the block's page name.

## Hex Color Preview Enabled

![](media/decorated-blocks-hex-color.png)

Tags that are 6 alpha numeric characters will display the color the tag represents. (eg. `#880808`)

Click on the color box to bring up an color picker. Changing the color will change the color tag in the block.

# Demo

https://github.com/RoamJS/workbench/assets/3792666/c33fa761-d11a-4a54-8136-13016e1e3afa
