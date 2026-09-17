import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";

const router: IRouter = Router();
const dateTime = (value: unknown) => typeof value === "string" && !Number.isNaN(Date.parse(value));

router.get("/clinician/appointments", requirePermission("appointment:manage"), (req, res) => {
  auditEvent(req, res, "clinician.appointments.read", "appointment");
  return res.status(503).json({ error: "Assigned appointments are unavailable until tenant-scoped storage and clinician assignment checks are connected.", code: "CLINICAL_STORAGE_UNAVAILABLE" });
});

router.post("/clinician/availability", requirePermission("appointment:manage"), (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!dateTime(body.startsAt) || !dateTime(body.endsAt) || Date.parse(body.endsAt as string) <= Date.parse(body.startsAt as string)) return res.status(400).json({ error: "Provide a valid availability start and end time." });
  auditEvent(req, res, "clinician.availability.create.request", "availability");
  return res.status(503).json({ error: "Clinician scheduling is unavailable until tenant-scoped storage is connected.", code: "CLINICAL_STORAGE_UNAVAILABLE", requestId: randomUUID() });
});

router.get("/clinician/earnings", requirePermission("billing:read"), (req, res) => {
  auditEvent(req, res, "clinician.earnings.read", "earnings");
  return res.status(503).json({ error: "Clinician earnings are unavailable until billing records and authorised payout reporting are connected.", code: "BILLING_UNAVAILABLE" });
});
export default router;
