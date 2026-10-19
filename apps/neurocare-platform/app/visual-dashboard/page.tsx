const bars = [
  { label: "Assessments", value: 72 },
  { label: "Titration", value: 58 },
  { label: "Prescribing", value: 44 },
  { label: "Shared Care", value: 31 },
  { label: "Discharge", value: 19 },
];

export default function VisualDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Visual Analytics Dashboard</h1>
      <p className="text-gray-600">ADHD clinic pathway throughput.</p>
      <div className="mt-6 space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{b.label}</span>
              <span>{b.value}%</span>
            </div>
            <div className="h-3 w-full rounded bg-gray-200">
              <div className="h-3 rounded bg-indigo-500" style={{ width: `${b.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
