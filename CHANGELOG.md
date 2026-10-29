# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project does not follow Semantic Versioning, here's what we do instead:

- Major version bumps are very rare and we reserve them for special changes that signify a paradigm shift of some kind.
- Minor version bumps are released on a regular cadence.
- Patch version bumps are for bugfixes and hotfixes.

## [Unreleased]

### Added

- Live Preview windows can be moved, resized, pinned, and minimized in place. Pinned pages return after reloading Roam with their saved position, size, and minimized state.
- Live Preview settings now include width presets and an editable sample preview. Try changes before saving them in WorkBench's extension settings.

### Changed

- Existing Live Preview settings are imported once from `42Setting` blocks. Other WorkBench features keep their existing settings.

### Fixed

- Live Preview's resize control has its own corner outside the scrolling area, including at small sizes.
- Disabling Live Preview removes its event listeners, timers, and rendered pages while preserving saved pinned windows.

## [1.9.0] - 2026-08-24

### Added

- Weekly note page SmartBlocks command - `<%WEEKLYNOTEPAGE:In one week%>` uses SmartBlocks’ `DATE` command to resolve natural-language dates and `DATEBASIS` into the configured WorkBench weekly page title, creating and initializing the page from the weekly template when it is missing or empty.

## [1.8.1] - 2026-06-28

### Fixed

- Weekly note navigation placement - Navigation buttons now render after Roam's title display container instead of inside the title DOM.
- Intermittent weekly note buttons - Weekly note navigation now renders from the title observer so buttons appear when Roam loads the title after hash navigation.
- Sidebar title cleanup - Removing a right-sidebar page title no longer clears the main weekly note navigation.

## [1.8.0] - 2026-06-28

### Added

- SmartBlocks weekly note templates - Weekly note templates now render through SmartBlocks when the SmartBlocks extension is installed and enabled.
- Dynamic weekly note prompts - SmartBlocks commands can now be used in weekly note templates for dynamic dates and other template behavior.
