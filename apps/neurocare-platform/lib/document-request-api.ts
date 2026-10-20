import { authenticatedFetch } from "./client-api";

const API = "/api/v1";

export type DocumentRequestStatus = "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export type DocumentRequest = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: DocumentRequestStatus;
  dueAt: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  document?: { id: string; name: string; mimeType: string; sizeBytes?: number } | null;
  requestedBy?: { firstName: string; lastName: string };
};

/** The patient's own document requests. */
export async function getDocumentRequests(): Promise<{ requests: DocumentRequest[] }> {
  const res = await authenticatedFetch(`${API}/documents/requests`);
  if (!res.ok) throw new Error("Failed to load your document requests");
  return res.json();
}

/** Upload a document against an outstanding request. */
export async function fulfilDocumentRequest(
  requestId: string,
  input: { name: string; mimeType: string; sizeBytes: number; type?: string; content?: string },
): Promise<{ request: DocumentRequest; documentId: string; nextOwner: string; nextAction: string }> {
  const res = await authenticatedFetch(`${API}/documents/requests/${requestId}/fulfil`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to upload the document" }));
    throw new Error(err.message ?? "Failed to upload the document");
  }
  return res.json();
}
