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
TasbihKu/
├── index.html              # Main SPA entry point
├── style.css               # Full design system & component styles
├── src/
│   ├── main.js             # App initialization & global event wiring
│   ├── core/
│   │   └── store.js        # State management & IndexedDB persistence
│   ├── data/
│   │   └── azkar.json      # Dzikir content database
│   ├── hardware/
│   │   ├── media.js         # Haptic feedback & audio engine
│   │   └── system.js        # PWA install, notifications, wake lock
│   ├── modules/
│   │   ├── tasbih.js        # Tasbih counter logic
│   │   ├── dzikir.js        # Guided dzikir engine
│   │   ├── habits.js        # Habit module barrel export
│   │   ├── habits-data.js   # Habit data & streak calculations
│   │   ├── habits-ui.js     # Habit UI rendering & interactions
│   │   ├── habits-chart.js  # Chart rendering for habit statistics
│   │   └── habits-export.js # CSV export for habit data
│   └── ui/
│       ├── router.js        # Page navigation, modals, toasts
│       └── confetti.js      # Celebration animations
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker for offline caching
│   ├── config.json          # App configuration
│   ├── sound.ogg            # Tap sound effect
│   └── icon-*.png           # App icons
├── tests/
│   ├── unit/                # Vitest unit tests
│   └── e2e/                 # Playwright E2E tests
├── scripts/                 # Developer utility scripts
├── .github/workflows/       # GitHub Actions CI pipeline
├── vite.config.js           # Vite configuration
├── playwright.config.js     # Playwright configuration
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

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Dzikir content sourced from authentic Hadith collections
- Design inspired by [Material Design 3 Expressive](https://m3.material.io/)
- Arabic typography by [Amiri Font](https://fonts.google.com/specimen/Amiri)
