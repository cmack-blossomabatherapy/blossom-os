/**
 * Staffing Map Adapter (Pass 2)
 * ----------------------------------------------------------------
 * Normalizes client and RBT location data into a single map point
 * shape and provides Haversine distance + centroid fallbacks so the
 * Live Map tab is operational even before a real geocoder is wired.
 */

export type StaffingMapPointKind = "client" | "rbt";

export interface StaffingMapPoint {
  id: string;
  kind: StaffingMapPointKind;
  name: string;
  state: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lon: number | null;
  /** capacity hours remaining (rbt) or required hours (client) */
  hours: number | null;
  /** "High" | "Medium" | "Low" | undefined */
  urgency?: string;
  meta?: Record<string, string | number | null>;
}

/** Approx centroid for each US state we serve. Used when a row has no lat/lon. */
const STATE_CENTROIDS: Record<string, [number, number]> = {
  GA: [32.9866, -83.6487],
  TN: [35.7449, -86.7489],
  NC: [35.6301, -79.8064],
  VA: [37.7693, -78.1700],
  MD: [39.0639, -76.8021],
  FL: [27.6648, -81.5158],
  TX: [31.0545, -97.5635],
  SC: [33.8569, -80.9450],
  AL: [32.8067, -86.7911],
  KY: [37.6681, -84.6701],
};

/** Minimal city centroid table for a handful of regions we operate in. */
const CITY_CENTROIDS: Record<string, [number, number]> = {
  "Atlanta,GA": [33.749, -84.388],
  "Marietta,GA": [33.9526, -84.5499],
  "Savannah,GA": [32.0809, -81.0912],
  "Nashville,TN": [36.1627, -86.7816],
  "Memphis,TN": [35.1495, -90.0490],
  "Knoxville,TN": [35.9606, -83.9207],
  "Charlotte,NC": [35.2271, -80.8431],
  "Raleigh,NC": [35.7796, -78.6382],
  "Richmond,VA": [37.5407, -77.4360],
  "Baltimore,MD": [39.2904, -76.6122],
};

/** Resolve coords from explicit lat/lon, then city/state, then state centroid. */
export function resolveCoords(input: {
  lat?: number | null; lon?: number | null;
  city?: string | null; state?: string | null;
}): [number, number] | null {
  if (typeof input.lat === "number" && typeof input.lon === "number") {
    return [input.lat, input.lon];
  }
  if (input.city && input.state) {
    const key = `${input.city.trim()},${input.state.trim().toUpperCase()}`;
    if (CITY_CENTROIDS[key]) return CITY_CENTROIDS[key];
  }
  if (input.state && STATE_CENTROIDS[input.state.trim().toUpperCase()]) {
    return STATE_CENTROIDS[input.state.trim().toUpperCase()];
  }
  return null;
}

/** Haversine distance in miles. */
export function haversineMiles(a: [number, number], b: [number, number]): number {
  const R = 3958.8;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compute distance in miles between two map points (or null if unresolvable). */
export function distanceBetween(a: StaffingMapPoint, b: StaffingMapPoint): number | null {
  const ca = resolveCoords({ lat: a.lat, lon: a.lon, city: a.city, state: a.state });
  const cb = resolveCoords({ lat: b.lat, lon: b.lon, city: b.city, state: b.state });
  if (!ca || !cb) return null;
  return Math.round(haversineMiles(ca, cb) * 10) / 10;
}