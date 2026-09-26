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
