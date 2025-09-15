# SQLite3 Database Setup for Waleki

This guide will help you set up SQLite3 database for your Waleki water level monitoring system.

## Prerequisites

✅ **Already Installed**: SQLite3 dependencies are already in your package.json
- `better-sqlite3`: Modern SQLite3 client for Node.js
- `sqlite3`: Traditional SQLite3 client
- `bcrypt`: For password hashing

## Database Setup

### 1. Database File Location

The SQLite database will be automatically created at:
```
server/waleki.db
```

### 2. Automatic Setup

The database will be automatically initialized when you start the server. The setup includes:

- **Tables Creation**: Users, Devices, Water Readings
- **Indexes**: For better query performance
- **Triggers**: For automatic timestamp updates
- **Initial Data**: Admin user, sample devices, and readings

### 3. Initial Users

After setup, you'll have these default users:

| Username | Password | Role  | Email |
|----------|----------|-------|-------|
| `admin`  | `admin123` | admin | admin@waleki.com |
| `user`   | `user123`  | user  | user@waleki.com |

### 4. Sample Devices

The system will create 3 sample devices:
1. **North Field Well Monitor** - Active
2. **South Well Sensor** - Inactive  
3. **East Field Monitoring Station** - Active

## Starting the Application

### Development Mode

```bash
npm run dev
```

This will:
1. Start the frontend on `http://localhost:5173`
2. Initialize the SQLite database automatically
3. Create tables and seed initial data if not exists

### Production Mode

```bash
npm run build
npm start
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Devices Table
```sql
CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'error')),
  last_seen DATETIME,
  measurement_interval INTEGER NOT NULL DEFAULT 15,
  alert_threshold_low REAL NOT NULL DEFAULT 0.5,
  alert_threshold_high REAL NOT NULL DEFAULT 5.0,
  calibration_offset REAL NOT NULL DEFAULT 0,
  calibration_scale REAL NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Water Readings Table
```sql
CREATE TABLE water_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  level REAL NOT NULL,
  temperature REAL,
  battery_level INTEGER,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
);
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user

### Devices (Authenticated)
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device by ID
- `POST /api/devices` - Create device (admin only)
- `PUT /api/devices/:id` - Update device (admin only)
- `DELETE /api/devices/:id` - Delete device (admin only)
- `GET /api/devices/:id/readings` - Get device readings

### Users (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Data Ingestion
- `POST /api/data/ingest` - Add water level reading

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## IoT Device Integration

To send data from Raspberry Pi or other IoT devices:

```bash
curl -X POST http://your-domain.com/api/data/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": 1,
    "level": 2.35,
    "temperature": 22.5,
    "batteryLevel": 85,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## Database Management

### View Database (Optional)
If you want to inspect the database directly:

```bash
# Install SQLite3 CLI (if not already installed)
# On macOS: brew install sqlite3
# On Ubuntu: sudo apt-get install sqlite3
# On Windows: Download from https://sqlite.org/download.html

# Open database
sqlite3 server/waleki.db

# List tables
.tables

# View users
SELECT * FROM users;

# View devices  
SELECT * FROM devices;

# View recent readings
SELECT * FROM water_readings ORDER BY timestamp DESC LIMIT 10;

# Exit
.quit
```

### Backup Database
```bash
# Create backup
cp server/waleki.db server/waleki-backup-$(date +%Y%m%d).db

# Or use SQLite dump
sqlite3 server/waleki.db .dump > waleki-backup.sql
```

### Reset Database
If you need to start fresh:
```bash
# Stop the server first
# Delete the database file
rm server/waleki.db

# Restart the server - it will recreate everything
npm run dev
```

## Troubleshooting

### Database Locked Error
If you get "database is locked" errors:
```bash
# Check if any processes are using the database
lsof server/waleki.db

# Kill any hanging processes and restart
```

### Permission Errors
Make sure the server has write permissions:
```bash
chmod 755 server/
chmod 644 server/waleki.db  # if file exists
```

### Performance Issues
The database includes optimized indexes, but for large datasets:
- Consider partitioning old readings
- Implement data archival strategies
- Monitor query performance

## Next Steps

1. **Start the server**: `npm run dev`
2. **Login**: Use `admin` / `admin123`
3. **Test the system**: Add devices, view readings
4. **Connect IoT devices**: Use the data ingestion API
5. **Customize**: Modify schema as needed for your requirements

Your SQLite3 database is now ready to use! 🎉
