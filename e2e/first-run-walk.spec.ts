import { test, expect } from "@playwright/test";

const FAKE_TRANSCRIPT = "We are met on a great battlefield of that war.";

test("the walk spans the screens, then never returns", async ({ page }) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  await page.goto("/");

  const walk = page.getByRole("complementary", { name: /getting started/i });
  await expect(walk).toBeVisible();

  // Step 1 active on the library.
  await expect(walk.getByText(/pick a speech/i)).toHaveAttribute(
    "aria-current",
    "step",
  );

  // Advancing to the read screen moves the active step.
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await expect(walk.getByText(/read the moves/i)).toHaveAttribute(
    "aria-current",
    "step",
  );

  // Recording moves it again.
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await expect(walk.getByText(/record your version/i)).toHaveAttribute(
    "aria-current",
    "step",
  );

  // Complete one alignment.
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();

  // The walk is gone after the first success.
  await expect(walk).toBeHidden();

  // It stays gone across a reload.
  await page.reload();
  await expect(walk).toBeHidden();

  // And when opening a different speech.
  await page.getByRole("button", { name: /all speeches/i }).first().click();
  await page
    .getByRole("button", { name: /i will fight no more forever.*chief joseph/i })
    .click();
  await expect(walk).toBeHidden();
});

test("skipping the walk hides it for good", async ({ page }) => {
  await page.goto("/");
  const walk = page.getByRole("complementary", { name: /getting started/i });
  await expect(walk).toBeVisible();
  await page.getByRole("button", { name: /skip/i }).click();
  await expect(walk).toBeHidden();
  await page.reload();
  await expect(walk).toBeHidden();
});
