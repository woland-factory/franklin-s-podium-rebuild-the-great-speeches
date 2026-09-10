import { test, expect } from "@playwright/test";

test("serves the cross-origin isolation and CSP header set", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response!.headers();

  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["cross-origin-embedder-policy"]).toBe("require-corp");
  expect(headers["cross-origin-resource-policy"]).toBe("same-origin");

  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval'");
  expect(csp).toContain("connect-src 'self' blob:");
  expect(csp).toContain("worker-src 'self' blob:");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
});

test("the page is cross-origin isolated", async ({ page }) => {
  await page.goto("/");
  const isolated = await page.evaluate(() => self.crossOriginIsolated);
  expect(isolated).toBe(true);
});
