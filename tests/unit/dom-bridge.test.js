import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchSpy = vi.fn(async () => {});

vi.mock('../../src/app/command-bus.js', () => ({
  dispatch: dispatchSpy
}));

vi.mock('../../src/shared/media.js', () => ({
  vibrate: vi.fn()
}));

describe('dom-bridge event arg extraction', () => {
  const listeners = {};

  beforeAll(async () => {
    global.document = {
      activeElement: null,
      addEventListener: (evt, fn) => {
        listeners[evt] = fn;
      },
      getElementById: () => null,
      querySelector: () => null
    };
    const { initDomBridge } = await import('../../src/app/dom-bridge.js');
    initDomBridge();
  });

  beforeEach(() => {
    dispatchSpy.mockClear();
  });

  it('does not include empty button.value to shadow data-arg on click', () => {
    const btn = {
      tagName: 'BUTTON',
      type: 'button',
      value: '',
      dataset: { cmd: 'settings:set-language', arg: 'en' },
      closest: (sel) => (sel === '[data-cmd]' ? btn : null)
    };
    listeners.click({ target: btn });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const [cmd, payload] = dispatchSpy.mock.calls[0];
    expect(cmd).toBe('settings:set-language');
    expect(payload.arg).toBe('en');
    expect(payload.value).toBeUndefined();
  });

  it('captures select, input, textarea value and checkbox checked properly', () => {
    const selectEl = {
      tagName: 'SELECT',
      type: 'select-one',
      value: 'en',
      dataset: { cmdChange: 'settings:set-language' },
      closest: (sel) => (sel === '[data-cmd-change]' ? selectEl : null)
    };
    listeners.change({ target: selectEl });
    expect(dispatchSpy).toHaveBeenLastCalledWith('settings:set-language', expect.objectContaining({ value: 'en' }));

    const chkEl = {
      tagName: 'INPUT',
      type: 'checkbox',
      checked: true,
      value: 'on',
      dataset: { cmdChange: 'settings:toggle-oled' },
      closest: (sel) => (sel === '[data-cmd-change]' ? chkEl : null)
    };
    listeners.change({ target: chkEl });
    const [, chkPayload] = dispatchSpy.mock.calls[1];
    expect(chkPayload.checked).toBe(true);
    expect(chkPayload.value).toBeUndefined();

    const textEl = {
      tagName: 'INPUT',
      type: 'text',
      value: 'Ahmad',
      dataset: { cmdInput: 'settings:update-username' },
      closest: (sel) => (sel === '[data-cmd-input]' ? textEl : null)
    };
    listeners.input({ target: textEl });
    expect(dispatchSpy).toHaveBeenLastCalledWith('settings:update-username', expect.objectContaining({ value: 'Ahmad' }));
  });
});
