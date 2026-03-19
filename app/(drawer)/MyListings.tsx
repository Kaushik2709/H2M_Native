import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyListings() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="p-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">My Listings</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <View className="items-center justify-center p-10">
          <Text className="text-gray-500 text-center">You haven't listed any vehicles yet.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
