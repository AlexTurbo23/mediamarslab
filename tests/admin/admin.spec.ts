import { expect } from "@playwright/test";
import { test } from "@support/fixtures";
import { AdminPage } from "@pages/AdminPage";
import { env, hasXAccessKey, hasAdminCredentials } from "@support/env";
import { feature, severity, Severity } from "allure-js-commons";

test.describe("/admin.html — Админ-панель", () => {
  // Shares a single admin account — run serially to avoid interference.
  test.describe.configure({ mode: "serial" });
  test.skip(
    !hasXAccessKey() || !hasAdminCredentials(),
    "X_ACCESS_KEY and admin credentials required",
  );

  test.beforeEach(async () => {
    await feature("Admin Panel");
  });

  test("страница показывает форму входа администратора при отсутствии токена", async ({
    page,
  }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await expect(admin.loginSection).toBeVisible();
    await expect(admin.adminPanel).toBeHidden();
  });

  test("неверные учётные данные показывают ошибку", async ({ page }) => {
    const admin = new AdminPage(page);
    await page.route("**/api/**", async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "X-Access-Key": env.xAccessKey(),
        },
      });
    });
    await admin.goto();
    await admin.login("wrong@admin.local", "wrongpass");
    await expect(admin.loginError).toBeVisible({ timeout: 8_000 });
  });

  test(
    "успешный вход → панель администратора отображается",
    { tag: "@smoke" },
    async ({ page }) => {
      await severity(Severity.CRITICAL);
      const admin = new AdminPage(page);
      await page.route("**/api/**", async (route) => {
        await route.continue({
          headers: {
            ...route.request().headers(),
            "X-Access-Key": env.xAccessKey(),
          },
        });
      });
      await admin.goto();
      await admin.login(env.adminEmail(), env.adminPassword());
      await expect(admin.adminPanel).toBeVisible({ timeout: 10_000 });
    },
  );

  test("список пользователей отображается после входа через токен", async ({
    loggedInAdminPage,
  }) => {
    const admin = new AdminPage(loggedInAdminPage);
    await admin.goto();
    await expect(admin.adminPanel).toBeVisible({ timeout: 10_000 });
    await expect(admin.usersList).toBeVisible();
  });

  test("поиск по email фильтрует список пользователей", async ({
    loggedInAdminPage,
    testUser,
  }) => {
    const admin = new AdminPage(loggedInAdminPage);
    await admin.goto();
    await expect(admin.adminPanel).toBeVisible({ timeout: 10_000 });
    await admin.userSearch.fill(testUser.email);
    // Wait for the debounced overview request to complete
    await loggedInAdminPage.waitForResponse("**/api/admin/overview**");
    await expect(admin.usersList).toContainText(testUser.email, {
      timeout: 8_000,
    });
  });

  test("выход возвращает к форме входа", async ({ loggedInAdminPage }) => {
    const admin = new AdminPage(loggedInAdminPage);
    await admin.goto();
    await expect(admin.adminPanel).toBeVisible({ timeout: 10_000 });
    await admin.logout();
    await expect(admin.loginSection).toBeVisible({ timeout: 5_000 });
  });
});
