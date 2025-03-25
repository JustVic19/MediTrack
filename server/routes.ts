import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPatientSchema, 
  insertAppointmentSchema, 
  insertPatientHistorySchema, 
  insertSettingsSchema, 
  insertUserSchema,
  insertSymptomCheckSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import { 
  authenticate, 
  register, 
  logout, 
  checkAuthStatus, 
  requireAuth, 
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword
} from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup express-session middleware
  app.use(
    session({
      secret: "meditrack-secret-key", // In production, this should be an environment variable
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Authentication routes
  app.post('/api/auth/login', authenticate);
  app.post('/api/auth/register', register);
  app.post('/api/auth/logout', logout);
  app.get('/api/auth/status', checkAuthStatus);
  app.post('/api/auth/request-password-reset', requestPasswordReset);
  app.post('/api/auth/reset-password', resetPassword);
  
  // Debug endpoint for development - would be removed in production
  app.get('/api/auth/users', async (req, res) => {
    try {
      const usersMap = storage.getUsers();
      const users = Array.from(usersMap.values());
      // Remove sensitive data like passwords
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  // prefix all routes with /api
  const apiRouter = app.route('/api');

  // Dashboard statistics endpoint
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  });

  // Patient endpoints
  app.get('/api/patients', async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      let patients;
      
      if (searchTerm) {
        patients = await storage.searchPatients(searchTerm);
      } else {
        patients = await storage.getAllPatients();
      }
      
      res.json(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  app.get('/api/patients/:id', async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.json(patient);
    } catch (error) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ error: 'Failed to fetch patient details' });
    }
  });

  app.post('/api/patients', async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const newPatient = await storage.createPatient(patientData);
      res.status(201).json(newPatient);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  });

  app.put('/api/patients/:id', async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patientData = insertPatientSchema.partial().parse(req.body);
      
      const updatedPatient = await storage.updatePatient(patientId, patientData);
      
      if (!updatedPatient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.json(updatedPatient);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Failed to update patient' });
    }
  });

  app.delete('/api/patients/:id', async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const result = await storage.deletePatient(patientId);
      
      if (!result) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ error: 'Failed to delete patient' });
    }
  });

  // Appointment endpoints
  app.get('/api/appointments', async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  app.get('/api/appointments/today', async (req, res) => {
    try {
      const appointments = await storage.getTodaysAppointments();
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s appointments' });
    }
  });

  app.get('/api/appointments/upcoming', async (req, res) => {
    try {
      const appointments = await storage.getUpcomingAppointments();
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
    }
  });

  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ error: 'Failed to fetch appointment details' });
    }
  });

  app.get('/api/patients/:patientId/appointments', async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const appointments = await storage.getAppointmentsByPatientId(patientId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      res.status(500).json({ error: 'Failed to fetch patient appointments' });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const newAppointment = await storage.createAppointment(appointmentData);
      res.status(201).json(newAppointment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error creating appointment:', error);
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  });

  app.put('/api/appointments/:id', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      
      const updatedAppointment = await storage.updateAppointment(appointmentId, appointmentData);
      
      if (!updatedAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  });

  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const result = await storage.deleteAppointment(appointmentId);
      
      if (!result) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  });

  app.post('/api/appointments/:id/send-reminder', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const result = await storage.sendAppointmentReminder(appointmentId);
      
      if (!result) {
        return res.status(400).json({ error: 'Failed to send appointment reminder' });
      }
      
      res.json({ success: true, message: 'Reminder sent successfully' });
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      res.status(500).json({ error: 'Failed to send appointment reminder' });
    }
  });

  // Patient History endpoints
  app.get('/api/patients/:patientId/history', async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const history = await storage.getAllPatientHistory(patientId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      res.status(500).json({ error: 'Failed to fetch patient history' });
    }
  });

  app.get('/api/patient-history/:id', async (req, res) => {
    try {
      const historyId = parseInt(req.params.id);
      const historyEntry = await storage.getPatientHistoryEntry(historyId);
      
      if (!historyEntry) {
        return res.status(404).json({ error: 'History entry not found' });
      }
      
      res.json(historyEntry);
    } catch (error) {
      console.error('Error fetching history entry:', error);
      res.status(500).json({ error: 'Failed to fetch history entry details' });
    }
  });

  app.post('/api/patient-history', async (req, res) => {
    try {
      const historyData = insertPatientHistorySchema.parse(req.body);
      const newHistoryEntry = await storage.createPatientHistory(historyData);
      res.status(201).json(newHistoryEntry);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error creating history entry:', error);
      res.status(500).json({ error: 'Failed to create history entry' });
    }
  });

  app.put('/api/patient-history/:id', async (req, res) => {
    try {
      const historyId = parseInt(req.params.id);
      const historyData = insertPatientHistorySchema.partial().parse(req.body);
      
      const updatedHistory = await storage.updatePatientHistory(historyId, historyData);
      
      if (!updatedHistory) {
        return res.status(404).json({ error: 'History entry not found' });
      }
      
      res.json(updatedHistory);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error updating history entry:', error);
      res.status(500).json({ error: 'Failed to update history entry' });
    }
  });

  app.delete('/api/patient-history/:id', async (req, res) => {
    try {
      const historyId = parseInt(req.params.id);
      const result = await storage.deletePatientHistory(historyId);
      
      if (!result) {
        return res.status(404).json({ error: 'History entry not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting history entry:', error);
      res.status(500).json({ error: 'Failed to delete history entry' });
    }
  });

  // Settings endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    try {
      const settingsData = insertSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateSettings(settingsData);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // User profile endpoints
  app.get('/api/user', requireAuth, async (req, res) => {
    try {
      // If we get here, requireAuth middleware has already verified that req.session.userId exists
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive information
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  app.patch('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const sessionUserId = req.session.userId as number;
      
      // Users can only update their own profile unless they're an admin
      if (userId !== sessionUserId && req.session.userRole !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to update this user' });
      }
      
      // Parse the updateable fields
      const updateSchema = insertUserSchema.partial().pick({
        fullName: true,
        email: true,
        profileImage: true
      });
      
      const userData = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive information
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
