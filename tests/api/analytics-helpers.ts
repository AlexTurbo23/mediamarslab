import { expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { z } from "zod";
import { env } from "@support/env";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimal 1×1 transparent PNG for photo upload tests. */
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const EventSchema = z
  .object({
    type: z.string(),
    email: z.string(),
    timestamp: z.union([z.string(), z.number()]),
  })
  .passthrough();

export const LoginEventSchema = EventSchema.extend({
  status: z.enum(["success", "failed"]),
});

// ── Request helpers ───────────────────────────────────────────────────────────

export function basicAuth(): string {
  return `Basic ${Buffer.from(
    `${env.analyticsBasicUser}:${env.analyticsBasicPassword}`,
  ).toString("base64")}`;
}

/** Headers for requests with a JSON body (POST / PATCH). */
export function jsonHeaders(token: string) {
  return {
    "X-Access-Key": env.xAccessKey(),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/** Headers for requests without a body (DELETE, logout, multipart). */
export function authHeaders(token: string) {
  return {
    "X-Access-Key": env.xAccessKey(),
    Authorization: `Bearer ${token}`,
  };
}

// ── API helpers ───────────────────────────────────────────────────────────────

export async function fetchEvents(request: APIRequestContext) {
  const res = await request.get("/api/analytics/events", {
    headers: { "X-Access-Key": env.xAccessKey(), Authorization: basicAuth() },
  });
  expect(res.status()).toBe(200);
  return res.json() as Promise<Array<Record<string, unknown>>>;
}

/** Registers a fresh user (consent=true) and logs in. Returns { email, token }. */
export async function createUser(request: APIRequestContext, tag: string) {
  const email = `qa-${tag}-${Date.now()}@test.local`;
  await request.post("/api/auth/register", {
    headers: {
      "X-Access-Key": env.xAccessKey(),
      "Content-Type": "application/json",
    },
    data: {
      name: `QA ${tag.charAt(0).toUpperCase()}${tag.slice(1)}`,
      email,
      gender: "0",
      password: env.testUserPassword,
      internalAnalyticsConsent: true,
    },
  });
  const res = await request.post("/api/auth/login", {
    headers: {
      "X-Access-Key": env.xAccessKey(),
      "Content-Type": "application/json",
    },
    data: { email, password: env.testUserPassword },
  });
  const { token } = await res.json();
  return { email, token: token as string };
}

/** Creates a todo and returns its server-assigned _id. */
export async function createTodo(
  request: APIRequestContext,
  token: string,
  title: string,
) {
  const res = await request.post("/api/todos", {
    headers: jsonHeaders(token),
    data: { title },
  });
  const data = await res.json();
  // API returns { todo: { _id, ... } }
  return (data.todo?._id ?? data._id) as string;
}

export async function findEvent(
  request: APIRequestContext,
  type: string,
  email: string,
) {
  const events = await fetchEvents(request);
  return events.find((e) => e.type === type && e.email === email);
}
