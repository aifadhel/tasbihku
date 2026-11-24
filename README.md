# TasbihKu

Offline-first Progressive Web App for digital tasbih counting, guided daily wirid, custom dzikir collections, and spiritual habit tracking.

[![CI](https://github.com/aifadhel/tasbihku/actions/workflows/ci.yml/badge.svg)](https://github.com/aifadhel/tasbihku/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- Free tap counter with target limits, manual count adjustment, synthesized click audio, and configurable vibration intervals.
- Stopwatch and countdown timer modes with 1m, 5m, 10m, and 30m presets integrated into the main dashboard dock.
- Guided morning (pagi), evening (petang), and post-prayer (wirid) dzikir sets with Arabic script, Latin transliteration, Indonesian and English translations, and Hadith references.
- Custom dzikir sequence editor backed by a searchable Azkar library and URL-hash sharing links.
- Habit tracker supporting daily, weekday, weekly-target, and interval schedules across morning, afternoon, evening, and anytime sections, with drag-and-drop reordering and linked dzikir completion.
- Habit consistency tracking powered by EMA strength scoring, single-day Istiqamah streak grace, monthly log calendars, activity heatmaps, trend charts, and CSV export.
- IndexedDB storage (`tasbihKuState`) paired with a `<= 1 KB` `localStorage` boot preference cache, cross-tab `BroadcastChannel` synchronization, and full JSON backup export/import.
- Offline service worker precaching for generated asset chunks, plus light, dark, and pitch-black OLED display modes, Arabic font scaling, screen wake lock, and scheduled reminder notifications.

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| Architecture | Thin shell (`src/app/`) + depth-1 feature slices (`src/features/*/`) decoupled over an async command/event bus |
| Styling | Cascade-layered CSS (`@layer`) with `oklch()` / `color-mix()` seed tokens and Material Design 3 hex fallbacks |
| Storage | IndexedDB via [`idb-keyval`](https://github.com/nicedoc/idb-keyval), `<= 1 KB` `localStorage` boot cache, `BroadcastChannel` |
| Build tool | [Vite](https://vitejs.dev/) with `closeBundle` service worker chunk manifest injection |
| Quality gates | Custom structural and bundle budget checks (`scripts/check.mjs`, `size.config.json`) |
| Testing | [Vitest](https://vitest.dev/) (unit & feature tests), [Playwright](https://playwright.dev/) (E2E) |
| Hosting | Firebase Hosting (compatible with any static host) |

## Project Structure

```
├── index.html                  # App shell HTML and declarative [data-cmd] bindings
├── style.css                   # @layer manifest importing src/styles/* and feature stylesheets
├── CODEMAP.md                  # Generated feature, slot, and command index
├── size.config.json            # Gzipped shell and lazy-chunk size budgets
├── src/
│   ├── main.js                 # Shell bootstrap and eager startup feature registration
│   ├── app/                    # Command bus, lazy feature registry, modal/capability slots, DOM bridge, version
│   ├── shared/                 # Split storage, reactive store + migrations, i18n loader, media, wake lock, UI helpers
│   ├── styles/                 # Reset, oklch/M3 tokens, and shared CSS primitives
│   ├── data/
│   │   └── azkar.json          # Built-in Azkar library entries
│   └── features/
│       ├── tasbih-counter/     # Free counter, target limit, stopwatch, countdown timer
│       ├── dzikir-guided/      # Wirid/pagi/petang JSON datasets and docked player engine
│       ├── dzikir-custom/      # Custom list, lazy editor, Azkar library, share codec & UI
│       ├── habits-core/        # Date math, streaks, EMA strength scoring, CSV generation
│       ├── habits-ui/          # Cards, drag/drop, modals, calendar, reminders, lazy charts
│       └── settings-shell/     # Hash/popstate router, modal dialogs, OLED/audio/haptics, JSON backup
├── public/                     # Static PWA assets, manifest.json, sw.js template, sound.ogg, config.json
├── scripts/
│   ├── check.mjs               # Structural, isolation, line-limit, and gzip size verifier
│   ├── codemap.mjs             # CODEMAP.md generator from *.contract.js headers
│   └── bump-version.js         # Syncs package.json, src/app/version.js, public/sw.js, and CHANGELOG.md
├── docs/
│   ├── ARCHITECTURE.md         # Layering rules, cross-feature contracts, discovery heuristics
│   └── archive/                # Historical notes and changelogs
├── tests/
│   ├── unit/                   # Cross-cutting architecture and i18n Vitest suites
│   └── e2e/                    # Playwright browser suites (feature specs also live in src/features/*/)
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline
├── vite.config.js
├── playwright.config.js
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- npm

### Installation

```bash
git clone https://github.com/aifadhel/tasbihku.git
cd tasbihku
npm install
```

### Development

Start the local Vite dev server on `http://localhost:3005`:

```bash
npm run dev
```

### Checks and Testing

```bash
# Run structural checks (file size limits, feature isolation, i18n parity, no inline JS/globals)
npm run check

# Regenerate CODEMAP.md from feature contract headers
npm run codemap

# Verify gzipped shell and lazy-chunk bundle budgets after building
npm run size

# Run unit and feature tests
npm test

# Run Vitest in watch mode
npm run test:watch

# Run Playwright E2E tests (requires Chromium)
npx playwright install chromium
npm run test:e2e
```

### Production Build

```bash
# Build dist/ and inject generated chunk assets into dist/sw.js
npm run build

# Preview dist/ locally
npm run preview
```

### Deployment

Deploy `dist/` to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

MIT License. See [LICENSE](LICENSE) for details.

## Third-Party Licenses and Attributions

### Runtime Dependencies

| Package | Version | License | Maintainer | Purpose |
|---|---|---|---|---|
| [`idb-keyval`](https://github.com/nicedoc/idb-keyval) | `6.2.5` | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | Jake Archibald | IndexedDB key-value storage wrapper |

### Fonts

| Font Family | Package / Source | License | Author / Foundry | Purpose |
|---|---|---|---|---|
| Google Sans Flex | [`@fontsource-variable/google-sans-flex`](https://fontsource.org/fonts/google-sans-flex) (`5.2.3`) | [OFL-1.1](https://openfontlicense.org/) | Google / Fontsource | Main UI variable font |
| Google Sans Code | [`@fontsource/google-sans-code`](https://fontsource.org/fonts/google-sans-code) (`5.2.4`) | [OFL-1.1](https://openfontlicense.org/) | Google / Fontsource | Monospace font for counters and timers |
| Amiri & Amiri Quran | [Google Fonts](https://fonts.google.com/specimen/Amiri) | [OFL-1.1](https://openfontlicense.org/) | Khaled Hosny, Sebastian Kosch | Arabic typography for Quran and Hadith text |

### Design System and Icons

| Asset | License | Source | Purpose |
|---|---|---|---|
| Material Design 3 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) / [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | Google | Color tokens, elevation, and layout primitives |
| Material Symbols | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | Google | Primary interface icons |
| Lucide Icons | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | Lucide Contributors | Supplementary stroke icons |
| GitHub Octicons | [MIT](https://github.com/primer/octicons/blob/main/LICENSE) | GitHub | GitHub mark SVG |

### Audio Assets

| Asset | License | Source | Purpose |
|---|---|---|---|
| Mechvibes Soundpack (CherryMX Red - PBT) | [MIT](https://github.com/hainguyents/mechvibes) | hainguyents | Key tap audio sprite (`sound.ogg`, `config.json`) |

### Build and Tooling

| Tool | Version | License | Purpose |
|---|---|---|---|
| [Vite](https://vitejs.dev/) | `^5.0.0` | [MIT](https://github.com/vitejs/vite/blob/main/LICENSE) | Development server and asset bundler |
| [Vitest](https://vitest.dev/) | `^1.0.0` | [MIT](https://github.com/vitest-dev/vitest/blob/main/LICENSE) | Unit and feature test runner |
| [Playwright](https://playwright.dev/) | `^1.60.0` | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | End-to-end browser testing |

### Text Sources

- Dzikir and wirid texts are sourced from authentic Hadith collections (Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami' at-Tirmidhi, Sunan an-Nasa'i, and Musnad Ahmad).
- Indonesian translations are referenced from Kementerian Agama Republik Indonesia (Kemenag RI).
