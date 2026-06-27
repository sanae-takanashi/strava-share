import { getSession, type StravaSession } from "./session";

const STRAVA_OAUTH = "https://www.strava.com/oauth";
const STRAVA_API = "https://www.strava.com/api/v3";

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  kilojoules?: number;
  calories?: number;
  average_cadence?: number;
  start_date_local: string;
  start_latlng?: [number, number] | null;
  map: {
    id: string;
    summary_polyline?: string;
    polyline?: string;
  };
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
}

export function buildAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: requireEnv("STRAVA_CLIENT_ID"),
    redirect_uri: requireEnv("STRAVA_REDIRECT_URI"),
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read",
  });
  return `${STRAVA_OAUTH}/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Strava token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Returns a valid access token for the current session, refreshing and persisting
 * it if the stored one is expired (or close to it). Throws if the user is not
 * authenticated — callers should treat that as "redirect to login".
 */
export async function getValidAccessToken(): Promise<string> {
  const session = await getSession();
  if (!session.refreshToken) {
    throw new NotAuthenticatedError();
  }

  const now = Math.floor(Date.now() / 1000);
  const skew = 60; // refresh a minute early
  if (session.accessToken && session.expiresAt && session.expiresAt - skew > now) {
    return session.accessToken;
  }

  const refreshed = await refreshToken(session.refreshToken);
  session.accessToken = refreshed.access_token;
  session.refreshToken = refreshed.refresh_token;
  session.expiresAt = refreshed.expires_at;
  await session.save();
  return refreshed.access_token;
}

export function persistToken(session: StravaSession, token: TokenResponse) {
  session.accessToken = token.access_token;
  session.refreshToken = token.refresh_token;
  session.expiresAt = token.expires_at;
  if (token.athlete) {
    session.athlete = {
      id: token.athlete.id,
      firstname: token.athlete.firstname,
      lastname: token.athlete.lastname,
    };
  }
}

async function stravaGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${STRAVA_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new NotAuthenticatedError();
  }
  if (res.status === 429) {
    throw new Error("Strava rate limit reached. Try again in a few minutes.");
  }
  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function listActivities(perPage = 30): Promise<StravaActivity[]> {
  const token = await getValidAccessToken();
  return stravaGet<StravaActivity[]>(`/athlete/activities?per_page=${perPage}`, token);
}

export async function getActivity(id: string | number): Promise<StravaActivity> {
  const token = await getValidAccessToken();
  return stravaGet<StravaActivity>(`/activities/${id}`, token);
}

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated with Strava");
    this.name = "NotAuthenticatedError";
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
