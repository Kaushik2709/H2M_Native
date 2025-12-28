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
        headerRight: () => (
          <Pressable onPress={() => router.push("/Profile")}>
            <FontAwesome
              name="user-circle"
              size={30}
              color="black"
              style={{ marginRight: 16 }}
            />
          </Pressable>
        ),
        headerLeft: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <DrawerToggleButton tintColor="black" />
          </View>
        ),
      }}
    >


      <Tabs.Screen
        name="index"
        options={{
          title: "Hand2Mart",
          tabBarLabel: "Cars",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="car" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Bikes"
        options={{
          title: "Hand2Mart",
          tabBarLabel: "Bikes",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="motorcycle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
