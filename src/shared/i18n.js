import { state, saveState, updateState } from './store.js';
import coreDict from './i18n-core.json';

export const translations = {
  id: { ...coreDict.id },
  en: { ...coreDict.en }
};

export function registerTranslations(bundle) {
  if (!bundle) return;
  if (bundle.id) Object.assign(translations.id, bundle.id);
  if (bundle.en) Object.assign(translations.en, bundle.en);
}

const featureBundles = import.meta.glob('../features/*/*.i18n.json', { eager: true, import: 'default' });
for (const bundle of Object.values(featureBundles)) {
  registerTranslations(bundle);
}

/**
 * Get translated string for key.
 * @param {string} key
 * @param {Object} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  const lang = state.language || 'id';
  const dict = translations[lang] || translations.id;
  let str = dict[key] || translations.id[key] || key;
  if (params && typeof params === 'object') {
    for (const [paramKey, val] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), val);
    }
  }
  return str;
}

/**
 * Set active application language.
 * @param {'id'|'en'} lang
 */
export function setLanguage(lang) {
  if (lang !== 'id' && lang !== 'en') return;
  updateState({ language: lang });
  saveState();
  applyTranslations();
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }
}

export function getLanguage() {
  return state.language || 'id';
}

export function getLocalizedText(val, lang = state.language || 'id') {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    const text = val[lang] || val.id || val.en || '';
    return text === '[object Object]' ? '' : String(text);
  }
  const str = String(val);
  return str === '[object Object]' ? '' : str;
}

/**
 * Apply translations to DOM elements with data-i18n attributes.
 */
export function applyTranslations() {
  if (typeof document === 'undefined') return;
  const lang = getLanguage();
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.innerText = t(key);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key));
  });

  const langSelect = document.getElementById('select-language');
  if (langSelect && langSelect.value !== lang) langSelect.value = lang;

  const btnId = document.getElementById('lang-btn-id');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnId && btnEn) {
    btnId.classList.toggle('active', lang === 'id');
    btnEn.classList.toggle('active', lang !== 'id');
  }
}
