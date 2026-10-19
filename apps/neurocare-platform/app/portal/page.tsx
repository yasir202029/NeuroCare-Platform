const portals = [
  { name: "Patient", href: "/patient", desc: "Intake, journey, appointments, documents, reports" },
  { name: "Clinician", href: "/clinician", desc: "Powerhub EHR, assessment, titration, prescribing" },
  { name: "Prescriber", href: "/prescriber", desc: "Prescription approval, courier, shared care" },
  { name: "Titration", href: "/titration", desc: "Titration plans, reviews, escalation" },
  { name: "Admin", href: "/admin", desc: "Users, patients, workflows, audit, GDPR" },
  { name: "Finance", href: "/finance", desc: "Invoices, reconciliation, earnings" },
  { name: "Engine", href: "/engine", desc: "Workflow engine, rules, tasks, events" },
];

export default function PortalHubPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Portal Hub — Remote ADHD/ASD Clinic</h1>
      <p className="text-slate-600">Select a portal to enter your workspace.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portals.map((p) => (
          <a key={p.name} href={p.href} className="rounded-lg border bg-white p-5 shadow transition hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-800">{p.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
