import { test, expect } from "@playwright/test";
import { feature, severity, Severity } from "allure-js-commons";
import { hasXAccessKey, env } from "@support/env";
import {
  EventSchema,
  LoginEventSchema,
  TINY_PNG,
  basicAuth,
  jsonHeaders,
  authHeaders,
  fetchEvents,
  createUser,
  createTodo,
  findEvent,
} from "./analytics-helpers";

test.describe("API — GET /api/analytics/events", { tag: "@api" }, () => {
  // Runs serially: tests share a single analytics log on the remote server.
  test.describe.configure({ mode: "serial" });
  test.skip(!hasXAccessKey(), "X_ACCESS_KEY required");

  /** Shared snapshot — populated once in beforeAll to avoid redundant API calls. */
  let allEvents: Array<Record<string, unknown>> = [];

  test.beforeAll(async ({ request }) => {
    if (!hasXAccessKey()) return;
    allEvents = await fetchEvents(request);
  });

  test.beforeEach(async () => {
    await feature("Analytics Events");
  });

  // ── Authorization enforcement ─────────────────────────────────────────────

  test("401 без заголовка X-Access-Key", async ({ request }) => {
    await severity(Severity.CRITICAL);
    const res = await request.get("/api/analytics/events", {
      headers: { Authorization: basicAuth() },
    });
    expect(res.status()).toBe(401);
  });

  test("401 без HTTP Basic Auth", async ({ request }) => {
    await severity(Severity.CRITICAL);
    const res = await request.get("/api/analytics/events", {
      headers: { "X-Access-Key": env.xAccessKey() },
    });
    expect(res.status()).toBe(401);
  });

  test(
    "200 с обоими заголовками — возвращает массив",
    { tag: "@smoke" },
    async ({ request }) => {
      await severity(Severity.BLOCKER);
      const events = await fetchEvents(request);
      expect(Array.isArray(events)).toBe(true);
    },
  );

  // ── Schema validation ─────────────────────────────────────────────────────

  test("каждое событие содержит поля type и timestamp", async () => {
    await severity(Severity.NORMAL);
    for (const event of allEvents) {
      EventSchema.parse(event);
    }
  });

  test("поле status у событий login — success или failed", async () => {
    await severity(Severity.NORMAL);
    for (const event of allEvents.filter((e) => e.type === "login")) {
      LoginEventSchema.parse(event);
    }
  });

  // ── Event recording: consent=true ────────────────────────────────────────

  test("регистрация → событие register записывается", async ({ request }) => {
    await severity(Severity.NORMAL);
    const { email } = await createUser(request, "reg");
    const event = await findEvent(request, "register", email);
    expect(event).toBeDefined();
    expect(event!.email).toBe(email);
  });

  test("вход → событие login (success) записывается", async ({ request }) => {
    await severity(Severity.NORMAL);
    const { email } = await createUser(request, "login");
    const events = await fetchEvents(request);
    const event = events.find(
      (e) => e.type === "login" && e.email === email && e.status === "success",
    );
    expect(event).toBeDefined();
  });

  test("выход → событие logout записывается", async ({ request }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "logout");
    await request.post("/api/auth/logout", { headers: authHeaders(token) });
    expect(await findEvent(request, "logout", email)).toBeDefined();
  });

  test("создание заметки → событие todoCreate записывается", async ({
    request,
  }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "create");
    await createTodo(request, token, "создание");
    expect(await findEvent(request, "todoCreate", email)).toBeDefined();
  });

  test("изменение заметки → событие todoEdit записывается", async ({
    request,
  }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "edit");
    const id = await createTodo(request, token, "оригинал");
    await request.patch(`/api/todos/${id}`, {
      headers: jsonHeaders(token),
      data: { title: "изменён" },
    });
    expect(await findEvent(request, "todoEdit", email)).toBeDefined();
  });

  test("выполнение заметки → событие todoComplete записывается", async ({
    request,
  }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "complete");
    const id = await createTodo(request, token, "выполнить");
    await request.patch(`/api/todos/${id}`, {
      headers: jsonHeaders(token),
      data: { completed: true },
    });
    expect(await findEvent(request, "todoComplete", email)).toBeDefined();
  });

  test("удаление заметки → событие todoDelete записывается", async ({
    request,
  }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "delete");
    const id = await createTodo(request, token, "удалить");
    await request.delete(`/api/todos/${id}`, { headers: authHeaders(token) });
    expect(await findEvent(request, "todoDelete", email)).toBeDefined();
  });

  test("загрузка фото → событие photoUpload записывается", async ({
    request,
  }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "photo");
    await request.post("/api/profile/photo", {
      headers: authHeaders(token),
      multipart: {
        photo: { name: "avatar.png", mimeType: "image/png", buffer: TINY_PNG },
      },
    });
    const event = await findEvent(request, "photoUpload", email);
    expect(event).toBeDefined();
    expect(typeof event!.fileName).toBe("string");
  });

  test("неуспешная смена пароля → событие passwordChangeFailed записывается", async ({
    request,
  }) => {
    await severity(Severity.MINOR);
    const { email, token } = await createUser(request, "pwfail");
    await request.post("/api/profile/password", {
      headers: jsonHeaders(token),
      data: {
        newPassword: "NewPass123!",
        confirmPassword: "DifferentPass456!",
      },
    });
    expect(
      await findEvent(request, "passwordChangeFailed", email),
    ).toBeDefined();
  });

  test("смена согласия → событие analyticsConsentChange записывается", async ({
    request,
  }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "consent");
    await request.patch("/api/profile", {
      headers: jsonHeaders(token),
      data: { internalAnalyticsConsent: false },
    });
    const event = await findEvent(request, "analyticsConsentChange", email);
    expect(event).toBeDefined();
    expect(event!.analyticsConsent).toBeFalsy();
  });

  // ── Event recording: consent=false ───────────────────────────────────────

  test("при consent=false действия не попадают в аналитику", async ({
    request,
  }) => {
    await severity(Severity.NORMAL);
    const { email, token } = await createUser(request, "noconsent");
    await request.patch("/api/profile", {
      headers: jsonHeaders(token),
      data: { internalAnalyticsConsent: false },
    });
    await createTodo(request, token, "не должно быть в аналитике");
    expect(await findEvent(request, "todoCreate", email)).toBeUndefined();
  });
});
