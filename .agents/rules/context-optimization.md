# Context Optimization & Token Efficiency Rules

Durable project-local protocol inherited by all coding-agent sessions in TasbihKu.

---

## 1. KV-Cache Prefix Stability
- **Static-First Ordering:** Keep invariant instructions (`AGENTS.md`, architecture contracts, tool schemas) strictly at the prompt prefix.
- **Volatile Tail Isolation:** Append dynamic state (file reads, diffs, CLI logs, user queries) strictly at the prompt tail.
- **No Dynamic Prefix Mutations:** Never inject timestamps, session IDs, or transient metrics into static rule files (`AGENTS.md`, `docs/ARCHITECTURE.md`, `.agents/rules/*.md`).
- **Reuse Loaded Context:** Never re-read a file already in active context unless modified on disk or dropped during compaction.

## 2. Context-Window Lifecycle & Compaction (70–80% Trigger)
- **Trigger:** When context utilization approaches 70–80% (or reasoning drifts over long trajectories), stop broad exploration, complete the active atomic step, and trigger compaction.
- **Anchored Iterative Handoff State:** Before compacting, persist structured state in `.agents/agent-progress.md` under `## STATE` containing:
  - `Intent`: Active task goal and scope lock (`Touch List` + `Leave-Untouched`).
  - `Files Read/Modified`: Exact repo paths and line anchors touched or verified.
  - `Decisions`: Key architectural/trade-off choices made.
  - `Verification Status`: Exact commands run and observed exit codes.
  - `Next Steps`: First uncompleted atomic step to resume immediately post-compaction.

## 3. Observation Masking & Scratchpad Offloading
- **Offload Threshold:** Spill verbose CLI, build, test, or JSON outputs exceeding **2,000 tokens** or **100 lines** to a scratch file under the active artifact `scratch/` directory.
- **Compact Pointer Format:** Keep only the pointer and key findings in active context:
  `[Obs:<id> offloaded -> <scratch_path>; exit=<code>; key: <1-line summary>]`
- **Never Mask:** Error stacktraces (`3–5` lines context), active-turn reasoning, immediate edit diffs, or unresolved failures/blockers.

## 4. Token-Lean Execution & Output Density
- **Locate Before Read:** Run `rg -n` / `Select-String` and line counts before reading; scan headers first for files `>300L` and read targeted line ranges (`<=250L`).
- **Compute, Don't Read:** For large datasets/JSON/logs (`src/data/azkar.json`, `src/features/dzikir-guided/*.data.json`, `CHANGELOG.md`), query counts/fields with Node/PowerShell one-liners rather than loading whole payloads.
- **Bound & Prune Logs:** Run quiet modes (`npm run check --silent`, `npx vitest run ... --reporter=dot`, `npx vite build --logLevel warn`) and grep only errors/tracebacks (`3–5` lines context).
- **Batch & Surgical Diffs:** Batch independent reads/searches in parallel; apply targeted hunk replacements without reprinting unchanged blocks.
- **Telegraphic Density & 1-Question Filter:** Zero conversational filler; use compact tables and `key: val` bullets; ask at most **1** clarifying question when `>=2` material interpretations exist.
- **Sub-Agent Isolation:** Delegate wide multi-file exploration only when authorized, returning compact source-tagged summaries (`<=1,200` chars) instead of raw file dumps.

## 5. Preservation Boundaries (Never Compress or Mask)
- User constraints, authorization boundaries, and `Leave-Untouched` scopes.
- Plan/approval gates (`proceed` / `yolo` boundaries).
- Unresolved blockers, security findings, and failed checks.
- Exact verification commands, observed exit codes, and verified `file:line` evidence pointers.
