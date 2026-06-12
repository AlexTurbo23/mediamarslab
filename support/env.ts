function readEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function hasXAccessKey(): boolean {
  return !!process.env.X_ACCESS_KEY;
}

export function hasAdminCredentials(): boolean {
  return !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export const env = {
  baseUrl: process.env.BASE_URL ?? "https://qa-a.recruitment.mediamarslab.com",
  xAccessKey: () => readEnv("X_ACCESS_KEY"),
  adminEmail: () => readEnv("ADMIN_EMAIL"),
  adminPassword: () => readEnv("ADMIN_PASSWORD"),
  testUserPassword: process.env.TEST_USER_PASSWORD ?? "TestPass123!",
  analyticsBasicUser: process.env.ANALYTICS_BASIC_USER ?? "QA_USER",
  analyticsBasicPassword:
    process.env.ANALYTICS_BASIC_PASSWORD ?? "dtW,/aK8A6bk`3H?DZ",
};
