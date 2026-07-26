<!-- agentcrew:start -->
## Memory & task boundary (managed by agentcrew — do not hand-edit; re-run `agentcrew update` instead)

### Memory

| Tier | Where | When to read it |
|---|---|---|
| long-term | `docs/MEMORY.md` | every session, first thing |
| decisions | `backlog decision list` | before revisiting a settled question |
| short-term | `memory/YYYY-MM-DD.md` | today's and yesterday's only |

- **Start of session:** read `docs/MEMORY.md`, then today's and yesterday's
  `memory/` logs if they exist. Do not read older logs unless you're looking
  for something specific — the window exists to keep sessions cheap.
- **During work:** append to `memory/<today>.md` freely. It is append-only
  and disposable; nothing there is precious.
- **Durable findings:** anything still true in a month belongs in
  `docs/MEMORY.md`, which is distilled, not a log. Keep it under ~200 lines.
  A decision with real reasoning behind it goes to
  `backlog decision create "..."` instead, and `docs/MEMORY.md` links to it.
- **Consolidation:** `agentcrew consolidate` distils recent logs into a
  proposed `docs/MEMORY.proposed.md`. It never overwrites `docs/MEMORY.md` —
  a human accepts the result, because consolidation drops things on purpose.

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
