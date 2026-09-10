import { test, expect } from "@playwright/test";

// The transcription is injected through the E2E seam so alignment is
// deterministic and the on-device model never loads in CI.
const FAKE_TRANSCRIPT =
  "We are met on a great battlefield of that war. It is fitting and proper that we do this.";

test("record, correct, and study runs end to end with a stubbed transcript", async ({
  page,
}) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  await page.goto("/");

  // Dismiss the first-run walk to keep the flow focused.
  await page.getByRole("button", { name: /skip/i }).click();

  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();

  // Correction step shows the cleaned transcript as an editable default.
  const box = page.getByLabel(/your spoken reconstruction/i);
  await expect(box).toBeVisible();
  await expect(box).toHaveValue(/fitting and proper/i);

  await page.getByRole("button", { name: /study alignment/i }).click();

  // The alignment surface renders the user's sentences beside the original.
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  await expect(
    page.getByText("It is altogether fitting and proper that we should do this."),
  ).toBeVisible();

  // The recorded take is replayable from the surface.
  await expect(page.locator("audio")).toHaveCount(1);
});
