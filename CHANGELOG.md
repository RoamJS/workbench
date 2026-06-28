# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project does not follow Semantic Versioning, here's what we do instead:

- Major version bumps are very rare and we reserve them for special changes that signify a paradigm shift of some kind.
- Minor version bumps are released on a regular cadence.
- Patch version bumps are for bugfixes and hotfixes.

## [1.8.1] - 2026-06-28

### Fixed

- Weekly note navigation placement - Navigation buttons now render after Roam's title display container instead of inside the title DOM.
- Intermittent weekly note buttons - Weekly note navigation now renders from the title observer so buttons appear when Roam loads the title after hash navigation.
- Sidebar title cleanup - Removing a right-sidebar page title no longer clears the main weekly note navigation.

## [1.8.0] - 2026-06-28

### Added

- SmartBlocks weekly note templates - Weekly note templates now render through SmartBlocks when the SmartBlocks extension is installed and enabled.
- Dynamic weekly note prompts - SmartBlocks commands can now be used in weekly note templates for dynamic dates and other template behavior.
