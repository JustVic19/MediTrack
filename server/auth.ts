import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Registration schema (based on insert user schema + validation)
const registerSchema = insertUserSchema.extend({
  role: z.enum(["doctor", "admin", "staff"]),
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

    const { username, password } = result.data;
    
    // Find user by username
    const user = await storage.getUserByUsername(username);
    
    // If user not found or password doesn't match
    if (!user || user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }

    // Set user in session
    if (req.session) {
      req.session.userId = user.id;
      req.session.userRole = user.role;
    }

    // Remove password from response
    const { password: _, ...safeUser } = user;
    
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

    // Create the user
    const newUser = await storage.createUser(userData);
    
    // Remove password from response
    const { password: _, ...safeUser } = newUser;
    
    return res.status(201).json({
      success: true,
      user: safeUser,
      message: "User registered successfully"
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
    req.session.destroy((err) => {
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
      
      // Remove password from response
      const { password: _, ...safeUser } = user;
      
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