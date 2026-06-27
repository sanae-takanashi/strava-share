export type MapStyle = "dark" | "light" | "streets" | "outdoors" | "satellite";

const STYLE_IDS: Record<MapStyle, string> = {
  dark: "dark-v11",
  light: "light-v11",
  streets: "streets-v12",
  outdoors: "outdoors-v12",
  satellite: "satellite-streets-v12",
};

const STRAVA_ORANGE = "fc4c02";

/**
 * Build a Mapbox Static Images API URL that renders the encoded polyline overlaid
 * on a map, auto-fitted to the route. `polyline` is Strava's precision-5 encoded
 * polyline and is passed straight through (it must be URL-encoded).
 *
 * Mapbox caps static image dimensions at 1280px per side, so we request the
 * largest fitting size at @2x and let the card scale it.
 */
export function buildStaticMapUrl(opts: {
  polyline: string;
  style?: MapStyle;
  width: number;
  height: number;
  strokeWidth?: number;
  padding?: number;
}): string {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) throw new Error("Missing required env var: MAPBOX_TOKEN");

  const style = STYLE_IDS[opts.style ?? "dark"];
  const w = Math.min(opts.width, 1280);
  const h = Math.min(opts.height, 1280);
  const stroke = opts.strokeWidth ?? 5;

  // path-{strokeWidth}+{color}-{opacity}(polyline)
  const overlay = `path-${stroke}+${STRAVA_ORANGE}-1(${encodeURIComponent(opts.polyline)})`;

  const params = new URLSearchParams({
    access_token: token,
    padding: String(opts.padding ?? 56),
  });

  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlay}/auto/${w}x${h}@2x?${params.toString()}`;
}

/** Fetch the static map and return it as a data URI so Satori can embed it inline. */
export async function fetchMapDataUri(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Mapbox static image failed: ${res.status} ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/png";
  return `data:${contentType};base64,${buf.toString("base64")}`;
}
