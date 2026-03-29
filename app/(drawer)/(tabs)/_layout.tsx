import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Layout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerLeft: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <DrawerToggleButton tintColor="black" />
          </View>
        ),
        headerRightContainerStyle: { paddingRight: 15 },
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(drawer)/Notifications")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <FontAwesome name="bell" size={24} color="black" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hand2Mart",
          tabBarLabel: "HOME",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Auction"
        options={{
          title: "Auction",
          tabBarLabel: "AUCTION",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="gavel" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Sell"
        options={{
          title: "Sell",
          tabBarLabel: "SELL",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="plus-circle" size={size} color={color} />
          ),
        }}
      />
        <Tabs.Screen
          name="Bookings"
          options={{
            title: "Bookings",
            tabBarLabel: "BOOKINGS",
            tabBarIcon: ({ size, color }) => (
              <FontAwesome name="calendar" size={size} color={color} />
            ),
          }}
        />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarLabel: "PROFILE",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
