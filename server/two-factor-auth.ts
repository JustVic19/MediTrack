import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User } from '@shared/schema';

/**
 * Generate a new 2FA secret for a user
 */
export function generateSecret(username: string): {
  secret: string;
  otpauth_url: string;
} {
  return speakeasy.generateSecret({
    name: `MediTrack:${username}`,
    length: 20,
  });
}

/**
 * Generate a QR code for the 2FA setup
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a 2FA token against a user's secret
 */
export function verifyToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow for some time drift (2 intervals before/after)
  });
}

/**
 * Generate recovery codes for a user
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 10-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 12).toUpperCase();
    // Format as XXXX-XXXX-XXXX
    const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}`;
    codes.push(formattedCode);
  }
  return codes;
}

/**
 * Check if an account is locked due to too many failed login attempts
 */
export function isAccountLocked(user: User): boolean {
  if (!user.lockedUntil) return false;
  
  const now = new Date();
  return now < user.lockedUntil;
}

/**
 * Handle failed login attempt
 * Returns true if account should be locked
 */
export function handleFailedLoginAttempt(user: User): {
  shouldLock: boolean;
  lockedUntil: Date | null;
  attempts: number;
} {
  // Reset attempts if the account was locked but lock time has passed
  if (user.lockedUntil && new Date() > user.lockedUntil) {
    return {
      shouldLock: false,
      lockedUntil: null,
      attempts: 1 // Reset to first attempt
    };
  }
  
  const attempts = (user.loginAttempts || 0) + 1;
  
  // Lock the account after 5 failed attempts
  if (attempts >= 5) {
    // Lock for 15 minutes
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);
    
    return {
      shouldLock: true,
      lockedUntil,
      attempts
    };
  }
  
  return {
    shouldLock: false,
    lockedUntil: null,
    attempts
  };
}

/**
 * Reset login attempts after successful login
 */
export function resetLoginAttempts(): { 
  loginAttempts: number;
  lockedUntil: null;
  lastLoginAt: Date;
} {
  return {
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date()
  };
}