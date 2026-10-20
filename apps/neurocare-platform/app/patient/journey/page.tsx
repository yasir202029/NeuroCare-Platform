"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PatientShell } from "../../../components/patient-shell";
import { getPatientJourney, type PatientJourney } from "../../../lib/patient-journey-api";

const milestoneStateLabel: Record<string, string> = {
  DONE: "Done",
  CURRENT: "You are here",
  PENDING: "Not started",
  BLOCKED: "Blocked",
};

export default function PatientJourneyPage() {
  const [journey, setJourney] = useState<PatientJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJourney(await getPatientJourney());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your journey.");
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
        <h1 className="text-2xl font-semibold">My journey</h1>
        <p className="mt-2 text-slate-600">Loading your pathway…</p>
      </PatientShell>
    );
  }

  if (error || !journey) {
    return (
      <PatientShell>
        <h1 className="text-2xl font-semibold">My journey</h1>
        <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error ?? "Unable to load your journey."}</p>
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

  return (
    <PatientShell>
      <h1 className="text-2xl font-semibold text-slate-900">My journey</h1>
      <p className="mt-1 text-slate-600">{journey.patientVisibleStatus}</p>

      <section aria-labelledby="stage-heading" className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 id="stage-heading" className="text-lg font-semibold text-slate-900">
          Where you are
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Current stage: <span className="font-semibold text-slate-800">{journey.currentStage.replaceAll("_", " ")}</span>
        </p>
        <ol className="mt-4 space-y-2">
          {journey.milestones.map((milestone, index) => (
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
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  milestone.state === "DONE"
                    ? "bg-emerald-600 text-white"
                    : milestone.state === "CURRENT"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {index + 1}
              </span>
              <span className="text-sm font-medium text-slate-800">{milestone.label}</span>
              <span className="ml-auto text-xs font-semibold text-slate-600">
                {milestoneStateLabel[milestone.state] ?? milestone.state}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="next-heading" className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
        <h2 id="next-heading" className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Your next step
        </h2>
        <p className="mt-2 text-lg font-semibold text-slate-900">{journey.nextAction.title}</p>
        <p className="mt-1 text-sm text-slate-700">{journey.nextAction.description}</p>
        <Link
          href={journey.nextAction.actionUrl}
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {journey.nextAction.blocking ? "Complete this step" : "Go to step"}
        </Link>
      </section>

      {journey.outstandingDocumentRequests.length > 0 && (
        <section aria-labelledby="evidence-heading" className="mt-6">
          <h2 id="evidence-heading" className="text-lg font-semibold text-slate-900">
            Documents we have asked for
          </h2>
          <ul className="mt-2 space-y-2">
            {journey.outstandingDocumentRequests.map((request) => (
              <li key={request.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{request.title}</p>
                {request.description && <p className="mt-1 text-sm text-slate-600">{request.description}</p>}
              </li>
            ))}
          </ul>
          <Link
            href="/patient/documents"
            className="mt-3 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Go to my documents
          </Link>
        </section>
      )}

      {journey.outstandingQuestionnaires.length > 0 && (
        <section aria-labelledby="questionnaires-heading" className="mt-6">
          <h2 id="questionnaires-heading" className="text-lg font-semibold text-slate-900">
            Questionnaires
          </h2>
          <ul className="mt-2 space-y-2">
            {journey.outstandingQuestionnaires.map((questionnaire) => (
              <li key={questionnaire.submissionId} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{questionnaire.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {questionnaire.status === "DRAFT" ? "In progress" : "With your clinician"}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/patient/questionnaires"
            className="mt-3 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Go to my questionnaires
          </Link>
        </section>
      )}

      {journey.outstanding.length > 0 && (
        <section aria-labelledby="tasks-heading" className="mt-6">
          <h2 id="tasks-heading" className="text-lg font-semibold text-slate-900">
            Other things to do
          </h2>
          <ul className="mt-2 space-y-2">
            {journey.outstanding.map((task) => (
              <li key={task.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{task.title}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="recent-heading" className="mt-6">
        <h2 id="recent-heading" className="text-lg font-semibold text-slate-900">
          Recent updates
        </h2>
        {journey.recentUpdates.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No new updates yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {journey.recentUpdates.map((update) => (
              <li key={update.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{update.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(update.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PatientShell>
  );
}
