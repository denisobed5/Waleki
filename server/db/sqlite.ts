import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Device, WaterLevelReading } from '@shared/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(__dirname, '../../waleki.db');

class SQLiteDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.init();
  }

  private init() {
    // Create tables
    this.createTables();
    // Insert initial data if tables are empty
    this.seedInitialData();
  }

  private createTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Devices table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'inactive',
        last_seen DATETIME,
        measurement_interval INTEGER NOT NULL DEFAULT 15,
        alert_threshold_low REAL NOT NULL DEFAULT 0.5,
        alert_threshold_high REAL NOT NULL DEFAULT 5.0,
        calibration_offset REAL NOT NULL DEFAULT 0,
        calibration_scale REAL NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Water level readings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS water_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        level REAL NOT NULL,
        temperature REAL,
        battery_level INTEGER,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_water_readings_device_timestamp 
      ON water_readings (device_id, timestamp DESC)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_water_readings_timestamp 
      ON water_readings (timestamp DESC)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_username 
      ON users (username)
    `);

    // Create trigger to update updated_at timestamp
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_users_updated_at
      AFTER UPDATE ON users FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_devices_updated_at
      AFTER UPDATE ON devices FOR EACH ROW
      BEGIN
        UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
  }

  private seedInitialData() {
    // Check if users table is empty
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      console.log('Seeding initial data...');
      
      // Create admin user
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      this.db.prepare(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `).run('admin', 'admin@waleki.com', adminPasswordHash, 'admin');

      // Create regular user
      const userPasswordHash = bcrypt.hashSync('user123', 10);
      this.db.prepare(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `).run('user', 'user@waleki.com', userPasswordHash, 'user');

      // Create sample devices
      const insertDevice = this.db.prepare(`
        INSERT INTO devices (name, location, description, status, measurement_interval, alert_threshold_low, alert_threshold_high)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertDevice.run(
        'North Field Well Monitor',
        'North Field, Plot A',
        'Primary water source monitoring for agricultural irrigation',
        'active',
        15,
        0.5,
        5.0
      );

      insertDevice.run(
        'South Well Sensor',
        'South Field, Main Well',
        'Backup water source monitoring',
        'inactive',
        30,
        1.0,
        4.5
      );

      insertDevice.run(
        'East Field Monitoring Station',
        'East Field, Sector B',
        'Secondary monitoring for crop irrigation',
        'active',
        20,
        0.8,
        4.0
      );

      // Generate sample water readings for device 1
      const insertReading = this.db.prepare(`
        INSERT INTO water_readings (device_id, level, temperature, battery_level, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < 48; i++) {
        const timestamp = new Date(Date.now() - i * 30 * 60 * 1000);
        const baseLevel = 2.5;
        const variation = Math.sin(i * 0.3) * 0.5 + Math.random() * 0.2 - 0.1;
        const level = Math.max(0.1, baseLevel + variation);
        const temperature = 20 + Math.random() * 10;
        const batteryLevel = Math.max(20, 100 - Math.floor(i / 2));

        insertReading.run(
          1,
          Math.round(level * 100) / 100,
          Math.round(temperature * 10) / 10,
          batteryLevel,
          timestamp.toISOString()
        );
      }

      console.log('Initial data seeded successfully!');
    }
  }

  // User methods
  async getUserById(id: number): Promise<User | null> {
    const row = this.db.prepare(`
      SELECT id, username, email, role, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getUserByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
    const row = this.db.prepare(`
      SELECT id, username, email, password_hash, role, created_at, updated_at
      FROM users WHERE username = ?
    `).get(username) as any;

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createUser(userData: { username: string; email: string; passwordHash: string; role: 'admin' | 'user' }): Promise<User> {
    const result = this.db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(userData.username, userData.email, userData.passwordHash, userData.role);

    const user = await this.getUserById(result.lastInsertRowid as number);
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  async updateUser(id: number, updates: Partial<{ username: string; email: string; role: 'admin' | 'user' }>): Promise<User | null> {
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.username !== undefined) {
      setParts.push('username = ?');
      values.push(updates.username);
    }
    if (updates.email !== undefined) {
      setParts.push('email = ?');
      values.push(updates.email);
    }
    if (updates.role !== undefined) {
      setParts.push('role = ?');
      values.push(updates.role);
    }

    if (setParts.length === 0) return await this.getUserById(id);

    values.push(id);

    this.db.prepare(`
      UPDATE users SET ${setParts.join(', ')}
      WHERE id = ?
    `).run(...values);

    return await this.getUserById(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async getAllUsers(): Promise<(User & { deviceCount?: number; lastLogin?: string; status: 'active' | 'inactive' | 'suspended' })[]> {
    const rows = this.db.prepare(`
      SELECT u.*, 
             COUNT(d.id) as device_count,
             'active' as status
      FROM users u
      LEFT JOIN devices d ON u.id = d.id
      GROUP BY u.id, u.username, u.email, u.role, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `).all() as any[];

    return rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deviceCount: row.device_count,
      status: row.status,
      lastLogin: row.updated_at // Using updated_at as last login for now
    }));
  }

  // Device methods
  async getAllDevices(): Promise<Device[]> {
    const rows = this.db.prepare(`
      SELECT id, name, location, description, status, last_seen,
             measurement_interval, alert_threshold_low, alert_threshold_high,
             calibration_offset, calibration_scale, created_at, updated_at
      FROM devices ORDER BY created_at DESC
    `).all() as any[];

    return rows.map(this.mapDeviceRow);
  }

  async getDeviceById(id: number): Promise<Device | null> {
    const row = this.db.prepare(`
      SELECT id, name, location, description, status, last_seen,
             measurement_interval, alert_threshold_low, alert_threshold_high,
             calibration_offset, calibration_scale, created_at, updated_at
      FROM devices WHERE id = ?
    `).get(id) as any;

    if (!row) return null;
    return this.mapDeviceRow(row);
  }

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'lastSeen'>): Promise<Device> {
    const result = this.db.prepare(`
      INSERT INTO devices (name, location, description, status, measurement_interval, 
                          alert_threshold_low, alert_threshold_high, calibration_offset, calibration_scale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      device.name,
      device.location,
      device.description || null,
      device.status,
      device.settings.measurementInterval,
      device.settings.alertThresholds.low,
      device.settings.alertThresholds.high,
      device.settings.calibration.offset,
      device.settings.calibration.scale
    );

    const newDevice = await this.getDeviceById(result.lastInsertRowid as number);
    if (!newDevice) throw new Error('Failed to create device');
    return newDevice;
  }

  async updateDevice(id: number, updates: Partial<Device>): Promise<Device | null> {
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      setParts.push('name = ?');
      values.push(updates.name);
    }
    if (updates.location !== undefined) {
      setParts.push('location = ?');
      values.push(updates.location);
    }
    if (updates.description !== undefined) {
      setParts.push('description = ?');
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      setParts.push('status = ?');
      values.push(updates.status);
    }
    if (updates.settings) {
      if (updates.settings.measurementInterval !== undefined) {
        setParts.push('measurement_interval = ?');
        values.push(updates.settings.measurementInterval);
      }
      if (updates.settings.alertThresholds) {
        if (updates.settings.alertThresholds.low !== undefined) {
          setParts.push('alert_threshold_low = ?');
          values.push(updates.settings.alertThresholds.low);
        }
        if (updates.settings.alertThresholds.high !== undefined) {
          setParts.push('alert_threshold_high = ?');
          values.push(updates.settings.alertThresholds.high);
        }
      }
      if (updates.settings.calibration) {
        if (updates.settings.calibration.offset !== undefined) {
          setParts.push('calibration_offset = ?');
          values.push(updates.settings.calibration.offset);
        }
        if (updates.settings.calibration.scale !== undefined) {
          setParts.push('calibration_scale = ?');
          values.push(updates.settings.calibration.scale);
        }
      }
    }

    if (setParts.length === 0) return await this.getDeviceById(id);

    values.push(id);

    this.db.prepare(`
      UPDATE devices SET ${setParts.join(', ')}
      WHERE id = ?
    `).run(...values);

    return await this.getDeviceById(id);
  }

  async deleteDevice(id: number): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM devices WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async updateDeviceLastSeen(id: number): Promise<void> {
    this.db.prepare('UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }

  // Water reading methods
  async addWaterReading(reading: Omit<WaterLevelReading, 'id'>): Promise<WaterLevelReading> {
    const result = this.db.prepare(`
      INSERT INTO water_readings (device_id, level, temperature, battery_level, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      reading.deviceId,
      reading.level,
      reading.temperature || null,
      reading.batteryLevel || null,
      reading.timestamp
    );

    // Update device last seen
    await this.updateDeviceLastSeen(reading.deviceId);

    const newReading = this.db.prepare(`
      SELECT id, device_id, level, temperature, battery_level, timestamp
      FROM water_readings WHERE id = ?
    `).get(result.lastInsertRowid) as any;

    return {
      id: newReading.id,
      deviceId: newReading.device_id,
      level: newReading.level,
      temperature: newReading.temperature,
      batteryLevel: newReading.battery_level,
      timestamp: newReading.timestamp
    };
  }

  async getWaterReadings(deviceId: number, startDate?: string, endDate?: string, limit?: number): Promise<WaterLevelReading[]> {
    let query = `
      SELECT id, device_id, level, temperature, battery_level, timestamp
      FROM water_readings 
      WHERE device_id = ?
    `;
    const params: any[] = [deviceId];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      level: row.level,
      temperature: row.temperature,
      batteryLevel: row.battery_level,
      timestamp: row.timestamp
    }));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalDevices: number;
    activeDevices: number;
    totalReadings: number;
    averageLevel: number;
    lastUpdate: string;
  }> {
    const deviceStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM devices
    `).get() as any;

    const readingStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(level) as avg_level,
        MAX(timestamp) as last_update
      FROM water_readings
    `).get() as any;

    return {
      totalDevices: deviceStats.total,
      activeDevices: deviceStats.active,
      totalReadings: readingStats.total,
      averageLevel: readingStats.avg_level || 0,
      lastUpdate: readingStats.last_update || new Date().toISOString()
    };
  }

  private mapDeviceRow(row: any): Device {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      description: row.description,
      status: row.status,
      lastSeen: row.last_seen,
      settings: {
        measurementInterval: row.measurement_interval,
        alertThresholds: {
          low: row.alert_threshold_low,
          high: row.alert_threshold_high
        },
        calibration: {
          offset: row.calibration_offset,
          scale: row.calibration_scale
        }
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const database = new SQLiteDatabase();
