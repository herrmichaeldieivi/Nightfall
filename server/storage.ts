// Local-disk storage. Uploads land under DATA_DIR (default ./data/uploads)
// and are served by the express server at /files/{key}.
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "data", "uploads");

function safeKey(relKey: string): string {
  const normalized = relKey.replace(/^\/+/, "").replace(/\.\./g, "_");
  return normalized;
}

export function uploadsDir(): string {
  return DATA_DIR;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  let key = safeKey(relKey);
  const lastDot = key.lastIndexOf(".");
  key = lastDot === -1 ? `${key}_${hash}` : `${key.slice(0, lastDot)}_${hash}${key.slice(lastDot)}`;
  const target = path.join(DATA_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  const bytes = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await writeFile(target, bytes);
  return { key, url: `/files/${key}` };
}

export async function storageRead(key: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(DATA_DIR, safeKey(key)));
  } catch {
    return null;
  }
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  // Local serving needs no signing; the LLM file part just needs a fetchable URL.
  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}/files/${safeKey(relKey)}`;
}
