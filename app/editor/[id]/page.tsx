import { redirect } from "next/navigation";
import Link from "next/link";
import { getActivity, NotAuthenticatedError } from "@/lib/strava";
import { buildStats } from "@/lib/format";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let activity;
  try {
    activity = await getActivity(id);
  } catch (e) {
    if (e instanceof NotAuthenticatedError) redirect("/");
    throw e;
  }

  // Keys/labels are unit-independent; the editor uses them to build the toggle list.
  const available = buildStats(activity, "metric").map((s) => ({ key: s.key, label: s.label }));
  const hasRoute = Boolean(activity.map?.summary_polyline || activity.map?.polyline);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/activities" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← All rides
        </Link>
        <h1 className="truncate text-lg font-semibold">{activity.name}</h1>
      </div>
      <Editor id={id} available={available} hasRoute={hasRoute} fileName={activity.name} />
    </main>
  );
}
