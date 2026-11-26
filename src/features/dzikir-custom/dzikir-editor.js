import { dispatch } from '../../app/command-bus.js';
import { getLocalizedText, t } from '../../shared/i18n.js';
import { saveState, state } from '../../shared/store.js';
import { SVG_ICONS } from '../../shared/svg-icons.js';
import { renderCustomList } from './dzikir-list.js';

export let editorSession = null;
export let editorType = null;
export let editorId = null;

export function getEditorSession() {
  return editorSession;
}

export async function openEditor(type, id = null) {
  editorType = type;
  editorId = id;
  if (typeof document !== 'undefined') {
    const restoreBtn = document.getElementById('editor-btn-restore');
    if (restoreBtn) restoreBtn.style.display = (type !== 'custom' && type !== 'new') ? 'block' : 'none';
    const nameInput = document.getElementById('editor-input-name');
    if (nameInput) nameInput.disabled = (type !== 'custom' && type !== 'new');
    const aiCard = document.getElementById('editor-ai-card');
    if (aiCard) aiCard.style.display = (type === 'new' || type === 'custom') ? 'flex' : 'none';
  }

  if (type === 'new') {
    editorSession = { id: Date.now(), name: '', pages: [{ id: Date.now() + 1, arabic: '', latin: '', translation: '', reference: '', target: 10 }] };
  } else if (type === 'custom') {
    const existing = state.customList.find((i) => i.id == id);
    editorSession = JSON.parse(JSON.stringify(existing));
  } else {
    const d = await dispatch('dzikir:get-session', { type, id: null });
    editorSession = JSON.parse(JSON.stringify(d));
  }

  renderEditor();
  dispatch('settings:show-page', { arg: 'page-editor' }).catch(() => {});
}

export function renderEditor() {
  if (typeof document === 'undefined' || !editorSession) return;
  const nameInput = document.getElementById('editor-input-name');
  if (nameInput) nameInput.value = editorSession.name;
  const container = document.getElementById('editor-pages-container');
  if (!container) return;
  container.innerHTML = '';

  editorSession.pages.forEach((page, index) => {
    if (!page.id) page.id = Date.now() + Math.random();
    const card = document.createElement('div');
    card.className = 'editor-page-card';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 12px;';
    header.innerHTML = `<span style="font-weight:700; color:var(--md-sys-color-primary);">${t('editor_page_number', { num: index + 1 })}</span>`;
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display: flex; gap: 4px;';
    const mkMoveBtn = (icon, dir) => {
      const b = document.createElement('button');
      b.className = 'btn btn-icon';
      b.style.cssText = 'width: 32px; height: 32px; min-width: 32px;';
      b.innerHTML = icon;
      b.onclick = () => moveEditorPage(index, dir);
      return b;
    };
    if (index > 0) btnGroup.appendChild(mkMoveBtn(SVG_ICONS.arrowUp, -1));
    if (index < editorSession.pages.length - 1) btnGroup.appendChild(mkMoveBtn(SVG_ICONS.arrowDown, 1));
    header.appendChild(btnGroup);
    card.appendChild(header);

    if (typeof page.translation === 'string') page.translation = { id: page.translation, en: '' };
    else if (!page.translation || typeof page.translation !== 'object') page.translation = { id: '', en: '' };

    [
      { key: 'target', label: 'Target Jumlah (*)', type: 'number', val: page.target },
      { key: 'arabic', label: 'Teks Arab', type: 'text', val: page.arabic },
      { key: 'latin', label: 'Teks Latin', type: 'text', val: page.latin },
      { key: 'reference', label: 'Referensi', type: 'text', val: getLocalizedText(page.reference, state.language || 'id') }
    ].forEach((f) => {
      const el = document.createElement('input');
      el.type = f.type;
      el.value = f.val || '';
      el.placeholder = f.label;
      el.oninput = (e) => { page[f.key] = f.type === 'number' ? (parseInt(e.target.value, 10) || 1) : e.target.value; };
      card.appendChild(el);
    });

    const transContainer = document.createElement('div');
    transContainer.style.cssText = 'margin-bottom: 12px; border-top: 1px dashed var(--md-sys-color-outline-variant); padding-top: 8px;';
    const transHeader = document.createElement('div');
    transHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;';
    const transLabel = document.createElement('label');
    transLabel.className = 'label-medium';
    transLabel.style.opacity = '0.8';
    transLabel.textContent = t('custom_azkar_trans_label');

    const transLangSelect = document.createElement('select');
    transLangSelect.style.cssText = 'background: rgba(0,0,0,0.3); border: 1px solid var(--md-sys-color-outline-variant); color: var(--md-sys-color-on-background); border-radius: 6px; padding: 2px 6px; font-size: 0.75rem;';
    transLangSelect.innerHTML = `<option value="id">${t('custom_azkar_trans_lang_id')}</option><option value="en">${t('custom_azkar_trans_lang_en')}</option>`;
    transLangSelect.value = state.language || 'id';

    const transTextarea = document.createElement('textarea');
    transTextarea.placeholder = 'Terjemahan...';
    transTextarea.style.cssText = 'width: 100%; background: var(--md-sys-color-surface-container); border: none; color: var(--md-sys-color-on-background); padding: 10px; border-radius: 8px; font-family: inherit; font-size: 0.9rem; resize: vertical; min-height: 50px; box-sizing: border-box;';
    transTextarea.value = page.translation[transLangSelect.value] || '';
    transTextarea.oninput = (e) => { page.translation[transLangSelect.value] = e.target.value; };
    transLangSelect.onchange = (e) => { transTextarea.value = page.translation[e.target.value] || ''; };

    transHeader.appendChild(transLabel);
    transHeader.appendChild(transLangSelect);
    transContainer.appendChild(transHeader);
    transContainer.appendChild(transTextarea);
    card.appendChild(transContainer);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-icon-edit';
    btnDel.style.cssText = 'background-color: rgba(255, 180, 171, 0.1); color: #ffb4ab; width: 48px; height: 48px; min-width: 48px;';
    btnDel.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>';
    btnDel.onclick = () => {
      if (editorSession.pages.length === 1) {
        dispatch('ui:show-modal', { title: 'Error', message: t('modal_min_1_page'), isAlert: true }).catch(() => {});
        return;
      }
      dispatch('ui:show-modal', {
        title: t('modal_delete_page_title'),
        message: t('modal_delete_page_msg_index', { index: index + 1 }),
        onYes: () => { editorSession.pages.splice(index, 1); renderEditor(); }
      }).catch(() => {});
    };
    actions.appendChild(btnDel);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

export function addEditorPage() {
  if (!editorSession) return;
  editorSession.pages.push({ id: Date.now(), arabic: '', latin: '', translation: '', reference: '', target: 10 });
  renderEditor();
}

export function moveEditorPage(index, dir) {
  const targetIdx = index + dir;
  if (!editorSession || targetIdx < 0 || targetIdx >= editorSession.pages.length) return;
  [editorSession.pages[index], editorSession.pages[targetIdx]] = [editorSession.pages[targetIdx], editorSession.pages[index]];
  renderEditor();
}

export function saveEditorSession() {
  if (!editorSession) return;
  const nameInputEl = document.getElementById('editor-input-name');
  const nameInput = nameInputEl ? nameInputEl.value.trim() : '';
  if (editorType === 'custom' || editorType === 'new') {
    if (!nameInput) {
      dispatch('ui:show-modal', { title: 'Error', message: t('modal_dzikir_name_empty'), isAlert: true }).catch(() => {});
      return;
    }
    editorSession.name = nameInput;
  }
  for (const p of editorSession.pages) {
    if (!p.target || p.target < 1) p.target = 1;
  }
  if (editorType === 'new') state.customList.push(editorSession);
  else if (editorType === 'custom') {
    const idx = state.customList.findIndex((i) => i.id === editorId);
    if (idx >= 0) state.customList[idx] = editorSession;
  } else {
    state.guidedData[editorType] = editorSession.pages;
  }
  saveState();
  renderCustomList();
  dispatch('ui:show-modal', {
    title: t('modal_success'),
    message: t('modal_saved'),
    isAlert: true,
    onYes: () => dispatch('settings:go-back', { fallback: 'page-menu' }).catch(() => {})
  }).catch(() => {});
}

export function confirmRestoreGuided() {
  dispatch('ui:show-modal', {
    title: t('modal_reset_guided_title'),
    message: t('modal_reset_guided_msg'),
    onYes: () => {
      delete state.guidedData[editorType];
      saveState();
      dispatch('ui:show-modal', {
        title: t('modal_success'),
        message: t('modal_success_default'),
        isAlert: true,
        onYes: () => dispatch('settings:go-back', { fallback: 'page-menu' }).catch(() => {})
      }).catch(() => {});
    }
  }).catch(() => {});
}
