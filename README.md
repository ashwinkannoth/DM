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

— end —
