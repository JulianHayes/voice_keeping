import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { alder, playful, draft, response } from '../fixtures.js';

async function importProfile(page, profile, confirm = true) {
  await page.locator('#import-profile').setInputFiles({ name: 'profile.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(profile)) });
  await expect(page.getByRole('dialog')).toBeVisible();
  if (confirm) await page.getByRole('button', { name: 'Confirm profile', exact: true }).click();
}
async function mockAI(page, review = response) {
  await page.route('**/api/rewrite', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, source: 'gemini', review }) }));
}
async function readDownload(download) {
  const stream = await download.createReadStream();
  const parts = [];
  for await (const part of stream) parts.push(part);
  return Buffer.concat(parts).toString('utf8');
}
test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('create, confirm, review, choose changes, copy and download the Alder draft [mock AI]', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Create your profile' }).click();
  await page.getByLabel('Brand name', { exact: true }).fill(alder.name);
  await page.getByLabel('Who are you writing for?').fill(alder.audience);
  await page.getByLabel('Voice principles', { exact: true }).fill(alder.principles.join('\n'));
  await page.getByLabel('Words or phrases to avoid').fill('seamless');
  await page.getByRole('button', { name: 'Confirm profile', exact: true }).click();
  await expect(page.locator('#profile-status')).toContainText('Profile confirmed');
  await mockAI(page);
  await page.locator('#draft').fill(draft);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#edited-draft')).toHaveValue(draft.replace('seamless', 'simple'));
  await expect(page.locator('#draft')).toHaveValue(draft);
  await expect(page.locator('#local-findings')).toContainText('1 match');
  await page.getByRole('checkbox').uncheck();
  await expect(page.locator('#edited-draft')).toHaveValue(draft);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Copy edit', exact: true }).click();
  await expect(page.locator('#copy-status')).toHaveText('Copied to clipboard.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(draft.replace('seamless', 'simple'));
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download edit', exact: true }).click();
  expect(await readDownload(await downloadEvent)).toBe(draft.replace('seamless', 'simple'));
});

test('profile download round trip, empty lists and no prior-brand leakage', async ({ page }) => {
  await importProfile(page, alder);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export profile', exact: true }).click();
  expect(JSON.parse(await readDownload(await downloadEvent))).toEqual(alder);
  await importProfile(page, playful, false);
  await expect(page.locator('#profile-avoid')).toHaveValue('');
  await expect(page.locator('#preferred-rows')).toBeEmpty();
  await page.getByRole('button', { name: 'Confirm profile', exact: true }).click();
  await page.locator('#draft').fill(draft);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#local-findings')).toContainText('0 matches');
  await expect(page.locator('#profile-summary')).toContainText('Confetti Club');
  await expect(page.locator('#profile-summary')).not.toContainText('seamless');
});

test('malformed import keeps the confirmed profile and explains the failure', async ({ page }) => {
  await importProfile(page, alder);
  await page.locator('#import-profile').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('#profile-status')).toContainText('Import failed');
  await expect(page.locator('#profile-summary')).toContainText('Alder Studio');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await importProfile(page, playful, false);
  await page.getByRole('button', { name: 'Close profile form' }).click();
  await expect(page.locator('#profile-summary')).toContainText('Alder Studio');
});

test('actual missing credentials keep the original and local findings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await importProfile(page, alder);
  await page.locator('#draft').fill(draft);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#review-status')).toContainText('AI rewriting is not set up');
  await expect(page.locator('#local-findings')).toContainText('seamless');
  await expect(page.locator('#draft')).toHaveValue(draft);
  await expect(page.locator('#suggestion')).toBeHidden();
  await page.screenshot({ path: 'review-assets/desktop.png', fullPage: true });
});

for (const mode of ['network', 'provider', 'malformed-json', 'malformed-review']) {
  test(`${mode} failure preserves the draft and shows no edit [mock response]`, async ({ page }) => {
    await importProfile(page, alder);
    await page.route('**/api/rewrite', route => mode === 'network' ? route.abort('failed') : route.fulfill({
      status: mode === 'provider' ? 503 : 200, contentType: 'application/json',
      body: mode === 'malformed-json' ? 'broken' : JSON.stringify(mode === 'provider' ? { success: false, code: 'provider_unavailable' } : { success: true, source: 'gemini', review: { options: ['unrelated payment copy'] } })
    }));
    await page.locator('#draft').fill(draft);
    await page.getByRole('button', { name: 'Review draft' }).click();
    await expect(page.locator('#review-status')).toContainText('unchanged');
    await expect(page.locator('#local-findings')).toContainText('1 match');
    await expect(page.locator('#draft')).toHaveValue(draft);
    await expect(page.locator('#suggestion')).toBeHidden();
  });
}

test('clean copy receives no invented change [mock AI]', async ({ page }) => {
  await importProfile(page, alder);
  await mockAI(page, { edits: [], decisions: [] });
  const text = 'Use the workbook to plan your brand voice.';
  await page.locator('#draft').fill(text);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#edited-draft')).toHaveValue(text);
  await expect(page.locator('#change-summary')).toContainText('No changes suggested');
  await expect(page.locator('#local-findings')).toContainText('0 matches');
});

test('two contrasting profiles determine tone suggestions [mock AI based on request profile]', async ({ page }) => {
  await page.route('**/api/rewrite', route => {
    const { profile } = route.request().postDataJSON();
    const review = profile.name === 'Alder Studio' ? { edits: [{ quote: 'rather nice', replacement: 'useful', ruleId: 'principle-3', reason: 'Your principle asks for specific wording.' }], decisions: [] } : { edits: [], decisions: [] };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, source: 'gemini', review }) });
  });
  await importProfile(page, alder);
  await page.locator('#draft').fill('A rather nice plan!');
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#ai-findings')).toContainText('Tone suggestion');
  await expect(page.locator('#edited-draft')).toHaveValue('A useful plan!');
  await importProfile(page, playful);
  await expect(page.locator('#suggestion')).toBeHidden();
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#edited-draft')).toHaveValue('A rather nice plan!');
});

test('editing a draft cancels stale responses', async ({ page }) => {
  await importProfile(page, alder);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let received;
  const requestReceived = new Promise(resolve => { received = resolve; });
  await page.route('**/api/rewrite', async route => { received(); await gate; await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, source: 'gemini', review: response }) }).catch(() => {}); });
  await page.locator('#draft').fill(draft);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await requestReceived;
  await page.locator('#draft').fill('My new draft.');
  release();
  await expect(page.locator('#review-status')).toContainText('changed');
  await expect(page.locator('#suggestion')).toBeHidden();
  await expect(page.locator('#draft')).toHaveValue('My new draft.');
});

test('keyboard dialog, visible focus and accessibility scan', async ({ page }) => {
  await page.getByRole('button', { name: 'Create your profile' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#profile-name')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#profile-language')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#edit-profile')).toBeFocused();
  expect(await page.locator('#edit-profile').evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
  await importProfile(page, alder);
  await mockAI(page);
  await page.locator('#draft').fill(draft);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#suggestion')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('320px screen stacks profile, draft and review with no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await importProfile(page, { ...alder, name: 'A very long brand name for checking how the profile wraps on a narrow screen' });
  await page.locator('#draft').fill(draft);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#review-status')).toContainText('not set up');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const profile = await page.locator('.profile-panel').boundingBox();
  const writing = await page.locator('.draft-panel').boundingBox();
  const review = await page.locator('.review-panel').boundingBox();
  expect(writing.y).toBeGreaterThan(profile.y + profile.height);
  expect(review.y).toBeGreaterThan(writing.y + writing.height);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'review-assets/mobile.png', fullPage: true });
});

test('logo holds its final V, respects reduced motion and does not replay during editing', async ({ page }) => {
  await expect(page.locator('#voice-mark')).toHaveAttribute('data-phase', 'settled');
  const finalShape = await page.locator('#voice-mark path').evaluateAll(paths => paths.map(path => path.getAttribute('d')));
  await page.locator('#draft').fill('A new draft.');
  expect(await page.locator('#voice-mark path').evaluateAll(paths => paths.map(path => path.getAttribute('d')))).toEqual(finalShape);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('#voice-mark')).toHaveAttribute('data-phase', 'settled');
  expect(await page.locator('#voice-mark path').evaluateAll(paths => paths.map(path => path.getAttribute('d')))).toEqual(finalShape);
  await page.locator('.identity').screenshot({ path: 'review-assets/logo-vertical-v.png' });
});

test('factual changes become decisions and clipboard denial is honest [mock AI]', async ({ page, context }) => {
  await importProfile(page, alder);
  await mockAI(page, { edits: [{ quote: '£29', replacement: '£19', ruleId: 'principle-1', reason: 'Mock attempted price change.' }], decisions: [] });
  await page.locator('#draft').fill(draft);
  await page.getByRole('button', { name: 'Review draft' }).click();
  await expect(page.locator('#decisions')).toContainText('withheld');
  await expect(page.locator('#edited-draft')).toHaveValue(draft);
  await context.clearPermissions();
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Test: clipboard denied'); }; });
  await page.getByRole('button', { name: 'Copy edit', exact: true }).click();
  await expect(page.locator('#copy-status')).toContainText('Copy was blocked');
  await expect(page.locator('#edited-draft')).toBeFocused();
});
