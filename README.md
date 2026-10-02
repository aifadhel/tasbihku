<div align="center">

# 📿 TasbihKu

**Aplikasi Dzikir Digital — Digital Dhikr Companion**

A beautiful, offline-first Progressive Web App for tracking Tasbih counts, daily spiritual habits, and guided morning/evening/post-prayer wirid based on authentic Hadith.

[![CI](https://github.com/aifadhel/tasbihku/actions/workflows/ci.yml/badge.svg)](https://github.com/aifadhel/tasbihku/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue.svg)](#features)

</div>

---

## ✨ Features

- **🔢 Tasbih Counter** — Tap-to-count interface with haptic feedback and sound, supporting free counting and guided dzikir modes.
- **📖 Guided Dzikir** — Built-in guides for Dzikir Pagi (morning), Petang (evening), and Ba'da Shalat (post-prayer) wirid sourced from authentic Hadith.
- **✏️ Custom Dzikir Editor** — Create, edit, and manage your own personal dzikir collections.
- **📅 Habit Tracker** — Track daily spiritual habits with streaks, numerical targets, notes, and archiving.
- **📊 Statistics & Charts** — Day-of-week charts, frequency charts, score trends, and CSV export for your habit data.
- **⏱️ Timer & Stopwatch** — Built-in timer (with presets) and stopwatch modes for timed dzikir sessions.
- **📱 PWA / Offline-First** — Install on any device and use without internet. Service worker caches all assets.
- **🌙 OLED Dark Mode** — Beautiful dark theme with true-black OLED option. Material 3 Expressive design language.
- **🔔 Reminders** — Configurable push notifications for morning and evening dzikir.
- **🎉 Celebrations** — Confetti animations and toast notifications on habit completions.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core** | HTML5, Vanilla JavaScript (ES Modules), CSS3 |
| **Design System** | Material 3 Expressive with custom CSS tokens |
| **Storage** | IndexedDB via [`idb-keyval`](https://github.com/nicedoc/idb-keyval) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Unit Testing** | [Vitest](https://vitest.dev/) |
| **E2E Testing** | [Playwright](https://playwright.dev/) |
| **CI/CD** | GitHub Actions |
| **Hosting** | Firebase Hosting (or any static host) |

## 📁 Project Structure

```
├── index.html              # Main SPA entry point
├── style.css               # Full design system & component styles
├── src/
│   ├── main.js             # App initialization & global event wiring
│   ├── core/
│   │   ├── store.js        # State management & IndexedDB persistence
│   │   └── i18n.js         # Internationalization (ID/EN)
│   ├── data/
│   │   └── azkar.json      # Dzikir content database
│   ├── hardware/
│   │   ├── media.js        # Haptic feedback & audio engine
│   │   └── system.js       # PWA install, notifications, wake lock
│   ├── modules/
│   │   ├── tasbih.js       # Tasbih counter logic
│   │   ├── dzikir.js       # Guided dzikir engine & custom editor
│   │   ├── habits.js       # Habit module barrel export
│   │   ├── habits-data.js  # Habit data & streak calculations
│   │   ├── habits-ui.js    # Habit UI rendering & interactions
│   │   ├── habits-chart.js # Chart rendering for habit statistics
│   │   └── habits-export.js# CSV export for habit data
│   └── ui/
│       ├── router.js       # Page navigation, modals, OLED theme
│       ├── toast.js        # Toast notification queue
│       └── confetti.js     # Celebration animations
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker for offline caching
│   ├── config.json         # Audio sprite configuration
│   ├── sound.ogg           # Tap sound effect
│   └── icon-*.png          # App icons
├── docs/
│   ├── ARCHITECTURE.md     # System architecture & dynamic context map
│   └── archive/            # Historical changelogs and notes
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
├── .github/workflows/      # GitHub Actions CI pipeline
├── vite.config.js          # Vite configuration
├── playwright.config.js    # Playwright configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/aifadhel/tasbihku.git
cd tasbihku

# Install dependencies
npm install
```

### Development

```bash
# Start the development server (http://localhost:3005)
npm run dev
```

### Testing

```bash
# Run unit tests (Vitest)
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (Playwright) — requires Chromium
npx playwright install chromium
npm run test:e2e
```

### Build for Production

```bash
# Build static assets to dist/
npm run build

# Preview the production build
npm run preview
```

### Deploy to Firebase

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login and deploy
firebase login
firebase deploy
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a Pull Request.

## 📄 License

This project is open source and licensed under the [MIT License](LICENSE).

## 📜 Open Source Licenses & Attributions

TasbihKu is built upon open-source software, standards, and community contributions. We gratefully acknowledge the following open-source resources, libraries, typefaces, and assets:

### 📦 Runtime Dependencies & Libraries

| Resource / Package | Version | License | Creator / Maintainer | Role / Purpose |
|--------------------|---------|---------|----------------------|----------------|
| [`idb-keyval`](https://github.com/nicedoc/idb-keyval) | `6.2.5` | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | Jake Archibald / nicedoc | Lightweight key-value storage engine powered by IndexedDB for offline persistence |

### 🔤 Typography & Fonts

| Font Family | Package / Distribution | License | Author / Foundry | Role / Purpose |
|-------------|------------------------|---------|------------------|----------------|
| **Google Sans Flex** | [`@fontsource-variable/google-sans-flex`](https://fontsource.org/fonts/google-sans-flex) (`5.2.3`) | [OFL-1.1](https://openfontlicense.org/) | Google / Fontsource | Primary interface variable typeface |
| **Google Sans Code** | [`@fontsource/google-sans-code`](https://fontsource.org/fonts/google-sans-code) (`5.2.4`) | [OFL-1.1](https://openfontlicense.org/) | Google / Fontsource | Monospace numbers, counters, and digital stopwatch displays |
| **Amiri & Amiri Quran** | [Google Fonts](https://fonts.google.com/specimen/Amiri) | [OFL-1.1](https://openfontlicense.org/) | Khaled Hosny, Sebastian Kosch | Classical Naskh typeface for Quranic and Hadith Arabic recitations |

### 🎨 Design System & Iconography

| Asset / System | License | Creator / Source | Description |
|----------------|---------|------------------|-------------|
| **Material Design 3 (M3 Expressive)** | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) / [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | Google | Modern design language, tonal color palette, elevation system, and state layers |
| **Google Material Symbols & Icons** | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) | Google | System iconography across navigation, actions, and buttons |
| **Lucide Icons** | [ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | Lucide Contributors | Stroke icons for book, sun, database, and moon symbols |
| **GitHub Octicons** | [MIT License](https://github.com/primer/octicons/blob/main/LICENSE) | GitHub | GitHub mark SVG icon in About header |

### 🔊 Audio & Feedback Assets

| Asset / Pack | License | Origin / Maintainer | Description |
|--------------|---------|---------------------|-------------|
| **Mechvibes Soundpack** ("CherryMX Red - PBT keycaps") | [MIT License](https://github.com/hainguyents/mechvibes) | hainguyents | Mechanical keyboard tap sound sprite (`sound.ogg`, `config.json`) |

### 🛠️ Build & Testing Tooling

| Tool | Version | License | Maintainer | Description |
|------|---------|---------|------------|-------------|
| [`vite`](https://vitejs.dev/) | `^5.0.0` | [MIT](https://github.com/vitejs/vite/blob/main/LICENSE) | Evan You & Vite Contributors | Modern ESM frontend bundler and dev server |
| [`vitest`](https://vitest.dev/) | `^1.0.0` | [MIT](https://github.com/vitest-dev/vitest/blob/main/LICENSE) | Vitest Contributors | Blazing fast unit testing framework |
| [`@playwright/test`](https://playwright.dev/) | `^1.60.0` | [Apache-2.0](https://github.com/microsoft/playwright/blob/main/LICENSE) | Microsoft | Cross-browser end-to-end testing suite |

### 🙏 Acknowledgments & Sacred Texts

- **Dzikir & Hadith Texts**: Sourced from authentic Hadith collections (Sahih Al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami' At-Tirmidhi, Sunan An-Nasa'i, Musnad Ahmad) with Indonesian translations referenced from Kementerian Agama Republik Indonesia (Kemenag RI).
- Design inspired by the Islamic digital art aesthetic and Google Material 3 Expressive guidelines.
