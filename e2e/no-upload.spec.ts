import { test, expect } from "@playwright/test";

test("makes only same-origin GET requests and uploads nothing", async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const offending: string[] = [];

  page.on("request", (req) => {
    const url = req.url();
    if (url.startsWith("data:") || url.startsWith("blob:")) return;
    const sameOrigin = new URL(url).origin === origin;
    const isGet = req.method() === "GET";
    const hasBody = req.postData() != null;
    if (!sameOrigin || !isGet || hasBody) {
      offending.push(`${req.method()} ${url}${hasBody ? " [body]" : ""}`);
    }
  });

  await page.goto("/?demo=1");
  await expect(
    page.getByRole("heading", { name: /your words beside the original/i }),
  ).toBeVisible();

  expect(offending, `unexpected requests: ${offending.join(", ")}`).toEqual([]);
});
