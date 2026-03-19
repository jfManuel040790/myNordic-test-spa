import { test, expect } from "@playwright/test";

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe("myNordic OAuth Flow", () => {
  test("page loads with both login buttons visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("myNordic OAuth Test Harness");
    await expect(page.locator("#login")).toBeVisible();
    await expect(page.locator("#login")).toHaveText("Log in with myNordic AD B2C");
    await expect(page.locator("#portal-login")).toBeVisible();
    await expect(page.locator("#portal-login")).toHaveText(
      "Log in via myNordic portal",
    );
    await expect(page.locator("#output")).toHaveText("Not authenticated.");
    await expect(page.locator("#logout")).toBeHidden();
  });

  test("login button redirects to Azure CIAM login page", async ({ page }) => {
    await page.goto("/");
    await page.locator("#login").click();
    await page.waitForURL(/nordicsemiextprod\.ciamlogin\.com/, {
      timeout: 15_000,
    });
    expect(page.url()).toContain("nordicsemiextprod.ciamlogin.com");
  });

  test("full login flow: authenticate and return with tokens", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#login").click();

    // Wait for the Azure CIAM login page to load
    await page.waitForURL(/ciamlogin\.com/, { timeout: 15_000 });

    // Azure CIAM / Entra External ID login: enter email
    const emailInput = page.getByRole("textbox", { name: "Email address" });
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });
    await emailInput.fill(TEST_USER_EMAIL);

    await page.getByRole("button", { name: "Next" }).click();

    // Enter password
    const passwordInput = page.getByRole("textbox", { name: "Password" });
    await passwordInput.waitFor({ state: "visible", timeout: 15_000 });
    await passwordInput.fill(TEST_USER_PASSWORD);

    // Click "Sign in"
    await page.getByRole("button", { name: "Sign in" }).click();

    // Handle potential "Stay signed in?" or consent prompt
    try {
      const acceptButton = page.getByRole("button", { name: /accept|yes|stay signed in/i });
      await acceptButton.waitFor({ state: "visible", timeout: 5_000 });
      await acceptButton.click();
    } catch {
      // No consent/stay-signed-in prompt — continue
    }

    // Wait for redirect back to our app
    await page.waitForURL(/localhost:8080/, { timeout: 30_000 });

    // Verify the auth result is displayed
    await expect(page.locator("#logout")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#login")).toBeHidden();

    const outputText = await page.locator("#output").textContent();
    const authResult = JSON.parse(outputText);

    // Verify tokens are present
    expect(authResult).toHaveProperty("idToken");
    expect(authResult).toHaveProperty("account");
    expect(authResult.account).toHaveProperty("localAccountId");
    expect(authResult.account).toHaveProperty("name");

    // Verify idTokenClaims
    expect(authResult).toHaveProperty("idTokenClaims");
    expect(authResult.idTokenClaims).toHaveProperty("oid");
    expect(authResult.idTokenClaims).toHaveProperty("name");
  });

  test("portal button redirects to myNordic sign-up page with redirect_uri", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#portal-login").click();
    await page.waitForURL(/mynordic\.nordicsemi\.com/, { timeout: 15_000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/en/sign-up/create-account");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:8080/mynordic/callback",
    );
  });

  test.skip("full portal login flow: authenticate via myNordic portal and return with tokens", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#portal-login").click();

    // Wait for the myNordic portal to load
    await page.waitForURL(/mynordic\.nordicsemi\.com/, { timeout: 15_000 });

    // The portal shows a "Create account" page; click "Log In" for existing users
    const logInLink = page.getByRole("link", { name: "Log In" });
    await logInLink.waitFor({ state: "visible", timeout: 15_000 });
    await logInLink.click();

    // Wait for the Azure CIAM login page
    await page.waitForURL(/ciamlogin\.com/, { timeout: 15_000 });

    // Enter email
    const emailInput = page.getByRole("textbox", { name: "Email address" });
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });
    await emailInput.fill(TEST_USER_EMAIL);
    await page.getByRole("button", { name: "Next" }).click();

    // Enter password
    const passwordInput = page.getByRole("textbox", { name: "Password" });
    await passwordInput.waitFor({ state: "visible", timeout: 15_000 });
    await passwordInput.fill(TEST_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Handle potential "Stay signed in?" or consent prompt
    try {
      const acceptButton = page.getByRole("button", {
        name: /accept|yes|stay signed in/i,
      });
      await acceptButton.waitFor({ state: "visible", timeout: 5_000 });
      await acceptButton.click();
    } catch {
      // No consent/stay-signed-in prompt — continue
    }

    // Wait for redirect back to our app
    await page.waitForURL(/localhost:8080/, { timeout: 30_000 });

    // Verify the auth result is displayed
    await expect(page.locator("#logout")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#login")).toBeHidden();
    await expect(page.locator("#portal-login")).toBeHidden();

    const outputText = await page.locator("#output").textContent();
    const authResult = JSON.parse(outputText);

    expect(authResult).toHaveProperty("idToken");
    expect(authResult).toHaveProperty("account");
    expect(authResult.account).toHaveProperty("localAccountId");
    expect(authResult.account).toHaveProperty("name");
    expect(authResult).toHaveProperty("idTokenClaims");
    expect(authResult.idTokenClaims).toHaveProperty("oid");
    expect(authResult.idTokenClaims).toHaveProperty("name");
  });
});
