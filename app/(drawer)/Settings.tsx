import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function Settings() {
  const { signOut, user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-3xl font-extrabold text-gray-900">Settings</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Preferences, privacy, and account controls.
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8" style={{ gap: 16 }}>
          <View>
            <Text className="text-xs font-extrabold text-gray-500 mb-2 tracking-widest">ACCOUNT</Text>
            <Card className="p-0" variant="default">
              <View className="p-5">
                <Text className="text-lg font-extrabold text-gray-900">
                  {user
                    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User"
                    : "User"}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {user?.email || "email@example.com"}
                </Text>
              </View>
            </Card>
          </View>

          <View>
            <Text className="text-xs font-extrabold text-gray-500 mb-2 tracking-widest">GENERAL</Text>
            <Card className="p-0" variant="default">
              <SettingsRow icon="notifications-outline" title="Notifications" />
              <Divider />
              <SettingsRow icon="lock-closed-outline" title="Privacy & Security" />
              <Divider />
              <SettingsRow icon="help-circle-outline" title="Help & Support" />
            </Card>
          </View>

          <View>
            <Button title="Sign out" variant="danger" leftIcon="log-out-outline" onPress={signOut} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Divider = () => <View className="h-px bg-gray-100" />;

const SettingsRow = ({
  icon,
  title,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
}) => (
  <TouchableOpacity className="flex-row items-center px-5 py-4">
    <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center">
      <Ionicons name={icon} size={20} color="#4F46E5" />
    </View>
    <Text className="flex-1 ml-3 text-base font-bold text-gray-900">{title}</Text>
    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);
