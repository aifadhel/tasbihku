# AI Agent Directives & Context Optimization Rules

This workspace adheres to strict context-window management, prompt caching optimization, and token minimization protocols. All AI agents operating in this repository must comply with these guidelines.

---

## 1. Context & Token Optimization Rules

### Rule 1: Adaptive Verbosity (Zero Filler)
- Emit dense, telegraphic, technical responses.
- Omit conversational filler ("Certainly", "I'll do that", "Here is the code").
- Structure outputs into compact tables, bullet points, and diffs.

### Rule 2: Ambiguity-First Execution
- If 2+ conflicting implementations exist, ask exactly ONE clarifying question.
- Default to minimal-intervention, non-destructive edits.

### Rule 3: Prompt Caching & Prefix Stability
- **Static-First Invariance:** Maintain system instructions and static rules at the prompt prefix.
- **Dynamic Context Isolation:** Keep volatile content (active file reads, tool execution outputs) at the tail.
- **Avoid Re-reading:** Reuse existing in-context file snippets; do not re-read files unless modified on disk.

### Rule 4: Semantic Input Pruning & Log Compression
- **AST / Skeletal Code Views:** For files > 300 lines, view targeted line ranges rather than entire files.
- **Log Pruning:** Strip verbose build/test passes. Extract only error lines and stacktraces (3–5 lines of context).
- **JSON Minification:** Never inspect large JSON datasets in full when field-level extraction or grep suffices.

### Rule 5: Surgical Diff Edits
- Always use targeted block replacement (`replace_file_content` / `multi_replace_file_content`).
- Never reprint entire 500+ line files to modify small functions.

---

## 2. Dynamic Context Discovery Heuristic

Before initiating work:
1. Consult `docs/ARCHITECTURE.md` to identify the target submodule.
2. Only load the specific file required for the task.
3. Keep vanilla JS / ES module architecture intact without introducing runtime build steps or unnecessary frameworks.
