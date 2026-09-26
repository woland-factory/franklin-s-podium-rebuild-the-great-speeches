import { test, expect } from "@playwright/test";

const FAKE_TRANSCRIPT =
  "We are met on a great battlefield of that war. It is fitting and proper that we do this.";

test("a saved attempt restores on reload and on reopening the speech", async ({
  page,
}) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();

  // Complete a warm-up for Gettysburg.
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();

  // Reloading restores the study surface for that speech.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();

  // Reopening the speech from the library restores it too.
  await page.getByRole("button", { name: /all speeches/i }).first().click();
  await expect(
    page.getByRole("heading", { name: /the speech library/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
});
