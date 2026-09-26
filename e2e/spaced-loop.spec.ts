import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const FAKE_TRANSCRIPT =
  "From this ground I will speak the words again. It is fitting and proper that we do this.";

test("schedule a cold attempt, wait, download the calendar file, then it opens", async ({
  page,
}) => {
  // Control the clock so the reveal can be reached without a real wait.
  await page.clock.install();
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();

  // First visit lands on the read screen with the schedule panel.
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /schedule a cold attempt/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /start warm-up/i }),
  ).toBeVisible();

  // Choose a two-day gap. The panel moves to waiting.
  await page.getByRole("button", { name: /^2 days$/ }).click();
  await expect(page.getByText(/opens in 2 days/i).first()).toBeVisible();

  // The cold attempt is closed while the warm-up stays available.
  await expect(
    page.getByRole("button", { name: /cold attempt opens in/i }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /start warm-up/i }),
  ).toBeEnabled();

  // The calendar file downloads locally as text/calendar.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /add to calendar/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.ics$/);
  const contents = readFileSync(await download.path(), "utf8");
  expect(contents).toContain("BEGIN:VCALENDAR");
  expect(contents).toContain("DTSTART:");

  // Move past the reveal. The cold attempt opens as the primary action.
  await page.clock.fastForward(2 * 86_400_000 + 120_000);
  await expect(
    page.getByRole("button", { name: /start cold attempt/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /start cold attempt/i }).click();

  // Complete the cold attempt.
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();

  // The completed attempt is recorded as a cold take in the archive.
  await page.getByRole("button", { name: /past attempts/i }).click();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  await expect(page.getByText("Cold", { exact: true }).first()).toBeVisible();
});
