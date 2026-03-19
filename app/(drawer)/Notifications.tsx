import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import {
  notificationService,
  Notification,
} from "../../services/notification.service";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingScreen } from "../../components/ui/LoadingScreen";

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "BID_PLACED":
      case "OUTBID":
        return "gavel";
      case "AUCTION_ENDED":
      case "AUCTION_WON":
        return "trophy";
      case "PAYMENT_RECEIVED":
        return "money";
      default:
        return "bell";
    }
  };

  const getTone = (type: string) => {
    if (type === "OUTBID" || type === "AUCTION_ENDED") return "danger" as const;
    if (type === "AUCTION_WON" || type === "PAYMENT_RECEIVED") return "success" as const;
    return "info" as const;
  };

  const headerSubtitle = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    return unread > 0 ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You're all caught up";
  }, [notifications]);

  const renderItem = ({ item }: { item: Notification }) => (
    <Card
      className={`p-0 mb-3 ${!item.isRead ? "border-indigo-100" : ""}`}
      variant="default"
    >
      <TouchableOpacity
        className="px-5 py-4 flex-row items-start"
        onPress={() => markAsRead(item.id)}
        style={{ gap: 12 }}
      >
        <View className={`w-12 h-12 rounded-2xl items-center justify-center ${!item.isRead ? "bg-indigo-50" : "bg-gray-100"}`}>
          <FontAwesome name={getIcon(item.type)} size={20} color={!item.isRead ? "#4F46E5" : "#6B7280"} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between" style={{ gap: 10 }}>
            <Text className={`text-base ${!item.isRead ? "font-extrabold" : "font-bold"} text-gray-900 flex-1`}>
              {item.title}
            </Text>
            <Badge label={item.type.replace(/_/g, " ")} tone={getTone(item.type)} />
          </View>
          <Text className="text-sm text-gray-600 mt-1 leading-5">{item.message}</Text>
          <Text className="text-xs text-gray-400 mt-2">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        {!item.isRead && <View className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />}
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return <LoadingScreen title="Loading notifications" subtitle="Fetching your latest updates" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-3xl font-extrabold text-gray-900">Notifications</Text>
        <Text className="text-sm text-gray-500 mt-1">{headerSubtitle}</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="pt-10">
            <EmptyState
              icon="notifications-outline"
              title="No notifications"
              description="When bids change or auctions end, updates will appear here."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
