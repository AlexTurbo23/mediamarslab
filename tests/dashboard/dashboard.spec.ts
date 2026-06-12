import { expect } from "@playwright/test";
import { test } from "@support/fixtures";
import { DashboardPage } from "@pages/DashboardPage";
import { faker } from "@faker-js/faker/locale/ru";
import { hasXAccessKey } from "@support/env";
import { feature, severity, Severity } from "allure-js-commons";

test.describe("/dashboard.html — Дашборд", () => {
  test.skip(!hasXAccessKey(), "X_ACCESS_KEY required");

  test.beforeEach(async () => {
    await feature("Todo Management");
  });

  test("показывает имя пользователя", async ({ loggedInPage, testUser }) => {
    const dash = new DashboardPage(loggedInPage);
    await dash.goto();
    await expect(dash.userName).toContainText(testUser.name.split(" ")[0]);
  });

  test(
    "создать заметку — появляется в списке",
    { tag: "@smoke" },
    async ({ loggedInPage }) => {
      await severity(Severity.CRITICAL);
      const dash = new DashboardPage(loggedInPage);
      const title = `Заметка ${faker.word.noun()} ${Date.now()}`;
      await dash.goto();
      await dash.createTodo(title);
      await expect(
        loggedInPage.locator(`li[data-todo-id]`).filter({ hasText: title }),
      ).toBeVisible({
        timeout: 8_000,
      });
    },
  );

  test("выполнить заметку — чекбокс отмечается", async ({ loggedInPage }) => {
    const dash = new DashboardPage(loggedInPage);
    const title = `Чекбокс ${faker.word.noun()} ${Date.now()}`;
    await dash.goto();
    await dash.createTodo(title);
    const checkbox = dash.todoCheckbox(title);
    await expect(checkbox).not.toBeChecked({ timeout: 8_000 });
    await checkbox.check();
    await expect(checkbox).toBeChecked({ timeout: 5_000 });
  });

  test(
    "удалить заметку — исчезает из списка",
    { tag: "@smoke" },
    async ({ loggedInPage }) => {
      await severity(Severity.CRITICAL);
      const dash = new DashboardPage(loggedInPage);
      const title = `Удалить ${faker.word.noun()} ${Date.now()}`;
      await dash.goto();
      await dash.createTodo(title);
      await expect(
        loggedInPage.locator(`li[data-todo-id]`).filter({ hasText: title }),
      ).toBeVisible({
        timeout: 8_000,
      });
      await dash.deleteTodo(title);
      await expect(
        loggedInPage.locator(`li[data-todo-id]`).filter({ hasText: title }),
      ).toBeHidden({
        timeout: 8_000,
      });
    },
  );

  test("боковая панель тегов открывается и закрывается", async ({
    loggedInPage,
  }) => {
    const dash = new DashboardPage(loggedInPage);
    await dash.goto();
    await dash.toggleTagsSidebarButton.click();
    await expect(dash.tagsSidebar).toBeVisible({ timeout: 5_000 });
  });

  test("создать тег — появляется в списке тегов", async ({ loggedInPage }) => {
    const dash = new DashboardPage(loggedInPage);
    const tagName = `tag-${faker.string.alphanumeric(6)}`;
    await dash.goto();
    await dash.toggleTagsSidebarButton.click();
    await expect(dash.tagsSidebar).toBeVisible({ timeout: 5_000 });
    await dash.tagNameInput.fill(tagName);
    // dashboard.js shows tag-create-controls only after input event
    const createBtn = dash.tagForm.getByRole("button", { name: "Создать тег" });
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(dash.tagsList).toContainText(tagName, { timeout: 8_000 });
  });

  test("редактировать заметку — заголовок обновляется", async ({
    loggedInPage,
  }) => {
    const dash = new DashboardPage(loggedInPage);
    const originalTitle = `Редактировать ${faker.word.noun()} ${Date.now()}`;
    const updatedTitle = `${originalTitle} (обновлено)`;
    await dash.goto();
    await dash.createTodo(originalTitle);
    await expect(
      loggedInPage
        .locator(`li[data-todo-id]`)
        .filter({ hasText: originalTitle }),
    ).toBeVisible({ timeout: 8_000 });
    await dash.editTodo(originalTitle, updatedTitle);
    await expect(
      loggedInPage
        .locator(`li[data-todo-id]`)
        .filter({ hasText: updatedTitle }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      loggedInPage
        .locator(`li[data-todo-id]`)
        .filter({ hasText: originalTitle }),
    ).toBeHidden({ timeout: 5_000 });
  });

  test("выход перенаправляет на /index.html", async ({ loggedInPage }) => {
    const dash = new DashboardPage(loggedInPage);
    await dash.goto();
    await dash.logout();
    expect(loggedInPage.url()).toContain("/index.html");
  });

  test("пустой заголовок — заметка не создаётся и появляется сообщение об ошибке", async ({
    loggedInPage,
  }) => {
    await severity(Severity.MINOR);
    const dash = new DashboardPage(loggedInPage);
    await dash.goto();
    // Press Enter without filling the input
    await dash.todoInput.click();
    await loggedInPage.keyboard.press("Enter");
    await expect(dash.toastContainer).toContainText(/обязательн/i, {
      timeout: 4_000,
    });
    await expect(loggedInPage.locator("li[data-todo-id]")).toHaveCount(0);
  });
});
