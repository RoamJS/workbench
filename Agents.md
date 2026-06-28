# Agent Conventions

## UI Mounted Into Roam DOM

- Prefer real React components for UI, even when Roam owns the surrounding DOM.
- When an observer or Roam DOM hook needs to insert UI, create only an empty mount element imperatively, then render a React component into it.
- Unmount React with `ReactDOM.unmountComponentAtNode` before removing an imperatively inserted mount element.

## Styling

- Use Tailwind utility classes for layout, spacing, and sizing instead of inline `style` mutations.
- Keep imperative DOM code focused on locating insertion points and creating mount anchors, not presentation.

## Blueprint Controls

- Use Blueprint React components and props instead of manually building Blueprint class names.
- For buttons, prefer `<Button />` props such as `minimal`, `outlined`, `icon`, `rightIcon`, `text`, and `onClick`.
