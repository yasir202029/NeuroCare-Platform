"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PatientShell } from "../../../components/patient-shell";
import { getQuestionnaires, type Questionnaire } from "../../../lib/questionnaire-api";

const statusLabel: Record<string, string> = {
  NOT_STARTED: "Not started",
  DRAFT: "In progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Being reviewed",
  REVIEWED: "Reviewed",
};

export default function PatientQuestionnairesPage() {
  const [items, setItems] = useState<Questionnaire[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuestionnaires();
      setItems(data.questionnaires);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your questionnaires.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PatientShell>
      <h1 className="text-2xl font-semibold text-slate-900">My questionnaires</h1>
      <p className="mt-1 text-slate-600">
        Complete these before your assessment. Your answers are saved as you go.
      </p>

      {loading && <p className="mt-4 text-slate-600">Loading your questionnaires…</p>}

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && items && items.length === 0 && (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          There are no questionnaires for you at the moment. Your patient portal home will show one
          here if something becomes outstanding.
        </p>
      )}

      {!loading && !error && items && items.length > 0 && (
        <ul className="mt-6 space-y-3">
          {items.map((item) => {
            const actionable = item.status === "NOT_STARTED" || item.status === "DRAFT";
            return (
              <li key={item.formDefinitionId} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
                    {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                    <p className="mt-2 text-xs text-slate-500">
                      <span
                        className={`mr-2 inline-block rounded-full px-2 py-0.5 font-semibold ${
                          item.status === "REVIEWED"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "SUBMITTED" || item.status === "UNDER_REVIEW"
                              ? "bg-indigo-100 text-indigo-800"
                              : item.status === "DRAFT"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabel[item.status] ?? item.status}
                      </span>
                      Version {item.version}
                    </p>
                  </div>
                  {actionable ? (
                    <Link
                      href={`/patient/questionnaires/${item.key}`}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {item.status === "DRAFT" ? "Continue" : "Start"}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-500">
                      {item.status === "REVIEWED" ? "Complete" : "With your clinician"}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PatientShell>
  );
}
