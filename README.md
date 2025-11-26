# DM — Encounter Music Player

DM is an application that lets tabletop game masters (Dungeon Masters, Game Masters) play and control music and soundscapes tailored to specific encounters, NPCs, locations, and effects.

This repo is the home for a small, installable application/service that provides:

- Curated music and ambient soundtracks for encounters and scenes
- Per-encounter playlists, layered effects (reverb, intensity), and timed triggers
- Quick controls for on-the-fly changes during a session (fade, mute, loop, crossfade)
- Lightweight installation so a DM can run it locally or host for groups

Goals
- Provide a minimal usable MVP that can be installed and run locally (desktop or server).
- Offer an API / UI for selecting an "encounter" or in-session state and start/stop or alter music and effects.
- Keep the first implementation small, well-tested, and documented so contributors can add new content packs and features.

Examples (how it will be used)
- During combat, a DM picks a "Goblin Ambush" encounter; the app crossfades into combat music with higher intensity and adds percussion effects.
- For a spooky cave, the DM selects a "Cave — low light" preset; ambient drones and drip sounds loop and reverb is added to voice channels.

Next steps (what maintainers often want done first)
1. Decide on a target runtime (Node.js/Electron for a cross-platform desktop app, or Python/Flask for a lightweight server + web UI). If unsure, propose two minimal scaffolds (Node and Python) and include tests.
2. Add a minimal scaffold: small runnable example, a sample playlist, and an API or UI route to start/stop music.
3. Add tests and a CI workflow that runs them.

Contributing
- Keep changes small and focused; add README updates documenting any architectural decisions, install/run instructions, and tests.

Local dev: simple Node + Express scaffold
--------------------------------------

This repository now includes a minimal local-only Node + Express scaffold that provides a static UI and a simple API for serving local music files.

Files added in the root of the project (short summary):
- `server.js` — Express server, exposes `/tracks` API and serves `/music` and `/public` static routes.
- `package.json` — Node project metadata (scripts + express dependency).
- `music/` — local folder where you drop audio files (mp3, wav, m4a, ogg, flac, aac).
- `public/` — static frontend files (`index.html`, `app.js`, `styles.css`).

Quickstart: run and test locally
--------------------------------

From the project root (assumes Node and npm are installed):

1) Install dependencies

```bash
npm install
```

2) Start the server

```bash
npm start
# or
node server.js
```

3) Open the UI

- Visit: http://localhost:3000
- The UI will show any files stored in the `music/` folder.

4) Test the API or probe quickly via terminal

- List tracks (should show [] when `music/` is empty):

```bash
curl http://localhost:3000/tracks
# => [] or ["track.mp3", ...]
```

5) To try playback

- Drop one or more audio files (e.g. an .mp3) into the `music/` folder.
- Reload http://localhost:3000 — the track list will update and clicking a filename will play it in the browser using the <audio> element.

Stopping / background run notes

- If you start the server interactively (e.g. `node server.js`), press Ctrl-C to stop it.
- For background runs you can redirect logs and store PID, for example:

```bash
node server.js &> server.log & echo $! > server.pid
# later to stop
kill $(cat server.pid) && rm server.pid
```

Next steps
----------
- Add tests and a CI workflow (I can scaffold a simple GitHub Actions workflow and smoke test for `/tracks` if you like).
- Add a small sample audio track (public-domain) into the `music/` folder for instant verification.
— end —
