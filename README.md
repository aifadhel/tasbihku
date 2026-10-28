# TasbihKu

Offline-first Progressive Web App (PWA) for digital tasbih counting, guided morning/evening and post-prayer wirid, and spiritual habit tracking.

[![CI](https://github.com/aifadhel/tasbihku/actions/workflows/ci.yml/badge.svg)](https://github.com/aifadhel/tasbihku/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- **Tasbih counter**: Tap-to-count interface with audio click effects, haptic vibration feedback, target limits, and free-counting mode.
- **Guided dzikir**: Morning (dzikir pagi), evening (dzikir petang), and post-prayer (ba'da shalat) wirid with Arabic text, transliteration, translations (Indonesian/English), and Hadith references.
- **Custom dzikir editor**: Create, edit, reorder, import, and export personalized dzikir collections.
- **Habit tracker**: Daily spiritual habit checklist with streaks, targets, notes, and archiving.
- **Statistics and charts**: Day-of-week breakdown, completion trends, and CSV data export.
- **Timer and stopwatch**: Preset countdown timers and stopwatch modes for timed sessions.
- **Offline PWA**: Full offline capability via service worker caching and installable web app manifest.
- **Display modes**: Light, dark, and true-black OLED themes using Material Design 3 design tokens.
- **Reminders**: Configurable notifications for morning and evening dzikir.

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| Storage | IndexedDB via [`idb-keyval`](https://github.com/nicedoc/idb-keyval) |
| Design tokens | Material Design 3 CSS custom properties |
| Build tool | [Vite](https://vitejs.dev/) |
| Testing | [Vitest](https://vitest.dev/) (unit), [Playwright](https://playwright.dev/) (E2E) |
| Hosting | Firebase Hosting (compatible with any static host) |

## Project Structure

```
├── index.html              # Main SPA entry point
├── style.css               # Design system tokens and component styles
├── src/
│   ├── main.js             # Application bootstrap and event wiring
│   ├── core/
│   │   ├── store.js        # State management and IndexedDB persistence
│   │   └── i18n.js         # Internationalization (ID/EN)
│   ├── data/
│   │   └── azkar.json      # Built-in dzikir content
│   ├── hardware/
│   │   ├── media.js        # Audio synthesis and haptic feedback
│   │   └── system.js       # PWA installation, notifications, wake lock
│   ├── modules/
│   │   ├── tasbih.js       # Tasbih counter logic
│   │   ├── dzikir.js       # Guided dzikir and custom editor logic
│   │   ├── habits.js       # Habit module exports
│   │   ├── habits-data.js  # Habit state and streak calculations
│   │   ├── habits-ui.js    # Habit DOM rendering and event handlers
│   │   ├── habits-chart.js # SVG chart rendering for habit statistics
│   │   └── habits-export.js# CSV export generator
│   └── ui/
│       ├── router.js       # View routing, modal management, theme toggles
│       ├── toast.js        # Toast notifications
│       └── confetti.js     # Completion animation
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker for offline caching
│   ├── config.json         # Audio sprite configuration
│   ├── sound.ogg           # Tap sound asset
│   └── icon-*.png          # Application icons
├── docs/
│   ├── ARCHITECTURE.md     # System architecture and module boundaries
│   └── archive/            # Historical changelogs and notes
├── tests/
│   ├── unit/               # Vitest unit test suite
│   └── e2e/                # Playwright E2E test suite
├── .github/workflows/      # GitHub Actions CI workflow
├── vite.config.js          # Vite configuration
├── playwright.config.js    # Playwright configuration
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

Start the local development server at `http://localhost:3005`:

```bash
npm run dev
```

### Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run Playwright E2E tests (requires Chromium)
npx playwright install chromium
npm run test:e2e
```

### Production Build

```bash
# Build production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

### Deployment

Deploy to Firebase Hosting:

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
| [Vitest](https://vitest.dev/) | `^1.0.0` | [MIT](https://github.com/vitest-dev/vitest/blob/main/LICENSE) | Unit test runner |
| [Playwright](https://playwright.dev/) | `^1.60.0` | [Apache-2.0](https://github.com/microsoft/playwright/blob/main/LICENSE) | End-to-end browser testing |

### Text Sources

- Dzikir and wirid texts are sourced from authentic Hadith collections (Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami' at-Tirmidhi, Sunan an-Nasa'i, and Musnad Ahmad).
- Indonesian translations are referenced from Kementerian Agama Republik Indonesia (Kemenag RI).
