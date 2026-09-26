import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// A deterministic stubbed transcript so the flow reaches every screen without
// the on-device model. Two sentences give aligned pairs plus a visible gap.
const FAKE_TRANSCRIPT =
  "We are met on a great battlefield of that war. It is fitting and proper that we do this.";

// The rules this pass commits to across every screen, in light and dark. The
// list covers the bar's named minimum: duplicate ids, controls without an
// accessible name, image alt, and color contrast.
const RULES = [
  "color-contrast",
  "duplicate-id",
  "duplicate-id-aria",
  "duplicate-id-active",
  "button-name",
  "link-name",
  "input-button-name",
  "label",
  "select-name",
  "aria-input-field-name",
  "image-alt",
  "role-img-alt",
  "input-image-alt",
  "aria-valid-attr-value",
  "aria-required-attr",
];

async function seedTranscript(page: Page, transcript = FAKE_TRANSCRIPT) {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, transcript);
}

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withRules(RULES).analyze();
  expect(
    results.violations,
    `${label}: ${JSON.stringify(results.violations, null, 2)}`,
  ).toEqual([]);
}

// Drive through every screen in §2, scanning each. Called under both schemes.
async function walkAndScan(page: Page) {
  await seedTranscript(page);
  await page.goto("/");

  // Library, with the first-run walk present.
  await expect(
    page.getByRole("heading", { name: /the speech library/i }),
  ).toBeVisible();
  await scan(page, "library (with first-run walk)");

  await page.getByRole("button", { name: /skip/i }).click();

  // Read screen and its schedule panel.
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  await scan(page, "read + schedule");

  // Record screen.
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await expect(
    page.getByRole("button", { name: /record your version/i }),
  ).toBeVisible();
  await scan(page, "record");

  // Correction step.
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await expect(page.getByLabel(/your spoken reconstruction/i)).toBeVisible();
  await scan(page, "correction");

  // Study surface, then keep a line so the kept state is scanned too.
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  await scan(page, "study");
  await page.getByRole("button", { name: /^keep this line$/i }).first().click();
  await expect(
    page.getByRole("button", { name: /remove this line from your ledger/i }).first(),
  ).toBeVisible();
  await scan(page, "study (kept)");

  // A second attempt so archive and compare have content.
  await page.getByRole("button", { name: /record again/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();

  // Archive.
  await page.getByRole("button", { name: /past attempts \(2\)/i }).click();
  await expect(page.locator(".attempt-row").first()).toBeVisible();
  await scan(page, "archive");

  // A single opened attempt.
  await page.locator(".attempt-row").first().click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
  await scan(page, "opened attempt");
  await page.getByRole("button", { name: /back to archive/i }).click();

  // Compare: two alignment surfaces on one screen, the duplicate-id case.
  const checks = page.getByRole("checkbox");
  await checks.nth(0).check();
  await checks.nth(1).check();
  await page.getByRole("button", { name: /compare selected/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }).first(),
  ).toBeVisible();
  await scan(page, "compare (two surfaces)");

  // Ledger, holding the line kept above.
  await page.getByRole("link", { name: "Ledger" }).click();
  await expect(
    page.getByRole("heading", { name: /lines worth stealing/i }),
  ).toBeVisible();
  await scan(page, "ledger");

  // Paste.
  await page.goto("/#/paste");
  await expect(
    page.getByRole("heading", { name: /practice your own text/i }),
  ).toBeVisible();
  await scan(page, "paste");

  // Settings, with data present so the export controls render.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible();
  await scan(page, "settings");
}

test("no accessibility violations across every screen, light scheme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await walkAndScan(page);
});

test("no accessibility violations across every screen, dark scheme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await walkAndScan(page);
});

test("an error state has no accessibility violations", async ({ page }) => {
  // An empty transcript drives the no-speech error surface.
  await seedTranscript(page, "");
  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await scan(page, "error state");
});

// Reach and operate the core flow with the keyboard alone.
async function focusByTab(page: Page, target: Locator, max = 60) {
  const handle = await target.first().elementHandle();
  if (!handle) throw new Error("target not found");
  for (let i = 0; i < max; i++) {
    const focused = await handle.evaluate((el) => el === document.activeElement);
    if (focused) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("could not reach the target by Tab");
}

test("core flow is fully operable by keyboard: keep a line, then remove it", async ({
  page,
}) => {
  await seedTranscript(page);
  await page.goto("/");

  // Dismiss the walk with the keyboard.
  await focusByTab(page, page.getByRole("button", { name: /skip/i }));
  await page.keyboard.press("Enter");

  // Open a speech.
  await focusByTab(
    page,
    page.getByRole("button", {
      name: /gettysburg address.*abraham lincoln, 1863/i,
    }),
  );
  await page.keyboard.press("Enter");

  // Start the warm-up, record, transcribe, study.
  await focusByTab(page, page.getByRole("button", { name: /start warm-up/i }));
  await page.keyboard.press("Enter");
  await focusByTab(
    page,
    page.getByRole("button", { name: /record your version/i }),
  );
  await page.keyboard.press("Enter");
  await focusByTab(
    page,
    page.getByRole("button", { name: /stop and transcribe/i }),
  );
  await page.keyboard.press("Enter");
  await focusByTab(
    page,
    page.getByRole("button", { name: /study alignment/i }),
  );
  await page.keyboard.press("Enter");

  // Reach and press Keep with the keyboard.
  const keep = page.getByRole("button", { name: /^keep this line$/i }).first();
  await focusByTab(page, keep);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /remove this line from your ledger/i }).first(),
  ).toHaveAttribute("aria-pressed", "true");

  // Open the ledger from the nav.
  await focusByTab(page, page.getByRole("link", { name: "Ledger" }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: /lines worth stealing/i }),
  ).toBeVisible();

  // Remove the kept line with the keyboard, reaching the positive empty state.
  await focusByTab(
    page,
    page.getByRole("button", { name: /remove .* from your ledger/i }),
  );
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/keep the lines you want to carry/i),
  ).toBeVisible();
});
