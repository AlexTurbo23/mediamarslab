import { test as base, type Page } from "@playwright/test";
import { faker } from "@faker-js/faker/locale/ru";
import { env, hasXAccessKey } from "@support/env";

export interface TestUser {
  name: string;
  email: string;
  password: string;
  gender: "0" | "1";
}

type Fixtures = {
  testUser: TestUser;
  loggedInPage: Page;
  loggedInAdminPage: Page;
};

/**
 * Set up page-level routes that apply to every navigation:
 * - abort slow external placeholder images (blocks 'load' event)
 * - inject X-Access-Key on every /api/** request
 *   (all page JS files omit this header on their own fetch calls)
 */
async function setupRoutes(page: Page): Promise<void> {
  await page.route("https://via.placeholder.com/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "X-Access-Key": env.xAccessKey(),
      },
    });
  });
}

export const test = base.extend<Fixtures>({
  /**
   * Registers a fresh test user via the API before each test.
   * Requires X_ACCESS_KEY to be set in .env.
   */
  testUser: async ({ request }, use) => {
    if (!hasXAccessKey()) {
      await use({ name: "", email: "", password: "", gender: "0" });
      return;
    }

    const user: TestUser = {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: `qa-${Date.now()}-${faker.string.alphanumeric(6)}@test.local`,
      password: env.testUserPassword,
      gender: "0",
    };

    await request.post("/api/auth/register", {
      headers: {
        "X-Access-Key": env.xAccessKey(),
        "Content-Type": "application/json",
      },
      data: {
        name: user.name,
        email: user.email,
        gender: user.gender,
        password: user.password,
        internalAnalyticsConsent: true,
      },
    });

    await use(user);
  },

  /**
   * A browser page already logged in as the testUser.
   *
   * Uses the real UI login form instead of directly manipulating localStorage.
   * This avoids localStorage timing issues and ensures the JWT is written by
   * the application's own JavaScript (login.js), which is the most reliable approach.
   *
   * After the fixture the page is at /dashboard.html. Tests can navigate freely.
   *
   * Logout tests work correctly because no addInitScript re-injects the token
   * after logout clears it.
   */
  loggedInPage: async ({ page, testUser }, use) => {
    if (!hasXAccessKey()) {
      await use(page);
      return;
    }

    await setupRoutes(page);
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });

    // Login via UI — login.js handles token storage and redirect to /dashboard.html
    await page.locator('[data-ui="login-email"]').fill(testUser.email);
    await page.locator('[data-ui="login-password"]').fill(testUser.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await page.waitForURL("**/dashboard.html", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    await use(page);
  },

  /**
   * A browser page already logged in as the admin.
   * Uses the real admin login form.
   * After the fixture the page is at /admin.html with the panel visible.
   */
  loggedInAdminPage: async ({ page }, use) => {
    if (!hasXAccessKey()) {
      await use(page);
      return;
    }

    await setupRoutes(page);
    await page.goto("/admin.html", { waitUntil: "domcontentloaded" });

    // Login via admin form — admin.js handles token storage and shows the panel
    await page.locator('[data-ui="admin-email"]').fill(env.adminEmail());
    await page.locator('[data-ui="admin-password"]').fill(env.adminPassword());
    await page
      .locator('[data-ui="admin-login-form"]')
      .getByRole("button", { name: /войти/i })
      .click();
    await page.locator('[data-ui="admin-panel"]').waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await use(page);
  },
});

export { expect } from "@playwright/test";
