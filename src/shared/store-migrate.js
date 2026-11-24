/**
 * State hydration defaults and backward-compatible schema migrations.
 * @param {object} rawState
 */
export function migrateLoadedState(rawState) {
  if (typeof rawState.keepScreenOn === 'undefined') rawState.keepScreenOn = false;
  if (typeof rawState.oledMode === 'undefined') rawState.oledMode = false;
  if (typeof rawState.soundEnabled === 'undefined') rawState.soundEnabled = true;
  if (typeof rawState.vibrationEnabled === 'undefined') rawState.vibrationEnabled = true;
  if (typeof rawState.vibrationInterval === 'undefined') rawState.vibrationInterval = 0;
  if (typeof rawState.arabicFontSize === 'undefined') rawState.arabicFontSize = 2.5;
  if (typeof rawState.userName === 'undefined' || rawState.userName === '') rawState.userName = 'SaudaraKu';
  if (typeof rawState.quoteCollapsed !== 'undefined') delete rawState.quoteCollapsed;
  if (typeof rawState.targetLimit === 'undefined') rawState.targetLimit = 0;
  if (!Array.isArray(rawState.customAzkar)) rawState.customAzkar = [];
  if (!Array.isArray(rawState.activityLog)) rawState.activityLog = [];
  if (!rawState.guidedData) rawState.guidedData = {};

  if (typeof rawState.guidedDataVersion === 'undefined' || rawState.guidedDataVersion < 3) {
    if (rawState.guidedData.pagi && rawState.guidedData.pagi.length <= 10) delete rawState.guidedData.pagi;
    if (rawState.guidedData.petang && rawState.guidedData.petang.length <= 10) delete rawState.guidedData.petang;
    if (rawState.guidedData.wirid && rawState.guidedData.wirid.length <= 7) delete rawState.guidedData.wirid;
    rawState.guidedDataVersion = 3;
  }

  if (typeof rawState.appMode === 'undefined') rawState.appMode = 'tasbih';
  if (!Array.isArray(rawState.habits)) rawState.habits = [];
  if (typeof rawState.habitRepetitions !== 'object' || rawState.habitRepetitions === null) rawState.habitRepetitions = {};
  if (typeof rawState.pagiReminderEnabled === 'undefined') rawState.pagiReminderEnabled = false;
  if (typeof rawState.pagiReminderTime === 'undefined') rawState.pagiReminderTime = '06:00';
  if (typeof rawState.petangReminderEnabled === 'undefined') rawState.petangReminderEnabled = false;
  if (typeof rawState.petangReminderTime === 'undefined') rawState.petangReminderTime = '16:00';
  if (typeof rawState.istiqamahGrace === 'undefined') rawState.istiqamahGrace = true;

  rawState.habits.forEach((habit) => {
    if (typeof habit.scheduleType === 'undefined') habit.scheduleType = 'daily';
    if (typeof habit.scheduleDays === 'undefined') habit.scheduleDays = [0, 1, 2, 3, 4, 5, 6];
    if (typeof habit.weeklyTarget === 'undefined') habit.weeklyTarget = 3;
    if (typeof habit.intervalDays === 'undefined') habit.intervalDays = 2;
    if (typeof habit.anchorDate === 'undefined') {
      const d = habit.createdAt ? new Date(habit.createdAt) : new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      habit.anchorDate = `${year}-${month}-${date}`;
    }
    if (typeof habit.reminderEnabled === 'undefined') habit.reminderEnabled = false;
    if (typeof habit.reminderTime === 'undefined') habit.reminderTime = '08:00';
    if (typeof habit.isNumerical === 'undefined') habit.isNumerical = false;
    if (typeof habit.targetValue === 'undefined') habit.targetValue = habit.isNumerical ? 100 : 1;
    if (typeof habit.targetUnit === 'undefined') habit.targetUnit = 'kali';
    if (typeof habit.routineSection === 'undefined') habit.routineSection = 'anytime';
    if (typeof habit.linkedDzikirId === 'undefined') habit.linkedDzikirId = null;
    if (typeof habit.currentStreak === 'undefined') habit.currentStreak = 0;
    if (typeof habit.bestStreak === 'undefined') habit.bestStreak = 0;
    if (typeof habit.strengthScore === 'undefined') habit.strengthScore = 0;
  });

  if (rawState.habitRepetitions && typeof rawState.habitRepetitions === 'object') {
    for (const habitId in rawState.habitRepetitions) {
      const reps = rawState.habitRepetitions[habitId];
      if (Array.isArray(reps)) {
        const migratedReps = {};
        const habit = rawState.habits.find((h) => h.id === habitId);
        const defaultVal = habit ? (habit.targetValue || 1) : 1;
        reps.forEach((dateStr) => {
          if (typeof dateStr === 'string') migratedReps[dateStr] = { value: defaultVal, note: '' };
        });
        rawState.habitRepetitions[habitId] = migratedReps;
      }
    }
  } else {
    rawState.habitRepetitions = {};
  }

  if (rawState.activityLog.length > 400) rawState.activityLog = rawState.activityLog.slice(-400);

  rawState.playerType = null;
  rawState.playerId = null;
  rawState.playerIndex = 0;
  rawState.playerCount = 0;

  if (rawState.customList && Array.isArray(rawState.customList)) {
    rawState.customList = rawState.customList.map((item) => {
      if (item.pages && Array.isArray(item.pages)) return item;
      return {
        id: item.id || Date.now() + Math.random(),
        name: item.name || 'Custom Dzikir',
        pages: [{
          id: Date.now() + Math.random(),
          arabic: '',
          latin: '',
          translation: '',
          reference: '',
          target: item.target || 33
        }]
      };
    });
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  if (rawState.lastOpenedDate && rawState.lastOpenedDate !== todayStr) {
    rawState.freeCount = 0;
  }
  rawState.lastOpenedDate = todayStr;
}
