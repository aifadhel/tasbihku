let toastTimeoutId = null;

/**
 * Display an M3 Expressive Snackbar / Toast notification with optional action.
 */
export function showToast(message, actionText = null, onAction = null, duration = 4000) {
  if (typeof document === 'undefined') return;
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
  requestAnimationFrame(() => toast.classList.add('active'));
  toastTimeoutId = setTimeout(() => hideToast(), duration);
}

export function hideToast() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('m3-toast-container');
  if (!container) return;
  const toast = container.querySelector('.m3-toast');
  if (toast) {
    toast.classList.remove('active');
    setTimeout(() => {
      if (container.parentNode) container.innerHTML = '';
    }, 300);
  }
}
