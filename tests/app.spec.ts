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

async function readCurrentVexKey(page: Page): Promise<string> {
  const staff = page.getByTestId('note-staff');
  await expect(staff).toBeVisible();
  const vexKey = await staff.getAttribute('data-vexkey');
  if (!vexKey) throw new Error('no vexkey');
  return vexKey;
}

const PC_TO_NATURAL: Record<number, string> = {
  0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'H',
};

async function clickNatural(page: Page, pc: number) {
  const natural = PC_TO_NATURAL[pc] ?? PC_TO_NATURAL[(pc + 11) % 12];
  await page.getByTestId(`note-btn-${natural}`).click();
}

async function answerCurrentSongNote(page: Page) {
  const pc = await readCurrentPitchClass(page);
  const possible = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'Ais', 'H'][pc];
  await page.getByTestId(`note-btn-${possible}`).first().click({ force: true });
}

test.describe('Musik lernen App v4.1', () => {
  test('Settings split modes and rename hard mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('settings')).toBeVisible();
    await expect(page.getByTestId('mode-notes')).toBeVisible();
    await expect(page.getByTestId('mode-rhythms')).toBeVisible();
    await expect(page.getByTestId('mode-songs')).toBeVisible();
    await expect(page.getByTestId('diff-hard')).toHaveText('Hard mode');
    await expect(page.getByTestId('start-btn')).toHaveText("Let's go");
  });

  test('Orientation toggle stays inline on the same staff', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const toggle = page.getByTestId('orient-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId('note-staff')).toHaveCount(1);
    const refsOn = await page.locator('[data-testid^="ref-label-"]').count();
    await toggle.click();
    const refsOff = await page.locator('[data-testid^="ref-label-"]').count();
    expect(refsOn).toBeGreaterThan(0);
    expect(refsOff).toBe(0);
  });

  test('Hint stays above the staff for wrong note answers', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();
    const pc = await readCurrentPitchClass(page);
    const wrongPc = [0, 2, 4, 5, 7, 9, 11].find((value) => value !== pc)!;
    await clickNatural(page, wrongPc);
    await expect(page.getByTestId('hint')).toHaveText(/Versuch/);
    const hintBox = await page.getByTestId('hint').boundingBox();
    const staffBox = await page.getByTestId('note-staff').boundingBox();
    expect(hintBox!.y).toBeLessThan(staffBox!.y);
  });

  test('Buttons grid still exposes all accidental note names', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('acc-on').click();
    await page.getByTestId('input-buttons').click();
    await page.getByTestId('start-btn').click();
    for (const name of ['Dis', 'Cis', 'Ces', 'Eis', 'His', 'Fes', 'Ges']) {
      await expect(page.getByTestId(`note-btn-${name}`)).toBeVisible();
    }
  });

  test('Sheet mode still shows a multi-note practice staff', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('display-sheet').click();
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toHaveAttribute('data-display', 'sheet');
  });

  test('Correct and wrong note answers keep the expected scoring flow', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('total-10').click();
    await page.getByTestId('start-btn').click();

    const pc = await readCurrentPitchClass(page);
    const wrongPc = [0, 2, 4, 5, 7, 9, 11].find((value) => value !== pc)!;
    await clickNatural(page, wrongPc);
    await expect(page.getByTestId('errors')).toContainText('1');
    expect(await readCurrentPitchClass(page)).toBe(pc);

    await clickNatural(page, pc);
    await expect(page.getByTestId('score')).toContainText('1');
  });

  test('Rhythm mode uses bpm slider, a staff marker, and one big drum pad', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-rhythms').click();
    await expect(page.getByTestId('rhythm-info')).toBeVisible();
    await expect(page.getByTestId('rhythm-bpm')).toBeVisible();
    await page.getByTestId('rhythm-bpm').fill('120');
    await expect(page.getByTestId('rhythm-bpm-value')).toContainText('120');
    await page.getByTestId('start-btn').click();

    await expect(page.getByTestId('game')).toHaveAttribute('data-mode', 'rhythms');
    await expect(page.getByTestId('beat-row')).toHaveCount(0);
    await expect(page.getByTestId('rhythm-marker')).toHaveCount(1);
    await expect(page.getByTestId('drum-pad')).toBeVisible();
    await expect(page.locator('[data-testid^="measure-break-"]')).toHaveCount(1);
    await expect(page.getByTestId('orient-toggle')).toHaveCount(0);
    await page.waitForTimeout(4300);
    await expect(page.getByTestId('note-staff')).toHaveAttribute('data-marker-index', /[0-9]+/);
    await expect(page.getByTestId('note-staff')).toHaveAttribute('data-active-note-index', /[0-9]+/);
    const syncedIndices = async () => {
      const markerIndex = await page.getByTestId('note-staff').getAttribute('data-marker-index');
      const activeIndex = await page.getByTestId('note-staff').getAttribute('data-active-note-index');
      expect(markerIndex).toBe(activeIndex);
    };
    await syncedIndices();
    await expect(page.getByTestId('note-staff')).toHaveAttribute('data-note-states', /current/);
    await page.waitForTimeout(650);
    await syncedIndices();
  });

  test('Rhythm timing follows rests, half notes, and bar-one accent alignment', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0.41;
    });
    await page.goto('/');
    await page.getByTestId('mode-rhythms').click();
    await page.getByTestId('rhythm-bpm').fill('60');
    await expect(page.getByTestId('rhythm-bpm-value')).toContainText('60');
    await page.getByTestId('start-btn').click();

    const game = page.getByTestId('game');
    const staff = page.getByTestId('note-staff');

    await expect.poll(() => game.getAttribute('data-rhythm-beat'), { timeout: 1500 }).toBe('1');
    await expect.poll(() => staff.getAttribute('data-active-note-index'), { timeout: 1500 }).toBe('0');

    await page.waitForTimeout(4200);
    await expect.poll(() => game.getAttribute('data-rhythm-beat'), { timeout: 1200 }).toBe('1');
    await expect.poll(() => staff.getAttribute('data-active-note-index'), { timeout: 1200 }).toBe('0');

    await page.waitForTimeout(1000);
    await expect.poll(() => game.getAttribute('data-rhythm-beat'), { timeout: 1200 }).toBe('2');
    await expect.poll(() => staff.getAttribute('data-active-note-index'), { timeout: 1200 }).toBe('1');

    await page.waitForTimeout(3000);
    await expect.poll(() => game.getAttribute('data-rhythm-beat'), { timeout: 1200 }).toBe('1');
    await expect.poll(() => staff.getAttribute('data-active-note-index'), { timeout: 1200 }).toBe('4');

    await page.waitForTimeout(1000);
    await expect.poll(() => game.getAttribute('data-rhythm-beat'), { timeout: 1200 }).toBe('2');
    await expect.poll(() => staff.getAttribute('data-active-note-index'), { timeout: 1200 }).toBe('4');

    await page.waitForTimeout(1000);
    await expect.poll(() => game.getAttribute('data-rhythm-beat'), { timeout: 1200 }).toBe('3');
    await expect.poll(() => staff.getAttribute('data-active-note-index'), { timeout: 1200 }).toBe('5');
  });

  test('Selected song mode shows melody and text but no metronome UI', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-songs').click();
    await expect(page.getByTestId('song-metronome-on')).toHaveCount(0);
    await page.getByTestId('song-selected').click();
    await page.getByTestId('song-select').selectOption('entchen');
    await page.getByTestId('song-text-on').click();
    await page.getByTestId('start-btn').click();

    await expect(page.getByTestId('game')).toHaveAttribute('data-mode', 'songs');
    await expect(page.locator('.game-title')).toContainText('Alle meine Entchen');
    await expect(page.getByTestId('song-text')).toBeVisible();
    await expect(page.getByTestId('beat-guide')).toHaveCount(0);
  });

  test('Random guess song mode keeps the title hidden during play', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-songs').click();
    await page.getByTestId('song-random').click();
    await expect(page.getByTestId('song-info')).toBeVisible();
    await page.getByTestId('start-btn').click();
    await expect(page.getByText('Random guess')).toBeVisible();
    await expect(page.getByTestId('song-text')).toHaveCount(0);
  });

  test('Selected songs can be completed and reveal the played title in the result', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-songs').click();
    await page.getByTestId('song-selected').click();
    await page.getByTestId('song-select').selectOption('haenschen');
    await page.getByTestId('start-btn').click();

    for (let index = 0; index < 60; index++) {
      if (await page.getByTestId('result').isVisible().catch(() => false)) break;
      await answerCurrentSongNote(page);
      await page.waitForTimeout(720);
    }

    await expect(page.getByTestId('result')).toBeVisible();
    await expect(page.getByTestId('result-title')).toContainText('Hänschen klein');
  });

  test('Song mode lets me choose playback feel and does not block the next note', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mode-songs').click();
    await page.getByTestId('song-selected').click();
    await page.getByTestId('song-select').selectOption('haenschen');
    await page.getByTestId('song-playback-replace').click();
    await page.getByTestId('start-btn').click();

    await expect(page.getByTestId('game')).toHaveAttribute('data-song-playback', 'replace');
    const firstKey = await readCurrentVexKey(page);
    await answerCurrentSongNote(page);
    await expect.poll(() => page.getByTestId('note-staff').getAttribute('data-vexkey')).not.toBe(firstKey);
  });

  test('Hard note mode still reaches pitches outside the normal range', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('clef-treble').click();
    await page.getByTestId('diff-hard').click();
    await page.getByTestId('total-30').click();
    await page.getByTestId('start-btn').click();
    const seenMidis = new Set<number>();

    for (let index = 0; index < 20; index++) {
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

    const hasExtreme = [...seenMidis].some((midi) => midi < 60 || midi > 81);
    expect(hasExtreme).toBe(true);
  });

  test('Viewport still does not scroll during the game', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
  });
});
