import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");

export function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function loadJson<T>(filename: string, fallback: T): T {
  try {
    ensureDataDir();
    const path = join(DATA_DIR, filename);
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(filename: string, data: T): void {
  try {
    ensureDataDir();
    writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2));
  } catch {}
}
