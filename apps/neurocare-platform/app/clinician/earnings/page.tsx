export default function ClinicianEarningsPage() {
  const rows = [
    { period: "2026-09", sessions: 42, earned: "£3,360", due: "£0", status: "Paid" },
    { period: "2026-10", sessions: 18, earned: "£1,440", due: "£1,440", status: "Pending" },
  ];
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Clinician Earnings & Accounts</h1>
      <p className="text-slate-600">Sessions, earnings, amounts due, and account updates.</p>
      <table className="mt-6 w-full text-sm">
        <thead><tr className="bg-slate-200"><th className="p-2 text-left">Period</th><th className="p-2 text-left">Sessions</th><th className="p-2 text-left">Earned</th><th className="p-2 text-left">Due</th><th className="p-2 text-left">Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period} className="border-b bg-white">
              <td className="p-2">{r.period}</td><td className="p-2">{r.sessions}</td><td className="p-2">{r.earned}</td><td className="p-2">{r.due}</td><td className="p-2">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
