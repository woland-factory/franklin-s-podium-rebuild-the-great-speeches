import { test, expect } from "@playwright/test";

test("the first-run walk appears once, then never again", async ({ page }) => {
  await page.goto("/");

  const walk = page.getByRole("complementary", { name: /getting started/i });
  await expect(walk).toBeVisible();

  await page.getByRole("button", { name: /skip/i }).click();
  await expect(walk).toBeHidden();

  // The dismissal persists across reloads.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  await expect(walk).toBeHidden();
});
