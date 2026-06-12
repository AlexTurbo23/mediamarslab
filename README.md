# qa-a.recruitment.mediamarslab.com — Test Automation Suite

End-to-end and API automated tests for [qa-a.recruitment.mediamarslab.com](https://qa-a.recruitment.mediamarslab.com), built with **Playwright** and **TypeScript**.

---

## Stack

| Tool                                 | Version         | Purpose                                      |
| ------------------------------------ | --------------- | -------------------------------------------- |
| [Playwright](https://playwright.dev) | 1.53+           | Browser automation & API testing             |
| TypeScript                           | 5.8+            | Type-safe test code                          |
| @faker-js/faker                      | —               | Generating unique test data (Russian locale) |
| dotenv                               | 16+             | Loading `.env` credentials at runtime        |
| ESLint + playwright plugin           | 9.x flat config | Linting                                      |
| allure-playwright                    | 3.x             | Allure report integration                    |

---

## Project Structure

```
├── pages/
│   ├── VacancyApplicationPage.ts  # /vacancy-application.html — form & result block
│   ├── LoginPage.ts               # /index.html — login form
│   ├── RegisterPage.ts            # /register.html — registration form
│   ├── DashboardPage.ts           # /dashboard.html — todos list & tags sidebar
│   ├── ProfilePage.ts             # /profile.html — profile form, password modal
│   └── AdminPage.ts               # /admin.html — admin login & user list
├── support/
│   ├── env.ts                     # Typed env accessors with guard functions
│   ├── env-writer.ts              # Updates key=value pairs in .env at runtime
│   ├── fixtures.ts                # testUser / loggedInPage / loggedInAdminPage fixtures
│   └── test-data.ts               # Shared test data constants
├── tests/
│   ├── vacancy-application/
│   │   └── vacancy-application.spec.ts  # Submit form, save X-Access-Key to .env
│   ├── login/
│   │   └── login.spec.ts          # Login UI scenarios
│   ├── register/
│   │   └── register.spec.ts       # Registration UI scenarios
│   ├── dashboard/
│   │   └── dashboard.spec.ts      # Todos CRUD + tags sidebar
│   ├── profile/
│   │   └── profile.spec.ts        # Profile editing, password change, photo upload
│   ├── admin/
│   │   └── admin.spec.ts          # Admin login, user list, search, logout
│   └── api/
│       ├── x-access-key.spec.ts   # API — X-Access-Key header enforcement
│       └── analytics.spec.ts      # API — analytics events (auth, schema, recording)
├── .env.example                   # Template — copy to .env and fill in values
├── playwright.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Chromium (installed automatically by Playwright)
- Java 11+ _(optional — only for Allure reports)_

### Install

```bash
npm install
npx playwright install chromium
```

### Configure credentials

**Step 1 — Get your X-Access-Key.**  
Open [/vacancy-application.html](https://qa-a.recruitment.mediamarslab.com/vacancy-application.html), enter your full name and submit. You will receive an `X-Access-Key` and admin credentials. **Save them immediately — the server shows them only once.**

**Step 2 — Populate `.env`.**  
The easiest way is to run the credential-saving test:

```bash
npx playwright test tests/vacancy-application --reporter=line
```

This test fills the form, reads the result and writes the values to `.env` automatically.

Alternatively, copy `.env.example` to `.env` and fill in the values manually:

```env
BASE_URL=https://qa-a.recruitment.mediamarslab.com

X_ACCESS_KEY=<key from vacancy form>
ADMIN_EMAIL=<admin email from vacancy form>
ADMIN_PASSWORD=<admin password from vacancy form>

TEST_USER_PASSWORD=TestPass123!
```

> `.env` is git-ignored — never commit it.

---

## Running Tests

| Command                           | Description                                       |
| --------------------------------- | ------------------------------------------------- |
| `npm test`                        | Run all tests (headless)                          |
| `npm run test:headed`             | Run with browser visible                          |
| `npm run test:ui`                 | Open Playwright interactive UI                    |
| `npm run test:debug`              | Step-through debugger                             |
| `npm run test:line`               | Compact line reporter                             |
| `npx playwright test tests/api`   | API tests only                                    |
| `npx playwright test tests/login` | Login tests only                                  |
| `npm run report:html`             | Open Playwright HTML report                       |
| `npm run report:allure`           | Generate & open Allure report (requires Java 11+) |

---

## Test Suites (64 tests total)

### vacancy-application (1 test)

| Test                                     | Notes                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Получить X-Access-Key и сохранить в .env | Submits form with a Faker-generated name, writes credentials to `.env` |

### API — X-Access-Key enforcement (15 tests)

Verifies the authentication rule: **every endpoint except `POST /api/applications` returns 401 when `X-Access-Key` is absent.**

| Test                                                           |                    |
| -------------------------------------------------------------- | ------------------ |
| `POST /api/applications` is publicly accessible                | No 401 without key |
| `POST/GET/PATCH` for auth, profile, todos, tags, upload, admin | 401 without key    |

### API — Analytics events (14 tests)

Verifies `GET /api/analytics/events` — requires both `X-Access-Key` and HTTP Basic Auth.

| Test                                                              |
| ----------------------------------------------------------------- |
| 401 без заголовка X-Access-Key                                    |
| 401 без HTTP Basic Auth                                           |
| 200 с обоими заголовками — возвращает массив                      |
| Каждое событие содержит обязательные поля type и timestamp        |
| Поле status у событий login принимает значения success или failed |
| Регистрация с consent=true → событие register записывается        |
| Вход в систему → событие login со status=success записывается     |
| Выход → событие logout записывается                               |
| Создание заметки → событие todoCreate записывается                |
| Изменение заметки → событие todoEdit записывается                 |
| Выполнение заметки → событие todoComplete записывается            |
| Удаление заметки → событие todoDelete записывается                |
| Смена согласия → событие analyticsConsentChange записывается      |
| При consent=false действия пользователя не попадают в аналитику   |

### Login — /index.html (6 tests)

| Test                                                                  |
| --------------------------------------------------------------------- |
| Страница отображает форму входа                                       |
| Ссылка «Зарегистрироваться» ведёт на /register.html                   |
| Неверный пароль не перенаправляет со страницы входа                   |
| Успешный вход пользователя → /dashboard.html                          |
| Успешный вход администратора → /admin.html                            |
| Авторизованный пользователь автоматически попадает на /dashboard.html |

### Register — /register.html (5 tests)

| Test                                            |
| ----------------------------------------------- |
| Страница отображает форму регистрации           |
| Ссылка «Войти» ведёт на /index.html             |
| Форма не отправляется без согласия на аналитику |
| Успешная регистрация → /dashboard.html          |
| Выбор пола — оба варианта доступны              |

### Dashboard — /dashboard.html (8 tests)

| Test                                           |
| ---------------------------------------------- |
| Показывает имя пользователя                    |
| Создать заметку — появляется в списке          |
| Выполнить заметку — чекбокс отмечается         |
| Удалить заметку — исчезает из списка           |
| Редактировать заметку — заголовок обновляется  |
| Боковая панель тегов открывается и закрывается |
| Создать тег — появляется в списке тегов        |
| Выход перенаправляет на /index.html            |

### Profile — /profile.html (9 tests)

| Test                                                      |
| --------------------------------------------------------- |
| Страница загружает данные пользователя                    |
| Изменить имя и сохранить → редирект на дашборд            |
| Переключить пол                                           |
| Переключить согласие на аналитику — изменение сохраняется |
| Открыть и закрыть модальное окно смены пароля             |
| Пароли не совпадают — показывает ошибку в модальном окне  |
| Успешная смена пароля — модальное окно закрывается        |
| Загрузка фото аватара — запрос на сервер проходит успешно |
| Выход перенаправляет на /index.html                       |

### Admin — /admin.html (6 tests)

| Test                                                      |
| --------------------------------------------------------- |
| Страница показывает форму входа при отсутствии токена     |
| Неверные учётные данные показывают ошибку                 |
| Успешный вход → панель администратора отображается        |
| Список пользователей отображается после входа через токен |
| Поиск по email фильтрует список пользователей             |
| Выход возвращает к форме входа                            |

---

## Authentication Model

All UI and API tests that touch protected endpoints require `X_ACCESS_KEY` in `.env`.  
If the key is absent a test **skips** automatically instead of failing — safe to run in CI with partial secrets.

The page JS files (`dashboard.js`, `profile.js`, etc.) omit the `X-Access-Key` header on their `fetch` calls. The test fixtures compensate with `page.route("**/api/**", ...)` to inject the header at the network level.

### Fixture overview

| Fixture             | What it provides                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `testUser`          | Registers a fresh user via API before each test; email includes `Date.now()` for uniqueness  |
| `loggedInPage`      | Browser page with user JWT in `localStorage`; API calls intercepted to inject `X-Access-Key` |
| `loggedInAdminPage` | Same, but with admin JWT                                                                     |

---

## Code Quality

| Command             | Description                |
| ------------------- | -------------------------- |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint`      | ESLint check               |
| `npm run lint:fix`  | Auto-fix fixable issues    |

Enforced rules (zero errors, zero warnings in CI):

- `playwright/no-focused-test` — prevents committed `test.only`
- `playwright/valid-expect` — `expect()` must always be awaited
- `playwright/no-wait-for-timeout` — no hard-coded waits
- `playwright/no-networkidle` — no `networkidle` waits
- `playwright/prefer-web-first-assertions` — `toBeVisible()` over `isVisible()`

---

## Allure Report

```bash
npm run report:allure
```

Requires **Java 11+** in `PATH`. Without Java, use `npm run report:html`.
