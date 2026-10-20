"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PatientShell } from "../../components/patient-shell";
import { getPatientJourney, type PatientJourney } from "../../lib/patient-journey-api";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PatientDashboardClient() {
  const [journey, setJourney] = useState<PatientJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJourney(await getPatientJourney());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your care journey.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <PatientShell>
        <h1 className="text-2xl font-semibold text-slate-900">Your care</h1>
        <p className="mt-2 text-slate-600">Loading your next step…</p>
      </PatientShell>
    );
  }

  if (error || !journey) {
    return (
      <PatientShell>
        <h1 className="text-2xl font-semibold text-slate-900">Your care</h1>
        <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error ?? "We could not load your care journey."}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </PatientShell>
    );
  }

  const { nextAction, secondaryActions, milestones, upcoming, outstanding, recentUpdates } = journey;

  return (
    <PatientShell>
      <h1 className="text-2xl font-semibold text-slate-900">Your care</h1>
      <p className="mt-1 text-slate-600">{journey.patientVisibleStatus}</p>

      <section
        aria-labelledby="next-action-heading"
        className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-6"
      >
        <h2 id="next-action-heading" className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Next step
        </h2>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">{nextAction.title}</h3>
        <p className="mt-1 text-slate-700">{nextAction.description}</p>
        <Link
          href={nextAction.actionUrl}
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {nextAction.blocking ? "Complete this step" : "Go to step"}
        </Link>
        {secondaryActions.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-indigo-200 pt-4">
            {secondaryActions.map((action) => (
              <li key={action.title} className="flex flex-wrap items-center gap-2">
                <Link href={action.actionUrl} className="text-sm font-semibold text-indigo-700 underline">
                  {action.title}
                </Link>
                <span className="text-sm text-slate-600">{action.description}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="upcoming-heading" className="mt-8">
        <h2 id="upcoming-heading" className="text-lg font-semibold text-slate-900">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">You have no upcoming appointments.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((appt) => (
              <li key={appt.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{appt.type.replaceAll("_", " ")}</p>
                <p className="text-sm text-slate-600">{formatDate(appt.startsAt)}</p>
                <p className="text-sm text-slate-500">
                  {appt.mode} · {appt.status.toLowerCase()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="todo-heading" className="mt-8">
        <h2 id="todo-heading" className="text-lg font-semibold text-slate-900">
          To do
        </h2>
        {outstanding.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Nothing needs your attention right now.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {outstanding.map((task) => (
              <li key={task.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{task.title}</p>
                {task.dueAt && <p className="text-sm text-slate-600">Due {formatDate(task.dueAt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="journey-heading" className="mt-8">
        <h2 id="journey-heading" className="text-lg font-semibold text-slate-900">
          Your journey
        </h2>
        <ol className="mt-3 space-y-2">
          {milestones.map((milestone) => (
            <li
              key={milestone.key}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                milestone.state === "CURRENT"
                  ? "border-indigo-300 bg-indigo-50"
                  : milestone.state === "DONE"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-3 w-3 rounded-full ${
                  milestone.state === "DONE"
                    ? "bg-emerald-600"
                    : milestone.state === "CURRENT"
                      ? "bg-indigo-600"
                      : "bg-slate-300"
                }`}
              />
              <span className="text-sm text-slate-800">{milestone.label}</span>
              <span className="sr-only">{milestone.state.toLowerCase()}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="updates-heading" className="mt-8">
        <h2 id="updates-heading" className="text-lg font-semibold text-slate-900">
          Recent
        </h2>
        {recentUpdates.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No new updates yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentUpdates.map((update) => (
              <li key={update.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{update.title}</p>
                <p className="text-sm text-slate-600">{formatDate(update.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PatientShell>
  );
}
