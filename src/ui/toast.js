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
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
    }
}
