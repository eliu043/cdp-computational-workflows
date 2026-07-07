# Brutalist Garden Window Style Guide

Source inspiration: [dumpling.love](https://dumpling.love/) and its handmade web-collage surface, draggable windows, visible browser artifacts, and noisy garden imagery.

## Direction

Scrap the street metaphor. The page is now a desktop-like collage: garden background, stacked draggable windows, raw HTML-ish copy, visible titlebars, hard outlines, and intentionally awkward layering.

## Visual Character

- Brutalist, handmade, and slightly broken.
- Heavy black borders and square controls.
- No polished cards, no smooth SaaS surfaces.
- Background should feel like cut-up garden photos: trees, meadow, sky, wires, paper strips, noise.
- Windows sit on top like old browser/dialog fragments.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| Ink | `#111111` | Window borders, titlebar graphics, text |
| Paper | `#d8d8d0` | Window bodies |
| Acid | `#e9ed73` | Hero panel and collage strips |
| Sky | `#9fd3d8` | Garden sky fragments |
| Meadow | `#5d7b42` | Garden/field base |
| Shadow | `rgba(0, 0, 0, 0.42)` | Brutal offset shadows |

## Typography

- Use plain system sans for the page base.
- Use `Courier New` for windows, labels, and body copy.
- Use Georgia-style serif for the large fake HTML title treatment.
- Keep letter spacing at `0`.
- Text can remain placeholder or deliberately web-native.

## Layout

- First screen is the experience.
- Background is full-bleed and non-interactive.
- Windows are absolutely positioned and draggable by their titlebars.
- Windows overlap, resize, and come to front when touched.
- On mobile, windows stack vertically and dragging is disabled.

## Interaction

- Drag from the titlebar.
- Click any window to bring it forward.
- Close buttons hide windows.
- Buttons are blunt, native-feeling, and square.

## Assets

- Background uses a photographic garden reference rather than the earlier generated SVG look.
- Repeat, crop, rotate, and mirror the same image to create a collaged surface.
- Add CSS noise and line texture over the photo so it feels printed and degraded.
- Image treatment should preserve roughness, visible boundaries, and awkward overlap.

## Things To Avoid

- Soft rounded cards.
- Minimalist spacing systems.
- Smooth editorial landing-page polish.
- One-note beige or pastel prettiness.
- Explaining the interaction in visible helper text.
