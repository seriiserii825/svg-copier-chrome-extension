# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development & Testing

There is no build step — this is a plain Manifest V3 Chrome extension loaded directly as unpacked.

**Load/reload the extension:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. "Load unpacked" → select this folder
4. After any JS/HTML/CSS change, click the reload icon on the extension card

**Manual testing:** Open `test-page.html` in Chrome (it contains a variety of SVG elements), then activate the extension popup.

## Architecture

The extension has two execution contexts that communicate via `chrome.tabs.sendMessage` / `chrome.runtime.sendMessage`:

### Content Script (`content.js` + `content.css`)
Runs in the context of every page. The `SVGCopier` class manages all page-level state:
- `activate()` / `deactivate()` — find/highlight SVGs or tear down all state
- `highlightSVG()` — adds the `.svg-copier-highlight` CSS class, a size badge `<div>`, and click/hover listeners
- `copySVG()` / `copyAllSVGs()` — serialize SVG via `XMLSerializer`, clean with `cleanSVGString()`, write to `navigator.clipboard`
- `getSVGsForDownload()` — returns serialized SVG strings to the popup for ZIP packaging
- A `MutationObserver` on `document.body` re-runs `findAndHighlightSVGs()` when new SVG nodes appear (SPA support)

Message actions handled: `activate`, `deactivate`, `getState`, `copyAll`, `getSVGsForDownload`, `clearAll`

### Popup (`popup.html` + `popup.js`)
Renders a 320px popup with four buttons. On open it sends `getState` to sync UI. The ZIP download is done entirely in the popup using JSZip, which is loaded at runtime from `cdnjs.cloudflare.com` — **this means ZIP download requires internet access and will silently fail offline.**

The popup listens for `updateStats` messages from the content script to keep counters in sync when the user clicks SVGs directly on the page.

### Utility files
- `create-icons.js` / `generate-icons.html` / `auto-generate-icons.html` — helper tools for generating extension icons (not part of the extension itself)
- `test-page.html` — standalone test page with sample SVGs of various sizes

## Key Constraints

- **No background service worker** — state is held entirely in the content script's `SVGCopier` instance; reloading the page resets everything
- **SVG filtering:** SVGs with `getBoundingClientRect()` width or height < 10px are skipped
- **`clearAll` calls `deactivate()`** — it fully tears down the active state, not just the copied list
- **Async message responses** — `copyAll` and `getSVGsForDownload` handlers `return true` to keep the message channel open for the async response
