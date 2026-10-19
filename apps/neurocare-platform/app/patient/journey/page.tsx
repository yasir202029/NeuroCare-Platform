const stages = [
  { name: "Referral & Intake", status: "done", desc: "GP referral received, demographics captured" },
  { name: "Initial Assessment", status: "done", desc: "Clinical interview, rating scales, risk stratification" },
  { name: "Diagnosis", status: "active", desc: "ADHD/ASD diagnostic formulation" },
  { name: "Titration", status: "pending", desc: "Medication initiation and dose optimization" },
  { name: "Prescribing", status: "pending", desc: "Prescription issue and courier dispatch" },
  { name: "Shared Care", status: "pending", desc: "GP shared care agreement" },
  { name: "Discharge", status: "pending", desc: "Outcome review and discharge planning" },
];

export default function PatientJourneyPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Patient Journey — ADHD Remote Clinic</h1>
      <p className="text-slate-600">End-to-end pathway from referral to discharge (NICE-aligned).</p>
      <ol className="mt-6 space-y-3">
        {stages.map((s, i) => (
          <li key={s.name} className={`rounded-lg border p-4 ${s.status === "done" ? "bg-emerald-50" : s.status === "active" ? "bg-indigo-50" : "bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold">{i + 1}</span>
              <div>
                <div className="font-semibold text-slate-800">{s.name}</div>
                <div className="text-sm text-slate-500">{s.desc}</div>
              </div>
              <span className={`ml-auto rounded px-2 py-0.5 text-xs ${s.status === "done" ? "bg-emerald-200 text-emerald-800" : s.status === "active" ? "bg-indigo-200 text-indigo-800" : "bg-slate-200 text-slate-600"}`}>{s.status}</span>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
