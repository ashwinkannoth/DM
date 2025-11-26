# Dungeon Master Sound & Mood Forge

A tabletop soundboard that lives on your own machine. Drop music into the `music/` folder, then weave looping themes and one-shot effects with a click. Built with Node + Express for fast, offline control—no cloud taverns required.

## What’s inside the spellbook
- Scene beds and encounter loops for travel, taverns, and tense showdowns
- One-shot effects you can cast on/off instantly
- Crossfades, pauses, and volume charms for mid-battle pivots
- Runs locally or on a tiny host; keep latency out of your realm

## Quick incantation
```bash
npm install
npm start    # or: node server.js
```
Open http://localhost:3000 — tracks in `music/` appear automatically.

## Field use
- Click a theme to loop it; click again to pause
- Click an effect to fire it; click again to silence it
- Volume slider adjusts both themes and effects

API ping:
```bash
curl http://localhost:3000/tracks
```

## Campfire notes
- Ctrl-C stops a foreground run
- Background option:
  ```bash
  node server.js &> server.log & echo $! > server.pid
  kill $(cat server.pid) && rm server.pid
  ```

## Contributing
- Keep changes small and documented
- Add install/run notes and tests with any new tricks
- New sound packs and effects are welcome offerings
