import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";
const router: IRouter = Router();
const roles = new Set(["ADMIN", "CLINICIAN", "FINANCE", "RECEPTIONIST", "SUPPORT_AGENT"]);
router.post("/admin/clinicians", requirePermission("user:manage"), (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email) || body.role !== "CLINICIAN") return res.status(400).json({ error: "A clinician email and CLINICIAN role are required." });
  auditEvent(req, res, "clinician.provision.request", "clinician");
  return res.status(503).json({ error: "Clinician provisioning is unavailable until the Supabase admin integration and tenant repository are configured.", code: "IDENTITY_PROVISIONING_UNAVAILABLE" });
});
router.post("/auth/request-link", (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email) || typeof body.portal !== "string" || !["patient", "clinician"].includes(body.portal)) return res.status(400).json({ error: "A valid email and portal are required." });
  return res.status(503).json({ error: "Secure sign-in is unavailable until Supabase authentication is configured.", code: "AUTH_UNAVAILABLE" });
});
export default router;
