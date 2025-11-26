# Dungeon Master Assistant

A spellbook for ambience that stays on your own lair. Drop your curated tracks into `music/`, spin up the server, and the Assistant lets you cue cinematic beds, mood effects, and live tweaks without leaving the table.

## Features
- Cinematic themes to anchor combat, exploration, or downtime moments.
- Adaptive effects that you can fire and mute with a single tap.
- Crossfades, pauses, and a global volume charm so the soundtrack flows with the scene.
- Runs locally (Node + Express) so you can host a session anywhere without juggling cloud latency.
- 3D dice roller panel that loads GLB models from the `dice/` folder and lets you roll every polyhedral type.

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

## Dice panel
- Quick random rolls for D4, D6, D8, D10, D12, D20, and D100 with a simple animated shimmer.
- Results appear in a live status readout; everything runs locally with no external assets required.

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
