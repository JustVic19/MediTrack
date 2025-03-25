import { 
  User, InsertUser, users,
  Patient, InsertPatient, patients,
  Appointment, InsertAppointment, appointments, 
  PatientHistory, InsertPatientHistory, patientHistory,
  Settings, InsertSettings, settings,
  SymptomCheck, InsertSymptomCheck, symptomChecks,
  MedicalDocument, InsertMedicalDocument, medicalDocuments
} from "@shared/schema";
import { format } from "date-fns";
import twilio from "twilio";
import session from "express-session";
import createMemoryStore from "memorystore";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUsers(): Map<number, User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  // Patient operations
  getAllPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  searchPatients(searchTerm: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;

  // Appointment operations
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatientId(patientId: number): Promise<Appointment[]>;
  getTodaysAppointments(): Promise<Appointment[]>;
  getUpcomingAppointments(): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  sendAppointmentReminder(appointmentId: number): Promise<boolean>;

  // Patient History operations
  getAllPatientHistory(patientId: number): Promise<PatientHistory[]>;
  getPatientHistoryEntry(id: number): Promise<PatientHistory | undefined>;
  createPatientHistory(history: InsertPatientHistory): Promise<PatientHistory>;
  updatePatientHistory(id: number, history: Partial<InsertPatientHistory>): Promise<PatientHistory | undefined>;
  deletePatientHistory(id: number): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    newPatients: number;
    smsReminders: number;
  }>;

  // Symptom Checker operations
  getSymptomChecks(patientId: number): Promise<SymptomCheck[]>;
  getSymptomCheck(id: number): Promise<SymptomCheck | undefined>;
  createSymptomCheck(check: InsertSymptomCheck): Promise<SymptomCheck>;
  updateSymptomCheck(id: number, data: Partial<SymptomCheck>): Promise<SymptomCheck | undefined>;
  deleteSymptomCheck(id: number): Promise<boolean>;
  analyzeSymptoms(checkId: number): Promise<SymptomCheck | undefined>;

  // Medical Document operations
  getPatientDocuments(patientId: number): Promise<MedicalDocument[]>;
  getDocument(id: number): Promise<MedicalDocument | undefined>;
  createDocument(document: InsertMedicalDocument): Promise<MedicalDocument>;
  updateDocument(id: number, data: Partial<MedicalDocument>): Promise<MedicalDocument | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private patientHistories: Map<number, PatientHistory>;
  private symptomChecks: Map<number, SymptomCheck>;
  private medicalDocuments: Map<number, MedicalDocument>;
  private appSettings: Settings | undefined;
  
  private currentUserId: number;
  private currentPatientId: number;
  private currentAppointmentId: number;
  private currentHistoryId: number;
  private currentSymptomCheckId: number;
  private currentDocumentId: number;
  private smsRemindersSent: number;
  
  // Session store for express-session
  public sessionStore: session.Store;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.patientHistories = new Map();
    this.symptomChecks = new Map();
    this.medicalDocuments = new Map();
    
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentAppointmentId = 1;
    this.currentHistoryId = 1;
    this.currentSymptomCheckId = 1;
    this.currentDocumentId = 1;
    this.smsRemindersSent = 0;

    // Add default user
    // Create user directly to avoid async issues in constructor
    const adminId = this.currentUserId++;
    const now = new Date();
    const adminUser: User = {
      id: adminId,
      username: "admin",
      password: "password",
      fullName: "Dr. Sarah Johnson",
      email: "sarah.johnson@meditrack.com",
      role: "admin",
      profileImage: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D8ABC&color=fff",
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(adminId, adminUser);
    
    // Add a test user for troubleshooting
    const testId = this.currentUserId++;
    const testUser: User = {
      id: testId,
      username: "test",
      password: "test123",
      fullName: "Test User",
      email: "test@example.com",
      role: "staff",
      profileImage: "https://ui-avatars.com/api/?name=Test+User&background=6D28D9&color=fff",
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(testId, testUser);
    
    console.log("Created default users:", this.users.size);

    // Initialize app settings
    const settingsTime = new Date();
    this.appSettings = {
      id: 1,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || null,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || null,
      reminderHoursInAdvance: 24,
      systemName: "MediTrack",
      createdAt: settingsTime,
      updatedAt: settingsTime
    };
    
    // Create sample data
    this.createSampleData();
  }

  // User methods
  getUsers(): Map<number, User> {
    return this.users;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token
    );
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.passwordResetToken === token
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const userCreationTime = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || 'staff',
      profileImage: insertUser.profileImage || null,
      isVerified: insertUser.isVerified !== undefined ? insertUser.isVerified : true,
      verificationToken: insertUser.verificationToken || null,
      verificationExpires: insertUser.verificationExpires || null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: userCreationTime,
      updatedAt: userCreationTime
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Patient methods
  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).sort((a, b) => b.id - a.id);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.patientId === patientId
    );
  }

  async searchPatients(searchTerm: string): Promise<Patient[]> {
    const term = searchTerm.toLowerCase();
    return Array.from(this.patients.values()).filter(
      (patient) => 
        patient.firstName.toLowerCase().includes(term) ||
        patient.lastName.toLowerCase().includes(term) ||
        patient.patientId.toLowerCase().includes(term) ||
        (patient.email && patient.email.toLowerCase().includes(term)) ||
        patient.phone.includes(term)
    );
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentPatientId++;
    // Generate a patient ID like PT-2023-0001
    const patientId = insertPatient.patientId || `PT-${new Date().getFullYear()}-${id.toString().padStart(4, '0')}`;
    
    const patientCreationTime = new Date();
    const patient: Patient = { 
      ...insertPatient,
      id,
      patientId,
      createdAt: patientCreationTime,
      updatedAt: patientCreationTime,
      lastVisit: insertPatient.lastVisit || patientCreationTime
    };
    
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updateData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) return undefined;

    const updatedPatient: Patient = { ...existingPatient, ...updateData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  // Appointment methods
  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).sort((a, b) => 
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId)
      .sort((a, b) => 
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );
  }

  async getTodaysAppointments(): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.appointments.values())
      .filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= today && appointmentDate < tomorrow;
      })
      .sort((a, b) => 
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
  }

  async getUpcomingAppointments(): Promise<Appointment[]> {
    const currentTime = new Date();
    
    return Array.from(this.appointments.values())
      .filter(appointment => new Date(appointment.appointmentDate) >= currentTime)
      .sort((a, b) => 
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointmentCreationTime = new Date();
    const appointment: Appointment = { 
      ...insertAppointment,
      id,
      smsReminderSent: false,
      status: insertAppointment.status || 'Scheduled',
      notes: insertAppointment.notes || null,
      createdAt: appointmentCreationTime,
      updatedAt: appointmentCreationTime
    };
    
    this.appointments.set(id, appointment);
    
    // Update patient's last visit if this appointment is more recent
    const patient = this.patients.get(appointment.patientId);
    if (patient) {
      const appointmentDate = new Date(appointment.appointmentDate);
      if (!patient.lastVisit || appointmentDate > patient.lastVisit) {
        patient.lastVisit = appointmentDate;
        this.patients.set(patient.id, patient);
      }
    }
    
    return appointment;
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;

    const updatedAppointment: Appointment = { ...existingAppointment, ...updateData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  async sendAppointmentReminder(appointmentId: number): Promise<boolean> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return false;
    
    const patient = this.patients.get(appointment.patientId);
    if (!patient || !patient.smsOptIn || !patient.phone) return false;
    
    const settings = await this.getSettings();
    if (!settings || !settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) {
      return false;
    }
    
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        // Only attempt to send SMS if Twilio credentials are available
        const twilioClient = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
        
        const appointmentDate = new Date(appointment.appointmentDate);
        const formattedDate = format(appointmentDate, "MMMM do, yyyy 'at' h:mm a");
        
        await twilioClient.messages.create({
          body: `Reminder: You have an appointment at MediTrack on ${formattedDate}. Reason: ${appointment.reason}`,
          from: settings.twilioPhoneNumber,
          to: patient.phone
        });
      }
      
      // Mark as sent even if we didn't actually send (for demo purposes)
      appointment.smsReminderSent = true;
      this.appointments.set(appointmentId, appointment);
      this.smsRemindersSent++;
      
      return true;
    } catch (error) {
      console.error('Error sending SMS reminder:', error);
      return false;
    }
  }

  // Patient History methods
  async getAllPatientHistory(patientId: number): Promise<PatientHistory[]> {
    return Array.from(this.patientHistories.values())
      .filter(history => history.patientId === patientId)
      .sort((a, b) => 
        new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
      );
  }

  async getPatientHistoryEntry(id: number): Promise<PatientHistory | undefined> {
    return this.patientHistories.get(id);
  }

  async createPatientHistory(insertHistory: InsertPatientHistory): Promise<PatientHistory> {
    const id = this.currentHistoryId++;
    const historyCreationTime = new Date();
    const history: PatientHistory = { 
      ...insertHistory,
      id,
      notes: insertHistory.notes || null,
      diagnosis: insertHistory.diagnosis || null,
      treatment: insertHistory.treatment || null,
      prescriptions: insertHistory.prescriptions || null,
      createdAt: historyCreationTime,
      updatedAt: historyCreationTime
    };
    
    this.patientHistories.set(id, history);
    
    // Update patient's last visit date
    const patient = this.patients.get(history.patientId);
    if (patient) {
      const visitDate = new Date(history.visitDate);
      if (!patient.lastVisit || visitDate > patient.lastVisit) {
        patient.lastVisit = visitDate;
        this.patients.set(patient.id, patient);
      }
    }
    
    return history;
  }

  async updatePatientHistory(id: number, updateData: Partial<InsertPatientHistory>): Promise<PatientHistory | undefined> {
    const existingHistory = this.patientHistories.get(id);
    if (!existingHistory) return undefined;

    const updatedHistory: PatientHistory = { ...existingHistory, ...updateData };
    this.patientHistories.set(id, updatedHistory);
    return updatedHistory;
  }

  async deletePatientHistory(id: number): Promise<boolean> {
    return this.patientHistories.delete(id);
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.appSettings;
  }

  async updateSettings(updateData: Partial<InsertSettings>): Promise<Settings> {
    const now = new Date();
    if (!this.appSettings) {
      this.appSettings = {
        id: 1,
        ...updateData,
        twilioAccountSid: updateData.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || null,
        twilioAuthToken: updateData.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || null,
        twilioPhoneNumber: updateData.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER || null,
        reminderHoursInAdvance: updateData.reminderHoursInAdvance || 24,
        systemName: updateData.systemName || "MediTrack",
        createdAt: now,
        updatedAt: now
      };
    } else {
      this.appSettings = { 
        ...this.appSettings, 
        ...updateData,
        updatedAt: now
      };
    }
    
    return this.appSettings;
  }

  // Symptom Checker methods
  async getSymptomChecks(patientId: number): Promise<SymptomCheck[]> {
    return Array.from(this.symptomChecks.values())
      .filter(check => check.patientId === patientId)
      .sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime());
  }

  async getSymptomCheck(id: number): Promise<SymptomCheck | undefined> {
    return this.symptomChecks.get(id);
  }

  async createSymptomCheck(check: InsertSymptomCheck): Promise<SymptomCheck> {
    const id = this.currentSymptomCheckId++;
    const now = new Date();
    
    const symptomCheck: SymptomCheck = {
      ...check,
      id,
      analysis: null,
      recommendations: null,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    
    this.symptomChecks.set(id, symptomCheck);
    return symptomCheck;
  }

  async updateSymptomCheck(id: number, data: Partial<SymptomCheck>): Promise<SymptomCheck | undefined> {
    const existingCheck = this.symptomChecks.get(id);
    if (!existingCheck) return undefined;
    
    const updatedCheck: SymptomCheck = {
      ...existingCheck,
      ...data,
      updatedAt: new Date()
    };
    
    this.symptomChecks.set(id, updatedCheck);
    return updatedCheck;
  }

  async deleteSymptomCheck(id: number): Promise<boolean> {
    return this.symptomChecks.delete(id);
  }

  async analyzeSymptoms(checkId: number): Promise<SymptomCheck | undefined> {
    const check = this.symptomChecks.get(checkId);
    if (!check) return undefined;
    
    try {
      // Import the symptom analyzer
      const { analyzeSymptoms } = await import('./symptom-analyzer');
      
      // Use the knowledge-based symptom analyzer to analyze the symptoms
      const analyzedCheck = analyzeSymptoms(check);
      
      // Update the symptom check with the analysis results
      const updatedCheck: SymptomCheck = {
        ...analyzedCheck,
        updatedAt: new Date()
      };
      
      this.symptomChecks.set(checkId, updatedCheck);
      return updatedCheck;
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      
      // If there's an error in the symptom analyzer, return the original check with an error status
      const errorCheck: SymptomCheck = {
        ...check,
        status: 'error',
        updatedAt: new Date()
      };
      
      this.symptomChecks.set(checkId, errorCheck);
      return errorCheck;
    }
  }

  // Medical Document methods
  async getPatientDocuments(patientId: number): Promise<MedicalDocument[]> {
    return Array.from(this.medicalDocuments.values())
      .filter(doc => doc.patientId === patientId)
      .sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
  }

  async getDocument(id: number): Promise<MedicalDocument | undefined> {
    return this.medicalDocuments.get(id);
  }

  async createDocument(document: InsertMedicalDocument): Promise<MedicalDocument> {
    const id = this.currentDocumentId++;
    const now = new Date();
    
    const newDocument: MedicalDocument = {
      ...document,
      id,
      lastAccessed: null,
      isArchived: document.isArchived || false,
      category: document.category || "general",
      description: document.description || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.medicalDocuments.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, data: Partial<MedicalDocument>): Promise<MedicalDocument | undefined> {
    const existingDocument = this.medicalDocuments.get(id);
    if (!existingDocument) return undefined;
    
    const updatedDocument: MedicalDocument = {
      ...existingDocument,
      ...data,
      updatedAt: new Date()
    };
    
    this.medicalDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.medicalDocuments.delete(id);
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalPatients: number;
    todayAppointments: number;
    newPatients: number;
    smsReminders: number;
  }> {
    // Calculate new patients in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newPatients = Array.from(this.patients.values()).filter(
      patient => patient.createdAt >= oneWeekAgo
    ).length;
    
    return {
      totalPatients: this.patients.size,
      todayAppointments: (await this.getTodaysAppointments()).length,
      newPatients,
      smsReminders: this.smsRemindersSent
    };
  }
  
  // Sample data methods
  private createSampleData(): void {
    // Create demo patients with demo data
    const samplePatients = [
      { id: 1, patientId: 'PT-001', firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', 
        phone: '555-123-4567', dateOfBirth: new Date('1980-05-15'), gender: 'Male', 
        address: '123 Main St, Anytown, CA 90210', status: 'Active', 
        medicalHistory: 'Hypertension, Diabetes Type 2', smsOptIn: true },
      { id: 2, patientId: 'PT-002', firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@example.com', 
        phone: '555-234-5678', dateOfBirth: new Date('1992-08-23'), gender: 'Female', 
        address: '456 Oak Ave, Sometown, CA 90211', status: 'Active', 
        medicalHistory: 'Asthma, Allergies', smsOptIn: true },
      { id: 3, patientId: 'PT-003', firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@example.com', 
        phone: '555-345-6789', dateOfBirth: new Date('1975-12-10'), gender: 'Male', 
        address: '789 Pine Rd, Othertown, CA 90212', status: 'Inactive', 
        medicalHistory: 'Heart disease, High cholesterol', smsOptIn: false },
      { id: 4, patientId: 'PT-004', firstName: 'Sophia', lastName: 'Davis', email: 'sophia.davis@example.com', 
        phone: '555-456-7890', dateOfBirth: new Date('1988-03-30'), gender: 'Female', 
        address: '321 Elm St, Newtown, CA 90213', status: 'Active', 
        medicalHistory: 'Migraines, Depression', smsOptIn: true }
    ];
    
    // Add patients to the storage
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    samplePatients.forEach((patient, index) => {
      const createdAt = index < 2 ? lastMonth : today;
      const lastVisit = new Date(createdAt);
      lastVisit.setDate(lastVisit.getDate() + Math.floor(Math.random() * 10));
      
      const fullPatient: Patient = {
        ...patient,
        createdAt,
        updatedAt: createdAt,
        status: patient.status || 'Active',
        email: patient.email || null,
        lastVisit
      };
      
      this.patients.set(patient.id, fullPatient);
      this.currentPatientId = Math.max(this.currentPatientId, patient.id + 1);
    });
    
    console.log(`Created ${this.patients.size} sample patients`);
    
    // Create demo appointments
    const sampleAppointments = [
      { id: 1, patientId: 1, appointmentDate: new Date(), status: 'Scheduled', 
        reason: 'Annual check-up', notes: null, smsReminderSent: true },
      { id: 2, patientId: 2, appointmentDate: new Date(), status: 'Completed', 
        reason: 'Flu symptoms', notes: 'Patient was given antibiotics', smsReminderSent: true },
      { id: 3, patientId: 3, appointmentDate: new Date(today.getTime() - 86400000), status: 'Cancelled', 
        reason: 'Blood pressure check', notes: 'Patient cancelled due to work', smsReminderSent: false },
      { id: 4, patientId: 4, appointmentDate: new Date(today.getTime() + 86400000), status: 'Scheduled', 
        reason: 'Migraine follow-up', notes: null, smsReminderSent: true },
      { id: 5, patientId: 1, appointmentDate: new Date(today.getTime() + 172800000), status: 'Scheduled', 
        reason: 'Results review', notes: null, smsReminderSent: false },
      { id: 6, patientId: 2, appointmentDate: new Date(), status: 'Scheduled', 
        reason: 'Allergies consultation', notes: null, smsReminderSent: true }
    ];
    
    // Set some appointments for today at different hours
    const appointmentsToday = [1, 2, 6];
    appointmentsToday.forEach((index, i) => {
      const appointmentDate = new Date();
      appointmentDate.setHours(9 + i * 2, 0, 0, 0); // 9am, 11am, 1pm
      sampleAppointments[index-1].appointmentDate = appointmentDate;
    });
    
    // Add appointments to the storage
    sampleAppointments.forEach((appt) => {
      const now = new Date();
      now.setDate(now.getDate() - 3); // Created 3 days ago
      
      const appointment: Appointment = {
        ...appt,
        createdAt: now
      };
      
      this.appointments.set(appt.id, appointment);
      this.currentAppointmentId = Math.max(this.currentAppointmentId, appt.id + 1);
      
      // Count SMS reminders
      if (appt.smsReminderSent) {
        this.smsRemindersSent++;
      }
    });
    
    console.log(`Created ${this.appointments.size} sample appointments`);
    
    // Create patient history entries for completed appointments
    const histories = [
      { id: 1, patientId: 2, visitDate: sampleAppointments[1].appointmentDate, notes: 'Patient presented with fever and cough', 
        diagnosis: 'Influenza', treatment: 'Rest and fluids', prescriptions: 'Oseltamivir 75mg BID for 5 days' }
    ];
    
    histories.forEach((history) => {
      const entryDate = new Date(history.visitDate);
      entryDate.setHours(entryDate.getHours() + 1); // Created 1 hour after appointment
      
      const historyEntry: PatientHistory = {
        ...history,
        createdAt: entryDate
      };
      
      this.patientHistories.set(history.id, historyEntry);
      this.currentHistoryId = Math.max(this.currentHistoryId, history.id + 1);
    });
    
    console.log(`Created ${this.patientHistories.size} sample patient history entries`);
  }
}

import { DatabaseStorage } from './database-storage';

// Choose which storage implementation to use
const USE_DATABASE = process.env.USE_DATABASE === 'true';

export const storage = USE_DATABASE 
  ? new DatabaseStorage() 
  : new MemStorage();
