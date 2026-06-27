import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface StravaSession {
  accessToken?: string;
  refreshToken?: string;
  /** Unix seconds when the access token expires. */
  expiresAt?: number;
  athlete?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "strava_share_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a 32+ character string. See .env.example.",
    );
  }
  const cookieStore = await cookies();
  return getIronSession<StravaSession>(cookieStore, sessionOptions);
}
