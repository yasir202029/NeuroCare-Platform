import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const id = (name: string) => text(name).primaryKey();
const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const profilesTable = pgTable("profiles", {
  id: id("id"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  createdAt,
  updatedAt,
});

export const patientsTable = pgTable("patients", {
  id: id("id"),
  profileId: text("profile_id").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  preferredContact: text("preferred_contact"),
  emergencyContact: jsonb("emergency_contact"),
  createdAt,
  updatedAt,
});

export const cliniciansTable = pgTable("clinicians", {
  id: id("id"),
  profileId: text("profile_id").notNull(),
  registrationNumber: text("registration_number"),
  specialty: text("specialty"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
  updatedAt,
});

export const appointmentsTable = pgTable("appointments", {
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

export const assessmentsTable = pgTable("assessments", {
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
  id: id("id"),
  senderProfileId: text("sender_profile_id").notNull(),
  recipientProfileId: text("recipient_profile_id").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt,
});

export const documentsTable = pgTable("documents", {
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
  id: id("id"),
  actorProfileId: text("actor_profile_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  createdAt,
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ createdAt: true, updatedAt: true });
export const insertPatientSchema = createInsertSchema(patientsTable).omit({ createdAt: true, updatedAt: true });
export const insertClinicianSchema = createInsertSchema(cliniciansTable).omit({ createdAt: true, updatedAt: true });
export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ createdAt: true, updatedAt: true });
export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ createdAt: true, updatedAt: true });
export const insertFormSchema = createInsertSchema(formsTable).omit({ createdAt: true, updatedAt: true });
export const insertReportSchema = createInsertSchema(reportsTable).omit({ createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messagesTable).omit({ createdAt: true });
export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ createdAt: true });
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ createdAt: true });

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertClinician = z.infer<typeof insertClinicianSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;