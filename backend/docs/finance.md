# Finance and business intelligence

## Accounting flow

```text
Invoice generated
  -> Stripe Checkout or payment plan created
  -> Payment provider event received
  -> Payment reconciled
  -> RevenueEvent created
  -> Invoice balance updated
  -> KPI snapshots recalculated
  -> Admin and finance dashboards refreshed
```

`RevenueEvent` is the accounting-oriented event stream. Dashboards should aggregate from it rather than infer revenue from current invoice status. Refunds are recorded separately and should create negative revenue events in the production reconciliation worker.

## API

```text
GET  /api/v1/billing/invoices
POST /api/v1/billing/invoices/:id/checkout
POST /api/v1/billing/invoices/:id/refunds
POST /api/v1/billing/invoices/:id/payment-plan
GET  /api/v1/billing/failed-payments
POST /api/v1/billing/webhooks/stripe

GET  /api/v1/finance/dashboard
GET  /api/v1/finance/revenue/clinicians
GET  /api/v1/finance/revenue/services
GET  /api/v1/finance/analytics
GET  /api/v1/finance/earnings/me
POST /api/v1/finance/kpis/snapshot
```

Admin and Finance roles can access business finance and analytics. Clinicians can access only their own earnings endpoint. Patient invoice endpoints remain ownership-scoped.

## Stripe production requirements

- Verify webhook signatures using `STRIPE_WEBHOOK_SECRET` and the raw request body.
- Make event processing idempotent using Stripe event IDs.
- Reconcile payment, refund, dispute, and failed-payment events.
- Never trust client-provided amounts or invoice ownership.
- Store Stripe IDs without storing card data.
- Run payment retries and failed-payment notifications through a worker queue.
- Reconcile Stripe totals against internal `RevenueEvent` records daily.
