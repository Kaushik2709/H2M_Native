import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";

export default function MyListings() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-3xl font-extrabold text-gray-900">My Listings</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Manage your posted vehicles and auctions.
        </Text>
      </View>
      <ScrollView className="flex-1 px-5">
        <View className="py-10">
          <EmptyState
            icon="car-outline"
            title="No listings yet"
            description="Create a listing from Sell to start getting offers."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
