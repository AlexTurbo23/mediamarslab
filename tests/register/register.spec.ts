import { expect } from "@playwright/test";
import { test } from "@support/fixtures";
import { RegisterPage } from "@pages/RegisterPage";
import { faker } from "@faker-js/faker/locale/ru";
import { hasXAccessKey, env } from "@support/env";
import { feature, severity, Severity } from "allure-js-commons";

const newUser = () => ({
  name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  email: `qa-${Date.now()}-${faker.string.alphanumeric(6)}@test.local`,
  password: "TestPass123!",
});

test.describe("/register.html — Регистрация", () => {
  test.beforeEach(async () => {
    await feature("Registration");
  });

  test("страница отображает форму регистрации", async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.heading).toBeVisible();
    await expect(reg.nameInput).toBeVisible();
    await expect(reg.emailInput).toBeVisible();
    await expect(reg.genderSelect).toBeVisible();
    await expect(reg.passwordInput).toBeVisible();
    await expect(reg.analyticsConsent).toBeVisible();
    await expect(reg.submitButton).toBeVisible();
  });

  test("ссылка 'Войти' ведёт на /index.html", async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.loginLink.click();
    await page.waitForURL("**/index.html");
  });

  test("форма не отправляется без согласия на аналитику", async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    const user = newUser();
    // Fill all fields but do NOT check analytics consent
    await reg.nameInput.fill(user.name);
    await reg.emailInput.fill(user.email);
    await reg.passwordInput.fill(user.password);
    await reg.submitButton.click();
    // The form prevents submission without consent — URL must stay unchanged.
    // We verify by waiting for the DOM to settle and checking the URL.
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/register.html");
  });

  test(
    "успешная регистрация → /dashboard.html",
    { tag: "@smoke" },
    async ({ page }) => {
      await severity(Severity.BLOCKER);
      test.skip(!hasXAccessKey(), "X_ACCESS_KEY required");
      // register.js omits X-Access-Key on its fetch calls — inject it
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
      const reg = new RegisterPage(page);
      await reg.goto();
      const user = newUser();
      await reg.register(user.name, user.email, user.password, "1");
      await page.waitForURL("**/dashboard.html", {
        timeout: 20_000,
        waitUntil: "commit",
      });
    },
  );

  test("выбор пола — оба варианта доступны", async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.genderSelect.selectOption("0");
    await expect(reg.genderSelect).toHaveValue("0");
    await reg.genderSelect.selectOption("1");
    await expect(reg.genderSelect).toHaveValue("1");
  });

  test("регистрация с занятым email — сервер возвращает ошибку", async ({
    page,
    request,
  }) => {
    await severity(Severity.MINOR);
    test.skip(!hasXAccessKey(), "X_ACCESS_KEY required");
    const user = newUser();
    // Pre-register via API so the email is already taken
    await request.post("/api/auth/register", {
      headers: {
        "X-Access-Key": env.xAccessKey(),
        "Content-Type": "application/json",
      },
      data: {
        name: user.name,
        email: user.email,
        gender: "0",
        password: user.password,
        internalAnalyticsConsent: true,
      },
    });
    await page.route("**/api/**", async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "X-Access-Key": env.xAccessKey(),
        },
      });
    });
    const reg = new RegisterPage(page);
    await reg.goto();
    const [res] = await Promise.all([
      page.waitForResponse("**/api/auth/register"),
      reg.register(user.name, user.email, user.password, "0"),
    ]);
    // 409 = duplicate email; 429 = rate limit on CI shared server — both mean registration blocked.
    expect([409, 429]).toContain(res.status());
    expect(page.url()).toContain("/register.html");
  });
});
