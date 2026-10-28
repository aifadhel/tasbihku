import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/hardware/media.js', () => ({
    vibrate: vi.fn(),
    playTapSound: vi.fn(),
    triggerMilestoneFeedback: vi.fn()
}));

vi.mock('../../src/ui/router.js', () => ({
    showModal: vi.fn(),
    showPage: vi.fn(),
    goBack: vi.fn(),
    registerModalOpen: vi.fn(),
    registerModalClose: vi.fn(),
    animateValue: vi.fn(),
    triggerCelebration: vi.fn(),
    SVG_ICONS: { arrowUp: '', arrowDown: '' }
}));

import { showModal, showPage, goBack } from '../../src/ui/router.js';
import { dzikirPagi, dzikirPetang, wiridReadings, getLocalizedText, renderCustomList, startPlayer, confirmRestoreGuided, saveEditorSession, openEditor } from '../../src/modules/dzikir.js';
import { DEFAULT_STATE, state } from '../../src/core/store.js';

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

        it('wiridReadings should contain at least 14 authentic items', () => {
            expect(Array.isArray(wiridReadings)).toBe(true);
            expect(wiridReadings.length).toBeGreaterThanOrEqual(14);
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

        it('every item in wiridReadings should have complete schema fields', () => {
            wiridReadings.forEach((item, index) => {
                expect(typeof item.arabic, `wiridReadings[${index}].arabic`).toBe('string');
                expect(item.arabic.trim().length, `wiridReadings[${index}].arabic non-empty`).toBeGreaterThan(0);

                expect(typeof item.latin, `wiridReadings[${index}].latin`).toBe('string');
                expect(item.latin.trim().length, `wiridReadings[${index}].latin non-empty`).toBeGreaterThan(0);

                expect(typeof item.target, `wiridReadings[${index}].target`).toBe('number');
                expect(item.target, `wiridReadings[${index}].target > 0`).toBeGreaterThan(0);

                expect(typeof item.translation, `wiridReadings[${index}].translation`).toBe('object');
                expect(typeof item.translation.id, `wiridReadings[${index}].translation.id`).toBe('string');
                expect(item.translation.id.trim().length, `wiridReadings[${index}].translation.id non-empty`).toBeGreaterThan(0);
                expect(typeof item.translation.en, `wiridReadings[${index}].translation.en`).toBe('string');
                expect(item.translation.en.trim().length, `wiridReadings[${index}].translation.en non-empty`).toBeGreaterThan(0);

                expect(typeof item.reference, `wiridReadings[${index}].reference`).toBe('object');
                expect(typeof item.reference.id, `wiridReadings[${index}].reference.id`).toBe('string');
                expect(item.reference.id.trim().length, `wiridReadings[${index}].reference.id non-empty`).toBeGreaterThan(0);
                expect(typeof item.reference.en, `wiridReadings[${index}].reference.en`).toBe('string');
                expect(item.reference.en.trim().length, `wiridReadings[${index}].reference.en non-empty`).toBeGreaterThan(0);
            });
        });
    });

    describe('Authentic Narrations & Textual Precision', () => {
        it('Ayat Kursi must be full and untruncated in morning, evening, and wirid sets', () => {
            const pagiKursi = dzikirPagi[0];
            const petangKursi = dzikirPetang[0];
            const wiridKursi = wiridReadings.find(item => item.arabic.includes('الْحَيُّ الْقَيُّومُ'));

            expect(pagiKursi.arabic).not.toContain('...');
            expect(pagiKursi.arabic).toContain('وَسِعَ كُرْسِيُّهُ');
            expect(pagiKursi.arabic).toContain('وَلَا يَئُودُهُ حِفْظُهُمَا');
            expect(pagiKursi.target).toBe(1);

            expect(petangKursi.arabic).not.toContain('...');
            expect(petangKursi.arabic).toContain('وَسِعَ كُرْسِيُّهُ');
            expect(petangKursi.arabic).toContain('وَلَا يَئُودُهُ حِفْظُهُمَا');
            expect(petangKursi.target).toBe(1);

            expect(wiridKursi).toBeDefined();
            expect(wiridKursi.arabic).not.toContain('...');
            expect(wiridKursi.arabic).toContain('وَسِعَ كُرْسِيُّهُ');
            expect(wiridKursi.arabic).toContain('وَلَا يَئُودُهُ حِفْظُهُمَا');
            expect(wiridKursi.target).toBe(1);
        });

        it('Al-Muawwidhat (3 Quls) must be present in both sets with target 3 each and wirid with target 1', () => {
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

            const wiridIkhlas = wiridReadings.find(item => item.arabic.includes('قُلْ هُوَ اللَّهُ أَحَدٌ'));
            const wiridFalaq = wiridReadings.find(item => item.arabic.includes('قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ'));
            const wiridNas = wiridReadings.find(item => item.arabic.includes('قُلْ أَعُوذُ بِرَبِّ النَّاسِ'));

            expect(wiridIkhlas).toBeDefined();
            expect(wiridIkhlas.target).toBe(1);
            expect(wiridFalaq).toBeDefined();
            expect(wiridFalaq.target).toBe(1);
            expect(wiridNas).toBeDefined();
            expect(wiridNas.target).toBe(1);
        });

        it('wiridReadings must include Tahlil Al-Mughirah and Tahlil Ibn Az-Zubair', () => {
            const mughirah = wiridReadings.find(item => item.arabic.includes('لَا مَانِعَ لِمَا أَعْطَيْتَ'));
            const zubair = wiridReadings.find(item => item.arabic.includes('لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ'));

            expect(mughirah).toBeDefined();
            expect(mughirah.target).toBe(1);
            expect(zubair).toBeDefined();
            expect(zubair.target).toBe(1);
        });

        it('wiridReadings must include Doa Muadz bin Jabal and Doa Ilmu Nafi', () => {
            const muadz = wiridReadings.find(item => item.arabic.includes('أَعِنِّي عَلَى ذِكْرِكَ'));
            const ilmuNafi = wiridReadings.find(item => item.arabic.includes('عِلْمًا نَافِعًا'));

            expect(muadz).toBeDefined();
            expect(muadz.target).toBe(1);
            expect(ilmuNafi).toBeDefined();
            expect(ilmuNafi.target).toBe(1);
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

        it('store DEFAULT_STATE must define guidedDataVersion === 3', () => {
            expect(DEFAULT_STATE.guidedDataVersion).toBe(3);
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

    describe('renderCustomList M3 Expressive Architecture', () => {
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

        it('renders M3 empty state card when customList is empty', () => {
            const mockContainer = createMockElement('div');
            global.document = {
                getElementById: (id) => id === 'custom-list-container' ? mockContainer : null,
                createElement: createMockElement
            };

            state.customList = [];
            renderCustomList();

            expect(mockContainer.children.length).toBe(1);
            const emptyCard = mockContainer.children[0];
            expect(emptyCard.className).toBe('custom-dzikir-empty-card');
            expect(emptyCard.children.some(c => c.className === 'm3-btn-action')).toBe(true);
        });

        it('renders full-width M3 card with top play target and bottom action toolbar for each custom item', () => {
            const mockContainer = createMockElement('div');
            global.document = {
                getElementById: (id) => id === 'custom-list-container' ? mockContainer : null,
                createElement: createMockElement
            };

            state.customList = [
                {
                    id: 991,
                    name: 'Doa Kemudahan Hisab',
                    pages: [
                        { target: 33 },
                        { target: 67 }
                    ]
                }
            ];

            renderCustomList();

            expect(mockContainer.children.length).toBe(1);
            const card = mockContainer.children[0];
            expect(card.className).toBe('custom-dzikir-card');

            // Must have exactly 2 direct structural children: top interactive row and bottom toolbar
            expect(card.children.length).toBe(2);
            const [topRow, toolbar] = card.children;

            expect(topRow.className).toBe('custom-dzikir-card-top');
            expect(topRow.getAttribute('role')).toBe('button');

            const infoDiv = topRow.children.find(c => c.className === 'custom-dzikir-info');
            expect(infoDiv).toBeDefined();

            const titleSpan = infoDiv.children.find(c => c.className === 'custom-dzikir-title');
            expect(titleSpan.textContent).toBe('Doa Kemudahan Hisab');

            const metaDiv = infoDiv.children.find(c => c.className === 'custom-dzikir-meta');
            expect(metaDiv).toBeDefined();
            expect(metaDiv.children.length).toBe(2); // pages chip & target chip

            const playBadge = topRow.children.find(c => c.className === 'custom-dzikir-play-badge');
            expect(playBadge).toBeDefined();

            // Bottom toolbar must contain Share, Edit, and Delete action buttons
            expect(toolbar.className).toBe('custom-dzikir-toolbar');
            expect(toolbar.children.length).toBe(3);
            expect(toolbar.children[0].className).toContain('btn-tonal-mini');
            expect(toolbar.children[1].className).toContain('btn-tonal-mini');
            expect(toolbar.children[2].className).toContain('btn-danger-mini');
        });
    });

    describe('Dzikir Navigation & History Unwinding', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            global.window = {
                playerSourcePage: null
            };
        });

        it('startPlayer records source page from active page before opening player', () => {
            const mockPage = { id: 'page-menu' };
            global.document = {
                querySelector: vi.fn((sel) => sel === '.page.active' ? mockPage : null),
                getElementById: vi.fn(() => null)
            };

            startPlayer('pagi');

            expect(global.window.playerSourcePage).toBe('page-menu');
            expect(showPage).toHaveBeenCalledWith('page-player');
        });

        it('confirmRestoreGuided calls goBack instead of forward page push upon confirmation', () => {
            // First modal asks for confirmation
            showModal.mockImplementationOnce((title, msg, onConfirm) => {
                onConfirm();
            });
            // Second modal displays success message and its callback invokes goBack
            showModal.mockImplementationOnce((title, msg, onDismiss) => {
                onDismiss();
            });

            confirmRestoreGuided();

            expect(goBack).toHaveBeenCalledWith('page-menu');
            expect(showPage).not.toHaveBeenCalledWith('page-menu');
        });

        it('saveEditorSession calls goBack instead of forward page push upon save confirmation', () => {
            global.document = {
                getElementById: vi.fn((id) => {
                    if (id === 'editor-input-name') return { value: 'My Test Dzikir' };
                    if (id === 'custom-list-container') return { innerHTML: '', appendChild: vi.fn() };
                    return null;
                }),
                createElement: vi.fn(() => ({
                    className: '',
                    style: {},
                    setAttribute: vi.fn(),
                    appendChild: vi.fn()
                }))
            };

            openEditor('new');

            showModal.mockImplementationOnce((title, msg, onDismiss) => {
                onDismiss();
            });

            saveEditorSession();

            expect(goBack).toHaveBeenCalledWith('page-menu');
            expect(showPage).not.toHaveBeenCalledWith('page-menu');
        });
    });
});
