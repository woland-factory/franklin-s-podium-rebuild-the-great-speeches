import { test, expect, type Page } from "@playwright/test";

const FAKE_TRANSCRIPT =
  "We are met on a great battlefield of that war. It is fitting and proper that we do this.";

async function warmUp(page: Page) {
  await page.getByRole("button", { name: /record your version/i }).click();
  await page.getByRole("button", { name: /stop and transcribe/i }).click();
  await page.getByRole("button", { name: /study alignment/i }).click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
}

test("two warm-ups accumulate and each opens on its stored alignment", async ({
  page,
}) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  await page.goto("/");
  await page.getByRole("button", { name: /skip/i }).click();
  await page
    .getByRole("button", { name: /gettysburg address.*abraham lincoln, 1863/i })
    .click();

  // First warm-up.
  await page.getByRole("button", { name: /start warm-up/i }).click();
  await warmUp(page);
  // Second warm-up via "Record again".
  await page.getByRole("button", { name: /record again/i }).click();
  await warmUp(page);

  // Both attempts are in the archive, newest first.
  await page.getByRole("button", { name: /past attempts \(2\)/i }).click();
  await expect(
    page.getByRole("heading", { name: /the gettysburg address/i }),
  ).toBeVisible();
  const rows = page.locator(".attempt-row");
  await expect(rows).toHaveCount(2);

  // Opening a row shows that attempt's stored alignment surface.
  await rows.first().click();
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();
});

test("more than a page of attempts loads more on demand", async ({ page }) => {
  await page.addInitScript((t) => {
    (window as unknown as { __E2E_TRANSCRIPT__: string }).__E2E_TRANSCRIPT__ = t;
  }, FAKE_TRANSCRIPT);

  // Open the archive once so the app creates the v2 database (stores + index).
  await page.goto("/#/speech/gettysburg/archive");
  await expect(
    page.getByText(/your attempts collect here/i),
  ).toBeVisible();

  // Seed twelve attempts straight into IndexedDB, then reload the archive.
  await page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((res, rej) => {
      const r = indexedDB.open("franklins-podium");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const tx = db.transaction("attempts", "readwrite");
    const store = tx.objectStore("attempts");
    for (let i = 0; i < 12; i++) {
      store.put({
        id: `seed-${i}`,
        speech_id: "gettysburg",
        created_at: 1_000_000 + i,
        mode: "warmup",
        transcript: "",
        corrected_transcript: `Seeded take ${i}`,
        audio_blob: null,
        alignment: [{ spoken: "a", original: "a", relation: "aligned" }],
      });
    }
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  });

  await page.reload();
  const rows = page.locator(".attempt-row");
  await expect(rows).toHaveCount(10);
  await page.getByRole("button", { name: /load more/i }).click();
  await expect(rows).toHaveCount(12);
});
