/* ========================================================================= */
/* --- TasbihKu M3 Expressive Toast / Snackbar System (src/ui/toast.js) --- */
/* ========================================================================= */

let toastTimeoutId = null;

/**
 * Display an M3 Expressive Snackbar / Toast notification with optional action (e.g. Undo).
 * @param {string} message - Message text
 * @param {string|null} actionText - Action button label (e.g. "Undo")
 * @param {Function|null} onAction - Callback executed on action button tap
 * @param {number} duration - Auto-dismiss timeout in ms (default 4000ms)
 */
export function showToast(message, actionText = null, onAction = null, duration = 4000) {
    let container = document.getElementById('m3-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'm3-toast-container';
        container.className = 'm3-toast-container';
        document.body.appendChild(container);
    }

    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
    }

    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'm3-toast';

    const label = document.createElement('span');
    label.className = 'm3-toast-label';
    label.innerText = message;
    toast.appendChild(label);

    if (actionText && typeof onAction === 'function') {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'm3-toast-action';
        actionBtn.innerText = actionText;
        actionBtn.addEventListener('click', () => {
            onAction();
            hideToast();
        });
        toast.appendChild(actionBtn);
    }

    container.appendChild(toast);
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
        toast.classList.add('active');
    });

    toastTimeoutId = setTimeout(() => {
        hideToast();
    }, duration);
}

export function hideToast() {
    const container = document.getElementById('m3-toast-container');
    if (!container) return;
    const toast = container.querySelector('.m3-toast');
    if (toast) {
        toast.classList.remove('active');
        setTimeout(() => {
            if (container.parentNode) {
                container.innerHTML = '';
            }
        }, 300);
    }
}

/**
 * Approved In-App Update Broadcast (Section 3.1)
 */
export const CURRENT_RELEASE_BROADCAST = {
    id: "tasbihku-v1.9.1-enrich-guided-morning-and-even",
    title: "TasbihKu v1.9.1: Pembaruan Dzikir Pagi & Petang Shahih",
    message: "Dzikir pagi dan petang kini diperbarui lengkap sesuai riwayat sunnah shahih (Ayat Kursi utuh tanpa terpotong, Al-Mu'awwidzat 3 Qul 3x, Sayyidul Istighfar, dan doa perlindungan ma'tsur) dengan harakat jelas dan referensi hadis terverifikasi.",
    priority: "normal"
};

/**
 * Broadcast current app release announcement once per user session if not dismissed.
 */
export function checkAndShowReleaseBroadcast() {
    if (!CURRENT_RELEASE_BROADCAST) return;
    const dismissedId = localStorage.getItem('tasbihku_last_broadcast_id');
    if (dismissedId === CURRENT_RELEASE_BROADCAST.id) return;

    setTimeout(() => {
        showToast(CURRENT_RELEASE_BROADCAST.message, 'Info', () => {
            if (typeof window.showPage === 'function') {
                window.showPage('page-about');
            }
        }, 6000);
        localStorage.setItem('tasbihku_last_broadcast_id', CURRENT_RELEASE_BROADCAST.id);
    }, 1500);
}

