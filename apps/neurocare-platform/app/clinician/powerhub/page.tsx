"use client";
import { useState } from "react";

const tabs = ["Overview", "Patients", "Assessments", "Notes", "Prescriptions", "Messages", "Timeline", "Finance", "Audit", "GDPR"];

const patients = [
  { id: "p1", name: "Alex Morgan", status: "Titration", risk: "Medium" },
  { id: "p2", name: "Sam Lee", status: "Assessment", risk: "High" },
  { id: "p3", name: "Jordan Taylor", status: "Prescribing", risk: "Low" },
];

export default function PowerhubPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedPatient, setSelectedPatient] = useState(patients[0].id);

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <header className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinician Powerhub Workstation</h1>
          <p className="text-sm text-slate-500">Advanced EHR-style clinical workspace — ADHD remote care (UK GDPR compliant)</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white">New Note</button>
          <button className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white">Prescribe</button>
          <button className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white">Escalate</button>
        </div>
      </header>

      <nav className="mb-4 flex flex-wrap gap-1 rounded-lg bg-white p-2 shadow">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`rounded px-3 py-1.5 text-sm ${activeTab === t ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <aside className="rounded-lg bg-white p-4 shadow lg:col-span-1">
          <h2 className="mb-2 font-semibold text-slate-800">Patient Worklist</h2>
          <ul className="space-y-2">
            {patients.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedPatient(p.id)}
                  className={`w-full rounded p-2 text-left text-sm ${selectedPatient === p.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                >
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.status} · Risk: {p.risk}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-lg bg-white p-4 shadow lg:col-span-3">
          <h2 className="mb-3 font-semibold text-slate-800">{activeTab}</h2>
          {activeTab === "Overview" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Open Tasks", value: "12" },
                { label: "Due Today", value: "4" },
                { label: "High Risk", value: "3" },
                { label: "Pending Reports", value: "7" },
              ].map((k) => (
                <div key={k.label} className="rounded border p-3">
                  <div className="text-xs text-slate-500">{k.label}</div>
                  <div className="text-2xl font-bold text-slate-900">{k.value}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "GDPR" && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>UK GDPR controls: SAR export, erasure, rectification, portability, consent, ROPA, breach log, retention, DPIA.</p>
              <div className="flex flex-wrap gap-2">
                <button className="rounded bg-slate-800 px-3 py-1.5 text-white">Export SAR</button>
                <button className="rounded bg-slate-800 px-3 py-1.5 text-white">Record Consent</button>
                <button className="rounded bg-slate-800 px-3 py-1.5 text-white">View ROPA</button>
                <button className="rounded bg-red-600 px-3 py-1.5 text-white">Erasure Request</button>
              </div>
            </div>
          )}
          {activeTab !== "Overview" && activeTab !== "GDPR" && (
            <p className="text-sm text-slate-500">Workspace for {activeTab} — patient {selectedPatient}.</p>
          )}
        </section>
      </div>
    </main>
  );
}
