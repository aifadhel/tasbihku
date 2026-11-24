import { dispatch } from '../../app/command-bus.js';
import { t } from '../../shared/i18n.js';
import { saveState, state } from '../../shared/store.js';

function createEmptyCard() {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'custom-dzikir-empty-card';
  const emptyIcon = document.createElement('div');
  emptyIcon.style.cssText = 'color: var(--md-sys-color-primary); opacity: 0.8;';
  emptyIcon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#icon-27"></use></svg>';
  const emptySpan = document.createElement('span');
  emptySpan.className = 'text-sub body-medium';
  emptySpan.textContent = t('custom_empty_hint') || 'Belum ada dzikir custom tersimpan.';
  const btn = document.createElement('button');
  btn.className = 'm3-btn-action';
  btn.style.marginTop = '4px';
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg><span>${t('create_new')}</span>`;
  btn.onclick = () => dispatch('dzikir:open-editor', { type: 'new' }).catch(() => {});
  emptyDiv.appendChild(emptyIcon);
  emptyDiv.appendChild(emptySpan);
  emptyDiv.appendChild(btn);
  return emptyDiv;
}

export function renderCustomList() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('custom-list-container');
  if (!container) return;
  container.innerHTML = '';

  if (!state.customList || state.customList.length === 0) {
    container.appendChild(createEmptyCard());
    return;
  }

  state.customList.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'custom-dzikir-card';

    const topRow = document.createElement('div');
    topRow.className = 'custom-dzikir-card-top';
    topRow.setAttribute('role', 'button');
    topRow.setAttribute('tabindex', '0');
    topRow.setAttribute('aria-label', `${item.name} - ${t('btn_launch_dzikir')}`);
    const launch = () => dispatch('dzikir:start-player', { type: 'custom', id: item.id }).catch(() => {});
    topRow.onclick = launch;
    topRow.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); launch(); }
    };

    const infoDiv = document.createElement('div');
    infoDiv.className = 'custom-dzikir-info';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'custom-dzikir-title';
    nameSpan.textContent = item.name;

    const totalTarget = (item.pages || []).reduce((a, c) => a + (c.target || 0), 0);
    const metaDiv = document.createElement('div');
    metaDiv.className = 'custom-dzikir-meta';

    const pagesChip = document.createElement('span');
    pagesChip.className = 'custom-dzikir-meta-chip';
    pagesChip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg><span>${item.pages.length} Halaman</span>`;

    const targetChip = document.createElement('span');
    targetChip.className = 'custom-dzikir-meta-chip';
    targetChip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg><span>Target: ${totalTarget}</span>`;

    metaDiv.appendChild(pagesChip);
    metaDiv.appendChild(targetChip);
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(metaDiv);

    const playBadge = document.createElement('div');
    playBadge.className = 'custom-dzikir-play-badge';
    playBadge.setAttribute('aria-hidden', 'true');
    playBadge.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><use href="#icon-22"></use></svg>';
    topRow.appendChild(infoDiv);
    topRow.appendChild(playBadge);

    const toolbar = document.createElement('div');
    toolbar.className = 'custom-dzikir-toolbar';

    const mkBtn = (cls, aria, title, icon, onClick) => {
      const b = document.createElement('button');
      b.className = cls;
      b.setAttribute('aria-label', aria);
      b.setAttribute('title', title);
      b.innerHTML = icon;
      b.onclick = (e) => { e.stopPropagation(); onClick(); };
      return b;
    };

    toolbar.appendChild(mkBtn(
      'btn-tonal-mini',
      `${t('btn_share_dzikir')} ${item.name}`,
      t('btn_share_dzikir') || 'Bagikan Dzikir',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#icon-34"></use></svg>',
      () => dispatch('dzikir:share', { id: item.id }).catch(() => {})
    ));
    toolbar.appendChild(mkBtn(
      'btn-tonal-mini',
      `Edit ${item.name}`,
      'Edit',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
      () => dispatch('dzikir:open-editor', { type: 'custom', id: item.id }).catch(() => {})
    ));
    toolbar.appendChild(mkBtn(
      'btn-tonal-mini btn-danger-mini',
      `${t('btn_delete')} ${item.name}`,
      t('btn_delete') || 'Hapus',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>',
      () => dispatch('ui:show-modal', {
        title: t('modal_delete_dzikir_title'),
        message: t('modal_delete_dzikir_msg', { name: item.name }),
        onYes: () => { state.customList.splice(index, 1); saveState(); renderCustomList(); }
      }).catch(() => {})
    ));

    card.appendChild(topRow);
    card.appendChild(toolbar);
    container.appendChild(card);
  });
}
