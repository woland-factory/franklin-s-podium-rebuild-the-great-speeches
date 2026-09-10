import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 800 } });

async function noHorizontalScroll(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return el.scrollWidth <= el.clientWidth + 1;
  });
}

test("the read screen has no horizontal scroll at 390px", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("the alignment surface has no horizontal scroll at 390px", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});
