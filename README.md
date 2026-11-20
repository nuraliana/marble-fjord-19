# Palm Heat Cover Studio

Turn your photos and a caption into GTA-style poster cover art — a
multi-panel poster with bold lettering and a Vice City sunset or neon
grade, exported as a PNG to share. Fully offline: the app is static
files, it makes no network request, and your photos never leave your
computer.

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/nuraliana/marble-fjord-19/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/nuraliana/marble-fjord-19/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

## How to use it

1. Serve the `app/` folder with any static server, for example:
   `node serve.ts` (or `python3 -m http.server`), then open
   http://localhost:8080
2. Drop a photo in (or use one of the two bundled sample photos).
3. Pick a layout (Hero + 3, Four Square, or Banner + 3), a grade
   (Vice Sunset, Neon Night, or Daylight) and a post size
   (4:5, 1:1, or 9:16).
4. Type your title and subtitle, choose where the lettering sits.
5. Click a panel to select it, drag to pan its photo, scroll to zoom —
   or fine-tune with the zoom / pan sliders.
6. Hit **Export PNG** and share the cover.

## What it does

- **Multi-panel poster** — four panels per cover, each with its own
  photo, crop, position and zoom.
- **Colour grades on canvas** — sunset, neon and daylight grades are
  painted as gradient overlays with grain and a vignette, not CSS
  filters, so the exported PNG looks exactly like the preview.
- **Bold poster lettering** — big outlined capitals with a gradient
  fill and a script-style subtitle, in three positions.
- **Fast** — photo to exported PNG in a handful of clicks, in the
  common post sizes 1080×1350, 1080×1080 and 1080×1920.
- **Deterministic screenshots** — `?shot=cover&size=4:5&grade=sunset
  &title=...&subtitle=...` renders a fixed cover; `?shot=editor`
  shows the editor with the sample photos loaded.

## Originality

All art in this entry is original: the lettering uses system fonts,
the two sample photos were made for make.fun with an image model,
and nothing here uses a Rockstar Games name, logo, artwork or font.

## License

MIT — see `LICENSE`. SPDX-License-Identifier: MIT.
