const API = "/api/v1";

export type ClinicianDocumentRequest = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  dueAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  patient?: { id: string; user: { firstName: string; lastName: string } };
  document?: { id: string; name: string; mimeType: string } | null;
};

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem("neurocare.accessToken") ?? ""}` };
}

/** The requesting clinician's own document requests. */
export async function getMyDocumentRequests(): Promise<{ requests: ClinicianDocumentRequest[] }> {
  const res = await fetch(`${API}/documents/requests/mine`, { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Sign in to access clinical document work.");
    if (res.status === 403) throw new Error("Your account is not authorised for document requests.");
    throw new Error("Unable to load document requests.");
  }
  return res.json();
}

/** Request supporting evidence from a patient. */
export async function requestDocument(input: {
  patientId: string;
  title: string;
  description?: string;
  category: string;
}): Promise<{ request: ClinicianDocumentRequest; nextOwner: string; nextAction: string }> {
  const res = await fetch(`${API}/documents/requests`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Unable to request the document." }));
    throw new Error(body?.error?.message ?? body?.message ?? "Unable to request the document.");
  }
  return res.json();
}

/** Accept or reject an uploaded document. */
export async function reviewDocumentRequest(
  requestId: string,
  decision: "ACCEPTED" | "REJECTED",
  notes?: string,
): Promise<{ request: ClinicianDocumentRequest; nextOwner: string; nextAction: string }> {
  const res = await fetch(`${API}/documents/requests/${requestId}/review`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ decision, notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Unable to review the document." }));
    throw new Error(body?.error?.message ?? body?.message ?? "Unable to review the document.");
  }
  return res.json();
}
