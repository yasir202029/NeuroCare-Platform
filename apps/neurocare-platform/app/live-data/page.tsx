"use client";
import { useLiveData } from "../../lib/use-live-data";

export default function LiveDataPage() {
  const { status, lastMessage } = useLiveData("demo");
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Live Data Stream</h1>
      <p className="text-slate-600">Real-time vitals, symptoms, and adherence (WebSocket).</p>
      <div className="mt-4 rounded bg-white p-4 shadow">
        <div className="text-sm">Status: <span className="font-semibold">{status}</span></div>
        <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2 text-xs">{JSON.stringify(lastMessage, null, 2)}</pre>
      </div>
    </main>
  );
}
