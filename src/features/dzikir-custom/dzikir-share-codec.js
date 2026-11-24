import { getLocalizedText } from '../../shared/i18n.js';

function normalizePortableField(val) {
  if (val && typeof val === 'object') {
    const id = val.id ? String(val.id).trim() : '';
    const en = val.en ? String(val.en).trim() : '';
    return (id || en) ? { id, en } : '';
  }
  return val ? String(val).trim() : '';
}

function sanitizeField(val, maxLen) {
  if (val && typeof val === 'object') {
    return {
      id: (val.id ? String(val.id).trim() : '').slice(0, maxLen),
      en: (val.en ? String(val.en).trim() : '').slice(0, maxLen)
    };
  }
  return val ? String(val).trim().slice(0, maxLen) : '';
}

export function encodeDzikirPayload(item) {
  if (!item || !item.name || !Array.isArray(item.pages)) {
    throw new Error('Invalid item structure');
  }
  const rawName = typeof item.name === 'object' && item.name !== null
    ? (getLocalizedText(item.name) || '')
    : String(item.name).trim();

  const portableData = {
    v: 1,
    type: 'tasbihku_dzikir',
    name: rawName,
    pages: item.pages.map((p) => ({
      arabic: p.arabic ? String(p.arabic).trim() : '',
      latin: p.latin ? String(p.latin).trim() : '',
      translation: normalizePortableField(p.translation),
      reference: normalizePortableField(p.reference),
      target: Math.max(1, parseInt(p.target, 10) || 33)
    }))
  };
  const utf8Bytes = new TextEncoder().encode(JSON.stringify(portableData));
  let binStr = '';
  for (let i = 0; i < utf8Bytes.length; i++) binStr += String.fromCharCode(utf8Bytes[i]);
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeDzikirPayload(token) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('Empty or invalid token');
  let base64 = token.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function extractDzikirPayloadFromInput(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && (parsed.type === 'tasbihku_dzikir' || (parsed.name && Array.isArray(parsed.pages)))) {
        return encodeDzikirPayload(parsed);
      }
    } catch (_) {}
  }
  const hashMatch = trimmed.match(/#dzikir=([A-Za-z0-9_-]+)/);
  if (hashMatch && hashMatch[1]) return hashMatch[1];
  const queryMatch = trimmed.match(/[?&]dzikir=([A-Za-z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) return queryMatch[1];
  const rawMatch = trimmed.match(/^[A-Za-z0-9_-]{8,}$/);
  return rawMatch ? rawMatch[0] : null;
}

export function validateDzikirPayload(payload) {
  if (!payload || typeof payload !== 'object') return { valid: false, reason: 'Payload must be an object' };
  if (payload.type && payload.type !== 'tasbihku_dzikir') return { valid: false, reason: 'Invalid payload type' };
  if (!payload.name || (typeof payload.name !== 'string' && typeof payload.name !== 'object')) {
    return { valid: false, reason: 'Dzikir name is required' };
  }
  const rawName = typeof payload.name === 'object' && payload.name !== null
    ? (getLocalizedText(payload.name) || '')
    : String(payload.name).trim();
  if (!rawName) return { valid: false, reason: 'Dzikir name is required' };
  if (!Array.isArray(payload.pages) || payload.pages.length === 0) {
    return { valid: false, reason: 'Pages must be a non-empty array' };
  }
  if (payload.pages.length > 50) return { valid: false, reason: 'Too many pages (max 50)' };

  for (let i = 0; i < payload.pages.length; i++) {
    const p = payload.pages[i];
    if (!p || typeof p !== 'object') return { valid: false, reason: `Page ${i + 1} is invalid` };
    const hasTrans = p.translation && typeof p.translation === 'object'
      ? Boolean((p.translation.id && String(p.translation.id).trim()) || (p.translation.en && String(p.translation.en).trim()))
      : Boolean(p.translation && String(p.translation).trim());
    const hasContent = Boolean((p.arabic && String(p.arabic).trim()) || (p.latin && String(p.latin).trim()) || hasTrans);
    if (!hasContent) return { valid: false, reason: `Page ${i + 1} must contain arabic, latin, or translation` };
  }

  return {
    valid: true,
    sanitized: {
      name: rawName.slice(0, 100),
      pages: payload.pages.map((p) => ({
        arabic: (p.arabic ? String(p.arabic).trim() : '').slice(0, 1000),
        latin: (p.latin ? String(p.latin).trim() : '').slice(0, 1000),
        translation: sanitizeField(p.translation, 1000),
        reference: sanitizeField(p.reference, 200),
        target: Math.max(1, Math.min(99999, parseInt(p.target, 10) || 33))
      }))
    }
  };
}

export function regenerateDzikirIds(item) {
  const baseId = Date.now();
  return {
    id: baseId,
    name: typeof item.name === 'object' && item.name !== null ? (getLocalizedText(item.name) || '') : item.name,
    pages: item.pages.map((p, idx) => {
      let translation = p.translation;
      if (typeof translation === 'string') translation = { id: translation, en: '' };
      else if (!translation || typeof translation !== 'object') translation = { id: '', en: '' };
      else translation = { id: translation.id || '', en: translation.en || '' };
      return {
        id: baseId + idx + 1,
        arabic: p.arabic || '',
        latin: p.latin || '',
        translation,
        reference: p.reference || '',
        target: p.target || 33
      };
    })
  };
}
