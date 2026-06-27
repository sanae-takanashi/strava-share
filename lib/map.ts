export type MapStyle = "dark" | "light" | "outdoors" | "terrain" | "satellite";

// Stadia Maps style ids. See https://docs.stadiamaps.com/themes/
const STYLE_IDS: Record<MapStyle, string> = {
  dark: "alidade_smooth_dark",
  light: "alidade_smooth",
  outdoors: "outdoors",
  terrain: "stamen_terrain",
  satellite: "alidade_satellite",
};

const STRAVA_ORANGE = "fc4c02";

export function hasMapKey(): boolean {
  return Boolean(process.env.STADIA_API_KEY);
}

export function defaultStyleFor(theme: "dark" | "light"): MapStyle {
  return theme === "light" ? "light" : "dark";
}

/**
 * Build a Stadia Maps Static Images URL with the route polyline overlaid and auto-fitted.
 * Strava's `summary_polyline` is precision-5, so we pass `line_precision=5` (Stadia defaults
 * to 6). Omitting center/zoom makes Stadia auto-fit to the line.
 */
export function buildStaticMapUrl(opts: {
  polyline: string;
  style?: MapStyle;
  width: number;
  height: number;
  strokeWidth?: number;
}): string {
  const key = process.env.STADIA_API_KEY;
  if (!key) throw new Error("Missing STADIA_API_KEY");

  const style = STYLE_IDS[opts.style ?? "dark"];
  const stroke = opts.strokeWidth ?? 5;

  const params = new URLSearchParams();
  params.set("size", `${opts.width}x${opts.height}@2x`);
  params.set("line_precision", "5");
  // l=<encoded polyline>,<stroke color>,<stroke width>
  params.set("l", `${opts.polyline},${STRAVA_ORANGE},${stroke}`);
  params.set("api_key", key);

  return `https://tiles.stadiamaps.com/static/${style}.png?${params.toString()}`;
}

/** Fetch the static map and return it as a data URI so Satori can embed it inline. */
export async function fetchMapDataUri(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Static map failed: ${res.status} ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/png";
  return `data:${contentType};base64,${buf.toString("base64")}`;
}
