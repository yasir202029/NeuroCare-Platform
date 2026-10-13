import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  uniqueIndex,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const id = (name: string) => text(name).primaryKey();
const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const organisationsTable = pgTable("organisations", {
  id: id("id"), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("ACTIVE"), plan: text("plan").notNull().default("STARTER"), createdAt, updatedAt,
});

export const clinicsTable = pgTable("clinics", {
  id: id("id"),
  organisationId: text("organisation_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  fontFamily: text("font_family"),
  welcomeText: text("welcome_text"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
  updatedAt,
});

export const departmentsTable = pgTable("departments", {
  id: id("id"), organisationId: text("organisation_id").notNull(), clinicId: text("clinic_id").notNull(),
  name: text("name").notNull(), slug: text("slug").notNull(), createdAt, updatedAt,
}, (table) => [uniqueIndex("departments_clinic_slug_idx").on(table.clinicId, table.slug)]);

export const organisationMembershipsTable = pgTable("organisation_memberships", {
  id: id("id"), organisationId: text("organisation_id").notNull(), profileId: text("profile_id").notNull(),
  role: text("role").notNull(), isActive: boolean("is_active").notNull().default(true), createdAt, updatedAt,
}, (table) => [uniqueIndex("organisation_memberships_org_profile_idx").on(table.organisationId, table.profileId)]);

export const profilesTable = pgTable("profiles", {
  id: id("id"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  createdAt,
  updatedAt,
});


export const clinicMembershipsTable = pgTable("clinic_memberships", {
  id: id("id"),
  clinicId: text("clinic_id").notNull(),
  profileId: text("profile_id").notNull(),
  role: text("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex("clinic_memberships_clinic_profile_idx").on(table.clinicId, table.profileId)]);

export const patientsTable = pgTable("patients", {
  clinicId: text("clinic_id"),
  id: id("id"),
  profileId: text("profile_id").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  preferredContact: text("preferred_contact"),
  emergencyContact: jsonb("emergency_contact"),
  createdAt,
  updatedAt,
});

export const cliniciansTable = pgTable("clinicians", {
  clinicId: text("clinic_id"),
  id: id("id"),
  profileId: text("profile_id").notNull(),
  registrationNumber: text("registration_number"),
  specialty: text("specialty"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
  updatedAt,
});

export const appointmentsTable = pgTable("appointments", {
  clinicId: text("clinic_id"),
  id: id("id"),
  patientId: text("patient_id").notNull(),
  clinicianId: text("clinician_id"),
  assessmentType: text("assessment_type").notNull(),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  status: text("status").notNull().default("pending"),
  location: text("location").notNull(),
  createdAt,
  updatedAt,
});

export const clinicalNotesTable = pgTable("clinical_notes", {
  clinicId: text("clinic_id").notNull(),
  id: id("id"),
  patientId: text("patient_id").notNull(),
  authorProfileId: text("author_profile_id").notNull(),
  noteType: text("note_type").notNull(),
  body: text("body").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt,
  updatedAt,
});

export const diagnosesTable = pgTable("diagnoses", {
  clinicId: text("clinic_id").notNull(),
  id: id("id"),
  patientId: text("patient_id").notNull(),
  clinicianId: text("clinician_id").notNull(),
  codeSystem: text("code_system").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("active"),
  diagnosedAt: timestamp("diagnosed_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt,
  updatedAt,
});

export const assessmentsTable = pgTable("assessments", {
  clinicId: text("clinic_id"),
  id: id("id"),
  patientId: text("patient_id").notNull(),
  clinicianId: text("clinician_id"),
  assessmentType: text("assessment_type").notNull(),
  stage: text("stage").notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  responses: jsonb("responses"),
  createdAt,
  updatedAt,
});

export const formsTable = pgTable("forms", {
  clinicId: text("clinic_id"),
  id: id("id"),
  assessmentId: text("assessment_id").notNull(),
  title: text("title").notNull(),
  formType: text("form_type").notNull(),
  status: text("status").notNull().default("not_started"),
  responses: jsonb("responses"),
  createdAt,
  updatedAt,
});

export const reportsTable = pgTable("reports", {
  clinicId: text("clinic_id"),
  id: id("id"),
  assessmentId: text("assessment_id").notNull(),
  clinicianId: text("clinician_id").notNull(),
  title: text("title").notNull(),
  storagePath: text("storage_path"),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const messagesTable = pgTable("messages", {
  clinicId: text("clinic_id"),
  id: id("id"),
  senderProfileId: text("sender_profile_id").notNull(),
  recipientProfileId: text("recipient_profile_id").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt,
});

export const documentsTable = pgTable("documents", {
  clinicId: text("clinic_id"),
  id: id("id"),
  patientId: text("patient_id").notNull(),
  uploadedByProfileId: text("uploaded_by_profile_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  storagePath: text("storage_path").notNull(),
  status: text("status").notNull().default("uploaded"),
  createdAt,
});

export const paymentsTable = pgTable("payments", {
  clinicId: text("clinic_id"),
  id: id("id"),
  patientId: text("patient_id").notNull(),
  appointmentId: text("appointment_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("gbp"),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt,
});

export const auditLogsTable = pgTable("audit_logs", {
  clinicId: text("clinic_id"),
  id: id("id"),
  actorProfileId: text("actor_profile_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  createdAt,
});

export const insertOrganisationSchema = createInsertSchema(organisationsTable).omit({ createdAt: true, updatedAt: true });
export const insertDepartmentSchema = createInsertSchema(departmentsTable).omit({ createdAt: true, updatedAt: true });
export const insertOrganisationMembershipSchema = createInsertSchema(organisationMembershipsTable).omit({ createdAt: true, updatedAt: true });
export const insertClinicSchema = createInsertSchema(clinicsTable).omit({ createdAt: true, updatedAt: true });
export const insertClinicMembershipSchema = createInsertSchema(clinicMembershipsTable).omit({ createdAt: true, updatedAt: true });
export const insertProfileSchema = createInsertSchema(profilesTable).omit({ createdAt: true, updatedAt: true });
export const insertPatientSchema = createInsertSchema(patientsTable).omit({ createdAt: true, updatedAt: true });
export const insertClinicianSchema = createInsertSchema(cliniciansTable).omit({ createdAt: true, updatedAt: true });
export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ createdAt: true, updatedAt: true });
export const insertClinicalNoteSchema = createInsertSchema(clinicalNotesTable).omit({ createdAt: true, updatedAt: true });
export const insertDiagnosisSchema = createInsertSchema(diagnosesTable).omit({ createdAt: true, updatedAt: true });
export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ createdAt: true, updatedAt: true });
export const insertFormSchema = createInsertSchema(formsTable).omit({ createdAt: true, updatedAt: true });
export const insertReportSchema = createInsertSchema(reportsTable).omit({ createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messagesTable).omit({ createdAt: true });
export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ createdAt: true });
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ createdAt: true });

export type InsertOrganisation = z.infer<typeof insertOrganisationSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertOrganisationMembership = z.infer<typeof insertOrganisationMembershipSchema>;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type InsertClinicMembership = z.infer<typeof insertClinicMembershipSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertClinician = z.infer<typeof insertClinicianSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertClinicalNote = z.infer<typeof insertClinicalNoteSchema>;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
