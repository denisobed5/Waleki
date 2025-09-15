import { RequestHandler } from "express";
import { ExportRequest, TimeRange } from "@shared/api";
import { database } from "../database";

// Export device data in different formats
export const exportDeviceData: RequestHandler = async (req, res) => {
  try {
    const { deviceId, timeRange, format }: ExportRequest = req.body;

    if (!deviceId || !timeRange || !format) {
      return res.status(400).json({ error: "Device ID, time range, and format are required" });
    }

    // Validate device exists
    const device = await database.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Calculate time range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '30min':
        startDate.setMinutes(endDate.getMinutes() - 30);
        break;
      case '1hour':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case '6hours':
        startDate.setHours(endDate.getHours() - 6);
        break;
      case '1day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '1week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      default:
        startDate.setDate(endDate.getDate() - 1);
    }

    // Fetch data
    const readings = await database.getWaterReadings(
      deviceId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    const exportData = {
      device: {
        id: device.id,
        name: device.name,
        location: device.location,
      },
      timeRange,
      exportDate: new Date().toISOString(),
      dataPoints: readings.length,
      readings: readings.map(reading => ({
        timestamp: reading.timestamp,
        level: reading.level,
        temperature: reading.temperature,
        batteryLevel: reading.batteryLevel,
      }))
    };

    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${device.name.replace(/\s+/g, '_')}_${timeRange}_water_levels.json"`);
        res.json(exportData);
        break;

      case 'excel':
        // For Excel export, we'll return CSV format (simpler implementation)
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${device.name.replace(/\s+/g, '_')}_${timeRange}_water_levels.csv"`);
        
        const csvHeader = 'Timestamp,Water Level (m),Temperature (°C),Battery Level (%)\n';
        const csvRows = readings.map(reading => 
          `${reading.timestamp},${reading.level},${reading.temperature || ''},${reading.batteryLevel || ''}`
        ).join('\n');
        
        res.send(csvHeader + csvRows);
        break;

      case 'image':
        // For image export, return the data that the frontend can use to generate an image
        res.json({
          ...exportData,
          chartConfig: {
            width: 1200,
            height: 600,
            title: `${device.name} - Water Level Data (${timeRange})`,
            xAxisLabel: 'Time',
            yAxisLabel: 'Water Level (m)',
          }
        });
        break;

      default:
        res.status(400).json({ error: "Unsupported export format" });
    }

  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
};

// Get export data for preview (without downloading)
export const previewExportData: RequestHandler = async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const { timeRange = '1day' } = req.query;

    if (isNaN(deviceId)) {
      return res.status(400).json({ error: "Invalid device ID" });
    }

    const device = await database.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Calculate time range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange as TimeRange) {
      case '30min':
        startDate.setMinutes(endDate.getMinutes() - 30);
        break;
      case '1hour':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case '6hours':
        startDate.setHours(endDate.getHours() - 6);
        break;
      case '1day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '1week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      default:
        startDate.setDate(endDate.getDate() - 1);
    }

    const readings = await database.getWaterReadings(
      deviceId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Calculate statistics
    const levels = readings.map(r => r.level);
    const stats = levels.length > 0 ? {
      count: levels.length,
      min: Math.min(...levels),
      max: Math.max(...levels),
      average: levels.reduce((sum, level) => sum + level, 0) / levels.length,
      latest: levels[0], // readings are ordered DESC
    } : null;

    res.json({
      device: {
        id: device.id,
        name: device.name,
        location: device.location,
      },
      timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      stats,
      sampleReadings: readings.slice(0, 5), // First 5 readings as preview
      totalReadings: readings.length,
    });

  } catch (error) {
    console.error("Preview export error:", error);
    res.status(500).json({ error: "Failed to preview export data" });
  }
};
