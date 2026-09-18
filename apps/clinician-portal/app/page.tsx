"use client";

import { useMemo, useState } from "react";

type Tab = "Overview" | "Timeline" | "Assessment" | "ADHD" | "ASD" | "Physical Health" | "Documents" | "Messages" | "Reports" | "Prescriptions" | "Billing" | "Tasks";
type Patient = { id: string; name: string; initials: string; status: string; appointment: string; concern: string; note: string; followUp?: string };
type Queue = { title: string; detail: string; patientIds: string[] };

const tabs: Tab[] = ["Overview", "Timeline", "Assessment", "ADHD", "ASD", "Physical Health", "Documents", "Messages", "Reports", "Prescriptions", "Billing", "Tasks"];
const patients: Patient[] = [
  { id: "maya", name: "Maya Thompson", initials: "MT", status: "In consultation", appointment: "09:00 · ADHD assessment", concern: "Assessment notes ready to complete", note: "History and functional impact discussed. Clinician review pending." },
  { id: "sam", name: "Samir Patel", initials: "SP", status: "Waiting", appointment: "10:30 · Follow-up", concern: "Waiting for consultation", note: "Medication response and sleep to review." },
  { id: "elena", name: "Elena Rossi", initials: "ER", status: "Titration", appointment: "12:15 · Medication review", concern: "Dose review due today", note: "Side-effect check and blood-pressure result required." },
  { id: "jordan", name: "Jordan Lee", initials: "JL", status: "Report review", appointment: "14:00 · ASD assessment", concern: "ASD report awaiting sign-off", note: "Draft report prepared; evidence mapping needs clinician review." },
];
const queues: Queue[] = [
  { title: "Today's Appointments", detail: "Consultations and planned reviews", patientIds: ["maya", "sam", "elena", "jordan"] },
  { title: "Waiting Patients", detail: "Ready to be seen", patientIds: ["sam"] },
  { title: "Active Titrations", detail: "Medication monitoring due", patientIds: ["elena"] },
  { title: "Pending Reports", detail: "Drafts needing clinical sign-off", patientIds: ["jordan"] },
  { title: "Pending Prescriptions", detail: "Review and signature required", patientIds: ["elena"] },
  { title: "Messages", detail: "Unread patient conversations", patientIds: ["maya", "sam"] },
  { title: "Urgent Reviews", detail: "Prioritised clinical actions", patientIds: ["elena"] },
  { title: "Upcoming Follow-ups", detail: "Care plan checkpoints", patientIds: ["sam", "jordan"] },
];
const revenue = [
  ["ADHD Assessments", 2, 1100], ["ASD Assessments", 1, 750], ["Follow-ups", 4, 480], ["Medication Reviews", 3, 270], ["Reports Completed", 2, 220],
] as const;
const formatMoney = (amount: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount);

export default function Page() {
  const [selectedId, setSelectedId] = useState("maya");
  const [tab, setTab] = useState<Tab>("Overview");
  const [notes, setNotes] = useState<Record<string, string>>(() => Object.fromEntries(patients.map((patient) => [patient.id, patient.note])));
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");
  const patient = patients.find((item) => item.id === selectedId) ?? patients[0];
  const ownEarnings = useMemo(() => revenue.reduce((sum, [, , amount]) => sum + amount, 0), []);
  const openPatient = (id: string, target: Tab = "Overview") => { setSelectedId(id); setTab(target); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const generate = (action: string) => {
    const source = notes[patient.id].trim() || "Add clinical notes before generating a draft.";
    const output = action === "Shorten text" ? source.split(".").slice(0, 2).join(".") + "." : action === "Expand text" ? `${source}\n\nClinical considerations: confirm factual accuracy, patient preferences, risks and agreed next actions.` : `${action} draft\n\n${source}\n\nClinician review required before this draft is saved, signed or shared.`;
    setDraft(output);
  };
  const scheduleFollowUp = (interval: string) => { setFollowUps((current) => ({ ...current, [patient.id]: interval })); setToast(`${interval} follow-up created: appointment task, reminder and patient status updated.`); };

  return <main className="clinic-shell">
    <aside className="clinic-nav"><div className="brand"><span>n</span><div><b>NeuroAssess</b><small>Clinician Station</small></div></div><nav><button className="active">My Clinic Today</button><button onClick={() => setTab("Messages")}>Messages</button><button onClick={() => setTab("Reports")}>Reports</button><button onClick={() => setTab("Prescriptions")}>Prescriptions</button><button onClick={() => setTab("Billing")}>My Earnings</button></nav><p className="nav-note">Patient-centred workspace. Clinical decisions remain with the authorised clinician.</p></aside>
    <section className="clinic-content">
      <header className="topbar"><div><p className="eyebrow">Thursday, 17 September</p><h1>My Clinic Today</h1><p className="muted">Open a patient to continue their care. Every queue leads to the patient workspace.</p></div><div className="profile">DR</div></header>
      <section className="worklist" aria-label="My Clinic Today worklist">{queues.map((queue) => <article key={queue.title} className="queue"><div className="queue-heading"><div><p className="eyebrow">{queue.patientIds.length} patient{queue.patientIds.length === 1 ? "" : "s"}</p><h2>{queue.title}</h2><p className="muted">{queue.detail}</p></div></div><div className="queue-items">{queue.patientIds.map((id) => { const item = patients.find((candidate) => candidate.id === id)!; return <button key={`${queue.title}-${id}`} onClick={() => openPatient(id)} className="patient-row"><span className="avatar">{item.initials}</span><span><b>{item.name}</b><small>{item.appointment}</small></span><span className="row-status">{item.status}</span><span aria-hidden>→</span></button>; })}</div></article>)}</section>
      <section className="workspace" aria-label="Patient workspace"><aside className="patient-summary"><button className="back" onClick={() => document.querySelector(".worklist")?.scrollIntoView({ behavior: "smooth" })}>← My Clinic Today</button><div className="patient-title"><span className="avatar large">{patient.initials}</span><div><p className="eyebrow">Patient workspace</p><h2>{patient.name}</h2><p className="muted">{followUps[patient.id] ? `Follow-up: ${followUps[patient.id]}` : patient.status}</p></div></div><div className="patient-tabs">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? "selected" : ""}>{item}</button>)}</div></aside>
        <div className="workspace-main"><div className="workspace-header"><div><p className="eyebrow">{tab}</p><h2>{tab === "Overview" ? "Care in progress" : `${tab} editor`}</h2></div><button className="save" onClick={() => setToast(`${tab} saved for ${patient.name}.`)}>Save changes</button></div>
          {tab === "Overview" && <><div className="editable-grid"><label>Patient status<select defaultValue={patient.status}><option>In consultation</option><option>Waiting</option><option>Titration</option><option>Report review</option><option>Follow-up due</option></select></label><label>Next appointment<input defaultValue={patient.appointment} /></label><label className="wide">Clinical focus<textarea defaultValue={patient.concern} /></label></div><section className="follow-up"><div><p className="eyebrow">Follow-up engine</p><h3>Schedule the next safe action</h3><p className="muted">Creates an appointment task and reminder, then updates the patient status.</p></div><div className="follow-up-actions">{["2 weeks", "4 weeks", "6 weeks", "3 months", "6 months"].map((interval) => <button key={interval} onClick={() => scheduleFollowUp(interval)}>{interval}</button>)}<label><span className="sr-only">Custom interval</span><input placeholder="Custom" onKeyDown={(event) => { if (event.key === "Enter" && event.currentTarget.value) scheduleFollowUp(event.currentTarget.value); }} /></label></div></section></>}
          {tab === "Timeline" && <textarea className="full-editor" value={notes[patient.id]} onChange={(event) => setNotes({ ...notes, [patient.id]: event.target.value })} aria-label="Editable clinical timeline" />}
          {["Assessment", "ADHD", "ASD", "Physical Health", "Documents", "Messages", "Reports", "Prescriptions", "Billing", "Tasks"].includes(tab) && <section className="tab-editor"><p className="muted">Edit {tab.toLowerCase()} information for {patient.name}. Changes remain in the clinician workspace until saved.</p><textarea className="full-editor" defaultValue={`${tab} notes for ${patient.name}.`} aria-label={`${tab} notes`} /><button className="add-line" onClick={() => setToast(`New ${tab.toLowerCase()} entry added for ${patient.name}.`)}>Add entry</button></section>}
        </div>
        <aside className="copilot"><p className="eyebrow">AI Copilot</p><h2>Draft with clinician control</h2><p className="muted">Output is editable and requires clinician review before use.</p><div className="copilot-actions">{["Listen to consultation", "Generate notes", "Generate ADHD report", "Generate ASD report", "Generate GP letter", "Generate Shared Care letter", "Rewrite text", "Shorten text", "Expand text", "Improve wording"].map((action) => <button key={action} onClick={() => generate(action)}>{action}</button>)}</div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="AI drafts appear here. Edit before saving." aria-label="Editable AI draft" /><button className="save full" onClick={() => { setNotes({ ...notes, [patient.id]: draft }); setToast("AI draft copied into the editable patient timeline."); }}>Use in timeline</button></aside>
      </section>
      <section className="earnings"><div><p className="eyebrow">Clinician earnings</p><h2>My earnings only</h2><p className="muted">Personal activity and payments; no team-wide earnings are shown.</p></div><div className="earnings-total"><span>Monthly earnings</span><strong>{formatMoney(ownEarnings)}</strong></div><div className="earnings-metrics"><div><span>Daily</span><b>{formatMoney(620)}</b></div><div><span>Weekly</span><b>{formatMoney(1540)}</b></div><div><span>Outstanding payments</span><b>{formatMoney(320)}</b></div></div><div className="revenue-list">{revenue.map(([label, count, amount]) => <button key={label} onClick={() => setToast(`${label}: ${count} completed, ${formatMoney(amount)} recorded.`)}><span>{label}<small>{count} completed</small></span><b>{formatMoney(amount)}</b><span>→</span></button>)}</div></section>
      {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast("")}>Dismiss</button></div>}
    </section>
  </main>;
}
