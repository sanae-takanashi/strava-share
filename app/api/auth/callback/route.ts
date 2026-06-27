import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, persistToken } from "@/lib/strava";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const scope = searchParams.get("scope") ?? "";
  const base = process.env.APP_BASE_URL ?? new URL(req.url).origin;

  if (error) {
    return NextResponse.redirect(`${base}/?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${base}/?error=missing_code`);
  }
  if (!scope.includes("activity:read")) {
    return NextResponse.redirect(`${base}/?error=insufficient_scope`);
  }

  try {
    const token = await exchangeCodeForToken(code);
    const session = await getSession();
    persistToken(session, token);
    await session.save();
    return NextResponse.redirect(`${base}/activities`);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${base}/?error=token_exchange_failed`);
  }
}
