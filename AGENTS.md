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
- Consolidate multiple non-contiguous edits in a single file into a single multi-replace chunk operation, ordered from leaf dependencies upward.

### Rule 6: Telegraphic Grammar & Density
- Strip articles, redundant helper verbs, and politeness modifiers ("please", "simply", "just", "easy").
- Format outputs into dense semantic mappings (`key: val`), short bullet lists, and compact tables.
- For code reviews, strictly use structured headers: `[ISSUE]`, `[SUGGESTION]`, `[NITPICK]`.

### Rule 7: Token-Budget Reasoning (CoT Optimization)
- **Direct Mode:** Skip extensive planning cycles for trivial, deterministic edits (formatting, typos, simple imports).
- **Abbreviated Thoughts:** Keep thought blocks compact. Never reprint code snippets or copy-paste file blocks inside thoughts; reference via file path and line numbers (e.g. `src/core/store.js#L12-18`).

### Negative Constraints
- Zero filler: "Here is", "I understand", "Let me", "Certainly", "Of course", "Happy to help".
- No blind truncation of stacktraces or error logs.
- No full-file reads on large files (>300 lines).
- No re-reading files already loaded in the conversation history unless modified on disk.
- No multi-question clarification dumps (max 1 single question).
- No full git diff ingestion on large changesets — extract specific hunks only.


---

## 2. Dynamic Context Discovery Heuristic (Filesystem-Context)

Before initiating work:
1. **Target Identification:** Consult `docs/ARCHITECTURE.md` section 4 to identify the exact submodule and strict boundaries.
2. **Just-In-Time Loading:** Only load the specific file required for the active domain. Never preload unrelated modules or entire directories.
3. **Observation Offloading:** When tool output exceeds 2,000 tokens, offload data to scratch files or grep for targeted lines rather than carrying full outputs in context.
4. **Targeted Inspections:** Use `grep_search` and targeted slice reads (`StartLine`/`EndLine`) for files > 300 lines instead of ingesting whole files.
5. **Architectural Invariance:** Keep vanilla JS / ES module architecture intact without introducing runtime build steps or unnecessary frameworks.

---

## 3. Mandatory Version Bumping & Changelog Standards

For **EVERY non-trivial update, feature addition, bug fix, or refactor**:
1. **Bump Version & Update Changelog**: You **MUST** run the automated version bumper script before marking your task complete. Do not manually edit version numbers across files.
2. **Execution Command**:
   ```bash
   node scripts/bump-version.js patch "Brief summary of changes made"
   ```
   - Use `patch` for bug fixes, performance tweaks, or minor UI adjustments (e.g. `v1.8.1` -> `v1.8.2`).
   - Use `minor` for new components, new features, or architectural upgrades (e.g. `v1.8.1` -> `v1.9.0`).
   - Use `major` for breaking API or system rewrites (e.g. `v1.8.1` -> `v2.0.0`).

3. **Versioning & Detailed Changelog Standards**:
   - **Version Format**: Version strings adhere to `tasbihku-vX.Y.Z` (e.g. `tasbihku-v1.8.2`).
   - **Single Source of Truth**: `"version"` in [`package.json`](file:///package.json) is the authoritative source.
   - **Detailed Changelog Requirement (MANDATORY)**:
     - [`CHANGELOG.md`](file:///CHANGELOG.md) adheres to [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).
     - **Never write vague or single-line changelog entries.**
     - Every release entry in [`CHANGELOG.md`](file:///CHANGELOG.md) must provide a comprehensive, structured breakdown detailing:
       - **Specific UI & Component Changes**: Added/modified views, modals, full-screen containers, buttons, and CSS tokens.
       - **Core Logic & Audio/Haptic Workflows**: Changes to counters, state persistence, debounce times, audio synth, and haptic vibration intervals.
       - **Dzikir & Habits Engine**: Preset changes, calculation algorithms, streak tracking, and i18n localization keys.
       - **Test & Verification**: Results of `npm test` (`vitest`) and `npm run build` (`vite build`).

---

## 4. Checklist Before Completion

- [ ] Has `node scripts/bump-version.js` been executed successfully for non-trivial changes?
- [ ] Has [`CHANGELOG.md`](file:///CHANGELOG.md) been enriched with detailed, structured bullet points?
- [ ] Did you verify 0 test errors via `npm test`?
- [ ] Did you verify clean bundle compilation via `npm run build`?


