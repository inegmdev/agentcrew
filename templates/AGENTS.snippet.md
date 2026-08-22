<!-- agentcrew:start -->
## Memory & task boundary (managed by agentcrew — do not hand-edit; re-run `agentcrew update` instead)

### Memory

| Tier | Where | When to read it |
|---|---|---|
| long-term | `docs/memory/MEMORY.md` | every session, first thing |
| decisions | `backlog decision list` | before revisiting a settled question |
| short-term | `docs/memory/MEMORY_SHORTTERM.md` | every session, review recent daily logs |
| archives | `docs/memory/archived/` | on demand, for full context of past chats |

- **Start of session:** read `docs/memory/MEMORY.md` first, then review the
  recent active logs inside `docs/memory/MEMORY_SHORTTERM.md`.
- **During work:** append today's notes under a `## YYYY-MM-DD` section inside
  `docs/memory/MEMORY_SHORTTERM.md` freely. It is append-only and disposable.
- **Durable findings:** anything still true in a month belongs in
  `docs/memory/MEMORY.md`, which is distilled, not a log. Keep it under ~200
  lines. A decision with real reasoning behind it goes to
  `backlog decision create "..."` instead.
- **Consolidation:** `agentcrew consolidate` distils recent logs into a
  proposed `docs/memory/MEMORY.proposed.md`. It never overwrites
  `docs/memory/MEMORY.md` — a human accepts the result, because consolidation
  drops things on purpose.

### 🧹 Short-term memory cleanup & archiving policy

To prevent context bloat and keep the agent efficient, short-term memory must
be cleaned up periodically using a strict **archiving workflow**:

1. **Do not delete without backup:** never simply delete daily logs from
   `docs/memory/MEMORY_SHORTTERM.md`.
2. **Compile an archive file:** move the old logs into a new individual,
   session-specific markdown file inside `docs/memory/archived/` (named
   sequentially, e.g. `session_YYYY_MM_DD.md`, representing the conversation
   or date).
3. **Link the archive:** clear those logs from `MEMORY_SHORTTERM.md`'s
   **Active logs**, and add a markdown link to the new archived file under its
   **Archive index** section. This preserves the complete, untouched context of
   past conversations for future retrieval.

### Tasks

- **`backlog` owns execution.** It is the source of truth for what is being
  worked on. Use the `backlog` CLI — never edit files under `backlog/` by
  hand, or its metadata and history drift out of sync.
- **GitHub issues are intake, not execution.** Bugs and requests land there;
  a human promotes one into a backlog task when it's time to work it.
  Promotion is one-way and manual. Never sync backlog tasks back to issues.
- **`Needs Attention`** is the status that means a human is required —
  whether the work finished or got stuck. Move a task there instead of
  stopping silently.
<!-- agentcrew:end -->
