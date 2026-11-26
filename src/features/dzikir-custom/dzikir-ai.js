import { registerModalClose, registerModalOpen } from '../../app/slots.js';
import { registerTranslations, t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';
import { showToast } from '../../shared/toast.js';
import { buildAiDhikrPrompt, parseAndValidateAiResponse } from './dzikir-ai-prompt.js';
import { getEditorSession, openEditor, renderEditor } from './dzikir-editor.js';

registerTranslations({
  id: {
    ai_toast_prompt_copied: 'Prompt disalin. Tempel ke chatbot AI pilihan Anda.',
    ai_toast_accepted: '{count} halaman dzikir diterima ke editor.',
    ai_err_empty_request: 'Masukkan permintaan doa atau dzikir terlebih dahulu.',
    ai_err_empty_response: 'Tempel jawaban dari chat AI terlebih dahulu.',
    ai_err_invalid_json: 'Format JSON TasbihKu tidak ditemukan pada jawaban AI.',
    ai_err_unverified: 'AI menyatakan dalil belum dapat diverifikasi',
    ai_err_missing_reference: 'Halaman #{page} tidak mencantumkan dalil/referensi sahih.',
    ai_err_invalid_format: 'Struktur dzikir tidak valid atau masih kosong.'
  },
  en: {
    ai_toast_prompt_copied: 'Prompt copied. Paste it into your AI chat.',
    ai_toast_accepted: '{count} dhikr page(s) accepted into editor.',
    ai_err_empty_request: 'Please enter your dhikr request first.',
    ai_err_empty_response: 'Please paste the AI chat response first.',
    ai_err_invalid_json: 'Valid TasbihKu JSON was not found in the AI response.',
    ai_err_unverified: 'AI could not verify an authentic source',
    ai_err_missing_reference: 'Page #{page} is missing an authentic source reference.',
    ai_err_invalid_format: 'Invalid or empty dhikr structure.'
  }
});

function setFeedback(message = '', tone = 'error') {
  const el = typeof document !== 'undefined' ? document.getElementById('ai-dhikr-feedback') : null;
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    el.className = 'ai-feedback-banner';
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.className = `ai-feedback-banner ${tone === 'success' ? 'is-success' : 'is-error'}`;
}

function getSelectedPromptLang() {
  const langEl = typeof document !== 'undefined' ? document.getElementById('ai-dhikr-lang') : null;
  const val = langEl && (langEl.value === 'id' || langEl.value === 'en') ? langEl.value : null;
  return val || state.language || 'id';
}

export function updateAiPromptPreview() {
  if (typeof document === 'undefined') return '';
  const reqEl = document.getElementById('ai-dhikr-request');
  const previewEl = document.getElementById('ai-dhikr-prompt-preview');
  const prompt = buildAiDhikrPrompt(reqEl ? reqEl.value : '', getSelectedPromptLang());
  if (previewEl) previewEl.value = prompt;
  setFeedback('');
  return prompt;
}

export function openAiDzikirModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('ai-dzikir-modal');
  const reqEl = document.getElementById('ai-dhikr-request');
  const langEl = document.getElementById('ai-dhikr-lang');
  const previewEl = document.getElementById('ai-dhikr-prompt-preview');
  const respEl = document.getElementById('ai-dhikr-response-input');

  if (langEl) langEl.value = state.language === 'en' ? 'en' : 'id';
  if (reqEl) reqEl.value = '';
  if (previewEl) previewEl.value = '';
  if (respEl) respEl.value = '';
  setFeedback('');

  if (modal) {
    modal.classList.add('active');
    registerModalOpen('ai-dzikir-modal', closeAiDzikirModal);
  }
  if (reqEl && typeof reqEl.focus === 'function') reqEl.focus();
}

export function closeAiDzikirModal(fromPopstate = false) {
  const modal = typeof document !== 'undefined' ? document.getElementById('ai-dzikir-modal') : null;
  if (modal) modal.classList.remove('active');
  setFeedback('');
  registerModalClose('ai-dzikir-modal', fromPopstate);
}

export async function copyAiPrompt() {
  if (typeof document === 'undefined') return false;
  const reqEl = document.getElementById('ai-dhikr-request');
  const previewEl = document.getElementById('ai-dhikr-prompt-preview');
  const req = reqEl && reqEl.value ? reqEl.value.trim() : '';

  if (!req) {
    const msg = t('ai_err_empty_request');
    setFeedback(msg, 'error');
    showToast(msg);
    if (reqEl && typeof reqEl.focus === 'function') reqEl.focus();
    return false;
  }

  const prompt = buildAiDhikrPrompt(req, getSelectedPromptLang());
  if (previewEl) previewEl.value = prompt;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt);
    } else if (previewEl && typeof document.execCommand === 'function') {
      previewEl.select();
      document.execCommand('copy');
    }
  } catch (_) {
    if (previewEl && typeof document.execCommand === 'function') {
      previewEl.select();
      document.execCommand('copy');
    }
  }

  const okMsg = t('ai_toast_prompt_copied');
  setFeedback(okMsg, 'success');
  showToast(okMsg);
  return true;
}

function formatAcceptError(res) {
  if (res.code === 'empty') return t('ai_err_empty_response');
  if (res.code === 'invalid_json') return t('ai_err_invalid_json');
  if (res.code === 'unverified') {
    const base = t('ai_err_unverified');
    return res.reason ? `${base}: ${res.reason}` : base;
  }
  if (res.code === 'missing_reference') {
    return t('ai_err_missing_reference', { page: (res.pageIndex ?? 0) + 1 });
  }
  return t('ai_err_invalid_format');
}

function isBlankInitialSession(session) {
  if (!session || (session.name && session.name.trim())) return false;
  if (!Array.isArray(session.pages) || session.pages.length !== 1) return false;
  const p = session.pages[0];
  const tr = p.translation;
  const hasTrans = tr && typeof tr === 'object'
    ? Boolean((tr.id && tr.id.trim()) || (tr.en && tr.en.trim()))
    : Boolean(tr && String(tr).trim());
  const hasRef = p.reference && typeof p.reference === 'object'
    ? Boolean((p.reference.id && p.reference.id.trim()) || (p.reference.en && p.reference.en.trim()))
    : Boolean(p.reference && String(p.reference).trim());
  return !p.arabic && !p.latin && !hasTrans && !hasRef;
}

export async function acceptAiResponse() {
  if (typeof document === 'undefined') return false;
  const respEl = document.getElementById('ai-dhikr-response-input');
  const raw = respEl ? respEl.value : '';
  const res = parseAndValidateAiResponse(raw);

  if (!res.ok) {
    const msg = formatAcceptError(res);
    setFeedback(msg, 'error');
    showToast(msg);
    return false;
  }

  let session = getEditorSession();
  if (!session) {
    await openEditor('new');
    session = getEditorSession();
  }

  const baseId = Date.now();
  const freshPages = res.data.pages.map((p, idx) => ({
    id: baseId + idx + 1,
    arabic: p.arabic,
    latin: p.latin,
    translation: p.translation,
    reference: p.reference,
    target: p.target
  }));

  if (isBlankInitialSession(session)) {
    session.name = res.data.name;
    session.pages = freshPages;
  } else {
    if (!session.name || !session.name.trim()) session.name = res.data.name;
    session.pages.push(...freshPages);
  }

  renderEditor();
  closeAiDzikirModal(false);
  showToast(t('ai_toast_accepted', { count: freshPages.length }));
  return true;
}
