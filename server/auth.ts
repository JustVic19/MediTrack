import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import session from "express-session";
import { 
  initializeEmailService, 
  generateVerificationToken, 
  generatePasswordResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail
} from "./email-service";
import {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateRecoveryCodes,
  isAccountLocked,
  handleFailedLoginAttempt,
  resetLoginAttempts
} from "./two-factor-auth";

// Extend express Request with session
declare module "express-session" {
  interface Session {
    userId?: number;
    userRole?: string;
  }
}

// Initialize email service
initializeEmailService().catch(err => {
  console.error('Failed to initialize email service:', err);
});

// Login schema
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  twoFactorToken: z.string().optional(),
});

// Registration schema (based on insert user schema + validation)
const registerSchema = insertUserSchema.extend({
  role: z.enum(["doctor", "admin", "staff"]),
});

// Verification token schema
const verificationTokenSchema = z.object({
  token: z.string().min(20)
});

// Email schema
const emailSchema = z.object({
  email: z.string().email()
});

// Password reset schema
const passwordResetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(6)
});

// 2FA setup schema
const setupTwoFactorSchema = z.object({
  password: z.string().min(6)
});

// 2FA verification schema
const verifyTwoFactorSchema = z.object({
  token: z.string().min(6)
});

// 2FA recovery schema
const recoveryTwoFactorSchema = z.object({
  code: z.string().min(12) // Format: XXXX-XXXX-XXXX
});

// Authenticate a user
export async function authenticate(req: Request, res: Response) {
  try {
    // Validate request body
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials format" 
      });
    }

    const { username, password, twoFactorToken } = result.data;
    
    // Find user by username
    const user = await storage.getUserByUsername(username);
    
    // If user not found or password doesn't match
    if (!user || user.password !== password) {
      // If user exists, handle failed login attempt
      if (user) {
        const failedLogin = handleFailedLoginAttempt(user);
        
        // Update user's login attempts
        await storage.updateUser(user.id, {
          loginAttempts: failedLogin.attempts,
          lockedUntil: failedLogin.lockedUntil
        });
        
        // Check if account is now locked
        if (failedLogin.shouldLock) {
          return res.status(200).json({
            success: false,
            message: "Your account has been temporarily locked due to too many failed login attempts. Please try again later."
          });
        }
      }
      
      return res.status(200).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }
    
    // Check if account is locked
    if (isAccountLocked(user)) {
      return res.status(200).json({
        success: false,
        message: "Your account is temporarily locked due to too many failed login attempts. Please try again later."
      });
    }
    
    // If 2FA is enabled, verify the token
    if (user.twoFactorEnabled) {
      // If no token provided, return a challenge
      if (!twoFactorToken) {
        return res.status(200).json({
          success: false,
          requiresTwoFactor: true,
          message: "Two-factor authentication code required"
        });
      }
      
      // Verify the provided token
      if (!user.twoFactorSecret || !verifyToken(twoFactorToken, user.twoFactorSecret)) {
        return res.status(200).json({
          success: false,
          requiresTwoFactor: true,
          message: "Invalid two-factor authentication code"
        });
      }
    }
    
    // Reset login attempts on successful login
    const loginReset = resetLoginAttempts();
    await storage.updateUser(user.id, loginReset);

    // Set user in session
    if (req.session) {
      req.session.userId = user.id;
      req.session.userRole = user.role;
    }

    // Remove sensitive data from response
    const { password: _, twoFactorSecret: __, twoFactorRecoveryCodes: ___, ...safeUser } = user;
    
    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred during authentication" 
    });
  }
}

// Register a new user
export async function register(req: Request, res: Response) {
  try {
    // Validate request body
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid registration data",
        errors: result.error.format()
      });
    }

    const userData = result.data;
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "Username already taken" 
      });
    }

    // Create the user (with verified status)
    const newUser = await storage.createUser({
      ...userData,
      isVerified: true,
      verificationToken: null,
      verificationExpires: null
    });
    
    // Set user in session (auto login after registration)
    if (req.session) {
      req.session.userId = newUser.id;
      req.session.userRole = newUser.role;
    }
    
    // Remove password from response
    const { password: _, ...safeUser } = newUser;
    
    return res.status(201).json({
      success: true,
      user: safeUser,
      message: "User registered successfully. You are now logged in."
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred during registration" 
    });
  }
}

// Logout the current user
export async function logout(req: Request, res: Response) {
  if (req.session) {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to logout" 
        });
      }
      
      res.clearCookie("connect.sid");
      return res.status(200).json({ 
        success: true, 
        message: "Logged out successfully" 
      });
    });
  } else {
    return res.status(200).json({ 
      success: true, 
      message: "Already logged out" 
    });
  }
}

// Check if user is authenticated
export async function checkAuthStatus(req: Request, res: Response) {
  try {
    if (req.session && req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        // User not found but session exists
        return res.status(200).json({ 
          isLoggedIn: false 
        });
      }
      
      // Check if account is locked
      if (isAccountLocked(user)) {
        return res.status(200).json({
          isLoggedIn: false,
          locked: true,
          message: "Your account is temporarily locked due to too many failed login attempts. Please try again later."
        });
      }
      
      // Remove sensitive data from response
      const { 
        password: _, 
        twoFactorSecret: __, 
        twoFactorRecoveryCodes: ___, 
        twoFactorBackupCodes: ____, 
        ...safeUser 
      } = user;
      
      return res.status(200).json({
        isLoggedIn: true,
        user: safeUser
      });
    }
    
    return res.status(200).json({ 
      isLoggedIn: false 
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    return res.status(500).json({ 
      isLoggedIn: false,
      error: "Failed to check authentication status" 
    });
  }
}

// Middleware to ensure user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  return res.status(401).json({ 
    success: false, 
    message: "Authentication required" 
  });
}

// Middleware to check for specific role
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId && req.session.userRole === role) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: "Insufficient permissions" 
    });
  };
}

// Verify email with token
export async function verifyEmail(req: Request, res: Response) {
  try {
    const result = verificationTokenSchema.safeParse({ token: req.query.token });
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid verification token" 
      });
    }

    const { token } = result.data;
    
    // Find user with this token
    const user = await storage.getUserByVerificationToken(token);
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired verification token" 
      });
    }
    
    // Check if token is expired
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "Verification token has expired. Please request a new one." 
      });
    }
    
    // Update user to verified
    await storage.updateUser(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null
    });
    
    // Set user in session (auto login after verification)
    if (req.session) {
      req.session.userId = user.id;
      req.session.userRole = user.role;
    }
    
    // Return success
    return res.status(200).json({ 
      success: true, 
      message: "Email verified successfully. You are now logged in." 
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred during email verification" 
    });
  }
}

// Resend verification email
export async function resendVerification(req: Request, res: Response) {
  try {
    const result = emailSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    const { email } = result.data;
    
    // Find user with this email
    const user = await storage.getUserByEmail(email);
    
    // Don't reveal if email exists or not
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: "If your email exists in our system, you will receive a verification email shortly." 
      });
    }
    
    // Check if already verified
    if (user.isVerified) {
      return res.status(200).json({ 
        success: true, 
        message: "Your email is already verified. You can log in." 
      });
    }
    
    // Generate new verification token
    const { token, expires } = generateVerificationToken();
    
    // Update user with new token
    await storage.updateUser(user.id, {
      verificationToken: token,
      verificationExpires: expires
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(
        user.email,
        token,
        user.username,
        user.fullName
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send verification email. Please try again later." 
      });
    }
    
    // Return success message (but don't confirm if email exists)
    return res.status(200).json({ 
      success: true, 
      message: "If your email exists in our system, you will receive a verification email shortly." 
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while resending the verification email" 
    });
  }
}

// Request password reset
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const result = emailSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    const { email } = result.data;
    
    // Find user with this email
    const user = await storage.getUserByEmail(email);
    
    // Don't reveal if email exists or not
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: "If your email exists in our system, you will receive a password reset email shortly." 
      });
    }
    
    // Generate password reset token
    const { token, expires } = generatePasswordResetToken();
    
    // Update user with reset token
    await storage.updateUser(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires
    });
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(
        user.email,
        token,
        user.username
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send password reset email. Please try again later." 
      });
    }
    
    // Return success message (but don't confirm if email exists)
    return res.status(200).json({ 
      success: true, 
      message: "If your email exists in our system, you will receive a password reset email shortly." 
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while requesting a password reset" 
    });
  }
}

// Reset password with token
export async function resetPassword(req: Request, res: Response) {
  try {
    const result = passwordResetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid password reset data" 
      });
    }

    const { token, password } = result.data;
    
    // Find user with this token
    const user = await storage.getUserByPasswordResetToken(token);
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }
    
    // Check if token is expired
    if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "Password reset token has expired. Please request a new one." 
      });
    }
    
    // Update user with new password and clear reset token
    await storage.updateUser(user.id, {
      password: password, // In a real system, we'd hash the password here
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    // Return success
    return res.status(200).json({ 
      success: true, 
      message: "Password has been reset successfully. You can now log in with your new password." 
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred during password reset" 
    });
  }
}

// Setup two-factor authentication
export async function setupTwoFactor(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    // Get user
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Validate request body
    const result = setupTwoFactorSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data"
      });
    }
    
    // Verify password
    const { password } = result.data;
    if (user.password !== password) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }
    
    // Generate 2FA secret
    const secretData = generateSecret(user.username);
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(secretData.otpauth_url);
    
    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();
    
    // Update user with secret (not enabled yet until verification)
    await storage.updateUser(user.id, {
      twoFactorSecret: secretData.secret,
      twoFactorRecoveryCodes: recoveryCodes,
      twoFactorEnabled: false // Will be enabled after verification
    });
    
    return res.status(200).json({
      success: true,
      secret: secretData.secret,
      qrCode: qrCodeUrl,
      recoveryCodes,
      message: "Two-factor authentication setup initialized. Please verify with a code from your authenticator app."
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during two-factor authentication setup"
    });
  }
}

// Verify and enable two-factor authentication
export async function verifyTwoFactor(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    // Get user
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Validate request body
    const result = verifyTwoFactorSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid token format"
      });
    }
    
    // Check if user has a secret
    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "Two-factor authentication not initialized. Please set up 2FA first."
      });
    }
    
    // Verify token
    const { token } = result.data;
    if (!verifyToken(token, user.twoFactorSecret)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }
    
    // Enable 2FA
    await storage.updateUser(user.id, {
      twoFactorEnabled: true
    });
    
    return res.status(200).json({
      success: true,
      message: "Two-factor authentication has been enabled successfully"
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during two-factor authentication verification"
    });
  }
}

// Disable two-factor authentication
export async function disableTwoFactor(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    // Get user
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Validate request body
    const result = setupTwoFactorSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data"
      });
    }
    
    // Verify password
    const { password } = result.data;
    if (user.password !== password) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }
    
    // Disable 2FA and remove secret
    await storage.updateUser(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: null,
      twoFactorBackupCodes: null
    });
    
    return res.status(200).json({
      success: true,
      message: "Two-factor authentication has been disabled successfully"
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while disabling two-factor authentication"
    });
  }
}

// Use recovery code for 2FA
export async function useRecoveryCode(req: Request, res: Response) {
  try {
    // Validate request body
    const loginData = loginSchema.safeParse(req.body);
    if (!loginData.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials format"
      });
    }
    
    const recoveryData = recoveryTwoFactorSchema.safeParse(req.body);
    if (!recoveryData.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid recovery code format"
      });
    }
    
    const { username, password } = loginData.data;
    const { code } = recoveryData.data;
    
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(200).json({
        success: false,
        message: "Invalid username or password"
      });
    }
    
    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorRecoveryCodes) {
      return res.status(400).json({
        success: false,
        message: "Two-factor authentication is not enabled for this account"
      });
    }
    
    // Check recovery code
    const recoveryCodes = user.twoFactorRecoveryCodes as string[];
    const validCode = recoveryCodes.includes(code);
    
    if (!validCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid recovery code"
      });
    }
    
    // Remove used recovery code
    const updatedCodes = recoveryCodes.filter(c => c !== code);
    
    // If that was the last code, generate new ones
    let newCodes = updatedCodes;
    let message = "Recovery code accepted";
    
    if (updatedCodes.length === 0) {
      newCodes = generateRecoveryCodes();
      message = "Recovery code accepted. This was your last recovery code. New codes have been generated.";
    }
    
    // Update user
    await storage.updateUser(user.id, {
      twoFactorRecoveryCodes: newCodes,
      ...resetLoginAttempts()
    });
    
    // Set session
    if (req.session) {
      req.session.userId = user.id;
      req.session.userRole = user.role;
    }
    
    // Remove sensitive data from response
    const { password: _, twoFactorSecret: __, twoFactorRecoveryCodes: ___, ...safeUser } = user;
    
    return res.status(200).json({
      success: true,
      user: safeUser,
      newRecoveryCodes: updatedCodes.length === 0 ? newCodes : undefined,
      message
    });
  } catch (error) {
    console.error("Recovery code error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the recovery code"
    });
  }
}