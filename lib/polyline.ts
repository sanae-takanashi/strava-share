export type LatLng = [number, number];

/**
 * Decode a Google/Strava encoded polyline (default precision 5) into [lat, lng] pairs.
 */
export function decodePolyline(str: string, precision = 5): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let result = 1;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      b = str.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

/**
 * Project [lat, lng] coordinates (Web Mercator) into an SVG path `d` string that fits a
 * width×height box with padding, preserving aspect ratio and centering. Used by the
 * keyless route renderer (no base map).
 */
export function routeToSvgPath(
  coords: LatLng[],
  width: number,
  height: number,
  pad: number,
): string {
  if (coords.length === 0) return "";

  const pts = coords.map(([lat, lng]) => {
    const x = (lng * Math.PI) / 180;
    const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
    return [x, y] as const;
  });

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const offX = pad + (innerW - spanX * scale) / 2;
  const offY = pad + (innerH - spanY * scale) / 2;

  return pts
    .map(([x, y], i) => {
      const px = offX + (x - minX) * scale;
      const py = offY + (maxY - y) * scale; // flip Y (SVG y grows downward)
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
}
