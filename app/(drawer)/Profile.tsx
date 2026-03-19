import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Platform } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const Profile = () => {
  const { user: authUser, isAuthenticated, isLoading, signInWithGoogle, signOut, refreshUser } = useAuth();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: authUser?.firstName && authUser?.lastName 
      ? `${authUser.firstName} ${authUser.lastName}` 
      : authUser?.firstName || '',
    phone: authUser?.phone || '',
    location: '', // Location not in user model yet
  });
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Update edit form when user changes
  useEffect(() => {
    if (authUser) {
      setEditForm({
        name: authUser.firstName && authUser.lastName 
          ? `${authUser.firstName} ${authUser.lastName}` 
          : authUser.firstName || '',
        phone: authUser.phone || '',
        location: '',
      });
    }
  }, [authUser]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to update user profile
      // For now, just show success message
      setTimeout(() => {
        setLoading(false);
        setIsEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
        // Refresh user data after update
        refreshUser();
      }, 1500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLocalAvatar(result.assets[0].uri);
        Alert.alert('Success', 'Profile picture updated!');
        // TODO: Upload to backend and update user profile
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      const response = await signInWithGoogle();

      // Web flow typically redirects away; avoid showing transient alerts.
      if (Platform.OS === "web") {
        return;
      }
      
      if (response.success) {
        Alert.alert('Success', 'Signed in successfully!');
        await refreshUser();
      } else {
        Alert.alert('Sign In Failed', response.error || 'Failed to sign in with Google');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      setSigningIn(false);
    }
  };

const handleLogout = () => {
  signOut();
};

  const menuItems = [
    {
      icon: '📋',
      title: 'My Listings',
      subtitle: 'View and manage your vehicles',
      onPress: () => Alert.alert('My Listings', 'Navigate to listings'),
    },
    {
      icon: '❤️',
      title: 'Favorites',
      subtitle: 'Saved vehicles',
      onPress: () => Alert.alert('Favorites', 'Navigate to favorites'),
    },
    {
      icon: '💬',
      title: 'Messages',
      subtitle: 'Chat with buyers/sellers',
      onPress: () => Alert.alert('Messages', 'Navigate to messages'),
    },
    {
      icon: '📊',
      title: 'Sales History',
      subtitle: 'View your transaction history',
      onPress: () => Alert.alert('Sales History', 'Navigate to sales'),
    },
    {
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => Alert.alert('Notifications', 'Navigate to settings'),
    },
    {
      icon: '⚙️',
      title: 'Settings',
      subtitle: 'App preferences and privacy',
      onPress: () => Alert.alert('Settings', 'Navigate to settings'),
    },
    {
      icon: '❓',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => Alert.alert('Help', 'Navigate to help center'),
    },
    {
      icon: 'ℹ️',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => Alert.alert('About', 'Hand2Mart v1.0.0'),
    },
  ];

  // Show loading state
  if (isLoading) {
    return <LoadingScreen title="Loading profile" subtitle="Getting your account ready" />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !authUser) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 28 }}>
          <LinearGradient
            colors={[Colors.primary[900], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-12 pb-10 px-6 rounded-b-3xl"
          >
            <Text className="text-white text-3xl font-extrabold">Welcome</Text>
            <Text className="text-white/80 text-sm mt-2">
              Sign in to manage listings, auctions, and your account.
            </Text>
          </LinearGradient>

          <View className="px-6" style={{ marginTop: -18 }}>
            <Card className="p-5">
              <View className="items-center">
                <Text className="text-5xl">🚗</Text>
                <Text className="text-xl font-extrabold text-gray-900 mt-3">
                  H2M Account
                </Text>
                <Text className="text-sm text-gray-600 text-center mt-2">
                  Quick and secure authentication.
                </Text>
              </View>

              <View className="mt-5">
                <Button
                  title={signingIn ? "Signing in..." : "Sign in with Google"}
                  leftIcon="logo-google"
                  onPress={handleSignIn}
                  loading={signingIn}
                  disabled={signingIn}
                />
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Format user name
  const userName = authUser.firstName && authUser.lastName
    ? `${authUser.firstName} ${authUser.lastName}`
    : authUser.firstName || authUser.email.split('@')[0];
  
  const userInitial = userName.charAt(0).toUpperCase();
  const joinedDate = authUser.createdAt 
    ? new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary[900], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-12 pb-8 px-5 rounded-b-3xl"
        >
          <View className="items-center">
            {/* Avatar */}
            <TouchableOpacity onPress={handleChangeAvatar} className="mb-4">
              <View className="relative">
                {(localAvatar || authUser.avatarUrl) ? (
                  <Image
                    source={{ uri: localAvatar || authUser.avatarUrl || '' }}
                    className="w-24 h-24 rounded-full border-4 border-white"
                  />
                ) : (
                  <View className="w-24 h-24 rounded-full bg-white items-center justify-center border-4 border-white">
                    <Text className="text-indigo-700 text-4xl font-extrabold">
                      {userInitial}
                    </Text>
                  </View>
                )}
                <View className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg">
                  <Text className="text-base">📷</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* User Info */}
            <Text className="text-white text-2xl font-extrabold mb-1">
              {userName}
            </Text>
            <Text className="text-blue-100 text-sm mb-1">{authUser.email}</Text>
            <Text className="text-blue-100 text-sm">
              Member since {joinedDate}
            </Text>
          </View>
          <View className="mt-4 w-full px-3">
            <Button
              title="Edit profile"
              variant="secondary"
              leftIcon="create-outline"
              onPress={() => {
                setEditForm({
                  name: userName,
                  phone: authUser.phone || "",
                  location: "",
                });
                setIsEditModalVisible(true);
              }}
            />
          </View>
        </LinearGradient>

        {/* Stats */}
        <View className="px-5" style={{ marginTop: -18 }}>
          <Card className="p-5">
            <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-extrabold text-gray-900">0</Text>
            <Text className="text-sm text-gray-500 mt-1">Listed</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-2xl font-extrabold text-gray-900">0</Text>
            <Text className="text-sm text-gray-500 mt-1">Sold</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-2xl font-extrabold text-gray-900">0</Text>
            <Text className="text-sm text-gray-500 mt-1">Active</Text>
          </View>
            </View>
          </Card>
        </View>

        {/* Contact */}
        <View className="px-5 mt-5">
          <Card className="p-5">
          <Text className="text-lg font-extrabold text-gray-900 mb-3">
            Contact Information
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-center py-2">
              <Text className="text-2xl mr-3">📧</Text>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Email</Text>
                <Text className="text-sm text-gray-900">{authUser.email}</Text>
              </View>
            </View>
            <View className="h-px bg-gray-200" />
            <View className="flex-row items-center py-2">
              <Text className="text-2xl mr-3">📱</Text>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Phone</Text>
                <Text className="text-sm text-gray-900">{authUser.phone || 'Not provided'}</Text>
              </View>
            </View>
            <View className="h-px bg-gray-200" />
            <View className="flex-row items-center py-2">
              <Text className="text-2xl mr-3">👤</Text>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Account Type</Text>
                <Text className="text-sm text-gray-900 capitalize">{authUser.userType}</Text>
              </View>
            </View>
            {authUser.isKycVerified && (
              <>
                <View className="h-px bg-gray-200" />
                <View className="flex-row items-center py-2">
                  <Text className="text-2xl mr-3">✅</Text>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">KYC Status</Text>
                    <Text className="text-sm text-green-600 font-semibold">Verified</Text>
                  </View>
                </View>
              </>
            )}
          </View>
          </Card>
        </View>

        {/* Menu */}
        <View className="px-5 mt-5">
          <Card className="p-0 overflow-hidden">
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                className="flex-row items-center p-4 active:bg-gray-50"
                onPress={item.onPress}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-xl">{item.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {item.title}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {item.subtitle}
                  </Text>
                </View>
                <Text className="text-gray-400 text-lg">›</Text>
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <View className="h-px bg-gray-100 ml-16" />
              )}
            </View>
          ))}
          </Card>
        </View>

        {/* Logout */}
        {isAuthenticated && (
          <View className="px-5 mt-5">
            <Button
              title="Logout"
              variant="danger"
              leftIcon="log-out-outline"
              onPress={handleLogout}
              loading={loading}
              disabled={loading}
            />
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text className="text-gray-500 text-2xl">✕</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Full name"
              value={editForm.name}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
              placeholder="Enter your name"
              containerClassName="mb-4"
            />
            <Input
              label="Phone number"
              value={editForm.phone}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, phone: text }))}
              placeholder="Enter your phone"
              keyboardType="phone-pad"
              containerClassName="mb-4"
            />
            <Input
              label="Location"
              value={editForm.location}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, location: text }))}
              placeholder="Enter your location"
            />

            <View className="flex-row mt-6" style={{ gap: 12 }}>
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsEditModalVisible(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={loading ? "Saving..." : "Save"}
                  onPress={handleUpdateProfile}
                  loading={loading}
                  disabled={loading}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
