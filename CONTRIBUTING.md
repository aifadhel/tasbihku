# Contributing to TasbihKu

Thank you for your interest in contributing to TasbihKu! 🙏

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/ehfadhel/tasbihku/issues) to avoid duplicates.
2. Open a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Browser and device information
   - Screenshots if applicable

### Suggesting Features

1. Open a new issue with the `enhancement` label.
2. Describe the feature and why it would be useful.
3. Include mockups or sketches if possible.

### Submitting Code

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Make your changes** following the guidelines below.

4. **Run all tests** before submitting:
   ```bash
   # Unit tests
   npm run test

   # E2E tests (requires Chromium)
   npx playwright install chromium
   npm run test:e2e

   # Build verification
   npm run build
   ```

5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add new dzikir category support"
   ```

6. **Push** and open a Pull Request against `main`.

## Development Guidelines

### Architecture

- **No frameworks** — This project uses Vanilla JavaScript with ES Modules. Do not introduce React, Vue, Angular, or similar.
- **No build-step CSS** — Use plain CSS with CSS custom properties (design tokens). Do not introduce Tailwind, Sass, or similar.
- **Material 3 Expressive** — All UI must follow the existing Material 3 design token system in `style.css`.

### Code Style

- Use ES Module `import`/`export` syntax.
- Keep functions focused and small.
- Use meaningful variable and function names.
- Add JSDoc comments for exported functions.
- Preserve all existing comments that are unrelated to your changes.

### Testing

- **Unit tests** go in `tests/unit/` and use [Vitest](https://vitest.dev/).
- **E2E tests** go in `tests/e2e/` and use [Playwright](https://playwright.dev/).
- All PRs must pass the existing test suite. New features should include tests.

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Code style (formatting, not CSS changes) |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

### Dzikir Content

- All dzikir content must be sourced from authentic (sahih) Hadith.
- Include the Hadith reference when adding new dzikir.
- Arabic text must use proper Unicode (no transliteration substitutes).

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

Feel free to open an issue with the `question` label if you need help getting started.
