import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/api/ping", (_req, res) => {
  console.log('Ping endpoint hit');
  res.json({ 
    message: "Waleki server is running", 
    timestamp: new Date().toISOString(),
    server: "standalone"
  });
});

// Demo route
app.get("/api/demo", (_req, res) => {
  console.log('Demo endpoint hit');
  res.json({ message: "Demo endpoint working" });
});

// Login route
app.post("/api/auth/login", (req, res) => {
  try {
    console.log('Login request received:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    if (username === 'admin' && password === 'admin123') {
      const response = { 
        user: { 
          id: 1, 
          username: 'admin', 
          email: 'admin@waleki.com', 
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'demo-token-admin'
      };
      console.log('Login successful for admin');
      res.json(response);
    } else if (username === 'user' && password === 'user123') {
      const response = { 
        user: { 
          id: 2, 
          username: 'user', 
          email: 'user@waleki.com', 
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'demo-token-user'
      };
      console.log('Login successful for user');
      res.json(response);
    } else {
      console.log('Invalid credentials for username:', username);
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// Logout route
app.post("/api/auth/logout", (req, res) => {
  console.log('Logout request received');
  res.json({ message: "Logged out successfully" });
});

// Get current user route
app.get("/api/auth/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Me endpoint hit with auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No valid authorization token" });
    }

    const token = authHeader.substring(7);
    
    if (token === 'demo-token-admin') {
      res.json({
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@waleki.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } else if (token === 'demo-token-user') {
      res.json({
        user: {
          id: 2,
          username: 'user',
          email: 'user@waleki.com',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mock devices endpoint
app.get("/api/devices", (req, res) => {
  console.log('Devices endpoint hit');
  res.json([
    {
      id: 1,
      name: 'North Field Well Monitor',
      location: 'North Field, Plot A',
      description: 'Primary water source monitoring',
      status: 'active',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      settings: {
        measurementInterval: 15,
        alertThresholds: { low: 0.5, high: 5.0 },
        calibration: { offset: 0, scale: 1 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'South Well Sensor',
      location: 'South Field, Main Well',
      description: 'Backup water source monitoring',
      status: 'inactive',
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      settings: {
        measurementInterval: 30,
        alertThresholds: { low: 1.0, high: 4.5 },
        calibration: { offset: 0.1, scale: 1.05 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
});

// Dashboard stats
app.get("/api/dashboard/stats", (req, res) => {
  console.log('Dashboard stats endpoint hit');
  res.json({
    totalDevices: 2,
    activeDevices: 1,
    totalReadings: 48,
    averageLevel: 2.35,
    lastUpdate: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use("*", (req, res) => {
  console.log('404 for:', req.url);
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Waleki API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/ping`);
});

export default app;
