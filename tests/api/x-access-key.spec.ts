import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker/locale/ru";
import { hasXAccessKey } from "@support/env";
import { feature, severity, Severity } from "allure-js-commons";

/**
 * Rule: every API endpoint EXCEPT POST /api/applications
 * must respond with 401 when the X-Access-Key header is absent.
 *
 * POST /api/applications is the public "vacancy form" endpoint
 * and must be reachable without any authentication header.
 */

const PROTECTED: Array<{ method: string; path: string; body?: unknown }> = [
  { method: "POST", path: "/api/auth/register", body: {} },
  { method: "POST", path: "/api/auth/login", body: {} },
  { method: "POST", path: "/api/auth/logout", body: {} },
  { method: "GET", path: "/api/profile" },
  { method: "PATCH", path: "/api/profile", body: {} },
  { method: "POST", path: "/api/profile/photo", body: {} },
  { method: "PATCH", path: "/api/profile/password", body: {} },
  { method: "GET", path: "/api/todos" },
  { method: "POST", path: "/api/todos", body: {} },
  { method: "GET", path: "/api/tags" },
  { method: "POST", path: "/api/tags", body: {} },
  { method: "GET", path: "/api/tags/palette" },
  { method: "POST", path: "/api/upload/photo", body: {} },
  { method: "GET", path: "/api/admin/overview" },
];

test.describe("API — X-Access-Key header enforcement", { tag: "@api" }, () => {
  test.skip(
    !hasXAccessKey(),
    "X_ACCESS_KEY required — run vacancy-application test first",
  );

  test.beforeEach(async () => {
    await feature("API Security");
    await severity(Severity.CRITICAL);
  });

  test("POST /api/applications is publicly accessible (no X-Access-Key)", async ({
    request,
  }) => {
    const res = await request.post("/api/applications", {
      data: {
        fullName: `${faker.person.lastName()} ${faker.person.firstName()} ${faker.person.middleName()}`,
      },
    });
    expect(
      res.status(),
      "POST /api/applications should not return 401",
    ).not.toBe(401);
  });

  for (const { method, path, body } of PROTECTED) {
    test(`${method} ${path} → 401 without X-Access-Key`, async ({
      request,
    }) => {
      const res = await request.fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body !== undefined && { data: body }),
      });
      expect(
        res.status(),
        `${method} ${path} must return 401 when X-Access-Key is missing`,
      ).toBe(401);
    });
  }
});
