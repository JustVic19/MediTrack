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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastVisit: timestamp("last_visit"),
});

export const insertPatientSchema = createInsertSchema(patients, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments, {}).omit({
  id: true,
  smsReminderSent: true,
  createdAt: true,
  updatedAt: true
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPatientHistorySchema = createInsertSchema(patientHistory, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Appointment = typeof appointments.$inferSelect & {
  type?: 'appointment';
  doctorName?: string;
  location?: string;
};
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type PatientHistory = typeof patientHistory.$inferSelect & {
  type?: 'history' | 'vitals' | 'medication' | 'labs' | 'document';
  visitReason?: string;
  recordedBy?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
    weight?: number;
    height?: number;
  };
  medications?: {
    name?: string;
    dosage?: string;
    frequency?: string;
    startDate?: Date;
    endDate?: Date;
  }[];
  labResults?: {
    name?: string;
    result?: string;
    normalRange?: string;
    date?: Date;
  }[];
  documents?: {
    name?: string;
    type?: string;
    size?: number;
    uploadDate?: Date;
  }[];
};
export type InsertPatientHistory = z.infer<typeof insertPatientHistorySchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Health Timeline Types
export type HealthEvent = {
  id: number;
  date: Date;
  title: string;
  description?: string;
  type: 'appointment' | 'history' | 'medication' | 'vitals' | 'labs' | 'document';
  status?: string;
  metadata?: Record<string, any>;
  iconColor?: string;
};
