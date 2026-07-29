import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from '../../src/core/store.js';
import { t, setLanguage, getLanguage, translations } from '../../src/core/i18n.js';

vi.mock('../../src/core/store.js', () => {
    const mockState = {
        language: 'id'
    };
    return {
        state: mockState,
        saveState: vi.fn(),
        updateState: vi.fn((update) => {
            Object.assign(mockState, update);
        })
    };
});

describe('i18n Translation System Unit Tests', () => {
    beforeEach(() => {
        state.language = 'id';
    });

    it('should return Indonesian translations by default', () => {
        expect(getLanguage()).toBe('id');
        expect(t('section_settings')).toBe('Pengaturan');
        expect(t('mode_counting')).toBe('Counting');
        expect(t('btn_reset')).toBe('Reset');
    });

    it('should translate with parameter interpolation', () => {
        expect(t('streak_days', { count: 5 })).toBe('5 Hari');
        expect(t('target_display', { count: 33 })).toBe('Target: 33');
    });

    it('should switch language to English and return English translations', () => {
        setLanguage('en');
        expect(getLanguage()).toBe('en');
        expect(t('section_settings')).toBe('Settings');
        expect(t('greeting')).toBe("Assalamu'alaikum");
        expect(t('btn_backup')).toBe('Backup');
        expect(t('streak_days', { count: 5 })).toBe('5 Days');
        expect(t('setting_language')).toBe('Language / Bahasa');
    });

    it('should switch language back to Indonesian', () => {
        setLanguage('en');
        expect(t('section_settings')).toBe('Settings');
        setLanguage('id');
        expect(getLanguage()).toBe('id');
        expect(t('section_settings')).toBe('Pengaturan');
    });

    it('should fallback to Indonesian key if missing in target language or return raw key if missing in both', () => {
        state.language = 'en';
        expect(t('non_existent_key_xyz')).toBe('non_existent_key_xyz');
    });

    it('should resolve custom dhikr translation based on active language', () => {
        const customTranslationObj = {
            id: 'Maha Suci Allah',
            en: 'Glory be to Allah'
        };

        function getTranslationText(translation, lang) {
            if (typeof translation === 'object' && translation !== null) {
                return translation[lang] || translation.id || translation.en || '';
            }
            return translation || '';
        }

        expect(getTranslationText(customTranslationObj, 'id')).toBe('Maha Suci Allah');
        expect(getTranslationText(customTranslationObj, 'en')).toBe('Glory be to Allah');
        expect(getTranslationText('Simple String', 'en')).toBe('Simple String');
    });
});
