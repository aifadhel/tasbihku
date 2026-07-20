import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state } from '../../src/core/store.js';
import {
    getLocalDateString,
    getTodayDate,
    getPreviousDate,
    getRecentDates,
    calculateStreak,
    calculateHabitStrength,
    getHabitStreaks,
    isHabitCompletedOn,
    moveHabit,
    generateHabitCSVData
} from '../../src/modules/habits.js';

// Mock dependencies to isolate pure functions
vi.mock('../../src/core/store.js', () => {
    const mockState = {
        activityLog: [],
        habits: [],
        habitRepetitions: {}
    };
    return {
        state: mockState,
        saveState: vi.fn(),
        saveStateImmediate: vi.fn()
    };
});

vi.mock('../../src/hardware/media.js', () => {
    return {
        vibrate: vi.fn(),
        playTapSound: vi.fn()
    };
});

vi.mock('../../src/ui/router.js', () => {
    return {
        showModal: vi.fn(),
        closeModal: vi.fn(),
        SVG_ICONS: {
            calendar: '',
            arrowLeft: ''
        }
    };
});

describe('Habits Module Unit Tests', () => {
    beforeEach(() => {
        // Use a fixed system time: Tuesday, June 2, 2026
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-02T12:00:00Z'));
        
        // Reset state between tests
        state.activityLog = [];
        state.habits = [];
        state.habitRepetitions = {};
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Date Helpers', () => {
        it('getLocalDateString should return YYYY-MM-DD format', () => {
            const date = new Date('2026-06-02T12:00:00Z');
            expect(getLocalDateString(date)).toBe('2026-06-02');
            
            // Default argument (today)
            expect(getLocalDateString()).toBe('2026-06-02');
        });

        it('getTodayDate should return today in YYYY-MM-DD format', () => {
            expect(getTodayDate()).toBe('2026-06-02');
        });

        it('getPreviousDate should handle day, month, and year boundaries', () => {
            // Normal transition
            expect(getPreviousDate('2026-06-02')).toBe('2026-06-01');
            
            // Month boundary
            expect(getPreviousDate('2026-06-01')).toBe('2026-05-31'); // Note: in JS, previous date of Jun 1 is May 31.
            
            // Year boundary
            expect(getPreviousDate('2026-01-01')).toBe('2025-12-31');
            
            // Leap year boundary (2024 is leap year, Feb has 29 days)
            expect(getPreviousDate('2024-03-01')).toBe('2024-02-29');
            
            // Non-leap year boundary (2025 is not leap year)
            expect(getPreviousDate('2025-03-01')).toBe('2025-02-28');
        });

        it('getRecentDates should return exactly 5 days with Indonesian labels', () => {
            // Tuesday, June 2, 2026 is "Hi" (Today)
            // Monday, June 1, 2026 is "Km" (Yesterday)
            // Sunday, May 31, 2026 is "Ahd"
            // Saturday, May 30, 2026 is "Sab"
            // Friday, May 29, 2026 is "Jum"
            const recent = getRecentDates();
            expect(recent).toHaveLength(5);
            
            expect(recent[4]).toEqual({ dateStr: '2026-06-02', label: 'Hi', isToday: true });
            expect(recent[3]).toEqual({ dateStr: '2026-06-01', label: 'Km', isToday: false });
            expect(recent[2]).toEqual({ dateStr: '2026-05-31', label: 'Ahd', isToday: false });
            expect(recent[1]).toEqual({ dateStr: '2026-05-30', label: 'Sab', isToday: false });
            expect(recent[0]).toEqual({ dateStr: '2026-05-29', label: 'Jum', isToday: false });
        });
    });

    describe('Activity Streak calculations', () => {
        it('calculateStreak should return 0 if activity log is empty', () => {
            expect(calculateStreak()).toBe(0);
        });

        it('calculateStreak should count consecutive days starting today', () => {
            state.activityLog = ['2026-06-02', '2026-06-01', '2026-05-31'];
            expect(calculateStreak()).toBe(3);
        });

        it('calculateStreak should count consecutive days starting yesterday (today not done yet)', () => {
            state.activityLog = ['2026-06-01', '2026-05-31', '2026-05-30'];
            expect(calculateStreak()).toBe(3);
        });

        it('calculateStreak should return 0 if there is a gap between yesterday and log', () => {
            state.activityLog = ['2026-05-31', '2026-05-30']; // Gap on 2026-06-01
            expect(calculateStreak()).toBe(0);
        });

        it('calculateStreak should deduplicate active dates correctly', () => {
            state.activityLog = ['2026-06-02', '2026-06-02', '2026-06-01', '2026-06-01'];
            expect(calculateStreak()).toBe(2);
        });
    });

    describe('Habit Consistency Scoring (EMA)', () => {
        it('calculateHabitStrength should return 0 for a new uncompleted habit', () => {
            const habit = {
                id: 'h_test',
                scheduleType: 'daily',
                createdAt: new Date('2026-06-02T12:00:00Z').getTime()
            };
            expect(calculateHabitStrength(habit)).toBe(0);
        });

        it('calculateHabitStrength should calculate positive score for completed today', () => {
            const habit = {
                id: 'h_test',
                scheduleType: 'daily',
                createdAt: new Date('2026-06-02T12:00:00Z').getTime(),
                isNumerical: false,
                targetValue: 1
            };
            state.habitRepetitions['h_test'] = {
                '2026-06-02': { value: 1, note: '' }
            };
            
            // Expected math: frequency = 1.0 (daily)
            // multiplier = 0.5 ^ (1.0 / 13) ≈ 0.9479
            // score = 0 * multiplier + 1 * (1 - multiplier) ≈ 0.052
            // Math.round(0.052 * 100) = 5
            expect(calculateHabitStrength(habit)).toBe(5);
        });

        it('calculateHabitStrength should reach close to 100% for a long consecutive completion', () => {
            const habit = {
                id: 'h_test',
                scheduleType: 'daily',
                createdAt: new Date('2026-03-01T12:00:00Z').getTime() // ~90 days ago
            };
            
            const reps = {};
            const d = new Date('2026-03-01T12:00:00Z');
            while (d <= new Date('2026-06-02T12:00:00Z')) {
                reps[getLocalDateString(d)] = { value: 1, note: '' };
                d.setDate(d.getDate() + 1);
            }
            state.habitRepetitions['h_test'] = reps;
            
            // With daily completion over ~90 days, the EMA consistency score should be 99
            expect(calculateHabitStrength(habit)).toBe(99);
        });

        it('calculateHabitStrength should factor scheduleType specific and weekly targets correctly', () => {
            const specificHabit = {
                id: 'h_spec',
                scheduleType: 'specific',
                scheduleDays: [1, 3, 5], // Monday, Wednesday, Friday
                createdAt: new Date('2026-06-02T12:00:00Z').getTime()
            };
            
            // Scheduled days: specificDays.length / 7
            // Multiplier differs. Let's make sure it computes without throwing.
            expect(calculateHabitStrength(specificHabit)).toBe(0);

            const weeklyHabit = {
                id: 'h_week',
                scheduleType: 'weekly',
                weeklyTarget: 3,
                createdAt: new Date('2026-06-02T12:00:00Z').getTime()
            };
            expect(calculateHabitStrength(weeklyHabit)).toBe(0);
        });

        it('calculateHabitStrength should compute fractional scores for partial numerical completions', () => {
            const habit = {
                id: 'h_num_partial',
                scheduleType: 'daily',
                isNumerical: true,
                targetValue: 100,
                createdAt: new Date('2026-06-02T12:00:00Z').getTime()
            };
            
            // Completed 50 out of 100 (50%)
            state.habitRepetitions['h_num_partial'] = {
                '2026-06-02': { value: 50, note: '' }
            };

            // Expected math: frequency = 1.0 (daily)
            // multiplier = 0.5 ^ (1.0 / 13) ≈ 0.9479
            // score = 0 * multiplier + 0.5 (completion ratio) * (1 - multiplier) ≈ 0.026
            // Math.round(0.026 * 100) = 3
            expect(calculateHabitStrength(habit)).toBe(3);
        });

        it('calculateHabitStrength should bypass EMA score calculation for skipped days', () => {
            const habit = {
                id: 'h_skip',
                scheduleType: 'daily',
                createdAt: new Date('2026-06-01T12:00:00Z').getTime()
            };
            
            // June 1: Completed. Score becomes > 0
            // June 2 (Today): Skipped. Score should remain EXACTLY the same as June 1.
            state.habitRepetitions['h_skip'] = {
                '2026-06-01': { value: 1, note: '' },
                '2026-06-02': { skipped: true, note: 'Sick' }
            };

            const scoreSkipped = calculateHabitStrength(habit);
            
            // Compare to if June 2 didn't exist (only June 1 completed) but today is June 1
            const habitOnly1 = { ...habit };
            const todayOriginal = new Date();
            // We can't easily change today in this test without messing up timers, 
            // but we can compute what 1 completed day gives vs what a missed day gives.
            // 1 completed day: ~5
            // If Jun 2 was missed, score would drop: ~5 * 0.9479 ≈ 4.7
            // Since Jun 2 is skipped, score should stay ~5.
            expect(scoreSkipped).toBe(5);
        });
    });

    describe('Habit Streaks & Grace Days', () => {
        it('getHabitStreaks should return 0 if habit does not exist', () => {
            expect(getHabitStreaks('non_existent')).toEqual({ current: 0, best: 0 });
        });

        it('getHabitStreaks should return 0 if repetitions are empty', () => {
            state.habits = [{ id: 'h_empty', scheduleType: 'daily' }];
            expect(getHabitStreaks('h_empty')).toEqual({ current: 0, best: 0 });
        });

        describe('Daily / Specific Habits Streak & Grace Day Logic', () => {
            it('should calculate basic daily streak', () => {
                const habit = {
                    id: 'h_daily',
                    scheduleType: 'daily',
                    createdAt: new Date('2026-05-25T12:00:00Z').getTime()
                };
                state.habits = [habit];
                state.habitRepetitions['h_daily'] = {
                    '2026-06-02': { value: 1, note: '' },
                    '2026-06-01': { value: 1, note: '' },
                    '2026-05-31': { value: 1, note: '' }
                };
                
                const streaks = getHabitStreaks('h_daily');
                expect(streaks.current).toBe(3);
                expect(streaks.best).toBe(3);
            });

            it('should preserve streak using a grace day if score is high (>=80%) and only 1 day is missed', () => {
                const habit = {
                    id: 'h_grace',
                    scheduleType: 'daily',
                    createdAt: new Date('2026-04-01T12:00:00Z').getTime()
                };
                state.habits = [habit];
                
                const reps = {};
                const d = new Date('2026-04-01T12:00:00Z');
                while (d <= new Date('2026-05-31T12:00:00Z')) {
                    reps[getLocalDateString(d)] = { value: 1, note: '' };
                    d.setDate(d.getDate() + 1);
                }
                // Miss 2026-06-01
                // Add 2026-06-02 (today)
                reps['2026-06-02'] = { value: 1, note: '' };
                state.habitRepetitions['h_grace'] = reps;

                const streaks = getHabitStreaks('h_grace');
                // Streak should be April 1 to May 31 (61 days) + June 2 (1 day) = 62 days (preserved by grace day!)
                expect(streaks.current).toBe(62);
            });

            it('should preserve streak using a skipped day without dropping score', () => {
                const habit = {
                    id: 'h_skip_streak',
                    scheduleType: 'daily',
                    createdAt: new Date('2026-05-29T12:00:00Z').getTime()
                };
                state.habits = [habit];
                // Completed: May 29, May 30
                // Skipped: May 31
                // Completed: Jun 1, Jun 2
                state.habitRepetitions['h_skip_streak'] = {
                    '2026-05-29': { value: 1, note: '' },
                    '2026-05-30': { value: 1, note: '' },
                    '2026-05-31': { skipped: true, note: 'Vacation' },
                    '2026-06-01': { value: 1, note: '' },
                    '2026-06-02': { value: 1, note: '' }
                };

                const streaks = getHabitStreaks('h_skip_streak');
                // The streak should be 4 (May 29, 30, Jun 1, 2) since May 31 was explicitly skipped
                expect(streaks.current).toBe(4);
                expect(streaks.best).toBe(4);
            });

            it('should break streak if score is low (<80%) even if 1 day is missed', () => {
                const habit = {
                    id: 'h_low_score',
                    scheduleType: 'daily',
                    createdAt: new Date('2026-05-29T12:00:00Z').getTime()
                };
                state.habits = [habit];
                // Completed: May 29, May 30, (missed May 31), Jun 1, Jun 2
                state.habitRepetitions['h_low_score'] = {
                    '2026-05-29': { value: 1, note: '' },
                    '2026-05-30': { value: 1, note: '' },
                    '2026-06-01': { value: 1, note: '' },
                    '2026-06-02': { value: 1, note: '' }
                };

                const streaks = getHabitStreaks('h_low_score');
                // Streak is reset on May 31. New streak starts Jun 1, Jun 2 -> current streak is 2.
                expect(streaks.current).toBe(2);
                expect(streaks.best).toBe(2);
            });

            it('should break streak if consecutive days are missed (grace day cannot be used twice in a row)', () => {
                const habit = {
                    id: 'h_consec_miss',
                    scheduleType: 'daily',
                    createdAt: new Date('2026-04-01T12:00:00Z').getTime()
                };
                state.habits = [habit];
                
                const reps = {};
                const d = new Date('2026-04-01T12:00:00Z');
                while (d <= new Date('2026-05-30T12:00:00Z')) {
                    reps[getLocalDateString(d)] = { value: 1, note: '' };
                    d.setDate(d.getDate() + 1);
                }
                // Missed May 31, Jun 1
                // Completed Jun 2 (today)
                reps['2026-06-02'] = { value: 1, note: '' };
                state.habitRepetitions['h_consec_miss'] = reps;

                const streaks = getHabitStreaks('h_consec_miss');
                // Streak resets on Jun 1 because grace was already used on May 31.
                // Current streak should be 1 (for Jun 2). Best streak should be 60 (Apr 1 to May 30).
                expect(streaks.current).toBe(1);
                expect(streaks.best).toBe(60);
            });
        });

        describe('Interval Habits Streak & Strength Logic', () => {
            it('should calculate strength for interval habits correctly', () => {
                const habit = {
                    id: 'h_interval',
                    scheduleType: 'interval',
                    intervalDays: 2,
                    anchorDate: '2026-05-30',
                    createdAt: new Date('2026-05-30T12:00:00Z').getTime()
                };
                state.habits = [habit];
                state.habitRepetitions['h_interval'] = {
                    '2026-05-30': { value: 1, note: '' },
                    '2026-06-01': { value: 1, note: '' }
                };
                const score = calculateHabitStrength(habit);
                expect(score).toBeGreaterThan(0);
            });

            it('should calculate streaks for interval habits correctly', () => {
                const habit = {
                    id: 'h_interval_streak',
                    scheduleType: 'interval',
                    intervalDays: 2,
                    anchorDate: '2026-05-30',
                    createdAt: new Date('2026-05-30T12:00:00Z').getTime()
                };
                state.habits = [habit];
                state.habitRepetitions['h_interval_streak'] = {
                    '2026-05-30': { value: 1, note: '' },
                    '2026-06-01': { value: 1, note: '' }
                };
                const streaks = getHabitStreaks('h_interval_streak');
                expect(streaks.current).toBe(2);
                expect(streaks.best).toBe(2);
            });
        });

        describe('Weekly Habits Streak Logic', () => {
            it('should calculate weekly streak based on targets per week (Sunday aligned)', () => {
                const habit = {
                    id: 'h_weekly_test',
                    scheduleType: 'weekly',
                    weeklyTarget: 3,
                    createdAt: new Date('2026-05-17T12:00:00Z').getTime()
                };
                state.habits = [habit];
                state.habitRepetitions['h_weekly_test'] = {
                    '2026-05-18': { value: 1, note: '' }, '2026-05-19': { value: 1, note: '' }, '2026-05-20': { value: 1, note: '' },
                    '2026-05-25': { value: 1, note: '' }, '2026-05-26': { value: 1, note: '' }, '2026-05-27': { value: 1, note: '' },
                    '2026-05-31': { value: 1, note: '' }, '2026-06-01': { value: 1, note: '' }, '2026-06-02': { value: 1, note: '' }
                };

                const streaks = getHabitStreaks('h_weekly_test');
                expect(streaks.current).toBe(3);
                expect(streaks.best).toBe(3);
            });

            it('should not reset streak if target not met in the *current* week yet', () => {
                const habit = {
                    id: 'h_weekly_curr',
                    scheduleType: 'weekly',
                    weeklyTarget: 3,
                    createdAt: new Date('2026-05-17T12:00:00Z').getTime()
                };
                state.habits = [habit];
                state.habitRepetitions['h_weekly_curr'] = {
                    '2026-05-18': { value: 1, note: '' }, '2026-05-19': { value: 1, note: '' }, '2026-05-20': { value: 1, note: '' },
                    '2026-05-25': { value: 1, note: '' }, '2026-05-26': { value: 1, note: '' }, '2026-05-27': { value: 1, note: '' },
                    '2026-06-02': { value: 1, note: '' }
                };

                const streaks = getHabitStreaks('h_weekly_curr');
                expect(streaks.current).toBe(2);
                expect(streaks.best).toBe(2);
            });

            it('should reset streak if target was not met in a *previous* week', () => {
                const habit = {
                    id: 'h_weekly_fail',
                    scheduleType: 'weekly',
                    weeklyTarget: 3,
                    createdAt: new Date('2026-05-17T12:00:00Z').getTime()
                };
                state.habits = [habit];
                state.habitRepetitions['h_weekly_fail'] = {
                    '2026-05-18': { value: 1, note: '' }, '2026-05-19': { value: 1, note: '' }, '2026-05-20': { value: 1, note: '' },
                    '2026-05-25': { value: 1, note: '' },
                    '2026-05-31': { value: 1, note: '' }, '2026-06-01': { value: 1, note: '' }, '2026-06-02': { value: 1, note: '' }
                };

                const streaks = getHabitStreaks('h_weekly_fail');
                expect(streaks.current).toBe(1);
                expect(streaks.best).toBe(1);
            });
        });
    });

    describe('isHabitCompletedOn utility', () => {
        it('should correctly check if habit is completed on date', () => {
            state.habits = [{ id: 'h_util', isNumerical: false, targetValue: 1 }];
            state.habitRepetitions['h_util'] = {
                '2026-06-02': { value: 1, note: '' },
                '2026-06-01': { value: 1, note: '' }
            };
            expect(isHabitCompletedOn('h_util', '2026-06-02')).toBe(true);
            expect(isHabitCompletedOn('h_util', '2026-06-03')).toBe(false);
            expect(isHabitCompletedOn('non_existent', '2026-06-02')).toBe(false);
        });

        it('should correctly evaluate numerical completions based on target values', () => {
            state.habits = [{ id: 'h_num', isNumerical: true, targetValue: 100 }];
            state.habitRepetitions['h_num'] = {
                '2026-06-02': { value: 120, note: '' }, // Exceeds target -> Complete
                '2026-06-01': { value: 100, note: '' }, // Meets target -> Complete
                '2026-05-31': { value: 50, note: '' }   // Below target -> Incomplete
            };

            expect(isHabitCompletedOn('h_num', '2026-06-02')).toBe(true);
            expect(isHabitCompletedOn('h_num', '2026-06-01')).toBe(true);
            expect(isHabitCompletedOn('h_num', '2026-05-31')).toBe(false);
        });
    });

    describe('Habit Reordering (moveHabit)', () => {
        it('should move a habit up', () => {
            state.habits = [
                { id: 'h1', name: 'Habit 1' },
                { id: 'h2', name: 'Habit 2' },
                { id: 'h3', name: 'Habit 3' }
            ];
            
            const success = moveHabit('h2', 'up');
            expect(success).toBe(true);
            expect(state.habits[0].id).toBe('h2');
            expect(state.habits[1].id).toBe('h1');
            expect(state.habits[2].id).toBe('h3');
        });

        it('should move a habit down', () => {
            state.habits = [
                { id: 'h1', name: 'Habit 1' },
                { id: 'h2', name: 'Habit 2' },
                { id: 'h3', name: 'Habit 3' }
            ];
            
            const success = moveHabit('h2', 'down');
            expect(success).toBe(true);
            expect(state.habits[0].id).toBe('h1');
            expect(state.habits[1].id).toBe('h3');
            expect(state.habits[2].id).toBe('h2');
        });

        it('should not move the first habit up', () => {
            state.habits = [
                { id: 'h1', name: 'Habit 1' },
                { id: 'h2', name: 'Habit 2' }
            ];
            
            const success = moveHabit('h1', 'up');
            expect(success).toBe(false);
            expect(state.habits[0].id).toBe('h1');
        });

        it('should not move the last habit down', () => {
            state.habits = [
                { id: 'h1', name: 'Habit 1' },
                { id: 'h2', name: 'Habit 2' }
            ];
            
            const success = moveHabit('h2', 'down');
            expect(success).toBe(false);
            expect(state.habits[1].id).toBe('h2');
        });
    });

    describe('CSV Export Generation', () => {
        it('should generate correct CSV string including skipped entries', () => {
            const habit = {
                id: 'csv_test',
                name: 'CSV Test',
                isNumerical: true,
                targetValue: 100
            };
            
            const reps = {
                '2026-06-01': { value: 100, note: 'Done early' }, // Completed
                '2026-06-02': { skipped: true, note: 'Sick day' }, // Skipped
                '2026-06-03': { value: 50, note: 'Half done' } // Partial
            };
            
            const csv = generateHabitCSVData(habit, reps);
            
            const lines = csv.trim().split('\n');
            expect(lines[0]).toBe('Tanggal,Status,Nilai,Catatan');
            expect(lines[1]).toBe('2026-06-01,Selesai,100,"Done early"');
            expect(lines[2]).toBe('2026-06-02,Dilewati,0,"Sick day"'); // The value for skipped might be 0, but status must be Dilewati
            expect(lines[3]).toBe('2026-06-03,Sebagian,50,"Half done"');
        });
    });
});
