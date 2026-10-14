import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";
const router: IRouter = Router();
const hex = /^#[0-9a-fA-F]{6}$/;
router.patch("/clinics/:clinicId/branding", requirePermission("clinic:manage"), (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof req.params.clinicId !== "string" || !req.params.clinicId || typeof body.name !== "string" || body.name.trim().length < 2 || body.name.length > 120 || typeof body.segment !== "string" || body.segment.trim().length < 2 || body.segment.length > 80 || typeof body.primaryColor !== "string" || !hex.test(body.primaryColor) || typeof body.accentColor !== "string" || !hex.test(body.accentColor)) return res.status(400).json({ error: "Name, segment, and 6-digit primary/accent colours are required." });
  auditEvent(req, res, "clinic.branding.update.request", "clinic", req.params.clinicId);
  return res.status(503).json({ error: "Clinic branding is unavailable until tenant-scoped storage is connected.", code: "CLINICAL_STORAGE_UNAVAILABLE" });
});
export default router;
