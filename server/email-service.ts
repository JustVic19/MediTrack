import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';

// Email configuration
let transporter: nodemailer.Transporter;

export async function initializeEmailService() {
  // Check if we have SMTP credentials in environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production transporter
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('Email service initialized with production settings');
  } else {
    // For development/testing, log emails instead of sending
    console.log('No SMTP credentials found. Email service will log messages instead of sending.');
    
    // Create a preview transporter that just logs the emails
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
  }
}

export function generateVerificationToken(): { token: string, expires: Date } {
  // Generate a random token
  const token = cryptoRandomString({ length: 32, type: 'url-safe' });
  
  // Set expiration to 24 hours from now
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  return { token, expires };
}

export function generatePasswordResetToken(): { token: string, expires: Date } {
  // Generate a random token
  const token = cryptoRandomString({ length: 32, type: 'url-safe' });
  
  // Set expiration to 1 hour from now
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  
  return { token, expires };
}

export async function sendVerificationEmail(email: string, token: string, username: string, fullName: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@meditrack.com',
    to: email,
    subject: 'Verify Your MediTrack Account',
    text: `Hello ${fullName},\n\nThank you for registering with MediTrack. Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create this account, please ignore this email.\n\nBest regards,\nThe MediTrack Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Verify Your MediTrack Account</h2>
        <p>Hello ${fullName},</p>
        <p>Thank you for registering with MediTrack. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser: <a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create this account, please ignore this email.</p>
        <p>Best regards,<br>The MediTrack Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // For preview transport, log the email preview
    if (info.message) {
      console.log('Email Preview:', info.message);
    }
    
    console.log('Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string, username: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@meditrack.com',
    to: email,
    subject: 'Reset Your MediTrack Password',
    text: `Hello,\n\nYou requested to reset your password for your MediTrack account (${username}). Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this password reset, please ignore this email.\n\nBest regards,\nThe MediTrack Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Reset Your MediTrack Password</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your MediTrack account (${username}). Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser: <a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The MediTrack Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // For preview transport, log the email preview
    if (info.message) {
      console.log('Email Preview:', info.message);
    }
    
    console.log('Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}