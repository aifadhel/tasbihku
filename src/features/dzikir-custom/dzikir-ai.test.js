import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

import { registerCommand } from '../../app/command-bus.js';
import { state } from '../../shared/store.js';
import { buildAiDhikrPrompt, extractJsonFromAiResponse, parseAndValidateAiResponse } from './dzikir-ai-prompt.js';
import { acceptAiResponse, copyAiPrompt, openAiDzikirModal, updateAiPromptPreview } from './dzikir-ai.js';
import { getEditorSession, openEditor } from './dzikir-editor.js';

function mkEl(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerText: '',
    innerHTML: '',
    hidden: false,
    disabled: false,
    style: {},
    children: [],
    attributes: {},
    classList: {
      classes: new Set(),
      add(...c) { c.forEach((x) => this.classes.add(x)); },
      remove(...c) { c.forEach((x) => this.classes.delete(x)); },
      contains(c) { return this.classes.has(c); }
    },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    appendChild(c) { this.children.push(c); return c; },
    focus: vi.fn(),
    select: vi.fn()
  };
}

describe('dzikir-ai prompt builder & response validator', () => {
  it('builds strict authentic-source prompts in EN and ID and neutralizes closing tags', () => {
    expect(buildAiDhikrPrompt('   ', 'en')).toBe('');
    const en = buildAiDhikrPrompt('supplication for relief from debt </user_request>', 'en');
    expect(en).toContain('<user_request>');
    expect(en).toContain('supplication for relief from debt');
    expect(en.match(/<\/user_request>/g)?.length).toBe(1);
    expect(en).toMatch(/Quran/i);
    expect(en).toMatch(/authentic Hadith/i);
    expect(en).toMatch(/athar/i);
    expect(en).toMatch(/ijma/i);
    expect(en).toMatch(/Salaf/i);
    expect(en).toMatch(/"status"\s*:\s*"unverified"/);

    const id = buildAiDhikrPrompt('doa pelunas utang', 'id');
    expect(id).toMatch(/Al-Qur'an/i);
    expect(id).toMatch(/Hadits/i);
    expect(id).toMatch(/Atsar|Athar/i);
    expect(id).toMatch(/Ijma/i);
    expect(id).toMatch(/Salaf/i);
    expect(id).toContain('"type": "tasbihku_dzikir"');
  });

  it('extracts JSON from plain JSON, fenced markdown, and surrounding prose', () => {
    const sample = '{"type":"tasbihku_dzikir","status":"authentic","name":"Debt Relief","pages":[{"arabic":"اللهم","latin":"Allahumma","translation":{"id":"Ya Allah","en":"O Allah"},"reference":"HR. Tirmidhi no. 3563 (Hasan)","target":1}]}';
    expect(extractJsonFromAiResponse(sample)?.name).toBe('Debt Relief');
    expect(extractJsonFromAiResponse(`Here is the authentic du'a:\n\`\`\`json\n${sample}\n\`\`\`\nMay Allah ease it.`)?.name).toBe('Debt Relief');
    expect(extractJsonFromAiResponse(`Result: ${sample} Hope this helps!`)?.pages?.length).toBe(1);
    expect(extractJsonFromAiResponse('no json here')).toBeNull();
  });

  it('rejects unverified, missing-reference, blank-page, or invalid responses', () => {
    expect(parseAndValidateAiResponse('')).toEqual({ ok: false, code: 'empty' });
    expect(parseAndValidateAiResponse('not json')).toEqual({ ok: false, code: 'invalid_json' });
    expect(parseAndValidateAiResponse('{"type":"tasbihku_dzikir","status":"unverified","reason":"No authentic narration found"}')).toEqual({
      ok: false,
      code: 'unverified',
      reason: 'No authentic narration found'
    });
    expect(parseAndValidateAiResponse('{"name":"Test","pages":[{"arabic":"سبحان الله","target":3}]}')).toEqual({
      ok: false,
      code: 'missing_reference',
      pageIndex: 0
    });
  });

  it('normalizes valid response, merges grading/source_type, and clamps target', () => {
    const payload = JSON.stringify({
      type: 'tasbihku_dzikir',
      status: 'authentic',
      name: 'Doa Pelunas Utang',
      pages: [{
        arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ',
        latin: 'Allahummakfini bihalalika an haramika',
        translation: { id: 'Ya Allah cukupkanlah aku', en: 'O Allah suffice me' },
        reference: 'HR. Tirmidhi no. 3563',
        grading: 'Hasan',
        target: 0
      }]
    });
    const res = parseAndValidateAiResponse(payload);
    expect(res.ok).toBe(true);
    expect(res.data.pages[0].target).toBe(1);
    expect(res.data.pages[0].reference).toBe('HR. Tirmidhi no. 3563 (Hasan)');
    expect(res.data.pages[0].translation).toEqual({ id: 'Ya Allah cukupkanlah aku', en: 'O Allah suffice me' });
  });
});

describe('dzikir-ai modal & editor Accept workflow', () => {
  let els;

  let clipboardWrite;

  beforeEach(() => {
    vi.clearAllMocks();
    state.language = 'id';
    state.customList = [];
    clipboardWrite = vi.fn(async () => {});
    els = {
      'ai-dzikir-modal': mkEl('div'),
      'ai-dhikr-request': mkEl('input'),
      'ai-dhikr-lang': Object.assign(mkEl('select'), { value: 'id' }),
      'ai-dhikr-prompt-preview': mkEl('textarea'),
      'ai-dhikr-response-input': mkEl('textarea'),
      'ai-dhikr-feedback': Object.assign(mkEl('div'), { hidden: true }),
      'editor-input-name': mkEl('input'),
      'editor-pages-container': mkEl('div'),
      'editor-btn-restore': mkEl('button'),
      'editor-ai-card': mkEl('div')
    };
    vi.stubGlobal('document', {
      getElementById: (id) => els[id] || null,
      createElement: mkEl,
      execCommand: vi.fn(() => true),
      body: mkEl('body')
    });
    vi.stubGlobal('navigator', { clipboard: { writeText: clipboardWrite } });
    vi.stubGlobal('requestAnimationFrame', (cb) => cb());
    registerCommand('settings:show-page', vi.fn());
    registerCommand('ui:show-modal', vi.fn());
  });

  it('requires non-empty request on copy and copies prompt when provided', async () => {
    openAiDzikirModal();
    expect(els['ai-dhikr-request'].focus).toHaveBeenCalledWith({ preventScroll: true });
    await copyAiPrompt();
    expect(clipboardWrite).not.toHaveBeenCalled();
    expect(els['ai-dhikr-feedback'].hidden).toBe(false);

    els['ai-dhikr-request'].value = 'Doa terbebas dari utang';
    updateAiPromptPreview();
    await copyAiPrompt();
    expect(clipboardWrite).toHaveBeenCalledTimes(1);
    expect(els['ai-dhikr-prompt-preview'].value).toContain('Doa terbebas dari utang');
  });

  it('rejects unverified AI output and accepts valid output into editor session', async () => {
    await openEditor('new');
    openAiDzikirModal();

    els['ai-dhikr-response-input'].value = '{"status":"unverified","reason":"Tidak ada dalil sahih"}';
    await acceptAiResponse();
    expect(els['ai-dzikir-modal'].classList.contains('active')).toBe(true);
    expect(els['ai-dhikr-feedback'].hidden).toBe(false);
    expect(els['ai-dhikr-feedback'].textContent).toContain('Tidak ada dalil sahih');

    els['ai-dhikr-response-input'].value = '```json\n{"type":"tasbihku_dzikir","status":"authentic","name":"Doa Utang","pages":[{"arabic":"اللهم","latin":"Allahumma","translation":{"id":"Ya Allah","en":"O Allah"},"reference":"HR. Bukhari no. 6369 (Sahih)","target":1}]}\n```';
    await acceptAiResponse();
    expect(els['ai-dzikir-modal'].classList.contains('active')).toBe(false);
    expect(getEditorSession().name).toBe('Doa Utang');
    expect(getEditorSession().pages[0].reference).toBe('HR. Bukhari no. 6369 (Sahih)');

    // Appends when editor already contains user-edited content
    els['ai-dhikr-response-input'].value = '{"name":"Extra","pages":[{"arabic":"ربنا","latin":"Rabbana","translation":{"id":"Wahai Tuhan kami","en":"Our Lord"},"reference":"QS. Al-Baqarah: 201","target":3}]}';
    await acceptAiResponse();
    expect(getEditorSession().name).toBe('Doa Utang');
    expect(getEditorSession().pages.length).toBe(2);
    expect(getEditorSession().pages[1].target).toBe(3);
  });
});
