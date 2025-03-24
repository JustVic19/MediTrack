import { pgTable, text, serial, integer, boolean, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").default("staff").notNull(),
  profileImage: text("profile_image"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  profileImage: true,
  isVerified: true,
  verificationToken: true,
  verificationExpires: true,
  passwordResetToken: true,
  passwordResetExpires: true,
});

// Patient schema
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: varchar("patient_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  address: text("address"),
  medicalHistory: text("medical_history"),
  smsOptIn: boolean("sms_opt_in").default(false).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastVisit: timestamp("last_visit"),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true
});

// Appointment schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: varchar("status", { length: 20 }).default("scheduled").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  smsReminderSent: boolean("sms_reminder_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  smsReminderSent: true,
  createdAt: true
});

// Patient History schema
export const patientHistory = pgTable("patient_history", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  visitDate: timestamp("visit_date").notNull(),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  prescriptions: text("prescriptions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientHistorySchema = createInsertSchema(patientHistory).omit({
  id: true,
  createdAt: true
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: text("twilio_phone_number"),
  reminderHoursInAdvance: integer("reminder_hours_in_advance").default(24),
  systemName: text("system_name").default("MediTrack"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type PatientHistory = typeof patientHistory.$inferSelect;
export type InsertPatientHistory = z.infer<typeof insertPatientHistorySchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
