# Attribute Select ownership

This local patch lets WorkBench and the standalone Attribute Select extension use the same capability without relying on their load order. The standalone provider has priority. WorkBench resumes automatically when that provider unloads, provided its Attribute Select setting is still enabled.

## Publication boundary

**This WorkBench change is for draft review only. Do not merge or publish without Michael’s explicit approval.** A draft PR can be opened with `[skip ci]` in its head commit: GitHub skips this repository’s `pull_request` publishing workflow. Every subsequent commit must retain that instruction until an approved nonpublishing validation path is in place. This is intentional skipped CI, not a passing CI result. Workflow files and repository-wide Actions settings are unchanged. The repository's `.github/workflows/pr.yaml` runs `samepage build` for pull requests, and `main.yaml` runs it on the main branch. The local validation below uses `samepage build --dry` directly and bypasses the npm prebuild hook.

The patch was prepared against WorkBench commit `37b86e9b458d1b33bd22868d084f52e52b087e8b`. Attribute Select's repository can proceed independently, but safe automatic takeover requires this adapter to ship in WorkBench too. Older WorkBench versions must keep their Attribute Select module disabled when the standalone extension is active. The standalone extension cannot safely stop observers owned by an older, uncooperative copy.

## Contract

`toggleFeature(flag: boolean): Promise<void>` remains the feature's public lifecycle API. A true flag registers the `attribute-select` capability with provider ID `roamjs.workbench` and priority `FEATURE_PRIORITY.bundled` (10). A false flag releases that registration and waits for cleanup. Suspending the runtime does not change or persist the user's module setting.

`src/shared/featureOwnership.ts` is an exact vendored copy of the standalone extension's broker. Separately built copies meet at `Symbol.for("roamjs.feature-ownership.v1")` on the current window. The standalone ID is `roamjs.attribute-select`, priority 100. The broker serializes stop/start, aborts an interrupted startup, waits for it to settle, and cleans it again before a successor starts. Cleanup failure blocks that capability until reload, rather than starting a second owner over unknown leftovers.

The WorkBench adapter owns and removes its React dropdown/configuration roots, owner markers, styles, observers, and refresh API. It preserves unrelated WorkBench API properties. Startup checks cancellation after initial configuration-page creation. Delayed configuration writes, discovery, SmartBlocks responses, refresh callbacks, and old observers cannot remount or update an abandoned runtime. Roam block renders nested inside the settings panel are unmounted with their parent.

Existing configuration remains under `roam/js/attribute-select`; no migration or graph deletion is introduced. Attribute discovery, numeric values, formatting, table mapping, and SmartBlocks input syntax retain WorkBench behavior. UI redesign and page attributes remain separate work.

## Local verification

Run `node --test tests/attributeSelectOwnership.test.mjs`. The tests execute separately evaluated broker modules against one window and cover:

- Both load orders, exclusive ownership, cleanup before takeover, and automatic WorkBench resumption.
- A user's disable action while WorkBench is suspended, including repeated enable calls.
- Cancellation during asynchronous configuration-page creation and takeover while it is pending.
- Retained configuration, refresh, and observer callbacks after suspension and after resumption.
- Delayed attribute discovery and SmartBlocks responses after the old owner is removed.
- Unmounting detached roots and removing only owned markers.

The eight ownership tests and local dry production build pass. The full repository typecheck has 101 pre-existing errors in unrelated features. Comparing this patch with its base using the same compiler and installed dependencies yields no new diagnostics; a strict compile of the changed feature and broker passes. See the local `local/ownership-proof/typecheck-comparison.json` report. Live Roam coexistence verification is coordinated by the parent task, not asserted by these unit tests.


The actual adapted feature passed native Roam coexistence proof with standalone: both load orders, exclusive mounts, fallback, disable while suspended, stale callback rejection and saved-value preservation. The full WorkBench entrypoint and settings panel still require release acceptance. GitHub documents commit skip behavior at https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs.
