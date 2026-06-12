import { type Locator, type Page } from "@playwright/test";

export class ProfilePage {
  readonly url = "/profile.html";
  readonly profileForm: Locator;
  readonly nameInput: Locator;
  readonly emailText: Locator;
  readonly genderMale: Locator;
  readonly genderFemale: Locator;
  readonly analyticsConsent: Locator;
  readonly avatar: Locator;
  readonly photoInput: Locator;
  readonly replacePhotoButton: Locator;
  readonly removePhotoButton: Locator;
  readonly openPasswordModalButton: Locator;
  readonly passwordModal: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly passwordForm: Locator;
  readonly passwordFormMessage: Locator;
  readonly passwordModalClose: Locator;
  readonly passwordModalCancel: Locator;
  readonly logoutButton: Locator;
  readonly userName: Locator;

  constructor(readonly page: Page) {
    this.profileForm = page.locator('[data-ui="profile-form"]');
    this.nameInput = page.locator('[data-ui="profile-name"]');
    this.emailText = page.locator('[data-ui="profile-email"]');
    this.genderMale = page.locator('[data-ui="profile-gender-male"]');
    this.genderFemale = page.locator('[data-ui="profile-gender-female"]');
    this.analyticsConsent = page.locator(
      '[data-ui="profile-analytics-consent"]',
    );
    this.avatar = page.locator('[data-ui="profile-avatar"]');
    this.photoInput = page.locator('[data-ui="profile-photo-input"]');
    this.replacePhotoButton = page.locator(
      '[data-ui="profile-replace-photo-button"]',
    );
    this.removePhotoButton = page.locator(
      '[data-ui="profile-remove-photo-button"]',
    );
    this.openPasswordModalButton = page.locator(
      '[data-ui="profile-open-password-modal"]',
    );
    this.passwordModal = page.locator('[data-ui="password-modal"]');
    this.newPasswordInput = page.locator('[data-ui="profile-new-password"]');
    this.confirmPasswordInput = page.locator(
      '[data-ui="profile-confirm-password"]',
    );
    this.passwordForm = page.locator('[data-ui="password-form"]');
    this.passwordFormMessage = page.locator(
      '[data-ui="password-form-message"]',
    );
    this.passwordModalClose = page.locator('[data-ui="password-modal-close"]');
    this.passwordModalCancel = page.locator(
      '[data-ui="password-modal-cancel"]',
    );
    this.logoutButton = page.locator('[data-ui="logout-button"]');
    this.userName = page.locator('[data-ui="user-name"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
    await this.profileForm.waitFor({ timeout: 10_000 });
  }

  /** Save profile via the form submit button. After success, redirects to /dashboard.html. */
  async saveProfile(): Promise<void> {
    await this.profileForm.getByRole("button", { name: /сохранить/i }).click();
  }

  async openPasswordModal(): Promise<void> {
    await this.openPasswordModalButton.click();
    await this.passwordModal.waitFor({ state: "visible" });
  }

  /** Both fields must match — the API sends newPassword + confirmPassword. */
  async changePassword(newPassword: string): Promise<void> {
    await this.openPasswordModal();
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.passwordForm.getByRole("button", { name: /сменить/i }).click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL("**/index.html", {
      waitUntil: "domcontentloaded",
    });
  }
}
