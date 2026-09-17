"use client";
import { FormEvent, useState } from "react";

type RequestKind = "Medication refill" | "Follow-up appointment" | "Medication review";
const consentOptions = ["Consultation recording", "AI-assisted clinical documentation"] as const;
export default function Page() {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [request, setRequest] = useState<RequestKind>("Medication refill");
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent) { event.preventDefault(); setSubmitted(true); }
  return <main><header><p className="eyebrow">NeuroAssess · Patient</p><h1>Your care space</h1><p>Manage your choices and care requests. Clinical records appear only after secure sign-in and verified clinic access.</p></header><section className="hero"><p className="eyebrow">Consent centre</p><h2>You decide before we record or use AI.</h2><p>Both options are off by default. A signed, versioned decision is required before either service can be used. You may withdraw consent at any time.</p>{consentOptions.map((option) => <label className="toggle" key={option}><span><strong>{option}</strong><small>Requires verified account and patient record</small></span><input aria-label={option} type="checkbox" checked={Boolean(consents[option])} onChange={(event) => setConsents({ ...consents, [option]: event.target.checked })} /></label>)}</section><section><p className="eyebrow">Care requests</p><h2>Get the right review, without a phone queue.</h2><form onSubmit={submit}><label>Request type<select value={request} onChange={(event) => setRequest(event.target.value as RequestKind)}>{["Medication refill", "Follow-up appointment", "Medication review"].map((kind) => <option key={kind}>{kind}</option>)}</select></label><label>What would you like your care team to know?<textarea required maxLength={2000} placeholder="Add the information your clinician needs to review this request." /></label><button type="submit">Send secure request</button></form>{submitted && <p className="notice">Your request is ready to be submitted once your secure patient record is connected. Nothing has been sent or stored in this preview.</p>}</section><footer>No clinical data is displayed, stored, recorded, or sent to an AI provider from this interface until server-side consent and access checks succeed.</footer></main>;
}
