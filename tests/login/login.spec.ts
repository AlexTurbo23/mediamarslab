import { expect } from "@playwright/test";
import { test } from "@support/fixtures";
import { LoginPage } from "@pages/LoginPage";
import { env, hasXAccessKey, hasAdminCredentials } from "@support/env";
import { feature, severity, Severity } from "allure-js-commons";

test.describe("/index.html — Вход в систему", () => {
  test.beforeEach(async () => {
    await feature("Authentication");
  });

  test(
    "страница отображает форму входа",
    { tag: "@smoke" },
    async ({ page }) => {
      await severity(Severity.CRITICAL);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await expect(loginPage.heading).toBeVisible();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    },
  );

  test("ссылка 'Зарегистрироваться' ведёт на /register.html", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.registerLink.click();
    await page.waitForURL("**/register.html");
  });

  test("неверный пароль не перенаправляет со страницы входа", async ({
    page,
  }) => {
    await severity(Severity.MINOR);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const [res] = await Promise.all([
      page.waitForResponse("**/api/auth/login"),
      loginPage.login("no-such-user@test.local", "wrongpassword"),
    ]);
    expect(res.status()).toBe(401);
    expect(page.url()).toContain("/index.html");
  });

  test(
    "успешный вход пользователя → /dashboard.html",
    { tag: "@smoke" },
    async ({ page, testUser }) => {
      await severity(Severity.BLOCKER);
      test.skip(!hasXAccessKey(), "X_ACCESS_KEY required");
      // login.js omits X-Access-Key — inject it
      await page.route("**/api/**", async (route) => {
        await route.continue({
          headers: {
            ...route.request().headers(),
            "X-Access-Key": env.xAccessKey(),
          },
        });
      });
      await page.route("https://via.placeholder.com/**", (route) =>
        route.abort(),
      );
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      await page.waitForURL("**/dashboard.html", {
        timeout: 10_000,
        waitUntil: "domcontentloaded",
      });
    },
  );

  test("успешный вход администратора → /admin.html", async ({ page }) => {
    test.skip(
      !hasAdminCredentials() || !hasXAccessKey(),
      "Admin credentials required",
    );
    await page.route("**/api/**", async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "X-Access-Key": env.xAccessKey(),
        },
      });
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(env.adminEmail(), env.adminPassword());
    await page.waitForURL("**/admin.html", {
      timeout: 10_000,
      waitUntil: "domcontentloaded",
    });
  });

  test("авторизованный пользователь автоматически попадает на /dashboard.html", async ({
    loggedInPage,
  }) => {
    test.skip(!hasXAccessKey(), "X_ACCESS_KEY required");
    // loggedInPage fixture: page is at /index.html with token in localStorage.
    // Navigating to /index.html again triggers index.js to read the token and redirect.
    await loggedInPage.goto("/index.html", { waitUntil: "domcontentloaded" });
    await loggedInPage.waitForURL("**/dashboard.html", {
      timeout: 8_000,
      waitUntil: "domcontentloaded",
    });
  });
});
