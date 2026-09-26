import { test, expect } from "@playwright/test";

test("Back returns to the prior view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();

  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /start warm-up/i }).click();
  await expect(
    page.getByRole("button", { name: /record your version/i }),
  ).toBeVisible();

  // Back leaves the warm-up and lands on the read screen again.
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /start warm-up/i }),
  ).toBeVisible();

  // Back again returns to the library.
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: /the speech library/i }),
  ).toBeVisible();
});

test("a valid deep link opens that speech's read screen", async ({ page }) => {
  await page.goto("/#/speech/fight-no-more");
  await expect(
    page.getByRole("heading", { name: /i will fight no more forever/i }),
  ).toBeVisible();
  await expect(page.getByText(/chief joseph, 1877/i)).toBeVisible();
});

test("an unknown id shows the designed not-found state with a way back", async ({
  page,
}) => {
  await page.goto("/#/speech/this-is-not-real");

  // A designed state in the product's voice, never a blank screen or raw error.
  await expect(
    page.getByRole("heading", { name: /choose a speech/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/pick one from the library to start/i),
  ).toBeVisible();

  // The control routes back to the library.
  await page.getByRole("button", { name: /all speeches/i }).click();
  await expect(
    page.getByRole("heading", { name: /the speech library/i }),
  ).toBeVisible();
});
