/* ========================================================================= */
/* --- TasbihKu Media API Module (src/hardware/media.js) --- */
/* ========================================================================= */

import { state, saveState } from '../core/store.js';

let audioCtx = null;
let soundBuffer = null;
let soundConfig = null;
let validSoundKeys = [];
let soundSystemFailed = false;

export async function initSoundSystem() {
    if (audioCtx) return;
    if (soundSystemFailed) return;

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Fetch configuration and audio file concurrently
        const [configRes, audioRes] = await Promise.all([
            fetch('./config.json'),
            fetch('./sound.ogg')
        ]);

        soundConfig = await configRes.json();
        const arrayBuffer = await audioRes.arrayBuffer();
        soundBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // Filter keys: IDs 1-40 are usually standard alphabet keys
        validSoundKeys = Object.keys(soundConfig.defines).filter(k => parseInt(k) >= 1 && parseInt(k) <= 40);

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

    if (!soundBuffer || validSoundKeys.length === 0) return;

    // Pick a random key sound for natural variance
    const randomId = validSoundKeys[Math.floor(Math.random() * validSoundKeys.length)];
    const [startMs, durationMs] = soundConfig.defines[randomId];

    const source = audioCtx.createBufferSource();
    source.buffer = soundBuffer;
    source.connect(audioCtx.destination);
    source.start(0, startMs / 1000, durationMs / 1000);
}

export function updateSoundToggleUI(enabled, status = 'ok') {
    const toggleEl = document.getElementById('toggle-sound');
    const hintEl = document.getElementById('sound-device-hint');
    if (!toggleEl) return;

    if (status === 'blocked' || status === 'unsupported') {
        toggleEl.checked = false;
        state.soundEnabled = false;
        if (hintEl) {
            hintEl.textContent = status === 'unsupported'
                ? 'Browser ini tidak mendukung audio.'
                : 'Audio diblokir oleh browser.';
            hintEl.style.display = 'block';
        }
        saveState();
    } else {
        if (hintEl) hintEl.style.display = 'none';
    }
}

export function isVibrationSupported() {
    return 'vibrate' in navigator;
}

export function applyVibrationCapability() {
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

let soundHintTimeout = null;
export function showSoundHint() {
    const hintEl = document.getElementById('sound-device-hint');
    if (!hintEl) return;
    clearTimeout(soundHintTimeout);
    hintEl.textContent = 'Tidak terdengar? Periksa volume & silent mode hp Anda.';
    hintEl.style.display = 'block';
    
    soundHintTimeout = setTimeout(() => {
        hintEl.style.display = 'none';
    }, 5000);
}

export function vibrate(pattern = 15) {
    if (state.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Initialize audio engine on the first click
document.addEventListener('click', () => {
    if (!audioCtx) initSoundSystem();
}, { once: true });
