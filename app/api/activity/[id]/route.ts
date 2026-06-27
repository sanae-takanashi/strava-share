import { NextRequest, NextResponse } from "next/server";
import { getActivity, NotAuthenticatedError } from "@/lib/strava";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const activity = await getActivity(id);
    return NextResponse.json(activity);
  } catch (e) {
    if (e instanceof NotAuthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
