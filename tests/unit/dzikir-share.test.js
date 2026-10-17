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

import { 
    encodeDzikirPayload, 
    decodeDzikirPayload, 
    extractDzikirPayloadFromInput, 
    validateDzikirPayload, 
    regenerateDzikirIds 
} from '../../src/modules/dzikir.js';

describe('Share & Receive Dzikir Module Unit Tests', () => {
    const sampleDzikir = {
        name: 'Rangkaian Tasbih Pilihan',
        pages: [
            {
                arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
                latin: 'Subhanallahi wa bihamdihi',
                translation: 'Maha Suci Allah dan segala puji bagi-Nya',
                reference: 'HR. Bukhari no. 6405',
                target: 100
            },
            {
                arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
                latin: 'La ilaha illallah wahdahu la syarika lah',
                translation: 'Tidak ada sesembahan yang berhak disembah selain Allah',
                reference: 'HR. Muslim no. 2691',
                target: 10
            }
        ]
    };

    describe('Encoding & Decoding (Round-trip & UTF-8 Arabic Integrity)', () => {
        it('should correctly encode and decode a multi-page dzikir sequence preserving Arabic text and diacritics', () => {
            const token = encodeDzikirPayload(sampleDzikir);
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(20);
            // URL-safe characters only (no +, /, or =)
            expect(token).toMatch(/^[A-Za-z0-9_-]+$/);

            const decoded = decodeDzikirPayload(token);
            expect(decoded.name).toBe(sampleDzikir.name);
            expect(decoded.pages.length).toBe(2);
            expect(decoded.pages[0].arabic).toBe(sampleDzikir.pages[0].arabic);
            expect(decoded.pages[0].latin).toBe(sampleDzikir.pages[0].latin);
            expect(decoded.pages[0].translation).toBe(sampleDzikir.pages[0].translation);
            expect(decoded.pages[0].target).toBe(100);
            expect(decoded.pages[1].arabic).toBe(sampleDzikir.pages[1].arabic);
        });

        it('should throw an error when encoding malformed item structures', () => {
            expect(() => encodeDzikirPayload(null)).toThrow();
            expect(() => encodeDzikirPayload({})).toThrow();
            expect(() => encodeDzikirPayload({ name: 'Test' })).toThrow();
        });

        it('should throw an error when decoding invalid or corrupted tokens', () => {
            expect(() => decodeDzikirPayload('')).toThrow();
            expect(() => decodeDzikirPayload('!!!invalid-base64!!!')).toThrow();
            expect(() => decodeDzikirPayload('YWJj')).toThrow(); // Decodes to "abc" which is not JSON
        });
    });

    describe('Resilient Payload Extractor (extractDzikirPayloadFromInput)', () => {
        it('should extract payload from a full URL with hash (#dzikir=...)', () => {
            const token = encodeDzikirPayload(sampleDzikir);
            const fullUrl = `https://tasbihku.app/#dzikir=${token}`;
            const extracted = extractDzikirPayloadFromInput(fullUrl);
            expect(extracted).toBe(token);
        });

        it('should extract payload from a query parameter (?dzikir=...)', () => {
            const token = encodeDzikirPayload(sampleDzikir);
            const queryUrl = `https://tasbihku.app/?dzikir=${token}&utm_source=share`;
            const extracted = extractDzikirPayloadFromInput(queryUrl);
            expect(extracted).toBe(token);
        });

        it('should extract payload from a WhatsApp-style message containing surrounding text', () => {
            const token = encodeDzikirPayload(sampleDzikir);
            const waMessage = `Assalamu'alaikum, ayo baca rangkaian dzikir ini di TasbihKu:\nhttps://tasbihku.app/#dzikir=${token}\nSemoga berkah!`;
            const extracted = extractDzikirPayloadFromInput(waMessage);
            expect(extracted).toBe(token);
        });

        it('should accept a raw token directly', () => {
            const token = encodeDzikirPayload(sampleDzikir);
            const extracted = extractDzikirPayloadFromInput(token);
            expect(extracted).toBe(token);
        });

        it('should accept and re-encode raw JSON directly if pasted', () => {
            const rawJson = JSON.stringify(sampleDzikir);
            const extracted = extractDzikirPayloadFromInput(rawJson);
            expect(typeof extracted).toBe('string');
            const decoded = decodeDzikirPayload(extracted);
            expect(decoded.name).toBe(sampleDzikir.name);
        });

        it('should return null for empty, non-string, or completely invalid inputs', () => {
            expect(extractDzikirPayloadFromInput('')).toBeNull();
            expect(extractDzikirPayloadFromInput('   ')).toBeNull();
            expect(extractDzikirPayloadFromInput(12345)).toBeNull();
            expect(extractDzikirPayloadFromInput('random gibberish not a token')).toBeNull();
        });
    });

    describe('Payload Validation (validateDzikirPayload)', () => {
        it('should approve valid payload and produce sanitized object', () => {
            const result = validateDzikirPayload(sampleDzikir);
            expect(result.valid).toBe(true);
            expect(result.sanitized.name).toBe(sampleDzikir.name);
            expect(result.sanitized.pages.length).toBe(2);
            expect(result.sanitized.pages[0].target).toBe(100);
        });

        it('should reject payload without name or with empty name', () => {
            const emptyName = { name: '   ', pages: [{ arabic: 'Subhanallah', target: 33 }] };
            const result = validateDzikirPayload(emptyName);
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('name is required');
        });

        it('should reject payload without pages or empty pages array', () => {
            const emptyPages = { name: 'Test', pages: [] };
            const result = validateDzikirPayload(emptyPages);
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('non-empty array');
        });

        it('should reject pages that have no readable text content', () => {
            const blankPage = { name: 'Test', pages: [{ arabic: '', latin: '  ', translation: '', target: 33 }] };
            const result = validateDzikirPayload(blankPage);
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('must contain arabic, latin, or translation');
        });

        it('should clamp target values between 1 and 99999', () => {
            const weirdTargets = {
                name: 'Clamped',
                pages: [
                    { latin: 'Test 1', target: -5 },
                    { latin: 'Test 2', target: 9999999 }
                ]
            };
            const result = validateDzikirPayload(weirdTargets);
            expect(result.valid).toBe(true);
            expect(result.sanitized.pages[0].target).toBe(1);
            expect(result.sanitized.pages[1].target).toBe(99999);
        });

        it('should reject payloads with more than 50 pages', () => {
            const hugePayload = {
                name: 'Too Big',
                pages: Array(51).fill({ latin: 'Subhanallah', target: 33 })
            };
            const result = validateDzikirPayload(hugePayload);
            expect(result.valid).toBe(false);
            expect(result.reason).toContain('Too many pages');
        });
    });

    describe('ID Regeneration (regenerateDzikirIds)', () => {
        it('should assign fresh unique IDs to the dzikir item and every page', () => {
            const regenerated = regenerateDzikirIds(sampleDzikir);
            expect(typeof regenerated.id).toBe('number');
            expect(regenerated.id).toBeGreaterThan(0);
            expect(regenerated.pages.length).toBe(2);

            const pageIds = regenerated.pages.map(p => p.id);
            expect(pageIds[0]).not.toBe(regenerated.id);
            expect(pageIds[0]).not.toBe(pageIds[1]);
            // Every page has positive numeric id
            pageIds.forEach(id => {
                expect(typeof id).toBe('number');
                expect(id).toBeGreaterThan(0);
            });
        });
    });
});
