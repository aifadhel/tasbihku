# TasbihKu Hierarchical Project Map (JIT Discovery Index)

Consult this map and [CODEMAP.md](../CODEMAP.md) before reading implementation files. Load only the slice needed for the active task.

## 1. Entry & Core Shell

| Path | Role | Read when: |
|---|---|---|
| [index.html](../index.html) | App shell DOM, SVG `#icon-*` defs, `[data-cmd]` bindings | Adding/modifying page markup, modal DOM, or declarative commands |
| [style.css](../style.css) | `@layer reset, tokens, primitives, features, overrides` manifest | Checking CSS import order or cascade layers |
| [src/main.js](../src/main.js) | Thin shell bootstrap (`<=60L`), eager feature registration | Changing startup sequence or boot-loaded features |
| [src/app/](../src/app/) | `command-bus.js`, `feature-registry.js`, `slots.js`, `dom-bridge.js`, `version.js` | Touching command routing, lazy chunks, modal stack, or gestures |
| [src/shared/](../src/shared/) | `storage.js` (IDB + `<=1KB` boot prefs), `store.js`, `store-migrate.js`, `i18n.js`, `media.js`, `system.js`, `toast.js`, `confetti.js`, `dom-effects.js`, `svg-icons.js` | Changing state schema, persistence, translations, audio/haptics, or SW registration |
| [src/styles/](../src/styles/) | `reset.css`, `tokens.css`, `primitives-{core,layout,controls,overlays}.css` | Modifying M3 seed tokens, typography, or shared CSS primitives |
| [src/data/azkar.json](../src/data/azkar.json) | Built-in Azkar library entries | Updating preset Azkar items (check `Do-not-touch` gates first) |

## 2. Feature Slices (`src/features/`)

For feature domains, slots, commands, and summaries, read [CODEMAP.md](../CODEMAP.md) first, then open only `src/features/<name>/<name>.contract.js` and the specific submodule (`<=200L`/file).
Detailed topology and cross-feature bus contracts live in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## 3. Tooling, Config, Tests & Docs

| Path | Role | Read when: |
|---|---|---|
| [package.json](../package.json) | Authoritative `"version"` and npm scripts | Checking dependencies or running scripts |
| [vite.config.js](../vite.config.js) | Vite config (`realpathSync` NTFS junction fix + SW precache plugin) | Changing build output, dev port `3005`, or SW asset injection |
| [size.config.json](../size.config.json) | Gzipped budgets (`shellJsMaxGzBytes`, `shellCssMaxGzBytes`, `lazyChunkMaxGzBytes`) | Checking bundle budget thresholds |
| [scripts/check.mjs](../scripts/check.mjs) | Structural, line-limit, isolation, i18n parity, and `--size` verifier | Modifying architecture gates or debugging `npm run check` failures |
| [scripts/codemap.mjs](../scripts/codemap.mjs) | Generates [CODEMAP.md](../CODEMAP.md) from `*.contract.js` headers | Updating feature contract metadata |
| [scripts/bump-version.js](../scripts/bump-version.js) | Syncs `package.json`, `src/app/version.js`, `public/sw.js`, `CHANGELOG.md` | Preparing any non-trivial release or patch bump |
| [tests/unit/](../tests/unit/) & `src/features/*/*.test.js` | Vitest architecture, i18n, and feature unit tests | Adding or fixing unit/regression coverage |
| [tests/e2e/](../tests/e2e/) & [playwright.config.js](../playwright.config.js) | Playwright browser E2E suites | Auditing or updating E2E tests |
| [.github/workflows/ci.yml](../.github/workflows/ci.yml) | GitHub Actions CI (`check`, `test`, `test:e2e`, `build`, `size`) | Modifying CI pipeline checks |

## 4. `.agents/` Workspace Layout

| Path | Role | Read when: |
|---|---|---|
| [AGENTS.md](../AGENTS.md) | Standing repo rules, commands, release workflow | Every session start |
| [.agents/rules/context-optimization.md](./rules/context-optimization.md) | KV-cache, compaction, offloading, token-lean & preservation rules | Starting multi-step work or approaching compaction |
| [.agents/agent-progress.md](./agent-progress.md) | Active `## STATE` handoff ledger + recent sessions | Session open, pre-compaction, or post-compaction recovery |
| [.agents/archive/agent-progress.202610.md](./archive/agent-progress.202610.md) | Historical session archive | Auditing pre-v1.15.0 session history only |
