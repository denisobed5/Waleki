import { RequestHandler } from "express";
import { CreateDeviceRequest, UpdateDeviceRequest, Device, DashboardStats } from "@shared/api";
import { database } from "../database";

// Get all devices
export const getAllDevices: RequestHandler = async (req, res) => {
  try {
    const devices = await database.getAllDevices();
    res.json(devices);
  } catch (error) {
    console.error("Get devices error:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
};

// Get device by ID
export const getDeviceById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid device ID" });
    }

    const device = await database.getDeviceById(id);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json(device);
  } catch (error) {
    console.error("Get device error:", error);
    res.status(500).json({ error: "Failed to fetch device" });
  }
};

// Create new device (admin only)
export const createDevice: RequestHandler = async (req, res) => {
  try {
    const deviceData: CreateDeviceRequest = req.body;

    if (!deviceData.name || !deviceData.location || !deviceData.settings) {
      return res.status(400).json({ error: "Name, location, and settings are required" });
    }

    // Validate device settings
    if (!deviceData.settings.measurementInterval || 
        !deviceData.settings.alertThresholds || 
        !deviceData.settings.calibration) {
      return res.status(400).json({ error: "Invalid device settings" });
    }

    const newDevice = await database.createDevice({
      name: deviceData.name,
      location: deviceData.location,
      description: deviceData.description,
      status: 'inactive', // New devices start as inactive
      settings: deviceData.settings
    });

    res.status(201).json(newDevice);
  } catch (error) {
    console.error("Create device error:", error);
    res.status(500).json({ error: "Failed to create device" });
  }
};

// Update device (admin only)
export const updateDevice: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid device ID" });
    }

    const updates: UpdateDeviceRequest = req.body;
    
    const updatedDevice = await database.updateDevice(id, updates);
    if (!updatedDevice) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json(updatedDevice);
  } catch (error) {
    console.error("Update device error:", error);
    res.status(500).json({ error: "Failed to update device" });
  }
};

// Delete device (admin only)
export const deleteDevice: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid device ID" });
    }

    const deleted = await database.deleteDevice(id);
    if (!deleted) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("Delete device error:", error);
    res.status(500).json({ error: "Failed to delete device" });
  }
};

// Get device water level readings
export const getDeviceReadings: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid device ID" });
    }

    const { startDate, endDate, limit } = req.query;
    
    const readings = await database.getWaterReadings(
      id,
      startDate as string,
      endDate as string,
      limit ? parseInt(limit as string) : undefined
    );

    res.json(readings);
  } catch (error) {
    console.error("Get device readings error:", error);
    res.status(500).json({ error: "Failed to fetch device readings" });
  }
};

// Get dashboard statistics
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const devices = await database.getAllDevices();
    const totalDevices = devices.length;
    const activeDevices = devices.filter(d => d.status === 'active').length;

    // Get total readings count and average level from the last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let totalReadings = 0;
    let averageLevel = 0;
    let lastUpdate = '';

    // This is a simplified calculation - in a real app you'd want to optimize this
    for (const device of devices) {
      const readings = await database.getWaterReadings(
        device.id,
        yesterday.toISOString(),
        now.toISOString()
      );
      totalReadings += readings.length;
      
      if (readings.length > 0) {
        const deviceAverage = readings.reduce((sum, r) => sum + r.level, 0) / readings.length;
        averageLevel += deviceAverage;
        
        // Get the most recent timestamp
        const latestReading = readings[0]; // readings are ordered DESC by timestamp
        if (!lastUpdate || latestReading.timestamp > lastUpdate) {
          lastUpdate = latestReading.timestamp;
        }
      }
    }

    // Calculate overall average
    averageLevel = devices.length > 0 ? averageLevel / devices.length : 0;

    const stats: DashboardStats = {
      totalDevices,
      activeDevices,
      totalReadings,
      averageLevel: Math.round(averageLevel * 100) / 100, // Round to 2 decimal places
      lastUpdate: lastUpdate || new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
