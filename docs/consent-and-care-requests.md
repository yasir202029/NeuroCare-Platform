# Patient consent and care requests

Recording and AI clinical assistance are disabled by default. A patient must provide an explicit, versioned consent decision before either workflow begins. The current decision and timestamp are visible to authorised clinicians. Withdrawal creates a new audit-preserving consent record and blocks future use.

Patients can request a medication refill, follow-up, or medication review. Every request is tenant-scoped, has a review status, and stores its last clinical review timestamp.

Apply `0001`, `0002`, then `0003` from a database-connected environment before enabling these flows. Do not deploy an endpoint that records audio or sends clinical content to an AI provider until it verifies current consent server-side for that patient and writes an audit event.
