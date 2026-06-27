import Link from "next/link";
import { getSession } from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You declined access. Connect with Strava to continue.",
  insufficient_scope: "We need permission to read your activities. Please allow it.",
  token_exchange_failed: "Something went wrong talking to Strava. Try again.",
  missing_code: "Strava didn't return an authorization code. Try again.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  const isAuthed = Boolean(session.refreshToken);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Make your ride <span className="text-strava">share-worthy</span>
        </h1>
        <p className="text-lg text-neutral-400">
          Turn any Strava ride into a clean, modern share image — your route on a
          real map with the stats that matter. No more ugly default cards.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
        </p>
      )}

      {isAuthed ? (
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/activities"
            className="rounded-full bg-strava px-8 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Choose a ride →
          </Link>
          <Link href="/api/auth/logout" className="text-sm text-neutral-500 hover:text-neutral-300">
            Disconnect
          </Link>
        </div>
      ) : (
        <Link
          href="/api/auth/strava"
          className="rounded-full bg-strava px-8 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Connect with Strava
        </Link>
      )}

      <p className="text-xs text-neutral-600">Powered by Strava · Maps © Stadia Maps © OpenStreetMap</p>
    </main>
  );
}
