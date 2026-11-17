# jorritvanderveen.com

A personal site drawn as a space map. You are the hub in the middle; each line is a kind of
project (Work projects, Personal projects); each station is one project. The view follows the line from station to
station, and a station opens up to fill the screen.

Everything on the map comes from **one file**: `content/site.json`.

## Quick start

```
node build.mjs          # builds the live site into dist/
open dist/index.html    # look at it
```

No install step. The build uses only Node (version 20 or newer) and has no dependencies.

## Add or change a project

Open `content/site.json` and add one entry to a line's `stations` list:

```json
{
  "id": "desk-buddy",
  "org": "Own build",
  "name": "Desk buddy",
  "kicker": "One sentence that says what it is.",
  "stats": [{ "n": "40+", "l": "what the number counts" }],
  "did": ["What I did, one line.", "Another line."],
  "tools": ["ESP32", "Python"],
  "media": [{ "src": "assets/img/desk-buddy.webp", "alt": "The desk buddy on a desk" }]
}
```

- **Position:** the order in the list is the order on the line. The map lays itself out; there
  are no coordinates to edit.
- **`stats`:** numbers count up on arrival. Text such as "Tens of millions" is shown as is.
- **Moving around:** every station offers next, previous, back to the start and a switch to
  the other line (its first station). Nothing to set in the content file.
- **`viz`:** work stations can show an animated diagram instead of a photo. Available:
  `check`, `search`, `tiles`, `flows` (see `src/diagrams.js`).
- **Mistakes:** the build checks the file (missing fields, duplicate ids, a photo without alt
  text) and stops with a plain message.

Push the change and the site rebuilds by itself (see Deploy).

### Contact and credit

- **Get in touch** sits in the top bar on every screen. It links to LinkedIn (`meta.linkedin`).
  Add `"email": "you@example.com"` to `meta` and it becomes a small menu with LinkedIn and Email;
  the end of each line then offers both as well.
- **`meta.credit`** is the line at the bottom ("Built by Jorrit van der Veen"). Remove it to hide it.

### What must never go in this file

This file is public. Keep the achievement bank private and copy only public-safe wording:
no internal figures beyond those already on LinkedIn, no supplier or colleague names, nothing
marked `[internal]` in the bank.

## Photos and clips

| | Rule |
|---|---|
| Format | WebP for photos; MP4 (H.264, muted) for clips |
| Size | 1600 px on the long side, about 200 KB per photo; clips under 10 seconds and 2 MB |
| Shape | Main photo 4:3, build photos 16:10; the site crops to fit |
| Name | `assets/img/<station-id>.webp`, then `<station-id>-2.webp`, `-3.webp` |
| Text | Every photo needs `alt` text; the build refuses a photo without it |
| Rights | Only your own photos. No screenshots from employer systems |

Until a photo exists, leave `"src": ""` and the site shows a labelled placeholder.

## Branches (looks)

The same content and structure in three looks. Pick one for the live site:

```
node build.mjs --variant=line      # 1 Line: flat, calm, thick lines (default; chosen 2026-11-17)
node build.mjs --variant=deep      # 2 Deep space: glow, nebula, warp streaks, big Didone type
node build.mjs --variant=console   # 3 Console: grid, readouts, typed text, monospace
```

## Routes (line shapes)

Six shapes for the lines; stations keep the same spacing on each:

```
node build.mjs --route=metro        # A: long straights with 45 degree bends
node build.mjs --route=serpentine   # B: rows that run out and back, with 45 degree corners
node build.mjs --route=galaxy       # C: two spiral arms around the hub (default; chosen 2026-11-17)
node build.mjs --route=river        # D: a meandering curve that drifts outward
node build.mjs --route=loops        # E: each line leaves the hub and loops back to it
node build.mjs --route=cascade      # F: the river's drift in straight lines: level runs and 45 degree drops
```

To compare looks and routes side by side with switches: `node build.mjs --review`.
The deploy workflow publishes the chosen look and route (`--variant=line --route=galaxy`),
still hidden from search engines with `--noindex` until launch. To change it, edit the build
line in `.github/workflows/deploy.yml`.

All colours, fonts and radii are tokens at the top of `src/styles.css`. A branch only
overrides tokens there and a few drawing options at the top of `src/engine.js`.

## Deploy

**Now: GitHub Pages.** `.github/workflows/deploy.yml` builds and publishes on every push to
`main`. One-time setup: repository Settings → Pages → Source: "GitHub Actions". The custom
domain stays as it is in the same settings page.

**Later: Cloudflare Pages** (free; lets the repository be private and allows small server
functions). Build command `node build.mjs`, output folder `dist`. Nothing in the code changes.

## Visitors and privacy

- **No cookies.** The site stores nothing in the browser.
- **Fonts are self-hosted** (`assets/fonts`), so browsers do not contact Google.
- **Statistics are off by default.** To switch on cookieless statistics with Plausible, add
  this to `meta` in the content file:
  `"analytics": { "provider": "plausible", "domain": "jorritvanderveen.com" }`.
  The site then reports anonymous events: which line was boarded, which station was opened,
  line switches and clicks on the contact links.
- **Personal links.** Send each application its own link, for example
  `https://www.jorritvanderveen.com/?v=k7`. The code travels with the anonymous events, so
  the statistics show that the link was opened and what was viewed. Keep your own list of
  code, company and date. Use neutral codes, not company names.
- **Direct links to a station** work too: `https://www.jorritvanderveen.com/#contract-ai`.

## Works without the animation

- People who set "reduce motion" on their device get instant changes and still pictures.
- "See everything" lists every station; any entry opens directly.
- Without JavaScript the page shows the same content as a plain document.
- Keyboard: Tab reaches every control; left and right arrows travel between stations.

## What needs attention per year

1. Renew the domain names.
2. Run the build once after a Node major release (the workflow pins Node 22).
3. Check that the LinkedIn link still works.
4. Review the content: new projects in, stale ones out.

There is no server, database or package to patch.

## Folder map

```
content/site.json      the one content file
src/styles.css         design tokens, layout, branch overrides
src/engine.js          the map: layout, camera, travel, station views
src/diagrams.js        animated diagrams for work stations
src/review.js          branch switcher, only in review builds
assets/fonts/          self-hosted fonts (open licences, see LICENSES.md)
assets/img/            your photos
build.mjs              the build
tools/shots.cjs        optional check: clicks through the site and saves screenshots
```
