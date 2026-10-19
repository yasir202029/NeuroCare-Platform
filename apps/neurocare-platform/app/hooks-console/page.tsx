export default function HooksConsolePage() {
  const hooks = ["RISK_SCORE_CALCULATED", "MEDICATION_PRESCRIBED", "SAFETY_ALERT_TRIGGERED", "GP_COMMUNICATION_SENT"];
  const rails = [
    { event: "RISK_SCORE_CALCULATED", action: "BLOCK", scope: "GLOBAL" },
    { event: "MEDICATION_PRESCRIBED", action: "WARN", scope: "GLOBAL" },
    { event: "SAFETY_ALERT_TRIGGERED", action: "LOG", scope: "GLOBAL" },
    { event: "GP_COMMUNICATION_SENT", action: "REQUIRE_APPROVAL", scope: "GLOBAL" },
  ];
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Extension Hooks & Rails Console</h1>
      <p className="text-slate-600">Plugin-style extension points for the ADHD remote care platform.</p>
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Registered Hooks</h2>
        <ul className="mt-2 space-y-1">
          {hooks.map((h) => <li key={h} className="rounded bg-white p-2 text-sm shadow">{h}</li>)}
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Active Rails</h2>
        <table className="mt-2 w-full text-sm">
          <thead><tr className="bg-slate-200"><th className="p-2 text-left">Event</th><th className="p-2 text-left">Action</th><th className="p-2 text-left">Scope</th></tr></thead>
          <tbody>
            {rails.map((r) => (
              <tr key={r.event} className="border-b bg-white">
                <td className="p-2">{r.event}</td>
                <td className="p-2">{r.action}</td>
                <td className="p-2">{r.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
