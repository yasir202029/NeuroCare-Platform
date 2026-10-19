import { Suspense } from "react";

const panels = [
  { title: "Patient Context", value: "Active patient loaded", color: "bg-blue-50" },
  { title: "Risk Stratification", value: "NICE-aligned", color: "bg-red-50" },
  { title: "Workflow Engine", value: "Transitions live", color: "bg-green-50" },
  { title: "Audit Trail", value: "GDPR compliant", color: "bg-purple-50" },
  { title: "Telehealth", value: "Remote sessions", color: "bg-amber-50" },
  { title: "SaaS Billing", value: "Plans active", color: "bg-teal-50" },
];

export default function PowerhubPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clinician Powerhub Workstation</h1>
        <p className="text-gray-600">Advanced EHR-style clinical workspace for ADHD remote care.</p>
      </header>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {panels.map((p) => (
          <div key={p.title} className={`rounded-xl border p-5 shadow-sm ${p.color}`}>
            <h2 className="text-lg font-semibold text-gray-800">{p.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{p.value}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Patient Record Tabs</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Overview", "Appointments", "Assessments", "Uploads", "Reports", "Prescriptions", "Messages", "Timeline", "Finance", "Audit"].map((t) => (
            <span key={t} className="rounded-full border px-3 py-1 text-sm text-gray-700">{t}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
