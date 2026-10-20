"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClinicianShell } from "../components/clinician-shell";
import { getReviewQueue, reviewQuestionnaire, type ReviewQueueItem } from "../lib/questionnaire-api";
import {
  getMyDocumentRequests,
  requestDocument,
  reviewDocumentRequest,
  type ClinicianDocumentRequest,
} from "../lib/document-request-api";

type Patient = {
  id: string;
  user: { firstName: string; lastName: string };
  appointments: { id: string; startsAt: string; type: string; status: string; mode?: string }[];
  assessments: {
    id: string;
    type: string;
    status: string;
    formulation?: string | null;
    adhd?: { titrationPlans: { id: string; status: string; targetMedication?: string | null }[] } | null;
  }[];
  reports: unknown[];
  prescriptions: unknown[];
  messageThreads: unknown[];
};

type Workspace = {
  totalPatients: number;
  patients: Patient[];
  earnings: { serviceLine: string; _sum: { amountPence: number | null }; _count: { id: number } }[];
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const nameOf = (patient: Patient) => `${patient.user.firstName} ${patient.user.lastName}`;
const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

export default function Page() {
  const [reportText, setReportText] = useState("");
  const [reportKind, setReportKind] = useState("GP_LETTER");
  const [videoUrl, setVideoUrl] = useState("");
  const [data, setData] = useState<Workspace>();
  const [patient, setPatient] = useState<Patient>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("Overview");
  const [section, setSection] = useState("home");
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[] | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState<string | null>(null);
  const [documentRequests, setDocumentRequests] = useState<ClinicianDocumentRequest[]>([]);
  const [documentOutcome, setDocumentOutcome] = useState<string | null>(null);
  const [requestTitle, setRequestTitle] = useState("");

  const request = async (path: string, options?: RequestInit) => {
    if (!apiBase) throw new Error("The clinician API is not configured.");
    const token = sessionStorage.getItem("neurocare.accessToken");
    if (!token) throw new Error("Sign in to access live patient records.");
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => null))?.error?.message ?? "Unable to load live clinical data.",
      );
    return response.json();
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await request("/clinician/workspace"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load live clinical data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReviewQueue = useCallback(async () => {
    try {
      const queue = await getReviewQueue();
      setReviewQueue(queue.submissions);
    } catch (cause) {
      setReviewError(cause instanceof Error ? cause.message : "Unable to load the review queue.");
    }
    try {
      const requests = await getMyDocumentRequests();
      setDocumentRequests(requests.requests);
    } catch {
      /* document requests are supplementary; the workspace still works without them */
    }
  }, []);

  useEffect(() => {
    void load();
    void loadReviewQueue();
  }, [load, loadReviewQueue]);

  const completeReview = async (submissionId: string) => {
    setReviewBusy(true);
    setReviewError(null);
    try {
      const outcome = await reviewQuestionnaire(submissionId, reviewNotes);
      setReviewOutcome(outcome.nextAction);
      setReviewNotes("");
      await loadReviewQueue();
      await load();
    } catch (cause) {
      setReviewError(cause instanceof Error ? cause.message : "Unable to record the review.");
    } finally {
      setReviewBusy(false);
    }
  };

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const rows: Array<{ patient: Patient; appointment: Patient["appointments"][number] }> = [];
    for (const p of data?.patients ?? []) {
      for (const appointment of p.appointments) {
        const startsAt = new Date(appointment.startsAt);
        if (startsAt >= start && startsAt < end && appointment.status !== "CANCELLED") {
          rows.push({ patient: p, appointment });
        }
      }
    }
    return rows.sort((a, b) => a.appointment.startsAt.localeCompare(b.appointment.startsAt));
  }, [data]);

  const attention = useMemo(() => {
    const rows: Array<{ label: string; count: number; patients: Patient[] }> = [];
    const patients = data?.patients ?? [];
    const titration = patients.filter((p) =>
      p.assessments.some((a) => a.adhd?.titrationPlans.some((plan) => plan.status !== "COMPLETE")),
    );
    const reports = patients.filter((p) => p.reports.length > 0);
    const prescriptions = patients.filter((p) => p.prescriptions.length > 0);
    const messages = patients.filter((p) => p.messageThreads.length > 0);
    const inProgress = patients.filter((p) =>
      p.assessments.some((a) => a.status !== "COMPLETED" && a.status !== "DIAGNOSIS_CONFIRMED"),
    );
    rows.push({ label: "Titration reviews", count: titration.length, patients: titration });
    rows.push({ label: "Reports to complete", count: reports.length, patients: reports });
    rows.push({ label: "Prescription tasks", count: prescriptions.length, patients: prescriptions });
    rows.push({ label: "Patient messages", count: messages.length, patients: messages });
    rows.push({ label: "Assessments in progress", count: inProgress.length, patients: inProgress });
    return rows;
  }, [data]);

  const open = async (id: string) => {
    try {
      setPatient(await request(`/clinician/patients/${id}`));
      setTab("Overview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open patient workspace.");
    }
  };

  const send = async () => {
    if (!patient || !message.trim()) return;
    try {
      await request("/messages", {
        method: "POST",
        body: JSON.stringify({ patientId: patient.id, body: message, subject: "Clinician message" }),
      });
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send message.");
    }
  };

  const startVideo = async () => {
    if (!patient) return;
    const appointment = patient.appointments.find((item) => item.mode === "VIDEO");
    if (!appointment)
      return setError("This patient has no video appointment available to join.");
    try {
      const session = await request("/video/sessions", {
        method: "POST",
        body: JSON.stringify({ appointmentId: appointment.id }),
      });
      const joined = await request(`/video/sessions/${session.id}/join`, {
        method: "POST",
        body: JSON.stringify({ participantRole: "clinician" }),
      });
      setVideoUrl(joined.joinUrl);
      window.open(joined.joinUrl, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start video consultation.");
    }
  };

  const saveReport = async (approve = false) => {
    if (!patient || !reportText.trim()) return setError("Enter report content before saving.");
    try {
      const report = await request("/reports/manual", {
        method: "POST",
        body: JSON.stringify({
          patientId: patient.id,
          assessmentId: patient.assessments[0]?.id,
          kind: reportKind,
          title: `${reportKind.replaceAll("_", " ")} report`,
          content: reportText,
        }),
      });
      if (approve) await request(`/reports/${report.id}/approve`, { method: "POST" });
      setError(approve ? "Report approved by the authorised clinician." : "Report saved as an editable draft.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save report.");
    }
  };

  const addFollowUp = async (weeks: number) => {
    if (!patient) return;
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + weeks * 7);
    try {
      await request(`/clinician/patients/${patient.id}/follow-ups`, {
        method: "POST",
        body: JSON.stringify({ dueAt, title: `${weeks}-week clinical follow-up` }),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create follow-up task.");
    }
  };

  const sendDocumentRequest = async () => {
    if (!patient || !requestTitle.trim()) return;
    try {
      const result = await requestDocument({
        patientId: patient.id,
        title: requestTitle.trim(),
        category: "SUPPORTING_EVIDENCE",
        description: "Please upload this so the assessment can continue.",
      });
      setDocumentOutcome(result.nextAction);
      setRequestTitle("");
      await loadReviewQueue();
    } catch (cause) {
      setDocumentOutcome(cause instanceof Error ? cause.message : "Unable to request the document.");
    }
  };

  const decideDocumentRequest = async (requestId: string, decision: "ACCEPTED" | "REJECTED") => {
    try {
      const result = await reviewDocumentRequest(
        requestId,
        decision,
        decision === "REJECTED" ? "Please upload a clearer copy of this document." : undefined,
      );
      setDocumentOutcome(result.nextAction);
      await loadReviewQueue();
    } catch (cause) {
      setDocumentOutcome(cause instanceof Error ? cause.message : "Unable to review the document.");
    }
  };

  if (loading)
    return (
      <ClinicianShell active={section} onSelect={setSection}>
        <h1>My Clinic Today</h1>
        <p className="muted">Loading assigned patients…</p>
      </ClinicianShell>
    );

  if (error && !data)
    return (
      <ClinicianShell active={section} onSelect={setSection}>
        <h1>My Clinic Today</h1>
        <p className="muted">{error}</p>
        <button className="save" onClick={() => void load()}>
          Retry connection
        </button>
      </ClinicianShell>
    );

  return (
    <ClinicianShell active={section} onSelect={setSection}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Live clinician workspace</p>
          <h1>My Clinic Today</h1>
          <p className="muted">
            {data?.totalPatients ?? 0} assigned patients. This workspace shows only records returned for
            the signed-in clinician.
          </p>
        </div>
        <button className="save" onClick={() => void load()}>
          Refresh
        </button>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="worklist">
        <section className="queue">
          <p className="eyebrow">{today.length} scheduled</p>
          <h2>Today</h2>
          <div className="queue-items">
            {today.length ? (
              today.map(({ patient: p, appointment }) => (
                <button className="patient-row" key={appointment.id} onClick={() => void open(p.id)}>
                  <span className="avatar">
                    {p.user.firstName[0]}
                    {p.user.lastName[0]}
                  </span>
                  <span>
                    <b>{nameOf(p)}</b>
                    <small>
                      {new Date(appointment.startsAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {appointment.type.replaceAll("_", " ")} · {appointment.mode}
                    </small>
                  </span>
                  <span>→</span>
                </button>
              ))
            ) : (
              <p className="muted">No encounters scheduled today.</p>
            )}
          </div>
        </section>

        <section className="queue">
          <p className="eyebrow">Requires action</p>
          <h2>My attention</h2>
          <div className="queue-items">
            {attention.map((row) => (
              <div key={row.label} className="patient-row" style={{ cursor: "default" }}>
                <span className="avatar">{row.count}</span>
                <span>
                  <b>{row.label}</b>
                  <small>{row.count === 1 ? "1 patient" : `${row.count} patients`}</small>
                </span>
                <span />
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="worklist">
        <section className="queue">
          <p className="eyebrow">{reviewQueue?.length ?? 0} awaiting review</p>
          <h2>Questionnaire review</h2>
          {reviewError && <p className="error">{reviewError}</p>}
          {reviewOutcome && (
            <p className="muted" role="status">
              {reviewOutcome}
            </p>
          )}
          <div className="queue-items">
            {reviewQueue && reviewQueue.length > 0 ? (
              reviewQueue.map((item) => (
                <div key={item.id} className="patient-row" style={{ cursor: "default" }}>
                  <span className="avatar">
                    {item.patient.user.firstName[0]}
                    {item.patient.user.lastName[0]}
                  </span>
                  <span>
                    <b>
                      {item.patient.user.firstName} {item.patient.user.lastName}
                    </b>
                    <small>
                      {item.formDefinition.name} — {item.status === "UNDER_REVIEW" ? "review in progress" : "submitted"}
                    </small>
                  </span>
                  <span>
                    <button
                      className="save"
                      disabled={reviewBusy}
                      onClick={() => void completeReview(item.id)}
                    >
                      {item.status === "UNDER_REVIEW" ? "Mark reviewed" : "Start review"}
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No questionnaires are waiting for review.</p>
            )}
          </div>
        </section>

        <section className="queue">
          <p className="eyebrow">Caseload</p>
          <h2>My patients</h2>
          <div className="queue-items">
            {(data?.patients ?? []).length ? (
              (data?.patients ?? []).map((p) => (
                <button className="patient-row" key={p.id} onClick={() => void open(p.id)}>
                  <span className="avatar">
                    {p.user.firstName[0]}
                    {p.user.lastName[0]}
                  </span>
                  <span>
                    <b>{nameOf(p)}</b>
                    <small>{p.appointments[0]?.type?.replaceAll("_", " ") ?? "Open patient workspace"}</small>
                  </span>
                  <span>→</span>
                </button>
              ))
            ) : (
              <p className="muted">No assigned patients.</p>
            )}
          </div>
        </section>

        <section className="queue">
          <p className="eyebrow">Clinical work</p>
          <h2>In progress</h2>
          <div className="queue-items">
            {(data?.patients ?? []).filter((p) => p.assessments.length > 0).length ? (
              (data?.patients ?? [])
                .filter((p) => p.assessments.length > 0)
                .map((p) => (
                  <button className="patient-row" key={p.id} onClick={() => void open(p.id)}>
                    <span className="avatar">
                      {p.user.firstName[0]}
                      {p.user.lastName[0]}
                    </span>
                    <span>
                      <b>{nameOf(p)}</b>
                      <small>{p.assessments.map((a) => a.type.replaceAll("_", " ")).join(", ")}</small>
                    </span>
                    <span>→</span>
                  </button>
                ))
            ) : (
              <p className="muted">No assessments in progress.</p>
            )}
          </div>
        </section>
      </section>

      {patient && (
        <section className="workspace">
          <aside className="patient-summary">
            <p className="eyebrow">Patient context</p>
            <div className="patient-title">
              <span className="avatar large">
                {patient.user.firstName[0]}
                {patient.user.lastName[0]}
              </span>
              <div>
                <h2>{nameOf(patient)}</h2>
                <p className="muted">
                  {patient.appointments[0]
                    ? `Next: ${new Date(patient.appointments[0].startsAt).toLocaleDateString("en-GB")}`
                    : "No upcoming appointment"}
                </p>
              </div>
            </div>
            <div className="patient-tabs">
              {[
                "Overview",
                "Timeline",
                "Assessment",
                "ADHD",
                "ASD",
                "Physical Health",
                "Documents",
                "Messages",
                "Reports",
                "Prescriptions",
                "Billing",
                "Tasks",
              ].map((item) => (
                <button
                  key={item}
                  className={tab === item ? "selected" : ""}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>
          <div className="workspace-main">
            <p className="eyebrow">{tab}</p>
            <h2>{tab}</h2>
            {tab === "Overview" ? (
              <section className="follow-up">
                <h3>Video consultation</h3>
                <p className="muted">
                  The join link is requested for this clinician and opened only for a scheduled video
                  appointment.
                </p>
                <button className="save" onClick={() => void startVideo()}>
                  Join video consultation
                </button>
                {videoUrl && <p className="muted">Consultation link opened securely.</p>}
              </section>
            ) : tab === "Reports" ? (
              <section>
                <p className="muted">
                  AI drafting is deferred. Select a report structure and author an editable clinical
                  draft; an authorised clinician or admin can save and approve it.
                </p>
                <select value={reportKind} onChange={(event) => setReportKind(event.target.value)}>
                  <option value="ADHD_INITIAL">ADHD assessment</option>
                  <option value="AUTISM_ASSESSMENT">ASD assessment</option>
                  <option value="GP_LETTER">GP letter</option>
                  <option value="SHARED_CARE_LETTER">Shared Care letter</option>
                  <option value="SUPPORTING_EVIDENCE_LETTER">Custom clinical letter</option>
                </select>
                <textarea
                  value={reportText}
                  onChange={(event) => setReportText(event.target.value)}
                  placeholder="Write findings, diagnosis and recommendations. This draft stays editable until approval."
                />
                <div className="follow-up-actions">
                  <button className="save" onClick={() => void saveReport()}>
                    Save editable draft
                  </button>
                  <button onClick={() => void saveReport(true)}>Approve report</button>
                </div>
              </section>
            ) : tab === "Documents" ? (
              <section className="follow-up">
                <h3>Request supporting evidence</h3>
                <p className="muted">
                  Requests appear in the patient portal as an outstanding action and return here for
                  review once uploaded.
                </p>
                <div className="follow-up-actions">
                  <input
                    value={requestTitle}
                    onChange={(event) => setRequestTitle(event.target.value)}
                    placeholder="What do you need, e.g. School reports"
                    aria-label="Document request title"
                    style={{ flex: "1 1 260px", padding: "8px 10px", border: "1px solid #d7e3dc", borderRadius: 9 }}
                  />
                  <button className="save" onClick={() => void sendDocumentRequest()}>
                    Request document
                  </button>
                </div>
                {documentOutcome && <p className="muted">{documentOutcome}</p>}
                <div style={{ marginTop: 18 }}>
                  <h3>My document requests</h3>
                  {documentRequests.length ? (
                    <div className="queue-items" style={{ marginTop: 10 }}>
                      {documentRequests.map((item) => (
                        <div key={item.id} className="patient-row" style={{ cursor: "default" }}>
                          <span className="avatar">
                            {item.patient?.user.firstName?.[0] ?? "?"}
                            {item.patient?.user.lastName?.[0] ?? ""}
                          </span>
                          <span>
                            <b>{item.title}</b>
                            <small>
                              {item.patient?.user.firstName} {item.patient?.user.lastName} — {item.status.toLowerCase().replace("_", " ")}
                            </small>
                          </span>
                          <span>
                            {item.status === "SUBMITTED" ? (
                              <span className="follow-up-actions">
                                <button onClick={() => void decideDocumentRequest(item.id, "ACCEPTED")}>Accept</button>
                                <button onClick={() => void decideDocumentRequest(item.id, "REJECTED")}>Ask again</button>
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No document requests yet.</p>
                  )}
                </div>
              </section>
            ) : tab === "Messages" ? (
              <>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write a secure patient message"
                />
                <button className="save" onClick={() => void send()}>
                  Send message
                </button>
              </>
            ) : tab === "Tasks" ? (
              <div className="follow-up-actions">
                {[2, 4, 6].map((weeks) => (
                  <button key={weeks} onClick={() => void addFollowUp(weeks)}>
                    {weeks} weeks
                  </button>
                ))}
                <button onClick={() => void addFollowUp(12)}>3 months</button>
                <button onClick={() => void addFollowUp(24)}>6 months</button>
              </div>
            ) : (
              <textarea
                defaultValue={patient.assessments
                  .map((assessment) => `${assessment.type}: ${assessment.formulation ?? "No formulation recorded"}`)
                  .join("\n\n")}
                aria-label={`Editable ${tab} notes`}
              />
            )}
          </div>
          <aside className="copilot">
            <p className="eyebrow">Clinical controls</p>
            <h2>Governed workflows</h2>
            <p className="muted">
              ADHD, ASD and titration records are loaded from the patient record. Clinical changes are
              authorised and audited by the backend.
            </p>
            <p className="muted">
              AI assistance is intentionally deferred. All visible content is clinician-authored and
              editable.
            </p>
          </aside>
        </section>
      )}

      <section className="earnings">
        <div>
          <p className="eyebrow">My earnings</p>
          <h2>Paid income by source</h2>
          <p className="muted">Only the signed-in clinician’s recorded revenue events are included.</p>
        </div>
        <div className="revenue-list">
          {data?.earnings.length ? (
            data.earnings.map((item) => (
              <div className="patient-row" key={item.serviceLine}>
                <span>
                  {item.serviceLine}
                  <small>{item._count.id} payments</small>
                </span>
                <b>{money(item._sum.amountPence ?? 0)}</b>
              </div>
            ))
          ) : (
            <p className="muted">No recorded earnings.</p>
          )}
        </div>
      </section>
    </ClinicianShell>
  );
}
