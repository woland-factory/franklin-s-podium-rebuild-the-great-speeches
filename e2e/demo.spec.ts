import { test, expect } from "@playwright/test";

test("the demo path renders a populated alignment surface with a visible gap", async ({
  page,
}) => {
  await page.goto("/?demo=1");

  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();

  // Real matches: several aligned rows carry both sides.
  const rows = page.getByRole("article");
  expect(await rows.count()).toBeGreaterThan(5);

  // At least one visible gap (a line only one side reached).
  await expect(page.getByText(/in the original, not in yours/i).first()).toBeVisible();

  // Never a score or percentage on the surface.
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("%");
});

test("SEED_DEMO surfaces the differentiator with no manual input", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  // The sample renders immediately without recording or typing.
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /record your version/i }),
  ).toBeVisible();
});
