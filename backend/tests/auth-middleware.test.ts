import { describe, expect, it } from "vitest";
import { requireRole, requirePortal, portalsForRoles } from "../src/middleware/auth.js";
import { Role } from "@prisma/client";

function mockReq(roles: Role[] = [], params: Record<string, string> = {}) {
  return { user: { id: "u1", email: "t@test.com", roles }, params } as any;
}

describe("auth middleware", () => {
  it("requireRole allows matching role", () => {
    const req = mockReq([Role.ADMIN]);
    let called = false;
    requireRole(Role.ADMIN)(req, {} as any, () => { called = true; });
    expect(called).toBe(true);
  });
  it("requireRole blocks non-matching role", () => {
    const req = mockReq([Role.PATIENT]);
    let err: any;
    requireRole(Role.ADMIN)(req, {} as any, (e: any) => { err = e; });
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });
  it("portalsForRoles returns correct portals", () => {
    const portals = portalsForRoles([Role.PSYCHIATRIST]);
    expect(portals).toContain("clinician");
    expect(portals).not.toContain("finance");
  });
  it("requirePortal blocks patient from admin", () => {
    const req = mockReq([Role.PATIENT]);
    let err: any;
    requirePortal("admin")(req, {} as any, (e: any) => { err = e; });
    expect(err).toBeDefined();
  });
});
