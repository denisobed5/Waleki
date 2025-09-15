import {
  User,
  Device,
  DashboardStats,
  WaterLevelReading,
  DeviceDataPayload,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  UserRole
} from '@shared/api';

import {
  auth,
  database,
  firestore
} from '../firebase';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseAuthUser
} from 'firebase/auth';

import {
  ref,
  push,
  set,
  get,
  child,
  onValue,
  off,
  update,
  remove,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp
} from 'firebase/database';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

export class FirebaseService {
  private static currentUser: User | null = null;
  private static authCallbacks: ((user: User | null) => void)[] = [];
  
  // Check if Firebase is properly initialized
  private static checkFirebaseInit() {
    if (!auth || !database || !firestore) {
      throw new Error('Firebase services not initialized. Please check your Firebase configuration.');
    }
  }

  // Initialize auth state listener
  static init() {
    try {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get user details from Firestore
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              this.currentUser = {
                id: firebaseUser.uid,
                username: userData.username,
                email: firebaseUser.email || '',
                role: userData.role || 'user',
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt
              };
            } else {
              console.warn('User document not found, creating basic user data');
              this.currentUser = {
                id: firebaseUser.uid,
                username: firebaseUser.email?.split('@')[0] || 'user',
                email: firebaseUser.email || '',
                role: 'user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            this.currentUser = {
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'user',
              email: firebaseUser.email || '',
              role: 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        } else {
          this.currentUser = null;
        }

        // Notify all listeners
        this.authCallbacks.forEach(callback => {
          try {
            callback(this.currentUser);
          } catch (error) {
            console.error('Error in auth callback:', error);
          }
        });
      });
    } catch (error) {
      console.error('Failed to initialize Firebase auth listener:', error);
    }
  }

  // Authentication methods
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    this.checkFirebaseInit();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    // Get user details from Firestore
    const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    const user: User = {
      id: firebaseUser.uid,
      username: userData.username,
      email: firebaseUser.email || '',
      role: userData.role || 'user',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };

    const token = await firebaseUser.getIdToken();
    
    return { user, token };
  }

  static async register(username: string, email: string, password: string, role: UserRole = 'user'): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    const now = new Date().toISOString();
    const userData = {
      username,
      email,
      role,
      createdAt: now,
      updatedAt: now
    };

    // Store user profile in Firestore
    await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);

    return {
      id: firebaseUser.uid,
      ...userData
    };
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }

  // Device management methods
  static async getDevices(): Promise<Device[]> {
    this.checkFirebaseInit();
    const devicesRef = ref(database, 'devices');
    const snapshot = await get(devicesRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const devicesData = snapshot.val();
    return Object.entries(devicesData).map(([id, data]: [string, any]) => ({
      id: parseInt(id),
      ...data
    }));
  }

  static async getDevice(id: number): Promise<Device> {
    const deviceRef = ref(database, `devices/${id}`);
    const snapshot = await get(deviceRef);
    
    if (!snapshot.exists()) {
      throw new Error('Device not found');
    }

    return {
      id,
      ...snapshot.val()
    };
  }

  static async createDevice(deviceData: CreateDeviceRequest): Promise<Device> {
    const devicesRef = ref(database, 'devices');
    
    // Generate a unique ID
    const deviceId = Date.now();
    const now = new Date().toISOString();
    
    const newDevice: Device = {
      id: deviceId,
      name: deviceData.name,
      location: deviceData.location,
      description: deviceData.description,
      status: 'inactive',
      lastSeen: null,
      settings: deviceData.settings,
      createdAt: now,
      updatedAt: now
    };

    await set(ref(database, `devices/${deviceId}`), newDevice);
    return newDevice;
  }

  static async updateDevice(id: number, deviceData: UpdateDeviceRequest): Promise<Device> {
    const deviceRef = ref(database, `devices/${id}`);
    const snapshot = await get(deviceRef);
    
    if (!snapshot.exists()) {
      throw new Error('Device not found');
    }

    const currentDevice = snapshot.val();
    const updatedDevice = {
      ...currentDevice,
      ...deviceData,
      updatedAt: new Date().toISOString()
    };

    await set(deviceRef, updatedDevice);
    return {
      id,
      ...updatedDevice
    };
  }

  static async deleteDevice(id: number): Promise<void> {
    const deviceRef = ref(database, `devices/${id}`);
    await remove(deviceRef);
    
    // Also remove all readings for this device
    const readingsRef = ref(database, `readings/${id}`);
    await remove(readingsRef);
  }

  // Device readings methods
  static async getDeviceReadings(
    deviceId: number,
    limit: number = 50
  ): Promise<WaterLevelReading[]> {
    const readingsRef = ref(database, `readings/${deviceId}`);
    const readingsQuery = query(readingsRef, orderByChild('timestamp'), limitToLast(limit));
    
    const snapshot = await get(readingsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }

    const readingsData = snapshot.val();
    return Object.entries(readingsData)
      .map(([id, data]: [string, any]) => ({
        id,
        deviceId,
        ...data
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Real-time listeners for device readings
  static onDeviceReadings(
    deviceId: number,
    callback: (readings: WaterLevelReading[]) => void,
    limit: number = 50
  ): () => void {
    const readingsRef = ref(database, `readings/${deviceId}`);
    const readingsQuery = query(readingsRef, orderByChild('timestamp'), limitToLast(limit));
    
    const unsubscribe = onValue(readingsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const readingsData = snapshot.val();
        const readings = Object.entries(readingsData)
          .map(([id, data]: [string, any]) => ({
            id,
            deviceId,
            ...data
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        callback(readings);
      } else {
        callback([]);
      }
    });

    return () => off(readingsQuery, 'value', unsubscribe);
  }

  // Real-time listeners for devices
  static onDevices(callback: (devices: Device[]) => void): () => void {
    const devicesRef = ref(database, 'devices');
    
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devicesData = snapshot.val();
        const devices = Object.entries(devicesData).map(([id, data]: [string, any]) => ({
          id: parseInt(id),
          ...data
        }));
        callback(devices);
      } else {
        callback([]);
      }
    });

    return () => off(devicesRef, 'value', unsubscribe);
  }

  // Data ingestion for IoT devices
  static async ingestData(data: DeviceDataPayload): Promise<void> {
    const { deviceId, level, temperature, batteryLevel, timestamp } = data;
    
    // Add reading to database
    const readingsRef = ref(database, `readings/${deviceId}`);
    const newReadingRef = push(readingsRef);
    
    const reading: Omit<WaterLevelReading, 'id'> = {
      deviceId,
      level,
      temperature,
      batteryLevel,
      timestamp: timestamp || new Date().toISOString()
    };

    await set(newReadingRef, reading);

    // Update device's lastSeen timestamp and status
    const deviceRef = ref(database, `devices/${deviceId}`);
    await update(deviceRef, {
      lastSeen: new Date().toISOString(),
      status: 'active'
    });
  }

  // Dashboard stats
  static async getDashboardStats(): Promise<DashboardStats> {
    const devicesRef = ref(database, 'devices');
    const devicesSnapshot = await get(devicesRef);
    
    let totalDevices = 0;
    let activeDevices = 0;
    
    if (devicesSnapshot.exists()) {
      const devices = Object.values(devicesSnapshot.val()) as Device[];
      totalDevices = devices.length;
      activeDevices = devices.filter(device => device.status === 'active').length;
    }

    // Get total readings count across all devices
    const readingsRef = ref(database, 'readings');
    const readingsSnapshot = await get(readingsRef);
    
    let totalReadings = 0;
    let levelSum = 0;
    let levelCount = 0;

    if (readingsSnapshot.exists()) {
      const allReadings = readingsSnapshot.val();
      Object.values(allReadings).forEach((deviceReadings: any) => {
        const readings = Object.values(deviceReadings) as WaterLevelReading[];
        totalReadings += readings.length;
        readings.forEach(reading => {
          levelSum += reading.level;
          levelCount++;
        });
      });
    }

    const averageLevel = levelCount > 0 ? Number((levelSum / levelCount).toFixed(2)) : 0;

    return {
      totalDevices,
      activeDevices,
      totalReadings,
      averageLevel,
      lastUpdate: new Date().toISOString()
    };
  }

  // Real-time dashboard stats
  static onDashboardStats(callback: (stats: DashboardStats) => void): () => void {
    const devicesRef = ref(database, 'devices');
    const readingsRef = ref(database, 'readings');
    
    let devicesData: any = {};
    let readingsData: any = {};
    
    const calculateStats = () => {
      const devices = Object.values(devicesData) as Device[];
      const totalDevices = devices.length;
      const activeDevices = devices.filter(device => device.status === 'active').length;
      
      let totalReadings = 0;
      let levelSum = 0;
      let levelCount = 0;

      Object.values(readingsData).forEach((deviceReadings: any) => {
        const readings = Object.values(deviceReadings) as WaterLevelReading[];
        totalReadings += readings.length;
        readings.forEach(reading => {
          levelSum += reading.level;
          levelCount++;
        });
      });

      const averageLevel = levelCount > 0 ? Number((levelSum / levelCount).toFixed(2)) : 0;

      callback({
        totalDevices,
        activeDevices,
        totalReadings,
        averageLevel,
        lastUpdate: new Date().toISOString()
      });
    };

    const devicesUnsubscribe = onValue(devicesRef, (snapshot) => {
      devicesData = snapshot.exists() ? snapshot.val() : {};
      calculateStats();
    });

    const readingsUnsubscribe = onValue(readingsRef, (snapshot) => {
      readingsData = snapshot.exists() ? snapshot.val() : {};
      calculateStats();
    });

    return () => {
      off(devicesRef, 'value', devicesUnsubscribe);
      off(readingsRef, 'value', readingsUnsubscribe);
    };
  }

  // Initialize demo data (for first-time setup)
  static async initializeDemoData(): Promise<void> {
    const devicesRef = ref(database, 'devices');
    const snapshot = await get(devicesRef);
    
    if (snapshot.exists()) {
      // Data already exists, don't overwrite
      return;
    }

    // Create demo devices
    const demoDevices = [
      {
        id: 1,
        name: "North Field Well Monitor",
        location: "North Field, Plot A",
        description: "Primary water source monitoring",
        status: "active" as const,
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
        status: "inactive" as const,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        settings: {
          measurementInterval: 30,
          alertThresholds: { low: 1.0, high: 4.5 },
          calibration: { offset: 0.1, scale: 1.05 },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    // Add devices to Firebase
    for (const device of demoDevices) {
      await set(ref(database, `devices/${device.id}`), device);
      
      // Add some demo readings
      const readingsRef = ref(database, `readings/${device.id}`);
      for (let i = 0; i < 10; i++) {
        const readingRef = push(readingsRef);
        const timestamp = new Date(Date.now() - i * 15 * 60 * 1000).toISOString();
        const level = 2 + Math.sin(i / 2) * 0.5 + (device.id === 2 ? -0.2 : 0);
        const temperature = 20 + Math.cos(i / 3) * 2;
        const batteryLevel = Math.max(20, 80 - i);
        
        await set(readingRef, {
          deviceId: device.id,
          level: Number(level.toFixed(2)),
          temperature: Number(temperature.toFixed(1)),
          batteryLevel,
          timestamp
        });
      }
    }
  }
}

// Initialize the Firebase service
FirebaseService.init();