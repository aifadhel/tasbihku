import { dispatch } from '../../app/command-bus.js';
import { registerModalOpen, registerModalClose } from '../../app/slots.js';
import azkarData from '../../data/azkar.json';
import { getLocalizedText, t } from '../../shared/i18n.js';
import { saveState, state } from '../../shared/store.js';
import { showToast } from '../../shared/toast.js';
import { getEditorSession, renderEditor } from './dzikir-editor.js';

let tempCustomTranslations = { id: '', en: '' };
let lastDeletedCustomAzkar = null;

function buildLibraryCard(zkr, title, subText, customIndex = null) {
  const card = document.createElement('div');
  card.style.cssText = customIndex === null
    ? 'background: var(--md-sys-color-surface-variant); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;'
    : 'background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s; position: relative;';
  card.innerHTML = `<div style="font-weight: bold; margin-bottom: 4px;">${title}</div><div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" dir="rtl">${subText}</div>`;
  if (customIndex !== null) {
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-icon';
    delBtn.style.cssText = 'position: absolute; top: 8px; right: 8px; background: transparent; color: var(--md-sys-color-error);';
    delBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>';
    delBtn.onclick = (e) => { e.stopPropagation(); deleteCustomAzkar(customIndex); };
    card.appendChild(delBtn);
  }
  card.onclick = () => { addFromLibrary(zkr); closeLibraryModal(); };
  return card;
}

function appendCustomAzkarSection(listContainer, items) {
  if (!items || items.length === 0) return;
  const separator = document.createElement('div');
  separator.style.cssText = 'height: 1px; background: var(--md-sys-color-outline); opacity: 0.2; margin: 8px 0;';
  listContainer.appendChild(separator);
  const label = document.createElement('span');
  label.className = 'label-large text-sub';
  label.textContent = 'Dzikir Custom Anda';
  listContainer.appendChild(label);
  items.forEach(({ zkr, idx }) => {
    listContainer.appendChild(buildLibraryCard(zkr, zkr.name, zkr.arabic || '-', idx));
  });
}

export async function showLibraryModal() {
  if (typeof document === 'undefined') return;
  try {
    const searchInput = document.getElementById('library-search-input');
    if (searchInput) searchInput.value = '';
    const listContainer = document.getElementById('library-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    azkarData.forEach((zkr) => {
      const zkrName = getLocalizedText(zkr.name, state.language || 'id');
      listContainer.appendChild(buildLibraryCard(zkr, zkrName, zkr.arabic, null));
    });
    if (state.customAzkar && state.customAzkar.length > 0) {
      appendCustomAzkarSection(listContainer, state.customAzkar.map((zkr, idx) => ({ zkr, idx })));
    }
    const modal = document.getElementById('library-modal');
    if (modal) { modal.classList.add('active'); registerModalOpen('library-modal', closeLibraryModal); }
  } catch (e) {
    console.error('Failed to load Azkar Library', e);
    dispatch('ui:show-modal', { title: 'Error', message: t('modal_library_load_error'), isAlert: true }).catch(() => {});
  }
}

export function closeLibraryModal(fromPopstate = false) {
  const modal = typeof document !== 'undefined' ? document.getElementById('library-modal') : null;
  if (modal) modal.classList.remove('active');
  registerModalClose('library-modal', fromPopstate);
}

export function addFromLibrary(zkr) {
  const session = getEditorSession();
  if (!session) return;
  const transVal = typeof zkr.translation === 'object' && zkr.translation !== null
    ? { id: zkr.translation.id || '', en: zkr.translation.en || '' }
    : { id: zkr.translation || '', en: '' };
  session.pages.push({
    id: Date.now() + Math.random(),
    arabic: zkr.arabic || '',
    latin: zkr.latin || '',
    translation: transVal,
    reference: zkr.reference || '',
    target: zkr.target || 33
  });
  renderEditor();
}

export function openCustomAzkarModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('custom-azkar-modal');
  if (!modal) return;
  document.getElementById('custom-azkar-name').value = '';
  document.getElementById('custom-azkar-arabic').value = '';
  document.getElementById('custom-azkar-latin').value = '';
  document.getElementById('custom-azkar-target').value = 33;
  tempCustomTranslations = { id: '', en: '' };

  const langSelect = document.getElementById('custom-azkar-trans-lang');
  const transTextarea = document.getElementById('custom-azkar-translation');
  const activeLang = state.language || 'id';
  if (langSelect) langSelect.value = activeLang;
  if (transTextarea) {
    transTextarea.value = '';
    transTextarea.oninput = (e) => { tempCustomTranslations[langSelect ? langSelect.value : activeLang] = e.target.value; };
  }
  if (langSelect) {
    langSelect.onchange = (e) => { if (transTextarea) transTextarea.value = tempCustomTranslations[e.target.value] || ''; };
  }
  modal.classList.add('active');
  registerModalOpen('custom-azkar-modal', closeCustomAzkarModal);
}

export function closeCustomAzkarModal(fromPopstate = false) {
  const modal = typeof document !== 'undefined' ? document.getElementById('custom-azkar-modal') : null;
  if (modal) modal.classList.remove('active');
  registerModalClose('custom-azkar-modal', fromPopstate);
}

export function saveCustomAzkar() {
  const name = document.getElementById('custom-azkar-name')?.value.trim() || '';
  const arabic = document.getElementById('custom-azkar-arabic')?.value.trim() || '';
  const latin = document.getElementById('custom-azkar-latin')?.value.trim() || '';
  const target = parseInt(document.getElementById('custom-azkar-target')?.value || '33', 10) || 33;
  const transTextarea = document.getElementById('custom-azkar-translation');
  const langSelect = document.getElementById('custom-azkar-trans-lang');
  if (transTextarea && langSelect) tempCustomTranslations[langSelect.value] = transTextarea.value;
  if (!name) {
    dispatch('ui:show-modal', { title: 'Error', message: t('modal_azkar_name_empty'), isAlert: true }).catch(() => {});
    return;
  }
  if (!state.customAzkar) state.customAzkar = [];
  state.customAzkar.push({
    name, arabic, latin, target,
    translation: { id: tempCustomTranslations.id || '', en: tempCustomTranslations.en || '' }
  });
  saveState();
  closeCustomAzkarModal();
  showLibraryModal();
}

export function deleteCustomAzkar(index) {
  if (!state.customAzkar || !state.customAzkar[index]) return;
  lastDeletedCustomAzkar = { item: state.customAzkar[index], index };
  state.customAzkar.splice(index, 1);
  saveState();
  showLibraryModal();
  showToast(t('modal_azkar_deleted') || 'Azkar dihapus', t('btn_undo') || 'Undo', () => undoDeleteCustomAzkar());
}

export function undoDeleteCustomAzkar() {
  if (!lastDeletedCustomAzkar || !lastDeletedCustomAzkar.item) return;
  if (!state.customAzkar) state.customAzkar = [];
  state.customAzkar.splice(lastDeletedCustomAzkar.index, 0, lastDeletedCustomAzkar.item);
  saveState();
  showLibraryModal();
  lastDeletedCustomAzkar = null;
}

export function filterLibrary(query) {
  if (typeof document === 'undefined') return;
  const listContainer = document.getElementById('library-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';
  const lower = (query || '').toLowerCase().trim();
  const matches = (zkr, zName) =>
    (zName && zName.toLowerCase().includes(lower)) ||
    (zkr.arabic && zkr.arabic.toLowerCase().includes(lower)) ||
    (zkr.latin && zkr.latin.toLowerCase().includes(lower));

  azkarData.forEach((zkr) => {
    const zName = getLocalizedText(zkr.name, state.language || 'id');
    if (matches(zkr, zName)) listContainer.appendChild(buildLibraryCard(zkr, zName, zkr.arabic, null));
  });
  if (state.customAzkar && state.customAzkar.length > 0) {
    const filteredCustom = state.customAzkar.map((zkr, idx) => ({ zkr, idx })).filter(({ zkr }) => matches(zkr, zkr.name));
    appendCustomAzkarSection(listContainer, filteredCustom);
  }
}
