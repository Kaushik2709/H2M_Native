import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";

export default function Favorites() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-3xl font-extrabold text-gray-900">Favorites</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Saved vehicles and auctions you want to track.
        </Text>
      </View>
      <ScrollView className="flex-1 px-5">
        <View className="py-10">
          <EmptyState
            icon="heart-outline"
            title="No favorites yet"
            description="Tap the heart on any listing to save it here."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
