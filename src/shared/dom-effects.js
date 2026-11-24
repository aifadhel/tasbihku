export function animateValue(id, value) {
  if (typeof document === 'undefined') return;
  const obj = document.getElementById(id);
  if (!obj) return;
  obj.innerText = value;
  obj.classList.remove('count-pop-animation');
  void obj.offsetWidth;
  obj.classList.add('count-pop-animation');
}

export function triggerCelebration() {
  if (typeof document === 'undefined') return;
  const progressEl = document.getElementById('player-progress');
  if (progressEl) {
    progressEl.classList.remove('progress-complete-glow');
    void progressEl.offsetWidth;
    progressEl.classList.add('progress-complete-glow');
    setTimeout(() => {
      progressEl.classList.remove('progress-complete-glow');
    }, 350);
    return;
  }
  const playerPage = document.getElementById('page-player');
  if (playerPage) {
    playerPage.classList.remove('celebrate-heartbeat');
  }
}
