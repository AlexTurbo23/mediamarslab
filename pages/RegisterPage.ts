import { type Locator, type Page } from "@playwright/test";

export class RegisterPage {
  readonly url = "/register.html";
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly genderSelect: Locator;
  readonly passwordInput: Locator;
  readonly analyticsConsent: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Регистрация" });
    this.nameInput = page.locator('[data-ui="register-name"]');
    this.emailInput = page.locator('[data-ui="register-email"]');
    this.genderSelect = page.locator('[data-ui="register-gender"]');
    this.passwordInput = page.locator('[data-ui="register-password"]');
    this.analyticsConsent = page.locator(
      '[data-ui="register-analytics-consent"]',
    );
    this.submitButton = page.getByRole("button", {
      name: "Зарегистрироваться",
    });
    this.loginLink = page.getByRole("link", { name: /Войти/ });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
  }

  async register(
    name: string,
    email: string,
    password: string,
    gender: "0" | "1" = "0",
  ): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.genderSelect.selectOption(gender);
    await this.passwordInput.fill(password);
    await this.analyticsConsent.check();
    await this.submitButton.click();
  }
}
