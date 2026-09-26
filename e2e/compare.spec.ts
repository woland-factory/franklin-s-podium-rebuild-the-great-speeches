import { test, expect, type Page } from "@playwright/test";

const FAKE_TRANSCRIPT =
  "We are met on a great battlefield of that war. It is fitting and proper that we do this.";

async function warmUp(page: Page) {
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
}

test("redoing a speech opens the previous attempt beside the new one", async ({
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

  await page.getByRole("button", { name: /start warm-up/i }).click();
  await warmUp(page);
  await page.getByRole("button", { name: /record again/i }).click();
  await warmUp(page);

  // From the second take, compare with the previous one.
  await page.getByRole("button", { name: /compare with your last attempt/i }).click();

  // Both attempts render on their own neutral alignment surface.
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toHaveCount(2);

  // The differentiator guard holds in compare: no score, pass/fail, or red ink.
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("%");
  expect(await page.locator("del, ins, s").count()).toBe(0);
  expect(
    await page.locator('[class*="error"], [class*="diff"]').count(),
  ).toBe(0);
});
