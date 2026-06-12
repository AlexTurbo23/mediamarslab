import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker/locale/ru";
import { VacancyApplicationPage } from "@pages/VacancyApplicationPage";
import { updateEnvFile } from "@support/env-writer";

const fullName = () =>
  `${faker.person.lastName()} ${faker.person.firstName()} ${faker.person.middleName()}`;

test("получить X-Access-Key и сохранить в .env", async ({ page }) => {
  const appPage = new VacancyApplicationPage(page);

  await appPage.goto();
  await appPage.submitForm(fullName());

  test.skip(
    await appPage.isRateLimited(),
    "IP rate-limited — попробуйте позже",
  );

  await appPage.expectResultVisible();

  const { xAccessKey, adminLogin, adminPassword } = await appPage.getResult();

  expect(xAccessKey).toBeTruthy();
  expect(adminLogin).toBeTruthy();
  expect(adminPassword).toBeTruthy();

  updateEnvFile({
    X_ACCESS_KEY: xAccessKey,
    ADMIN_EMAIL: adminLogin,
    ADMIN_PASSWORD: adminPassword,
  });

  console.warn(
    `✓ .env обновлён → X_ACCESS_KEY=${xAccessKey.slice(0, 16)}... ADMIN_EMAIL=${adminLogin}`,
  );
});
