# TasbihKu Agent Progress & Session History

## STATE
- **Active plan**: None (Completed)
- **Active milestone**: tasbihku-v1.16.2 Clickable Settings Version & App Update Check (uncommitted; verified exit 0)
- **Open issues**: 3 legacy E2E probes invoke removed `window.*` globals (`habits-ui.spec.js:274`, `tasbih-modes.spec.js:136,150`); 2 E2E clicks hit pre-existing `TAP_DEBOUNCE_MS = 60` (`tasbih-modes.spec.js:205,222`); 8 npm devDependency advisories (`tinypool` in `vitest@1.x`; 0 prod vulnerabilities via `npm audit --omit=dev`)
- **Do-not-touch**: `public/{sound.ogg,config.json,*.png,favicon.ico,manifest.json,404.html}`, `src/data/azkar.json`, `firebase.json`, `playwright.config.js`, `tests/e2e/*.spec.js`

## Session: 2026-11-27 (v1.16.2 Clickable Settings Version & App Update Check)
- **Touched Files**: `index.html`, `src/styles/primitives-core.css`, `style.css`, `src/features/settings-shell/{app-updater.js,sw-probe.js,app-updater.test.js,settings-shell.css,settings-update.css,settings-shell.contract.js,settings-shell.feature.js}`, `src/shared/system.js`, `public/sw.js`, `CODEMAP.md`, `package.json`, `src/app/version.js`, `CHANGELOG.md`, `.agents/agent-progress.md`.
- **Milestones Completed**:
  - [✓] Interactive Footer Version Button & Settings Layout (`index.html`, `src/styles/primitives-core.css`, `src/features/settings-shell/{settings-shell.css,settings-update.css}`, `style.css`): Replaced `<span id="app-version">` with `<button type="button" id="app-version" class="footer-version-btn" data-cmd="settings:check-update">`, `#icon-18`, `#app-version-text`, and `#app-version-status` (`aria-live="polite"`), moved watermark dimming to `.footer-made-with`, prevented `#page-menu > *` flex-shrink collapse (restoring `30px` gap above `"Settings"`), and fixed `#vibration-interval-row` / `.btn-list-item select` (`width: auto`, `margin-bottom: 0`, `min-height: 44px`, `gap: 12px`) across mobile (`390x844`) and desktop (`900x800`).
  - [✓] Update Checker & SW Hardening (`app-updater.js`, `sw-probe.js`, `settings-shell.{contract,feature}.js`, `src/shared/system.js`, `public/sw.js`, `CODEMAP.md`): Added `settings:check-update` with lazy `registerTranslations()` (`index.js` `20.24 kB` gz <= `20 KB`), semver comparison, Cache Storage + `GET_VERSION` probing, initial-SW activation disambiguation, `SKIP_WAITING` + reload modal, `updateViaCache: 'none'`, `cache: 'reload'` precaching, and `/sw.js` fetch bypass.
  - [✓] Verification & Release: Added 9 unit tests in `app-updater.test.js`, verified mobile `390x844` browser flows (ID/EN + Emerald/OLED, 0 uncaught JS errors), bumped `1.16.1` -> `1.16.2`, passed `harness-verifier` (`58085bba`), and passed `npm run check`, `npm test` (`14/14` files, `67/67` tests), `npm run build`, and `npm run size` (`exit 0`).
- **Double-Check & Lessons**:
  - `[LESSON]` On first visit before a Service Worker controls the page (`navigator.serviceWorker.controller === null`), `reg.installing` / `controllerchange` triggers for initial same-version SW installation; guard with `hadController` + `GET_VERSION`/semver check so manual checks do not false-positive on initial install.

## Session: 2026-11-27 (v1.16.1 AI Modal Scroll & Focus Ring Fix)
- **Touched Files**: `src/features/dzikir-custom/{dzikir-ai.js,dzikir-ai.css,dzikir-ai.test.js}`, `package.json`, `src/app/version.js`, `public/sw.js`, `CHANGELOG.md`, `.agents/agent-progress.md`.
- **Milestones Completed**:
  - [✓] Fixed initial modal auto-scroll clipping (`scrollTop = 0` + `focus({ preventScroll: true })` in `dzikir-ai.js`) so `"1. Permintaan Doa / Dzikir"` and `"Prompt: ID"` stay visible on open.
  - [✓] Fixed `.ai-modal-body` padding (`6px 10px 6px 6px`), `width: auto` / `margin-bottom: 0` on `.ai-lang-select` and modal fields (overriding `primitives-layout.css` `100%` / `24px`), and removed double green `:focus-visible` border in `dzikir-ai.css`.
  - [✓] Verified via `npm run check`, `npm test` (`13/13` files, `58/58` tests), `npm run build`, `npm run size`, and Playwright screenshot inspection (`emerald` & `oled` `390x844`, `0` errors).

## Session: 2026-11-27 (v1.16.0 Custom Dhikr AI Prompt & Accept Workflow)
- **Touched Files**: `src/features/dzikir-custom/{dzikir-ai-prompt.js,dzikir-ai.js,dzikir-ai.i18n.json,dzikir-ai.css,dzikir-ai.test.js,dzikir-custom.contract.js,dzikir-custom.feature.js,dzikir-editor.js}`, `index.html`, `style.css`, `CODEMAP.md`, `package.json`, `src/app/version.js`, `public/sw.js`, `CHANGELOG.md`, `.agents/agent-progress.md`.
- **Milestones Completed**:
  - [✓] Pure Prompt & Parser (`dzikir-ai-prompt.js`): Built bilingual (`id`/`en`) prompts delimited with `<user_request>` enforcing exclusive use of Al-Qur'an, authentic Hadith (`Sahih`/`Hasan`), authentic *athar*, and *ijma'* of the *Salaf* scholars, fail-closed `unverified` fallback, markdown/prose JSON extraction, and mandatory per-page `reference` validation.
  - [✓] Modal, Editor Integration & Budget Hygiene (`dzikir-ai.js`, `dzikir-editor.js`, `dzikir-ai.css`, `dzikir-ai.i18n.json`, `index.html`, `style.css`, `dzikir-custom.{contract,feature}.js`): Added `#editor-ai-card` (visible for `new`/`custom`, hidden on guided presets) and `#ai-dzikir-modal` (`>=44px` tap targets, `Escape` close, inline `#ai-dhikr-feedback` errors, blank-scaffold replace or append-into-editor Accept flow), caching lazy `dzikir-ai.js` + lazy `registerTranslations()` to keep `index.js` under `20 KB` gz.
  - [✓] Verification & Release: Added 6 unit/DOM tests in `dzikir-ai.test.js`, passed `harness-verifier` (`596a40fc`, resolved `WARN` on `.ai-lang-select`/`.btn-text` `<44px` tap targets), passed Playwright verification across Emerald & OLED mobile viewports (`390x844`, 0 console/page errors), bumped `1.15.2` -> `1.16.0`, and verified `npm run check`, `npm test` (`13/13` files, `58/58` tests), `npm run build`, and `npm run size` (`exit 0`).
- **Double-Check & Lessons**:
  - `[LESSON]` Because `src/shared/i18n.js` eagerly globs `*.i18n.json` into `index.js` (`<=20 KB` gz ceiling), keep runtime-only modal toast/error copy inside lazy feature chunks via `registerTranslations()`, leaving only static `[data-i18n*]` DOM keys in eager `*.i18n.json`.
  - `[LESSON]` Cache lazy feature module references in `*.feature.js` (`withAi`) so repeat UI input/change/click commands execute synchronously without an extra `import()` microtask race.

## Session: 2026-11-27 (v1.15.2 Language Switcher Fix)
- **Touched Files**: `src/app/dom-bridge.js`, `src/shared/i18n.js`, `src/features/settings-shell/{settings-shell.feature.js,shell-modes.js,settings-smoke.test.js}`, `tests/unit/dom-bridge.test.js`, `package.json`, `src/app/version.js`, `public/sw.js`, `CHANGELOG.md`, `.agents/agent-progress.md`.
- **Milestones Completed**:
  - [✓] Root Cause & RED Tests: Identified `<button>` default `.value === ""` shadowing `data-arg` in `dom-bridge.js:extractArg()` + `p?.value ?? p?.arg` in `settings:set-language`; added failing regression tests in `tests/unit/dom-bridge.test.js` and `src/features/settings-shell/settings-smoke.test.js`.
  - [✓] Fix & Mode Sync: Restricted `extractArg` `.value` capture to non-button form controls (`INPUT`, `SELECT`, `TEXTAREA`), guarded `settings:set-language` payload precedence, enabled immediate persistence (`updateState({ language: lang }, true)`) + `aria-pressed` sync in `i18n.js`, and added `syncLocalizedModeLabels()` in `shell-modes.js` on `languageChanged`.
  - [✓] Release & Gates: Bumped version via `node scripts/bump-version.js patch` (`1.15.1` -> `1.15.2`), enriched `CHANGELOG.md`, and verified `npm run check`, `npm test` (`12/12` files, `52/52` tests), `npm run build`, and `npm run size` (`exit 0`).

## Session: 2026-11-27 (v1.15.1 Repository Cleanup & AI-Context Optimization)
- **Touched Files**: Deleted `.agents/harness-snapshot/auto/20261018T052317_archive_agent-progress.md`, `docs/CONTEXT_OPTIMIZATION.md`; modified `src/app/{command-bus,feature-registry,slots}.js`, `src/features/habits-core/habits-dates.js`, `src/features/habits-ui/{habits-progress.js,habits-sections.css}`, `src/features/tasbih-counter/tasbih-counter.{logic,timers}.js`, `.gitignore`, `.github/workflows/ci.yml`, `CONTRIBUTING.md`, `AGENTS.md`, `public/sw.js`, `package.json`, `src/app/version.js`, `CHANGELOG.md`, `.agents/{agent-progress.md,archive/agent-progress.202610.md}`; created `.geminiignore`, `.env.example`, `.agents/PROJECT_MAP.md`, `.agents/rules/context-optimization.md`.
- **Milestones Completed**:
  - [✓] Phase 1: Removed redundant snapshot & stale doc, pruned zero-caller exports/CSS (`interceptCommand`, `getRegisteredFeatures`, `getTopModal`, `isHabitSkippedOn`, `setActiveHabitFilter`, legacy `.archived-*` CSS), deduplicated `notifyShowModal` & `core.getLocalDateString`, reconciled `.gitignore`, `.env.example`, CI (`check` + `size`), `CONTRIBUTING.md`, and `public/sw.js:1`.
  - [✓] Phase 2–3: Added stack-tuned `.geminiignore`, `.agents/PROJECT_MAP.md` JIT index, `.agents/rules/context-optimization.md` (KV-cache stability, 70–80% compaction handoff, scratchpad masking, token-lean density, preservation boundaries), consolidated pre-v1.15.0 logs into `.agents/archive/agent-progress.202610.md`, and updated `AGENTS.md`.
  - [✓] Phase 4: Executed `node scripts/bump-version.js patch` (`1.15.0` -> `1.15.1`), enriched `CHANGELOG.md`, and ran fresh verification (`check`, `test`, `build`, `size`).
- **Double-Check & Lessons**:
  - [⚠] `harness-verifier` (`939f6cb3`) passed static file/version/deletion assertions and reported `BLOCKED` solely due to lacking a shell tool; parent executed all shell gates directly (`exit 0`).
  - `[LESSON]` Run file deletions as unchained `Remove-Item -LiteralPath` calls (never `-Recurse -Force` or `node -e` inline eval) under PreToolUse safety hooks.

## Session: 2026-11-24 (README Update via antislop-copywriting, Commit & Push)
- **Touched Files**: `README.md`, `.agents/agent-progress.md`
- **Milestones Completed**:
  - [✓] Rewrote `README.md` with `/antislop-copywriting` (`0` em/en dashes, plain sentence-case features matching `v1.15.0`, accurate `src/{app,shared,styles,features}/` structure and `check`/`codemap`/`size` scripts).
  - [✓] Verified via `npm run check`, `npm run size`, `npm test` (`48/48`), and `npm run build` (`79` modules, exit `0`).
  - [✓] Committed `137` changed files (`e06855e`) and pushed `0efcc06..e06855e main -> main`.
- **Closing Report Status**: Complete (`Step 5.5` audited earlier; post-edit `README.md` & `.agents/agent-progress.md` verified by direct re-read + plan verification pipeline).

## Session: 2026-11-21 (v1.15.0 Hybrid Feature-Sliced Vanilla JS Alignment)
- **Planning & Executing Model**: Gemini 3.1 Pro (High) / Antigravity Harness
- **Milestones Completed**:
  - [✓] Step 1: Added `scripts/codemap.mjs`, `scripts/check.mjs`, `size.config.json`, `swPrecacheManifestPlugin()` in `vite.config.js`, and npm scripts (`check`, `codemap`, `size`).
  - [✓] Step 2: Built `src/app/` (`command-bus.js`, `feature-registry.js`, `slots.js`, `dom-bridge.js`, `version.js`) and `src/shared/` (`<=1KB` `tasbihKuBootPrefs` + IDB primary + legacy migration + `BroadcastChannel` in `storage.js`, `store.js`, `store-migrate.js`, `media.js`, `system.js`, `toast.js`, `confetti.js`, `dom-effects.js`, `svg-icons.js`).
  - [✓] Step 3: Split 375 bilingual i18n keys (`id`/`en` parity) into `src/shared/i18n.js` + `i18n-core.json` and 7 feature `*.i18n.json` bundles (`<=150L` each).
  - [✓] Step 4: Replaced `3,353L` `style.css` + HTML `<style>` with `@layer reset, tokens, primitives, features, overrides`, `oklch()`/`color-mix()` seed tokens, 6 `src/styles/` sheets, and 18 feature CSS slices.
  - [✓] Steps 5–10: Migrated all 6 depth-1 feature slices (`tasbih-counter`, `dzikir-guided`, `dzikir-custom`, `habits-core`, `habits-ui`, `settings-shell`, all JS/CSS `<=200L`, 0-import `*.contract.js` `<=60L`), switched 88 inline HTML handlers in `index.html` to `[data-cmd*]` delegation, trimmed `src/main.js` to `55L`, and updated `scripts/bump-version.js` to target `src/app/version.js`.
  - [✓] Step 11: Removed legacy `src/{core,hardware,ui,modules}/` and superseded tests; added `tests/unit/architecture.test.js`, migrated `tests/unit/i18n.test.js`, updated `CODEMAP.md`, `docs/ARCHITECTURE.md`, and `AGENTS.md` §2.
  - [✓] Step 12: Executed minor version bump to `tasbihku-v1.15.0` and enriched `CHANGELOG.md`.
- **Verification Evidence**:
  - `npm run codemap`: `CODEMAP.md updated (12 lines).` (Exit 0)
  - `npm run check && npm run size`: `CHECK PASS scope=full` & `CHECK PASS scope=--size` (Exit 0)
  - `npm test`: `11 passed (11)`, `48 passed (48)` (Exit 0)
  - `npm run build`: `79 modules transformed`, `dist/index.js` -> `dist/assets/index.js` `19.50 kB` gz (`<=20KB`), `index.css` `82.72 kB` gz (`<=90KB`), `dist/sw.js` `tasbihku-v1.15.0` precaching all `16` `.js` + `1` `.css` assets (Exit 0)
- **Double-Check Findings (Step 5.5 + E2E)**:
  - `[LESSON]` Async `history.back()` + `history.pushState` across modal transitions caused Chromium `popstate` race; resolved in `src/app/slots.js` via `swapModal()` + `history.replaceState()` and fixed `getLocalizedText(z.name)` in `habits-modal-form.js`.
  - E2E status tracked cleanly; 3 legacy E2E tests directly invoke removed `window.<fn>` globals in `page.evaluate()`, and 2 rapid-click tests in `tasbih-modes.spec.js:205,222` hit pre-existing `TAP_DEBOUNCE_MS = 60`.
- **Known Regressions / Blockers**: None in production app; see E2E notes above.

<!-- Pre-v1.15.0 sessions consolidated into .agents/archive/agent-progress.202610.md -->


