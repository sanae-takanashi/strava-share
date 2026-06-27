import { NextResponse } from "next/server";
import { listActivities, NotAuthenticatedError } from "@/lib/strava";

export async function GET() {
  try {
    const activities = await listActivities(50);
    // Only rides have a route worth drawing.
    const rides = activities.filter(
      (a) => a.type === "Ride" || a.sport_type === "Ride" || a.sport_type === "MountainBikeRide" || a.sport_type === "GravelRide",
    );
    return NextResponse.json(rides);
  } catch (e) {
    if (e instanceof NotAuthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
