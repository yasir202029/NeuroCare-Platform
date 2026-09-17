import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";
const router: IRouter = Router();
router.post("/admin/clinicians", requirePermission("user:manage"), (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email) || body.role !== "CLINICIAN") return res.status(400).json({ error: "A clinician email and CLINICIAN role are required." });
  auditEvent(req, res, "clinician.provision.request", "clinician");
  return res.status(503).json({ error: "Clinician provisioning is unavailable until the Supabase admin integration and tenant repository are configured.", code: "IDENTITY_PROVISIONING_UNAVAILABLE" });
});
router.get("/auth/portal", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Authentication is required." });
  const urls = { patient: process.env.NEXT_PUBLIC_PATIENT_PORTAL_URL, clinician: process.env.NEXT_PUBLIC_CLINICIAN_PORTAL_URL, admin: process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL, system: process.env.NEXT_PUBLIC_SYSTEM_PORTAL_URL };
  const destination = req.user.role === "PATIENT" ? urls.patient : req.user.role === "CLINICIAN" ? urls.clinician : req.user.role === "SUPER_ADMIN" ? urls.system : urls.admin;
  if (!destination) return res.status(503).json({ error: "Portal destinations are not configured.", code: "PORTAL_ROUTING_UNAVAILABLE" });
  auditEvent(req, res, "auth.portal_route.read", "session");
  return res.json({ destination });
});
router.post("/auth/request-link", (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email) || typeof body.portal !== "string" || !["patient", "clinician"].includes(body.portal)) return res.status(400).json({ error: "A valid email and portal are required." });
  const baseUrl = body.portal === "patient" ? process.env.NEXT_PUBLIC_PATIENT_PORTAL_URL : process.env.NEXT_PUBLIC_CLINICIAN_PORTAL_URL;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !baseUrl) return res.status(503).json({ error: "Secure sign-in is unavailable until Supabase and the portal URL are configured.", code: "AUTH_UNAVAILABLE" });
  return res.status(501).json({ error: "Magic-link delivery must be implemented through the configured Supabase admin integration.", code: "AUTH_DELIVERY_NOT_IMPLEMENTED" });
});
export default router;
