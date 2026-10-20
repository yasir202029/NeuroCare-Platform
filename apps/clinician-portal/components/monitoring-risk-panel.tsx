"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acknowledgeAlert,
  createRiskEntry,
  getMonitoringHistory,
  getRiskRecords,
  updateRiskReviewStatus,
  type MonitoringHistory,
  type RiskDomain,
  type RiskLevel,
  type RiskRecord,
  type RiskReviewStatus,
} from "../lib/monitoring-api";

const riskDomains: RiskDomain[] = [
  "SELF_HARM",
  "SUICIDE",
  "RISK_TO_OTHERS",
  "VULNERABILITY",
  "SAFEGUARDING",
  "EXPLOITATION",
  "SUBSTANCE_USE",
  "DOMESTIC_ABUSE",
];

const riskLevels: RiskLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];

const reviewStatuses: RiskReviewStatus[] = ["PENDING", "IN_PROGRESS", "ACTIONED"];

const statusLabels: Record<RiskReviewStatus, string> = {
  PENDING: "Pending review",
  IN_PROGRESS: "Review in progress",
  ACTIONED: "Actioned",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const readingSummary = (review: MonitoringHistory["reviews"][number]) =>
  [
    review.bloodPressureSystolic != null && review.bloodPressureDiastolic != null
      ? `BP ${review.bloodPressureSystolic}/${review.bloodPressureDiastolic} mmHg`
      : null,
    review.pulse != null ? `Pulse ${review.pulse} bpm` : null,
    review.weightKg != null ? `Weight ${review.weightKg} kg` : null,
    review.bmi != null ? `BMI ${review.bmi}` : null,
    review.sleepHours != null ? `Sleep ${review.sleepHours} h` : null,
  ]
    .filter(Boolean)
    .join(" · ");

type NewEntryForm = {
  domain: RiskDomain;
  currentRisk: RiskLevel;
  historicalRisk: RiskLevel | "";
  protectiveFactors: string;
  actions: string;
  notes: string;
};

const emptyForm: NewEntryForm = {
  domain: "SAFEGUARDING",
  currentRisk: "LOW",
  historicalRisk: "",
  protectiveFactors: "",
  actions: "",
  notes: "",
};

/**
 * Clinician review workspace for physical-health monitoring and structured
 * risk/safeguarding records. Rendered inside the patient workspace so the
 * clinician keeps the patient context while reviewing.
 */
export function MonitoringRiskPanel({ patientId }: { patientId: string }) {
  const [history, setHistory] = useState<MonitoringHistory | null>(null);
  const [risks, setRisks] = useState<RiskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<NewEntryForm>(emptyForm);
  const [pendingStatus, setPendingStatus] = useState<Record<string, RiskReviewStatus>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [monitoring, riskRecords] = await Promise.all([
        getMonitoringHistory(patientId),
        getRiskRecords(patientId),
      ]);
      setHistory(monitoring);
      setRisks(riskRecords);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load monitoring and risk records.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const acknowledge = async (alertId: string) => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const result = await acknowledgeAlert(alertId);
      setStatus(
        result.alreadyAcknowledged
          ? "That alert was already acknowledged — no duplicate entry was written."
          : "Alert acknowledged and recorded against the patient timeline.",
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to acknowledge the alert.");
    } finally {
      setBusy(false);
    }
  };

  const applyStatus = async (entryId: string, reviewStatus: RiskReviewStatus) => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await updateRiskReviewStatus(patientId, entryId, reviewStatus);
      setStatus(`Risk review marked as ${statusLabels[reviewStatus].toLowerCase()}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update the review status.");
    } finally {
      setBusy(false);
    }
  };

  const addEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await createRiskEntry(patientId, {
        domain: form.domain,
        currentRisk: form.currentRisk,
        ...(form.historicalRisk ? { historicalRisk: form.historicalRisk } : {}),
        ...(form.protectiveFactors.trim()
          ? { protectiveFactors: form.protectiveFactors.trim() }
          : {}),
        ...(form.actions.trim() ? { actions: form.actions.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      setStatus("Risk entry recorded and queued for review.");
      setForm(emptyForm);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record the risk entry.");
    } finally {
      setBusy(false);
    }
  };

  const reviews = history?.reviews ?? [];
  const openAlerts = reviews.flatMap((review) =>
    review.alerts.filter((alert) => !alert.acknowledgedAt).map((alert) => ({ review, alert })),
  );

  return (
    <div className="monitoring-panel">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="muted" role="status">
          {status}
        </p>
      )}

      <section className="follow-up">
        <h3>Physical health monitoring</h3>
        <p className="muted">
          Readings submitted by the patient. Flagged values stay visible until a clinician
          acknowledges them, and acknowledgement is recorded against the patient timeline.
        </p>
        {!loading && reviews.length > 0 && (
          <p className="muted">
            {openAlerts.length} unacknowledged alert{openAlerts.length === 1 ? "" : "s"} across the
            recorded readings.
          </p>
        )}
        {loading ? (
          <p className="muted">Loading monitoring history…</p>
        ) : reviews.length === 0 ? (
          <p className="muted">No physical health readings recorded for this patient.</p>
        ) : (
          <div className="queue-items">
            {reviews.map((review) => (
              <article className="record-card" key={review.id}>
                <div className="record-head">
                  <b>{formatDateTime(review.reviewDate)}</b>
                  <span className={review.alertCount ? "tag tag-critical" : "tag tag-ok"}>
                    {review.alertCount} alert{review.alertCount === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="muted">{readingSummary(review) || "No measurements recorded."}</p>
                {review.notes && <p className="muted">Patient note: {review.notes}</p>}
                {review.alerts.length > 0 && (
                  <ul className="alert-list">
                    {review.alerts.map((alert) => (
                      <li key={alert.id}>
                        <span
                          className={
                            alert.severity === "CRITICAL" ? "tag tag-critical" : "tag tag-warning"
                          }
                        >
                          {alert.severity}
                        </span>
                        <span className="alert-message">{alert.message}</span>
                        {alert.acknowledgedAt ? (
                          <span className="muted">Acknowledged {formatDateTime(alert.acknowledgedAt)}</span>
                        ) : (
                          <button
                            className="save"
                            disabled={busy}
                            onClick={() => void acknowledge(alert.id)}
                          >
                            Acknowledge
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="follow-up">
        <h3>Risk and safeguarding</h3>
        <p className="muted">
          Structured risk entries recorded by the clinical team. Moving a review to actioned
          confirms the safeguards in place have been followed up.
        </p>
        {loading ? (
          <p className="muted">Loading risk records…</p>
        ) : risks.length === 0 ? (
          <p className="muted">No risk entries recorded for this patient.</p>
        ) : (
          <div className="queue-items">
            {risks.map((entry) => {
              const selected = pendingStatus[entry.id] ?? entry.reviewStatus;
              return (
                <article className="record-card" key={entry.id}>
                  <div className="record-head">
                    <b>{entry.domain.replaceAll("_", " ")}</b>
                    <span
                      className={
                        entry.currentRisk === "CRITICAL" || entry.currentRisk === "HIGH"
                          ? "tag tag-critical"
                          : "tag tag-warning"
                      }
                    >
                      {entry.currentRisk}
                    </span>
                  </div>
                  {entry.historicalRisk && (
                    <p className="muted">Historical risk: {entry.historicalRisk}</p>
                  )}
                  {entry.protectiveFactors && (
                    <p className="muted">Protective factors: {entry.protectiveFactors}</p>
                  )}
                  {entry.actions && <p className="muted">Actions: {entry.actions}</p>}
                  {entry.notes && <p className="muted">Notes: {entry.notes}</p>}
                  <p className="muted">
                    {statusLabels[entry.reviewStatus]}
                    {entry.reviewedByFirstName
                      ? ` · reviewed by ${entry.reviewedByFirstName} ${entry.reviewedByLastName ?? ""}`.trimEnd()
                      : ""}
                    {entry.reviewedAt ? ` · ${formatDateTime(entry.reviewedAt)}` : ""}
                  </p>
                  <div className="follow-up-actions">
                    <label htmlFor={`risk-status-${entry.id}`}>Review status</label>
                    <select
                      id={`risk-status-${entry.id}`}
                      value={selected}
                      onChange={(event) =>
                        setPendingStatus((current) => ({
                          ...current,
                          [entry.id]: event.target.value as RiskReviewStatus,
                        }))
                      }
                    >
                      {reviewStatuses.map((option) => (
                        <option key={option} value={option}>
                          {statusLabels[option]}
                        </option>
                      ))}
                    </select>
                    <button
                      className="save"
                      disabled={busy || selected === entry.reviewStatus}
                      onClick={() => void applyStatus(entry.id, selected)}
                    >
                      Update status
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="follow-up">
        <h3>Record a risk entry</h3>
        <form onSubmit={addEntry}>
          <div className="field-grid">
            <label className="field">
              <span>Domain</span>
              <select
                value={form.domain}
                onChange={(event) =>
                  setForm((current) => ({ ...current, domain: event.target.value as RiskDomain }))
                }
              >
                {riskDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Current risk</span>
              <select
                value={form.currentRisk}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currentRisk: event.target.value as RiskLevel,
                  }))
                }
              >
                {riskLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Historical risk (optional)</span>
              <select
                value={form.historicalRisk}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    historicalRisk: event.target.value as RiskLevel | "",
                  }))
                }
              >
                <option value="">Not recorded</option>
                {riskLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Protective factors</span>
            <textarea
              value={form.protectiveFactors}
              onChange={(event) =>
                setForm((current) => ({ ...current, protectiveFactors: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Actions taken</span>
            <textarea
              value={form.actions}
              onChange={(event) => setForm((current) => ({ ...current, actions: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
          <div className="follow-up-actions">
            <button className="save" type="submit" disabled={busy}>
              Record risk entry
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
