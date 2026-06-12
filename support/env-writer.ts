import * as fs from "fs";
import * as path from "path";

const ENV_FILE = path.resolve(process.cwd(), ".env");

export function updateEnvFile(values: Record<string, string>): void {
  let content = fs.existsSync(ENV_FILE)
    ? fs.readFileSync(ENV_FILE, "utf-8")
    : "";

  for (const [key, value] of Object.entries(values)) {
    const entry = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    content = pattern.test(content)
      ? content.replace(pattern, entry)
      : `${content.trimEnd()}\n${entry}\n`;
  }

  fs.writeFileSync(ENV_FILE, content, "utf-8");
}
