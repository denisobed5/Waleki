import "dotenv/config";
import express from "express";
import cors from "cors";

// Import route handlers
import { login, logout, getCurrentUser, authenticate, requireAdmin } from "./routes/auth.js";
import {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceReadings,
  getDashboardStats
} from "./routes/devices.js";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
} from "./routes/users.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware for debugging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body ? 'with body' : 'no body');
    next();
  });

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "Waleki server is running";
    res.json({ message: ping, timestamp: new Date().toISOString() });
  });

  // Demo route
  app.get("/api/demo", (_req, res) => {
    res.json({ message: "Demo endpoint working" });
  });

  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);

  // Device routes
  app.get("/api/devices", authenticate, getAllDevices);
  app.get("/api/devices/:id", authenticate, getDeviceById);
  app.post("/api/devices", authenticate, requireAdmin, createDevice);
  app.put("/api/devices/:id", authenticate, requireAdmin, updateDevice);
  app.delete("/api/devices/:id", authenticate, requireAdmin, deleteDevice);
  app.get("/api/devices/:id/readings", authenticate, getDeviceReadings);

  // User management routes (admin only)
  app.get("/api/users", authenticate, requireAdmin, getAllUsers);
  app.get("/api/users/:id", authenticate, requireAdmin, getUserById);
  app.post("/api/users", authenticate, requireAdmin, createUser);
  app.put("/api/users/:id", authenticate, requireAdmin, updateUser);
  app.delete("/api/users/:id", authenticate, requireAdmin, deleteUser);
  app.post("/api/users/:id/change-password", authenticate, changePassword);

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticate, getDashboardStats);

  // Data ingestion endpoint for IoT devices
  app.post("/api/data/ingest", async (req, res) => {
    try {
      const { deviceId, level, temperature, batteryLevel, timestamp } = req.body;

      if (!deviceId || level === undefined) {
        return res.status(400).json({ error: "Device ID and level are required" });
      }

      // Import database here to avoid circular imports
      const { database } = await import("./database.js");

      const reading = await database.addWaterReading({
        deviceId: parseInt(deviceId),
        level: parseFloat(level),
        temperature: temperature ? parseFloat(temperature) : undefined,
        batteryLevel: batteryLevel ? parseInt(batteryLevel) : undefined,
        timestamp: timestamp || new Date().toISOString()
      });

      res.status(201).json(reading);
    } catch (error) {
      console.error("Data ingestion error:", error);
      res.status(500).json({ error: "Failed to ingest data" });
    }
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return app;
}
