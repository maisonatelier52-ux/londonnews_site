import { expect, test } from "@playwright/test";

test("homepage, taxonomy, and classifieds routes render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("London News").first()).toBeVisible();

  await page.goto("/category/politics");
  await expect(page.getByText("Politics").first()).toBeVisible();

  await page.goto("/topics/westminster");
  await expect(page.getByText("Westminster").first()).toBeVisible();

  await page.goto("/classifieds");
  await expect(page.getByText("Classifieds").first()).toBeVisible();

  await page.goto("/search?q=politics");
  await expect(page.getByText(/result/i).first()).toBeVisible();
});

test("public APIs expose readiness and CDN cache headers", async ({ request }) => {
  const readiness = await request.get("/api/readyz");
  expect(readiness.ok()).toBeTruthy();

  const homepage = await request.get("/api/public/homepage");
  expect(homepage.ok()).toBeTruthy();
  expect(homepage.headers()["cache-control"]).toContain("s-maxage=60");

  const categories = await request.get("/api/public/categories?mode=tree");
  expect(categories.ok()).toBeTruthy();
  expect(categories.headers()["cache-control"]).toContain("s-maxage=300");
});

test("admin login and homepage desk render", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jmhv@londonnews.local");
  await page.getByLabel("Password").fill("LondonNews123!");
  await page.getByRole("button", { name: "Enter newsroom" }).click();

  await page.waitForURL("**/admin");
  await expect(page.getByText("Editorial dashboard")).toBeVisible();

  await page.goto("/admin/homepage");
  await expect(page.getByText("Front page control")).toBeVisible();
});

test("classified submission flow accepts a valid listing", async ({ page }) => {
  await page.goto("/classifieds/submit");

  await page.getByLabel("Category").selectOption({ index: 1 });
  await page.getByLabel("Price").fill("GBP 495");
  await page.getByLabel("Title").fill("Smoke test listing");
  await page.getByLabel("Location").fill("Canary Wharf");
  await page.getByLabel("Summary").fill("A short smoke-test summary for the classifieds desk.");
  await page.getByLabel("Description").fill("Detailed smoke-test listing copy with enough information for review.");
  await page.getByLabel("Seller name").fill("Smoke Tester");
  await page.getByLabel("Seller email").fill("smoke@example.com");
  await page.getByRole("button", { name: "Submit listing" }).click();

  await expect(
    page.getByText("Your listing has been sent to the London News classifieds desk for review.")
  ).toBeVisible();
});

test("newsletter signup and public contact routes accept submissions", async ({ page }) => {
  await page.goto("/subscribe");
  await page.getByPlaceholder("Email address").fill("reader@example.com");
  await page.getByRole("button", { name: "Join the list" }).click();
  await expect(page.getByText("You are now subscribed to London News updates.")).toBeVisible();

  await page.goto("/page/contact");
  await page.getByPlaceholder("Your name").fill("Reader Example");
  await page.getByPlaceholder("Email address").fill("reader@example.com");
  await page.getByPlaceholder("Subject").fill("Reader feedback");
  await page.getByPlaceholder("How can London News help?").fill(
    "I would like to send editorial feedback through the public contact route."
  );
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message has been sent to the London News team.")).toBeVisible();
});

test("classified detail route accepts moderated enquiries", async ({ page }) => {
  await page.goto("/classifieds");
  const firstListing = page.locator('a[href^="/classifieds/"]').first();
  await firstListing.click();

  await page.getByPlaceholder("Your name").fill("Buyer Example");
  await page.getByPlaceholder("Email address").fill("buyer@example.com");
  await page.getByPlaceholder("Phone number (optional)").fill("02079460000");
  await page.getByPlaceholder("Your enquiry").fill(
    "I would like more information about this listing and the next steps."
  );
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Your enquiry has been sent to the London News classifieds desk.")).toBeVisible();
});
