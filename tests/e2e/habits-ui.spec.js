import { test, expect } from '@playwright/test';

test.describe('TasbihKu E2E UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Notification API in browser environment to allow notification testing
    await page.addInitScript(() => {
      class MockNotification {
        constructor(title, options) {
          this.title = title;
          this.options = options;
        }
        static get permission() { return 'granted'; }
        static requestPermission() { return Promise.resolve('granted'); }
      }
      window.Notification = MockNotification;
    });
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should toggle OLED mode correctly and apply styling to body', async ({ page }) => {
    // 1. Open the settings menu page
    await page.click('button[aria-label="Buka menu dzikir"]');
    await expect(page.locator('#page-menu')).toHaveClass(/active/);

    // 2. Locate the OLED toggle checkbox and verify it is not checked
    const oledToggle = page.locator('#toggle-oled');
    await expect(oledToggle).not.toBeChecked();

    // 3. Toggle OLED mode on
    await page.click('label:has(#toggle-oled)');
    await expect(oledToggle).toBeChecked();
    await expect(page.locator('body')).toHaveClass(/oled-mode/);

    // 4. Toggle OLED mode off
    await page.click('label:has(#toggle-oled)');
    await expect(oledToggle).not.toBeChecked();
    await expect(page.locator('body')).not.toHaveClass(/oled-mode/);
  });

  test('should navigate to Habits, create a habit, open its details, and close details', async ({ page }) => {
    // 1. Switch to Habit mode
    await page.click('#mode-habit-btn');
    await expect(page.locator('#habit-dashboard-view')).toBeVisible();

    // 2. Verify empty habits state
    await expect(page.locator('.habit-empty-card')).toBeVisible();

    // 3. Open habit creation modal
    await page.click('button:has-text("Tambah Kebiasaan")');
    await expect(page.locator('#habit-modal')).toBeVisible();
    await expect(page.locator('#habit-modal')).toHaveCSS('opacity', '1');

    // 4. Fill and save new habit
    await page.fill('#habit-input-name', 'Membaca Al-Qur\'an');
    await page.fill('#habit-input-desc', 'Satu halaman setelah shalat Subuh');
    await page.click('#habit-modal button:has-text("Simpan")');

    // 5. Verify modal closed and card is rendered
    await expect(page.locator('#habit-modal')).not.toBeVisible();
    const habitCard = page.locator('.habit-card');
    await expect(habitCard).toBeVisible();
    await expect(habitCard.locator('.habit-title')).toHaveText('Membaca Al-Qur\'an');

    // 6. Click habit card to open Habit Detail Modal
    await page.click('.habit-info');
    const detailModal = page.locator('#habit-detail-modal');
    await expect(detailModal).toBeVisible();
    await expect(detailModal).toHaveClass(/active/);
    await expect(detailModal.locator('#habit-detail-title')).toHaveText('Membaca Al-Qur\'an');

    // 7. Close detail modal via back button
    await detailModal.locator('button[aria-label="Kembali"]').click();
    await expect(detailModal).not.toHaveClass(/active/);
    await expect(detailModal).not.toBeVisible();
  });

  test('should toggle Dzikir Pagi and Petang reminders and verify time input visibility', async ({ page }) => {
    // 1. Open the settings menu page
    await page.click('button[aria-label="Buka menu dzikir"]');
    await expect(page.locator('#page-menu')).toHaveClass(/active/);

    // 2. Verify Dzikir Pagi reminder elements
    const pagiToggle = page.locator('#toggle-pagi-reminder');
    const pagiTimeInput = page.locator('#input-pagi-reminder-time');
    await expect(pagiToggle).not.toBeChecked();
    await expect(pagiTimeInput).not.toBeVisible();

    // 3. Toggle Dzikir Pagi reminder on
    await page.click('label:has(#toggle-pagi-reminder)');
    await expect(pagiToggle).toBeChecked();
    await expect(pagiTimeInput).toBeVisible();
    await expect(pagiTimeInput).toHaveValue('06:00');

    // 4. Change Dzikir Pagi reminder time
    await pagiTimeInput.fill('07:30');
    await expect(pagiTimeInput).toHaveValue('07:30');

    // 5. Verify Dzikir Petang reminder elements
    const petangToggle = page.locator('#toggle-petang-reminder');
    const petangTimeInput = page.locator('#input-petang-reminder-time');
    await expect(petangToggle).not.toBeChecked();
    await expect(petangTimeInput).not.toBeVisible();

    // 6. Toggle Dzikir Petang reminder on
    await page.click('label:has(#toggle-petang-reminder)');
    await expect(petangToggle).toBeChecked();
    await expect(petangTimeInput).toBeVisible();
    await expect(petangTimeInput).toHaveValue('16:00');

    // 7. Toggle Dzikir Pagi reminder off
    await page.click('label:has(#toggle-pagi-reminder)');
    await expect(pagiToggle).not.toBeChecked();
    await expect(pagiTimeInput).not.toBeVisible();
  });

  test('should create a numerical target habit, log custom values with notes, and display notes in details modal', async ({ page }) => {
    // 1. Switch to Habit mode
    await page.click('#mode-habit-btn');
    await expect(page.locator('#habit-dashboard-view')).toBeVisible();

    // 2. Open habit creation modal
    await page.click('button:has-text("Tambah Kebiasaan")');
    await expect(page.locator('#habit-modal')).toBeVisible();

    // 3. Fill details and toggle numerical target
    await page.fill('#habit-input-name', 'Sholawat Nabi');
    await page.fill('#habit-input-desc', 'Membaca Sholawat harian');
    
    // Check the toggle for Target Angka
    await page.click('label:has(#habit-input-numerical)');
    await expect(page.locator('#habit-numerical-fields-container')).toBeVisible();

    await page.fill('#habit-input-target-val', '500');
    await page.fill('#habit-input-target-unit', 'kali');
    
    await page.click('#habit-modal button:has-text("Simpan")');
    await expect(page.locator('#habit-modal')).not.toBeVisible();

    // 4. Verify habit card is rendered with numerical targets
    const habitCard = page.locator('.habit-card');
    await expect(habitCard).toBeVisible();
    await expect(habitCard.locator('.habit-progress-mini')).toContainText('0 / 500 kali');

    // 5. Single click today's bubble to auto-complete (should fill to 500)
    // Tapping the last bubble in the list (index 4 is today)
    const todayBubble = habitCard.locator('.habit-day-bubble').nth(4);
    await todayBubble.click();
    
    // The click event has a 250ms timeout delay to distinguish double taps, so wait a bit
    await page.waitForTimeout(300);
    await expect(habitCard.locator('.habit-progress-mini')).toContainText('500 / 500 kali');

    // 6. Double click today's bubble to open Log Modal
    await todayBubble.dblclick();
    const logModal = page.locator('#habit-log-modal');
    await expect(logModal).toBeVisible();
    await expect(page.locator('#habit-log-value')).toHaveValue('500');

    // 7. Change logged value and add note
    await page.fill('#habit-log-value', '250');
    await page.fill('#habit-log-note', 'Selesai sebagian sore hari');
    await page.click('#habit-log-modal button:has-text("Simpan")');
    
    await expect(logModal).not.toBeVisible();
    await expect(habitCard.locator('.habit-progress-mini')).toContainText('250 / 500 kali');
    // Check that bubble has class 'partial'
    await expect(todayBubble).toHaveClass(/partial/);

    // 8. Open detailed analytics modal
    await page.click('.habit-info');
    const detailModal = page.locator('#habit-detail-modal');
    await expect(detailModal).toBeVisible();

    // 9. Verify that notes list displays the daily log note
    const notesList = detailModal.locator('.habit-notes-list');
    await expect(notesList).toBeVisible();
    await expect(notesList).toContainText('Selesai sebagian sore hari');
    await expect(notesList).toContainText('(250 / 500 kali)');

    // 10. Close detail modal
    await detailModal.locator('button[aria-label="Kembali"]').click();
    await expect(detailModal).not.toBeVisible();
  });

  test('should click habit presets and fill form fields correctly', async ({ page }) => {
    // 1. Switch to Habit mode
    await page.click('#mode-habit-btn');
    await expect(page.locator('#habit-dashboard-view')).toBeVisible();

    // 2. Open habit creation modal
    await page.click('button:has-text("Tambah Kebiasaan")');
    await expect(page.locator('#habit-modal')).toBeVisible();

    // 3. Click Tilawah preset and assert
    await page.click('button:has-text("Tilawah")');
    await expect(page.locator('#habit-input-name')).toHaveValue("Tilawah Al-Qur'an");
    await expect(page.locator('#habit-input-desc')).toHaveValue("Membaca Al-Qur'an harian");
    await expect(page.locator('#habit-input-routine')).toHaveValue("anytime");
    await expect(page.locator('#habit-input-numerical')).toBeChecked();
    await expect(page.locator('#habit-input-target-val')).toHaveValue('1');
    await expect(page.locator('#habit-input-target-unit')).toHaveValue('juz');

    // 4. Click Dhuha preset and assert
    await page.click('button:has-text("Dhuha")');
    await expect(page.locator('#habit-input-name')).toHaveValue("Shalat Dhuha");
    await expect(page.locator('#habit-input-desc')).toHaveValue("Melaksanakan shalat sunnah Dhuha");
    await expect(page.locator('#habit-input-routine')).toHaveValue("pagi");
    await expect(page.locator('#habit-input-numerical')).toBeChecked();
    await expect(page.locator('#habit-input-target-val')).toHaveValue('2');
    await expect(page.locator('#habit-input-target-unit')).toHaveValue('rakaat');

    // 5. Close modal
    await page.click('#habit-modal button:has-text("Batal")');
    await expect(page.locator('#habit-modal')).not.toBeVisible();
  });

  test('should archive a habit, show it in archived list, and restore it', async ({ page }) => {
    // 1. Switch to Habit mode
    await page.click('#mode-habit-btn');
    await expect(page.locator('#habit-dashboard-view')).toBeVisible();

    // 2. Open habit creation modal
    await page.click('button:has-text("Tambah Kebiasaan")');
    await expect(page.locator('#habit-modal')).toBeVisible();

    // 3. Fill and save a habit
    await page.fill('#habit-input-name', 'Sedekah Subuh');
    await page.click('#habit-modal button:has-text("Simpan")');
    await expect(page.locator('#habit-modal')).not.toBeVisible();

    // 4. Verify habit card is visible
    const habitCard = page.locator('.habit-card').first();
    await expect(habitCard).toBeVisible();

    // 5. Click card to open Detail Modal
    await page.click('.habit-info');
    const detailModal = page.locator('#habit-detail-modal');
    await expect(detailModal).toBeVisible();

    // 6. Click Edit, then Archive
    await page.click('#habit-detail-edit-btn');
    await expect(page.locator('#habit-modal')).toBeVisible();
    await page.click('#habit-btn-archive');

    // 7. Confirm archive modal
    const confirmModal = page.locator('#modal-overlay');
    await expect(confirmModal).toBeVisible();
    await page.click('#modal-btn-yes');

    // 8. Verify modals closed and card removed from active list
    await expect(confirmModal).not.toBeVisible();
    await expect(detailModal).not.toBeVisible();
    await expect(page.locator('.habit-card:not(.archived)')).not.toBeVisible();

    // 9. Click archived section header to expand it
    const archivedHeader = page.locator('.archived-section-header');
    await expect(archivedHeader).toBeVisible();
    await archivedHeader.click();

    // 10. Verify archived card is visible
    const archivedCard = page.locator('.habit-card.archived');
    await expect(archivedCard).toBeVisible();
    await expect(archivedCard.locator('.habit-title')).toHaveText('Sedekah Subuh');

    // 11. Click Pulihkan (Restore)
    await archivedCard.locator('.btn-restore').click();

    // 12. Verify habit is restored back to active
    await expect(page.locator('.habit-card:not(.archived)')).toBeVisible();
    await expect(page.locator('.habit-card:not(.archived) .habit-title')).toHaveText('Sedekah Subuh');
  });

  test('should trigger habit completion and show celebration toast via Dzikir Stacking', async ({ page }) => {
    // 1. Switch to Habit mode
    await page.click('#mode-habit-btn');
    await expect(page.locator('#habit-dashboard-view')).toBeVisible();

    // 2. Open habit creation modal
    await page.click('button:has-text("Tambah Kebiasaan")');
    await expect(page.locator('#habit-modal')).toBeVisible();

    // 3. Fill and link a habit to Sesi Setelah Shalat (guided-wirid)
    await page.fill('#habit-input-name', 'Wirid Fardhu Stacking');
    await page.selectOption('#habit-input-linked-dzikir', 'guided-wirid');
    await page.click('#habit-modal button:has-text("Simpan")');
    await expect(page.locator('#habit-modal')).not.toBeVisible();

    // 4. Verify habit card is created
    const habitCard = page.locator('.habit-card').first();
    await expect(habitCard).toBeVisible();

    // 5. Trigger the stacking completed call via window and show toast
    await page.evaluate(() => {
        const completed = window.checkAndTriggerLinkedHabit('guided-wirid');
        if (completed && completed.length > 0) {
            completed.forEach(name => window.showStackingCelebrationToast(name));
        }
    });

    // 6. Verify celebration toast appears
    const toast = page.locator('#stacking-toast-container .stacking-toast');
    await expect(toast).toBeVisible();
    await expect(toast.locator('.stacking-toast-body')).toContainText('Wirid Fardhu Stacking');

    // 7. Wait for the toast to automatically fade out and be removed
    await expect(toast).not.toBeVisible({ timeout: 6000 });
  });
});
