# TasbihKu WebApp — Changelog

All notable changes to the TasbihKu project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [tasbihku-v1.13.0] - 2026-10-02

- **Highlight:** Added a comprehensive Open Source Licenses & Attributions section to both `README.md` and the in-app About page (`tasbihku.web.app/about` / `#page-about`), honoring all open-source libraries, typefaces, iconography, design systems, soundpacks, and sacred text sources used in the project with Material 3 responsive styling and complete bilingual (ID/EN) internationalization.

### Specific UI & Component Changes
- **About Page Open Source Section (`index.html`):** Injected `.about-licenses-section` and `.about-licenses-container` into `#page-about` featuring dedicated cards for `idb-keyval`, Google Sans Flex & Code, Amiri & Amiri Quran, Material Design 3, Google Material Symbols, Lucide Icons, GitHub Octicons, Mechvibes Soundpack, and Vite/Vitest/Playwright tooling.
- **M3 License Badges & Responsive Grid (`style.css`):** Declared CSS rules for `.about-licenses-container` (auto-fit responsive grid with 280px minimum column width), `.about-license-item` tonal cards with M3 surface elevation and hover states, and semantic license badge chips (`.badge-apache`, `.badge-ofl`, `.badge-mit`, `.badge-isc`, `.badge-cc`, `.badge-heritage`) with distinct color themes.
- **Documentation Overhaul (`README.md`):** Restructured and expanded the license and acknowledgments section into a comprehensive, multi-table breakdown categorizing runtime dependencies, typography & fonts, design system & iconography, audio assets, developer & testing tooling, and sacred Hadith sources.

### Core Logic & Audio/Haptic Workflows
- **PWA Cache Invalidation (`public/sw.js`):** Bumped cache name to `tasbihku-v1.13.0` to force Service Worker invalidation on client browsers and installed PWAs.
- Preserved core counter state, audio synthesis, and haptic vibration engine invariants with zero regressions.

### Dzikir & Habits Engine
- **i18n Translation Dictionary Expansion (`src/core/i18n.js`):** Added 20 new localization keys across Indonesian and English dictionaries (`about_licenses_title`, `about_licenses_subtitle`, `about_license_category_*`, `about_license_*_desc`), ensuring seamless language switching without raw English or Indonesian fallback leakage.

### Test & Verification
- **Unit Test Suite (`tests/unit/i18n.test.js` & `tests/unit/router.test.js`):** Expanded Vitest unit tests to assert presence and accurate bilingual translation of new license keys in both ID and EN, and added structural assertions for `#about-licenses-container` DOM elements and M3 CSS badge classes. 83/83 unit tests passing (100%).
- **Production Compilation (`npm run build`):** Clean Vite production build with 25 modules transformed, 0 bundle warnings, and 0 errors.

## [tasbihku-v1.12.5] - 2026-10-01

- **Highlight:** Resolved client-side PWA stale service worker cache artifact where historical cached HTML shells continued to render `#quote-card` with fallback translation keys (`quote_default`, `quote_source`). Implemented defensive startup DOM purging in `src/main.js` and bumped cache name to `tasbihku-v1.12.5`.

### Specific UI & Component Changes
- **Defensive Startup DOM Excision (`src/main.js`):** Added synchronous DOM query and removal targeting `#quote-card` and `.quote-toggle-wrapper` directly on `DOMContentLoaded` prior to `applyTranslations()` execution. Ensures that even when a mobile/desktop browser or installed PWA serves a stale cached HTML shell from prior offline storage, the quote card is completely stripped from the visual DOM before any text interpolation occurs.

### Core Logic & Audio/Haptic Workflows
- **PWA Cache Invalidation (`public/sw.js`):** Incremented cache name to `tasbihku-v1.12.5` to trigger browser Service Worker `updatefound` lifecycle events, purge legacy caches (`caches.delete(cacheName)`), and claim active clients immediately (`self.clients.claim()`).

### Dzikir & Habits Engine
- Preserved all habit tracking, azkar sequences, and timer/stopwatch state invariants with zero regressions.

### Test & Verification
- **Unit Test Suite (`tests/unit/router.test.js`):** Added regression assertion validating defensive DOM cleanup existence in `src/main.js`. 81/81 unit tests passing (100%).
- **Production Compilation (`npm run build`):** Clean Vite production build with 25 modules transformed and 0 errors.

## [tasbihku-v1.12.4] - 2026-10-01

- **Highlight:** Completely excised the `#quote-card` component and all associated architecture from the dashboard across frontend and data layers. Streamlines viewport ergonomics and removes visual distraction beneath `.fab-action-dock`, while purging orphaned SVG symbols, M3 state layer styling, router methods, reactive store state, persistence hydration fallbacks, and localization keys.

### Specific UI & Component Changes
- **Excised Quote Card Container (`index.html`):** Removed `#quote-card`, `#quote-content`, `#quote-collapsed-msg`, and inline `toggleQuote()` trigger from `#tasbih-dashboard-view`, letting the central counting area expand and vertically center the primary display without bottom obstruction.
- **Excised Orphaned SVG Sprite (`index.html`):** Purged `<g id="icon-9">` (sparkle icon) from SVG definition pool, which was exclusively utilized for the collapsed quote state.
- **Excised Card & State Layer CSS (`style.css`):** Removed `.quote-toggle-wrapper`, `.quote-card-m3`, `.quote-box`, and `.quote-toggle-wrapper.collapsed` class definitions (~50 lines).
- **Pruned M3 State Layer Selectors (`style.css`):** Excised `.quote-toggle-wrapper` selectors from standard state layer (`::before`), hover (`:hover::before`), active (`:active::before`), and active scale transform (`:active`) rules without breaking trailing commas.

### Core Logic & Audio/Haptic Workflows
- **Purged Router Methods (`src/ui/router.js`):** Removed `toggleQuote()` and `applyQuoteState()` exports and excised `window.toggleQuote` global binding.
- **Cleaned Main Entry Point (`src/main.js`):** Excised `toggleQuote` and `applyQuoteState` imports, purged `window.toggleQuote` assignment, and removed `applyQuoteState()` from the `initApp()` application boot sequence.
- **Active State Hydration Purge (`src/core/store.js`):** Excised `quoteCollapsed: false` from `DEFAULT_STATE`. Replaced legacy fallback assignment with an explicit active deletion guard (`if (typeof rawState.quoteCollapsed !== 'undefined') delete rawState.quoteCollapsed;`), ensuring stored IndexedDB and localStorage states from prior sessions are automatically sanitized on load.

### Dzikir & Habits Engine
- **Purged Localization Keys (`src/core/i18n.js`):** Removed `quote_default`, `quote_source`, and `pearl_of_wisdom` from both Indonesian (`id`) and English (`en`) dictionaries.
- **PWA Service Worker Update (`public/sw.js`):** Automated cache name bump to `tasbihku-v1.12.4` ensuring clean offline cache invalidation and client claiming.

### Test & Verification
- **Unit Test Suite (`tests/unit/router.test.js`):** Added 5 dedicated regression assertions verifying negative presence of `#quote-card`, `#icon-9`, `.quote-toggle-wrapper`, `toggleQuote`, `applyQuoteState`, `state.quoteCollapsed`, and localization keys. 80/80 tests passing (100%).
- **Production Compilation (`npm run build`):** Clean Vite build with 25 modules transformed, 0 errors, achieving net asset reductions across HTML (-0.29 kB gzip), CSS (-0.20 kB gzip), and JS (-0.22 kB gzip).

## [tasbihku-v1.12.3] - 2026-09-30

- **Highlight:** Resolved the dashboard reset capability defect by introducing an ergonomic, mode-aware Material 3 Tonal Reset Button (`#dashboard-reset-btn`) within a symmetrical `.fab-action-dock` flanking the primary Large FAB. Restores full, intuitive stop/reset operational control to Counting, Stopwatch, and Timer modes with safety modal confirmations for tasbih counting, instant haptic resets for paused timekeeping, dynamic state synchronization, and a global desktop keyboard shortcut (`KeyR`).

### Specific UI & Component Changes
- **Symmetric Controls Deck (`index.html`, `style.css`):** Replaced standalone `.fab-container` with `.fab-action-dock` (`max-width: 320px`, centered flex layout with 16px gap), flanking the 152px Large FAB (`#dashboard-main-btn`) with a 48dp secondary M3 Tonal Reset Button (`#dashboard-reset-btn`) on the left and an invisible 48dp optical balance anchor (`.fab-dock-balance-anchor`) on the right, ensuring the primary TAP button remains mathematically and optically 100% centered across all mobile viewport widths (down to 320px).
- **M3 Tonal Button Tokens (`style.css`):** Styled `.btn-reset-tonal` with 48dp circular geometry (`border-radius: var(--shape-corner-full)`), `--md-sys-color-secondary-container` background, `--md-sys-color-on-secondary-container` icon fill, 1px outline-variant border, Level 1 elevation shadow, and spring active press scaling (`transform: scale(0.92)`).
- **Declarative Disabled States (`style.css`):** Declared `.btn-reset-tonal.is-disabled` and `:disabled` rules (`opacity: 0.35`, `pointer-events: none`, grayscale filter, muted border), preventing layout shifts during zero/idle states.

### Core Logic & Audio/Haptic Workflows
- **Restored Free Counter Reset (`src/modules/tasbih.js`):** Implemented and exported `resetFree()` with `modal_reset_free_title` confirmation dialog, safe count zeroing, reactive UI synchronization, and 25ms tactile haptic feedback (`vibrate(25)`).
- **Stopwatch & Timer Reset Enhancements (`src/modules/tasbih.js`):** Connected `resetStopwatch()` and `resetTimer()` to the unified reset trigger with 20ms tactile haptic feedback (`vibrate(20)`), interval termination, elapsed/target duration clearing, setup area restoration, and immediate disabled state updating.
- **Unified Action Dispatcher & Keyboard Harness (`src/main.js`):** Implemented `handleDashboardReset()`, bound global window APIs (`window.handleDashboardReset`, `window.resetFree`, `window.resetStopwatch`, `window.resetTimer`), and wired desktop `KeyR` keyboard event listener with `.modal.active` and input-focus guards to suppress background triggers during open dialogs.
- **Dynamic Mode Reactivity (`src/ui/router.js`):** Implemented `updateResetButtonState()`, synchronizing disabled states and contextual WAI-ARIA labels (`aria-label` / `title`) across Counting (`freeCount > 0`), Stopwatch (`elapsedTime > 0` or `running`), and Timer (`targetDuration !== null` or `remainingTime !== null` or `running`). Hooked into `switchDashboardMode()`, `updateStopwatchUI()`, `updateTimerUI()`, and reactive store subscriptions (`subscribe('freeCount')`).

### Dzikir & Habits Engine
- **Protection Against Accidental Reset:** Retained dual-layer protection for dhikr recitations where resetting count requires intentional confirmation via `modal_reset_free_title`, preventing accidental destruction of dhikr counts during high-cadence tapping.
- **Bilingual i18n Verification:** Re-verified complete Indonesian and English localization strings (`modal_reset_free_title`, `modal_reset_stopwatch_title`, `modal_reset_timer_title`, `btn_reset`).

### Test & Verification
- **Automated Unit Tests (`npm test`):** 75/75 unit tests passing (100% pass rate) across 4 test suites (`tests/unit/router.test.js`, `tests/unit/habits.test.js`, `tests/unit/dzikir.test.js`, `tests/unit/i18n.test.js`), including 6 new tests asserting reset button DOM structure, M3 styling rules, state synchronization, and keyboard handling.
- **Production Compilation (`npm run build`):** Clean Vite bundle compilation in 345ms with 0 errors or warnings (25 modules transformed).

## [tasbihku-v1.12.2] - 2026-09-30

- **Highlight:** Transform `page-player` from a monolithic scroll container into an ergonomic Three-Tier Docked Viewport Architecture. Fixes the long-dhikr recitation paradox by isolating reading recitations into an independently scrollable sanctuary (`#player-scroll-viewport`) and pinning repetition controls into an elevated, thumb-zone docked action console (`#player-bottom-bar`). Relocates the repetition progress track to the bottom console lip for unified visual feedback, enforces automated scroll reset upon reading advance, injects a 60ms hardware tap debounce guard, and expands automated regression test coverage.

### Specific UI & Component Changes
- **Docked Viewport Layout (`index.html`, `style.css`):** Overhauled `#page-player` from global column scrolling into a fixed-viewport container (`overflow: hidden; height: 100%; display: flex; flex-direction: column;`).
- **Independent Reading Sanctuary (`#player-scroll-viewport`):** Extracted Arabic calligraphy (`#player-arabic`), Latin transliteration (`#player-latin`), translation (`#player-translation`), and Hadith reference (`#player-reference`) into a dedicated scrollable card with `-webkit-overflow-scrolling: touch; overscroll-behavior-y: contain;` and `calc(110px + env(safe-area-inset-bottom))` bottom clearance to guarantee zero text occlusion behind docked controls.
- **Docked Repetition Action Console (`#player-bottom-bar`):** Created a fixed, elevated M3 Surface Container console (`--md-sys-color-surface-container`) with glassmorphism blur (`backdrop-filter: blur(16px)`), Level 2 elevation shadow, and safe-area padding (`padding-bottom: max(12px, env(safe-area-inset-bottom))`).
- **Unified Progress Bar Lip (`#player-progress`):** Relocated the repetition progress track directly onto the upper edge of `#player-bottom-bar`, bridging the numeric counter, target indicator, and TAP button into a unified "Repetition Cockpit" directly adjacent to the thumb.
- **Ergonomic Controls Deck (`.player-controls-deck`):** Arranged the Undo button (`#player-undo-btn`, 48px round button with M3 outline), Counter & Target badge (`#player-counter` in 1.85rem tabular numbers with `#player-target-display`), and Main Tap Button (`#player-main-btn`, wide pill squircle with 56px height, level 3 elevation, and spring press feedback) horizontally across the natural thumb arc for left- and right-handed worshippers.
- **Accessibility & Reduced Motion:** Added full reduced-motion overrides for `.player-deck-tap-btn`, `.player-deck-btn-undo`, and `.player-scroll-viewport` under `@media (prefers-reduced-motion: reduce)`.

### Core Logic & Audio/Haptic Workflows
- **Automated Scroll Reset on Page Advance (`src/modules/dzikir.js`):** In `updatePlayerUI()`, introduced automatic `scrollViewport.scrollTop = 0` whenever `state.playerIndex` changes, eliminating the scroll position bleed defect where the next reading started scrolled halfway down.
- **Hardware Tap Debounce Guard (`src/modules/dzikir.js`):** Injected a 60ms timestamp guard (`Date.now() - lastPlayerTapTime < 60`) into `incrementPlayer()`, preventing hardware double-triggering or ghost counts from rapid physical tapping or simultaneous touchstart/click event dispatching.
- **Full Gesture & Keyboard Invariance (`src/main.js`):** Preserved double-tap counting, 800ms long-press menu return, horizontal swipe-to-undo (`handleSwipeGesture`), and keyboard triggers (`Space`, `Enter`, `Ctrl+Z`) binding seamlessly to `#player-main-btn` and `#player-undo-btn`.

### Dzikir & Habits Engine
- **Preserved Authentic Narrations:** 100% data integrity preserved across `dzikirPagi`, `dzikirPetang`, `wiridReadings`, and custom user azkar sets.
- **Silent Micro-Habit Tracking:** Maintained `checkAndTriggerLinkedHabit()` micro-habit completion triggers upon reaching target counts without distracting toasts.

### Test & Verification
- **Automated Regression Suite (`tests/unit/router.test.js`):** Expanded Vitest unit tests with 5 comprehensive assertions verifying presence of `#player-scroll-viewport` and `#player-bottom-bar`, correct element nesting, CSS layout rules, and presence of tap debounce & scroll reset guards.
- **Vitest Run (`npm test`):** 69/69 unit tests passing (100%) across 4 test suites with 0 regressions.
- **Production Compilation (`npm run build`):** Clean Vite bundle compilation with 25 modules transformed in 350ms, generating optimized gzip-compressed distribution assets.

## [tasbihku-v1.12.1] - 2026-09-30

- **Highlight:** Complete excision of "Privacy Mode" (Stealth Mode) and "Full Screen" buttons from `page-player`. Achieves bilateral 1:1 visual symmetry in the player top-bar, eliminates accidental recitation dimming and inconsistent web fullscreen prompts in favor of native PWA standalone display mode, purges dead SVG sprites, CSSOM rules, and global JavaScript window bindings, and expands automated regression test coverage.

### Specific UI & Component Changes
- **Player Top-Bar Excision (`index.html`):** Excised `<button onclick="toggleStealthMode()">` and `<button onclick="toggleFullscreen()">` from `#page-player .top-bar`, leaving only the navigation back button and restart button.
- **Top-Bar Bilateral 1:1 Symmetry:** Restored true geometric centering to `#player-title` (`flex-grow: 1; text-align: center;`). Previously, the 40px left button vs 120px right button cluster skewed the title leftward; the layout now has symmetrical 40px icon buttons flanking the title.
- **SVG Sprite Sheet Pruning (`index.html`):** Removed unused SVG symbol definitions `<g id="icon-16">` (privacy eye-slash) and `<g id="icon-17">` (expand corners), reducing initial critical path HTML payload.
- **CSSOM Streamlining (`style.css`):** Removed 14 lines of obsolete `.stealth-mode` styles (`.stealth-mode #player-text-container`, `.stealth-mode #player-counter`, `.stealth-mode #player-target-display`, `.stealth-mode #player-reading-info`, `.stealth-mode #player-reference`, `.stealth-mode .progress-fill`), saving ~0.24 kB in stylesheet size.

### Core Logic & Audio/Haptic Workflows
- **Global Scope De-Pollution (`src/main.js`):** Excised `window.toggleFullscreen` and `window.toggleStealthMode` function bindings. Eliminates inconsistent browser fullscreen permission popups and iOS Safari failure cases.
- **Defensive Startup DOM Cleanup (`src/main.js`):** Added `document.body.classList.remove('stealth-mode')` check during `DOMContentLoaded` initialization to sanitize any lingering body class on warm PWA reloads or cached DOM states.
- **Native PWA Standalone Invariance:** Relies cleanly on Web App Manifest `display: standalone` (`public/manifest.json`) for seamless, OS-level edge-to-edge recitation immersion without manual UI toggles.

### Dzikir & Habits Engine
- **Localization Dictionary Cleanup (`src/core/i18n.js`):** Removed unused ARIA translation keys `stealth_mode_aria` and `fullscreen_aria` across both Indonesian (`id`) and English (`en`) translation maps.
- **Recitation State Integrity:** Maintained 100% functionality of core recitation engine, auto-advance mechanics, undo history, calm celebration micro-animations, and habit tracking hooks.

### Test & Verification
- **Automated Regression Suite (`tests/unit/router.test.js`):** Added 4 unit test assertions validating:
  1. `global.window.toggleFullscreen` and `global.window.toggleStealthMode` are undefined.
  2. Deprecated i18n keys return fallback raw string without throwing.
  3. `index.html` contains 0 instances of `toggleStealthMode`, `toggleFullscreen`, `id="icon-16"`, or `id="icon-17"`.
  4. `style.css` contains 0 `.stealth-mode` selectors.
- **Vitest Verification:** 64/64 unit tests passing (100% pass rate across 4 test suites, Exit code 0).
- **Production Compilation:** Clean Vite build (`npm run build`) with 25 modules transformed and net asset reductions across HTML (-1.38 kB), CSS (-0.24 kB), and JS (-0.37 kB).

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
