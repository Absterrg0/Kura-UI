import { expect, type Page, test } from "@playwright/test";
import catalog from "../src/generated/catalog.json" with { type: "json" };

test.skip(
  !process.env.KURA_PW_BROWSER,
  "No Chromium available — install with `pnpm exec playwright install chromium`.",
);

// Primitives are internal building blocks and have no docs page.
const slugs = (catalog as { components: Array<{ slug: string; category: string }> }).components
  .filter((c) => c.category !== "primitives")
  .map((c) => c.slug);
const themes = ["light", "dark"] as const;

async function open(page: Page, path: string, theme: (typeof themes)[number]) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveClass(new RegExp(theme));
  return errors;
}

for (const theme of themes) {
  test(`home (${theme})`, async ({ page }) => {
    const errors = await open(page, "/", theme);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({ path: `.screenshots/home-${theme}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });

  for (const slug of slugs) {
    test(`components/${slug} (${theme})`, async ({ page }) => {
      const errors = await open(page, `/components/${slug}`, theme);
      await expect(page.getByTestId("component-page")).toBeVisible();
      const previews = page.locator("[data-slot=example-preview]");
      await expect(previews.first()).toBeVisible();
      await expect(page.getByText(/Preview crashed|Missing example/)).toHaveCount(0);
      await page.screenshot({ path: `.screenshots/${slug}-${theme}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

test("⌘K search finds components", async ({ page }) => {
  await open(page, "/", "light");
  await page.getByTestId("search-trigger").click();
  await page.getByRole("combobox").fill("thinking");
  await expect(page.getByRole("option", { name: /Shimmer Text/ })).toBeVisible();
});
