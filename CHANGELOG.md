# TasbihKu WebApp — Changelog

All notable changes to the TasbihKu project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [tasbihku-v1.12.0] - 2026-09-29

- **Highlight:** Replaced rigid dashboard mode switcher with an Apple Human Interface Guidelines-compliant fluid Tab View. Features an inset concentric translucent track ($R_{\text{outer}} = 12\text{px}$, $P = 3\text{px}$), an elevated hardware-accelerated sliding pill thumb ($R_{\text{inner}} = 9\text{px}$) driven by CSS variable `--tab-active-index`, contextual hairline separator suppression, native-grade 12ms selection click haptics, and comprehensive WAI-ARIA APG roving tabindex keyboard navigation.

### Specific UI & Component Changes
- **Apple HIG Concentric Track (`style.css`):** Replaced `.connected-button-group` with `.apple-tab-view` featuring $12\text{px}$ outer radius, $3\text{px}$ inset padding, neutral translucent track fill (`rgba(118, 118, 128, 0.22)`), $0.5\text{px}$ border, and subtle inner ambient shadow (`inset 0 0.5px 1px rgba(0, 0, 0, 0.25)`).
- **Elevated Sliding Pill Thumb (`.apple-tab-indicator` in `index.html`, `style.css`):** Hardware-accelerated sliding thumb with concentric $9\text{px}$ radius ($12\text{px} - 3\text{px}$), ambient multi-tier elevation shadow (`0 3px 8px rgba(0, 0, 0, 0.28), 0 1px 2px rgba(0, 0, 0, 0.16)`), $0.5\text{px}$ specular hairline highlight (`rgba(255, 255, 255, 0.14)`), and GPU transform translation via `--tab-active-index` using Apple spring easing (`cubic-bezier(0.25, 1, 0.5, 1)` over 260ms).
- **Contextual Hairline Separators (`style.css`):** $1\text{px} \times 16\text{px}$ vertical hairline dividers between unselected peer segments (`rgba(255, 255, 255, 0.16)`) dynamically suppressed adjacent to the active selection via declarative CSS `:nth-of-type()` selectors.
- **SF Pro Typographic Polish (`style.css`):** Set inactive tabs to `rgba(255, 255, 255, 0.72)` (5.1:1 WCAG AA contrast ratio) with $16\text{px}$ icon and active tabs to `#ffffff` with weight 600. Added $0.97$ active scale spring press feedback and accessible 2px primary focus ring.
- **Vestibular Motion Accessibility (`style.css`):** Enforced `@media (prefers-reduced-motion: reduce)` override disabling transform transition on the sliding thumb for instantaneous switching.

### Core Logic & Audio/Haptic Workflows
- **Router State & Thumb Coordination (`src/ui/router.js`):** Updated `switchDashboardMode()` to calculate 0-based mode index, apply `--tab-active-index` and `data-active-index` on `#dashboard-mode-switcher`, toggle `aria-selected="true|false"` and roving `tabindex="0|-1"` across all `.segment-btn` elements, and persist state.
- **Native Selection Micro-Haptics (`src/ui/router.js`):** Integrated 12ms selection tick haptic (`vibrate(12)`) on tab switches matching native iOS `UISelectionFeedbackGenerator.selectionChanged()` behavior.
- **Roving Keyboard Navigation (`src/main.js`):** Implemented `handleTablistKeyboard()` scoped to `[role="tablist"] [role="tab"]`. Supports continuous wrap-around navigation via `ArrowLeft` / `ArrowRight` as well as direct boundary navigation via `Home` (Counting) and `End` (Timer).

### Dzikir & Habits Engine
- **Display Pane Semantics (`index.html`):** Attached `role="tabpanel"` and corresponding `aria-labelledby="tab-[mode]"` to `#counting-display-area`, `#stopwatch-display-area`, and `#timer-display-area`.
- **Backward Compatibility:** Preserved all existing CSS class hooks (`.segmented-fab-container`, `.segment-btn`), attributes (`data-mode`), and IDs (`#dashboard-mode-switcher`) ensuring zero regression across habits, timers, or counting workflows.

### Test & Verification
- **Unit Test Suite Expansion (`tests/unit/router.test.js`):** Added 5 unit tests validating mode index calculation, CSS custom property updates, ARIA attributes synchronization, display area toggling, and Arrow/Home/End keyboard navigation.
- **Vitest Run (`npm test`):** 60/60 tests passing across 4 test files (100% pass rate).
- **Vite Build (`npm run build`):** Clean compilation with 25 modules transformed, 0 errors, gzip 15.82 kB HTML / 80.82 kB CSS / 48.76 kB JS.

## [tasbihku-v1.11.2] - 2026-09-29

- **Highlight:** Resolved visibility defect on habit card direct dzikir launcher button (`.habit-launch-dzikir-btn`) by implementing canonical Google Material 3 filled tonal button tokens (`.btn-tonal`) in `style.css`. Corrected dark-on-dark contrast failure, established high-contrast secondary container colors, added pill geometry with micro-elevation, and purged redundant inline JS styles in `src/modules/habits-ui.js`.

### Specific UI & Component Changes
- **Material 3 Filled Tonal Button Token Class (`style.css`):** Introduced `.btn-tonal` styled with M3 secondary container background (`var(--md-sys-color-secondary-container: #334b40)`) and on-secondary-container text (`var(--md-sys-color-on-secondary-container: #cce8da)`). Includes standard M3 state layer transitions (`color-mix` hover lighten) and active spring press physics (`scale(0.95)`).
- **Habit Launcher Action Pill (`style.css`, `src/modules/habits-ui.js`):** Styled `.habit-launch-dzikir-btn` with pill geometry (`border-radius: var(--shape-corner-full)`), 6px 14px padding, 0.75rem bold typography, Level 1 tonal elevation, and a crisp 1px outline-variant border (`var(--md-sys-color-outline-variant)`). Added subtle hover elevation (`translateY(-1px)`) and active scale feedback (`scale(0.96)`).
- **Clean Separation of Concerns (`src/modules/habits-ui.js`):** Purged fragmented inline CSS properties (`padding`, `fontSize`, `marginTop`, `borderRadius`, `display`, `alignItems`, `gap`, `width`) from `launchBtn` instantiation, delegating layout and visual presentation cleanly to `style.css`.

### Core Logic & Audio/Haptic Workflows
- **Non-Destructive Touch Target:** Ensured minimum 32dp vertical touch target and explicit `launchBtn.type = 'button'` to prevent unintentional form submissions or bubbling inside habit card containers.
- **Dzikir Launch Navigation:** Retained seamless event delegation and `e.stopPropagation()` in `launchLinkedDzikir(habit.linkedDzikirId)` when transitioning from the habit dashboard to the guided dzikir reader.

### Dzikir & Habits Engine
- **Habit Card Quick Launcher Integrity:** Preserved dynamic localization key binding `t('btn_launch_dzikir') || 'Mulai Dzikir'` with rosary emoji indicator (`📿`).
- **Store Schema Compatibility:** Zero modifications to existing habit state structures, streak calculations, or completion records.

### Test & Verification
- **Unit Test Suite (`npm test`):** 55 passed across 3 test files (100% pass rate).
- **Production Compilation (`npm run build`):** Clean Vite bundle compilation with 25 modules transformed, 0 errors, gzip 15.71 kB HTML / 80.57 kB CSS / 48.47 kB JS.

## [tasbihku-v1.11.1] - 2026-09-29

- **Highlight:** De-escalate dhikr completion animations in `page-player` from aggressive full-screen viewport ripples and heavy haptics into calm, non-expressive micro-interactions. Scoped visual feedback exclusively to the progress indicator, softened haptic confirmation, dampened counter scale expansion, added smooth card cross-fades, silenced mid-reading toasts, and enforced reduced-motion accessibility overrides.

### Specific UI & Component Changes
- **Abolished Viewport Scale Ripple (`style.css`):** Completely removed `@keyframes heartbeat-ripple` and `.celebrate-heartbeat` which previously scaled the root `#page-player` viewport container to `1.05` and spiked brightness to `1.2`. Eliminated violent screen shaking during sacred Arabic recitation.
- **Scoped Progress Luminance Glow (`style.css`, `src/ui/router.js`):** Implemented `.progress-complete-glow` with `@keyframes progress-complete-glow` (`filter: brightness(1.25) drop-shadow(0 0 8px var(--md-sys-color-primary))`, 350ms duration). Refactored `triggerCelebration()` in `src/ui/router.js` to target `#player-progress` exclusively with zero root container deformation.
- **Counter Micro-Scale Dampening (`style.css`):** Reduced `@keyframes m3-counter-pop` and `@keyframes expressivePop` maximum scale surge from an aggressive `1.18` (18% jump) down to a subtle, calm `1.05` (5%) micro-pulse with standard easing, eliminating visual jitter during rapid counting.
- **Card Transition Dissolve (`style.css`, `src/modules/dzikir.js`):** Added `transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)` to `#player-text-container`. Softened page-advance in `goToNextPlayerPage()` with a 150ms opacity dissolve, eliminating jarring text cuts when advancing between adhkar.
- **Accessibility & Reduced Motion (`style.css`):** Declared an explicit `@media (prefers-reduced-motion: reduce)` block neutralizing all transforms, animations, and opacity transitions across counter, progress, timer, and text containers in full compliance with WCAG 2.2 Criterion 2.3.3.

### Core Logic & Audio/Haptic Workflows
- **Calm Haptic Confirmation (`src/modules/dzikir.js`):** Replaced the aggressive 5-burst `[50, 100, 50, 100, 100]` (400ms) completion buzzer with an understated, gentle dual-tap `vibrate([35, 45, 35])` (115ms total), mimicking traditional physical wooden tasbih beads.
- **Mid-Session Habit Toast Suppression (`src/modules/dzikir.js`):** Silenced intrusive `showStackingCelebrationToast()` floating card popups during individual page completions inside `page-player`. Habit tracking state (`checkAndTriggerLinkedHabit`) remains fully updated in the store while preserving uninterrupted recitation focus.

### Dzikir & Habits Engine
- **Macro-Completion Integrity:** Preserved single consolidated completion celebration modal and macro-habit tracking upon completing the entire guided session (pagi, petang, wirid) or custom list.
- **Router API Stability:** Retained backward-compatible `triggerCelebration()` signature with graceful DOM fallbacks.

### Test & Verification
- **Unit Test Suite (`npm test`):** 55 passed across 3 test files (100% pass rate).
- **Production Compilation (`npm run build`):** Clean Vite bundle compilation with 25 modules transformed, zero syntax errors, and optimized CSS/JS assets.

## [tasbihku-v1.11.0] - 2026-09-29

- **Highlight:** Comprehensive Google Material 3 (M3) Design system alignment across the TasbihKu dashboard (`#page-dashboard`), featuring canonical elevation tokens, an M3 Connected Button Group for view switching, a centered M3 Assist Chip for streak tracking, an authentic M3 Large FAB primary touch action, and an Outlined Tonal Card for wisdom quotes.

### Specific UI & Component Changes
- **Material 3 Token Matrix (`style.css`):** Declared official Google Material 3 elevation levels (`--md-sys-elevation-level-0` through `--md-sys-elevation-level-5`), expanded surface container hierarchy (`surface-container-lowest`, `surface-container-highest`, `surface-dim`, `surface-bright`), and added M3 state-layer opacity tokens (`hover 0.08`, `focus 0.10`, `pressed 0.12`).
- **Top App Bar Standardization (`style.css`, `index.html`):** Standardized top bar height to 64dp with 40dp visual icon button containers and 48dp minimum touch bounds. Aligned `#app-mode-switcher` and menu icon button with M3 state layers.
- **Streak Assist Chip (`index.html`, `style.css`):** Resolved flex cross-axis stretch bug that expanded the streak badge across 100% of the screen. Converted `#streak-badge` into a centered 32dp M3 Assist Chip (`.streak-chip`) with warm M3 Tertiary Container background (`#564519`), M3 outline border (`rgba(220, 196, 140, 0.25)`), Level 1 elevation, and excised skeuomorphic neon orange glow.
- **M3 Connected Button Group (`index.html`, `style.css`):** Replaced 3 bulky separated vertical tiles (76px tall) with canonical M3 Connected Button Group (`.connected-button-group`) featuring a unified 40dp height container, continuous 1px outline-variant border, outer pill corners (`border-radius: 9999px`), horizontal inline icon and label, and active selection fill (`var(--md-sys-color-secondary-container)`).
- **M3 Large Hero FAB (`style.css`, `index.html`):** Modernized the 152px TAP button (`.fab-large`, `.m3-fab-large`) to M3 Large FAB specifications with 36px squircle radius (`--shape-corner-xl`), Level 3 tonal elevation, authentic spring press feedback (`scale(0.95)`), removal of skeuomorphic inset specular highlights, and excision of the obsolete background radar pulse DOM (`#dashboard-fab-ripple`).
- **Mutiara Hikmah Outlined Tonal Card (`style.css`):** Standardized quote container (`#quote-card`, `.quote-card-m3`) into an M3 Outlined Tonal Card, replacing the dashed outline with a crisp 1px solid `var(--md-sys-color-outline-variant)` border and pill corner radius (`--shape-corner-full`) in collapsed state.

### Core Logic & Audio/Haptic Workflows
- **Decoupled Dynamic JavaScript Gradients (`src/modules/tasbih.js`, `src/ui/router.js`):** Eliminated all hardcoded `linear-gradient(...)` string injections from `updateStopwatchUI()`, `updateTimerUI()`, and `switchDashboardMode()`. Integrated semantic M3 CSS color tokens (`var(--md-sys-color-primary)`, `var(--md-sys-color-error)`) and `.is-paused` class toggles.
- **Tactile State Synchronization:** Maintained the proven 60ms physical tap debounce guard in `incrementFree()` alongside M3 spring micro-press animations.

### Dzikir & Habits Engine
- **Streak Calculation Invariance:** Preserved full compatibility with `calculateStreak()` and `updateStreakBadge()` in `src/modules/habits-ui.js`, seamlessly reflecting user istiqamah days on the newly centered M3 Assist Chip.
- **View Switching Parity:** Seamless integration between `switchDashboardMode()` and the new Connected Button Group with zero regression across Counting, Stopwatch, and Timer modes.

### Test & Verification
- **Automated Unit Tests (`npm test`):** 55 passed across 3 test suites (`tests/unit/i18n.test.js`, `tests/unit/dzikir.test.js`, `tests/unit/habits.test.js`) with 100% pass rate.
- **Production Compilation (`npm run build`):** Clean Vite bundle compilation in 1.31s with zero errors or warnings (25 modules transformed).

## [tasbihku-v1.10.0] - 2026-09-29

- **Highlight:** Streamlined dashboard counter architecture into an intentional, distraction-free minimalist interface by removing the `.gap-2` action container (`-1`, `Reset`, and `Mode Zen` buttons) and completing a synchronized 7-layer cleanup across markup, core modules, keyboard listeners, touch swipe gestures, stylesheet definitions, and test suites.

### Specific UI & Component Changes
- **Dashboard Action Container Excise (`index.html`):** Removed the `.gap-2` flex button row directly below `#dashboard-main-btn` (TAP) containing `#dashboard-decrement-btn` (`-1`), `#dashboard-reset-btn` (`Reset`), and `#btn-open-zen` (`Mode Zen`).
- **Zen Mode Full-Screen Overlay Removal (`index.html`):** Excised the entire `#zen-counter-overlay` DOM tree including `#zen-top-bar`, `#zen-counter-display`, `#zen-target-display`, and secondary decrement button `.zen-action-btn`.
- **CSS Architecture Streamlining (`style.css`):** Removed 105 lines of pitch-black OLED Zen mode rules (`.zen-overlay`, `.zen-overlay.active`, `.zen-top-bar`, `.zen-title`, `.zen-target`, `.zen-close-btn`, `.zen-center-area`, `.zen-counter-number`, `.zen-hint`, `.zen-bottom-bar`, `.zen-action-btn`), reducing uncompressed stylesheet footprint by ~2.8 KB and optimizing CSSOM parse time.
- **Layout Spacing Stability:** The remaining space below `.fab-container` is seamlessly absorbed by `#quote-card` (`mt-auto`), perfectly centering the primary 160px TAP target with clean vertical rhythm.

### Core Logic & Audio/Haptic Workflows
- **Module Simplification (`src/modules/tasbih.js`):** Removed `decrementFree()`, `toggleZenMode()`, `confirmResetFree()`, and `undoFreeReset()`. Excised dead `#zen-counter-display` DOM queries from `incrementFree()`, eliminating redundant microtasks during high-speed tapping.
- **Global & Event Harness Cleanup (`src/main.js`):** Removed `handleDashboardReset()`, obsolete module imports, and `window.*` global assignments (`window.handleDashboardReset`, `window.decrementFree`, `window.toggleZenMode`).
- **Keyboard Shortcuts Polish (`src/main.js`):** Excised Zen overlay checks from Space/Enter, removed Escape listener for Zen dismissal, removed Minus/ArrowDown decrement triggers, and preserved Ctrl+Z undo exclusively for Guided Player mode.
- **Touch Gesture Integrity (`src/main.js`):** Updated `handleSwipeGesture()` to remove obsolete `undoFreeReset()` on dashboard counting mode, eliminating potential `ReferenceError` crashes on horizontal swipe.
- **Reactive Subscriptions (`src/main.js`):** Cleaned up `subscribe('freeCount')` to solely synchronize `#free-counter`.

### Dzikir & Habits Engine
- **Intentional Counter Adjustment:** Users retain full control over their count via `promptManualCount()` by tapping the large count display (`#free-counter`) to enter any value or reset to 0, avoiding accidental resets during recitation. Target configuration remains active via `promptTargetLimit()`.
- **i18n Token Invariance:** Retained `btn_reset` in `src/core/i18n.js` ensuring full backward compatibility and zero test regression in `tests/unit/i18n.test.js`.

### Test & Verification
- **Unit Test Suite (`tests/unit/habits.test.js`):** Removed `decrementFree` imports and test assertions. Vitest ran 55/55 tests with 100% pass across all 3 test files.
- **Production Compilation (`npm run build`):** Vite production build compiled clean in 361ms with 0 errors, reducing bundle size across all assets (HTML gzip: 15.67 kB, CSS gzip: 79.90 kB, JS gzip: 48.80 kB).

## [tasbihku-v1.9.1] - 2026-09-29

- **Highlight:** Complete canonical authentic narrations for Morning and Evening Dhikr (*Dzikir Pagi & Petang*) with full untruncated Ayat Kursi, Al-Mu'awwidhat (3 Quls: target 3x), verified Sunnah invocations, enhanced Arabic diacritic typography, and state migration.

### Specific UI & Component Changes
- **Arabic Diacritic Line-Height Polish (`style.css`):** Raised `.arabic-text` line-height from `1.6` to `1.8` across the player reading surface, ensuring double-stacked Arabic harakat, maddah, and Quranic waqf marks render cleanly on mobile viewports without glyph clipping.
- **Player Typography & Layout Invariance (`index.html`):** Ensured full 50-word Ayat Kursi scrolls smoothly within `#player-text-container` with bounded overflow while keeping counter and tap action buttons firmly anchored.

### Core Logic & Audio/Haptic Workflows
- **State Store Migration (`guidedDataVersion: 2`):** Added migration logic in `src/core/store.js` that automatically purges stale, truncated default guided caches from older versions (`rawState.guidedData.pagi` and `petang`) while strictly preserving user-created custom lists in `customList`.
- **3 Quls Sequential Counting Ergonomics:** Segmented Surah Al-Ikhlas, Al-Falaq, and An-Nas into distinct single-responsibility player pages with exact `target: 3` thresholds.

### Dzikir & Habits Engine
- **Authentic Morning Adhkar Expansion (`dzikirPagi`):** Upgraded to 16 canonical invocations: full untruncated Ayat Kursi (Al-Baqarah 255), Surah Al-Ikhlas (3x), Surah Al-Falaq (3x), Surah An-Nas (3x), *Ashbahna wa Ashbahal Mulk* (1x), *Allahumma Bika Ashbahna* (1x), *Sayyidul Istighfar* (1x), *Allahumma Inni As'alukal 'Afwa wal 'Afiyah* (1x), *Allahumma 'Afini fi Badani* (3x), *Bismillahilladzi La Yadhurru* (3x), *Radhitu Billahi Rabba* (3x), *Ya Hayyu Ya Qayyum* (1x), *Ashbahna 'ala Fithratil Islam* (1x), *Subhanallahi wa Bihamdihi 'Adada Khalqihi* (3x), *Subhanallahi wa Bihamdihi* (100x), and *Tahlil / Istighfar* (10x / 100x).
- **Authentic Evening Adhkar Expansion (`dzikirPetang`):** Upgraded to 15 canonical invocations: full untruncated Ayat Kursi (1x), Surah Al-Ikhlas (3x), Surah Al-Falaq (3x), Surah An-Nas (3x), *Amsayna wa Amsal Mulku Lillah* (1x), *Allahumma Bika Amsayna* (1x), *Sayyidul Istighfar* (1x), *Allahumma Inni As'alukal 'Afwa wal 'Afiyah* (1x), *Allahumma 'Afini fi Badani* (3x), *Bismillahilladzi La Yadhurru* (3x), *A'udzu Bikalimatillahit Tammati* (3x), *Radhitu Billahi Rabba* (3x), *Ya Hayyu Ya Qayyum* (1x), *Amsayna 'ala Fithratil Islam* (1x), and *Subhanallahi wa Bihamdihi / Astaghfirullah* (100x).
- **Bilingual Hadith Citations & Translations:** Every recitation includes verified dual-language `{ id, en }` translations and citations with hadith numbers and authentic gradings (Al-Bukhari, Muslim, Abu Dawud, At-Tirmidhi, An-Nasa'i, Ahmad, Al-Hakim, authenticated by Al-Albani).
- **Habit-Trigger Integrity:** Preserved identical first-15 character keys for shared azkar to maintain seamless backward compatibility with `checkAndTriggerLinkedHabit()`.

### Test & Verification
- **Unit Test Suite (`tests/unit/dzikir.test.js`):** Created 12 Vitest tests asserting schema structure, non-truncation of Ayat Kursi, presence of 3 Quls, valid repetition targets, and dual-language localization. Total test suite expanded to 56/56 passing tests (100% pass rate).
- **Production Compilation (`npm run build`):** Vite production bundle compiled cleanly with 0 errors across 25 modules.

## [tasbihku-v1.9.0] - 2026-09-25

- **Highlight:** Eyes-Free Zen Counter Mode, Autonomous Multi-Pitch Audio Synthesis, Direct Habit-to-Dzikir Launcher, and Istiqamah 1-Day Streak Grace Recovery.

### Specific UI & Component Changes
- **Full-Screen Zen Mode Overlay (`#zen-counter-overlay`):** Implemented an immersive, true `#000000` pitch-black OLED full-screen tap-anywhere hit surface with responsive monospace typography (`clamp(5rem, 25vw, 12rem)`), soft glowing numbers, subtle guidance hint, and long-press / escape dismiss handlers.
- **Accidental Tap Decrement (`-1`):** Added a 1-tap decrement action on both the main dashboard control bar (`#dashboard-decrement-btn`) and inside the Zen mode overlay, providing instant error correction for accidental taps without resetting counts.
- **Habit Card Quick Launcher (`.habit-launch-dzikir-btn`):** Added direct `[📿 Mulai Dzikir]` pill buttons to habit cards linked with `linkedDzikirId`, allowing users to jump directly into the relevant guided azkar (Pagi, Petang, Wirid) or custom reading.
- **Keyboard Shortcuts:** Expanded global `keydown` orchestrator with `-` and `ArrowDown` for decrements and `Escape` for closing Zen mode.

### Core Logic & Audio/Haptic Workflows
- **Autonomous Web Audio Oscillator Synthesizer:** Integrated zero-asset oscillator audio fallback (`playSynthesizedTone`) with exponential gain ramp to guarantee 100% offline audio feedback even when external sound assets fail to fetch.
- **Multi-Pitch Milestone Audio Feedback:** Synthesized distinct acoustic pitches: standard tap (520Hz sine), milestone sub-targets at 33/66/99/100 (880Hz triangle), and four-note ascending arpeggio fanfare (C5, E5, G5, C6) upon reaching target goals.
- **Calibrated Milestone Haptics:** Orchestrated tactile rhythm with standard pulse (`15ms`), sub-target cadence (`[40, 50, 40]ms`), target celebration burst (`[80, 50, 80, 50, 150]ms`), and decrement acknowledgement (`25ms`).
- **SSR / Node Document Guard:** Fortified counter logic with `typeof document !== 'undefined'` checks to ensure deterministic execution across both browser and headless test environments.

### Dzikir & Habits Engine
- **Istiqamah 1-Day Streak Grace Algorithm:** Upgraded `calculateStreak()` to support single-day skip recovery when `state.istiqamahGrace` is enabled, eliminating streak anxiety while maintaining integrity by strictly resetting on 2+ consecutive inactive days.
- **State Store Persistence & Migration:** Introduced `istiqamahGrace: true` in `DEFAULT_STATE` and `loadState()` migrations within `src/core/store.js`.
- **Localization (i18n):** Added bilingual dictionary entries in Indonesian and English for `btn_decrement`, `btn_zen_mode`, `zen_mode_title`, `zen_tap_hint`, and `btn_launch_dzikir`.

### Test & Verification
- **Unit Test Suite (`npm test`):** 44 unit tests passing cleanly across `tests/unit/i18n.test.js` and `tests/unit/habits.test.js` with 100% pass rate.
- **Production Compilation (`npm run build`):** Validated clean bundle compilation under Vite 5 and Rollup with zero asset errors across both physical canonical and Windows NTFS junction working directories (`root: fs.realpathSync(process.cwd())`).

## [tasbihku-v1.8.4] - 2026-09-08

- **Highlight:** Material 3 Expressive UI/UX Refactor — Comprehensive audit synthesis resolving accessibility focus indicators, 48px mobile touch targets, design token consolidation, and expressive spring dynamics.

### Specific UI & Component Changes
- **Accessibility & Focus Indicators:** Implemented high-contrast `:focus-visible` styling (`3px solid var(--md-sys-color-primary)` with `2px` offset) across all interactive elements (`button`, `.btn`, `.mode-btn`, `.segment-btn`, `input`, `select`, `textarea`, `a`).
- **Motion Accessibility:** Added `@media (prefers-reduced-motion: reduce)` fallbacks disabling CSS keyframe animations, setting immediate transitions (`0.01ms`), and resetting dynamic transforms across pages, modals, cards, and buttons.
- **Touch Ergonomics:** Expanded calendar month navigation buttons (`navigateCalendarMonth`) from `32x32px` to a touch-safe `48x48px` bounding area (`.calendar-nav-btn`) with flex centering, and enlarged habit detail action buttons to `48x48px`.
- **Token Consolidation & OLED Contrast:** Replaced hardcoded inline `background: rgba(...)` styles across modal inputs, selects, textareas, habit settings, and stats cards with semantic M3 tokens (`--md-sys-color-surface-container`, `--md-sys-color-outline-variant`, and `.m3-card-tile`), eliminating visual extinction on `#000000` OLED displays.
- **Nested Radii Coherence:** Standardized modal child containers and input fields to `--shape-corner-md` (`16px`) inside `--shape-corner-xl` (`28px`) modals to satisfy the nested radius hierarchy law.
- **Visual Coherence & Emojis:** Purged residual emojis (`☀️`, `🌙`, `📿`) from wirid titles, reminders, and routine dropdowns in `index.html` and `src/core/i18n.js` (Indonesian & English), standardizing on semantic typography and theme-aware SVG icons.
- **Safe Area Insets:** Enhanced modal dialog padding with `padding-bottom: max(24px, env(safe-area-inset-bottom))` for modern edge-to-edge mobile devices.

### Core Logic & Audio/Haptic Workflows
- **Expressive Dynamics & Spring Rebound:** Added M3 Expressive overshoot rebound (`var(--md-sys-motion-easing-spring-enter)`) to `.btn` release transitions and calibrated active press states to `scale(0.95)`.
- **Timer & Stopwatch Status Cue:** Added `.timer-running` pulse animation (`@keyframes m3-timer-pulse`) with automatic state toggling in `src/modules/tasbih.js` (`updateTimerUI` and `updateStopwatchUI`) providing subtle visual feedback during active sessions.

### Dzikir & Habits Engine
- **Localization Updates:** Normalized translation dictionary keys in `src/core/i18n.js` for wirid sessions (`dzikir_pagi_title`, `dzikir_petang_title`, `dzikir_wirid_title`, `reminder_pagi_title`, `reminder_petang_title`, `habit_sesi_*`, and `routine_*`) to cleanly decouple text from icon graphics.
- **Habit Modal Form Styling:** Standardized habit creation/edit modal inputs, anchor date pickers, interval inputs, and monthly calendar wrappers to semantic tokens and coordinated focus rings.

### Test & Verification
- **Unit Test Suite:** Verified 41/41 passing tests across `tests/unit/i18n.test.js` and `tests/unit/habits.test.js` via `npm test` (`vitest`).
- **Production Build:** Verified clean bundle generation via `npm run build` (`vite build`) with 0 errors.


## [tasbihku-v1.8.3] - 2026-09-08

- **Highlight:** Automated Versioning Engine & In-App Release Broadcast Review Gate — Upgraded version management architecture to synchronize version updates across all core targets and enforce draft review before release notifications.

### Specific UI & Component Changes
- **Directives:** In-App Broadcast Review Gate — Integrated Section 3.1 in `AGENTS.md` requiring automated generation and manual approval of release announcements before staging into `toast.js` or the About modal.
- **Directives:** Enriched pre-completion checklist requiring verification of broadcast copy, test suites, and clean production builds.

### Core Logic & Audio/Haptic Workflows
- **Automation:** Pre-flight Verification — Added atomic pre-flight checks in `scripts/bump-version.js` verifying target existence and regex patterns in `package.json`, `src/ui/router.js` (`APP_VERSION`), and `public/sw.js` (`CACHE_NAME`) before mutating disk.
- **Automation:** Dry-Run Simulation — Added `--dry-run` (`-d`) CLI flag to preview version increments, target diffs, and broadcast drafts without modifying files.

### Dzikir & Habits Engine
- **Changelog Engine:** Keep-a-Changelog Domain Scaffolding — Updated version bumper to automatically scaffold standardized sections (`UI & Components`, `Core & Audio/Haptic`, `Dzikir & Habits Engine`, `Test & Verification`).

### Test & Verification
- Unit test suite (`npm test`): 100% pass across all unit tests in `tests/unit/`.
- Production compilation (`npm run build`): verified clean bundle generation with 0 errors.


## [tasbihku-v1.8.2] - 2026-09-08

- **Automation:** Centralized Version Bumper — Implemented `scripts/bump-version.js` to automatically synchronize version changes across `package.json`, `src/ui/router.js` (`APP_VERSION`), `public/sw.js` (`CACHE_NAME`), and `CHANGELOG.md`.
- **Tooling:** NPM Workflow Integration — Added `"version:bump": "node scripts/bump-version.js"` to `package.json` supporting `patch`, `minor`, `major`, or explicit version string arguments.
- **Directives:** Agent Versioning Standard — Enriched `AGENTS.md` with mandatory version bumping rules, Keep-a-Changelog guidelines, and pre-completion checklists adapted from the PresensiKu repository standard.
- **Tech:** Verified 100% pass rate on unit test suites (`tests/unit/`) and production build compilation (`vite build`).

## 1.8.1 — tasbihku-v1.8.1

- **Fix (Player):** Hadith Citation Localization — Fixed an issue where `#player-reference` rendered `[object Object]` when citations were stored as localized `{ id, en }` objects (e.g., `HR. Al-Hakim 1/562, disahihkan oleh Al-Albani`, `HR. Muslim no. 2723`). Integrated universal `getLocalizedText(val, lang)` helper to seamlessly extract language-appropriate strings.
- **Fix (Editor):** Reference Input Binding — Resolved `[object Object]` display inside custom dzikir and guided session editor inputs by normalizing reference values to human-readable strings.
- **Fix (Library):** Preset Title Rendering & Search Stability — Resolved `[object Object]` titles in the Azkar library modal (`showLibraryModal`) and fixed a fatal `TypeError` during query filtering in `filterLibrary` by extracting localized names before comparison.
- **i18n:** Dynamic In-Session Language Updates — Extended `languageChanged` event listener in `src/main.js` to trigger `updatePlayerUI()`, allowing the active dzikir player to update translation and reference text immediately when switching between Indonesian and English.
- **Tech:** Centralized app version bump (`v1.8.1`) across `package.json`, `src/ui/router.js`, and updated service worker cache name (`tasbihku-v1.8.1`).

## 1.8.0 — tasbihku-v1.8.0

- **UX/UI:** CSS Container Queries Architecture — Refactored all application layout overlays, full-screen modals, sidebars, and habit/dzikir detail cards from legacy viewport media queries (`@media`) to modern CSS Container Queries (`@container`).
- **UX/UI:** Responsive Sub-components — Sub-components now adapt seamlessly based on their parent container's width, enabling fluid layout transitions for cards, grids, and modal elements regardless of browser window size.
- **UX/UI:** Centered Desktop Layouts — Adjusted habit-detail overlay to perfectly align center vertically in high resolution and desktop viewports, removing legacy bottom-alignment.
- **Tech:** Established robust backwards compatibility via `@supports not (container-type: inline-size)` graceful degradation fallback rules.
- **Tech:** Centralized app version bump (`v1.8.0`) and updated service worker cache registration.

## 1.7.9 — tasbihku-v1.7.9

- **i18n:** About Page Audit & Translation Integration — Full internationalization (i18n) audit of `#page-about`, tagging all hero text, badges, CTA actions, PWA/offline chips, main features list, feature cards, and footer info with `data-i18n` and `data-i18n-html`.
- **i18n:** HTML Content Translation Engine Support — Enhanced `applyTranslations()` in `src/core/i18n.js` to process `data-i18n-html` elements via `innerHTML = t(key)` to cleanly render HTML formatting (e.g. `<span>` tag styling and `&bull;` entity decoding) without escaping.
- **UX/UI:** Clean Standalone About Header — Removed top-bar back button from `#page-about` and center-aligned the page title and section header label for a balanced standalone layout.
- **Tech:** Centralized app version bump (`v1.7.9`) and updated service worker cache registration.


## 1.7.8 — tasbihku-v1.7.8

- **UX/UI:** Material 3 Expressive Multi-Perspective Audit & Refactor — Conducted rigorous UI/UX evaluation across Android Jetpack Compose M3 Expressive specs, Nielsen Usability Heuristics, and Visual Craft design tokens.
- **UX/UI:** Expressive Micro-Animations — Integrated a physics-based spring scale pop animation (`.expressive-pop`) on counter target count achievements.
- **UX/UI:** Material 3 Snackbar / Toast Notification System — Built `src/ui/toast.js` delivering lightweight, accessible toast notifications with action callbacks.
- **UX/UI:** User Freedom & Undo Recovery — Integrated action undo toasts for destructive counter resets, habit deletions, and custom azkar deletions.
- **UX/UI:** Expressive Geometry Math — Applied nested shape math (`inner = outer - padding`) across modal elements and container cards to eliminate visual bulge.
- **Tech:** Verified 100% pass rate across unit test suite (Vitest) and end-to-end browser tests (Playwright).
- **Tech:** Centralized app version bump (`v1.7.8`).


## 1.7.7 — tasbihku-v1.7.7

- **New:** Full Internationalization (i18n) Support — The entire application is now fully translatable. Users can seamlessly switch between Indonesian (id) and English (en) from the settings page.
- **New:** Custom Dzikir Translations — Users can now enter translations for custom azkar in both English and Indonesian inside the custom azkar editor. The active translation is displayed intelligently based on the app's global language setting.
- **UX/UI:** Replaced all hardcoded calendar arrays with the native `Date.prototype.toLocaleDateString()`, ensuring perfectly localized month and day labels across the habits UI.
- **Fix:** Fixed a `ReferenceError` exception in the habits calendar rendering logic that previously prevented the habit detail modal from opening on click.
- **Tech:** Centralized app version bump (`v1.7.7`) and updated service worker cache bundle registration.

## 1.7.6 — tasbihku-v1.7.6

- **UX/UI:** Conducted a design audit for Material 3 Expressive compliance.
- **UX/UI:** Replaced all preset quick-template button emojis with crisp, styleable inline SVG icons.
- **UX/UI:** Extracted inline styling attributes on preset elements to class definitions in `style.css`.
- **UX/UI:** Upgraded bottom sheet and detail modal overlays to use spring-standard and spring-enter motion easing curves with overshoot bounce.
- **Tech:** Fixed focus ring CSS syntax errors and removed a 170+ line duplicate block in `style.css` to clean up codebase footprint.
- **Tech:** Updated Playwright test selectors and verified 100% success on the full E2E and unit test suites.
- **Tech:** Centralized app version bump (`v1.7.6`).

## 1.7.5 — tasbihku-v1.7.5

- **UX/UI:** Reimplemented page transitions to use overlapping absolute layouts, enabling concurrent exit/entry animations with smooth scaling and opacity fades in strict compliance with Material 3 Expressive motion guidelines.
- **UX/UI:** Refactored all custom dialog and detail overlays (confirmation dialog, timer input, habit details, habit log, custom azkar, and library modals) to use visibility-based transitions instead of instant style display switches.
- **UX/UI:** Standardized modal zoom animations to utilize a springy overshoot ease curve on opening and a clean standard deceleration curve on close.
- **Tech:** Wrapped all global `window` and `history` assignments in checks for `typeof window !== 'undefined'` to resolve unit testing environment failures.
- **Tech:** Centralized app version bump (`v1.7.5`) and updated service worker cache bundle registration.

## 1.7.4 — tasbihku-v1.7.4

- **UX:** Fixed an issue where swiping back on mobile while viewing habit details would exit the app instead of closing the detail view. The detail view is now deeply integrated with the browser History API (`pushState`) for natural native-like back navigation.
- **UX:** Refactored the habit detail layout to behave visually as a full-screen standalone page on mobile devices (removing top border radiuses and drag handles) while preserving the original centered modal overlay appearance on desktop.
- **Tech:** Centralized app version bump (`v1.7.4`) and updated service worker cache bundle registration.

## 1.7.3 — tasbihku-v1.7.3

- **UX/UI:** Standardized select dropdown inputs to inherit the Material 3 filled text field pattern, replacing inconsistent hardcoded styles.
- **UX/UI:** Standardized spacing, border colors, and border-radius dimensions of routine sections to strictly map to M3 Design tokens.
- **UX/UI:** Connected routine section headers into the unified M3 State Layer overlay system for premium interactive hover and click feedback.
- **Tech:** Centralized app version bump (`v1.7.3`) and updated service worker cache bundle registration.

## 1.7.2 — tasbihku-v1.7.2

- **New:** Habit-Dzikir Stacking (Staking) — Added options in the habit modal to link habits to specific Azkars (library or custom) or entire guided sessions (Morning, Evening, Wirid). Hitting the target count in the player automatically completes the linked habit.
- **New:** Collapsible Routine Sections — Habits are now grouped visually by time of day (Pagi, Siang, Sore, Malam, Anytime) under collapsible, status-tracking headers. Sort order is persisted dynamically.
- **New:** High-Performance Caching — Replaced heavy real-time date traversal calculations for habit stats (streaks, strength scores) with real-time cached properties, accelerating UI rendering.
- **Fix:** Prevented viewport overflow clipping by adding scrollable bounds to the dialog boxes (`max-height: 85vh; overflow-y: auto;`), ensuring modal action buttons remain accessible on all mobile viewport heights.
- **Tech:** Centralized app version bump (`v1.7.2`) and updated service worker cache bundle registration.

## 1.7.1 — tasbihku-v1.7.1

- **Fix:** Fixed an issue where the PWA mobile back gesture resulted in an unnatural loop because internal back buttons were pushing state instead of popping it.
- **Tech:** Centralized app version bump (`v1.7.1`) and updated service worker cache bundle registration.

## 1.7.0 — tasbihku-v1.7.0

- **New:** Sub-target / Interval Haptic Vibration Alerts — Set haptic intervals (Off, 33, 99, 100) in settings to get distinct double-vibrations at milestones when counting without looking.
- **New:** Preset Library Search — Added a search bar in the pre-built Azkar Library modal to quickly filter default and custom dzikir presets in real time.
- **Tech:** Centralized app version bump (`v1.7.0`) and updated service worker cache bundle registration.

## Older Versions
Older history has been archived to [docs/archive/changelog_archive.md](docs/archive/changelog_archive.md).
