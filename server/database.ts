import { db } from './db';
import {
  users, patients, appointments, patientHistory, settings,
  User, Patient, Appointment, PatientHistory, Settings
} from '@shared/schema';
import { add, sub, format } from 'date-fns';
import cryptoRandomString from 'crypto-random-string';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function initializeDatabase() {
  try {
    // Create tables if they don't exist using Drizzle migrations
    console.log('Initializing database tables...');
    
    // Execute any custom SQL if needed
    // e.g., db.execute('SET TIME ZONE "UTC";');
    
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function seedDatabase() {
  try {
    // Check if we already have users in the database
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }
    
    console.log('Seeding database with initial data...');
    
    // Create admin user
    const adminUser: User = await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('admin123'),
      fullName: 'Admin User',
      email: 'admin@meditrack.com',
      role: 'admin',
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null
    }).returning().then(rows => rows[0]);
    
    // Create test user
    const testUser: User = await db.insert(users).values({
      username: 'doctor',
      password: await hashPassword('doctor123'),
      fullName: 'Test Doctor',
      email: 'doctor@meditrack.com',
      role: 'doctor',
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null
    }).returning().then(rows => rows[0]);
    
    // Create sample patients
    const patientCount = 10;
    const samplePatients: Patient[] = [];
    
    for (let i = 0; i < patientCount; i++) {
      const gender = i % 2 === 0 ? 'male' : 'female';
      const patientId = `PT${cryptoRandomString({length: 6, type: 'numeric'})}`;
      const dateOfBirth = sub(new Date(), { years: 20 + i * 2 });
      
      const patient = await db.insert(patients).values({
        patientId,
        firstName: `FirstName${i + 1}`,
        lastName: `LastName${i + 1}`,
        email: `patient${i + 1}@example.com`,
        phone: `+1555${String(i + 1).padStart(7, '0')}`,
        dateOfBirth,
        gender,
        address: `${i + 1} Main St, City, State`,
        medicalHistory: i % 3 === 0 ? 'Diabetes, Hypertension' : (i % 3 === 1 ? 'Asthma' : null),
        smsOptIn: i % 3 === 0,
        status: i % 5 === 0 ? 'inactive' : 'active',
      }).returning().then(rows => rows[0]);
      
      samplePatients.push(patient);
    }
    
    // Create sample appointments
    const appointmentCount = 20;
    const today = new Date();
    const appointmentStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    
    for (let i = 0; i < appointmentCount; i++) {
      const patientIndex = i % patientCount;
      const patient = samplePatients[patientIndex];
      
      // Create appointments around today
      let appointmentDate = new Date();
      if (i % 3 === 0) {
        // Past appointments
        appointmentDate = sub(today, { days: i });
      } else if (i % 3 === 1) {
        // Today's appointments
        appointmentDate = add(today, { hours: i % 8 });
      } else {
        // Future appointments
        appointmentDate = add(today, { days: i % 10, hours: i % 8 });
      }
      
      const status = i % 3 === 0 ? 'completed' : (i < 3 ? 'scheduled' : appointmentStatuses[i % 4]);
      
      await db.insert(appointments).values({
        patientId: patient.id,
        appointmentDate,
        reason: i % 3 === 0 ? 'Annual checkup' : (i % 3 === 1 ? 'Follow-up' : 'Consultation'),
        status,
        notes: i % 2 === 0 ? 'Patient notes here' : null,
        smsReminderSent: i % 3 === 0
      }).returning();
    }
    
    // Create sample patient history
    for (let i = 0; i < patientCount; i++) {
      const patient = samplePatients[i];
      const historyEntryCount = 1 + (i % 3); // 1 to 3 history entries per patient
      
      for (let j = 0; j < historyEntryCount; j++) {
        const visitDate = sub(today, { months: j * 2, days: j * 3 });
        
        await db.insert(patientHistory).values({
          patientId: patient.id,
          visitDate,
          diagnosis: j === 0 ? 'Initial diagnosis' : `Follow-up diagnosis ${j}`,
          treatment: j === 0 ? 'Prescribed medication' : `Adjusted treatment ${j}`,
          notes: j === 0 ? 'First visit notes' : `Follow-up visit ${j} notes`,
          prescriptions: j === 0 ? 'Medication A, Medication B' : `Medication ${String.fromCharCode(65 + j)}`
        }).returning();
      }
    }
    
    // Create default settings
    await db.insert(settings).values({
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      reminderHoursInAdvance: 24,
      systemName: 'MediTrack Patient Management System'
    }).returning();
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}