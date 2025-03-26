import { IStorage } from './storage';
import { db } from './db';
import { 
  User, InsertUser, Patient, InsertPatient, 
  Appointment, InsertAppointment, PatientHistory, 
  InsertPatientHistory, Settings, InsertSettings,
  SymptomCheck, InsertSymptomCheck, MedicalDocument, InsertMedicalDocument
} from '@shared/schema';
import { 
  users, patients, appointments, patientHistory, 
  settings, symptomChecks, medicalDocuments 
} from '@shared/schema';
import { eq, and, gte, lte, like, desc, sql } from 'drizzle-orm';
import session from "express-session";
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import connectPg from "connect-pg-simple";
import postgres from 'postgres';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  private queryClient: ReturnType<typeof postgres>;

  constructor() {
    // Create the client for the session store
    const connectionString = process.env.DATABASE_URL || '';
    this.queryClient = postgres(connectionString);
    
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: connectionString
      },
      createTableIfMissing: true 
    });
  }

  // User operations
  getUsers(): Map<number, User> {
    throw new Error('Method not applicable for database storage');
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.verificationToken, token));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user
    }).returning();
    
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  // Patient operations
  async getAllPatients(): Promise<Patient[]> {
    return db.select().from(patients).orderBy(desc(patients.updatedAt));
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return result.length > 0 ? result[0] : undefined;
  }

  async searchPatients(searchTerm: string): Promise<Patient[]> {
    const searchPattern = `%${searchTerm}%`;
    
    return db.select().from(patients).where(
      sql`(
        ${patients.firstName} ILIKE ${searchPattern} OR
        ${patients.lastName} ILIKE ${searchPattern} OR
        ${patients.patientId} ILIKE ${searchPattern} OR
        ${patients.phone} ILIKE ${searchPattern} OR
        ${patients.email} ILIKE ${searchPattern}
      )`
    );
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values({
      ...patient
    }).returning();
    
    return result[0];
  }

  async updatePatient(id: number, updateData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await db.update(patients)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deletePatient(id: number): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id)).returning();
    return result.length > 0;
  }

  // Appointment operations
  async getAllAppointments(): Promise<Appointment[]> {
    return db.select().from(appointments).orderBy(appointments.appointmentDate);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return db.select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(appointments.appointmentDate);
  }

  async getTodaysAppointments(): Promise<Appointment[]> {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    return db.select()
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .orderBy(appointments.appointmentDate);
  }

  async getUpcomingAppointments(): Promise<Appointment[]> {
    const now = new Date();
    
    return db.select()
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, now),
          sql`${appointments.status} != 'cancelled'`
        )
      )
      .orderBy(appointments.appointmentDate);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values({
      ...appointment
    }).returning();
    
    return result[0];
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  async sendAppointmentReminder(appointmentId: number): Promise<boolean> {
    // In a real implementation, this would send an SMS via Twilio
    // For now, we'll just mark the appointment as having had a reminder sent
    const result = await db.update(appointments)
      .set({
        smsReminderSent: true,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();
    
    return result.length > 0;
  }

  // Patient History operations
  async getAllPatientHistory(patientId: number): Promise<PatientHistory[]> {
    return db.select()
      .from(patientHistory)
      .where(eq(patientHistory.patientId, patientId))
      .orderBy(desc(patientHistory.visitDate));
  }

  async getPatientHistoryEntry(id: number): Promise<PatientHistory | undefined> {
    const result = await db.select().from(patientHistory).where(eq(patientHistory.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createPatientHistory(history: InsertPatientHistory): Promise<PatientHistory> {
    const result = await db.insert(patientHistory).values({
      ...history
    }).returning();
    
    return result[0];
  }

  async updatePatientHistory(id: number, updateData: Partial<InsertPatientHistory>): Promise<PatientHistory | undefined> {
    const result = await db.update(patientHistory)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(patientHistory.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deletePatientHistory(id: number): Promise<boolean> {
    const result = await db.delete(patientHistory).where(eq(patientHistory.id, id)).returning();
    return result.length > 0;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    const result = await db.select().from(settings);
    return result.length > 0 ? result[0] : undefined;
  }

  async updateSettings(updateData: Partial<InsertSettings>): Promise<Settings> {
    // First check if settings exist
    const existingSettings = await this.getSettings();
    
    if (existingSettings) {
      // Update existing settings
      const result = await db.update(settings)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(settings.id, existingSettings.id))
        .returning();
      
      return result[0];
    } else {
      // Create new settings
      const result = await db.insert(settings).values({
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return result[0];
    }
  }
  
  // Symptom Checker operations
  async getSymptomChecks(patientId: number): Promise<SymptomCheck[]> {
    const results = await db.select()
      .from(symptomChecks)
      .where(eq(symptomChecks.patientId, patientId))
      .orderBy(desc(symptomChecks.checkDate));
      
    // Cast results to SymptomCheck type
    return results as unknown as SymptomCheck[];
  }

  async getSymptomCheck(id: number): Promise<SymptomCheck | undefined> {
    const result = await db.select().from(symptomChecks).where(eq(symptomChecks.id, id));
    if (result.length === 0) return undefined;
    
    // Cast result to SymptomCheck type
    return result[0] as unknown as SymptomCheck;
  }

  async createSymptomCheck(check: InsertSymptomCheck): Promise<SymptomCheck> {
    const result = await db.insert(symptomChecks).values({
      ...check,
      checkDate: check.checkDate || new Date(),
      status: check.status || 'pending',
    }).returning();
    
    // Cast result to SymptomCheck type
    return result[0] as unknown as SymptomCheck;
  }

  async updateSymptomCheck(id: number, data: Partial<SymptomCheck>): Promise<SymptomCheck | undefined> {
    // Remove completedAt if it exists as it's not in the schema
    const { completedAt, ...updateData } = data as any;
    
    const result = await db.update(symptomChecks)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(symptomChecks.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Cast result to SymptomCheck type
    return result[0] as unknown as SymptomCheck;
  }

  async deleteSymptomCheck(id: number): Promise<boolean> {
    const result = await db.delete(symptomChecks).where(eq(symptomChecks.id, id)).returning();
    return result.length > 0;
  }

  async analyzeSymptoms(checkId: number): Promise<SymptomCheck | undefined> {
    try {
      // Get the symptom check from the database
      const check = await this.getSymptomCheck(checkId);
      if (!check) return undefined;
      
      // Import the symptom analyzer
      const { analyzeSymptoms } = await import('./symptom-analyzer');
      
      // Use the knowledge-based symptom analyzer to analyze the symptoms
      const analyzedCheck = analyzeSymptoms(check);
      
      // Update the symptom check with the analysis results
      return await this.updateSymptomCheck(checkId, {
        status: 'completed',
        analysis: analyzedCheck.analysis,
        recommendations: analyzedCheck.recommendations
      });
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      
      // If there's an error in the symptom analyzer, update the check with an error status
      return await this.updateSymptomCheck(checkId, {
        status: 'error'
      });
    }
  }
  
  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    newPatients: number;
    smsReminders: number;
  }> {
    const totalPatientsResult = await db.select({ count: sql<number>`count(*)` }).from(patients);
    const totalPatients = totalPatientsResult[0].count;
    
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    const todayAppointmentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      );
    const todayAppointments = todayAppointmentsResult[0].count;
    
    // Patients created in the last 30 days
    const thirtyDaysAgo = addDays(new Date(), -30);
    const newPatientsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients)
      .where(gte(patients.createdAt, thirtyDaysAgo));
    const newPatients = newPatientsResult[0].count;
    
    // Count of SMS reminders sent
    const smsRemindersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.smsReminderSent, true));
    const smsReminders = smsRemindersResult[0].count;
    
    return {
      totalPatients,
      todayAppointments,
      newPatients,
      smsReminders
    };
  }

  // Medical Document operations
  async getPatientDocuments(patientId: number): Promise<MedicalDocument[]> {
    return db.select()
      .from(medicalDocuments)
      .where(eq(medicalDocuments.patientId, patientId))
      .orderBy(desc(medicalDocuments.uploadDate));
  }

  async getDocument(id: number): Promise<MedicalDocument | undefined> {
    const result = await db.select().from(medicalDocuments).where(eq(medicalDocuments.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createDocument(document: InsertMedicalDocument): Promise<MedicalDocument> {
    const result = await db.insert(medicalDocuments).values({
      ...document,
      uploadDate: document.uploadDate || new Date()
    }).returning();
    
    return result[0];
  }

  async updateDocument(id: number, data: Partial<MedicalDocument>): Promise<MedicalDocument | undefined> {
    const result = await db.update(medicalDocuments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(medicalDocuments.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(medicalDocuments).where(eq(medicalDocuments.id, id)).returning();
    return result.length > 0;
  }
}