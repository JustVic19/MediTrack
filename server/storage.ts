import { 
  User, InsertUser, users,
  Patient, InsertPatient, patients,
  Appointment, InsertAppointment, appointments, 
  PatientHistory, InsertPatientHistory, patientHistory,
  Settings, InsertSettings, settings
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

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private patientHistories: Map<number, PatientHistory>;
  private appSettings: Settings | undefined;
  
  private currentUserId: number;
  private currentPatientId: number;
  private currentAppointmentId: number;
  private currentHistoryId: number;
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
    
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentAppointmentId = 1;
    this.currentHistoryId = 1;
    this.smsRemindersSent = 0;

    // Add default user
    // Create user directly to avoid async issues in constructor
    const adminId = this.currentUserId++;
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
      passwordResetExpires: null
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
      passwordResetExpires: null
    };
    this.users.set(testId, testUser);
    
    console.log("Created default users:", this.users.size);

    // Initialize app settings
    this.appSettings = {
      id: 1,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
      reminderHoursInAdvance: 24,
      systemName: "MediTrack",
      createdAt: new Date()
    };
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
    const user: User = { 
      ...insertUser, 
      id, 
      isVerified: insertUser.isVerified !== undefined ? insertUser.isVerified : true,
      verificationToken: insertUser.verificationToken || null,
      verificationExpires: insertUser.verificationExpires || null,
      passwordResetToken: null,
      passwordResetExpires: null
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
    
    const patient: Patient = { 
      ...insertPatient,
      id,
      patientId,
      createdAt: new Date(),
      lastVisit: insertPatient.lastVisit || new Date()
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
    const now = new Date();
    
    return Array.from(this.appointments.values())
      .filter(appointment => new Date(appointment.appointmentDate) >= now)
      .sort((a, b) => 
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = { 
      ...insertAppointment,
      id,
      smsReminderSent: false,
      createdAt: new Date()
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
    const history: PatientHistory = { 
      ...insertHistory,
      id,
      createdAt: new Date()
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
    if (!this.appSettings) {
      this.appSettings = {
        id: 1,
        ...updateData,
        twilioAccountSid: updateData.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || "",
        twilioAuthToken: updateData.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || "",
        twilioPhoneNumber: updateData.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER || "",
        reminderHoursInAdvance: updateData.reminderHoursInAdvance || 24,
        systemName: updateData.systemName || "MediTrack",
        createdAt: new Date()
      };
    } else {
      this.appSettings = { ...this.appSettings, ...updateData };
    }
    
    return this.appSettings;
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
}

export const storage = new MemStorage();
