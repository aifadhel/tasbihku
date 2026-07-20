# TasbihKu WebApp — Changelog

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

## 1.6.9 — tasbihku-v1.6.9

- **UX:** Audited and updated UI elements to strictly adhere to Material 3 Expressive guidelines.
- **UX:** Configured custom thin, rounded scrollbars styled with theme color tokens to match the dark emerald/sage aesthetic.
- **UX:** Added top-rounded corners (`var(--shape-corner-xl)`) and a drag/grab handle (`.bottom-sheet-drag-handle`) to the Habit Details bottom sheet on mobile devices for a native bottom sheet feel.
- **UX:** Upgraded modal dialog corner radius to `28px` (`var(--shape-corner-xl)`) for compliance with M3 dialog shapes.
- **UX:** Standardized accessible, high-definition focus indicators (`:focus-visible`) across all interactive components (buttons, input fields, selectors).
- **Tech:** Centralized app version bump (`v1.6.9`) and updated service worker cache bundle registration.

## 1.6.8 — tasbihku-v1.6.8

- **UX:** Standardized all custom inline typographic styling to map directly to M3 Expressive scale classes (`body-small`, `title-small`, `label-small`).
- **UX:** Standardized M3 compliant hover and active State Layers (`::before` opacity overlays) across all primary interactive surfaces (mode switchers, segmented controls, date bubbles, quote card).
- **UX:** Refactored toggle switches to use M3 spring overshoot easing (`var(--md-sys-motion-easing-spring-enter)`) and expanding knob morph animations.
- **UX:** Added springy hover and press scale transformations on cards, segmented buttons, chips, list items, and habit tiles.
- **Tech:** Centralized app version bump (`v1.6.8`) and updated service worker cache bundle registration.

## 1.6.7 — tasbihku-v1.6.7

- **UX:** Conducted Material 3 Expressive UI/UX audit.
- **UX:** Updated typography scale (`body-large`, `headline-large`, etc.) to map 1:1 with M3 Expressive roles.
- **UX:** Replaced static background hover states with strictly M3 compliant State Layers using opacity adjustments (`::before`).
- **UX:** Updated floating action button (`.fab-large`) corner radius to `48px` to achieve the true M3 squircle geometry.
- **Tech:** Centralized app version bump (`v1.6.7`) and updated service worker cache bundle registration.

## 1.6.6 — tasbihku-v1.6.6

- **Improved:** Dynamic Navigation Menu — The settings and navigation menu now intelligently adapts its content based on the active mode. Tasbih-specific settings (like mechanical sound, Arabic text size, and reminders) are automatically hidden when in Habit Mode for a cleaner experience.
- **Tech:** Centralized app version bump (`v1.6.6`) and updated service worker cache bundle registration.

## 1.6.5 — tasbihku-v1.6.5

- **UX:** Strictly aligned visual elements and typography to Material 3 Expressive guidelines.
- **UX:** Standardized input, textarea, card, select, and modal border radii to use M3 shape tokens (`var(--shape-corner-md)` / 16px).
- **UX:** Replaced rigid page and dialog animations with physics-inspired spring easing animations.
- **UX:** Added smooth springy tap pop animations on free counter and guided counter numbers.
- **UX:** Swapped primary non-Arabic font to **Google Sans Flex** paired with **Google Sans Code** for stopwatch/timer monospace displays.
- **Tech:** Configured Fontsource NPM compilation to bundle fonts locally to guarantee complete offline PWA availability.
- **Tech:** Centralized app version bump (`v1.6.5`) and updated service worker cache bundle registration.

## 1.6.4 — tasbihku-v1.6.4

- **New:** Custom Azkar Builder — create and save personal dhikr with Arabic, Latin, and target counts.
- **New:** Quantitative Target Limits — set and track specific targets (e.g. 33, 100) per dhikr session with vibration feedback.
- **Tech:** Centralized app version bump (`v1.6.4`) and updated service worker cache bundle registration.

## 1.6.3 — tasbihku-v1.6.3

- **New:** Immersive Fullscreen Mode for distraction-free sessions.
- **New:** Stealth / Privacy Mode that drops UI opacity to 0.05 while retaining full gesture support.
- **New:** Daily Auto-Reset Logic automatically resets the Hitungan Bebas counter on a new calendar day.
- **New:** Pre-built Azkar Library integrated into the Custom Dzikir Editor.
- **Tech:** Centralized app version bump (`v1.6.3`) and updated service worker cache bundle registration.

## 1.6.2 — tasbihku-v1.6.2

- **Tech:** Asynchronous state persistence (IndexedDB) via `idb-keyval` for large history-heavy objects, decoupling heavy writes from the main thread.
- **Improved:** Replaced DOM-heavy `div`-based heatmap with a highly performant and scalable GitHub-style SVG heatmap.
- **Fixed:** SVG Heatmap squishing bug caused by an outdated CSS grid class.
- **Tech:** Centralized app version bump (`v1.6.2`) and updated service worker cache bundle registration.

## 1.6.1 — tasbihku-v1.6.1

- **New:** Confetti Celebration — A lightweight, zero-dependency particle animation triggers when checking off a habit for the day.
- **New:** Habit Tags & Filtering — Users can categorize habits using comma-separated labels. A horizontally-scrollable filter chip list allows dynamically filtering active habits on the dashboard.
- **Tech:** Codebase Modularization — Refactored the monolithic `habits.js` into targeted modules (`habits-data`, `habits-ui`, `habits-chart`, `habits-export`) for significantly better maintainability.
- **Tech:** Centralized app version bump (`v1.6.1`) and updated service worker cache bundle registration.

## 1.6.0 — tasbihku-v1.6.0

- **New:** Drag and Drop Habit Reordering — Users can now freely reorder habits on the dashboard using drag-and-drop on desktop or touch on mobile.
- **New:** Habit Skipping — Habits can be explicitly "skipped" for the day, marked by a visual indicator (—). Skipping preserves streaks without counting as a failure or modifying the EMA score.
- **Improved:** Heatmap visualization uses faint borders to distinguish skipped days from missed days.
- **Improved:** CSV export now accurately labels "Dilewati" for skipped habit entries.
- **Tech:** Centralized app version bump (`v1.6.0`) and updated service worker cache bundle registration.

## 1.5.6 — tasbihku-v1.5.6

- **New:** Quantitative / Numerical Habit Targets — Added settings toggles for habits to track specific counts (e.g., "500 times") instead of only binary yes/no completions.
- **New:** Daily Log Notes — Double-tapping habit date bubbles opens a log dialog to enter custom values and daily notes.
- **New:** Interactive Log Detail Screen — Dynamic notes timeline displays under the monthly calendar grid, listing all log notes with corresponding values.
- **Improved:** Heatmap & Charts — Visualized partial completion states using low-opacity highlights (`.partial` and `.active-low` CSS states) and adjusted scores to compute fractional consistency weights.
- **Improved:** Export Habit History — Enhanced client-side CSV export to generate four-column outputs (`Tanggal,Status,Nilai,Catatan`).
- **Tech:** Centralized app version bump (`v1.5.6`) and updated service worker cache bundle registration.

## 1.5.5 — tasbihku-v1.5.5

- **New:** Timer PWA Notifications — Triggers an immediate local system-level PWA notification ("Waktu Selesai!") when the timer hits 00:00.
- **New:** Daily Dzikir Pagi & Petang Reminders — Added settings toggles and time inputs, allowing daily offline notifications for Dzikir Pagi and Dzikir Petang.
- **New:** Interval-Based Habit Scheduling — Added support for scheduling habits every X days (e.g. "Every 3 Days") starting from a specific anchor date.
- **New:** Local PWA Notification Reminders — Added local offline reminder scheduler with permission diagnostic dialog. Reminders trigger system-level notifications at the designated time and route user to the habit view when clicked.
- **New:** Client-Side CSV Data Export — Users can now export their individual habit completion history logs directly as a `.csv` file.
- **Improved:** Service Worker Click Navigation — Configured notification click events to direct users to specific page hashes (e.g. player views or dashboard pages) upon interaction.
- **Fixed:** Playwright E2E Test Suite timeouts resolved by migrating local test/dev server port to `3005` and disabling automatic browser spawning.

## 1.5.4 — tasbihku-v1.5.4

- **Improved:** Modal Cancellation Recovery — Added custom cancel callback support to the modal component. If the user cancels the confirmation to delete or archive a habit, the Edit Habit modal is automatically reopened.

## 1.5.3 — tasbihku-v1.5.3

- **Improved:** Edit Habit Modal Auto-Dismissal — Configured the Edit Habit modal to dismiss immediately when the "Delete" (Hapus) or "Archive" (Arsipkan) action is triggered, avoiding stacked overlapping modals during confirmation.

## 1.5.2 — tasbihku-v1.5.2

- **New:** Full-Screen Slide-Up / Desktop Dashboard Detail View — Redesigned the Habit Detail Modal into a sleek mobile-first full-screen slide-up sheet on mobile and a comfortable two-column dashboard on desktop. Fits all stats, calendar logs, and charts beautifully without scroll fatigue.
- **Improved:** Modal Sticky Header App Bar — Introduced a persistent header with a left-aligned Back arrow and a right-aligned Edit button, matching standard mobile native design.

## 1.5.1 — tasbihku-v1.5.1

- **Fixed:** Future Calendar Dates Hidden — Adjusted the Interactive Monthly Calendar Grid inside the Habit Detail Modal so that all dates after today are hidden, preventing future log edits while maintaining grid structure.

## 1.5.0 — tasbihku-v1.5.0

- **New:** Weekly Target Frequency Scheduler — Habits can now be configured for a target number of completions per week (e.g. 3x/week) instead of only specific days.
- **New:** Interactive Monthly Calendar Picker — Tapping dates in the new calendar picker grid inside the habit details modal allows users to backfill or toggle completions, instantly recalculating scores and streaks.
- **New:** Day-of-Week Distribution Chart — Displays a bar chart of completions grouped from Monday to Sunday to visualize which days are most productive.
- **Improved:** Adapt streaks and exponential consistency calculations to support weekly targets.
- **Tech:** Centralized app version bump (`v1.5.0`) and updated service worker cache.

## 1.4.2 — tasbihku-v1.4.2

- **New:** Frequency Bar Chart — 12-week SVG bar chart visualization in the habit detail modal, showing weekly completion counts with habit-colored bars and auto-scaled Y-axis.
- **New:** Score Trend Sparkline — 90-day DPI-aware Canvas sparkline showing the EMA consistency score trajectory over time, with an 80% safety net threshold line and current score label.
- **New:** Archive / Unarchive System — Soft-delete habits via the edit modal "Arsipkan" button. Archived habits appear in a collapsible "Diarsipkan" section at the bottom of the habit list, with restore and permanent delete actions.
- **Improved:** Chart Empty States — New habits (< 7 days old) display friendly placeholder messages instead of blank charts.
- **Tech:** Updated Service Worker cache and bumped versioning (`tasbihku-v1.4.2`).

## 1.4.1 — tasbihku-v1.4.1

- **Fixed:** Touch Responsiveness in Habit Cards — Resolved a ReferenceError (`today is not defined`) that caused clicking the habit details to crash and fail to open the detail modal.
- **Fixed:** Timezone-Safe Date Loops (DST Freezes) — Shifted the chronological calculation loops in both habit strength and streak calculation logic to use a noon (`12:00:00`) reference time instead of midnight (`00:00:00`), preventing infinite loop hangs in timezones with daylight saving shifts.
- **Tech:** Updated Service Worker cache and bumped versioning (`tasbihku-v1.4.1`).

## 1.4.0 — tasbihku-v1.4.0

- **New:** Loop Habit Tracker Integration — Added a dedicated Habit mode switchable via the top-bar controller.
- **Improved:** Standardized SVG Icons — Replaced specific editor and layout icons (such as page reordering buttons in the Dzikir editor and the empty list calendar placeholder) with high-fidelity vector SVGs.
- **Improved:** UI Emojis — Retained native emojis for main category indicators, streak badges, footer credits, and reset symbols for optimal visual styling based on feedback.
- **Tech:** Updated Service Worker cache and bumped versioning (`tasbihku-v1.4.0`).

## 1.3.8 — tasbihku-v1.3.8

- **Added:** Activity Heatmap — GitHub-style 90-day activity visualization on a new dedicated "Statistik & Riwayat" page
- **Added:** Arabic Font Size Slider — Global accessibility setting to scale Arabic text (1.5rem to 4.5rem) for better readability
- **Added:** Heartbeat Celebration — Subtle visual pulse animation triggered upon reaching target count
- **Added:** Statistics Summary — Real-time tracking of total active days and current session streak in the stats page
- **Improved:** Page navigation — Added dedicated entry point for Statistics in the main menu
- **Improved:** UI Transitions — Smoother page transitions and responsive scaling for large font sizes
- **Tech:** Centralized dynamic font size management via CSS variables and updated Service Worker cache (`tasbihku-v1.3.8`)

## 1.3.7 — tasbihku-v1.3.7

- **Improved:** Smart device capability detection for sound and haptic settings
- **Improved:** Vibration toggle is now automatically **hidden** on desktop browsers and devices where the Vibration API is not supported — no point showing a toggle that does nothing
- **Improved:** Vibration toggle now sends a **test pulse** (`[30, 50, 30]`) when enabled, so users can instantly verify haptic is working on their device
- **Improved:** Sound toggle now plays a **test chirp** immediately when enabled, letting users verify audio is working before using the counter
- **Improved:** When sound is enabled, a soft advisory hint appears: *"Tidak terdengar? Periksa volume & silent mode hp Anda."* — auto-dismisses after 5 seconds (since web apps cannot directly query device mute/silent state)
- **Improved:** If `AudioContext` is permanently blocked by the browser (autoplay policy / permission issue), the sound toggle is **automatically reverted** and an error hint is shown instead of silently failing
- **Improved:** Trying to re-enable sound after a permanent audio block now shows a modal with actionable guidance instead of silently doing nothing
- **Tech:** Added `soundSystemFailed` guard flag to prevent retrying audio init after a fatal failure
- **Tech:** Added `updateSoundToggleUI()`, `isVibrationSupported()`, `applyVibrationCapability()`, `showSoundHint()` utility functions
- **Note:** True detection of device silent/mute mode and vibration-off state is **not possible via any web API** (blocked by all browsers for privacy/security reasons). The above improvements are the best achievable UX workarounds for a PWA.

## 1.3.6 — tasbihku-v1.3.6

- **Added:** Mechanical tap sound effect with dedicated toggle ("Suara Tasbih") in settings
- **Added:** Gesture Control — Double tap on the main button to increment rapidly
- **Added:** Gesture Control — Long press (800ms) on the main button to open settings menu
- **Added:** Gesture Control — Horizontal swipe left/right to Undo actions (dashboard reset and player increment)
- **Added:** Dedicated haptic feedback toggle ("Getaran") in settings
- **Improved:** Stopwatch continuous haptic feedback frequency increased (now vibrates every 30 seconds instead of 1 minute)
- **Tech:** Updated Service Worker cache (`tasbihku-v1.3.6`) and added `sound.ogg`, `config.json` to offline caching list

## 1.3.5 — tasbihku-v1.3.5

- **Added:** Dashboard Mode Switcher (Counting, Stopwatch, Timer) with iOS-style segmented control
- **Added:** Stopwatch mode with pause and continuous haptic feedback (1 minute intervals)
- **Added:** Timer mode with presets, custom clickable timer duration input, and continuous haptic feedback
- **Improved:** Main TAP button dynamically adapts to START/PAUSE actions in timing modes
- **Improved:** Background running state safely cleared on refresh to prevent detached timer intervals

## 1.3.4 — tasbihku-v1.3.4

- **Fixed:** Hardware/gesture Back button behavior on Android/mobile devices — pressing "Back" now correctly returns to the previous screen instead of exiting the application entirely.

## 1.3.3 — tasbihku-v1.3.3

- **Fixed:** Race condition on rapid saveState() calls — now debounced with 300ms delay to prevent localStorage corruption
- **Fixed:** localStorage quota exceeded crash — graceful error handling with emergency activity log pruning (keeps last 50 entries)
- **Fixed:** Version string hardcoded in multiple places — now centralized to single APP_VERSION constant in app.js
- **Fixed:** Dynamic version display in footer — reads from APP_VERSION constant automatically
- **Improved:** Modal dismissal — now closes with Escape key or clicking outside modal box (backdrop)
- **Added:** Keyboard support for counters — Space or Enter to increment (works on dashboard and player pages)
- **Added:** Undo for free counter reset — press Ctrl+Z to restore last counter value before reset
- **Added:** `saveStateImmediate()` function for critical saves that need to bypass debounce
- **Added:** Textarea styling consistency — matches input field design with proper focus states
- **Improved:** Editor UX — textareas now have consistent styling with input fields
- **Tech:** Modal escape and backdrop click handlers added via global event listeners
- **Tech:** Keyboard counter support respects input field focus to avoid accidental triggers

## 1.3.2 — tasbihku-v1.3.2

- **Security:** Fixed stored XSS vulnerability in custom dzikir list — switched from innerHTML interpolation to textContent for user-provided names
- **Security:** Added null check for PWA install prompt to prevent runtime error
- **Fixed:** Version string mismatches — synced watermark (v1.3.2), service worker cache name, and CHANGELOG
- **Fixed:** App crash on corrupted localStorage — loadState() now wrapped in try-catch with fallback to default state
- **Fixed:** Stale player state persisted across page reload — player session now cleared on app startup
- **Fixed:** Unbounded activityLog growth — automatically pruned to last 400 entries
- **Accessibility:** Added aria-label to all icon buttons (menu, back, edit, delete, undo, TAP, reset, restore default)
- **Accessibility:** Added aria-hidden="true" to decorative SVG icons
- **Accessibility:** Added role="dialog", aria-modal="true", aria-labelledby, and aria-describedby to modal overlay
- **SEO:** Added `<meta name="description">` tag to index.html
- **PWA:** Service Worker now implements true Stale-While-Revalidate caching strategy (was Cache-First with no background update)
- **PWA:** Added skipWaiting() and clients.claim() for immediate service worker activation
- **Tech:** Removed dead CSS selectors (#guided-arabic, #guided-latin, #guided-translation) from pre-unification code
- **Tech:** Custom list empty state now uses createElement/textContent instead of innerHTML for consistent security posture

## 1.3.1 — tasbihku-v1.3.1

- **Fixed:** Undo button (↩) — now decrements counter first, then navigates to previous page when counter reaches 0
- **Fixed:** Undo button visually disabled when on first page with counter at 0 (38% opacity, pointer-events: none)
- **Fixed:** Distinct haptic feedback for undo action (double-pulse pattern: [30, 50, 30]) to differentiate from regular tap

## 1.3.0 — tasbihku-v1.3.0

- **Improved:** M3 Expressive UI/UX design standards implementation — typography scale, spacing system, and component proportions
- **Improved:** FAB (Tap Button) standardized to consistent 160×160px across all pages (was mixed 180px/150px)
- **Improved:** Display counter sizing — responsive `clamp()` to prevent overflow on smaller screens
- **Improved:** Modal dialog proportions — max-width increased to 360px, title font-size reduced to match M3 headline-small
- **Improved:** Input field styling — consistent padding, border-radius, and spacing across all forms
- **Improved:** Unified edit/delete button sizing — now uses consistent 56×56px `btn-icon-edit` class
- **Improved:** Progress bar spacing standardized across player pages
- **Added:** M3 Expressive spacing scale tokens (`--spacing-xs` through `--spacing-xxxl`)
- **Added:** New CSS utility classes: `.top-bar-spacer`, `.dzikir-row`, `.btn-icon-edit`, `.fab-emoji`, `.fab-label`
- **Added:** New typography classes: `.display-medium`, `.headline-medium`, `.title-large`, `.label-medium`
- **Tech:** Removed hardcoded inline styles in favor of CSS classes for better maintainability
- **Tech:** Added `--md-sys-color-surface-variant` and `--md-sys-color-on-surface-variant` tokens

## 1.2.0 — tasbihku-v1.2.0

- **New:** All dzikir configurations (Pagi, Petang, Wirid Shalat) are now fully editable using the new unified Dzikir Editor.
- **New:** Custom Dzikir now supports multi-page sequences (like guided dzikir).
- **New:** Unified Dzikir Editor allows adding, removing, and reordering pages in a single dhikr session.
- **New:** "Undo" button added to the player interface to easily revert accidental screen taps.
- **Improved:** Unified player UI mechanism for all dzikir types (Guided/Custom).
- **Tech:** Dzikir data structures migrated to a universal pagination array format.

## 1.1.0 — tasbihku-v1.1.0

- **New:** Guided Dzikir — Dzikir Pagi & Dzikir Petang with authentic Arabic text (Amiri Quran font)
- **New:** Each guided dzikir includes Arabic text, Latin transliteration, Indonesian translation, and Sahih Hadith references
- **New:** Auto-skip to next reading after target count is reached (with distinctive vibration feedback)
- **New:** Wirid Ba'da Shalat redesigned with guided interface — 6 readings with strictly validated Sahih Hadith (HR. Muslim nos. 591, 597)
- **New:** Habit Streaks tracker — 🔥 X Hari badge appears on dashboard for consecutive daily usage
- **New:** Activity logging integrated into all dzikir counters (free, wirid, custom, guided)
- **UI:** Progress bar per reading instead of cumulative progress
- **UI:** Larger tap button (150x150px) for guided dzikir and wirid pages
- **Tech:** Amiri Quran font added for authentic Arabic text rendering

## 1.0.0 — Stable

- **New:** Backup & restore — JSON export/import for app data
- **Improved:** Accessibility — pinch-to-zoom enabled
- **Improved:** Custom dzikir input validation — prevents zero or negative targets
- **UI:** Custom Dark Mode 404 page
- **Tech:** Service Worker cache versioning updated

## 0.4-rc

- Rebranded from Qalbu Zikr to TasbihKu
- Dashboard: added SaudaraKu — YourName option
- Typography: primary font changed to Plus Jakarta Sans; fallbacks added (Google Sans Flex, Google Sans)
- Code organization: separated CSS and JS for improved maintainability
- UX: Service Worker update notification added
- Content: Hadith citation (HR. Muslim) added to Wirid section
- UI: watermark footer added in Settings
- Dashboard: toggle to hide/show quote (touch to collapse)

## 0.3-rc

- Converted app to Progressive Web App (PWA)

## 0.2-rc

- Security: XSS prevention — refactored renderCustomList to use document.createElement and textContent instead of innerHTML
- UI: custom dialog implementation (replaces native alert/confirm)
- UI: OLED mode added

## 0.1-rc

- Initial release — core features:
	- M3 Expressive design
	- Free counter
	- Custom dhikr
	- Wakelock option