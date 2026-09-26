import { test, expect } from "@playwright/test";

const FAKE_TRANSCRIPT =
  "I am tired of fighting. My heart is sick and sad. I will fight no more.";

test("a non-Gettysburg warm-up reaches the surface labelled with that speaker", async ({
  page,
}) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();

  await page
    .getByRole("button", { name: /i will fight no more forever.*chief joseph, 1877/i })
    .click();
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();

  // The surface renders for the chosen speech.
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  await expect(
    page.getByText("From where the sun now stands I will fight no more forever."),
  ).toBeVisible();

  // The original column is labelled with this speaker, not Lincoln.
  await expect(page.getByText("Chief Joseph").first()).toBeVisible();
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("Lincoln");

  // The differentiator guard: no score, percentage, pass/fail, or red ink.
  expect(body).not.toContain("%");
  expect(await page.locator("del, ins, s").count()).toBe(0);
  expect(await page.locator('[class*="error"], [class*="diff"]').count()).toBe(0);
});
