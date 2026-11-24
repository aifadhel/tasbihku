import { saveState, state } from '../../shared/store.js';

export function initDragAndDrop(container, onReorder) {
  if (container.dataset.dragInit) return;
  container.dataset.dragInit = 'true';

  const getAfter = (boxContainer, y) => [...boxContainer.querySelectorAll('.habit-card:not(.dragging)')]
    .reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = container.querySelector('.dragging');
    const targetContent = e.target.closest('.routine-section-content');
    if (!dragging || !targetContent) return;
    const after = getAfter(targetContent, e.clientY);
    if (after == null) targetContent.appendChild(dragging);
    else targetContent.insertBefore(dragging, after);
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    const cards = [...container.querySelectorAll('.habit-card')];
    cards.forEach((c) => {
      const sec = c.closest('.routine-section-content')?.dataset.section;
      const habit = state.habits.find((h) => h.id === c.dataset.id);
      if (habit && sec && habit.routineSection !== sec) habit.routineSection = sec;
    });
    const activeMap = new Map(state.habits.filter((h) => !h.archived).map((h) => [h.id, h]));
    const reordered = [];
    cards.forEach((c) => {
      if (activeMap.has(c.dataset.id)) {
        reordered.push(activeMap.get(c.dataset.id));
        activeMap.delete(c.dataset.id);
      }
    });
    activeMap.forEach((h) => reordered.push(h));
    state.habits.filter((h) => h.archived).forEach((h) => reordered.push(h));
    state.habits = reordered;
    saveState();
    onReorder();
  });
}

export function attachTouchDrag(dragHandle, card, container) {
  let clone = null;
  dragHandle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    clone = card.cloneNode(true);
    clone.style.cssText = `position:fixed;z-index:9999;width:${card.offsetWidth}px;opacity:0.9;box-shadow:0 10px 20px rgba(0,0,0,0.3);pointer-events:none;left:${card.getBoundingClientRect().left}px;top:${touch.clientY - card.offsetHeight / 2}px;`;
    document.body.appendChild(clone);
    card.style.opacity = '0.2';
    card.classList.add('dragging');
  }, { passive: false });

  dragHandle.addEventListener('touchmove', (e) => {
    if (!clone) return;
    e.preventDefault();
    const touch = e.touches[0];
    clone.style.top = `${touch.clientY - card.offsetHeight / 2}px`;
    const hovered = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.habit-card');
    if (hovered && hovered !== card && !hovered.classList.contains('archived')) {
      const box = hovered.getBoundingClientRect();
      if (touch.clientY < box.top + box.height / 2) container.insertBefore(card, hovered);
      else container.insertBefore(card, hovered.nextSibling);
    }
  }, { passive: false });

  dragHandle.addEventListener('touchend', () => {
    if (!clone) return;
    clone.remove();
    clone = null;
    card.style.opacity = '1';
    card.classList.remove('dragging');
    container.dispatchEvent(new Event('drop'));
  });
}
