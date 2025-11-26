<!-- .github/copilot-instructions.md - Guidance for AI coding assistants working in this repository -->
# Copilot / AI agent instructions — DM (Dungeon Master assistant)

This repository currently contains very little code: a single README.md stating the project's purpose ("An assistant for Dungeon Masters"). There are no language-specific source files, build scripts, tests, or CI configuration checked in.

Keep suggestions and edits conservative and conversational — always ask clarifying questions before implementing large changes or choosing a technology stack.

Key facts (discoverable in this repo)
- Repository root: `README.md` — the only file found in the workspace.
- No `src/`, `tests/`, `package.json`, `pyproject.toml`, `.github/workflows/` or other build/config files present.

How to behave when editing or adding code
- Confirm intent: If a user asks you to "implement" or "expand" this project, ask what target language, runtime, and architecture they prefer (Python/Node/Go, CLI vs web app, frameworks, and test tooling).
- Be incremental: propose a minimal scaffold first (README updates + one small runnable example + tests) and get approval before expanding the codebase.
- Create tests and CI with every non-trivial change. Because no test framework is present, propose a widely used, low-friction choice (e.g., pytest for Python or jest for Node) and explain why.
- Prefer clear, minimal README changes that document any design decisions and commands to run the code locally.

Patterns and conventions for this repository
- None are present (no files that establish language or pattern). Therefore follow the user's preferences — do not assume a stack.

What to include in PRs / commits
- Small, focused commits: one feature or refactor per PR.
- Update `README.md` describing: purpose, how to run the example, test command(s), and any architectural decisions.

Example agent dialog / checklist before making changes
1. Ask: "Do you want a runnable example now? Which language and runtime do you prefer?"
2. After receiving preferences, propose a minimal plan (scaffold + tests + README) and wait for confirmation.
3. Implement the scaffold and include instructions on how to run and test locally.

If you find additional files later
- Merge any pre-existing `.github/copilot-instructions.md` content carefully — preserve valuable suggestions and only replace out-of-date or incorrect guidance.

If you need help
- Ask the repo owner for preferences (language, framework, CI provider). Without clear owner preferences, provide two minimal options (Python and Node) and let the user pick.

— end —
