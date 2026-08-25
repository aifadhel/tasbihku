# TasbihKu Architecture & Dynamic Context Map

This document serves as the high-density architectural reference and dynamic context entry point for AI agents and developers.

## 1. System Topology & Layering

```
                     ┌─────────────────────────────┐
                     │         index.html          │
                     │  (Material 3 Expressive UI) │
                     └──────────────┬──────────────┘
                                    │
                             ┌──────▼──────┐
                             │ src/main.js │
                             └──────┬──────┘
       ┌──────────────┬─────────────┼─────────────┬──────────────┐
       ▼              ▼             ▼             ▼              ▼
┌────────────┐ ┌────────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐
│ src/core/  │ │src/modules/│ │  src/ui/  │ │src/hardware││  src/data/  │
│  store.js  │ │ tasbih.js  │ │ router.js │ │ media.js  │ │ azkar.json  │
│  i18n.js   │ │ dzikir.js  │ │ toast.js  │ │ system.js │ │             │
│            │ │ habits*.js │ │confetti.js│ │           │ │             │
└────────────┘ └────────────┘ └───────────┘ └───────────┘ └─────────────┘
```

---

## 2. Directory Navigation Index

| Directory / File | Responsibility | Key Exports & Interfaces |
|---|---|---|
| `src/main.js` | App bootstrap, lifecycle, keyboard/touch event dispatchers | `DOMContentLoaded`, `handleHashRouting`, `handleDashboardMainBtn` |
| `src/core/store.js` | Reactive state store, IndexedDB sync with debounce & broadcast channel | `state`, `loadState()`, `saveState()`, `saveStateImmediate()`, `subscribe()` |
| `src/core/i18n.js` | Internationalization dictionary (ID/EN) and reactive translation engine | `t(key, params)`, `setLanguage(lang)`, `applyTranslations()` |
| `src/modules/tasbih.js` | Free counter, target limiter, stopwatch, countdown timer | `incrementFree()`, `toggleStopwatch()`, `toggleTimer()`, `promptManualCount()` |
| `src/modules/dzikir.js` | Guided dzikir engine (Pagi, Petang, Wirid), custom editor, library modal | `startPlayer()`, `incrementPlayer()`, `renderCustomList()`, `openEditor()` |
| `src/modules/habits.js` | Habit tracker barrel export | Re-exports data, UI, chart, and export submodules |
| `src/modules/habits-data.js` | Habit calculations, streaks, completion metrics, scheduling | `calculateStreak()`, `isHabitScheduledOnDate()`, `calculateHabitStrength()` |
| `src/modules/habits-ui.js` | Habit UI rendering, cards, filters, modals, completion toggles | `renderHabits()`, `renderStats()`, `openHabitModal()` |
| `src/modules/habits-chart.js` | SVG and Canvas charts for habit statistics and trends | `renderDayOfWeekChart()`, `renderFrequencyChart()`, `renderScoreTrend()` |
| `src/modules/habits-export.js` | CSV generation and export for habit activity | `exportHabitCSV()`, `generateHabitCSVData()` |
| `src/hardware/media.js` | Web Audio API sound generator, Web Vibration API haptics | `playTapSound()`, `vibrate()`, `isVibrationSupported()` |
| `src/hardware/system.js` | Screen Wake Lock, Service Worker registration, PWA Install prompt | `requestWakeLock()`, `toggleWakeLock()`, `initServiceWorker()` |
| `src/ui/router.js` | SPA hash router, modal dialogs, OLED theme switcher | `showPage()`, `showModal()`, `toggleOledMode()`, `SVG_ICONS` |
| `src/ui/toast.js` | Non-blocking toast notification queue with action callbacks | `showToast(msg, actionLabel, actionCb)` |
| `src/ui/confetti.js` | Canvas confetti particle celebration engine | `triggerCelebration()`, `triggerToastParticles()` |
| `src/data/azkar.json` | Comprehensive static Azkar library with Arabic, Latin, and translations | JSON array of dzikir definitions |
| `public/sw.js` | Cache-first offline service worker with cache versioning | Cache management, fetch interception |

---

## 3. Data Flow & Reactive State Lifecycle

1. **State Mutation:** Component calls mutating logic (e.g., `incrementFree()`).
2. **Persistence:** State updates trigger debounced `saveState()` or immediate `saveStateImmediate()`, persisting to IndexedDB via `idb-keyval`.
3. **Reactivity:** `subscribe(key, listener)` notifies registered UI subscribers upon key change.
4. **Cross-tab Sync:** State mutations broadcast across tabs via `BroadcastChannel('tasbihku_state_sync')`.

---

## 4. Agent Discovery & JIT Loading Heuristics

When performing tasks on this repository:
- **For Tasbih/Timer changes:** Load `src/modules/tasbih.js` and `src/core/store.js`.
- **For Guided Dzikir changes:** Load `src/modules/dzikir.js` and `src/data/azkar.json`.
- **For Habit Tracker changes:** Target specific submodules (`habits-data.js` for logic, `habits-ui.js` for DOM, `habits-chart.js` for visualization).
- **For Layout / Theme styling:** Inspect `style.css` and `index.html`.
