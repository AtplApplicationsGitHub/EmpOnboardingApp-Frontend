'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { authService } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        // TODO: API - Verify token validity with backend
        // GET /api/auth/verify-token
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (parseError) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First check user role to get expected role
      const roleCheck = await authService.checkUserRole(email);
      if (!roleCheck.exists) {
        throw new Error('User not found');
      }
      
      // Attempt login with credentials
      const response = await authService.login(email, password);
      
      // Validate that we got a proper response
      if (!response.accessToken) {
        throw new Error('Invalid credentials');
      }
      
      localStorage.setItem('token', response.accessToken);
      
      // Check if userId is valid before making findById call
      if (response.userId && response.userId !== null) {
        const userResponse = await authService.findById(response.userId);
        localStorage.setItem('user', JSON.stringify(userResponse));
        setUser(userResponse);
      } else {
        // Create user object with the correct role from role check
        const userFromAuth = {
          id: response.userId || 0,
          name: response.userName || email.split('@')[0],
          email: email,
          role: roleCheck.role, // Use the actual role from role check
          createdTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
        };
        localStorage.setItem('user', JSON.stringify(userFromAuth));
        setUser(userFromAuth);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (email: string, otp: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // OTP is for employees only, so we know the role
      const response = await authService.verifyOtp(email, otp);
      
      // Validate that we got a proper response
      if (!response.accessToken) {
        throw new Error('Invalid OTP');
      }
      
      localStorage.setItem('token', response.accessToken);
      
      // Check if userId is valid before making findById call  
      if (response.userId && response.userId !== null) {
        try {
          const userResponse = await authService.findById(response.userId);
          localStorage.setItem('user', JSON.stringify(userResponse));
          setUser(userResponse);
        } catch (findError) {
          // If findById fails, create employee user from auth response
          const employeeUser: User = {
            id: response.userId,
            name: response.userName || email.split('@')[0],
            email: email,
            role: 'employee', // OTP login is always for employees
            createdTime: new Date().toISOString(),
            updatedTime: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(employeeUser));
          setUser(employeeUser);
        }
      } else {
        // If no userId, create user from auth response  
        const mockEmployeeUser: User = {
          id: 0, // Default ID if not available
          name: response.userName || email.split('@')[0],
          email: email,
          role: 'employee',
          createdTime: new Date().toISOString(),
          updatedTime: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(mockEmployeeUser));
        setUser(mockEmployeeUser);
      }
    } catch (error: any) {
      setError(error.message || 'OTP verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    error,
    login,
    loginWithOtp,
    logout,
  }), [user, isLoading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};