import { expect, test, type Page } from '@playwright/test';

async function startDefaultGame(page: Page) {
  await page.goto('/');
  await page.getByTestId('start-btn').click();
  await expect(page.getByTestId('game')).toBeVisible();
}

test.describe('Visual layout v4.1', () => {
  test('Treble orientation refs show only c\' g\' c\'\' g\'\'', async ({ page }) => {
    await startDefaultGame(page);
    await expect(page.getByTestId('ref-label-60')).toBeVisible();
    await expect(page.getByTestId('ref-label-67')).toBeVisible();
    await expect(page.getByTestId('ref-label-72')).toBeVisible();
    await expect(page.getByTestId('ref-label-79')).toBeVisible();
    await expect(page.getByTestId('ref-label-64')).toHaveCount(0);
    await expect(page.getByTestId('ref-label-76')).toHaveCount(0);
  });

  test('Orientation refs have no stems and no guide lines', async ({ page }) => {
    await startDefaultGame(page);
    const stemCount = await page.locator('.staff svg g.vf-stavenote[fill="#94a3b8"] g.vf-stem').count();
    expect(stemCount).toBe(0);
    await expect(page.locator('[data-testid^="ref-guide-"]')).toHaveCount(0);
    await expect(page.locator('.staff svg ellipse[fill="white"]')).toHaveCount(0);
  });

  test('Orientation refs are stacked in one vertical line with no visible circles', async ({ page }) => {
    await startDefaultGame(page);
    const c1 = await page.getByTestId('ref-head-60').boundingBox();
    const g1 = await page.getByTestId('ref-head-67').boundingBox();
    const c2 = await page.getByTestId('ref-head-72').boundingBox();
    const g2 = await page.getByTestId('ref-head-79').boundingBox();
    expect(c1 && g1 && c2 && g2).toBeTruthy();
    expect(Math.abs(c1!.x - g1!.x)).toBeLessThan(3);
    expect(Math.abs(c1!.x - c2!.x)).toBeLessThan(3);
    expect(Math.abs(c1!.x - g2!.x)).toBeLessThan(3);
    await expect(page.locator('.staff svg circle')).toHaveCount(0);
  });

  test('Practice note sits close to the vertical orientation column', async ({ page }) => {
    await startDefaultGame(page);
    const refBox = await page.getByTestId('ref-head-79').boundingBox();
    const practiceBox = await page.locator('.staff svg g.vf-stavenote').last().boundingBox();
    expect(refBox && practiceBox).toBeTruthy();
    const dx = practiceBox!.x - (refBox!.x + refBox!.width);
    expect(dx).toBeGreaterThan(35);
    expect(dx).toBeLessThan(95);
  });

  test('Bass helper column shows only one ledger line above for c\'', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('clef-bass').click();
    await page.getByTestId('start-btn').click();
    await expect(page.getByTestId('game')).toBeVisible();
    await expect(page.locator('[data-testid^="ref-ledger-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="ref-ledger-60-"]')).toHaveCount(1);
    await expect(page.locator('.staff svg g.vf-stavenote[fill="transparent"] path')).toHaveCount(0);
  });

  test('Orientation helper notes stay close to the normal note size', async ({ page }) => {
    await startDefaultGame(page);
    const refBox = await page.getByTestId('ref-head-60').boundingBox();
    const noteheadBox = await page.locator('.staff svg g.vf-stavenote').last().locator('g.vf-notehead path').first().boundingBox();
    expect(refBox && noteheadBox).toBeTruthy();
    expect(refBox!.width).toBeGreaterThan(noteheadBox!.width * 0.8);
    expect(refBox!.width).toBeLessThan(noteheadBox!.width * 1.3);
    expect(refBox!.height).toBeGreaterThan(noteheadBox!.height * 0.8);
    expect(refBox!.height).toBeLessThan(noteheadBox!.height * 1.3);
  });

  test('Orientation toggle stays icon-only', async ({ page }) => {
    await startDefaultGame(page);
    const text = (await page.getByTestId('orient-toggle').textContent()) ?? '';
    expect(text).not.toMatch(/Orientierung/i);
    expect(text.trim().length).toBeLessThan(6);
  });

  test('Idle hint keeps effectively no visible row', async ({ page }) => {
    await startDefaultGame(page);
    const box = await page.getByTestId('hint').boundingBox();
    if (box) expect(box.height).toBeLessThan(2);
  });
});

test.describe('Mobile / phone fits', () => {
  test('Phone (390x844): input buttons fit fully inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const button = page.getByTestId('note-btn-C').first();
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(32);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('Phone: piano keys also fit inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const piano = page.getByTestId('piano');
    const box = await piano.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('Tablet (1024x768): everything still fits without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.getByTestId('start-btn').click();
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
  });
});
