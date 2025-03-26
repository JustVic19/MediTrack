import { Request, Response, NextFunction } from 'express';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from './storage';
import { Patient } from '@shared/schema';
import session from 'express-session';

// Extend the Express Session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
    patientId?: number;
    isPatient?: boolean;
  }
}

// Convert callback-based scrypt to Promise-based
const scryptAsync = promisify(scrypt);

// Helper function to hash a password with a salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Helper function to verify a password against a stored hash
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate a random token
export function generateToken(): { token: string, expires: Date } {
  const token = randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token expires in 24 hours
  return { token, expires };
}

// Patient login endpoint
export async function patientLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    console.log('Patient login attempt for:', username);
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find patient by portal username
    const patient = await storage.getPatientByPortalUsername(username);
    console.log('Patient found:', patient ? patient.id : 'none');
    
    if (!patient) {
      console.log('Patient not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if portal is enabled for this patient
    if (!patient.portalEnabled) {
      console.log('Portal not enabled for patient');
      return res.status(401).json({ error: 'Patient portal access is not enabled for this account' });
    }
    
    // Verify password
    const passwordValid = await comparePasswords(password, patient.portalPassword || '');
    console.log('Password validation:', passwordValid ? 'success' : 'failed');
    
    if (!passwordValid) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login time
    await storage.updatePatient(patient.id, { 
      portalLastLogin: new Date()
    });
    
    // Create session for patient
    req.session.patientId = patient.id;
    req.session.isPatient = true;
    
    // Force session save before responding
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
      }
      
      console.log('Session after login:', JSON.stringify({
        patientId: req.session.patientId,
        isPatient: req.session.isPatient,
        cookie: req.session.cookie
      }));
      
      // Return patient information (excluding sensitive data)
      const patientInfo = {
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        portalLastLogin: patient.portalLastLogin
      };
      
      console.log('Login successful for patient:', patient.patientId);
      res.json({ 
        success: true,
        patient: patientInfo
      });
    });
  } catch (error) {
    console.error('Patient login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
}

// Check patient authentication status
export async function checkPatientAuthStatus(req: Request, res: Response) {
  try {
    console.log('Session data:', JSON.stringify({
      patientId: req.session.patientId,
      isPatient: req.session.isPatient,
      cookie: req.session.cookie
    }));
    
    if (!req.session.patientId || !req.session.isPatient) {
      console.log('Patient not authenticated in session');
      return res.json({ isLoggedIn: false });
    }
    
    const patient = await storage.getPatient(req.session.patientId);
    console.log('Patient found:', patient ? patient.id : 'none');
    
    if (!patient || !patient.portalEnabled) {
      console.log('Patient not found or portal not enabled');
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
      });
      return res.json({ isLoggedIn: false });
    }
    
    // Return patient information (excluding sensitive data)
    const patientInfo = {
      id: patient.id,
      patientId: patient.patientId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      dateOfBirth: patient.dateOfBirth,
      portalLastLogin: patient.portalLastLogin
    };
    
    console.log('Patient authenticated:', patientInfo.patientId);
    res.json({ 
      isLoggedIn: true,
      patient: patientInfo
    });
  } catch (error) {
    console.error('Check patient auth status error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}

// Patient logout endpoint
export async function patientLogout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    res.json({ success: true });
  });
}

// Set/reset patient portal password
export async function setPatientPortalPassword(req: Request, res: Response) {
  try {
    const { patientId, token, password } = req.body;
    
    if (!patientId || !password) {
      return res.status(400).json({ error: 'Patient ID and new password are required' });
    }
    
    let patient: Patient | undefined;
    
    // If token is provided, verify it's valid
    if (token) {
      patient = await storage.getPatientByActivationToken(token);
      
      if (!patient || patient.patientId !== patientId) {
        return res.status(401).json({ error: 'Invalid or expired activation token' });
      }
      
      // Check if token is expired
      if (patient.portalActivationExpires && new Date() > new Date(patient.portalActivationExpires)) {
        return res.status(401).json({ error: 'Activation token has expired' });
      }
    } else {
      // Without a token, this is an admin action and requires admin authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Get the user to verify they're an admin
      const user = await storage.getUser(req.session.userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      patient = await storage.getPatientByPatientId(patientId);
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(password);
    
    // Update patient record
    await storage.updatePatient(patient.id, {
      portalPassword: hashedPassword,
      portalEnabled: true,
      portalActivationToken: null,
      portalActivationExpires: null
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Set patient password error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}

// Generate activation token for a patient
export async function generatePatientActivation(req: Request, res: Response) {
  try {
    const { patientId } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    
    // Verify admin access
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get the patient
    const patient = await storage.getPatientByPatientId(patientId);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Generate activation token with expiry
    const { token, expires } = generateToken();
    
    // If email is not available, generate a username
    let portalUsername = patient.email;
    if (!portalUsername) {
      // Create username from first initial and last name, lowercase, no spaces
      portalUsername = `${patient.firstName.charAt(0)}${patient.lastName}`.toLowerCase().replace(/\s+/g, '');
      
      // Check if username already exists
      const existingPatient = await storage.getPatientByPortalUsername(portalUsername);
      if (existingPatient) {
        // Add patient ID to make it unique
        portalUsername = `${portalUsername}${patient.id}`;
      }
    }
    
    // Update patient with token and username
    await storage.updatePatient(patient.id, {
      portalActivationToken: token,
      portalActivationExpires: expires,
      portalUsername: portalUsername
    });
    
    res.json({ 
      success: true,
      activationLink: `/patient-portal/activate?token=${token}&patientId=${patient.patientId}`,
      portalUsername: portalUsername,
      expiresAt: expires
    });
  } catch (error) {
    console.error('Generate activation error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}

// Middleware to check if patient is authenticated
export function requirePatientAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.patientId || !req.session.isPatient) {
    return res.status(401).json({ error: 'Patient authentication required' });
  }
  
  next();
}