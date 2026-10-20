"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PatientShell } from "../../../components/patient-shell";
import { getPatientProfile } from "../../../lib/patient-api";
import {
  getOwnMonitoring,
  submitOwnMonitoring,
  type MonitoringHistory,
  type SubmitMonitoringInput,
} from "../../../lib/patient-api";

const numericFields = [
  { key: "weightKg", label: "Weight (kg)", min: 30, max: 300 },
  { key: "bloodPressureSystolic", label: "BP systolic (mmHg)", min: 60, max: 240 },
  { key: "bloodPressureDiastolic", label: "BP diastolic (mmHg)", min: 30, max: 130 },
  { key: "pulse", label: "Pulse (bpm)", min: 30, max: 200 },
  { key: "sleepHours", label: "Sleep (hours)", min: 0, max: 24 },
] as const;

export default function MonitoringPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [history, setHistory] = useState<MonitoringHistory | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const profile = await getPatientProfile();
      setPatientId(profile.id);
      setHistory(await getOwnMonitoring(profile.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const input: SubmitMonitoringInput = {};
      for (const field of numericFields) {
        const raw = form[field.key]?.trim();
        if (!raw) continue;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) throw new Error(field.label + " must be a number.");
        (input as Record<string, number>)[field.key] = parsed;
      }
      if (notes.trim()) input.notes = notes.trim();
      const response = await submitOwnMonitoring(patientId, input);
      setResult(
        response.alertCount > 0
          ? "Reading saved. " + response.alertCount + " value(s) flagged for clinical review."
          : "Reading saved. All values are within the expected range.",
      );
      setForm({});
      setNotes("");
      setHistory(await getOwnMonitoring(patientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit this reading.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PatientShell>
      <p className="text-sm text-slate-600">
        <Link href="/patient" className="underline">Back to your care</Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Physical health monitoring</h1>
      <p className="mt-1 text-sm text-slate-600">
        Only fill in what you measured — anything left blank stays blank for your clinical team.
      </p>
      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}
      {result && (
        <div role="status" className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {result}
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {numericFields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-medium text-slate-800">{field.label}</span>
              <input
                type="number"
                inputMode="decimal"
                min={field.min}
                max={field.max}
                step="any"
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={5000}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Submit reading"}
        </button>
      </form>
      <section className="mt-8" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-lg font-semibold text-slate-900">Your recent readings</h2>
        {loading ? (
          <p className="mt-2 text-sm text-slate-600">Loading...</p>
        ) : !history || history.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No readings submitted yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.reviews.slice(0, 10).map((review) => (
              <li key={review.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">
                  {new Date(review.reviewDate).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {[
                    review.weightKg != null ? "Weight " + review.weightKg + " kg" : null,
                    review.bloodPressureSystolic != null && review.bloodPressureDiastolic != null
                      ? "BP " + review.bloodPressureSystolic + "/" + review.bloodPressureDiastolic + " mmHg"
                      : null,
                    review.pulse != null ? "Pulse " + review.pulse + " bpm" : null,
                    review.sleepHours != null ? "Sleep " + review.sleepHours + " h" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No measurements recorded"}
                </p>
                {review.alertCount > 0 &&
                  (review.alerts.every((alert) => alert.acknowledgedAt) ? (
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {review.alertCount} value{review.alertCount === 1 ? "" : "s"} reviewed by your
                      clinical team
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-amber-700">
                      {review.alertCount} flagged for clinical review
                    </p>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PatientShell>
  );
}
