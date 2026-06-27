import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const base = process.env.APP_BASE_URL ?? new URL(req.url).origin;
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(`${base}/`);
}
