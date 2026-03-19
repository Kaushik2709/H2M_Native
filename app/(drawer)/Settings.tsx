import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
  const { signOut, user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="p-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>
      
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-sm font-bold text-gray-500 mb-2 uppercase">Account</Text>
          
          <View className="bg-gray-50 p-4 rounded-xl mb-6">
            <Text className="font-medium text-gray-900">{user?.name || 'User'}</Text>
            <Text className="text-gray-500 text-sm">{user?.email || 'email@example.com'}</Text>
          </View>

          <Text className="text-sm font-bold text-gray-500 mb-2 uppercase">General</Text>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="notifications-outline" size={22} color="#4B5563" />
            <Text className="flex-1 ml-3 text-base text-gray-700">Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100">
             <Ionicons name="lock-closed-outline" size={22} color="#4B5563" />
            <Text className="flex-1 ml-3 text-base text-gray-700">Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100 mb-6">
             <Ionicons name="help-circle-outline" size={22} color="#4B5563" />
            <Text className="flex-1 ml-3 text-base text-gray-700">Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={signOut}
            className="flex-row items-center justify-center p-4 bg-red-50 rounded-xl"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="ml-2 font-bold text-red-500">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
