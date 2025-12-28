import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { auctionService, Auction } from '../../services/auction.service';

const AuctionsScreen = ({ navigation }:any) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const router = useRouter()

  // Fetch auctions when screen comes into focus (including initial mount and after navigation)
  useFocusEffect(
    React.useCallback(() => {
      fetchAuctions();
    }, [])
  );

  useEffect(() => {
    filterAuctions();
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuctions();
  };

  const filterAuctions = () => {
    let filtered = auctions;
    
    if (searchTerm) {
      filtered = filtered.filter(auction =>
        auction.vehicle?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.vehicle?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.vehicle?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(auction => auction.status === statusFilter);
    }

    if (vehicleTypeFilter !== 'all') {
      filtered = filtered.filter(auction => auction.vehicle?.vehicleType === vehicleTypeFilter);
    }

    setFilteredAuctions(filtered);
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
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-base text-gray-600">Loading auctions...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="px-4 pt-6 pb-4">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-900">Live Auctions</Text>
            <Text className="text-sm text-gray-600 mt-1">Bid on premium vehicles from verified dealers</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(drawer)/CreateAuction')}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text className="text-white font-semibold ml-1">Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center mx-4 mb-4 px-3 bg-white rounded-lg border border-gray-200">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 py-3 px-2 text-base text-gray-900"
          placeholder="Search auctions..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4">
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
      <View className="px-4">
        {filteredAuctions.map((auction) => (
          <View key={auction.id} className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm">
            <TouchableOpacity onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)}>
              <Image
                source={{ uri: auction.vehicle?.images?.[0] || 'https://via.placeholder.com/800x600.png?text=No+Image' }}
                className="w-full h-48"
                resizeMode="cover"
              />
              <View className={`absolute top-3 right-3 px-3 py-1 rounded-xl ${getStatusColor(auction.status)}`}>
                <Text className="text-white text-xs font-semibold capitalize">{auction.status}</Text>
              </View>
              <View className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded">
                <Text className="text-white text-xs">
                  {auction.vehicle?.vehicleType === 'car' ? '🚗' : '🏍️'} {auction.vehicle?.year}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="p-4">
              <TouchableOpacity onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)}>
                <Text className="text-lg font-semibold text-gray-900 mb-2">{auction.vehicle?.title || 'Vehicle'}</Text>
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
                <Text className="text-2xl font-bold text-green-600">{formatPrice(auction.currentBid)}</Text>
              </View>

              <View className="flex-row gap-2 mb-3">
                {auction.status === 'live' ? (
                  <>
                    <TouchableOpacity
                      className="flex-1 flex-row justify-center items-center bg-blue-600 py-3 rounded-lg"
                      onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)}
                    >
                      <Ionicons name="hammer" size={18} color="#FFF" />
                      <Text className="text-white text-base font-semibold ml-2">Bid Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-4 justify-center items-center bg-white border border-gray-200 rounded-lg"
                      onPress={() => handleQuickBid(auction.id)}
                    >
                      <Text className="text-blue-600 text-base font-semibold">+10k</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    className="flex-1 justify-center items-center bg-white border border-gray-200 py-3 rounded-lg"
                    onPress={() => router.push(`../components/Auctionroom?id=${auction.id}`)}
                  >
                    <Text className="text-blue-600 text-base font-semibold">
                      {auction.status === 'upcoming' ? 'View Details' : 'View Results'}
                    </Text>
                  </TouchableOpacity>
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
          </View>
        ))}
      </View>

      {/* Empty State */}
      {filteredAuctions.length === 0 && (
        <View className="items-center py-12">
          <Ionicons name="hammer-outline" size={64} color="#D1D5DB" />
          <Text className="text-lg font-semibold text-gray-900 mt-4">No auctions found</Text>
          <Text className="text-sm text-gray-600 text-center mt-2 px-8">
            {searchTerm || statusFilter !== 'all' || vehicleTypeFilter !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'Check back later for exciting vehicle auctions!'}
          </Text>
        </View>
      )}

      {/* Stats Footer */}
      <View className="flex-row justify-around bg-white mx-4 my-6 p-4 rounded-xl shadow-sm">
        <View className="items-center">
          <Text className="text-2xl font-bold text-blue-600">{auctions.length}</Text>
          <Text className="text-xs text-gray-600 mt-1">Total Auctions</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-green-600">
            {auctions.filter(a => a.status === 'live').length}
          </Text>
          <Text className="text-xs text-gray-600 mt-1">Live Now</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-orange-600">
            {auctions.reduce((sum, a) => sum + a.totalBids, 0)}
          </Text>
          <Text className="text-xs text-gray-600 mt-1">Total Bids</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default AuctionsScreen;