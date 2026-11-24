import { useCapability } from '../../app/slots.js';
import azkarData from '../../data/azkar.json';
import { getLocalizedText, t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';
import { toggleHabitNumericalFields } from './habits-log-modal.js';
import { requestNotificationPermissionAndRegister } from './habits-reminders.js';

export function toggleScheduleDaysView(val) {
  if (typeof document === 'undefined') return;
  const setDisp = (id, show) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'flex' : 'none';
  };
  setDisp('habit-schedule-days-container', val === 'specific');
  setDisp('habit-schedule-weekly-container', val === 'weekly');
  setDisp('habit-schedule-interval-container', val === 'interval');
}

export function applyPreset(presetType) {
  const presets = {
    tilawah: { name: t('preset_tilawah_name'), desc: t('preset_tilawah_desc'), routine: 'anytime', numerical: true, targetVal: 1, targetUnit: 'juz', color: '#8cd6b5' },
    dhuha: { name: t('preset_dhuha_name'), desc: t('preset_dhuha_desc'), routine: 'pagi', numerical: true, targetVal: 2, targetUnit: 'rakaat', color: '#dcc48c' },
    sedekah: { name: t('preset_sedekah_name'), desc: t('preset_sedekah_desc'), routine: 'pagi', numerical: false, targetVal: 1, targetUnit: 'kali', color: '#ff8a65' },
    tahajjud: { name: t('preset_tahajjud_name'), desc: t('preset_tahajjud_desc'), routine: 'malam', numerical: true, targetVal: 2, targetUnit: 'rakaat', color: '#4fc3f7' }
  };
  const data = presets[presetType];
  if (!data || typeof document === 'undefined') return;

  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('habit-input-name', data.name);
  setVal('habit-input-desc', data.desc);
  setVal('habit-input-routine', data.routine);
  setVal('habit-input-target-val', data.targetVal);
  setVal('habit-input-target-unit', data.targetUnit);
  const chk = document.getElementById('habit-input-numerical');
  if (chk) { chk.checked = data.numerical; toggleHabitNumericalFields(data.numerical); }

  const dot = document.querySelector(`.color-picker-dot[data-color="${data.color}"]`);
  if (dot) {
    document.querySelectorAll('.color-picker-dot').forEach((el) => el.classList.remove('active'));
    dot.classList.add('active');
  }
}

export function populateLinkedDzikirSelect() {
  const select = document.getElementById('habit-input-linked-dzikir');
  if (!select) return;
  select.innerHTML = `<option value="">Tidak ada link (Manual)</option><option value="guided-pagi">☀️ Sesi Dzikir Pagi</option><option value="guided-petang">🌙 Sesi Dzikir Petang</option><option value="guided-wirid">📿 Sesi Wirid Ba'da Shalat</option>`;
  if (Array.isArray(azkarData)) {
    const grp = document.createElement('optgroup');
    grp.label = 'Pustaka Azkar';
    azkarData.forEach((z) => {
      const opt = document.createElement('option');
      opt.value = `library-${z.id}`; opt.textContent = `📿 ${getLocalizedText(z.name)}`;
      grp.appendChild(opt);
    });
    select.appendChild(grp);
  }
  if (state.customAzkar && state.customAzkar.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = 'Dzikir Custom Anda';
    state.customAzkar.forEach((z) => {
      const opt = document.createElement('option');
      opt.value = `custom-${z.id}`; opt.textContent = `✏️ ${getLocalizedText(z.name)}`;
      grp.appendChild(opt);
    });
    select.appendChild(grp);
  }
}

export function attachHabitModalListeners() {
  const presetBox = document.querySelector('.habit-preset-container');
  if (presetBox && !presetBox.dataset.hasListener) {
    presetBox.dataset.hasListener = 'true';
    presetBox.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (btn) applyPreset(btn.dataset.preset);
    });
  }
  const picker = document.getElementById('habit-color-picker');
  if (picker && !picker.dataset.hasListener) {
    picker.dataset.hasListener = 'true';
    picker.addEventListener('click', (e) => {
      const dot = e.target.closest('.color-picker-dot');
      if (!dot) return;
      document.querySelectorAll('.color-picker-dot').forEach((el) => el.classList.remove('active'));
      dot.classList.add('active');
    });
  }
  const chk = document.getElementById('habit-input-reminder-enabled');
  if (chk) {
    chk.onchange = (e) => {
      const tEl = document.getElementById('habit-input-reminder-time');
      if (tEl) tEl.style.display = e.target.checked ? 'block' : 'none';
      if (e.target.checked) requestNotificationPermissionAndRegister();
    };
  }
}

export function populateHabitForm(mode, habit) {
  const core = useCapability('habitsCore');
  const todayStr = core ? core.getLocalDateString() : new Date().toISOString().slice(0, 10);
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const setDisp = (id, d) => { const el = document.getElementById(id); if (el) el.style.display = d; };

  document.querySelectorAll('.color-picker-dot').forEach((el) => el.classList.remove('active'));
  const targetColor = mode === 'edit' && habit?.color ? habit.color : '#8cd6b5';
  const dot = document.querySelector(`.color-picker-dot[data-color="${targetColor}"]`) || document.querySelector('.color-picker-dot[data-color="#8cd6b5"]');
  if (dot) dot.classList.add('active');

  if (mode === 'new') {
    setText('habit-modal-title', 'Tambah Kebiasaan');
    setVal('habit-input-name', ''); setVal('habit-input-desc', ''); setVal('habit-input-tags', '');
    setDisp('habit-btn-delete', 'none'); setDisp('habit-btn-archive', 'none');
    setVal('habit-input-routine', 'anytime'); setVal('habit-input-linked-dzikir', '');
    const numChk = document.getElementById('habit-input-numerical');
    if (numChk) numChk.checked = false;
    toggleHabitNumericalFields(false);
    setVal('habit-input-target-val', 100); setVal('habit-input-target-unit', 'kali');
    setVal('habit-schedule-type', 'daily'); toggleScheduleDaysView('daily');
    document.querySelectorAll('.habit-day-chk').forEach((c) => { c.checked = true; });
    setVal('habit-input-weekly-target', 3);
    const wLbl = document.getElementById('weekly-target-label');
    if (wLbl) wLbl.innerText = `3 ${t('habit_kali')}`;
    setVal('habit-input-interval-days', 2); setVal('habit-input-anchor-date', todayStr);
    const rChk = document.getElementById('habit-input-reminder-enabled');
    if (rChk) rChk.checked = false;
    setVal('habit-input-reminder-time', '08:00'); setDisp('habit-input-reminder-time', 'none');
    return;
  }

  if (!habit) return;
  setText('habit-modal-title', 'Edit Kebiasaan');
  setVal('habit-input-name', habit.name); setVal('habit-input-desc', habit.description || '');
  setVal('habit-input-tags', habit.tags ? habit.tags.join(', ') : '');
  setDisp('habit-btn-delete', 'block');
  const archBtn = document.getElementById('habit-btn-archive');
  if (archBtn) { archBtn.style.display = habit.archived ? 'none' : 'block'; archBtn.textContent = habit.archived ? 'Pulihkan' : 'Arsipkan'; }
  const numChk = document.getElementById('habit-input-numerical');
  if (numChk) numChk.checked = Boolean(habit.isNumerical);
  toggleHabitNumericalFields(Boolean(habit.isNumerical));
  setVal('habit-input-target-val', habit.targetValue || 100);
  setVal('habit-input-target-unit', habit.targetUnit || 'kali');
  const schedType = habit.scheduleType || 'daily';
  setVal('habit-schedule-type', schedType); toggleScheduleDaysView(schedType);
  const schedDays = habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6];
  document.querySelectorAll('.habit-day-chk').forEach((c) => { c.checked = schedDays.includes(parseInt(c.value, 10)); });
  setVal('habit-input-weekly-target', habit.weeklyTarget || 3);
  const wLbl = document.getElementById('weekly-target-label');
  if (wLbl) wLbl.innerText = `${habit.weeklyTarget || 3} ${t('habit_kali')}`;
  setVal('habit-input-interval-days', habit.intervalDays || 2);
  setVal('habit-input-anchor-date', habit.anchorDate || todayStr);
  const rChk = document.getElementById('habit-input-reminder-enabled');
  if (rChk) rChk.checked = Boolean(habit.reminderEnabled);
  setVal('habit-input-reminder-time', habit.reminderTime || '08:00');
  setDisp('habit-input-reminder-time', habit.reminderEnabled ? 'block' : 'none');
  setVal('habit-input-routine', habit.routineSection || 'anytime');
  setVal('habit-input-linked-dzikir', habit.linkedDzikirId || '');
}
