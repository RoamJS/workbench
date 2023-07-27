_This extension was first started by [TfTHacker](https://twitter.com/tfthacker) as Roam42 and passed over to RoamJS on 04/20/2021. We are deeply appreciative of all of TftHacker's hard work and generosity._

If you never used `Roam42` while it was a RoamJS extension, you can safely ignore the rest of these instructions.

The Roam Depot version brought several notable changes:

- Since the extension was renamed to `WorkBench`, the `WorkBench` module itself was renamed to `Command Palette+`. This means the old WorkBench modal was deprecated and all of the commands that used to live there were moved to the Roam Command Palette. Nothing will appear by triggering the old keyboard shortcut for WorkBench `ctrl+;`.
- `SmartBlocks`, a module that used to reside within `Roam42`, is now its own independent extension available in Roam Depot.
- There are no longer global objects exposed on the `window` object from `roam42`. If there are developers who are looking to use common functions that used to reside in Roam42, we recommend taking a look at the [RoamJS Components](https://github.com/RoamJS/roamjs-components) package.
- User defined inboxes from WorkBench require hitting the `Refresh Inboxes` command, or a refresh of Roam itself, before being available in the command palette.
- Format Converter no longer opens web view in a new window, but rather opens in an `iframe`, to be compatible with the desktop app.
- `Jump Navigation` was renamed to `Hot Keys` to distance itself away from `Deep Nav` and more closely resemble it's core functionality tying user actions to hot keys.
- A few `Hot Keys` were removed due to redundancy with other features in WorkBench achieving the same functionality with a hot key, or Roam itself supporting with a hot key.
- Pages listed for the `Privacy Mode` feature are now expected to be on a page titled `WorkBench Privacy Mode List` instead of `Roam42 Privacy Mode List`.
- The Menu Widget from the top right has been merged into the `Tutorials` feature.
