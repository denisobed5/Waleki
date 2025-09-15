const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Demo devices data
const devices = [
  {
    id: 1,
    name: "North Field Well Monitor",
    location: "North Field, Plot A",
    description: "Primary water source monitoring",
    status: "active",
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    settings: {
      measurementInterval: 15,
      alertThresholds: { low: 0.5, high: 5.0 },
      calibration: { offset: 0, scale: 1 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "South Well Sensor",
    location: "South Field, Main Well",
    description: "Backup water source monitoring",
    status: "inactive",
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    settings: {
      measurementInterval: 30,
      alertThresholds: { low: 1.0, high: 4.5 },
      calibration: { offset: 0.1, scale: 1.05 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Middleware
app.use(
  cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
    credentials: true,
  }),
);
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
  next();
});

// Health check
app.get("/api/ping", (req, res) => {
  console.log("Ping endpoint hit");
  res.json({
    message: "Waleki API server is running",
    timestamp: new Date().toISOString(),
    server: "minimal",
  });
});

// Login endpoint
app.post("/api/auth/login", (req, res) => {
  console.log("Login request received");

  const { username, password } = req.body;

  if (!username || !password) {
    console.log("Missing username or password");
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  if (username === "admin" && password === "admin123") {
    const response = {
      user: {
        id: 1,
        username: "admin",
        email: "admin@waleki.com",
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: "demo-token-admin",
    };
    console.log("Login successful for admin");
    res.json(response);
  } else if (username === "user" && password === "user123") {
    const response = {
      user: {
        id: 2,
        username: "user",
        email: "user@waleki.com",
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: "demo-token-user",
    };
    console.log("Login successful for user");
    res.json(response);
  } else {
    console.log("Invalid credentials for username:", username);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  console.log("Logout request received");
  res.json({ message: "Logged out successfully" });
});

// Get current user endpoint
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  console.log("Me endpoint hit with auth header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No valid authorization token" });
  }

  const token = authHeader.substring(7);

  if (token === "demo-token-admin") {
    res.json({
      user: {
        id: 1,
        username: "admin",
        email: "admin@waleki.com",
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } else if (token === "demo-token-user") {
    res.json({
      user: {
        id: 2,
        username: "user",
        email: "user@waleki.com",
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } else {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Devices endpoint
app.get("/api/devices", (req, res) => {
  console.log("Devices endpoint hit");
  res.json(devices);
});

// Create device endpoint
app.post("/api/devices", (req, res) => {
  const { name, location, description, settings } = req.body || {};

  if (!name || !location || !settings || !settings.measurementInterval || !settings.alertThresholds || !settings.calibration) {
    return res.status(400).json({ error: "Name, location, and valid settings are required" });
  }

  const nextId = devices.length ? Math.max(...devices.map((d) => d.id)) + 1 : 1;
  const now = new Date().toISOString();
  const newDevice = {
    id: nextId,
    name,
    location,
    description: description || undefined,
    status: "inactive",
    lastSeen: null,
    settings,
    createdAt: now,
    updatedAt: now,
  };
  devices.push(newDevice);
  res.status(201).json(newDevice);
});

// Device detail endpoint
app.get("/api/devices/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const device = devices.find((d) => d.id === id);
  if (!device) {
    return res.status(404).json({ error: "Device not found" });
  }
  res.json(device);
});

// Update device endpoint
app.put("/api/devices/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = devices.findIndex((d) => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Device not found" });
  }

  const current = devices[idx];
  const { name, location, description, settings, status } = req.body || {};

  const updated = {
    ...current,
    ...(name !== undefined ? { name } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(settings !== undefined ? { settings } : {}),
    updatedAt: new Date().toISOString(),
  };

  devices[idx] = updated;
  res.json(updated);
});

// Delete device endpoint
app.delete("/api/devices/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = devices.findIndex((d) => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Device not found" });
  }
  devices.splice(idx, 1);
  res.json({ message: "Device deleted successfully" });
});

// Device readings endpoint
app.get("/api/devices/:id/readings", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const device = devices.find((d) => d.id === id);
  if (!device) {
    return res.status(404).json({ error: "Device not found" });
  }

  const limit = parseInt(req.query.limit, 10) || 10;
  const now = Date.now();
  const readings = Array.from({ length: limit }).map((_, idx) => {
    const t = new Date(now - idx * 15 * 60 * 1000).toISOString();
    const level = 2 + Math.sin(idx / 2) * 0.5 + (id === 2 ? -0.2 : 0);
    const temperature = 20 + Math.cos(idx / 3) * 2;
    const batteryLevel = 80 - idx;
    return {
      id: idx + 1,
      deviceId: id,
      level: Number(level.toFixed(2)),
      temperature: Number(temperature.toFixed(1)),
      timestamp: t,
      batteryLevel: Math.max(20, batteryLevel),
    };
  });

  res.json(readings);
});

// Dashboard stats endpoint
app.get("/api/dashboard/stats", (req, res) => {
  console.log("Dashboard stats endpoint hit");
  res.json({
    totalDevices: 2,
    activeDevices: 1,
    totalReadings: 48,
    averageLevel: 2.35,
    lastUpdate: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  console.log("404 for:", req.url);
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Waleki API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/ping`);
});
