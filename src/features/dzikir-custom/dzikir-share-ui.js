import { registerModalOpen, registerModalClose } from '../../app/slots.js';
import { getLocalizedText, t } from '../../shared/i18n.js';
import { saveState, state } from '../../shared/store.js';
import { showToast } from '../../shared/toast.js';
import { renderCustomList } from './dzikir-list.js';
import {
  decodeDzikirPayload,
  encodeDzikirPayload,
  extractDzikirPayloadFromInput,
  regenerateDzikirIds,
  validateDzikirPayload
} from './dzikir-share-codec.js';

let pendingReceiveDzikir = null;

async function copyInputText(elId, toastKey) {
  const el = document.getElementById(elId);
  if (!el || !el.value) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(el.value);
    else { el.select(); document.execCommand('copy'); }
  } catch (_) {
    el.select();
    document.execCommand('copy');
  }
  showToast(t(toastKey));
}

export async function shareCustomDzikir(id) {
  const item = state.customList.find((i) => i.id == id);
  if (!item) return;
  try {
    const token = encodeDzikirPayload(item);
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '/';
    const shareUrl = `${origin}${pathname}#dzikir=${token}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `TasbihKu: ${item.name}`, text: `${item.name} (${item.pages.length} Halaman)`, url: shareUrl });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    openShareDzikirModal(item.name, shareUrl, token);
  } catch (e) {
    console.error('Failed to share dzikir:', e);
    showToast(t('toast_share_error'));
  }
}

export function openShareDzikirModal(title, url, code) {
  const modal = document.getElementById('share-dzikir-modal');
  const titleEl = document.getElementById('share-dzikir-modal-title');
  const linkInput = document.getElementById('share-link-input');
  const codeInput = document.getElementById('share-code-input');
  if (titleEl) titleEl.textContent = title ? `${t('share_dzikir_title')}: ${title}` : t('share_dzikir_title');
  if (linkInput) linkInput.value = url || '';
  if (codeInput) codeInput.value = code || '';
  if (modal) { modal.classList.add('active'); registerModalOpen('share-dzikir-modal', closeShareDzikirModal); }
}

export function closeShareDzikirModal(fromPopstate = false) {
  const modal = document.getElementById('share-dzikir-modal');
  if (modal) modal.classList.remove('active');
  registerModalClose('share-dzikir-modal', fromPopstate);
}

export const copyShareLink = () => copyInputText('share-link-input', 'toast_share_link_copied');
export const copyShareCode = () => copyInputText('share-code-input', 'toast_share_code_copied');

export function openReceiveDzikirModal() {
  const modal = document.getElementById('receive-dzikir-modal');
  const inputView = document.getElementById('receive-modal-input-view');
  const previewView = document.getElementById('receive-modal-preview-view');
  const input = document.getElementById('receive-dzikir-input');
  if (input) input.value = '';
  if (inputView) inputView.style.display = 'block';
  if (previewView) previewView.style.display = 'none';
  pendingReceiveDzikir = null;
  if (modal) { modal.classList.add('active'); registerModalOpen('receive-dzikir-modal', closeReceiveDzikirModal); }
  if (input) input.focus();
}

export function closeReceiveDzikirModal(fromPopstate = false) {
  const modal = document.getElementById('receive-dzikir-modal');
  if (modal) modal.classList.remove('active');
  pendingReceiveDzikir = null;
  registerModalClose('receive-dzikir-modal', fromPopstate);
}

export function backToReceiveInput() {
  const inputView = document.getElementById('receive-modal-input-view');
  const previewView = document.getElementById('receive-modal-preview-view');
  if (inputView) inputView.style.display = 'block';
  if (previewView) previewView.style.display = 'none';
  pendingReceiveDzikir = null;
}

export function previewDzikirFromInput() {
  const rawVal = document.getElementById('receive-dzikir-input')?.value || '';
  const token = extractDzikirPayloadFromInput(rawVal);
  if (!token) return showToast(t('modal_invalid_dzikir_code'));
  try {
    const validation = validateDzikirPayload(decodeDzikirPayload(token));
    if (!validation.valid) return showToast(t('modal_invalid_dzikir_code'));
    showReceivePreview(validation.sanitized);
  } catch (_) {
    showToast(t('modal_invalid_dzikir_code'));
  }
}

export function showReceivePreview(sanitizedData) {
  pendingReceiveDzikir = sanitizedData;
  const modal = document.getElementById('receive-dzikir-modal');
  const inputView = document.getElementById('receive-modal-input-view');
  const previewView = document.getElementById('receive-modal-preview-view');
  const nameEl = document.getElementById('receive-preview-name');
  const subEl = document.getElementById('receive-preview-subtitle');
  const listEl = document.getElementById('receive-preview-list');

  if (nameEl) nameEl.textContent = sanitizedData.name;
  const totalTarget = sanitizedData.pages.reduce((acc, p) => acc + (p.target || 0), 0);
  if (subEl) subEl.textContent = t('receive_preview_subtitle', { pages: sanitizedData.pages.length, target: totalTarget });
  if (listEl) {
    listEl.innerHTML = '';
    sanitizedData.pages.forEach((p, idx) => {
      const card = document.createElement('div');
      card.style.cssText = 'background: rgba(255,255,255,0.04); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 8px; padding: 10px 12px; font-size: 0.9rem;';
      const headerRow = document.createElement('div');
      headerRow.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: 600; color: var(--md-sys-color-primary); font-size: 0.8rem;';
      const pageNum = document.createElement('span'); pageNum.textContent = `#${idx + 1}`;
      const targetSpan = document.createElement('span'); targetSpan.textContent = `${p.target}x`;
      headerRow.appendChild(pageNum); headerRow.appendChild(targetSpan); card.appendChild(headerRow);
      if (p.arabic) { const el = document.createElement('div'); el.dir = 'rtl'; el.style.cssText = 'font-size: 1.15rem; font-family: "Amiri", serif; margin-bottom: 4px; line-height: 1.4;'; el.textContent = p.arabic; card.appendChild(el); }
      if (p.latin) { const el = document.createElement('div'); el.style.cssText = 'font-style: italic; opacity: 0.85; font-size: 0.85rem; margin-bottom: 2px;'; el.textContent = p.latin; card.appendChild(el); }
      const transText = getLocalizedText(p.translation, state.language || 'id');
      if (transText) { const el = document.createElement('div'); el.style.cssText = 'opacity: 0.7; font-size: 0.8rem;'; el.textContent = transText; card.appendChild(el); }
      listEl.appendChild(card);
    });
  }
  if (inputView) inputView.style.display = 'none';
  if (previewView) previewView.style.display = 'flex';
  if (modal) modal.classList.add('active');
}

export function confirmSaveReceivedDzikir() {
  if (!pendingReceiveDzikir) return;
  const freshItem = regenerateDzikirIds(pendingReceiveDzikir);
  if (!Array.isArray(state.customList)) state.customList = [];
  state.customList.push(freshItem);
  saveState();
  renderCustomList();
  closeReceiveDzikirModal();
  showToast(t('toast_dzikir_imported', { name: freshItem.name }));
  pendingReceiveDzikir = null;
}

export function handleSharedDzikirDeepLink(token) {
  if (!token) return false;
  const cleanToken = extractDzikirPayloadFromInput(token) || token;
  try {
    const validation = validateDzikirPayload(decodeDzikirPayload(cleanToken));
    if (validation.valid) { showReceivePreview(validation.sanitized); return true; }
    showToast(t('modal_invalid_dzikir_code'));
    return false;
  } catch (_) {
    showToast(t('modal_invalid_dzikir_code'));
    return false;
  }
}
