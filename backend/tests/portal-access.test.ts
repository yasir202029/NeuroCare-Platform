import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { requirePortal, portalsForRoles, type PortalName } from "../src/middleware/auth.js";

function mockReq(roles: Role[]) {
  return { user: { id: "u1", email: "t@test.com", roles }, params: {} } as any;
}

function runPortal(portal: PortalName, roles: Role[]) {
  const req = mockReq(roles);
  let err: any;
  requirePortal(portal)(req, {} as any, (e: any) => {
    err = e;
  });
  return err;
}

describe("portal access boundaries", () => {
  it("a patient cannot enter the clinician portal", () => {
    const err = runPortal("clinician", [Role.PATIENT]);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it("a patient cannot enter the admin portal", () => {
    const err = runPortal("admin", [Role.PATIENT]);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it("a patient cannot enter the finance portal", () => {
    const err = runPortal("finance", [Role.PATIENT]);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it("a clinician cannot enter the admin portal", () => {
    const err = runPortal("admin", [Role.PSYCHIATRIST]);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it("a prescriber cannot enter the admin portal", () => {
    const err = runPortal("admin", [Role.PRESCRIBER]);
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it("a clinician can enter the clinician portal", () => {
    expect(runPortal("clinician", [Role.PSYCHIATRIST])).toBeUndefined();
    expect(runPortal("clinician", [Role.PRESCRIBER])).toBeUndefined();
    expect(runPortal("clinician", [Role.NURSE])).toBeUndefined();
  });

  it("an admin can enter the admin portal", () => {
    expect(runPortal("admin", [Role.ADMIN])).toBeUndefined();
  });

  it("a finance user enters the finance portal but not the admin portal", () => {
    // Finance is deliberately a separate operational surface from admin.
    expect(runPortal("finance", [Role.FINANCE])).toBeUndefined();
    expect(runPortal("admin", [Role.FINANCE])).toBeDefined();
  });

  it("a patient can enter the patient portal", () => {
    expect(runPortal("patient", [Role.PATIENT])).toBeUndefined();
  });

  it("a user with multiple personas may enter each permitted portal", () => {
    const roles = [Role.PATIENT, Role.PSYCHIATRIST];
    expect(runPortal("patient", roles)).toBeUndefined();
    expect(runPortal("clinician", roles)).toBeUndefined();
    expect(runPortal("admin", roles)).toBeDefined();
  });

  it("portalsForRoles reflects the personas a user may enter", () => {
    expect(portalsForRoles([Role.PATIENT])).toEqual(["patient"]);
    expect(portalsForRoles([Role.PSYCHIATRIST])).toEqual(["clinician", "prescriber"]);
    expect(portalsForRoles([Role.ADMIN])).toEqual(["admin", "finance", "prescriber", "nurse"]);
    expect(portalsForRoles([Role.FINANCE])).toEqual(["finance"]);
    expect(portalsForRoles([Role.PATIENT, Role.ADMIN])).toEqual([
      "patient",
      "admin",
      "finance",
      "prescriber",
      "nurse",
    ]);
  });
});
