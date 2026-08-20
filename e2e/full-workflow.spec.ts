import { test, expect, type Page } from "@playwright/test";

/**
 * Full-flow smoke test: Customer request → Coordinator assignment →
 * Driver accept → Messaging → Driver completes → Admin audit review.
 *
 * Uses the demo accounts seeded by `npm run db:seed` (see e2e/README.md).
 * Not executed in this sandbox — see docs/PR_NOTES.md for why.
 */

const PASSWORD = "ChangeMe123!";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("full booking lifecycle across all four roles", async ({ page }) => {
  // 1. Customer submits a booking request via the public form.
  await page.goto("/book");
  await page.getByLabel(/travel date/i).fill("2026-12-15");
  await page.getByLabel(/guests/i).fill("2");
  await page.getByLabel(/^pickup/i).fill("Auckland Airport");
  await page.getByLabel(/drop-off/i).fill("Sky City");
  await page.getByLabel(/your name/i).fill("E2E Test Customer");
  await page.getByLabel(/^email/i).fill("customer@example.com");
  await page.getByLabel(/phone/i).fill("+64211112222");
  await page.getByRole("button", { name: /send booking request/i }).click();
  await expect(page.getByText(/request sent/i)).toBeVisible();
  await expect(page.getByText(/status: request received/i)).toBeVisible();
  const referenceText = await page.getByText(/^SB-/).first().textContent();
  const reference = referenceText?.trim();
  expect(reference).toBeTruthy();

  // 2. Coordinator reviews it, confirms details, and assigns a driver.
  await signIn(page, "coordinator@example.com");
  await page.goto("/coordinator?queue=NEW");
  await page.getByText(reference!).click();
  await page.getByLabel(/confirmed price/i).fill("120");
  await page.getByRole("button", { name: /save details/i }).click();
  await page.getByLabel(/Demo Driver/i).check();
  await page.getByRole("button", { name: /send assignment offer/i }).click();
  await expect(page.getByText(/OFFERED/i)).toBeVisible();

  // 3. Driver accepts the offer.
  await signIn(page, "driver@example.com");
  await page.goto("/driver");
  await page.getByText(reference!).click();
  await page.getByText(/accept trip/i).click();
  await expect(page.getByText(/customer contact/i)).toBeVisible();

  // 4. Messaging opens now that the driver has accepted.
  await page.getByPlaceholder(/write a message/i).fill("On my way to pick you up!");
  await page.getByRole("button", { name: /^send$/i }).click();
  await expect(page.getByText("On my way to pick you up!")).toBeVisible();

  // Customer can see and reply to the message.
  await signIn(page, "customer@example.com");
  await page.goto("/dashboard");
  await page.getByText(reference!).click();
  await expect(page.getByText("On my way to pick you up!")).toBeVisible();
  await page.getByPlaceholder(/write a message/i).fill("Thank you, see you soon.");
  await page.getByRole("button", { name: /^send$/i }).click();

  // 5. Driver progresses the trip to completion.
  await signIn(page, "driver@example.com");
  await page.goto("/driver");
  await page.getByText(reference!).click();
  await page.getByText(/start communicating with customer/i).click();
  await page.getByText(/mark as scheduled/i).click();
  await page.getByText(/start trip/i).click();
  await page.getByText(/mark trip completed/i).click();
  await expect(page.getByText(/trip completed/i)).toBeVisible();

  // 6. Admin reviews the full audit trail for the booking.
  await signIn(page, "admin@example.com");
  await page.goto("/admin/bookings");
  await page.getByPlaceholder(/reference, customer, route/i).fill(reference!);
  await page.getByRole("button", { name: /filter/i }).click();
  await page.getByText(reference!).click();
  await expect(page.getByText(/audit timeline/i)).toBeVisible();
  await expect(page.getByText(/completed/i).first()).toBeVisible();
});

test("role-denial: unauthenticated and wrong-role access is blocked", async ({ page }) => {
  // An unauthenticated visitor hitting a protected route is redirected to sign in.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);

  // A signed-in driver cannot reach the admin or coordinator workspaces.
  await signIn(page, "driver@example.com");
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin$/);
  await page.goto("/coordinator");
  await expect(page).not.toHaveURL(/\/coordinator$/);

  // A signed-in customer cannot reach the driver or coordinator workspaces.
  await signIn(page, "customer@example.com");
  await page.goto("/driver");
  await expect(page).not.toHaveURL(/\/driver$/);
  await page.goto("/coordinator");
  await expect(page).not.toHaveURL(/\/coordinator$/);
});
