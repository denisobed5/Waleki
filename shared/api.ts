/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * User roles for the water level monitoring system
 */
export type UserRole = 'admin' | 'user';

/**
 * User entity
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Device status
 */
export type DeviceStatus = 'active' | 'inactive' | 'error';

/**
 * Device entity
 */
export interface Device {
  id: number;
  name: string;
  location: string;
  description?: string;
  status: DeviceStatus;
  lastSeen: string | null;
  settings: DeviceSettings;
  createdAt: string;
  updatedAt: string;
}

/**
 * Device settings
 */
export interface DeviceSettings {
  measurementInterval: number; // in minutes
  alertThresholds: {
    low: number;
    high: number;
  };
  calibration: {
    offset: number;
    scale: number;
  };
}

/**
 * Water level reading
 */
export interface WaterLevelReading {
  id: number;
  deviceId: number;
  level: number; // in meters or centimeters
  temperature?: number; // in Celsius
  timestamp: string;
  batteryLevel?: number; // percentage
}

/**
 * Authentication requests
 */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Device management requests
 */
export interface CreateDeviceRequest {
  name: string;
  location: string;
  description?: string;
  settings: DeviceSettings;
}

export interface UpdateDeviceRequest {
  name?: string;
  location?: string;
  description?: string;
  settings?: DeviceSettings;
}

/**
 * Data ingestion from Raspberry Pi
 */
export interface DeviceDataPayload {
  deviceId: number;
  level: number;
  temperature?: number;
  batteryLevel?: number;
  timestamp?: string;
}

/**
 * Data export types
 */
export type ExportFormat = 'json' | 'excel' | 'image';
export type TimeRange = '30min' | '1hour' | '6hours' | '1day' | '1week';

export interface ExportRequest {
  deviceId: number;
  timeRange: TimeRange;
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
}

/**
 * Dashboard data
 */
export interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  totalReadings: number;
  averageLevel: number;
  lastUpdate: string;
}

export interface DeviceChartData {
  deviceId: number;
  deviceName: string;
  data: {
    timestamp: string;
    level: number;
    temperature?: number;
  }[];
}
