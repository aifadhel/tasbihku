import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/hardware/media.js', () => ({
    vibrate: vi.fn(),
    playTapSound: vi.fn(),
    triggerMilestoneFeedback: vi.fn()
}));

vi.mock('../../src/ui/router.js', () => ({
    showModal: vi.fn(),
    showPage: vi.fn(),
    animateValue: vi.fn(),
    triggerCelebration: vi.fn(),
    SVG_ICONS: { arrowUp: '', arrowDown: '' }
}));

import { dzikirPagi, dzikirPetang, wiridReadings, getLocalizedText } from '../../src/modules/dzikir.js';

describe('Dzikir Module Dataset & Helper Unit Tests', () => {
    describe('Dataset Schema & Integrity Constraints', () => {
        it('dzikirPagi should contain at least 15 authentic items', () => {
            expect(Array.isArray(dzikirPagi)).toBe(true);
            expect(dzikirPagi.length).toBeGreaterThanOrEqual(15);
        });

        it('dzikirPetang should contain at least 14 authentic items', () => {
            expect(Array.isArray(dzikirPetang)).toBe(true);
            expect(dzikirPetang.length).toBeGreaterThanOrEqual(14);
        });

        it('every item in dzikirPagi should have complete schema fields', () => {
            dzikirPagi.forEach((item, index) => {
                expect(typeof item.arabic, `dzikirPagi[${index}].arabic`).toBe('string');
                expect(item.arabic.trim().length, `dzikirPagi[${index}].arabic non-empty`).toBeGreaterThan(0);

                expect(typeof item.latin, `dzikirPagi[${index}].latin`).toBe('string');
                expect(item.latin.trim().length, `dzikirPagi[${index}].latin non-empty`).toBeGreaterThan(0);

                expect(typeof item.target, `dzikirPagi[${index}].target`).toBe('number');
                expect(item.target, `dzikirPagi[${index}].target > 0`).toBeGreaterThan(0);

                expect(typeof item.translation, `dzikirPagi[${index}].translation`).toBe('object');
                expect(typeof item.translation.id, `dzikirPagi[${index}].translation.id`).toBe('string');
                expect(item.translation.id.trim().length, `dzikirPagi[${index}].translation.id non-empty`).toBeGreaterThan(0);
                expect(typeof item.translation.en, `dzikirPagi[${index}].translation.en`).toBe('string');
                expect(item.translation.en.trim().length, `dzikirPagi[${index}].translation.en non-empty`).toBeGreaterThan(0);

                expect(typeof item.reference, `dzikirPagi[${index}].reference`).toBe('object');
                expect(typeof item.reference.id, `dzikirPagi[${index}].reference.id`).toBe('string');
                expect(item.reference.id.trim().length, `dzikirPagi[${index}].reference.id non-empty`).toBeGreaterThan(0);
                expect(typeof item.reference.en, `dzikirPagi[${index}].reference.en`).toBe('string');
                expect(item.reference.en.trim().length, `dzikirPagi[${index}].reference.en non-empty`).toBeGreaterThan(0);
            });
        });

        it('every item in dzikirPetang should have complete schema fields', () => {
            dzikirPetang.forEach((item, index) => {
                expect(typeof item.arabic, `dzikirPetang[${index}].arabic`).toBe('string');
                expect(item.arabic.trim().length, `dzikirPetang[${index}].arabic non-empty`).toBeGreaterThan(0);

                expect(typeof item.latin, `dzikirPetang[${index}].latin`).toBe('string');
                expect(item.latin.trim().length, `dzikirPetang[${index}].latin non-empty`).toBeGreaterThan(0);

                expect(typeof item.target, `dzikirPetang[${index}].target`).toBe('number');
                expect(item.target, `dzikirPetang[${index}].target > 0`).toBeGreaterThan(0);

                expect(typeof item.translation, `dzikirPetang[${index}].translation`).toBe('object');
                expect(typeof item.translation.id, `dzikirPetang[${index}].translation.id`).toBe('string');
                expect(item.translation.id.trim().length, `dzikirPetang[${index}].translation.id non-empty`).toBeGreaterThan(0);
                expect(typeof item.translation.en, `dzikirPetang[${index}].translation.en`).toBe('string');
                expect(item.translation.en.trim().length, `dzikirPetang[${index}].translation.en non-empty`).toBeGreaterThan(0);

                expect(typeof item.reference, `dzikirPetang[${index}].reference`).toBe('object');
                expect(typeof item.reference.id, `dzikirPetang[${index}].reference.id`).toBe('string');
                expect(item.reference.id.trim().length, `dzikirPetang[${index}].reference.id non-empty`).toBeGreaterThan(0);
                expect(typeof item.reference.en, `dzikirPetang[${index}].reference.en`).toBe('string');
                expect(item.reference.en.trim().length, `dzikirPetang[${index}].reference.en non-empty`).toBeGreaterThan(0);
            });
        });
    });

    describe('Authentic Narrations & Textual Precision', () => {
        it('Ayat Kursi must be full and untruncated in both morning and evening sets', () => {
            const pagiKursi = dzikirPagi[0];
            const petangKursi = dzikirPetang[0];

            expect(pagiKursi.arabic).not.toContain('...');
            expect(pagiKursi.arabic).toContain('وَسِعَ كُرْسِيُّهُ');
            expect(pagiKursi.arabic).toContain('وَلَا يَئُودُهُ حِفْظُهُمَا');
            expect(pagiKursi.target).toBe(1);

            expect(petangKursi.arabic).not.toContain('...');
            expect(petangKursi.arabic).toContain('وَسِعَ كُرْسِيُّهُ');
            expect(petangKursi.arabic).toContain('وَلَا يَئُودُهُ حِفْظُهُمَا');
            expect(petangKursi.target).toBe(1);
        });

        it('Al-Muawwidhat (3 Quls) must be present in both sets with target 3 each', () => {
            const pagiIkhlas = dzikirPagi.find(item => item.arabic.includes('قُلْ هُوَ اللَّهُ أَحَدٌ'));
            const pagiFalaq = dzikirPagi.find(item => item.arabic.includes('قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ'));
            const pagiNas = dzikirPagi.find(item => item.arabic.includes('قُلْ أَعُوذُ بِرَبِّ النَّاسِ'));

            expect(pagiIkhlas).toBeDefined();
            expect(pagiIkhlas.target).toBe(3);
            expect(pagiFalaq).toBeDefined();
            expect(pagiFalaq.target).toBe(3);
            expect(pagiNas).toBeDefined();
            expect(pagiNas.target).toBe(3);

            const petangIkhlas = dzikirPetang.find(item => item.arabic.includes('قُلْ هُوَ اللَّهُ أَحَدٌ'));
            const petangFalaq = dzikirPetang.find(item => item.arabic.includes('قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ'));
            const petangNas = dzikirPetang.find(item => item.arabic.includes('قُلْ أَعُوذُ بِرَبِّ النَّاسِ'));

            expect(petangIkhlas).toBeDefined();
            expect(petangIkhlas.target).toBe(3);
            expect(petangFalaq).toBeDefined();
            expect(petangFalaq.target).toBe(3);
            expect(petangNas).toBeDefined();
            expect(petangNas.target).toBe(3);
        });

        it('Bismillahilladzi la yadhurru must be present in both morning and evening with target 3', () => {
            const pagiBismillah = dzikirPagi.find(item => item.arabic.includes('بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ'));
            const petangBismillah = dzikirPetang.find(item => item.arabic.includes('بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ'));

            expect(pagiBismillah).toBeDefined();
            expect(pagiBismillah.target).toBe(3);
            expect(petangBismillah).toBeDefined();
            expect(petangBismillah.target).toBe(3);
        });

        it('Radhitu billah must be present in both morning and evening with target 3', () => {
            const pagiRadhitu = dzikirPagi.find(item => item.arabic.includes('رَضِيتُ بِاللَّهِ رَبًّا'));
            const petangRadhitu = dzikirPetang.find(item => item.arabic.includes('رَضِيتُ بِاللَّهِ رَبًّا'));

            expect(pagiRadhitu).toBeDefined();
            expect(pagiRadhitu.target).toBe(3);
            expect(petangRadhitu).toBeDefined();
            expect(petangRadhitu.target).toBe(3);
        });

        it('Juwairiyah dhikr (Subhanallahi wa bihamdihi adada khalqihi) must be in morning with target 3', () => {
            const juwairiyah = dzikirPagi.find(item => item.arabic.includes('عَدَدَ خَلْقِهِ'));
            expect(juwairiyah).toBeDefined();
            expect(juwairiyah.target).toBe(3);
        });

        it('Audzu bikalimatillahit tammati must be in evening with target 3', () => {
            const audzu = dzikirPetang.find(item => item.arabic.includes('أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ'));
            expect(audzu).toBeDefined();
            expect(audzu.target).toBe(3);
        });
    });

    describe('getLocalizedText Helper', () => {
        it('resolves localized object correctly for id and en', () => {
            const sample = { id: 'Teks Indonesia', en: 'English Text' };
            expect(getLocalizedText(sample, 'id')).toBe('Teks Indonesia');
            expect(getLocalizedText(sample, 'en')).toBe('English Text');
        });

        it('handles fallback string and null/undefined values', () => {
            expect(getLocalizedText('Plain String')).toBe('Plain String');
            expect(getLocalizedText(null)).toBe('');
            expect(getLocalizedText(undefined)).toBe('');
        });
    });
});
