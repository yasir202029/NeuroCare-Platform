"use client";
import { useState } from "react";
import { authenticatedFetch } from "../../../lib/client-api";

export default function AiAssistantPage() {
  const [patientId, setPatientId] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function call(path: string, body?: unknown) {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/v1/clinical-ai${path}`, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">AI Clinical Assistant</h1>
      <p className="text-slate-600">Draft reports, validate prescriptions (CD/non-CD), summarise notes, pathway guidance.</p>
      <div className="mt-4 flex gap-2">
        <input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient ID" className="rounded border px-3 py-2" />
        <button onClick={() => call(`/pathway/${patientId}`)} className="rounded bg-indigo-600 px-3 py-2 text-white" disabled={loading}>Pathway</button>
        <button onClick={() => call("/draft-report", { patientId, sections: ["summary", "clinical", "recommendations"] })} className="rounded bg-emerald-600 px-3 py-2 text-white" disabled={loading}>Draft Report</button>
      </div>
      <pre className="mt-4 overflow-auto rounded bg-white p-4 text-xs shadow">{JSON.stringify(result, null, 2)}</pre>
    </main>
  );
}
