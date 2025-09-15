import { RequestHandler } from "express";
import { DeviceDataPayload, WaterLevelReading } from "@shared/api";
import { database } from "../database";

// Receive data from Raspberry Pi devices
export const ingestWaterData: RequestHandler = async (req, res) => {
  try {
    const payload: DeviceDataPayload = req.body;

    // Validate required fields
    if (!payload.deviceId || payload.level === undefined) {
      return res.status(400).json({ 
        error: "Device ID and water level are required",
        received: payload 
      });
    }

    // Validate device exists
    const device = await database.getDeviceById(payload.deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Create the reading with current timestamp if not provided
    const reading: Omit<WaterLevelReading, 'id'> = {
      deviceId: payload.deviceId,
      level: payload.level,
      temperature: payload.temperature,
      batteryLevel: payload.batteryLevel,
      timestamp: payload.timestamp || new Date().toISOString()
    };

    // Validate the data ranges
    if (reading.level < 0) {
      return res.status(400).json({ error: "Water level cannot be negative" });
    }

    if (reading.temperature !== undefined && (reading.temperature < -50 || reading.temperature > 100)) {
      return res.status(400).json({ error: "Temperature must be between -50°C and 100°C" });
    }

    if (reading.batteryLevel !== undefined && (reading.batteryLevel < 0 || reading.batteryLevel > 100)) {
      return res.status(400).json({ error: "Battery level must be between 0% and 100%" });
    }

    // Save the reading
    const savedReading = await database.addWaterReading(reading);

    // Update device status and last seen timestamp
    await database.updateDeviceLastSeen(payload.deviceId);
    
    // Update device status to active if it was inactive
    if (device.status === 'inactive') {
      await database.updateDevice(payload.deviceId, { status: 'active' });
    }

    // Check alert thresholds
    const alerts = checkAlertThresholds(device, reading.level);

    res.status(201).json({
      message: "Data received successfully",
      reading: savedReading,
      alerts: alerts.length > 0 ? alerts : undefined
    });

  } catch (error) {
    console.error("Data ingestion error:", error);
    res.status(500).json({ error: "Failed to process water level data" });
  }
};

// Get recent readings for all devices (for dashboard)
export const getRecentReadings: RequestHandler = async (req, res) => {
  try {
    const { hours = '24' } = req.query;
    const hoursNum = parseInt(hours as string);
    
    if (isNaN(hoursNum) || hoursNum <= 0) {
      return res.status(400).json({ error: "Invalid hours parameter" });
    }

    const devices = await database.getAllDevices();
    const startDate = new Date(Date.now() - hoursNum * 60 * 60 * 1000).toISOString();
    
    const deviceReadings = await Promise.all(
      devices.map(async (device) => {
        const readings = await database.getWaterReadings(device.id, startDate);
        return {
          deviceId: device.id,
          deviceName: device.name,
          data: readings.map(r => ({
            timestamp: r.timestamp,
            level: r.level,
            temperature: r.temperature
          }))
        };
      })
    );

    res.json(deviceReadings);
  } catch (error) {
    console.error("Get recent readings error:", error);
    res.status(500).json({ error: "Failed to fetch recent readings" });
  }
};

// Batch data ingestion for multiple readings
export const ingestBatchWaterData: RequestHandler = async (req, res) => {
  try {
    const { readings }: { readings: DeviceDataPayload[] } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: "Readings array is required and cannot be empty" });
    }

    if (readings.length > 100) {
      return res.status(400).json({ error: "Maximum 100 readings per batch" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < readings.length; i++) {
      try {
        const payload = readings[i];

        // Validate required fields
        if (!payload.deviceId || payload.level === undefined) {
          errors.push({ index: i, error: "Device ID and water level are required" });
          continue;
        }

        // Validate device exists (cache this for performance)
        const device = await database.getDeviceById(payload.deviceId);
        if (!device) {
          errors.push({ index: i, error: "Device not found" });
          continue;
        }

        const reading: Omit<WaterLevelReading, 'id'> = {
          deviceId: payload.deviceId,
          level: payload.level,
          temperature: payload.temperature,
          batteryLevel: payload.batteryLevel,
          timestamp: payload.timestamp || new Date().toISOString()
        };

        const savedReading = await database.addWaterReading(reading);
        await database.updateDeviceLastSeen(payload.deviceId);

        results.push({ index: i, reading: savedReading });

      } catch (error) {
        errors.push({ index: i, error: "Failed to process reading" });
      }
    }

    res.status(201).json({
      message: `Processed ${results.length} readings successfully`,
      success: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Batch data ingestion error:", error);
    res.status(500).json({ error: "Failed to process batch data" });
  }
};

// Health check endpoint for devices
export const deviceHealthCheck: RequestHandler = async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    if (isNaN(deviceId)) {
      return res.status(400).json({ error: "Invalid device ID" });
    }

    const device = await database.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Update last seen
    await database.updateDeviceLastSeen(deviceId);

    res.json({
      message: "Health check successful",
      device: {
        id: device.id,
        name: device.name,
        status: device.status,
        lastSeen: new Date().toISOString()
      },
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error("Device health check error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
};

// Helper function to check alert thresholds
function checkAlertThresholds(device: any, level: number): string[] {
  const alerts: string[] = [];
  const { low, high } = device.settings.alertThresholds;

  if (level <= low) {
    alerts.push(`Water level critically low: ${level}m (threshold: ${low}m)`);
  } else if (level >= high) {
    alerts.push(`Water level critically high: ${level}m (threshold: ${high}m)`);
  }

  return alerts;
}
