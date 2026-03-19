import { API_BASE } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Completes auth sessions on web (recommended by expo-web-browser)
WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_KEY = '@user_data';

export interface User {
  id: string;
  email: string;
  userType: 'buyer' | 'dealer' | 'admin';
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isKycVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: User;
  };
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type UpdateProfileInput = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatarUrl'>>;

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  /**
   * Initialize auth service - load tokens from storage
   */
  async initialize(): Promise<void> {
    try {
      const [token, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      this.token = token;
      this.refreshToken = refreshToken;
      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  /**
   * Get current access token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Start Google OAuth flow using WebBrowser (recommended for native)
   */
  async signInWithGoogleWebBrowser(): Promise<AuthResponse> {
    try {
      // Check if we're in Expo Go (development)
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      
      // Configure redirect URI
      // For Expo Go, use the Expo proxy redirect URI
      // For standalone builds, use custom scheme
      let redirectUri: string;
      
      if (isExpoGo) {
        // Use Expo proxy redirect URI for Expo Go (this is a public URL via Expo's proxy)
        redirectUri = AuthSession.makeRedirectUri({
          // useProxy: true, // This option may not be available in all versions
        });
        // For Expo Go, the redirect URI should be exp:// or a public URL
        console.log('🔐 Using Expo Go redirect URI:', redirectUri);
        
        // Verify it's a deep link or public URL
        if (!redirectUri.startsWith('exp://') && !redirectUri.startsWith('https://') && !redirectUri.startsWith('h2mnative://')) {
          console.warn('⚠️ Expo redirect URI may not be public:', redirectUri);
        }
      } else {
        // Use custom scheme for standalone builds
        redirectUri = AuthSession.makeRedirectUri({
          scheme: 'h2mnative',
          path: 'auth/callback',
        });
        console.log('🔐 Using custom scheme redirect URI:', redirectUri);
      }

      console.log('🔐 Starting OAuth flow with redirect URI:', redirectUri);
      console.log('🔐 Execution environment:', Constants.executionEnvironment);
      console.log('🔐 Platform:', Platform.OS);

      // For web platform, use the current origin as redirect URI
      if (Platform.OS === 'web') {
        // On web, use the current origin + /auth/callback as redirect URI
        if (typeof window !== 'undefined') {
          const webRedirectUri = `${window.location.origin}/auth/callback`;
          console.log('🌐 Web redirect URI:', webRedirectUri);
          const authUrl = `${API_BASE}/api/auth/google?redirect_uri=${encodeURIComponent(webRedirectUri)}`;
          console.log('🌐 Redirecting to OAuth URL:', authUrl);
          window.location.href = authUrl;
        }
        return {
          success: false,
          error: 'Redirecting to OAuth...',
        };
      }
      
      // Build OAuth URL with redirect_uri parameter for mobile
      // Ensure we're using the IP address, not localhost
      // Double-check that API_BASE doesn't contain localhost for mobile
      let mobileApiBase = API_BASE;
      if (mobileApiBase && mobileApiBase.includes('localhost')) {
        console.error('❌ ERROR: API_BASE contains localhost on mobile! This will not work.');
        console.error('❌ Current API_BASE:', mobileApiBase);
        console.error('❌ Platform:', Platform.OS);
        // Try to fix it by using the IP from config
        const LOCAL_IP = "10.207.239.202";
        mobileApiBase = `http://${LOCAL_IP}:3001`;
        console.log('✅ Fixed API_BASE to:', mobileApiBase);
      }
      
      const authUrl = `${mobileApiBase}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log('📱 Mobile OAuth URL:', authUrl);
      console.log('📱 API_BASE:', mobileApiBase);
      console.log('📱 Redirect URI:', redirectUri);
      
      // Verify the URL doesn't contain localhost (for mobile platforms)
      if (mobileApiBase && authUrl.includes('localhost')) {
        const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';
        if (isMobile) {
          console.error('❌ CRITICAL: OAuth URL contains localhost on mobile device!');
          console.error('❌ This will fail on physical devices.');
          throw new Error('OAuth URL contains localhost. Check API_BASE configuration.');
        }
      }
      
      // For Expo Go, try using Linking.openURL as fallback
      if (isExpoGo) {
        console.log('🔐 Opening OAuth URL in Expo Go...');
        try {
          // First try WebBrowser
          if (WebBrowser && WebBrowser.openAuthSessionAsync) {
            const result = await WebBrowser.openAuthSessionAsync(
              authUrl,
              redirectUri
            );
            console.log('🔐 WebBrowser result:', result.type);
            console.log('🔐 WebBrowser result data:', JSON.stringify(result, null, 2));
            
            // Handle different result types
            const resultUrl = (result as any).url || (result as any).redirectUri;
            
            if (result.type === 'success' && resultUrl) {
              return await this.handleOAuthCallback(resultUrl);
            } else if (result.type === 'cancel') {
              return {
                success: false,
                error: 'OAuth cancelled by user',
              };
            }
          }
          
          // Fallback: Use Linking.openURL for Expo Go
          console.log('🔐 Falling back to Linking.openURL');
          const canOpen = await Linking.canOpenURL(authUrl);
          if (canOpen) {
            await Linking.openURL(authUrl);
            // Note: In Expo Go, the redirect will come back through Linking
            // We'll handle it in the app's Linking configuration
            return {
              success: false,
              error: 'Please complete OAuth in browser and return to app',
            };
          } else {
            throw new Error('Cannot open OAuth URL');
          }
        } catch (error: any) {
          console.error('🔐 OAuth error in Expo Go:', error);
          // Try direct Linking as last resort
          try {
            await Linking.openURL(authUrl);
            return {
              success: false,
              error: 'Opening OAuth in browser. Please return to app after signing in.',
            };
          } catch (linkError) {
            throw new Error(`Failed to open OAuth: ${error.message}`);
          }
        }
      }
      
      // For standalone builds, use WebBrowser
      if (!WebBrowser || !WebBrowser.openAuthSessionAsync) {
        throw new Error('WebBrowser is not available on this platform');
      }
      
      console.log('🔐 Opening OAuth in WebBrowser for standalone build...');
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log('🔐 OAuth result:', result.type);
      console.log('🔐 OAuth result data:', JSON.stringify(result, null, 2));
      
      // Handle different result types
      const resultUrl = (result as any).url || (result as any).redirectUri;
      
      if (result.type === 'success' && resultUrl) {
        return await this.handleOAuthCallback(resultUrl);
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'OAuth cancelled by user',
        };
      }

      return {
        success: false,
        error: 'Authentication failed',
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in with Google',
      };
    }
  }

  /**
   * Public entrypoint used by AuthContext.
   * Delegates to the WebBrowser-based OAuth implementation.
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    return this.signInWithGoogleWebBrowser();
  }

  /**
   * Handle OAuth callback URL and extract tokens
   */
  private async handleOAuthCallback(callbackUrl: string): Promise<AuthResponse> {
    try {
      // Extract tokens from callback URL
      const { token, refreshToken, userId } = this.extractTokensFromUrl(callbackUrl);
      
      if (token && refreshToken) {
        await this.setTokens(token, refreshToken);
        
        // Fetch user profile
        const profileResponse = await this.getProfile();
        if (profileResponse.success && profileResponse.data) {
          return {
            success: true,
            data: {
              token,
              refreshToken,
              user: profileResponse.data,
            },
          };
        } else {
          // Tokens saved but profile fetch failed - still return success with basic info
          return {
            success: true,
            data: {
              token,
              refreshToken,
              user: {
                id: userId || '',
                email: '',
                userType: 'buyer' as const,
                isKycVerified: false,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }
      } else {
        return {
          success: false,
          error: 'Failed to extract tokens from callback',
        };
      }
    } catch (error: any) {
      console.error('Error handling OAuth callback:', error);
      return {
        success: false,
        error: error.message || 'Failed to process OAuth callback',
      };
    }
  }

  private extractTokensFromUrl(url: string): {
    token: string | null;
    refreshToken: string | null;
    userId: string | null;
  } {
    try {
      const parsed = Linking.parse(url);
      const params = parsed.queryParams || {};
      
      return {
        token: (params.token as string) || null,
        refreshToken: (params.refreshToken as string) || null,
        userId: (params.userId as string) || null,
      };
    } catch (error) {
      console.error('Error extracting tokens from URL:', error);
      return { token: null, refreshToken: null, userId: null };
    }
  }

  /**
   * Store tokens and user data
   */
  async setTokens(token: string, refreshToken: string): Promise<void> {
    try {
      this.token = token;
      this.refreshToken = refreshToken;
      
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Set user data
   */
  async setUser(user: User): Promise<void> {
    try {
      this.user = user;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  /**
   * Get user profile from API
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        await this.setUser(data.data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        success: false,
        error: 'Failed to fetch user profile',
      };
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(updates: UpdateProfileInput): Promise<ApiResponse<User>> {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.firstName !== undefined) payload.firstName = updates.firstName;
      if (updates.lastName !== undefined) payload.lastName = updates.lastName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.avatarUrl !== undefined) payload.avatarUrl = updates.avatarUrl;

      const response = await this.makeAuthenticatedRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const data: ApiResponse<User> = await response.json();

      if (data.success && data.data) {
        await this.setUser(data.data);
      }

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data: ApiResponse<{ token: string }> = await response.json();

      if (data.success && data.data?.token) {
        this.token = data.data.token;
        await AsyncStorage.setItem(TOKEN_KEY, data.data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      console.log('🚪 Starting signout process...');
      
      // Ensure we have the latest token (in case it wasn't initialized)
      if (!this.token) {
        await this.initialize();
      }
      
      // Call backend signout endpoint if token exists
      if (this.token) {
        try {
          console.log('🚪 Calling backend signout endpoint...');
          const response = await fetch(`${API_BASE}/api/auth/signout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend signout successful:', data);
          } else {
            const errorText = await response.text();
            console.warn('⚠️ Backend signout returned non-OK status:', response.status, errorText);
          }
        } catch (error: any) {
          // Log but don't fail - signout should work even if backend call fails
          console.warn('⚠️ Signout API call failed (non-critical):', error.message);
        }
      } else {
        console.log('ℹ️ No token to send to backend');
      }

      // Clear local storage - this is the critical part
      // Always clear storage even if backend call failed
      console.log('🚪 Clearing local tokens and user data...');
      
      // Clear in-memory state first
      // IMPORTANT: Clear token first so isAuthenticated() returns false immediately
      const hadToken = !!this.token;
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      
      console.log('🚪 In-memory state cleared. Had token:', hadToken);

      // Clear persistent storage
      try {
        await Promise.all([
          AsyncStorage.removeItem(TOKEN_KEY),
          AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
          AsyncStorage.removeItem(USER_KEY),
        ]);
        console.log('✅ AsyncStorage cleared successfully');
      } catch (storageError: any) {
        console.error('❌ Error clearing AsyncStorage:', storageError);
        // Don't throw - we've already cleared in-memory state
      }
      
      console.log('✅ Signout complete - all data cleared');
    } catch (error: any) {
      console.error('❌ Error signing out:', error);
      // Even if there's an error, try to clear local state
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      try {
        await Promise.all([
          AsyncStorage.removeItem(TOKEN_KEY),
          AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
          AsyncStorage.removeItem(USER_KEY),
        ]);
      } catch (e) {
        // Ignore storage errors
      }
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Ensure token is loaded if not already
    if (!this.token) {
      await this.initialize();
    }

    const fullUrl = `${API_BASE}${endpoint}`;
    console.log(`🌐 Making request to: ${fullUrl}`);

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only set Content-Type if not FormData (FormData sets it automatically with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      console.warn('⚠️ No auth token available for request:', endpoint);
    }

    try {
      let response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      console.log(`📡 Response status: ${response.status} for ${endpoint}`);

      // If token expired, try to refresh
      if (response.status === 401 && this.refreshToken) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          console.log('✅ Token refreshed, retrying request...');
          // Retry request with new token
          const retryHeaders: Record<string, string> = {
            ...(options.headers as Record<string, string>),
          };
          if (!(options.body instanceof FormData)) {
            retryHeaders['Content-Type'] = 'application/json';
          }
          retryHeaders['Authorization'] = `Bearer ${this.token}`;
          response = await fetch(fullUrl, {
            ...options,
            headers: retryHeaders,
          });
          console.log(`📡 Retry response status: ${response.status}`);
        }
      }

      return response;
    } catch (error: any) {
      console.error(`❌ Network error for ${endpoint}:`, error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        code: error.code,
        API_BASE,
        fullUrl,
      });
      
      // Re-throw with more context
      throw new Error(`Network request failed: ${error.message}. Check if backend is running at ${API_BASE}`);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

