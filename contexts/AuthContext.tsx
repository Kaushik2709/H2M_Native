import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, AuthResponse } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth service on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        const currentUser = authService.getUser();
        
        if (currentUser) {
          setUser(currentUser);
        } else if (authService.isAuthenticated()) {
          // Token exists but no user data, fetch profile
          const profileResponse = await authService.getProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      // Use WebBrowser method for better native support
      const response = await authService.signInWithGoogleWebBrowser();
      
      if (response.success && response.data) {
        setUser(response.data.user);
      }
      
      return response;
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Starting signout...');
      setIsLoading(true);
      
      // Clear user state FIRST so UI updates immediately
      // This ensures the Profile screen shows login prompt right away
      setUser(null);
      
      // Then call authService to clear tokens and storage
      await authService.signOut();
      
      console.log('✅ AuthContext: Signout successful, user state cleared');
    } catch (error: any) {
      console.error('❌ AuthContext: Sign out error:', error);
      // Ensure user state is cleared even if there's an error
      setUser(null);
      // Don't throw - we want logout to succeed even if backend call fails
      console.log('⚠️ AuthContext: Signout completed with errors, but user state cleared');
    } finally {
      setIsLoading(false);
      console.log('🚪 AuthContext: Signout process completed');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const profileResponse = await authService.getProfile();
      if (profileResponse.success && profileResponse.data) {
        setUser(profileResponse.data);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Check authentication status - user exists AND token exists
  const isAuthenticated = !!user && authService.isAuthenticated();

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

