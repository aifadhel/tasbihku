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

To prevent context-window saturation and maintain prompt-cache efficiency, load only the specific files mapped to each functional domain. Never load the entire codebase into context.

| Domain | Primary Entry | Supporting Files | What NOT to Load |
|---|---|---|---|
| **Tasbih Counter & Timers** | `src/modules/tasbih.js` | `src/core/store.js`, `src/hardware/media.js` | Dzikir, Habits, Chart engines |
| **Guided Dzikir Engine** | `src/modules/dzikir.js` | `src/data/azkar.json`, `src/core/store.js` | Habits modules, Chart engines |
| **Habit Tracker: Logic & Streaks** | `src/modules/habits-data.js` | `src/core/store.js` | Habits UI, Chart rendering |
| **Habit Tracker: DOM & Modals** | `src/modules/habits-ui.js` | `src/modules/habits-data.js`, `src/ui/router.js` | Free counter, Hardware audio |
| **Habit Tracker: Charts & Trends** | `src/modules/habits-chart.js` | `src/modules/habits-data.js` | UI modals, Dzikir engines |
| **Habit Tracker: CSV Export** | `src/modules/habits-export.js` | `src/core/store.js` | UI rendering, SVG charts |
| **App Routing, Dialogs & OLED** | `src/ui/router.js` | `style.css`, `index.html` (targeted lines) | Module business logic |
| **Toasts & Micro-Interactions** | `src/ui/toast.js`, `src/ui/confetti.js` | `style.css` | Store persistence, Data JSON |
| **Audio & Haptic Feedback** | `src/hardware/media.js` | `src/core/store.js` | UI templates, Dzikir data |
| **WakeLock & PWA Service Worker** | `src/hardware/system.js` | `public/sw.js` | Counter logic, Chart rendering |
| **State Persistence & Migrations** | `src/core/store.js` | - | Any UI / Hardware components |
| **Localization & Translations** | `src/core/i18n.js` | - | Logic modules |

---

## 5. Filesystem Discovery Recipes for Agents

When discovering symbols or investigating bugs, execute targeted ripgrep queries rather than viewing complete files:

```bash
# Locate function declaration without loading file
grep -nE "^export function <functionName>" src/modules/*.js

# Locate store state mutations
grep -n "state\.<property>" src/

# Search translation keys
grep -n "<translation_key>" src/core/i18n.js
```

