# WorkBench

A delightfully fun collection of power user tools for Roam.

_This extension was first started by [TfTHacker](https://twitter.com/tfthacker) as Roam42 and passed over to RoamJS on 04/20/2021. We are deeply appreciative of all of TftHacker's hard work and generosity._

## Overview

WorkBench is the ultimate swiss army knife of the Roam power user. WorkBench makes it easy and fast to navigate and manipulate Roam.

## Features

All of the features below are _enabled_ by default. To disable, simply open your Roam Depot settings for each feature and toggle the switch for the given feature. More information about each feature could be found within the links below.

- [Command Palette+](https://roamjs.com/extensions/workbench/command_palette_plus) - Adds an extensive set of user generated and prebuilt commands to help users push Roam to new places. Navigate and manipulate your Roam environment with a bunch of handy commands, all without losing context.
- [Daily Note Popup](https://roamjs.com/extensions/workbench/daily_note_popup) - Daily note popup is a second window that you can toggle open and close quickly to get at your daily notes page. It can be referred to as the "Roam within your Roam."
- [Deep Nav](https://roamjs.com/extensions/workbench/deep_nav) - Advanced keyboard navigation of Roam using the keyboard, used to jump to any block in a page or sidebar.
- [Dictionary](https://roamjs.com/extensions/workbench/dictionary) - Rich dictionary at your fingertips right inside of Roam without having to leave Roam.
- [Format Converter](https://roamjs.com/extensions/workbench/format_converter) - Outputs the current page to various formats.
- [Hot Keys](https://roamjs.com/extensions/workbench/hot_keys) - Keyboard shortcuts for interacting with the Roam user interface, for example copying the block reference for the current block, expanding and collapsing the page outline and many many more.
- [Live Preview](https://roamjs.com/extensions/workbench/live_preview) - See live and editable previews of page links underneath your mouse cursor. Allows you to stay in the context of your work without having to navigate to another page to see its content.
- [Privacy Mode](https://roamjs.com/extensions/workbench/privacy_mode) - This feature Redacts confidential information when showing your Roam database to others or while working in an area with prying "eyes".
- [Tutorials](https://roamjs.com/extensions/workbench/tutorials) - Learn how to use extensions and Roam basics right from within Roam.

## Migration Guide

This extension was formerly known as `Roam42` before it was migrated over to Roam Depot. If you never used `Roam42` while it was a RoamJS extension, you can safely ignore the rest of this section. For Roam42 users, the migration to Roam Depot brought several notable changes:

- Since the extension was renamed to `WorkBench`, the `WorkBench` module itself was renamed to `Command Palette+`. This means the old WorkBench modal was deprecated and all of the commands that used to live there were moved to the Roam Command Palette. Nothing will appear by triggering the old keyboard shortcut for workBench `ctrl+;`.
- `SmartBlocks`, a module that used to reside within `Roam42`, is now its own independent extension available in Roam Depot.
- There are no longer global objects exposed on the `window` object from `roam42`. If there are developers who are looking to use common functions that used to reside in Roam42, we recommend taking a look at the [RoamJS Components](https://roamjs.com/extensions/developer/roamjs_components) package.
- User defined inboxes from WorkBench require hitting the `Refresh Inboxes` command, or a refresh of Roam itself, before being available in the command palette.
- Format Converter no longer opens web view in a new window, but rather opens in an `iframe`, to be compatible with the desktop app.
- `Jump Navigation` was renamed to `Hot Keys` to distance itself away from `Deep Nav` and more closely resemble it's core functionality tying user actions to hot keys.
- A few `Hot Keys` were removed due to redundancy with other features in Workbench achieving the same functionality with a hot key, or Roam itself supporting with a hot key.
- Pages listed for the `Privacy Mode` feature are now expected to be on a page titled `WorkBench Privacy Mode List` instead of `Roam42 Privacy Mode List`.
- The Menu Widget from the top right has been merged into the `Tutorials` feature.

## Demo

<video src="https://roamjs.com/loom/0ced5bfcfae04ae38813563b4470dfec.mp4" controls="controls"></video>

[View on Loom](https://www.loom.com/share/0ced5bfcfae04ae38813563b4470dfec)
