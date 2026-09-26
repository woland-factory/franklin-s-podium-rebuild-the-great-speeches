import { test, expect } from "@playwright/test";

const FAKE_TRANSCRIPT =
  "We are met on a great battlefield of that war. It is fitting and proper that we do this.";

async function seedTranscript(page: import("@playwright/test").Page) {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);
}

async function warmUpGettysburg(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
}

test("keep a line, see it in the ledger grouped by source, then remove it", async ({
  page,
}) => {
  await seedTranscript(page);
  await warmUpGettysburg(page);

  // The surface stays neutral: no score or percentage even with keep present.
  expect(await page.locator("body").innerText()).not.toContain("%");

  const keep = page.getByRole("button", { name: /^keep this line$/i }).first();
  await keep.click();
  // The control flips to a kept, removable state.
  await expect(
    page.getByRole("button", { name: /remove this line from your ledger/i }).first(),
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Ledger" }).click();
  await expect(
    page.getByRole("heading", { name: "The Gettysburg Address", level: 2 }),
  ).toBeVisible();

  // Remove the only kept line and the positive empty state returns.
  await page.getByRole("button", { name: /remove .* from your ledger/i }).first().click();
  await expect(
    page.getByText(/keep the lines you want to carry/i),
  ).toBeVisible();
});

test("paste your own text and run the same loop, saved to that source", async ({
  page,
}) => {
  await seedTranscript(page);
  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();
  await page.getByRole("link", { name: /practice your own text/i }).click();

  const passage =
    "We choose to go to the moon in this decade. We do it because it is hard.";
  await page.getByLabel(/your text/i).fill(passage);
  await page.getByRole("button", { name: /find the moves/i }).click();

  // The read screen shows the pasted source's moves and its own-text byline.
  await expect(page.getByRole("heading", { name: /the moves/i })).toBeVisible();
  await expect(page.getByText("Your text").first()).toBeVisible();

  await page.getByRole("button", { name: /start warm-up/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();

  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  // The original column is labelled as the user's own text.
  await expect(page.locator(".pair-role", { hasText: "Your text" }).first()).toBeVisible();

  // The attempt is archived under the pasted source.
  await page.getByRole("button", { name: /past attempts \(1\)/i }).click();
  await expect(page.locator(".attempt-row").first()).toBeVisible();
});

test("an over-cap paste shows a designed error, not a dead end", async ({
  page,
}) => {
  await page.goto("/#/paste");
  await page.getByLabel(/your text/i).fill("a".repeat(10001));
  await page.getByRole("button", { name: /find the moves/i }).click();
  await expect(page.getByRole("alert")).toContainText(/runs long/i);
});

test("export writes local JSON and Markdown downloads, no network", async ({
  page,
}) => {
  await seedTranscript(page);
  await warmUpGettysburg(page); // one attempt so there is something to export

  await page.getByRole("link", { name: "Settings" }).click();

  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /download json/i }).click();
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toBe("franklins-podium.json");
  expect(json.url().startsWith("blob:")).toBe(true);

  const mdDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /download markdown/i }).click();
  const md = await mdDownload;
  expect(md.suggestedFilename()).toBe("franklins-podium.md");
  expect(md.url().startsWith("blob:")).toBe(true);
});
