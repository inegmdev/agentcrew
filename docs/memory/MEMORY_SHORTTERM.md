# Short-term memory

Append-only working log. One `## YYYY-MM-DD` section per day, newest at the
bottom. Write here freely and without judgement — cheap to add, cheap to throw
away.

Agents read the **recent** sections at session start, not the whole file. That
window is the point: it keeps session cost flat no matter how long the project
runs.

## 🧹 Archiving

This file is cleaned up periodically, never truncated:

1. Move old day sections into a new file in `docs/memory/archived/`, named
   `session_YYYY_MM_DD.md`.
2. Clear those sections from **Active logs** below.
3. Link the new file under **Archive index**.

The archive keeps the complete, untouched context of past conversations —
deleting is what this policy exists to prevent.

## Archive index

<!-- One link per archived session, newest last. -->

_Nothing archived yet._

## Active logs

<!-- Day sections follow. Append today's notes under `## YYYY-MM-DD`. -->

## 2026-08-21

- 22:27 memory layer restructured → docs/memory/ (MEMORY.md, MEMORY_SHORTTERM.md, archived/); archiving policy added to the agentcrew block; 0.5.0
- 22:27 migration lives in scaffoldMemory.js — legacy docs/MEMORY.md moves, memory/*.md logs become indexed archives; verified idempotent
