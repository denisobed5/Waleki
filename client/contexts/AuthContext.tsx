import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginRequest } from '@shared/api';
import { FirebaseService } from '@/services/firebaseService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<User>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Initialize demo data on first load
    FirebaseService.initializeDemoData().catch((error) => {
      console.warn('Demo data initialization failed:', error);
    });
    
    // Listen for auth state changes
    const unsubscribe = FirebaseService.onAuthStateChanged((user) => {
      if (mounted) {
        setUser(user);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      // For backward compatibility, treat username as email if it contains @
      const email = credentials.username.includes('@') ? credentials.username : `${credentials.username}@waleki.com`;
      const { user, token: authToken } = await FirebaseService.login(email, credentials.password);
      setUser(user);
      setToken(authToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await FirebaseService.register(username, email, password);
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await FirebaseService.logout();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    register,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
