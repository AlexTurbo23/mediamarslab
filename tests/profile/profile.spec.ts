import { expect } from "@playwright/test";
import { test } from "@support/fixtures";
import { ProfilePage } from "@pages/ProfilePage";
import { faker } from "@faker-js/faker/locale/ru";
import { hasXAccessKey } from "@support/env";
import { feature, severity, Severity } from "allure-js-commons";

test.describe("/profile.html — Профиль", () => {
  test.skip(!hasXAccessKey(), "X_ACCESS_KEY required");

  test.beforeEach(async () => {
    await feature("Profile Management");
  });

  test(
    "страница загружает данные пользователя",
    { tag: "@smoke" },
    async ({ loggedInPage, testUser }) => {
      await severity(Severity.CRITICAL);
      const profile = new ProfilePage(loggedInPage);
      await profile.goto();
      await expect(profile.nameInput).toHaveValue(testUser.name, {
        timeout: 8_000,
      });
      await expect(profile.emailText).toHaveValue(testUser.email);
    },
  );

  test("изменить имя и сохранить → редирект на дашборд", async ({
    loggedInPage,
  }) => {
    const profile = new ProfilePage(loggedInPage);
    const newName = `${faker.person.firstName()} ${faker.person.lastName()}`;
    await profile.goto();
    await profile.nameInput.clear();
    await profile.nameInput.fill(newName);
    await profile.saveProfile();
    await loggedInPage.waitForURL("**/dashboard.html", { timeout: 10_000 });
  });

  test("переключить пол", async ({ loggedInPage }) => {
    const profile = new ProfilePage(loggedInPage);
    await profile.goto();
    await profile.genderFemale.check();
    await expect(profile.genderFemale).toBeChecked();
    await profile.genderMale.check();
    await expect(profile.genderMale).toBeChecked();
  });

  test("переключить согласие на аналитику — изменение сохраняется", async ({
    loggedInPage,
  }) => {
    const profile = new ProfilePage(loggedInPage);
    await profile.goto();
    const initialState = await profile.analyticsConsent.isChecked();
    const targetState = !initialState;
    if (targetState) {
      await profile.analyticsConsent.check();
    } else {
      await profile.analyticsConsent.uncheck();
    }
    await profile.saveProfile();
    await loggedInPage.waitForURL("**/dashboard.html", { timeout: 10_000 });
    // Navigate back and verify the value was persisted
    await profile.goto();
    if (targetState) {
      await expect(profile.analyticsConsent).toBeChecked({ timeout: 5_000 });
    } else {
      await expect(profile.analyticsConsent).not.toBeChecked({
        timeout: 5_000,
      });
    }
  });

  test("открыть и закрыть модальное окно смены пароля", async ({
    loggedInPage,
  }) => {
    const profile = new ProfilePage(loggedInPage);
    await profile.goto();
    await profile.openPasswordModal();
    await expect(profile.passwordModal).toBeVisible();
    await profile.passwordModalClose.click();
    await expect(profile.passwordModal).toBeHidden({ timeout: 5_000 });
  });

  test("пароли не совпадают — показывает ошибку в модальном окне", async ({
    loggedInPage,
  }) => {
    await severity(Severity.MINOR);
    const profile = new ProfilePage(loggedInPage);
    await profile.goto();
    await profile.openPasswordModal();
    await profile.newPasswordInput.fill("NewPass123!");
    await profile.confirmPasswordInput.fill("DifferentPass456!");
    await profile.passwordForm
      .getByRole("button", { name: "Сохранить пароль" })
      .click();
    await expect(profile.passwordFormMessage).toBeVisible({ timeout: 5_000 });
    await expect(profile.passwordFormMessage).toContainText(/совпадают/i);
  });

  test("успешная смена пароля — модальное окно закрывается", async ({
    loggedInPage,
    testUser,
  }) => {
    const profile = new ProfilePage(loggedInPage);
    const newPassword = "NewSecurePass789!";
    await profile.goto();
    await profile.changePassword(newPassword);
    await expect(profile.passwordModal).toBeHidden({ timeout: 8_000 });
    // Verify new password actually works: logout, then login with new credentials
    await profile.logout();
    await loggedInPage.goto("/index.html", { waitUntil: "domcontentloaded" });
    await loggedInPage.locator('[data-ui="login-email"]').fill(testUser.email);
    await loggedInPage.locator('[data-ui="login-password"]').fill(newPassword);
    await loggedInPage.getByRole("button", { name: "Войти" }).click();
    await loggedInPage.waitForURL("**/dashboard.html", { timeout: 10_000 });
  });

  test("загрузка фото аватара — запрос на сервер проходит успешно", async ({
    loggedInPage,
  }) => {
    const profile = new ProfilePage(loggedInPage);
    await profile.goto();
    // Minimal 1×1 transparent PNG
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );
    const [uploadResponse] = await Promise.all([
      loggedInPage.waitForResponse(
        (res) =>
          res.url().includes("/api/upload/photo") ||
          res.url().includes("/api/profile/photo"),
      ),
      profile.photoInput.setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: pngBuffer,
      }),
    ]);
    expect(uploadResponse.status()).toBe(200);
  });

  test("выход перенаправляет на /index.html", async ({ loggedInPage }) => {
    const profile = new ProfilePage(loggedInPage);
    await profile.goto();
    await profile.logout();
    expect(loggedInPage.url()).toContain("/index.html");
  });
});
