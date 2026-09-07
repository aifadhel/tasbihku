# TasbihKu WebApp — Changelog

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
