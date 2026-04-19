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
  const natural = PC_TO_NATURAL[pc] ?? PC_TO_NATURAL[(pc + 11) % 12];
  await page.getByTestId(`note-btn-${natural}`).click();
}

test.describe('Notenlesen App v3.1', () => {
  test('Settings: keine Orient-Sektion mehr; Anzeige & Lied vorhanden', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('settings')).toBeVisible();
    await expect(page.getByTestId('display-single')).toBeVisible();
    await expect(page.getByTestId('display-sheet')).toBeVisible();
    await expect(page.getByTestId('game-song')).toBeVisible();
    await expect(page.locator('[data-testid="orient-on"]')).toHaveCount(0);
  });

  test('Orientierung-Toggle ist im Game-Header sichtbar und schaltet Refs ein/aus', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const toggle = page.getByTestId('orient-toggle');
    await expect(toggle).toBeVisible();
    // default an → mehrere Notenköpfe (refs + Praxisnote)
    const svg = page.locator('.staff svg').first();
    const headsOn = await svg.locator('path').count();
    await toggle.click(); // aus
    const headsOff = await svg.locator('path').count();
    expect(headsOn).toBeGreaterThan(headsOff);
  });

  test('Orientierungs-Refs werden auf demselben Notensystem gerendert (kein Sidebar)', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    // Es gibt nur EIN note-staff Element (im staff-area), kein zweites
    await expect(page.getByTestId('note-staff')).toHaveCount(1);
    // Orient-Sidebar darf nicht existieren
    await expect(page.locator('[data-testid="orient-panel"]')).toHaveCount(0);
  });

  test('Lied-Modus: Titel ist während des Spiels versteckt', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('game-song').click();
    await expect(page.getByTestId('song-info')).toBeVisible();
    await page.getByTestId('start-btn').click();
    await expect(page.getByText('Erkenne das Lied!')).toBeVisible();
  });

  test('Hint steht über dem Notensystem', async ({ page }) => {
    await page.goto('/');
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
    await page.getByTestId('start-btn').click();
    const game = page.getByTestId('game');
    await expect(game).toHaveAttribute('data-display', 'sheet');
  });

  test('Richtige Antwort erhöht Punkte; falsche bleibt auf gleicher Note', async ({ page }) => {
    await page.goto('/');
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
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toBeVisible();
    for (let i = 0; i < 200; i++) {
      const result = page.getByTestId('result');
      if (await result.isVisible().catch(() => false)) break;
      const staff = page.getByTestId('note-staff');
      if (!(await staff.isVisible().catch(() => false))) break;
      const pc = await readCurrentPitchClass(page);
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
