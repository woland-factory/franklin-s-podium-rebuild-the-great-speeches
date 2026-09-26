import { test, expect } from "@playwright/test";

const FAKE_TRANSCRIPT = "We are met on a great battlefield of that war.";

test.use({ viewport: { width: 390, height: 800 } });

async function noHorizontalScroll(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return el.scrollWidth <= el.clientWidth + 1;
  });
}

test("no horizontal scroll across library, read, record, and study at 390px", async ({
  page,
}) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  // Library.
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /the speech library/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);

  await page.getByRole("button", { name: /skip/i }).click();

  // Read screen.
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);

  // Record screen.
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await expect(
    page.getByRole("button", { name: /record your version/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);

  // Study screen.
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("no horizontal scroll on the schedule panel, archive, and compare at 390px", async ({
  page,
}) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();

  // Schedule panel, none then waiting.
  await expect(
    page.getByRole("heading", { name: /schedule a cold attempt/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  await page.getByRole("button", { name: /^2 days$/ }).click();
  await expect(page.getByText(/opens in 2 days/i).first()).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);

  // Two warm-ups so the archive and compare have content.
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await page.getByRole("button", { name: /record again/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();

  // Archive.
  await page.getByRole("button", { name: /past attempts \(2\)/i }).click();
  await expect(page.locator(".attempt-row").first()).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);

  // Compare, stacked single column at this width.
  const checks = page.getByRole("checkbox");
  await checks.nth(0).check();
  await checks.nth(1).check();
  await page.getByRole("button", { name: /compare selected/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }).first(),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("no horizontal scroll on the ledger, paste, and settings screens at 390px", async ({
  page,
}) => {
  await page.goto("/#/ledger");
  await expect(
    page.getByRole("heading", { name: /lines worth stealing/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);

  await page.goto("/#/paste");
  await expect(
    page.getByRole("heading", { name: /practice your own text/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);

  await page.goto("/#/settings");
  await expect(
    page.getByRole("heading", { name: /^settings$/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});
