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
  // Two-factor authentication fields
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorRecoveryCodes: json("two_factor_recovery_codes"),
  twoFactorBackupCodes: json("two_factor_backup_codes"),
  lastLoginAt: timestamp("last_login_at"),
  loginAttempts: integer("login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
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

export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type InsertMedicalDocument = z.infer<typeof insertMedicalDocumentSchema>;

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

// Symptom Checker schemas
export const symptomChecks = pgTable("symptom_checks", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  checkDate: timestamp("check_date").defaultNow().notNull(),
  symptoms: json("symptoms").notNull(),
  severity: integer("severity").notNull(),
  duration: text("duration").notNull(),
  analysis: json("analysis"),
  recommendations: json("recommendations"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSymptomCheckSchema = createInsertSchema(symptomChecks, {}).omit({
  id: true,
  analysis: true,
  recommendations: true,
  createdAt: true,
  updatedAt: true
});

// Define interfaces for the expected structure of analysis and recommendations
export interface AnalysisResult {
  urgencyLevel: string;
  possibleConditions: Array<{
    name: string;
    probability: string;
    description?: string;
  }>;
  disclaimer?: string;
}

export interface RecommendationResult {
  generalAdvice: string;
  suggestedActions: string[];
  followUpRecommendation: string;
  disclaimer?: string;
}

export type SymptomCheck = typeof symptomChecks.$inferSelect & {
  analysis?: AnalysisResult;
  recommendations?: RecommendationResult;
};
export type InsertSymptomCheck = z.infer<typeof insertSymptomCheckSchema>;

// Predefined symptom data
export const bodyAreas = [
  "head", "eyes", "ears", "nose", "mouth", "throat", 
  "chest", "heart", "lungs", "abdomen", "back",
  "pelvis", "arms", "legs", "skin", "general"
] as const;

export type BodyArea = typeof bodyAreas[number];

export const severityLevels = [
  { value: 1, label: "Mild" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Severe" },
  { value: 4, label: "Very Severe" },
  { value: 5, label: "Emergency" }
] as const;

export const durationOptions = [
  "Less than a day",
  "1-3 days",
  "3-7 days",
  "1-2 weeks",
  "2-4 weeks",
  "1-3 months",
  "3+ months"
] as const;

// Medical Document schema
export const medicalDocuments = pgTable("medical_documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data
  category: text("category").default("general"),
  description: text("description"),
  uploadedBy: integer("uploaded_by").notNull(), // User ID
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  lastAccessed: timestamp("last_accessed"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMedicalDocumentSchema = createInsertSchema(medicalDocuments, {}).omit({
  id: true,
  lastAccessed: true,
  createdAt: true,
  updatedAt: true
});
