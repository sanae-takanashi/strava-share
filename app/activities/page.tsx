import Link from "next/link";
import { redirect } from "next/navigation";
import { listActivities, NotAuthenticatedError } from "@/lib/strava";
import { buildStats } from "@/lib/format";
import { localDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  let activities;
  try {
    activities = await listActivities(50);
  } catch (e) {
    if (e instanceof NotAuthenticatedError) {
      redirect("/");
    }
    throw e;
  }

  const rides = activities.filter(
    (a) =>
      a.type === "Ride" ||
      ["Ride", "MountainBikeRide", "GravelRide", "VirtualRide"].includes(a.sport_type),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your rides</h1>
          <p className="text-sm text-neutral-400">Pick a ride to make a share image.</p>
        </div>
        <Link href="/api/auth/logout" className="text-sm text-neutral-500 hover:text-neutral-300">
          Disconnect
        </Link>
      </div>

      {rides.length === 0 ? (
        <p className="text-neutral-400">No rides found in your recent activities.</p>
      ) : (
        <ul className="space-y-3">
          {rides.map((ride) => {
            const stats = buildStats(ride, "metric");
            const hasRoute = Boolean(ride.map?.summary_polyline);
            return (
              <li key={ride.id}>
                <Link
                  href={`/editor/${ride.id}`}
                  className="block rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition hover:border-strava/60 hover:bg-neutral-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{ride.name}</p>
                      <p className="text-xs text-neutral-500">{localDate(ride.start_date_local)}</p>
                    </div>
                    {!hasRoute && (
                      <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-1 text-[10px] text-neutral-400">
                        No GPS route
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-300">
                    {stats.slice(0, 4).map((s) => (
                      <span key={s.key}>
                        <span className="font-semibold">{s.value}</span>
                        <span className="text-neutral-500"> {s.unit || s.label}</span>
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-center text-xs text-neutral-600">Powered by Strava</p>
    </main>
  );
}
