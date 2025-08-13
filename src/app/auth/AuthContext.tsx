'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
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
    // Check if user is logged in on app start
    const initializeAuth = async () => {
      console.log('Initializing auth context...');
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token) {
        // try {
        //   // Try to verify token is still valid by fetching fresh user data
        //   const userData = await authService.getCurrentUser();
        //   setUser(userData);
        //   // Update stored user data with fresh data
        //   localStorage.setItem('user', JSON.stringify(userData));
        // } catch (error) {
        //   // If API call fails, try to use stored user data as fallback
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              console.log('Using stored user data as fallback');
            } catch (parseError) {
              // If stored data is corrupt, clear everything
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              console.log('Stored user data corrupted, cleared');
            }
          } else {
            // No fallback available, clear token
            localStorage.removeItem('token');
            console.log('Token validation failed, user logged out');
          }
        }
      // }
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.accessToken);
      const userResponse = await authService.findById(response.userId);
      localStorage.setItem('user', JSON.stringify(userResponse));
      setUser(userResponse);
      console.log('Login successful, token stored');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
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
    console.log('User logged out, tokens cleared');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
  };

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