import { API_BASE } from '@/config/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

interface Bike {
  id: string;
  title: string;
  images: string[];
  featured: boolean;
  negotiable: boolean;
  year: number;
  kilometersDriven: number;
  fuelType: string;
  price: number;
  location: string;
}

const Bikes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [originalBikes, setOriginalBikes] = useState<Bike[]>([]);
  const router = useRouter()

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/vehicles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const vehicleData = json.data.items || [];

      // Keep only bike entries (flexible checks for different API shapes)
      const bikesOnly = vehicleData.filter((v: any) => {
        const type = (v.vehicleType || v.type || v.category || "").toString().toLowerCase();
        const title = (v.title || "").toString().toLowerCase();
        return (
          type.includes('bike') ||
          type.includes('motorcycle') ||
          title.includes('bike') ||
          title.includes('motorcycle')
        );
      });

      setBikes(bikesOnly);
      setOriginalBikes(bikesOnly);
    } catch (err) {
      console.error("Fetch vehicles failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filters = [
    { id: 'all', label: 'All Bikes' },
    { id: 'featured', label: 'Featured' },
    { id: 'recent', label: 'Recent' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
  ];

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatKM = (km: number) => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)}k km`;
    }
    return `${km} km`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    let sortedBikes = [...originalBikes];

    switch (filterId) {
      case 'featured':
        sortedBikes = sortedBikes.filter((bike) => bike.featured);
        break;
      case 'recent':
        sortedBikes = sortedBikes.sort((a, b) => b.year - a.year);
        break;
      case 'price-low':
        sortedBikes = sortedBikes.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sortedBikes = sortedBikes.sort((a, b) => b.price - a.price);
        break;
      default:
        sortedBikes = [...originalBikes];
        break;
    }

    setBikes(sortedBikes);
  };
const filteredBikes = useMemo(() => {
  return bikes.filter((bike) =>
    bike.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [bikes, searchQuery]);


  const renderBikeCard = ({ item }: { item: Bike }) => (
    <TouchableOpacity
      className="bg-white rounded-xl mb-4 shadow-sm overflow-hidden active:opacity-70"
      onPress={() => router.push(`/components/BikeDetails?id=${item.id}`)}
    >
      {/* Image */}
      <View className="relative">
        <Image
          source={{ uri: item.images[0] }}
          className="w-full h-48"
          resizeMode="cover"
        />
        {item.featured && (
          <View className="absolute top-3 left-3 bg-yellow-400 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-gray-900">⭐ Featured</Text>
          </View>
        )}
        {item.negotiable && (
          <View className="absolute top-3 right-3 bg-green-500 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-white">Negotiable</Text>
          </View>
        )}
        <TouchableOpacity className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-full">
          <Text className="text-base">❤️</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-1">
          {item.title}
        </Text>
        <Text className="text-sm text-gray-500 mb-3">
          {item.year} • {formatKM(item.kilometersDriven)} • {item.fuelType}
        </Text>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-blue-600">
              {formatPrice(item.price)}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-gray-500">📍 {item.location}</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-semibold text-sm">View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View className="px-5 mb-4">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <Text className="text-lg mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search bikes by brand, model..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 mb-5"
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            
            className={`mr-3 px-4 py-2 rounded-full ${
              selectedFilter === filter.id
                ? 'bg-blue-500'
                : 'bg-white border border-gray-300'
            }`}
            onPress={() => handleFilterChange(filter.id)}
          >
            <Text
              className={`text-sm font-semibold ${
                selectedFilter === filter.id ? 'text-white' : 'text-gray-700'
              }`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View className="px-5 mb-4">
        <Text className="text-sm text-gray-600">
          {filteredBikes.length} bike{filteredBikes.length !== 1 ? 's' : ''} found
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading bikes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-500 pt-12 pb-6 px-5">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold mb-1">
              🏍️ Bikes Marketplace
            </Text>
            <Text className="text-blue-100 text-sm">
              Find your perfect ride
            </Text>
          </View>
          <TouchableOpacity className="bg-white/20 p-2 rounded-full">
            <Text className="text-white text-xl">🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View className="bg-white mx-5 -mt-4 rounded-xl p-4 shadow-sm flex-row justify-around mb-5">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">
            {originalBikes.length}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Total Bikes</Text>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">
            {originalBikes.filter((b) => b.featured).length}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Featured</Text>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">
            {originalBikes.filter((b) => b.year >= 2023).length}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Latest</Text>
        </View>
      </View>

      {/* Bikes List */}
      <FlatList
        data={filteredBikes}
        renderItem={renderBikeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">🏍️</Text>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              No bikes found
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => console.log('Add new bike')}
      >
        <Text className="text-white text-2xl">+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Bikes;