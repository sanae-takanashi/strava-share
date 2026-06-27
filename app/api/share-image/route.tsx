import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getActivity, NotAuthenticatedError } from "@/lib/strava";
import { buildStats, localDate, DEFAULT_STAT_KEYS } from "@/lib/format";
import { buildStaticMapUrl, fetchMapDataUri, hasMapKey, defaultStyleFor, type MapStyle } from "@/lib/map";
import { decodePolyline } from "@/lib/polyline";
import { shareFonts } from "@/lib/fonts";
import { ShareCard, type Theme } from "@/components/ShareCard";
import type { UnitSystem } from "@/lib/units";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZES = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

const MAP_STYLES: MapStyle[] = ["dark", "light", "outdoors", "terrain", "satellite"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const ratio = searchParams.get("ratio") === "square" ? "square" : "story";
  const theme: Theme = searchParams.get("theme") === "light" ? "light" : "dark";
  const units: UnitSystem = searchParams.get("units") === "imperial" ? "imperial" : "metric";
  const mapStyleParam = searchParams.get("map") as MapStyle | null;
  const mapStyle: MapStyle =
    mapStyleParam && MAP_STYLES.includes(mapStyleParam) ? mapStyleParam : defaultStyleFor(theme);

  const statKeys = (searchParams.get("stats")?.split(",").filter(Boolean) ?? DEFAULT_STAT_KEYS).slice(0, 6);

  const { width, height } = SIZES[ratio];

  try {
    const activity = await getActivity(id);

    const allStats = buildStats(activity, units);
    const byKey = new Map(allStats.map((s) => [s.key, s]));
    const stats = statKeys.map((k) => byKey.get(k)).filter((s): s is NonNullable<typeof s> => Boolean(s));

    const polyline = activity.map?.summary_polyline || activity.map?.polyline;
    const routeCoords = polyline ? decodePolyline(polyline) : null;

    // Prefer a real base map (Stadia). On any failure — no key, rate limit, error — fall
    // back to the keyless route drawn from routeCoords inside ShareCard.
    let mapDataUri: string | null = null;
    if (polyline && hasMapKey()) {
      try {
        const mapUrl = buildStaticMapUrl({
          polyline,
          style: mapStyle,
          width,
          height: Math.round(height * 0.6),
          strokeWidth: 6,
        });
        mapDataUri = await fetchMapDataUri(mapUrl);
      } catch (e) {
        console.error("Base map fetch failed, falling back to keyless route:", e);
      }
    }

    const athleteName = undefined; // optional: could pull from session athlete

    return new ImageResponse(
      (
        <ShareCard
          title={activity.name}
          dateLabel={localDate(activity.start_date_local)}
          athleteName={athleteName}
          stats={stats.length ? stats : allStats.slice(0, 4)}
          mapDataUri={mapDataUri}
          routeCoords={routeCoords}
          theme={theme}
          width={width}
          height={height}
        />
      ),
      {
        width,
        height,
        fonts: await shareFonts(),
      },
    );
  } catch (e) {
    if (e instanceof NotAuthenticatedError) {
      return new Response("Not authenticated", { status: 401 });
    }
    console.error(e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
