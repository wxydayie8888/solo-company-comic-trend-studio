import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  const filePath = path.join(DATA_DIR, file);
  if (!existsSync(filePath)) return fallback;
  const raw = await readFile(filePath, "utf8");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw) as T;
}

export async function writeJson<T>(file: string, value: T): Promise<void> {
  await ensureDir();
  const filePath = path.join(DATA_DIR, file);
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(value, null, 2), "utf8");
  await rename(tmpPath, filePath);
}

export async function appendJson<T>(file: string, item: T): Promise<void> {
  const items = await readJson<T[]>(file, []);
  items.unshift(item);
  await writeJson(file, items.slice(0, 500));
}
