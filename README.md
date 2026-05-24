# Fat Cursor Plugin

An [Obsidian](https://obsidian.md) plugin that renders a prominent visual overlay cursor on top of the editor's text cursor, making it easier to spot.

## Features

- Renders a colored cursor overlay at the text insertion point using the theme's accent color
- Follows cursor movement on `keydown` and `mouseup` events
- Stays aligned during scrolling
- Supports pop-out windows (multi-window workflows)

## How it works

The plugin creates a fixed-position `<div>` wrapper with a `<span>` cursor element, positioned via CSS custom properties (`--f-cursor-x1`, `--f-cursor-y1`, `--f-cursor-height`, etc.) calculated from the DOM selection's bounding rectangle. Scroll offsets are tracked separately so the overlay stays accurate during scroll.

## Installation

1. Copy `main.js`, `manifest.json`, and `styles.css` to `<vault>/.obsidian/plugins/obsidian-fat-cursor/`
2. Enable the plugin in **Settings → Community plugins**

## Development

```bash
npm install
npm run dev    # watch mode
npm run build  # production build
```
