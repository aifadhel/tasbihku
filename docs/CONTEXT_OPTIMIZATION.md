# Context-Window Optimization & Token Efficiency Protocol

## 1. Executive Summary

This protocol governs context-window allocation, observation masking, compaction triggers, and token budget strategies for development on the TasbihKu codebase.

---

## 2. Core Optimization Strategies

### A. Observation Masking & Scratchpad Offloading
- When large tool outputs (such as extensive test traces, database dumps, or raw asset arrays) exceed 2,000 tokens, offload full data to temporary scratchpad files or extract concise summaries.
- Never let repetitive, verbose CLI outputs linger in long conversational trajectories.

### B. KV-Cache Prefix Preservation
- Maintain static invariant headers (architecture definitions, project rules) at the top of context prompts.
- Avoid introducing fluctuating timestamps or volatile variables into prefix blocks, preserving maximum KV-cache hit rates (>70%).

### C. JIT Hierarchical Context Loading
- Do not preload all submodules simultaneously.
- Leverage the module partition map in `docs/ARCHITECTURE.md`:
  - UI layer -> `src/ui/router.js`, `style.css`
  - Core Store -> `src/core/store.js`
  - Business Modules -> `src/modules/{module-name}.js`

---

## 3. Metrics & Benchmarks

| Domain | Target Constraint | Enforcement Mechanism |
|---|---|---|
| Response Density | < 250 tokens for direct edits | Telegraphic markdown, no conversational padding |
| Tool Output Payload | < 50 lines / output | Filtered grep and AST slicing |
| Code Modification | Diff hunk replacement | `replace_file_content` / `multi_replace_file_content` |
| Test Execution Log | Summary + failed assertions only | Strip passing suite verbose lines |
