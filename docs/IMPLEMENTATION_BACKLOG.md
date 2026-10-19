# Implementation Backlog (ordered by risk/dependency)

1. Auth + RBAC + cross-patient isolation (IDOR/BOLA) — P1
2. Prisma committed migrations + deploy strategy — P1
3. CORS prod-only defaults + secret handling verification — P1
4. Integration tests (auth, RBAC, ownership, booking, assessments, notes, docs, payments, prescriptions) — P1
5. LLM integration in Python AI service with clinician review gates — P2
6. Live data WebSocket wired into dashboards — P2
7. E2E smoke tests (Playwright) — P2
8. Python dependency refresh — P2
9. Lint + CI gates — P3
10. Rate-limit verification + security headers audit — P3
