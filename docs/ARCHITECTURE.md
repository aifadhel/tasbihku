# TasbihKu Architecture & Dynamic Context Map

Reference entry point for AI agents and developers. Consult `CODEMAP.md` and each feature's `*.contract.js` (`// @feature ...`) for O(1) slice discovery before reading implementation files.

## 1. System Topology & Layering

```
                 index.html  ([data-cmd] delegation + semantic markup)
                     │
               src/main.js   (thin shell bootstrap <=60L)
          ┌──────────┼──────────┐
          ▼          ▼          ▼
     src/app/   src/shared/  src/styles/ (@layer reset,tokens,primitives)
  (bus,registry, (idb+1KB    (reset, tokens, primitives-*)
   slots,dom-    bootPrefs,
   bridge,ver)   store,i18n,
                 media,system)
          │
          ▼  lazy dynamic import() via feature-registry
  src/features/<name>/   (depth-1 flat, <=200L/file, <=60L *.contract.js)
   ├── tasbih-counter/   Free counter, target limiter, stopwatch, timer
   ├── dzikir-guided/    Wirid/Pagi/Petang JSON datasets + docked player
   ├── dzikir-custom/    Custom dzikir list, editor, azkar library, share codec
   ├── habits-core/      Pure dates, streaks, EMA strength, CSV export
   ├── habits-ui/        Routine cards, drag/drop, modals, calendar, lazy charts
   └── settings-shell/   SPA router, modal stack, OLED/audio/haptics, backup I/O
```

---

## 2. Structural Rules (Enforced by `npm run check` & `npm run size`)

1. **Line ceilings:** Every `.js` / `.css` file under `src/` `<= 200L`; `*.contract.js` `<= 60L` (0 imports); `*.i18n.json` `<= 150L` (`id`/`en` key parity).
2. **Isolation:** Depth-1 flat feature folders (`src/features/<name>/`), zero `index.js` barrels, zero cross-feature imports except `*.contract.js` manifests. Cross-feature interactions use `src/app/command-bus.js` (`dispatch` / `onEvent`) or `src/app/slots.js` (`registerCapability` / `useCapability`).
3. **Zero globals & storage discipline:** Zero `window.<fn> = ...` assignments; zero raw `localStorage` outside `src/shared/storage.js` (<=1 KB `tasbihKuBootPrefs` + IDB primary `tasbihKuState` + `BroadcastChannel`).
4. **CSS Cascade Layers:** `@layer reset, tokens, primitives, features, overrides` in `style.css`; every feature CSS wraps rules in `@layer features`.
5. **Bundle budgets (`size.config.json`):** Shell JS `<= 20 KB` gz, Shell CSS `<= 90 KB` gz, lazy chunks `<= 40 KB` gz. Vite `closeBundle` injects all `dist/assets/*.js|css` into `dist/sw.js`.

---

## 3. Data Flow & Reactive State Lifecycle

1. **Event Delegation:** `src/app/dom-bridge.js` intercepts `[data-cmd]`, `[data-cmd-change]`, `[data-cmd-input]`, keyboard shortcuts, and swipe/long-press gestures, dispatching typed commands on `command-bus.js`.
2. **On-Demand Feature Loading:** `feature-registry.js` lazy-loads any owning feature on first command dispatch (1x retry + `vite:preloadError` recovery).
3. **Persistence:** State mutations via `state` Proxy trigger debounced `saveState()` -> `src/shared/storage.js` (<=1 KB boot prefs + IndexedDB + cross-tab `BroadcastChannel('tasbihku_state_sync')`).

---

## 4. Agent Discovery & JIT Loading Heuristics

Read `CODEMAP.md` first, then only the target feature's `*.contract.js` and relevant submodule:

| Domain | Feature / Shell Entry | Shared Contracts / Bus | What NOT to Load |
|---|---|---|---|
| **App Bootstrap & Delegation** | `src/main.js`, `src/app/` | `command-bus.js`, `feature-registry.js`, `slots.js`, `dom-bridge.js` | Feature internals |
| **Tasbih Counter & Timers** | `src/features/tasbih-counter/` | `habits:track-activity`, `ui:show-modal`, `ui:update-reset-btn` | Dzikir, Habits |
| **Guided Dzikir & Player** | `src/features/dzikir-guided/` | `habits:track-activity`, `habits:check-linked`, `dzikir:player-back` | Habits UI, Charts |
| **Custom Dzikir & Sharing** | `src/features/dzikir-custom/` | `dzikir:start-player`, `dzikir:get-session`, `ui:show-modal` | Guided JSON datasets |
| **Habits Logic & CSV** | `src/features/habits-core/` | Capability `habitsCore`, event `habits:completed-linked` | Habits DOM, CSS |
| **Habits DOM, Calendar & Charts** | `src/features/habits-ui/` | `useCapability('habitsCore')`, lazy `habits-charts-*.js` | Dzikir datasets |
| **Routing, Theme & Backup** | `src/features/settings-shell/` | `settings:*`, `ui:show-modal`, `src/app/slots.js` | Business logic |
| **Persistence & i18n** | `src/shared/storage.js`, `store.js`, `i18n.js` | `src/features/*/*.i18n.json` | Feature UI code |
