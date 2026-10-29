# Live Preview

Enable **Live Preview** in WorkBench's extension settings, then hover over a page link or tag. An editable page opens beside the link without changing your main page. Use Roam's normal block editing and linked references inside the preview.

## Keep a page nearby

- **Pin** keeps the preview open until you close or unpin it. The pin button changes state; the page icon stays the same.
- **Move** a preview by dragging its title bar. Moving or resizing a temporary preview pins it so your layout stays put.
- **Resize** from the lower-right corner. The scrollbar ends above this control, even in a small window.
- **Minimize** collapses a pinned preview to its title bar in the same position. The restore button opens it again at its previous size. Minimizing a temporary preview also pins it.
- **Close** removes the preview and its saved state.

Pinned previews return when you reload Roam, with their page, position, size, and minimized state. They are stored in WorkBench's extension settings for the graph. On a smaller screen, windows are kept within the available workspace. A page that has been deleted is skipped during restoration.

Unpinned previews close after you move away; they stay open while you interact with their content. Escape dismisses temporary previews. Pinned previews remain open. Disabling Live Preview hides all its windows while keeping saved pins for the next time you enable it.

For keyboard control, focus a preview's title bar and use the arrow keys to move it. Focus the resize corner and use the arrow keys to change its size. Hold Shift for larger steps.

## Try settings before saving

Open the **Live Preview settings** cog in WorkBench. The white settings panel opens beside a floating editable sample page so you can try the controls without changing your graph. Move and resize the sample across the full browser window. Collapse the settings panel with its chevron for more space, then expand it to keep adjusting or save your changes.

Under **Open a preview**, choose **Hover over a page link** or **Hold a key while hovering**, then set the modifier key and hover delay. The modifier can also be pressed while your pointer is already over a link.

Choose a width preset: **Small**, **Medium**, **Large**, or **Full**. Full uses the available workspace width and keeps the height you chose. Edit the width or resize horizontally to switch to **Custom**. Resizing only the height keeps the width preset.

Changes update the example immediately. **Save settings** applies defaults to future previews. Existing windows keep the size and position you chose for them. **Cancel**, Escape, or closing the settings popup discards unsaved changes. **Reset example** restores the sample content. Edits to the sample never change graph pages; edits to a real page preview use Roam's normal editing behavior and update that page.

Existing `LivePreviewWidth`, `LivePreviewHeight`, `LivePreviewModifier`, and `LivePreviewDelay` values are imported once from legacy `42Setting` blocks. Those blocks remain in your graph, but Live Preview subsequently reads and writes its extension settings. Other WorkBench features continue to use their existing settings.

Live Preview provides floating windows. Use Roam's built-in Desk for docking pages and blocks.
