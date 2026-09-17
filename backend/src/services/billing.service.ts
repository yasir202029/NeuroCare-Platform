import Stripe from 'stripe';
import { config } from '../shared/config.js';
import { prisma } from '../shared/db.js';
import { InvoiceStatus, PaymentPlanStatus, PaymentStatus, RefundStatus } from '@prisma/client';
import { badRequest, notFound } from '../shared/errors.js';

export class BillingService {
  private client = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;
  async createCheckoutSession(input: { invoiceId: string; amountPence: number; customerEmail: string }) {
    if (!this.client) return { provider: 'stripe', configured: false, checkoutUrl: null };
    const session = await this.client.checkout.sessions.create({ mode: 'payment', customer_email: input.customerEmail, line_items: [{ quantity: 1, price_data: { currency: 'gbp', unit_amount: input.amountPence, product_data: { name: `NeuroCare invoice ${input.invoiceId}` } } }], metadata: { invoiceId: input.invoiceId }, success_url: 'https://neuroassess.co.uk/payment/success', cancel_url: 'https://neuroassess.co.uk/payment/cancel' });
    return { provider: 'stripe', configured: true, checkoutUrl: session.url };
  }

  async createRefund(invoiceId: string, amountPence: number | undefined, reason: string | undefined) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: { where: { status: PaymentStatus.SUCCEEDED }, orderBy: { createdAt: 'desc' } } } });
    if (!invoice) throw notFound('Invoice not found');
    const amount = amountPence ?? invoice.payments[0]?.amountPence ?? invoice.totalPence;
    if (amount <= 0 || amount > invoice.totalPence) throw badRequest('Refund amount is invalid');
    const payment = invoice.payments[0];
    let stripeRefundId: string | undefined;
    if (this.client && payment?.stripePaymentId) {
      const refund = await this.client.refunds.create({ payment_intent: payment.stripePaymentId, amount, reason: 'requested_by_customer' });
      stripeRefundId = refund.id;
    }
    const refund = await prisma.refund.create({ data: { invoiceId, paymentId: payment?.id, amountPence: amount, reason, status: this.client && payment?.stripePaymentId ? RefundStatus.SUCCEEDED : RefundStatus.REQUESTED, stripeRefundId } });
    return { refund, configured: Boolean(this.client && payment?.stripePaymentId) };
  }

  async createPaymentPlan(input: { invoiceId: string; installmentCount: number; intervalDays: number }) {
    const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
    if (!invoice) throw notFound('Invoice not found');
    if (input.installmentCount < 2 || input.installmentCount > 12) throw badRequest('Installment count must be between 2 and 12');
    const amount = Math.ceil(invoice.totalPence / input.installmentCount);
    return prisma.paymentPlan.create({ data: { invoiceId: invoice.id, status: PaymentPlanStatus.ACTIVE, installmentCount: input.installmentCount, intervalDays: input.intervalDays, installments: { create: Array.from({ length: input.installmentCount }, (_, index) => ({ sequence: index + 1, amountPence: index === input.installmentCount - 1 ? invoice.totalPence - amount * (input.installmentCount - 1) : amount, dueAt: new Date(Date.now() + input.intervalDays * (index + 1) * 86400000) })) } }, include: { installments: true } });
  }

  async reconcileStripeEvent(event: { id?: string; type: string; data?: { object?: Record<string, unknown> } }) {
    const object = event.data?.object ?? {};
    const invoiceId = typeof object.metadata === 'object' && object.metadata !== null && 'invoiceId' in object.metadata ? String(object.metadata.invoiceId) : undefined;
    if (event.type === 'payment_intent.succeeded' && invoiceId) {
      const amount = Number(object.amount_received ?? object.amount ?? 0);
      await prisma.payment.upsert({ where: { stripePaymentId: String(object.id) }, create: { invoiceId, amountPence: amount, status: PaymentStatus.SUCCEEDED, stripePaymentId: String(object.id), providerEventId: event.id, paidAt: new Date(), reconciledAt: new Date() }, update: { status: PaymentStatus.SUCCEEDED, paidAt: new Date(), reconciledAt: new Date(), providerEventId: event.id } });
      const invoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { status: InvoiceStatus.PAID } });
      const payment = await prisma.payment.findUnique({ where: { stripePaymentId: String(object.id) }, select: { id: true } });
      await prisma.revenueEvent.upsert({ where: { providerEventId: event.id ?? String(object.id) }, create: { providerEventId: event.id ?? String(object.id), patientId: invoice.patientId, invoiceId: invoice.id, paymentId: payment?.id, serviceLine: invoice.serviceLine, type: 'PAYMENT_RECEIVED', amountPence: amount }, update: {} });
    }
    return { received: true, eventType: event.type };
  }
}
