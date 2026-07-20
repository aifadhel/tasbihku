import { test, expect } from '@playwright/test';

test.describe('TasbihKu Tasbih Mode Switching & Bug Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure we start on the tasbih dashboard in counting mode
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('#page-dashboard.active');
  });

  // =========================================================================
  // MODE SWITCHING TESTS
  // =========================================================================

  test('should show only counting display area in counting mode by default', async ({ page }) => {
    // Counting mode should be the default
    const countingArea = page.locator('#counting-display-area');
    const stopwatchArea = page.locator('#stopwatch-display-area');
    const timerArea = page.locator('#timer-display-area');

    await expect(countingArea).toBeVisible();
    await expect(stopwatchArea).not.toBeVisible();
    await expect(timerArea).not.toBeVisible();

    // Title should say "Hitungan Bebas"
    await expect(page.locator('#dashboard-mode-title')).toHaveText('Hitungan Bebas');
  });

  test('should switch to stopwatch mode and hide counting display', async ({ page }) => {
    await page.click('[data-mode="stopwatch"]');

    const countingArea = page.locator('#counting-display-area');
    const stopwatchArea = page.locator('#stopwatch-display-area');
    const timerArea = page.locator('#timer-display-area');

    await expect(countingArea).not.toBeVisible();
    await expect(stopwatchArea).toBeVisible();
    await expect(timerArea).not.toBeVisible();

    await expect(page.locator('#dashboard-mode-title')).toHaveText('Stopwatch');
    // Stopwatch counter should show initial value
    await expect(page.locator('#stopwatch-counter')).toHaveText('00:00.00');
  });

  test('should switch to timer mode and hide other displays', async ({ page }) => {
    await page.click('[data-mode="timer"]');

    const countingArea = page.locator('#counting-display-area');
    const stopwatchArea = page.locator('#stopwatch-display-area');
    const timerArea = page.locator('#timer-display-area');

    await expect(countingArea).not.toBeVisible();
    await expect(stopwatchArea).not.toBeVisible();
    await expect(timerArea).toBeVisible();

    await expect(page.locator('#dashboard-mode-title')).toHaveText('Timer');
    // Timer counter should show initial value
    await expect(page.locator('#timer-counter')).toHaveText('00:00');
  });

  test('should switch between all three modes in sequence', async ({ page }) => {
    // Counting -> Stopwatch
    await page.click('[data-mode="stopwatch"]');
    await expect(page.locator('#stopwatch-display-area')).toBeVisible();
    await expect(page.locator('#counting-display-area')).not.toBeVisible();

    // Stopwatch -> Timer
    await page.click('[data-mode="timer"]');
    await expect(page.locator('#timer-display-area')).toBeVisible();
    await expect(page.locator('#stopwatch-display-area')).not.toBeVisible();

    // Timer -> Counting
    await page.click('[data-mode="counting"]');
    await expect(page.locator('#counting-display-area')).toBeVisible();
    await expect(page.locator('#timer-display-area')).not.toBeVisible();
  });

  // =========================================================================
  // TIMER PRESET TESTS
  // =========================================================================

  test('should set 1-minute timer via preset button', async ({ page }) => {
    await page.click('[data-mode="timer"]');
    await expect(page.locator('#timer-display-area')).toBeVisible();

    // Click "1m" preset button
    await page.click('button:has-text("1m")');

    // Timer counter should update to 01:00
    await expect(page.locator('#timer-counter')).toHaveText('01:00');
  });

  test('should set 5-minute timer via preset button', async ({ page }) => {
    await page.click('[data-mode="timer"]');
    await expect(page.locator('#timer-display-area')).toBeVisible();

    await page.click('button:has-text("5m")');
    await expect(page.locator('#timer-counter')).toHaveText('05:00');
  });

  test('should set 10-minute timer via preset button', async ({ page }) => {
    await page.click('[data-mode="timer"]');
    await expect(page.locator('#timer-display-area')).toBeVisible();

    await page.click('button:has-text("10m")');
    await expect(page.locator('#timer-counter')).toHaveText('10:00');
  });

  test('should set 30-minute timer via preset button', async ({ page }) => {
    await page.click('[data-mode="timer"]');
    await expect(page.locator('#timer-display-area')).toBeVisible();

    await page.click('button:has-text("30m")');
    await expect(page.locator('#timer-counter')).toHaveText('30:00');
  });

  test('should allow changing timer preset after one is already set', async ({ page }) => {
    await page.click('[data-mode="timer"]');

    // Set 1m first
    await page.click('button:has-text("1m")');
    await expect(page.locator('#timer-counter')).toHaveText('01:00');

    // Change to 5m
    await page.click('button:has-text("5m")');
    await expect(page.locator('#timer-counter')).toHaveText('05:00');
  });

  // =========================================================================
  // GUIDED DZIKIR RESTORE-TO-DEFAULT TESTS
  // =========================================================================

  test('should open dzikir editor for a guided type and show restore button', async ({ page }) => {
    // Navigate to the dzikir menu
    await page.click('button[aria-label="Buka menu dzikir"]');
    await expect(page.locator('#page-menu')).toHaveClass(/active/);

    // Open the editor for "Wirid Ba'da Shalat" (guided type)
    await page.evaluate(() => window.openEditor('wirid'));
    await page.waitForSelector('#page-editor.active');

    // The "Kembalikan ke Default" / restore button should be visible for guided types
    const restoreBtn = page.locator('#editor-btn-restore');
    await expect(restoreBtn).toBeVisible();
  });

  test('should restore guided dzikir to default and navigate back to menu', async ({ page }) => {
    // First, edit a guided dzikir to create custom data in state
    await page.click('button[aria-label="Buka menu dzikir"]');
    await expect(page.locator('#page-menu')).toHaveClass(/active/);

    // Open editor for Wirid (a guided type)
    const wiridEditBtn = page.locator('button[aria-label*="Edit"]').filter({ has: page.locator('svg') }).first();
    // Navigate to wirid editor via the edit icon next to it
    await page.evaluate(() => window.openEditor('wirid'));
    await page.waitForSelector('#page-editor.active');

    // Edit something — change the first page target
    const firstTargetInput = page.locator('#editor-pages-container input[type="number"]').first();
    await firstTargetInput.fill('99');

    // Save the edit
    await page.click('button:has-text("Simpan")');
    // Confirm save modal
    await page.click('#modal-btn-yes');
    await page.waitForSelector('#page-menu.active');

    // Re-open the editor for wirid
    await page.evaluate(() => window.openEditor('wirid'));
    await page.waitForSelector('#page-editor.active');

    // Verify the edited value persisted
    const updatedInput = page.locator('#editor-pages-container input[type="number"]').first();
    await expect(updatedInput).toHaveValue('99');

    // Click the restore button
    const restoreBtn = page.locator('#editor-btn-restore');
    await restoreBtn.click();

    // Confirm the restore modal ("Ya" button)
    await page.click('#modal-btn-yes');

    // Confirm the success modal ("OK" button)
    await page.click('#modal-btn-yes');

    // Should navigate back to menu
    await page.waitForSelector('#page-menu.active');

    // Re-open the editor to verify default data is restored
    await page.evaluate(() => window.openEditor('wirid'));
    await page.waitForSelector('#page-editor.active');

    // The first target should be back to the default value (3 for Astaghfirullah)
    const restoredInput = page.locator('#editor-pages-container input[type="number"]').first();
    await expect(restoredInput).toHaveValue('3');
  });

  // =========================================================================
  // FREE COUNTER INTERACTION TESTS
  // =========================================================================

  test('should increment free counter on main button click', async ({ page }) => {
    // Should be in counting mode by default
    await expect(page.locator('#free-counter')).toHaveText('0');

    // Click the main FAB button
    await page.click('#dashboard-main-btn');
    await expect(page.locator('#free-counter')).toHaveText('1');

    // Click again
    await page.click('#dashboard-main-btn');
    await expect(page.locator('#free-counter')).toHaveText('2');
  });

  // =========================================================================
  // STATE PERSISTENCE ACROSS MODE SWITCHES
  // =========================================================================

  test('should persist free counter when switching modes and back', async ({ page }) => {
    // Increment counter to 3
    await page.click('#dashboard-main-btn');
    await page.click('#dashboard-main-btn');
    await page.click('#dashboard-main-btn');
    await expect(page.locator('#free-counter')).toHaveText('3');

    // Switch to stopwatch
    await page.click('[data-mode="stopwatch"]');
    await expect(page.locator('#stopwatch-display-area')).toBeVisible();

    // Switch back to counting
    await page.click('[data-mode="counting"]');
    await expect(page.locator('#counting-display-area')).toBeVisible();

    // Counter should still show 3
    await expect(page.locator('#free-counter')).toHaveText('3');
  });
});
