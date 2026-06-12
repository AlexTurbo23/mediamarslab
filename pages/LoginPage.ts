import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly url = "/index.html";
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Вход в систему" });
    this.emailInput = page.locator('[data-ui="login-email"]');
    this.passwordInput = page.locator('[data-ui="login-password"]');
    this.submitButton = page.getByRole("button", { name: "Войти" });
    this.registerLink = page.getByRole("link", { name: "Зарегистрироваться" });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
