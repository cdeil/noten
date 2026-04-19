import { expect, test, type Page } from '@playwright/test';

const LETTER_TO_PC: Record<string, number> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11,
};

async function readCurrentPitchClass(page: Page): Promise<number> {
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

// Map pitch class -> a button name guaranteed to exist in the natural row
const PC_TO_NATURAL: Record<number, string> = {
  0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'H',
};

test.describe('Notenlesen App', () => {
  test('Settings: keine Mischung mehr, neue Modi sichtbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('settings')).toBeVisible();
    await expect(page.getByTestId('mode-treble')).toBeVisible();
    await expect(page.getByTestId('mode-bass')).toBeVisible();
    await expect(page.locator('[data-testid="mode-mixed"]')).toHaveCount(0);
    await expect(page.getByTestId('diff-normal')).toBeVisible();
    await expect(page.getByTestId('diff-hard')).toBeVisible();
    await expect(page.getByTestId('input-buttons')).toBeVisible();
    await expect(page.getByTestId('input-piano')).toBeVisible();
    await expect(page.getByTestId('input-both')).toBeVisible();
    await expect(page.getByTestId('orient-on')).toBeVisible();
    await expect(page.getByTestId('game-song')).toBeVisible();
  });

  test('Üben: Hint steht über dem Notensystem', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();
    const hintBox = await page.getByTestId('hint').boundingBox();
    const staffBox = await page.getByTestId('note-staff').boundingBox();
    expect(hintBox && staffBox).toBeTruthy();
    expect(hintBox!.y).toBeLessThan(staffBox!.y);
  });

  test('Buttons-Grid hat 21 Felder mit Dis/Cis/Ces etc.', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('acc-on').click();
    await page.getByTestId('input-buttons').click();
    await page.getByTestId('start-btn').click();
    for (const name of ['Dis', 'Cis', 'Ces', 'Eis', 'His', 'Fes', 'Ges']) {
      await expect(page.getByTestId(`note-btn-${name}`)).toBeVisible();
    }
  });

  test('Piano zeigt schwarze Tasten mit Cis/Des Doppelbeschriftung', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-piano').click();
    await page.getByTestId('start-btn').click();
    const blackKey = page.getByTestId('piano-black-Cis-0');
    await expect(blackKey).toBeVisible();
    await expect(blackKey).toContainText('Cis');
    await expect(blackKey).toContainText('Des');
  });

  test('Richtige Antwort erhöht Punkte; falsche bleibt auf gleicher Note', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('acc-off').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();

    const pc = await readCurrentPitchClass(page);
    const wrongPc = [0, 2, 4, 5, 7, 9, 11].find((p) => p !== pc)!;
    await page.getByTestId(`note-btn-${PC_TO_NATURAL[wrongPc]}`).click();
    await expect(page.getByTestId('errors')).toContainText('1');
    expect(await readCurrentPitchClass(page)).toBe(pc);

    await page.getByTestId(`note-btn-${PC_TO_NATURAL[pc]}`).click();
    await expect(page.getByTestId('score')).toContainText('1');
  });

  test('10 richtige Antworten => Ergebnis mit Konfetti', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();
    for (let i = 0; i < 10; i++) {
      const pc = await readCurrentPitchClass(page);
      await page.getByTestId(`note-btn-${PC_TO_NATURAL[pc]}`).click();
      await page.waitForTimeout(750);
    }
    await expect(page.getByTestId('result')).toBeVisible();
    await expect(page.getByTestId('result-score')).toHaveText('10');
  });

  test('Orientierungstöne werden vor dem Spiel gezeigt', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('orient-on').click();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('orientation-intro')).toBeVisible();
    await expect(page.getByText(/Orientierungstöne/)).toBeVisible();
    await page.getByTestId('intro-continue').click();
    await expect(page.getByTestId('game')).toBeVisible();
  });

  test('Lied-Modus zeigt Auswahl und spielbare Sequenz', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('game-song').click();
    await expect(page.getByTestId('song-grid')).toBeVisible();
    await page.getByTestId('song-entchen').click();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toBeVisible();
    // Erste drei Noten von "Alle meine Entchen" sind C, D, E
    for (const expected of [0, 2, 4]) {
      const pc = await readCurrentPitchClass(page);
      expect(pc).toBe(expected);
      await page.getByTestId(`note-btn-${PC_TO_NATURAL[pc]}`).click();
      await page.waitForTimeout(750);
    }
  });

  test('Schwer-Modus generiert auch Töne außerhalb des Standardbereichs', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('diff-hard').click();
    await page.getByTestId('total-30').click();
    await page.getByTestId('start-btn').click();
    // Sammle ein paar Notenpositionen — im hard mode sollten manche außerhalb 60..81 liegen
    const seenMidis = new Set<number>();
    for (let i = 0; i < 20; i++) {
      const staff = page.getByTestId('note-staff');
      const vex = await staff.getAttribute('data-vexkey');
      if (vex) {
        const [letter, octStr] = vex.split('/');
        const pc = LETTER_TO_PC[letter.toLowerCase()];
        const midi = (parseInt(octStr, 10) + 1) * 12 + pc;
        seenMidis.add(midi);
      }
      const pc = await readCurrentPitchClass(page);
      await page.getByTestId(`note-btn-${PC_TO_NATURAL[pc]}`).click();
      await page.waitForTimeout(700);
    }
    const hasExtreme = [...seenMidis].some((m) => m < 60 || m > 81);
    expect(hasExtreme).toBe(true);
  });

  test('Viewport scrollt nicht im Spiel', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const sh = await page.evaluate(() => document.documentElement.scrollHeight);
    const ch = await page.evaluate(() => document.documentElement.clientHeight);
    expect(sh).toBeLessThanOrEqual(ch + 1);
  });
});
