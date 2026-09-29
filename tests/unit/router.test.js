import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

let switchDashboardMode;
let handleTablistKeyboard;
let mockElements = {};

beforeAll(async () => {
    global.window = {
        addEventListener: vi.fn(),
        location: { pathname: '/' },
        isHabitDetailModalOpen: false
    };

    global.document = {
        addEventListener: vi.fn(),
        querySelectorAll: vi.fn((sel) => {
            if (sel.includes('.segment-btn') || sel.includes('[role="tab"]')) {
                return [mockElements['tab-counting'], mockElements['tab-stopwatch'], mockElements['tab-timer']].filter(Boolean);
            }
            return [];
        }),
        getElementById: vi.fn((id) => mockElements[id] || null),
        querySelector: vi.fn((sel) => {
            if (sel.includes('counting')) return mockElements['tab-counting'];
            if (sel.includes('stopwatch')) return mockElements['tab-stopwatch'];
            if (sel.includes('timer')) return mockElements['tab-timer'];
            return null;
        }),
        activeElement: null
    };

    vi.mock('../../src/core/store.js', async (importOriginal) => {
        const actual = await importOriginal();
        return {
            ...actual,
            saveState: vi.fn(),
            saveStateImmediate: vi.fn()
        };
    });

    vi.mock('../../src/hardware/media.js', async (importOriginal) => {
        const actual = await importOriginal();
        return {
            ...actual,
            playTapSound: vi.fn(),
            vibrate: vi.fn()
        };
    });

    vi.mock('../../src/modules/tasbih.js', async (importOriginal) => {
        const actual = await importOriginal();
        return {
            ...actual,
            stopStopwatch: vi.fn(),
            stopTimer: vi.fn(),
            updateStopwatchUI: vi.fn(),
            updateTimerUI: vi.fn()
        };
    });

    const routerModule = await import('../../src/ui/router.js');
    switchDashboardMode = routerModule.switchDashboardMode;

    const mainModule = await import('../../src/main.js');
    handleTablistKeyboard = mainModule.handleTablistKeyboard;
});

function createMockElement(id, initialAttrs = {}) {
    const classList = new Set(initialAttrs.class ? initialAttrs.class.split(' ') : []);
    const attrs = { ...initialAttrs };
    const styleProps = {};

    const el = {
        id,
        classList: {
            contains: (c) => classList.has(c),
            add: (c) => classList.add(c),
            remove: (c) => classList.delete(c),
            toggle: (c, force) => {
                if (force === undefined) {
                    classList.has(c) ? classList.delete(c) : classList.add(c);
                } else if (force) {
                    classList.add(c);
                } else {
                    classList.delete(c);
                }
            }
        },
        getAttribute: (attr) => attrs[attr] || null,
        setAttribute: (attr, val) => { attrs[attr] = String(val); },
        style: {
            display: 'block',
            setProperty: (prop, val) => { styleProps[prop] = String(val); },
            getPropertyValue: (prop) => styleProps[prop] || ''
        },
        focus: vi.fn(),
        closest: (sel) => {
            if (sel.includes('[role="tab"]') && attrs['role'] === 'tab') return el;
            if (sel.includes('#dashboard-mode-switcher') && id === 'dashboard-mode-switcher') return el;
            return null;
        }
    };
    return el;
}

describe('Apple HIG Tab View & Dashboard Router Unit Tests', () => {
    beforeEach(() => {
        mockElements = {
            'dashboard-mode-switcher': createMockElement('dashboard-mode-switcher', {
                class: 'segmented-fab-container apple-tab-view',
                'data-active-index': '0'
            }),
            'tab-counting': createMockElement('tab-counting', {
                class: 'segment-btn active',
                'data-mode': 'counting',
                'aria-selected': 'true',
                role: 'tab',
                tabindex: '0'
            }),
            'tab-stopwatch': createMockElement('tab-stopwatch', {
                class: 'segment-btn',
                'data-mode': 'stopwatch',
                'aria-selected': 'false',
                role: 'tab',
                tabindex: '-1'
            }),
            'tab-timer': createMockElement('tab-timer', {
                class: 'segment-btn',
                'data-mode': 'timer',
                'aria-selected': 'false',
                role: 'tab',
                tabindex: '-1'
            }),
            'counting-display-area': createMockElement('counting-display-area'),
            'stopwatch-display-area': createMockElement('stopwatch-display-area'),
            'timer-display-area': createMockElement('timer-display-area'),
            'dashboard-mode-title': createMockElement('dashboard-mode-title'),
            'dashboard-main-emoji': createMockElement('dashboard-main-emoji'),
            'dashboard-main-label': createMockElement('dashboard-main-label'),
            'dashboard-main-btn': createMockElement('dashboard-main-btn')
        };
        mockElements['dashboard-mode-switcher'].querySelectorAll = (sel) => {
            if (sel.includes('[role="tab"]')) {
                return [mockElements['tab-counting'], mockElements['tab-stopwatch'], mockElements['tab-timer']];
            }
            return [];
        };
    });

    it('should switch mode to stopwatch and synchronize Apple tab styling and ARIA attributes', async () => {
        const { state } = await import('../../src/core/store.js');
        switchDashboardMode('stopwatch');

        expect(state.dashboardMode).toBe('stopwatch');

        const switcher = mockElements['dashboard-mode-switcher'];
        expect(switcher.getAttribute('data-active-index')).toBe('1');
        expect(switcher.style.getPropertyValue('--tab-active-index')).toBe('1');

        const tabCounting = mockElements['tab-counting'];
        const tabStopwatch = mockElements['tab-stopwatch'];
        const tabTimer = mockElements['tab-timer'];

        expect(tabCounting.classList.contains('active')).toBe(false);
        expect(tabCounting.getAttribute('aria-selected')).toBe('false');
        expect(tabCounting.getAttribute('tabindex')).toBe('-1');

        expect(tabStopwatch.classList.contains('active')).toBe(true);
        expect(tabStopwatch.getAttribute('aria-selected')).toBe('true');
        expect(tabStopwatch.getAttribute('tabindex')).toBe('0');

        expect(tabTimer.classList.contains('active')).toBe(false);
        expect(tabTimer.getAttribute('aria-selected')).toBe('false');
        expect(tabTimer.getAttribute('tabindex')).toBe('-1');

        expect(mockElements['counting-display-area'].style.display).toBe('none');
        expect(mockElements['stopwatch-display-area'].style.display).toBe('block');
        expect(mockElements['timer-display-area'].style.display).toBe('none');
    });

    it('should switch mode to timer and update active-index to 2', async () => {
        const { state } = await import('../../src/core/store.js');
        switchDashboardMode('timer');

        expect(state.dashboardMode).toBe('timer');

        const switcher = mockElements['dashboard-mode-switcher'];
        expect(switcher.getAttribute('data-active-index')).toBe('2');
        expect(switcher.style.getPropertyValue('--tab-active-index')).toBe('2');

        expect(mockElements['tab-timer'].classList.contains('active')).toBe(true);
        expect(mockElements['tab-timer'].getAttribute('aria-selected')).toBe('true');
        expect(mockElements['tab-timer'].getAttribute('tabindex')).toBe('0');

        expect(mockElements['timer-display-area'].style.display).toBe('block');
        expect(mockElements['counting-display-area'].style.display).toBe('none');
    });

    it('should navigate tabs with ArrowRight and wrap around', () => {
        const tabCounting = mockElements['tab-counting'];
        const tabStopwatch = mockElements['tab-stopwatch'];
        global.document.activeElement = tabCounting;

        const event = { key: 'ArrowRight', preventDefault: vi.fn() };
        const handled = handleTablistKeyboard(event);

        expect(handled).toBe(true);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(tabStopwatch.focus).toHaveBeenCalled();
    });

    it('should navigate tabs with ArrowLeft and wrap around to end', () => {
        const tabCounting = mockElements['tab-counting'];
        const tabTimer = mockElements['tab-timer'];
        global.document.activeElement = tabCounting;

        const event = { key: 'ArrowLeft', preventDefault: vi.fn() };
        const handled = handleTablistKeyboard(event);

        expect(handled).toBe(true);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(tabTimer.focus).toHaveBeenCalled();
    });

    it('should navigate to Home and End tabs directly', () => {
        const tabStopwatch = mockElements['tab-stopwatch'];
        const tabCounting = mockElements['tab-counting'];
        const tabTimer = mockElements['tab-timer'];
        global.document.activeElement = tabStopwatch;

        const endEvent = { key: 'End', preventDefault: vi.fn() };
        handleTablistKeyboard(endEvent);
        expect(tabTimer.focus).toHaveBeenCalled();

        const homeEvent = { key: 'Home', preventDefault: vi.fn() };
        handleTablistKeyboard(homeEvent);
        expect(tabCounting.focus).toHaveBeenCalled();
    });
});
