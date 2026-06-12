import { type Locator, type Page } from "@playwright/test";

export class AdminPage {
  readonly url = "/admin.html";
  readonly loginSection: Locator;
  readonly adminPanel: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginForm: Locator;
  readonly loginError: Locator;
  readonly logoutButton: Locator;
  readonly usersList: Locator;
  readonly userSearch: Locator;
  readonly overviewError: Locator;
  readonly pagination: Locator;
  readonly pageNext: Locator;
  readonly pagePrev: Locator;

  constructor(readonly page: Page) {
    this.loginSection = page.locator('[data-ui="admin-login-section"]');
    this.adminPanel = page.locator('[data-ui="admin-panel"]');
    this.emailInput = page.locator('[data-ui="admin-email"]');
    this.passwordInput = page.locator('[data-ui="admin-password"]');
    this.loginForm = page.locator('[data-ui="admin-login-form"]');
    this.loginError = page.locator('[data-ui="admin-login-error"]');
    this.logoutButton = page.locator('[data-ui="admin-logout"]');
    this.usersList = page.locator('[data-ui="admin-users"]');
    this.userSearch = page.locator('[data-ui="admin-user-search"]');
    this.overviewError = page.locator('[data-ui="admin-overview-error"]');
    this.pagination = page.locator('[data-ui="admin-pagination"]');
    this.pageNext = page.locator('[data-ui="admin-page-next"]');
    this.pagePrev = page.locator('[data-ui="admin-page-prev"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
  }

  /**
   * Log in via the admin login form.
   * NOTE: The form submits to /api/auth/login which requires X-Access-Key.
   * Use page.route() in tests to intercept and inject the header.
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginForm.getByRole("button", { name: /войти/i }).click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.loginSection.waitFor({ state: "visible" });
  }
}
