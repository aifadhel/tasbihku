import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

import { t } from '../../src/shared/i18n.js';
import { DEFAULT_STATE, state } from '../../src/shared/store.js';

const ROOT = path.resolve(__dirname, '../..');
const readRel = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function readDirCss(dirRel) {
  const full = path.join(ROOT, dirRel);
  return fs.readdirSync(full).filter((f) => f.endsWith('.css')).map((f) => readRel(`${dirRel}/${f}`)).join('\n');
}

describe('Architecture & Regression Suite', () => {
  const indexHtml = readRel('index.html');
  const mainJs = readRel('src/main.js');
  const stylesAll = `${readRel('style.css')}\n${readDirCss('src/styles')}`;

  it('keeps player top-bar excised and zero stealth-mode CSS/HTML/global leaks', () => {
    expect(indexHtml).not.toContain('toggleStealthMode');
    expect(indexHtml).not.toContain('toggleFullscreen');
    expect(indexHtml).not.toContain('id="icon-16"');
    expect(indexHtml).not.toContain('id="icon-17"');
    expect(stylesAll).not.toContain('.stealth-mode');
    expect(t('stealth_mode_aria')).toBe('stealth_mode_aria');
    expect(t('fullscreen_aria')).toBe('fullscreen_aria');
  });

  it('preserves docked viewport player markup, CSS, auto scrollTop, and 60ms debounce', () => {
    const viewport = indexHtml.split('id="player-scroll-viewport"')[1].split('id="player-bottom-bar"')[0];
    ['player-text-container', 'player-arabic', 'player-latin', 'player-translation', 'player-reference'].forEach((id) => {
      expect(viewport).toContain(`id="${id}"`);
    });
    const dock = indexHtml.split('id="player-bottom-bar"')[1].split('<!-- UNIFIED EDITOR PAGE -->')[0];
    ['player-progress', 'player-undo-btn', 'player-counter', 'player-target-display', 'player-main-btn'].forEach((id) => {
      expect(dock).toContain(`id="${id}"`);
    });

    const playerCss = readRel('src/features/dzikir-guided/dzikir-guided.css');
    expect(stylesAll).toContain('overscroll-behavior-y: contain');
    ['#page-player', '.player-scroll-viewport', '.player-bottom-bar', '.player-deck-tap-btn', '.player-deck-btn-undo'].forEach((cls) => {
      expect(playerCss).toContain(cls);
    });

    const playerJs = readRel('src/features/dzikir-guided/dzikir-player.js');
    expect(playerJs).toContain('scrollViewport.scrollTop = 0');
    expect(playerJs).toContain('lastPlayerTapTime');
    expect(playerJs).toContain('now - lastPlayerTapTime < 60');
  });

  it('preserves dashboard reset dock, tasbih-counter contract cmds, and KeyR shortcut', async () => {
    expect(indexHtml).toContain('id="dashboard-reset-btn"');
    expect(indexHtml).toContain('class="fab-container fab-action-dock"');
    expect(indexHtml).toContain('class="fab-dock-balance-anchor"');
    expect(indexHtml).toContain('data-cmd="tasbih:dashboard-reset"');
    expect(indexHtml).toContain('#icon-18');

    const tasbihCss = readRel('src/features/tasbih-counter/tasbih-counter.css');
    expect(tasbihCss).toContain('.fab-action-dock');
    expect(tasbihCss).toContain('.btn-reset-tonal');
    expect(tasbihCss).toContain('.fab-dock-balance-anchor');
    expect(stylesAll).toContain('--md-sys-color-secondary-container');

    const domBridgeJs = readRel('src/app/dom-bridge.js');
    expect(domBridgeJs).toContain("e.code === 'KeyR'");
    expect(domBridgeJs).toContain("dispatch('tasbih:dashboard-reset')");
  });

  it('keeps quote-card excised, prunes legacy quoteCollapsed, and removes stale DOM on boot', () => {
    ['id="quote-card"', 'id="quote-content"', 'id="quote-collapsed-msg"', 'toggleQuote()', 'id="icon-9"', '#icon-9'].forEach((s) => {
      expect(indexHtml).not.toContain(s);
    });
    ['.quote-toggle-wrapper', '.quote-card-m3', '.quote-box'].forEach((s) => {
      expect(stylesAll).not.toContain(s);
    });
    expect(mainJs).not.toContain('toggleQuote');
    expect(mainJs).toContain("document.getElementById('quote-card')");
    expect(mainJs).toContain('staleQuoteCard.remove()');

    expect(DEFAULT_STATE.quoteCollapsed).toBeUndefined();
    expect(state.quoteCollapsed).toBeUndefined();
    expect(readRel('src/shared/store-migrate.js')).toContain('delete rawState.quoteCollapsed');
    expect(t('quote_default')).toBe('quote_default');
  });

  it('preserves About Open Source Licenses DOM and styles', () => {
    ['id="about-licenses-container"', 'about-licenses-section', 'idb-keyval', 'Google Sans Flex & Code', 'Amiri & Amiri Quran', 'Mechvibes Soundpack'].forEach((s) => {
      expect(indexHtml).toContain(s);
    });
    const aboutCss = readRel('src/features/settings-shell/settings-licenses.css');
    ['.about-licenses-container', '.about-license-item', '.badge-apache', '.badge-ofl', '.badge-mit'].forEach((cls) => {
      expect(aboutCss).toContain(cls);
    });
  });

  it('runs structural self-gates cleanly and removes inline HTML handlers', () => {
    expect(indexHtml).not.toMatch(/\son(click|change|input|keydown|submit)=/i);
    expect(indexHtml).not.toContain('<style>');
    expect(fs.existsSync(path.join(ROOT, 'src/core'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'src/hardware'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'src/ui'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'src/modules'))).toBe(false);
  });
});
