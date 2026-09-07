# Context-Window Optimization & Token Efficiency Protocol

## 1. Executive Summary

This protocol governs context-window allocation, observation masking, compaction triggers, KV-cache prefix preservation, and token budget strategies for all AI agents and developers operating on the TasbihKu codebase. Following these rules maximizes effective context capacity, reduces latency, and eliminates conversational drift.

---

## 2. Core Optimization Strategies

### A. Observation Masking & Scratchpad Offloading
- **Threshold:** When any tool execution output exceeds 2,000 tokens (or >50 lines), offload the raw content to a persistent file in the artifact `scratch/` directory or extract targeted metrics.
- **Masking Matrix:**
  - *Never Mask:* Active turn reasoning, direct error stacktraces (3–5 lines), immediate code replacement diffs.
  - *Consider Masking:* Tool outputs from 3+ turns ago, successful multi-file build passes, full directory listings.
  - *Always Mask:* Repeated outputs, verbose test summaries with 100% passing suites, raw JSON arrays.
- **Format:** Replace masked output with a structured reference:
  `[Obs:<id> masked. Path: <scratch_path>. Key Summary: <1-line summary>]`

### B. KV-Cache Prefix Preservation
- **Static-First Ordering:** Keep invariant static instructions, architecture definitions, and tool schemas at the top of the context prompt.
- **Volatile Content Isolation:** Place dynamic elements (active file reads, tool execution outputs, active user input) strictly at the tail of the prompt.
- **Cache Hit Target:** Maintain >70% prefix cache reuse by avoiding interleaving dynamic variables (such as variable timestamps or session tokens) into prefix headers.

### C. Compaction Protocols & Trigger Thresholds
- **Trigger Condition:** Initiate context compaction when context utilization exceeds 75–80% of window capacity or when trajectory length degrades reasoning accuracy.
- **Distillation Algorithm:**
  1. Condense conversational turns into atomic decisions and commitments.
  2. Strip politeness tokens, conversational padding, and intermediate exploratory failures.
  3. Re-anchor to the latest approved plan table and active task state.

### D. Subtask Context Partitioning
- For multi-module changes (e.g., cross-cutting edits between `src/modules/habits-ui.js` and `src/core/store.js`), partition analysis into distinct subtasks.
- Keep each subtask focused on a single module boundary, aggregating outcomes back to the coordinator.

### E. Just-In-Time (JIT) Hierarchical Context Loading
- Never load the entire repository into context.
- Leverage the module partition map in `docs/ARCHITECTURE.md` section 4:
  - UI layer -> `src/ui/router.js`, `style.css`
  - Core Store -> `src/core/store.js`
  - Business Modules -> `src/modules/{module-name}.js`
  - Hardware Integrations -> `src/hardware/{media|system}.js`

---

## 3. Metrics & Production Benchmarks

| Domain | Target Constraint | Enforcement Mechanism |
|---|---|---|
| **Response Density** | < 250 tokens for direct edits | Telegraphic markdown, zero filler phrases |
| **Tool Output Payload** | < 50 lines / output | Filtered grep and AST slicing |
| **Code Modification** | Diff hunk replacement | `replace_file_content` / `multi_replace_file_content` |
| **Test Execution Log** | Summary + failed assertions only | Strip passing suite verbose lines |
| **KV-Cache Reuse Rate** | > 70% cache hit | Static prefix invariance |
| **File Read Scope** | Targeted line ranges for files >300 lines | `view_file` with `StartLine`/`EndLine` |

