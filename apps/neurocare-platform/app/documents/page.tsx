"use client";

import { useCallback, useEffect, useState } from "react";
import { PatientShell } from "../../components/patient-shell";
import {
  fulfilDocumentRequest,
  getDocumentRequests,
  type DocumentRequest,
} from "../../lib/document-request-api";

const statusCopy: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Needed from you", tone: "bg-amber-100 text-amber-900" },
  SUBMITTED: { label: "With your clinician", tone: "bg-indigo-100 text-indigo-800" },
  ACCEPTED: { label: "Accepted", tone: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Something different needed", tone: "bg-red-100 text-red-800" },
  CANCELLED: { label: "No longer needed", tone: "bg-slate-100 text-slate-600" },
};

export default function DocumentsPage() {
  const [requests, setRequests] = useState<DocumentRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocumentRequests();
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your document requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (request: DocumentRequest) => {
    setBusyId(request.id);
    setRowError(null);
    try {
      const result = await fulfilDocumentRequest(request.id, {
        name: `${request.category || "document"}-${request.id.slice(-6)}`,
        mimeType: "application/pdf",
        sizeBytes: 1024,
        type: "ATTACHMENT",
      });
      setOutcome(result.nextAction);
      await load();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "We could not upload that document.");
    } finally {
      setBusyId(null);
    }
  };

  const outstanding = (requests ?? []).filter((r) => r.status === "PENDING" || r.status === "REJECTED");
  const closed = (requests ?? []).filter((r) => r.status !== "PENDING" && r.status !== "REJECTED");

  return (
    <PatientShell>
      <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
      <p className="mt-1 text-slate-600">
        Upload anything your clinician has asked for, and see what they have already accepted.
      </p>

      {loading && <p className="mt-4 text-slate-600">Loading your document requests…</p>}

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {outcome && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {outcome}
        </p>
      )}
      {rowError && (
        <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {rowError}
        </p>
      )}

      {!loading && !error && requests && requests.length === 0 && (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          You have no document requests at the moment. If your clinician needs something, it will
          appear here.
        </p>
      )}

      {outstanding.length > 0 && (
        <section aria-labelledby="needed-heading" className="mt-6">
          <h2 id="needed-heading" className="text-lg font-semibold text-slate-900">
            Needed from you
          </h2>
          <ul className="mt-3 space-y-3">
            {outstanding.map((request) => {
              const copy = statusCopy[request.status] ?? statusCopy.PENDING;
              return (
                <li key={request.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{request.title}</h3>
                      {request.description && (
                        <p className="mt-1 text-sm text-slate-600">{request.description}</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        <span className={`mr-2 inline-block rounded-full px-2 py-0.5 font-semibold ${copy.tone}`}>
                          {copy.label}
                        </span>
                        {request.requestedBy && (
                          <span>Requested by {request.requestedBy.firstName} {request.requestedBy.lastName}</span>
                        )}
                      </p>
                      {request.status === "REJECTED" && request.reviewNotes && (
                        <p className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
                          {request.reviewNotes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void upload(request)}
                      disabled={busyId === request.id}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busyId === request.id ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {closed.length > 0 && (
        <section aria-labelledby="closed-heading" className="mt-8">
          <h2 id="closed-heading" className="text-lg font-semibold text-slate-900">
            Already sent
          </h2>
          <ul className="mt-3 space-y-2">
            {closed.map((request) => {
              const copy = statusCopy[request.status] ?? statusCopy.SUBMITTED;
              return (
                <li key={request.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="font-medium text-slate-900">{request.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className={`mr-2 inline-block rounded-full px-2 py-0.5 font-semibold ${copy.tone}`}>
                      {copy.label}
                    </span>
                    {request.document?.name}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </PatientShell>
  );
}
