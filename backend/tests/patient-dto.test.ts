import { describe, expect, it } from "vitest";
import { toPatientProfileDTO, PatientProfileResponseSchema } from "../src/modules/patients/patient.dto.js";

describe("patient DTO", () => {
  it("strips internal/sensitive fields", () => {
    const raw = {
      id: "p1",
      userId: "u1",
      nhsNumberCipher: "secret-cipher",
      nhsNumberHash: "secret-hash",
      dateOfBirth: new Date("2000-01-01"),
      sexAtBirth: "male",
      gender: "male",
      address: { line1: "1 High St" },
      emergencyContact: { name: "Jane" },
      preferredContact: "email",
      consentToContact: true,
      medicalHistory: "ADHD",
      currentMedication: [{ name: "methylphenidate" }],
      accessibilityNeeds: "none",
      user: { id: "u1", email: "p@test.com", firstName: "Pat", lastName: "Ient", phone: null },
      organizationId: "org-1",
      deletedAt: new Date(),
      auditMetadata: { x: 1 },
    } as any;
    const dto = toPatientProfileDTO(raw);
    expect(dto).not.toHaveProperty("nhsNumberCipher");
    expect(dto).not.toHaveProperty("nhsNumberHash");
    expect(dto).not.toHaveProperty("organizationId");
    expect(dto).not.toHaveProperty("deletedAt");
    expect(dto).not.toHaveProperty("auditMetadata");
    expect(dto.id).toBe("p1");
    expect(dto.user.firstName).toBe("Pat");
    // validate against zod schema
    const parsed = PatientProfileResponseSchema.safeParse(dto);
    expect(parsed.success).toBe(true);
  });
});
