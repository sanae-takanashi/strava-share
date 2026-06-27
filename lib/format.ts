import { distance, elevation, speed, type UnitSystem } from "./units";
import type { StravaActivity } from "./strava";

/** Format seconds as h:mm:ss (or m:ss when under an hour). */
export function duration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function num(value: number, digits = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function localDate(iso: string): string {
  // start_date_local is already in the athlete's local time; render it as-is (UTC parse,
  // formatted without timezone shift) so it matches what Strava shows.
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface Stat {
  key: string;
  label: string;
  value: string;
  unit: string;
}

/**
 * Build the full set of displayable stats for an activity. The editor decides
 * which keys to actually render.
 */
export function buildStats(activity: StravaActivity, units: UnitSystem): Stat[] {
  const stats: Stat[] = [];

  const dist = distance(activity.distance, units);
  stats.push({ key: "distance", label: "Distance", value: num(dist.value, 1), unit: dist.unit });

  stats.push({ key: "moving_time", label: "Moving Time", value: duration(activity.moving_time), unit: "" });

  const elev = elevation(activity.total_elevation_gain, units);
  stats.push({ key: "elevation", label: "Elevation", value: num(elev.value), unit: elev.unit });

  const avgSpeed = speed(activity.average_speed, units);
  stats.push({ key: "avg_speed", label: "Avg Speed", value: num(avgSpeed.value, 1), unit: avgSpeed.unit });

  const maxSpeed = speed(activity.max_speed, units);
  stats.push({ key: "max_speed", label: "Max Speed", value: num(maxSpeed.value, 1), unit: maxSpeed.unit });

  if (activity.average_heartrate) {
    stats.push({ key: "avg_hr", label: "Avg HR", value: num(activity.average_heartrate), unit: "bpm" });
  }
  if (activity.max_heartrate) {
    stats.push({ key: "max_hr", label: "Max HR", value: num(activity.max_heartrate), unit: "bpm" });
  }
  if (activity.average_watts) {
    stats.push({ key: "avg_power", label: "Avg Power", value: num(activity.average_watts), unit: "W" });
  }
  if (activity.average_cadence) {
    stats.push({ key: "cadence", label: "Cadence", value: num(activity.average_cadence), unit: "rpm" });
  }
  const energy = activity.calories ?? activity.kilojoules;
  if (energy) {
    stats.push({ key: "calories", label: "Energy", value: num(energy), unit: activity.calories ? "cal" : "kJ" });
  }

  return stats;
}

/** Default stat keys shown when the editor first loads. */
export const DEFAULT_STAT_KEYS = ["distance", "moving_time", "elevation", "avg_speed"];
