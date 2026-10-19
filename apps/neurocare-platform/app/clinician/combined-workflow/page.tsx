export default function CombinedWorkflowPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Combined Assessment & Titration Workflow</h1>
      <p className="text-slate-600">One clinician can run assessment, diagnosis, and titration in a single workspace.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: "Assessment", desc: "Clinical interview, rating scales, risk stratification" },
          { title: "Diagnosis", desc: "ADHD/ASD formulation and differential" },
          { title: "Titration", desc: "Medication initiation, dose optimization, follow-up" },
        ].map((s) => (
          <div key={s.title} className="rounded-lg border bg-white p-5 shadow">
            <h2 className="text-lg font-semibold text-slate-800">{s.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
