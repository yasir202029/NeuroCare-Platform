import { Router, type IRouter } from "express";
import { requirePermission } from "../security/auth";

const router: IRouter = Router();
const unavailable = (_req: unknown, res: { status: (status: number) => { json: (body: object) => unknown } }) => res.status(503).json({ error: "Clinical records are unavailable until tenant-scoped storage is connected.", code: "CLINICAL_STORAGE_UNAVAILABLE" });
router.get("/platform/summary", requirePermission("patient:read"), unavailable);
router.get("/appointments", requirePermission("appointment:manage"), unavailable);
router.post("/appointments", requirePermission("appointment:manage"), unavailable);
router.get("/patients", requirePermission("patient:read"), unavailable);
router.get("/assessments", requirePermission("assessment:read"), unavailable);
router.post("/assessments", requirePermission("assessment:write"), unavailable);
router.get("/reports", requirePermission("document:read"), unavailable);
router.get("/messages", requirePermission("message:write"), unavailable);
router.post("/messages", requirePermission("message:write"), unavailable);
router.get("/documents", requirePermission("document:read"), unavailable);
router.get("/payments", requirePermission("billing:read"), unavailable);
export default router;
