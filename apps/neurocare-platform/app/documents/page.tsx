"use client";
import { useState } from "react";
import { uploadDocument } from "../../lib/document-api";

export default function DocumentsPage() {
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Uploading…");
    try {
      const res = await uploadDocument({ patientId, name, mimeType: "application/pdf", sizeBytes: 1024, type: "UPLOAD" });
      setStatus(`Uploaded: ${res.document?.name ?? "ok"}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Secure Documents</h1>
      <p className="text-slate-600">Upload and manage patient documents (server-validated, access-logged).</p>
      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-3 rounded bg-white p-4 shadow">
        <input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient ID" className="w-full rounded border px-3 py-2" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" className="w-full rounded border px-3 py-2" />
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white">Upload</button>
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </form>
    </main>
  );
}
