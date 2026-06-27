"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_STAT_KEYS } from "@/lib/format";

type Ratio = "story" | "square";
type Theme = "dark" | "light";
type Units = "metric" | "imperial";
type MapStyle = "dark" | "light" | "streets" | "outdoors" | "satellite";

const MAP_STYLES: { value: MapStyle; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "streets", label: "Streets" },
  { value: "outdoors", label: "Outdoors" },
  { value: "satellite", label: "Satellite" },
];

export function Editor({
  id,
  available,
  hasRoute,
  fileName,
}: {
  id: string;
  available: { key: string; label: string }[];
  hasRoute: boolean;
  fileName: string;
}) {
  const [ratio, setRatio] = useState<Ratio>("story");
  const [theme, setTheme] = useState<Theme>("dark");
  const [units, setUnits] = useState<Units>("metric");
  const [mapStyle, setMapStyle] = useState<MapStyle>("dark");
  const [selected, setSelected] = useState<string[]>(
    available.filter((s) => DEFAULT_STAT_KEYS.includes(s.key)).map((s) => s.key),
  );

  const [debounced, setDebounced] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Build the image route URL from the current controls.
  const url = useMemo(() => {
    const p = new URLSearchParams({
      id,
      ratio,
      theme,
      units,
      map: mapStyle,
      stats: selected.join(","),
      // bust the browser cache when controls change
      v: String(debounced),
    });
    return `/api/share-image?${p.toString()}`;
  }, [id, ratio, theme, units, mapStyle, selected, debounced]);

  // Debounce control changes into a version bump that re-requests the image.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setDebounced((v) => v + 1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, theme, units, mapStyle, selected]);

  function toggleStat(key: string) {
    setSelected((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 6) return prev; // cap at six
      return [...prev, key];
    });
  }

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Image generation failed (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${slugify(fileName)}-${ratio}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  const aspect = ratio === "story" ? "9 / 16" : "1 / 1";

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      {/* Preview */}
      <div className="flex justify-center">
        <div
          className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
          style={{ aspectRatio: aspect, width: ratio === "story" ? 300 : 380, maxWidth: "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={url}
            src={url}
            alt="Share preview"
            className="h-full w-full object-cover"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 text-sm text-neutral-400">
              Rendering…
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-6">
        {!hasRoute && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            This ride has no GPS route, so the map area shows a placeholder.
          </p>
        )}

        <Control label="Format">
          <Segmented
            options={[
              { value: "story", label: "Story 9:16" },
              { value: "square", label: "Square 1:1" },
            ]}
            value={ratio}
            onChange={(v) => setRatio(v as Ratio)}
          />
        </Control>

        <Control label="Theme">
          <Segmented
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as Theme)}
          />
        </Control>

        <Control label="Units">
          <Segmented
            options={[
              { value: "metric", label: "Metric" },
              { value: "imperial", label: "Imperial" },
            ]}
            value={units}
            onChange={(v) => setUnits(v as Units)}
          />
        </Control>

        <Control label="Map style">
          <div className="flex flex-wrap gap-2">
            {MAP_STYLES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMapStyle(m.value)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  mapStyle === m.value
                    ? "bg-strava text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </Control>

        <Control label={`Stats (${selected.length}/6)`}>
          <div className="flex flex-wrap gap-2">
            {available.map((s) => {
              const on = selected.includes(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => toggleStat(s.key)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    on ? "bg-strava text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Control>

        <button
          onClick={download}
          disabled={downloading}
          className="w-full rounded-full bg-strava py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {downloading ? "Preparing…" : "Download image"}
        </button>
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-full bg-neutral-800 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs transition ${
            value === o.value ? "bg-strava text-white" : "text-neutral-300 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "ride";
}
