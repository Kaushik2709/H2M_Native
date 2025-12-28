import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authService } from '../../services/auth.service';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token?: string;
    refreshToken?: string;
    userId?: string;
    error?: string;
  }>();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error first
        if (params.error) {
          console.error('OAuth error:', params.error);
          router.replace('/(drawer)/Profile');
          return;
        }

        // Extract tokens from URL parameters
        const { token, refreshToken } = params;

        if (token && refreshToken) {
          console.log('✅ Received tokens, storing...');
          
          // Store tokens
          await authService.setTokens(token, refreshToken);
          
          // Fetch user profile
          const profileResponse = await authService.getProfile();
          if (profileResponse.success && profileResponse.data) {
            await authService.setUser(profileResponse.data);
            console.log('✅ User profile loaded');
          }

          // Small delay to ensure state is updated
          setTimeout(() => {
            router.replace('/(drawer)/Profile');
          }, 500);
        } else {
          console.error('❌ Missing tokens in callback');
          router.replace('/(drawer)/Profile');
        }
      } catch (error) {
        console.error('❌ Error handling OAuth callback:', error);
        router.replace('/(drawer)/Profile');
      }
    };

    // Only run if we have params
    if (params.token || params.error) {
      handleCallback();
    }
  }, [params.token, params.refreshToken, params.error, router]);

  return (
    <View className="flex-1 bg-gray-50 items-center justify-center">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-gray-600 mt-4">Completing sign in...</Text>
    </View>
  );
}

