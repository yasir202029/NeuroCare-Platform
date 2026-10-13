import { Router } from 'express';
import { z } from 'zod';
import { PaymentStatus, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { audit } from '../../middleware/audit.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { BillingService } from '../../services/billing.service.js';

const router = Router();
const service = new BillingService();
router.use(requireAuth);
router.get('/invoices', asyncHandler(async (req, res) => { const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } }); const where = req.user!.roles.includes(Role.PATIENT) ? { patientId: patient?.id } : {}; res.json(await prisma.invoice.findMany({ where, include: { payments: true }, orderBy: { createdAt: 'desc' } })); }));
router.post('/invoices/:id/checkout', audit('PAYMENT_CHECKOUT_CREATED', 'Invoice'), asyncHandler(async (req, res) => { const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: String(req.params.id) }, include: { patient: { include: { user: true } } } }); res.json(await service.createCheckoutSession({ invoiceId: invoice.id, amountPence: invoice.totalPence, customerEmail: invoice.patient.user.email })); }));
router.post('/invoices/:id/refunds', requireRole(Role.ADMIN, Role.FINANCE), audit('REFUND_REQUESTED', 'Invoice'), asyncHandler(async (req, res) => { const body = z.object({ amountPence: z.number().int().positive().optional(), reason: z.string().max(500).optional() }).parse(req.body); res.status(201).json(await service.createRefund(String(req.params.id), body.amountPence, body.reason)); }));
router.post('/invoices/:id/payment-plan', requireRole(Role.ADMIN, Role.FINANCE), asyncHandler(async (req, res) => { const body = z.object({ installmentCount: z.number().int().min(2).max(12), intervalDays: z.number().int().min(7).max(90) }).parse(req.body); res.status(201).json(await service.createPaymentPlan({ invoiceId: String(req.params.id), ...body })); }));
router.get('/failed-payments', requireRole(Role.ADMIN, Role.FINANCE), asyncHandler(async (_req, res) => { res.json(await prisma.payment.findMany({ where: { status: PaymentStatus.FAILED }, include: { invoice: true }, orderBy: { createdAt: 'desc' } })); }));
router.post('/webhooks/stripe', asyncHandler(async (req, res) => { const body = z.object({ id: z.string().optional(), type: z.string(), data: z.object({ object: z.record(z.string(), z.unknown()).optional() }).optional() }).parse(req.body); res.json(await service.reconcileStripeEvent(body)); }));
export default router;
