#!/usr/bin/env node

/**
 * Database Verification Script for Waleki
 * 
 * This script verifies that the SQLite database is set up correctly
 * and all tables contain the expected data.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(__dirname, 'waleki.db');

console.log('🔍 Verifying Waleki SQLite Database...\n');

try {
  // Connect to database
  const db = new Database(DB_PATH);
  console.log('✅ Database connection successful');
  console.log(`📁 Database location: ${DB_PATH}\n`);

  // Check if tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();

  console.log('📊 Tables found:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });

  const expectedTables = ['users', 'devices', 'water_readings'];
  const missingTables = expectedTables.filter(
    expected => !tables.find(table => table.name === expected)
  );

  if (missingTables.length > 0) {
    console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ All required tables present\n');

  // Check users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const users = db.prepare('SELECT id, username, email, role FROM users').all();
  
  console.log(`👥 Users (${userCount.count} total):`);
  users.forEach(user => {
    console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
  });

  if (userCount.count === 0) {
    console.log('⚠️  No users found - database may not be initialized');
  }

  // Check devices
  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get();
  const devices = db.prepare('SELECT id, name, location, status FROM devices').all();
  
  console.log(`\n🔧 Devices (${deviceCount.count} total):`);
  devices.forEach(device => {
    console.log(`   - ${device.name} (${device.status}) - ${device.location}`);
  });

  // Check water readings
  const readingCount = db.prepare('SELECT COUNT(*) as count FROM water_readings').get();
  const recentReadings = db.prepare(`
    SELECT wr.level, wr.timestamp, d.name as device_name
    FROM water_readings wr
    JOIN devices d ON wr.device_id = d.id
    ORDER BY wr.timestamp DESC
    LIMIT 5
  `).all();

  console.log(`\n💧 Water Readings (${readingCount.count} total):`);
  console.log('   Recent readings:');
  recentReadings.forEach(reading => {
    const date = new Date(reading.timestamp).toLocaleString();
    console.log(`   - ${reading.device_name}: ${reading.level}m (${date})`);
  });

  // Check indexes
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log(`\n📈 Indexes (${indexes.length} total):`);
  indexes.forEach(index => {
    console.log(`   - ${index.name}`);
  });

  // Database file size
  const stats = await import('fs').then(fs => fs.promises.stat(DB_PATH));
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`\n📊 Database size: ${sizeMB} MB`);

  // Test a sample query
  console.log('\n🧪 Testing sample queries...');
  
  try {
    const authTest = db.prepare(`
      SELECT u.username, COUNT(wr.id) as reading_count
      FROM users u
      LEFT JOIN devices d ON 1=1
      LEFT JOIN water_readings wr ON d.id = wr.device_id
      WHERE u.role = 'admin'
      GROUP BY u.id, u.username
      LIMIT 1
    `).get();

    if (authTest) {
      console.log(`✅ Query test passed - Admin user: ${authTest.username}`);
    }

    const deviceTest = db.prepare(`
      SELECT d.name, COUNT(wr.id) as reading_count
      FROM devices d
      LEFT JOIN water_readings wr ON d.id = wr.device_id
      GROUP BY d.id, d.name
      ORDER BY reading_count DESC
      LIMIT 1
    `).get();

    if (deviceTest) {
      console.log(`✅ Device query passed - Top device: ${deviceTest.name} (${deviceTest.reading_count} readings)`);
    }

  } catch (queryError) {
    console.log(`❌ Query test failed: ${queryError.message}`);
  }

  db.close();

  console.log('\n🎉 Database verification completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - Tables: ${tables.length} (${expectedTables.length} required)`);
  console.log(`   - Users: ${userCount.count}`);
  console.log(`   - Devices: ${deviceCount.count}`);
  console.log(`   - Readings: ${readingCount.count}`);
  console.log(`   - Indexes: ${indexes.length}`);
  console.log(`   - Size: ${sizeMB} MB`);

  if (userCount.count >= 2 && deviceCount.count >= 1) {
    console.log('\n✅ Database is ready for use!');
    console.log('\n🚀 You can now start the server with: npm run dev');
    console.log('🔑 Login with: admin / admin123');
  } else {
    console.log('\n⚠️  Database needs initialization. Start the server to auto-create data.');
  }

} catch (error) {
  console.error('❌ Database verification failed:', error.message);
  
  if (error.code === 'SQLITE_CANTOPEN') {
    console.log('\n💡 The database file doesn\'t exist yet.');
    console.log('   This is normal for first-time setup.');
    console.log('   Start the server with "npm run dev" to create it automatically.');
  } else {
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Make sure you\'re running this from the project root');
    console.log('   2. Check file permissions on the server/ directory');
    console.log('   3. Ensure SQLite3 is properly installed');
    console.log('   4. Try deleting waleki.db and restarting the server');
  }
  
  process.exit(1);
}
