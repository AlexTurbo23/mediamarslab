import { expect, type Locator, type Page } from "@playwright/test";

export interface ApplicationResult {
  xAccessKey: string;
  adminLogin: string;
  adminPassword: string;
}

export class VacancyApplicationPage {
  readonly url = "/vacancy-application.html";

  // ── Form ────────────────────────────────────────────────────────────────
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly submitButton: Locator;
  readonly form: Locator;

  // ── Result block (shown after successful submission) ────────────────────
  readonly resultBlock: Locator;
  readonly warningMessage: Locator;
  readonly xAccessKeyValue: Locator;
  readonly adminLoginValue: Locator;
  readonly adminPasswordValue: Locator;
  readonly copyKeyButton: Locator;
  readonly copyLoginButton: Locator;
  readonly copyPasswordButton: Locator;

  // ── Error state (e.g. rate limit) ──────────────────────────────────────
  readonly inlineError: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Заявка на вакансию" });
    this.fullNameInput = page.getByRole("textbox", { name: "ФИО" });
    this.submitButton = page.getByRole("button", {
      name: "Получить ключ доступа",
    });
    this.form = page.locator('[data-ui="vacancy-form"]');

    this.warningMessage = page.getByText(/скопируйте ключ/i);
    this.xAccessKeyValue = page.locator('[data-ui="vacancy-access-key"]');
    this.adminLoginValue = page.locator('[data-ui="vacancy-admin-email"]');
    this.adminPasswordValue = page.locator(
      '[data-ui="vacancy-admin-password"]',
    );
    this.copyKeyButton = page.locator('[data-ui="vacancy-copy-key"]');
    this.copyLoginButton = page.locator('[data-ui="vacancy-copy-admin-email"]');
    this.copyPasswordButton = page.locator(
      '[data-ui="vacancy-copy-admin-password"]',
    );

    this.inlineError = page.locator('[data-ui="vacancy-error"]');

    this.resultBlock = page.locator('[data-ui="vacancy-result"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await expect(this.heading).toBeVisible();
  }

  async submitForm(fullName: string): Promise<void> {
    await this.fullNameInput.fill(fullName);
    await this.submitButton.click();
    // Wait for server response — result block or error box loses the "hidden" class
    await this.page
      .locator(
        '[data-ui="vacancy-result"]:not(.hidden), [data-ui="vacancy-error"]:not(.hidden)',
      )
      .waitFor({ timeout: 15_000 })
      .catch(() => {
        /* HTML5 validation blocked submit — no network request */
      });
  }

  async expectResultVisible(): Promise<void> {
    // Wait for either success or error to appear before asserting
    await this.page
      .locator(
        '[data-ui="vacancy-result"]:not(.hidden), [data-ui="vacancy-error"]:not(.hidden)',
      )
      .waitFor({ timeout: 15_000 });

    const limited = await this.isRateLimited();
    if (limited) {
      throw new Error(
        "Rate limited: Too many application requests from this IP. Try again later.",
      );
    }

    await expect(this.xAccessKeyValue).toBeVisible();
    await expect(this.adminLoginValue).toBeVisible();
    await expect(this.adminPasswordValue).toBeVisible();
  }

  async getResult(): Promise<ApplicationResult> {
    return {
      xAccessKey: (await this.xAccessKeyValue.textContent()) ?? "",
      adminLogin: (await this.adminLoginValue.textContent()) ?? "",
      adminPassword: (await this.adminPasswordValue.textContent()) ?? "",
    };
  }

  /** Returns true if the server responded with a rate-limit error. */
  async isRateLimited(): Promise<boolean> {
    return this.inlineError.isVisible();
  }
}
