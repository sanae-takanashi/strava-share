import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/strava";

export async function GET() {
  return NextResponse.redirect(buildAuthorizeUrl());
}
