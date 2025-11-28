# Dungeon Master Assistant

An ambient command post for tabletop sessions—curate cinematic soundscapes, drop in reactive effects, and keep the mood tethered to the table.

## Features
- Cinematic themes to anchor combat, exploration, or downtime moments.
- Adaptive effects that you can fire and mute with a single tap.
- Crossfades, pauses, and a global volume charm so the soundtrack flows with the scene.
- Runs locally (Node + Express) so you can host a session anywhere without juggling cloud latency.
- Dice roller panel for D4, D6, D8, D10, D12, D20, and D100 with a vivid animation cue.

## Quick startup
```bash
npm install
npm start    # or: node server.js
```
Visit http://localhost:3000 to meet the UI; anything in `music/` loads automatically.

## How to use
- Tap a theme to begin a loop; tap again to pause it.
- Use the effects column to drop percussion, whispers, or impact sounds.
- Adjust volume for both themes and effects with the slider below the player.
- Use the initiative tracker to manage parties, foes, and HP on the fly.

API ping:
```bash
curl http://localhost:3000/tracks
```

## Monster manual + initiative
- Excel-powered monster manual (`public/monstermanual/MM.xlsx`) is read in-browser (no CDN) via `monstermanual-loader.js`.
- Visit `http://localhost:3000/monstermanual/monstermanual.html` for a sortable/searchable table.
- Initiative tracker lets you pick Hero or Monster; monsters auto-fill AC/HP from the sheet (AC locks, HP stays editable), heroes are manual. Drag rows to reorder; “Clear” removes monsters only.

## Dice panel
- Roll D4–D100 instantly; a glowing card simulates the dice burst while the result text updates.
- Everything runs locally—no external assets or libraries are required.

## Running notes
- Ctrl-C ends the server when you run `npm start`.
- To background it:
  ```bash
  node server.js &> server.log & echo $! > server.pid
  kill $(cat server.pid) && rm server.pid
  ```

## Contributing
- Keep changes focused and document new features.
- Add install/run instructions and tests when you expand the spellbook.
- Sound packs, effects, and UI improvements are always welcome.
