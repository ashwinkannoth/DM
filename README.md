# Dungeon Master Sound & Mood Forge

Summon music, ambience, and one-shot effects for tabletop tales. This local-first Node + Express app gives a DM fast control over encounter playlists, intensity, and quick reactions—no cloud required.

## What this forge crafts
- Curated scene playlists and ambient beds for encounters, travel, and downtime
- Layered effects (reverb, intensity), fades, loops, and quick crossfades for mid-battle pivots
- Per-encounter presets so a single click can shift from tavern chatter to goblin war drums
- Lightweight install that runs on your own machine or a small host

## Quest log (roadmap)
- Expand theme and effects packs from the community hoard
- Sharpen the GUI for faster live control and better accessibility
- Add tests and CI so every new sound pack lands safely

## Local dev (Node + Express)
This repository includes a minimal local-only scaffold: `server.js` serves a static UI and exposes `/tracks`, while `/music` and `/public` are served as static routes.

Folders and artifacts:
- `server.js` — Express server and `/tracks` API
- `package.json` — project metadata and scripts
- `music/` — drop audio files here (mp3, wav, m4a, ogg, flac, aac)
- `public/` — frontend (`index.html`, `app.js`, `styles.css`)

## Quickstart
From the project root (Node and npm installed):

```bash
npm install
npm start    # or: node server.js
```

Then open http://localhost:3000 — any files in `music/` appear in the UI.

## Try it
- Add one or more audio files into `music/`
- Reload the UI and click a filename to play it in-browser via `<audio>`

API probe:
```bash
curl http://localhost:3000/tracks
# => [] or ["track.mp3", ...]
```

## Stopping or backgrounding
- Ctrl-C stops an interactive run (`node server.js`)
- For background runs:
```bash
node server.js &> server.log & echo $! > server.pid
# to stop later
kill $(cat server.pid) && rm server.pid
```

## Contributing
- Keep changes small and documented
- Add install/run notes and tests for new features
- PRs that extend the spellbook with new sound packs or effects are welcome
