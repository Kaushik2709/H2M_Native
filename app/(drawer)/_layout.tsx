import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Drawer } from "expo-router/drawer";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Layout() {
  const router = useRouter();
  return (
    <Drawer
      screenOptions={{
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(drawer)/Notifications")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              marginRight: 15,
            })}
          >
            <FontAwesome name="bell" size={24} color="black" />
          </Pressable>
        ),
          headerRightContainerStyle: { paddingRight: 15 }
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          title: "Hand2Mart",
        }}
      />

      <Drawer.Screen
        name="Profile"
        options={{
          title: "Profile",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="Auctions"
        options={{
          title: "Auctions",
        }}
      />
      <Drawer.Screen
        name="Sell"
        options={{
          title: "Sell",
        }}
      />
      <Drawer.Screen
        name="CreateAuction"
        options={{
          title: "Create Auction",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="Notifications"
        options={{
          title: "Notifications",
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({});
