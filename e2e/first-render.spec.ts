import { test, expect } from "@playwright/test";

test("first meaningful render shows the speech content without the ASR chunk", async ({
  page,
}) => {
  const jsRequests: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script") jsRequests.push(req.url());
  });

  await page.goto("/");

  // Speech content is visible promptly, painted from bundled static data.
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  await expect(page.getByText(/set the clock back 87 years/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /record your version/i }),
  ).toBeVisible();

  // The Whisper/ASR code path is code-split and not loaded on first paint.
  expect(jsRequests.some((u) => /whisper/i.test(u))).toBe(false);
});
