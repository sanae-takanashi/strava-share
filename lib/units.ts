export type UnitSystem = "metric" | "imperial";

const M_PER_KM = 1000;
const M_PER_MILE = 1609.344;
const M_PER_FOOT = 0.3048;

export function distance(meters: number, units: UnitSystem) {
  if (units === "imperial") {
    return { value: meters / M_PER_MILE, unit: "mi" };
  }
  return { value: meters / M_PER_KM, unit: "km" };
}

export function elevation(meters: number, units: UnitSystem) {
  if (units === "imperial") {
    return { value: meters / M_PER_FOOT, unit: "ft" };
  }
  return { value: meters, unit: "m" };
}

/** Convert m/s to km/h or mph. */
export function speed(metersPerSec: number, units: UnitSystem) {
  if (units === "imperial") {
    return { value: (metersPerSec / M_PER_MILE) * 3600, unit: "mph" };
  }
  return { value: (metersPerSec / M_PER_KM) * 3600, unit: "km/h" };
}
