import type { Stat } from "@/lib/format";
import { FONT_FAMILY } from "@/lib/fonts";
import { routeToSvgPath, type LatLng } from "@/lib/polyline";

export type Theme = "dark" | "light";

export interface ShareCardProps {
  title: string;
  dateLabel: string;
  athleteName?: string;
  stats: Stat[];
  /** Data URI of the route-on-map image (real base map), or null. */
  mapDataUri: string | null;
  /** Decoded route coordinates, used to draw a keyless route when there's no base map. */
  routeCoords?: LatLng[] | null;
  theme: Theme;
  width: number;
  height: number;
}

const STRAVA = "#fc4c02";

const THEMES = {
  dark: {
    bg: "#0a0a0b",
    text: "#ffffff",
    muted: "#9ca3af",
    tile: "rgba(255,255,255,0.06)",
    scrim: "linear-gradient(to bottom, rgba(10,10,11,0), #0a0a0b)",
    placeholder: "linear-gradient(135deg, #1f2937, #0a0a0b)",
  },
  light: {
    bg: "#ffffff",
    text: "#0a0a0b",
    muted: "#6b7280",
    tile: "rgba(0,0,0,0.05)",
    scrim: "linear-gradient(to bottom, rgba(255,255,255,0), #ffffff)",
    placeholder: "linear-gradient(135deg, #e5e7eb, #ffffff)",
  },
} as const;

/**
 * Pure, Satori-compatible card (flexbox + inline styles only). Rendered to PNG by
 * the /api/share-image route; never used as a browser component.
 */
export function ShareCard({
  title,
  dateLabel,
  athleteName,
  stats,
  mapDataUri,
  routeCoords,
  theme,
  width,
  height,
}: ShareCardProps) {
  const t = THEMES[theme];
  const pad = Math.round(width * 0.06);
  const mapHeight = Math.round(height * (height >= width ? 0.6 : 0.52));
  const tileBasis = stats.length <= 4 ? "46%" : "30%";

  const hasRoute = Boolean(routeCoords && routeCoords.length > 1);
  // Keyless route path (only used when there's no base-map image).
  const routePathD = !mapDataUri && hasRoute ? routeToSvgPath(routeCoords!, width, mapHeight, pad) : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        backgroundColor: t.bg,
        fontFamily: FONT_FAMILY,
        color: t.text,
      }}
    >
      {/* Map hero */}
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: mapHeight,
          backgroundImage: mapDataUri ? `url(${mapDataUri})` : t.placeholder,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* top pill */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: pad,
            left: pad,
            alignItems: "center",
            backgroundColor: STRAVA,
            color: "#fff",
            fontSize: Math.round(width * 0.026),
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: "uppercase",
            padding: `${Math.round(pad * 0.28)}px ${Math.round(pad * 0.5)}px`,
            borderRadius: 999,
          }}
        >
          Ride
        </div>
        {!mapDataUri && routePathD ? (
          <svg
            width={width}
            height={mapHeight}
            viewBox={`0 0 ${width} ${mapHeight}`}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <path
              d={routePathD}
              fill="none"
              stroke={STRAVA}
              strokeWidth={Math.round(width * 0.009)}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
        {!mapDataUri && !routePathD && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              color: t.muted,
              fontSize: Math.round(width * 0.03),
            }}
          >
            No GPS route for this ride
          </div>
        )}
        {/* bottom scrim into panel */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: Math.round(mapHeight * 0.28),
            backgroundImage: t.scrim,
          }}
        />
      </div>

      {/* Content panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: pad,
          paddingTop: Math.round(pad * 0.4),
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: Math.round(width * 0.028),
            color: t.muted,
            marginBottom: Math.round(pad * 0.15),
          }}
        >
          {dateLabel}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: Math.round(width * 0.058),
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: pad,
          }}
        >
          {title}
        </div>

        {/* Stat tiles */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            flex: 1,
            justifyContent: "space-between",
            alignContent: "flex-start",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.key}
              style={{
                display: "flex",
                flexDirection: "column",
                width: tileBasis,
                marginBottom: Math.round(pad * 0.7),
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: Math.round(width * 0.072), fontWeight: 900, lineHeight: 1 }}>
                  {s.value}
                </span>
                {s.unit ? (
                  <span
                    style={{
                      fontSize: Math.round(width * 0.03),
                      fontWeight: 700,
                      color: t.muted,
                      marginLeft: 6,
                    }}
                  >
                    {s.unit}
                  </span>
                ) : null}
              </div>
              <span
                style={{
                  fontSize: Math.round(width * 0.024),
                  color: t.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginTop: 4,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${t.tile}`,
            paddingTop: Math.round(pad * 0.5),
          }}
        >
          <span style={{ display: "flex", fontSize: Math.round(width * 0.026), color: t.muted }}>
            {athleteName ?? ""}
          </span>
          <span
            style={{
              display: "flex",
              fontSize: Math.round(width * 0.026),
              fontWeight: 700,
              color: STRAVA,
            }}
          >
            Powered by Strava
          </span>
        </div>
      </div>
    </div>
  );
}
