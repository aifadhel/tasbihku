import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

vi.mock('../../shared/media.js', () => ({
  vibrate: vi.fn(),
  playTapSound: vi.fn(),
  triggerMilestoneFeedback: vi.fn(),
  isSoundSystemFailed: vi.fn(() => false)
}));

import { registerCommand } from '../../app/command-bus.js';
import { DEFAULT_STATE, state } from '../../shared/store.js';
import {
  dzikirPagi,
  dzikirPetang,
  getLocalizedText,
  wiridReadings
} from './dzikir-guided.data.js';
import { getPlayerSourcePage, startPlayer } from './dzikir-player.js';

function assertReadingSchema(list, label) {
  list.forEach((item, idx) => {
    expect(typeof item.arabic, `${label}[${idx}].arabic`).toBe('string');
    expect(item.arabic.trim().length).toBeGreaterThan(0);
    expect(typeof item.latin).toBe('string');
    expect(item.latin.trim().length).toBeGreaterThan(0);
    expect(typeof item.target).toBe('number');
    expect(item.target).toBeGreaterThan(0);
    expect(item.translation.id.trim().length).toBeGreaterThan(0);
    expect(item.translation.en.trim().length).toBeGreaterThan(0);
    expect(item.reference.id.trim().length).toBeGreaterThan(0);
    expect(item.reference.en.trim().length).toBeGreaterThan(0);
  });
}

describe('dzikir-guided feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.guidedData = {};
    state.language = 'id';
  });

  it('validates authentic dzikirPagi, dzikirPetang, and wiridReadings datasets', () => {
    expect(dzikirPagi.length).toBeGreaterThanOrEqual(15);
    expect(dzikirPetang.length).toBeGreaterThanOrEqual(14);
    expect(wiridReadings.length).toBeGreaterThanOrEqual(14);
    assertReadingSchema(dzikirPagi, 'dzikirPagi');
    assertReadingSchema(dzikirPetang, 'dzikirPetang');
    assertReadingSchema(wiridReadings, 'wiridReadings');
    expect(DEFAULT_STATE.guidedDataVersion).toBe(3);
  });

  it('preserves full Ayat Kursi, 3 Quls, and canonical sunnah narrations', () => {
    const wiridKursi = wiridReadings.find((i) => i.arabic.includes('الْحَيُّ الْقَيُّومُ'));
    [dzikirPagi[0], dzikirPetang[0], wiridKursi].forEach((k) => {
      expect(k).toBeDefined();
      expect(k.arabic).not.toContain('...');
      expect(k.arabic).toContain('وَسِعَ كُرْسِيُّهُ');
      expect(k.arabic).toContain('وَلَا يَئُودُهُ حِفْظُهُمَا');
      expect(k.target).toBe(1);
    });
    expect(dzikirPagi.find((i) => i.arabic.includes('عَدَدَ خَلْقِهِ'))?.target).toBe(3);
    expect(dzikirPetang.find((i) => i.arabic.includes('أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ'))?.target).toBe(3);
    expect(wiridReadings.find((i) => i.arabic.includes('لَا مَانِعَ لِمَا أَعْطَيْتَ'))?.target).toBe(1);
    expect(wiridReadings.find((i) => i.arabic.includes('لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ'))?.target).toBe(1);
    expect(wiridReadings.find((i) => i.arabic.includes('أَعِنِّي عَلَى ذِكْرِكَ'))?.target).toBe(1);
    expect(wiridReadings.find((i) => i.arabic.includes('عِلْمًا نَافِعًا'))?.target).toBe(1);
  });

  it('resolves localized text cleanly and blocks [object Object]', () => {
    expect(getLocalizedText({ id: 'Halo', en: 'Hello' }, 'id')).toBe('Halo');
    expect(getLocalizedText({ id: 'Halo', en: 'Hello' }, 'en')).toBe('Hello');
    expect(getLocalizedText('Plain')).toBe('Plain');
    expect(getLocalizedText('[object Object]')).toBe('');
    expect(getLocalizedText(null)).toBe('');
  });

  it('records source page and navigates to player on startPlayer', async () => {
    const showPageSpy = vi.fn();
    registerCommand('settings:show-page', showPageSpy);
    global.document = {
      querySelector: vi.fn((sel) => (sel === '.page.active' ? { id: 'page-menu' } : null)),
      getElementById: vi.fn(() => null)
    };
    startPlayer('pagi');
    expect(getPlayerSourcePage()).toBe('page-menu');
    await Promise.resolve();
    expect(showPageSpy).toHaveBeenCalledWith({ arg: 'page-player' });
  });
});
