import { User, LoginRequest, LoginResponse, Device, DashboardStats } from '@shared/api';

// API base URL - will use the current domain in production
const API_BASE = '/api';

export class MockApiService {
  // Helper method to get auth headers
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('waleki_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Helper method for API requests
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    // Store token in localStorage
    localStorage.setItem('waleki_token', response.token);

    return response;
  }

  static async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      // Always remove token even if logout request fails
      localStorage.removeItem('waleki_token');
    }
  }

  static async getCurrentUser(token: string): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    return response.user;
  }

  // Device methods
  static async getDevices(): Promise<Device[]> {
    return this.request<Device[]>('/devices');
  }

  static async getDevice(id: number): Promise<Device> {
    return this.request<Device>(`/devices/${id}`);
  }

  static async createDevice(deviceData: any): Promise<Device> {
    return this.request<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData)
    });
  }

  static async updateDevice(id: number, deviceData: any): Promise<Device> {
    return this.request<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData)
    });
  }

  static async deleteDevice(id: number): Promise<void> {
    await this.request(`/devices/${id}`, { method: 'DELETE' });
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  // Water readings
  static async getDeviceReadings(
    deviceId: number,
    startDate?: string,
    endDate?: string,
    limit?: number
  ) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());

    const query = params.toString();
    const endpoint = `/devices/${deviceId}/readings${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  // User management methods
  static async getUsers(): Promise<any[]> {
    return this.request<any[]>('/users');
  }

  static async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  static async createUser(userData: any): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static async updateUser(id: number, userData: any): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  static async deleteUser(id: number): Promise<void> {
    await this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Data ingestion for IoT devices
  static async ingestData(data: {
    deviceId: number;
    level: number;
    temperature?: number;
    batteryLevel?: number;
    timestamp?: string;
  }): Promise<any> {
    return this.request('/data/ingest', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
