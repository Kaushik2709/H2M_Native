import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { authService } from "../services/auth.service";
import { onAuthError } from "../services/api.client";
import { User, AuthResponse } from "../types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        const currentUser = authService.getUser();

        if (currentUser) {
          setUser(currentUser);
        } else if (await authService.isAuthenticated()) {
          // Token exists but no user data, fetch profile
          const profileResponse = await authService.getProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth errors (e.g., token expired)
  useEffect(() => {
    const unsubscribe = onAuthError(() => {
      console.log("Auth error detected, signing out...");
      setUser(null);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await authService.signInWithGoogle();

      if (response.success && response.data) {
        setUser(response.data.user);
      }

      return response;
    } catch (error: any) {
      console.error("Sign in error:", error);
      return {
        success: false,
        error: error.message || "Failed to sign in",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Clear UI state immediately
      setUser(null);
      // Then clear backend/storage
      await authService.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // Ensure user is cleared even on error
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const profileResponse = await authService.getProfile();
      if (profileResponse.success && profileResponse.data) {
        setUser(profileResponse.data);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    try {
      const response = await authService.updateProfile(updates);
      if (response.success && response.data) {
        setUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }, []);

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signOut,
    refreshUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
