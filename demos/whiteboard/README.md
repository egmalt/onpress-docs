# Whiteboard

A bright Miro and FigJam style whiteboard built on Excalidraw, embedded in an OnPress frame. It opens with a "Brainstorm" starter scene.

![Whiteboard](screenshot.webp)

Live page: https://onpress.pro/docs/v2/ru/guides/demo/whiteboard/

The interface is in Russian.

## Features

- Excalidraw with the Inter font and `roughness: 0`: clean shapes instead of the hand-drawn look
- Sticky notes in six colors from the sticker bar at the bottom
- Dotted grid background, light theme only
- Colored toolbar: shapes, arrows with binding, lines, freehand drawing, text, images, eraser, frames
- Starter scene "Brainstorm: landing launch" with stickers and a small flowchart
- Pan and zoom on an infinite canvas, undo and redo, keyboard shortcuts
- Autosave of the scene in `localStorage`
- Export to PNG and SVG, scene file import and export

## Libraries

Loaded at runtime from unpkg with pinned versions. Nothing is bundled in this folder.

| Library | Version | Used for |
| --- | --- | --- |
| React | 18.3.1 | runtime for Excalidraw |
| ReactDOM | 18.3.1 | runtime for Excalidraw |
| @excalidraw/excalidraw | 0.17.6 | the editor |
| @fontsource/inter | 5.1.0 | Inter font |

## Files

| File | What it is |
| --- | --- |
| `frame.html` | frame markup; `<!-- onpress/content /-->` prints the page text in the intro popup |
| `style.css` | frame stylesheet |
| `script.js` | frame script |
| `page.md` | page properties and the intro text with the H1 |

## Deploy to OnPress

```bash
export ONPRESS_TOKEN=op_...   # your API token
export ONPRESS_SITE=...       # your site id
python3 deploy.py whiteboard --url /whiteboard/ --back-url /
```

This creates the frame `demo-whiteboard`, uploads `style.css` and `script.js` as frame files and publishes `page.md` as a page with `frame: "demo-whiteboard"`. `--back-url` sets where the "Back" buttons lead. The manual curl version and all options are in the [root README](../../README.md#deploy-a-demo-to-your-onpress-site).
