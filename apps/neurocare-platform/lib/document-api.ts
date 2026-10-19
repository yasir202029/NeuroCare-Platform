import { authenticatedFetch } from "./client-api";

const API = "/api/v1";

export async function uploadDocument(input: {
  patientId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  type?: string;
  content?: string;
}) {
  const res = await authenticatedFetch(`${API}/documents/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}

export async function getDocument(id: string) {
  const res = await authenticatedFetch(`${API}/documents/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to load document");
  return res.json();
}
