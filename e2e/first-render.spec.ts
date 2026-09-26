import { test, expect } from "@playwright/test";

test("the library renders fast without the ASR chunk, then opens a speech", async ({
  page,
}) => {
  const jsRequests: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script") jsRequests.push(req.url());
  });

  await page.goto("/");

  // The library paints real speech cards from bundled static data.
  await expect(
    page.getByRole("heading", { name: /the speech library/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i }),
  ).toBeVisible();

  // Opening a speech shows its content, still painted from static data.
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  await expect(page.getByText(/set the clock back 87 years/i)).toBeVisible();

  // The Whisper/ASR code path is code-split and not loaded before recording.
  expect(jsRequests.some((u) => /whisper/i.test(u))).toBe(false);
});
