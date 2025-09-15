import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { LoginRequest, LoginResponse, User } from "@shared/api";
import { database } from "../database";

// Session storage (in production, use Redis or database)
const sessions = new Map<string, { userId: number; expiresAt: Date }>();

export const login: RequestHandler = async (req, res) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Get user from database
    const user = await database.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    sessions.set(sessionId, {
      userId: user.id,
      expiresAt
    });

    // Remove password hash from user object
    const { passwordHash, ...userWithoutPassword } = user;

    const response: LoginResponse = {
      user: userWithoutPassword,
      token: sessionId
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (token) {
    sessions.delete(token);
  }

  res.json({ message: "Logged out successfully" });
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    // In demo mode, always return a default demo user
    if (process.env.DEMO_MODE === 'true') {
      const demoUser = {
        id: 0,
        username: 'demo',
        email: 'demo@example.com',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return res.json({ user: demoUser });
    }

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const session = sessions.get(token);
    if (!session || session.expiresAt < new Date()) {
      sessions.delete(token);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await database.getUserById(session.userId);
    if (!user) {
      sessions.delete(token);
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to authenticate requests
export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    // In demo mode, bypass authentication and attach a demo admin user
    if (process.env.DEMO_MODE === 'true') {
      (req as any).user = {
        id: 0,
        username: 'demo',
        email: 'demo@example.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return next();
    }

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const session = sessions.get(token);
    if (!session || session.expiresAt < new Date()) {
      sessions.delete(token);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await database.getUserById(session.userId);
    if (!user) {
      sessions.delete(token);
      return res.status(401).json({ error: "User not found" });
    }

    // Add user to request object for downstream handlers
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to check if user is admin
export const requireAdmin: RequestHandler = (req, res, next) => {
  // In demo mode, everyone is treated as admin
  if (process.env.DEMO_MODE === 'true') {
    return next();
  }

  const user = (req as any).user as User;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Clean up expired sessions (call this periodically)
export const cleanupExpiredSessions = () => {
  const now = new Date();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
};

// Clean up expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
