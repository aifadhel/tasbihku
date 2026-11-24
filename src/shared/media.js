import { state, saveState } from './store.js';
import { t } from './i18n.js';

let audioCtx = null;
let soundBuffer = null;
let soundConfig = null;
let validSoundKeys = [];
let soundSystemFailed = false;
let soundHintTimeout = null;

export function isSoundSystemFailed() {
  return soundSystemFailed;
}

export async function initSoundSystem() {
  if (audioCtx || soundSystemFailed || typeof window === 'undefined') return;
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextCtor();
    const [configRes, audioRes] = await Promise.all([fetch('./config.json'), fetch('./sound.ogg')]);
    soundConfig = await configRes.json();
    const arrayBuffer = await audioRes.arrayBuffer();
    soundBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    validSoundKeys = Object.keys(soundConfig.defines).filter((k) => parseInt(k, 10) >= 1 && parseInt(k, 10) <= 40);
    if (validSoundKeys.length === 0) validSoundKeys = Object.keys(soundConfig.defines);
  } catch (err) {
    console.error('Audio system failed to load:', err);
    soundSystemFailed = true;
    updateSoundToggleUI(false, 'blocked');
  }
}

export function playTapSound() {
  if (!state.soundEnabled) return;
  if (!audioCtx) initSoundSystem();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      soundSystemFailed = true;
      updateSoundToggleUI(false, 'blocked');
    });
  }
  if (!soundBuffer || validSoundKeys.length === 0) {
    playSynthesizedTone(520, 0.04, 'sine');
    return;
  }
  const randomId = validSoundKeys[Math.floor(Math.random() * validSoundKeys.length)];
  const [startMs, durationMs] = soundConfig.defines[randomId];
  const source = audioCtx.createBufferSource();
  source.buffer = soundBuffer;
  source.connect(audioCtx.destination);
  source.start(0, startMs / 1000, durationMs / 1000);
}

export function updateSoundToggleUI(enabled, status = 'ok') {
  if (typeof document === 'undefined') return;
  const toggleEl = document.getElementById('toggle-sound');
  const hintEl = document.getElementById('sound-device-hint');
  if (!toggleEl) return;

  if (status === 'blocked' || status === 'unsupported') {
    toggleEl.checked = false;
    state.soundEnabled = false;
    if (hintEl) {
      hintEl.textContent = status === 'unsupported'
        ? t('hint_audio_unsupported')
        : t('hint_audio_blocked');
      hintEl.style.display = 'block';
    }
    saveState();
  } else if (hintEl) {
    hintEl.style.display = 'none';
  }
}

export function isVibrationSupported() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function applyVibrationCapability() {
  if (typeof document === 'undefined') return;
  const vibRowEl = document.getElementById('vibration-setting-row');
  if (!vibRowEl) return;
  if (!isVibrationSupported()) {
    vibRowEl.style.display = 'none';
    state.vibrationEnabled = false;
    saveState();
  } else {
    vibRowEl.style.display = 'flex';
  }
}

export function showSoundHint() {
  if (typeof document === 'undefined') return;
  const hintEl = document.getElementById('sound-device-hint');
  if (!hintEl) return;
  clearTimeout(soundHintTimeout);
  hintEl.textContent = t('hint_audio_volume');
  hintEl.style.display = 'block';
  soundHintTimeout = setTimeout(() => {
    hintEl.style.display = 'none';
  }, 5000);
}

export function vibrate(pattern = 15) {
  if (state.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function playSynthesizedTone(frequency = 520, duration = 0.05, type = 'sine') {
  if (!state.soundEnabled || typeof window === 'undefined') return;
  if (!audioCtx) {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextCtor();
    } catch (_) {
      return;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

export function playCelebrationTones() {
  if (!state.soundEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => playSynthesizedTone(freq, 0.12, 'sine'), idx * 110);
  });
}

export function triggerMilestoneFeedback(count, targetLimit = 0) {
  if (targetLimit > 0 && count > 0 && count % targetLimit === 0) {
    vibrate([80, 50, 80, 50, 150]);
    playCelebrationTones();
  } else if (count > 0 && (count % 33 === 0 || count % 100 === 0)) {
    vibrate([40, 50, 40]);
    playSynthesizedTone(880, 0.08, 'triangle');
  } else {
    vibrate(15);
    playTapSound();
  }
}

export function initAudioUnlock() {
  if (typeof document === 'undefined') return;
  document.addEventListener('click', () => {
    if (!audioCtx) initSoundSystem();
  }, { once: true });
}
