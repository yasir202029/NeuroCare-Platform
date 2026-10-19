import { describe, it, expect } from "vitest";

describe("remote saas modules", () => {
  it("gdpr module exports router", async () => {
    const m = await import("../src/modules/gdpr/gdpr.routes.js");
    expect(m.default).toBeDefined();
  });
  it("telehealth module exports router", async () => {
    const m = await import("../src/modules/telehealth/telehealth.routes.js");
    expect(m.default).toBeDefined();
  });
  it("saas-plans module exports router", async () => {
    const m = await import("../src/modules/saas-plans/saas-plans.routes.js");
    expect(m.default).toBeDefined();
  });
});

describe("report engine module", () => {
  it("exports router", async () => {
    const m = await import("../src/modules/report-engine/report-engine.routes.js");
    expect(m.default).toBeDefined();
  });
});
