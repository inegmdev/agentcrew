<!-- agentcrew:start -->
## Agent memory & task ownership (managed by agentcrew — do not hand-edit; re-run `agentcrew update` instead)

This project uses guild for memory and Vibe Kanban for task tracking. They are
not interchangeable — follow this boundary exactly:

- **Vibe Kanban owns tasks.** It is the only source of truth for what's being
  worked on. Never call guild's `quest_accept` or `quest_fulfill` — that would
  create a second, competing task board.
- **guild owns memory only.** At the start of every session, call
  `guild_session_start` for this project to load the Oath (standing
  principles) and the last Brief (handoff note). Before doing meaningful
  research or making a decision, call `lore_appraise` to check whether this
  has already been figured out. Before ending a session, `lore_inscribe` any
  durable decision, observation, or gotcha another agent working a different
  ticket would benefit from — and `quest_brief` a short handoff note for
  whoever picks up next.
- **Tickets originate from `.scratch/<feature>/`.** `/to-issues` writes
  vertical-slice tickets there. `src/adapter/sync-tickets.js` (from the
  agentcrew repo) turns those into Vibe Kanban cards — it does not run
  automatically; a human or a hook triggers it.
<!-- agentcrew:end -->
