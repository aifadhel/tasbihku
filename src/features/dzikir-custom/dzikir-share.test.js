import { describe, expect, it, vi } from 'vitest';
import { getLocalizedText } from '../../shared/i18n.js';
import {
  decodeDzikirPayload,
  encodeDzikirPayload,
  extractDzikirPayloadFromInput,
  regenerateDzikirIds,
  validateDzikirPayload
} from './dzikir-share-codec.js';
import { showReceivePreview } from './dzikir-share-ui.js';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

describe('dzikir-custom share codec and preview', () => {
  const sampleDzikir = {
    name: 'Rangkaian Tasbih Pilihan',
    pages: [
      {
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        latin: 'Subhanallahi wa bihamdihi',
        translation: 'Maha Suci Allah dan segala puji bagi-Nya',
        reference: 'HR. Bukhari no. 6405',
        target: 100
      },
      {
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
        latin: 'La ilaha illallah wahdahu la syarika lah',
        translation: 'Tidak ada sesembahan yang berhak disembah selain Allah',
        reference: 'HR. Muslim no. 2691',
        target: 10
      }
    ]
  };

  it('encodes and decodes multi-page dzikir preserving UTF-8 Arabic diacritics', () => {
    const token = encodeDzikirPayload(sampleDzikir);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    const decoded = decodeDzikirPayload(token);
    expect(decoded.name).toBe(sampleDzikir.name);
    expect(decoded.pages.length).toBe(2);
    expect(decoded.pages[0].arabic).toBe(sampleDzikir.pages[0].arabic);
    expect(() => encodeDzikirPayload(null)).toThrow();
    expect(() => decodeDzikirPayload('YWJj')).toThrow();
  });

  it('extracts tokens from URLs, query params, WhatsApp text, raw JSON, and rejects invalid', () => {
    const token = encodeDzikirPayload(sampleDzikir);
    expect(extractDzikirPayloadFromInput(`https://tasbihku.app/#dzikir=${token}`)).toBe(token);
    expect(extractDzikirPayloadFromInput(`https://tasbihku.app/?dzikir=${token}&utm=1`)).toBe(token);
    expect(extractDzikirPayloadFromInput(`Baca:\nhttps://tasbihku.app/#dzikir=${token}\nBerkah!`)).toBe(token);
    expect(extractDzikirPayloadFromInput(token)).toBe(token);
    const fromJson = extractDzikirPayloadFromInput(JSON.stringify(sampleDzikir));
    expect(decodeDzikirPayload(fromJson).name).toBe(sampleDzikir.name);
    expect(extractDzikirPayloadFromInput('')).toBeNull();
    expect(extractDzikirPayloadFromInput('random gibberish')).toBeNull();
  });

  it('validates payloads, clamps targets, and rejects >50 pages or blank pages', () => {
    expect(validateDzikirPayload(sampleDzikir).valid).toBe(true);
    expect(validateDzikirPayload({ name: '  ', pages: [{ arabic: 'x' }] }).valid).toBe(false);
    expect(validateDzikirPayload({ name: 'Test', pages: [] }).valid).toBe(false);
    expect(validateDzikirPayload({ name: 'Test', pages: [{ arabic: '', latin: ' ', translation: '' }] }).valid).toBe(false);
    expect(validateDzikirPayload({ name: 'Big', pages: Array(51).fill({ latin: 'a' }) }).valid).toBe(false);
    const clamped = validateDzikirPayload({ name: 'Clamp', pages: [{ latin: 'a', target: -5 }, { latin: 'b', target: 9999999 }] });
    expect(clamped.sanitized.pages[0].target).toBe(1);
    expect(clamped.sanitized.pages[1].target).toBe(99999);
  });

  it('preserves object translations without [object Object] coercion and regenerates IDs', () => {
    const objDzikir = {
      name: 'Doa Kemudahan Hisab',
      pages: [{ arabic: 'اللهم', translation: { id: 'ID teks', en: 'EN text' }, reference: { id: 'Ref', en: 'Ref' }, target: 33 }]
    };
    const decoded = decodeDzikirPayload(encodeDzikirPayload(objDzikir));
    expect(decoded.pages[0].translation).toEqual({ id: 'ID teks', en: 'EN text' });
    const regen = regenerateDzikirIds(objDzikir);
    expect(regen.pages[0].id).not.toBe(regen.id);
    expect(getLocalizedText('[object Object]', 'id')).toBe('');

    const mk = (tag) => ({ tagName: tag.toUpperCase(), style: {}, textContent: '', innerHTML: '', children: [], classList: { add: vi.fn(), remove: vi.fn() }, appendChild(c) { this.children.push(c); return c; } });
    const els = { 'receive-dzikir-modal': mk('div'), 'receive-modal-input-view': mk('div'), 'receive-modal-preview-view': mk('div'), 'receive-preview-name': mk('div'), 'receive-preview-subtitle': mk('div'), 'receive-preview-list': mk('div') };
    global.document = { getElementById: (id) => els[id] || null, createElement: mk };
    showReceivePreview(validateDzikirPayload(objDzikir).sanitized);
    expect(els['receive-preview-list'].children[0].children.map((c) => c.textContent)).toContain('ID teks');
  });
});
