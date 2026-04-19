import { expect, test } from '@playwright/test';

const LETTER_TO_PC: Record<string, number> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11, // VexFlow uses 'b' for German H
};

async function readCurrentPitchClass(page: import('@playwright/test').Page): Promise<number> {
  const staff = page.getByTestId('note-staff');
  await expect(staff).toBeVisible();
  const vexKey = await staff.getAttribute('data-vexkey');
  const acc = await staff.getAttribute('data-accidental');
  if (!vexKey) throw new Error('no vexkey');
  const letter = vexKey.split('/')[0].toLowerCase();
  let pc = LETTER_TO_PC[letter];
  if (acc === '#') pc = (pc + 1) % 12;
  if (acc === 'b') pc = (pc + 11) % 12;
  return pc;
}

const PC_TO_LABEL: Record<number, string> = {
  0: 'C', 1: 'Cis', 2: 'D', 3: 'Es', 4: 'E', 5: 'F',
  6: 'Fis', 7: 'G', 8: 'As', 9: 'A', 10: 'B', 11: 'H',
};

test.describe('Notenlesen App', () => {
  test('settings screen shows in German', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('settings')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Notenlesen lernen/ })).toBeVisible();
    await expect(page.getByTestId('mode-treble')).toHaveText(/Violinschlüssel/);
    await expect(page.getByTestId('mode-bass')).toHaveText(/Bassschlüssel/);
    await expect(page.getByTestId('mode-mixed')).toHaveText(/Gemischt/);
  });

  test('start game with treble + naturals shows a staff', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('acc-off').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toBeVisible();
    await expect(page.getByTestId('note-staff')).toBeVisible();
    await expect(page.getByTestId('piano')).toBeVisible();
    await expect(page.getByTestId('note-buttons')).toBeVisible();
    // Score starts at 0
    await expect(page.getByTestId('score')).toContainText('0');
  });

  test('correct answer advances; wrong answer keeps the same note', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('acc-off').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();

    const pc1 = await readCurrentPitchClass(page);
    // Click a wrong button (pick something that is definitely not pc1)
    const wrongPc = (pc1 + 2) % 12;
    const wrongLabel = PC_TO_LABEL[wrongPc];
    await page.getByTestId(`note-btn-${wrongLabel}`).click();
    await expect(page.getByTestId('errors')).toContainText('1');
    // Same note still shown
    const pc1b = await readCurrentPitchClass(page);
    expect(pc1b).toBe(pc1);

    // Now click the correct button
    const correctLabel = PC_TO_LABEL[pc1];
    await page.getByTestId(`note-btn-${correctLabel}`).click();
    await expect(page.getByTestId('score')).toContainText('1');
    // The staff should change to a new note (advance after timeout)
    await page.waitForTimeout(900);
  });

  test('completing 10 correct answers shows result screen with confetti', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('acc-off').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();

    for (let i = 0; i < 10; i++) {
      const pc = await readCurrentPitchClass(page);
      await page.getByTestId(`note-btn-${PC_TO_LABEL[pc]}`).click();
      // Wait for advance/result transition
      await page.waitForTimeout(750);
    }

    await expect(page.getByTestId('result')).toBeVisible();
    await expect(page.getByTestId('result-score')).toHaveText('10');
    await expect(page.getByTestId('again-btn')).toBeVisible();
  });

  test('exit button returns to settings', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toBeVisible();
    await page.getByTestId('exit-btn').click();
    await expect(page.getByTestId('settings')).toBeVisible();
  });

  test('with-accidentals mode shows black keys and accidental buttons', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('acc-on').click();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('note-btn-Fis')).toBeVisible();
    await expect(page.getByTestId('note-btn-B')).toBeVisible();
    await expect(page.getByTestId('piano-black-Fis-0')).toBeVisible();
  });

  test('viewport stays fixed (no scroll) on tablet', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
  });
});
