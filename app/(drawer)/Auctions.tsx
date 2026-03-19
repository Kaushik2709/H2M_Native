import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { auctionService, Auction } from '../../services/auction.service';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const AuctionsScreen = ({ navigation }: any) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const router = useRouter()

  const visibleAuctions = useMemo(() => {
    let filtered = auctions;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((auction) =>
        auction.vehicle?.title?.toLowerCase().includes(q) ||
        auction.vehicle?.brand?.toLowerCase().includes(q) ||
        auction.vehicle?.model?.toLowerCase().includes(q) ||
        auction.vehicle?.city?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((auction) => auction.status === statusFilter);
    }

    if (vehicleTypeFilter !== "all") {
      filtered = filtered.filter(
        (auction) => auction.vehicle?.vehicleType === vehicleTypeFilter,
      );
    }

    return filtered;
  }, [auctions, searchTerm, statusFilter, vehicleTypeFilter]);

  const fetchAuctions = async () => {
    try {
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (vehicleTypeFilter !== 'all') {
        filters.vehicleType = vehicleTypeFilter;
      }

      const response = await auctionService.getAuctions(filters);
      if (response.success && response.data) {
        setAuctions(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch auctions');
      }
    } catch (err) {
      console.error('Error fetching auctions:', err);
      Alert.alert('Error', 'Failed to fetch auctions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch auctions when screen comes into focus (and when filters change)
  useFocusEffect(
    React.useCallback(() => {
      fetchAuctions();
    }, [statusFilter, vehicleTypeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuctions();
  };

  
  const handleQuickBid = async (auctionId: string) => {
    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) return;

    const bidAmount = auction.currentBid + 10000;
    const response = await auctionService.placeBid(auctionId, bidAmount);

    if (response.success) {
      Alert.alert('Success', `Bid of ₹${bidAmount.toLocaleString('en-IN')} placed successfully!`);
      fetchAuctions();
    } else {
      Alert.alert('Error', response.error || 'Failed to place bid');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'upcoming': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTone = (status: string) => {
    if (status === "live") return "danger" as const;
    if (status === "upcoming") return "info" as const;
    if (status === "ended") return "neutral" as const;
    return "neutral" as const;
  };

  const getTimeLeft = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <LoadingScreen title="Loading auctions" subtitle="Finding live bids near you" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary[900], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-10 pb-6 px-5 rounded-b-3xl"
        >
          <View className="flex-row items-end justify-between" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-white text-3xl font-extrabold">Auctions</Text>
              <Text className="text-white/80 text-sm mt-1">
                Bid on premium vehicles from verified dealers.
              </Text>
            </View>
            <View style={{ minWidth: 120 }}>
              <Button
                title="Create"
                size="sm"
                leftIcon="add"
                variant="secondary"
                onPress={() => router.push("/(drawer)/CreateAuction")}
              />
            </View>
          </View>

          <View className="flex-row mt-5" style={{ gap: 10 }}>
            <View className="px-4 py-2 rounded-full bg-white/10 border border-white/20">
              <Text className="text-white text-xs font-extrabold tracking-widest">
                {auctions.filter((a) => a.status === "live").length} LIVE
              </Text>
            </View>
            <View className="px-4 py-2 rounded-full bg-white/10 border border-white/20">
              <Text className="text-white text-xs font-extrabold tracking-widest">
                {auctions.reduce((sum, a) => sum + a.totalBids, 0)} BIDS
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Search */}
        <View className="px-5" style={{ marginTop: -18 }}>
          <Card className="p-0" variant="default">
            <View className="flex-row items-center px-4 py-3" style={{ gap: 10 }}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-2 text-base text-gray-900"
                placeholder="Search auctions, brands, cities..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </Card>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mt-4 mb-3">
        <TouchableOpacity
          className={`px-4 py-2 mr-2 rounded-full border ${
            statusFilter === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
          }`}
          onPress={() => setStatusFilter('all')}
        >
          <Text className={statusFilter === 'all' ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
            All Status
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 mr-2 rounded-full border ${
            statusFilter === 'live' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
          }`}
          onPress={() => setStatusFilter('live')}
        >
          <Text className={statusFilter === 'live' ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
            Live
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 mr-2 rounded-full border ${
            statusFilter === 'upcoming' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
          }`}
          onPress={() => setStatusFilter('upcoming')}
        >
          <Text className={statusFilter === 'upcoming' ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 mr-2 rounded-full border ${
            vehicleTypeFilter === 'car' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
          }`}
          onPress={() => setVehicleTypeFilter(vehicleTypeFilter === 'car' ? 'all' : 'car')}
        >
          <Text className={vehicleTypeFilter === 'car' ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
            Cars
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 rounded-full border ${
            vehicleTypeFilter === 'bike' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
          }`}
          onPress={() => setVehicleTypeFilter(vehicleTypeFilter === 'bike' ? 'all' : 'bike')}
        >
          <Text className={vehicleTypeFilter === 'bike' ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
            Bikes
          </Text>
        </TouchableOpacity>
      </ScrollView>

        {/* Auction Cards */}
        <View className="px-5 mt-2">
        {visibleAuctions.map((auction) => (
          <Card key={auction.id} className="p-0 mb-4" variant="default">
            <TouchableOpacity onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)} activeOpacity={0.9}>
              <Image
                source={{ uri: auction.vehicle?.images?.[0] || 'https://via.placeholder.com/800x600.png?text=No+Image' }}
                className="w-full h-48"
                resizeMode="cover"
              />
              <View className="absolute top-3 right-3">
                <Badge label={auction.status.toUpperCase()} tone={getStatusTone(auction.status)} />
              </View>
              <View className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded">
                <Text className="text-white text-xs">
                  {auction.vehicle?.vehicleType === 'car' ? '🚗' : '🏍️'} {auction.vehicle?.year}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="p-5">
              <TouchableOpacity onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)}>
                <Text className="text-lg font-extrabold text-gray-900 mb-2">{auction.vehicle?.title || 'Vehicle'}</Text>
              </TouchableOpacity>

              <View className="flex-row justify-between mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-1">{getTimeLeft(auction.endTime)}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-1">{auction.totalBids}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="eye-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-1">{auction.vehicle?.viewsCount || 0}</Text>
                </View>
              </View>

              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-gray-600">Current Bid</Text>
                  <Text className="text-xs text-gray-500">Starting: {formatPrice(auction.startingPrice)}</Text>
                </View>
                <Text className="text-2xl font-extrabold text-emerald-600">{formatPrice(auction.currentBid)}</Text>
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                {auction.status === 'live' ? (
                  <>
                    <View className="flex-1">
                      <Button
                        title="Bid now"
                        leftIcon="hammer"
                        onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)}
                      />
                    </View>
                    <View style={{ width: 110 }}>
                      <Button
                        title="+10k"
                        variant="secondary"
                        onPress={() => handleQuickBid(auction.id)}
                      />
                    </View>
                  </>
                ) : (
                  <Button
                    title={auction.status === "upcoming" ? "View details" : "View results"}
                    variant="secondary"
                    onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)}
                  />
                )}
              </View>

              {auction.vehicleId && (
                <View className="flex-row gap-2 pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    className="flex-1 py-2 justify-center items-center bg-white border border-gray-200 rounded-md"
                    onPress={() => router.push(`../components/${auction.vehicle?.vehicleType === 'bike' ? 'BikeDetails' : 'CarDetails'}?id=${auction.vehicleId}`)}
                  >
                    <Text className="text-gray-600 text-xs font-medium">View Vehicle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 py-2 justify-center items-center bg-white border border-gray-200 rounded-md">
                    <Text className="text-gray-600 text-xs font-medium">Book</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 py-2 justify-center items-center bg-white border border-gray-200 rounded-md">
                    <Text className="text-gray-600 text-xs font-medium">Lock-in</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Card>
        ))}
      </View>

      {/* Empty State */}
        {visibleAuctions.length === 0 && (
          <View className="px-5 pt-8">
            <EmptyState
              icon="hammer-outline"
              title="No auctions found"
              description={
                searchTerm || statusFilter !== "all" || vehicleTypeFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Check back later for exciting vehicle auctions."
              }
            />
          </View>
        )}

      {/* Stats Footer */}
        <View className="flex-row justify-around bg-white mx-5 my-6 p-5 rounded-3xl shadow-sm border border-gray-100">
        <View className="items-center">
          <Text className="text-2xl font-extrabold text-indigo-700">{auctions.length}</Text>
          <Text className="text-xs text-gray-600 mt-1">Total Auctions</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-extrabold text-emerald-600">
            {auctions.filter(a => a.status === 'live').length}
          </Text>
          <Text className="text-xs text-gray-600 mt-1">Live Now</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-extrabold text-amber-600">
            {auctions.reduce((sum, a) => sum + a.totalBids, 0)}
          </Text>
          <Text className="text-xs text-gray-600 mt-1">Total Bids</Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuctionsScreen;