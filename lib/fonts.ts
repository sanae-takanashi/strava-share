import { readFile } from "fs/promises";
import path from "path";

interface Weight {
  weight: 400 | 700 | 900;
  file: string;
}

// Barlow: a clean grotesque that renders cleanly through Satori's font parser
// (many fonts trip it on GSUB lookupType 7 / fvar; Barlow is verified-compatible).
const WEIGHTS: Weight[] = [
  { weight: 400, file: "Barlow-Regular.ttf" },
  { weight: 700, file: "Barlow-Bold.ttf" },
  { weight: 900, file: "Barlow-Black.ttf" },
];

export const FONT_FAMILY = "Barlow";

let cache: Awaited<ReturnType<typeof load>> | null = null;

async function load() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  return Promise.all(
    WEIGHTS.map(async ({ weight, file }) => ({
      name: FONT_FAMILY,
      data: await readFile(path.join(dir, file)),
      weight,
      style: "normal" as const,
    })),
  );
}

/** Bundled font weights for Satori / ImageResponse. */
export async function shareFonts() {
  if (!cache) cache = await load();
  return cache;
}
