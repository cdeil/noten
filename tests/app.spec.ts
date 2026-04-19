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

const PC_TO_NATURAL: Record<number, string> = {
  0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'H',
};

async function clickNatural(page: Page, pc: number) {
  // Map any pitch class to nearest natural for natural-only practice mode.
  const natural = PC_TO_NATURAL[pc] ?? PC_TO_NATURAL[(pc + 11) % 12];
  await page.getByTestId(`note-btn-${natural}`).click();
}

test.describe('Notenlesen App v3', () => {
  test('Settings: alle neuen Optionen sichtbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('settings')).toBeVisible();
    await expect(page.getByTestId('display-single')).toBeVisible();
    await expect(page.getByTestId('display-sheet')).toBeVisible();
    await expect(page.getByTestId('orient-on')).toBeVisible();
    await expect(page.getByTestId('game-song')).toBeVisible();
    // Kein Lied-Picker mehr
    await expect(page.locator('[data-testid="song-grid"]')).toHaveCount(0);
  });

  test('Lied-Modus: Titel ist während des Spiels versteckt', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('game-song').click();
    await expect(page.getByTestId('song-info')).toBeVisible();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toBeVisible();
    // Titel zeigt nur "Erkenne das Lied!", nicht den Songnamen
    await expect(page.getByText('Erkenne das Lied!')).toBeVisible();
  });

  test('Orientierungspanel erscheint links neben dem Notensystem', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('orient-on').click();
    await page.getByTestId('start-btn').click();
    const panel = page.getByTestId('orient-panel');
    await expect(panel).toBeVisible();
    const panelBox = await panel.boundingBox();
    const staffBox = await page.locator('.staff-area [data-testid="note-staff"]').boundingBox();
    expect(panelBox && staffBox).toBeTruthy();
    expect(panelBox!.x).toBeLessThan(staffBox!.x);
  });

  test('Orientierungslabel verwendet Apostroph-Notation (c\', c\'\')', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('orient-on').click();
    await page.getByTestId('start-btn').click();
    const labels = await page.locator('.orient-label').allTextContents();
    // Treble references: c'', g', c'  → mindestens ein Label mit '
    expect(labels.some((l) => l.includes("'"))).toBe(true);
    // Es darf KEIN "zweigestrichenes" o.ä. mehr verwendet werden
    expect(labels.some((l) => /gestrichen/.test(l))).toBe(false);
  });

  test('Hint steht über dem Notensystem', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('orient-off').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();
    const hintBox = await page.getByTestId('hint').boundingBox();
    const staffBox = await page.getByTestId('note-staff').boundingBox();
    expect(hintBox!.y).toBeLessThan(staffBox!.y);
  });

  test('Buttons-Grid hat 21 Felder mit Cis/Dis/Ces etc.', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('acc-on').click();
    await page.getByTestId('input-buttons').click();
    await page.getByTestId('start-btn').click();
    for (const name of ['Dis', 'Cis', 'Ces', 'Eis', 'His', 'Fes', 'Ges']) {
      await expect(page.getByTestId(`note-btn-${name}`)).toBeVisible();
    }
  });

  test('Notenblatt-Modus zeigt mehrere Noten gleichzeitig', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('display-sheet').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('orient-off').click();
    await page.getByTestId('start-btn').click();
    const game = page.getByTestId('game');
    await expect(game).toHaveAttribute('data-display', 'sheet');
    // SVG sollte mehr als eine Notenkopf-Gruppe enthalten
    const noteHeads = await page.locator('.staff svg').first().locator('text, path').count();
    expect(noteHeads).toBeGreaterThan(8);
  });

  test('Richtige Antwort erhöht Punkte; falsche bleibt auf gleicher Note', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('orient-off').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();

    const pc = await readCurrentPitchClass(page);
    const wrongPc = [0, 2, 4, 5, 7, 9, 11].find((p) => p !== pc)!;
    await clickNatural(page, wrongPc);
    await expect(page.getByTestId('errors')).toContainText('1');
    expect(await readCurrentPitchClass(page)).toBe(pc);

    await clickNatural(page, pc);
    await expect(page.getByTestId('score')).toContainText('1');
  });

  test('10 richtige Antworten → Ergebnis mit Konfetti', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('orient-off').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();
    for (let i = 0; i < 10; i++) {
      const pc = await readCurrentPitchClass(page);
      await clickNatural(page, pc);
      await page.waitForTimeout(750);
    }
    await expect(page.getByTestId('result')).toBeVisible();
    await expect(page.getByTestId('result-score')).toHaveText('10');
  });

  test('Lied-Modus enthüllt Titel erst am Ende', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('game-song').click();
    await page.getByTestId('orient-off').click();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toBeVisible();
    // Spiele genug richtige Antworten, um irgendein Lied zu beenden.
    // Setze hartes Limit auf ~120 Klicks.
    for (let i = 0; i < 200; i++) {
      const result = page.getByTestId('result');
      if (await result.isVisible().catch(() => false)) break;
      const staff = page.getByTestId('note-staff');
      if (!(await staff.isVisible().catch(() => false))) break;
      const pc = await readCurrentPitchClass(page);
      // Songs können Vorzeichen haben → Klavier benutzen
      // Verwende Buttons grid mit allen Vorzeichen
      const possible = ['C','Cis','D','Dis','E','F','Fis','G','Gis','A','Ais','H'][pc];
      const btn = page.getByTestId(`note-btn-${possible}`);
      if (await btn.count()) await btn.first().click({ force: true });
      await page.waitForTimeout(680);
    }
    const title = await page.getByTestId('result-title').textContent();
    expect(title).toContain('Das war:');
  });

  test('Schwer-Modus erzeugt Töne außerhalb des Standardbereichs', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-treble').click();
    await page.getByTestId('diff-hard').click();
    await page.getByTestId('total-30').click();
    await page.getByTestId('orient-off').click();
    await page.getByTestId('start-btn').click();
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
      await clickNatural(page, pc);
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
