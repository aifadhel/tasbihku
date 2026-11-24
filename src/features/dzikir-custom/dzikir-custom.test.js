import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

import { registerCommand } from '../../app/command-bus.js';
import { state } from '../../shared/store.js';
import { renderCustomList } from './dzikir-list.js';
import { confirmRestoreGuided, openEditor, saveEditorSession } from './dzikir-editor.js';

function createMockElement(tag) {
  return {
    tagName: tag.toUpperCase(),
    className: '',
    style: {},
    innerHTML: '',
    textContent: '',
    children: [],
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    appendChild(child) { this.children.push(child); return child; }
  };
}

describe('dzikir-custom list and editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.customList = [];
    state.guidedData = {};
  });

  it('renders M3 empty state card when customList is empty', () => {
    const mockContainer = createMockElement('div');
    global.document = {
      getElementById: (id) => (id === 'custom-list-container' ? mockContainer : null),
      createElement: createMockElement
    };
    renderCustomList();
    expect(mockContainer.children.length).toBe(1);
    expect(mockContainer.children[0].className).toBe('custom-dzikir-empty-card');
    expect(mockContainer.children[0].children.some((c) => c.className === 'm3-btn-action')).toBe(true);
  });

  it('renders M3 custom dzikir card with top play area and 3 toolbar actions', () => {
    const mockContainer = createMockElement('div');
    global.document = {
      getElementById: (id) => (id === 'custom-list-container' ? mockContainer : null),
      createElement: createMockElement
    };
    state.customList = [{ id: 991, name: 'Doa Hisab', pages: [{ target: 33 }, { target: 67 }] }];
    renderCustomList();
    const card = mockContainer.children[0];
    expect(card.className).toBe('custom-dzikir-card');
    expect(card.children.length).toBe(2);
    const [topRow, toolbar] = card.children;
    expect(topRow.className).toBe('custom-dzikir-card-top');
    expect(toolbar.className).toBe('custom-dzikir-toolbar');
    expect(toolbar.children.length).toBe(3);
  });

  it('unwinds navigation with settings:go-back on restore guided and save editor', async () => {
    const goBackSpy = vi.fn();
    registerCommand('settings:go-back', goBackSpy);
    registerCommand('settings:show-page', vi.fn());
    registerCommand('ui:show-modal', ({ onYes }) => onYes && onYes());

    global.document = {
      getElementById: vi.fn((id) => {
        if (id === 'editor-input-name') return { value: 'My Test Dzikir' };
        if (id === 'custom-list-container') return createMockElement('div');
        return null;
      }),
      createElement: createMockElement
    };

    await openEditor('new');
    saveEditorSession();
    expect(goBackSpy).toHaveBeenCalledWith({ fallback: 'page-menu' });

    goBackSpy.mockClear();
    confirmRestoreGuided();
    expect(goBackSpy).toHaveBeenCalledWith({ fallback: 'page-menu' });
  });
});
