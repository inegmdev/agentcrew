# Changelog

## 0.1.0

Initial scaffold:
- Detects installed agent CLIs (Claude Code, Gemini CLI, Codex, Cursor Agent)
- Installs and initializes guild
- Installs mattpocock/skills, hands off /setup-matt-pocock-skills to the human
- Merges an idempotent AGENTS.md block defining the guild/Vibe Kanban boundary
- Checks Vibe Kanban reachability, prints manual MCP-wiring steps
- Registers projects in ~/.agentcrew/state.json; `agentcrew update` re-runs
  across all of them
- Ships `src/adapter/sync-tickets.js` as a stub with --dry-run — MCP tool
  schema for card creation is not yet confirmed against a live Vibe Kanban
  install
