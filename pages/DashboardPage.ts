import { type Locator, type Page } from "@playwright/test";

export class DashboardPage {
  readonly url = "/dashboard.html";
  readonly userName: Locator;
  readonly todoInput: Locator;
  readonly todosList: Locator;
  readonly emptyState: Locator;
  readonly logoutButton: Locator;
  readonly toggleTagsSidebarButton: Locator;
  readonly tagsSidebar: Locator;
  readonly tagNameInput: Locator;
  readonly tagForm: Locator;
  readonly tagsList: Locator;
  readonly deleteModal: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly toastContainer: Locator;

  constructor(readonly page: Page) {
    this.userName = page.locator('[data-ui="user-name"]');
    this.todoInput = page.locator('[data-ui="todo-input"]');
    this.todosList = page.locator('[data-ui="todos-list"]');
    this.emptyState = page.locator('[data-ui="empty-state"]');
    this.logoutButton = page.locator('[data-ui="logout-button"]');
    this.toggleTagsSidebarButton = page.locator(
      '[data-ui="toggle-tags-sidebar-button"]',
    );
    this.tagsSidebar = page.locator('[data-ui="tags-sidebar"]');
    this.tagNameInput = page.locator('[data-ui="tag-name-input"]');
    this.tagForm = page.locator('[data-ui="tag-form"]');
    this.tagsList = page.locator('[data-ui="tags-list"]');
    this.deleteModal = page.locator('[data-ui="delete-todo-modal"]');
    this.confirmDeleteButton = page.locator(
      '[data-ui="confirm-delete-todo-button"]',
    );
    this.cancelDeleteButton = page.locator(
      '[data-ui="cancel-delete-todo-button"]',
    );
    this.toastContainer = page.locator('[data-ui="toast-container"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
    await this.userName.waitFor({ timeout: 10_000 });
  }

  /** Submit the add-todo form by pressing Enter in the input. */
  async createTodo(title: string): Promise<void> {
    await this.todoInput.fill(title);
    await this.page.keyboard.press("Enter");
  }

  /** Click the "Удалить заметку …" button for the given title, then confirm. */
  async deleteTodo(title: string): Promise<void> {
    await this.page
      .getByRole("button", { name: `Удалить заметку ${title}` })
      .click();
    await this.confirmDeleteButton.click();
  }

  /** Toggle the completed checkbox for the todo item with the given title. */
  todoCheckbox(title: string): Locator {
    return this.page
      .locator(`li[data-todo-id]`)
      .filter({ hasText: title })
      .getByRole("checkbox");
  }

  /** Double-click the title span (role=button, aria-label="Редактировать заметку"),
   *  type the new title in the inline input, and confirm with Enter. */
  async editTodo(oldTitle: string, newTitle: string): Promise<void> {
    const item = this.page
      .locator(`li[data-todo-id]`)
      .filter({ hasText: oldTitle });
    // dashboard.js sets role="button" + aria-label="Редактировать заметку" on the
    // title <span> and triggers inline edit on dblclick — not via a separate button.
    await item
      .getByRole("button", { name: "Редактировать заметку" })
      .dblclick();
    const editInput = item.getByRole("textbox");
    await editInput.clear();
    await editInput.fill(newTitle);
    await this.page.keyboard.press("Enter");
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL("**/index.html", {
      waitUntil: "domcontentloaded",
    });
  }
}
