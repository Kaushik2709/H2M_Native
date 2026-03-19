import api from "@/services/api.client";
import { Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorScreen } from "@/components/ui/ErrorScreen";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

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
  const [error, setError] = useState<string | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [originalBikes, setOriginalBikes] = useState<Bike[]>([]);
  const router = useRouter()

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await api.get<any>("/api/vehicles");
      const vehicleData = payload?.data?.items || payload?.items || payload || [];

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
      setError((err as any)?.message || "Unable to reach backend");
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
    <Card className="p-0 mb-4" variant="default">
      <TouchableOpacity
        className="overflow-hidden rounded-2xl"
        onPress={() => router.push(`/components/BikeDetails?id=${item.id}`)}
        activeOpacity={0.9}
      >
        <View className="relative">
          <Image
            source={{ uri: item.images?.[0] }}
            className="w-full h-52"
            resizeMode="cover"
          />

          <View className="absolute top-3 left-3 flex-row" style={{ gap: 8 }}>
            {item.featured && <Badge label="FEATURED" tone="warning" />}
            {item.negotiable && <Badge label="NEGOTIABLE" tone="success" />}
          </View>

          <View className="absolute bottom-3 right-3 bg-white/90 px-3 py-2 rounded-full">
            <Text className="text-xs font-extrabold text-gray-900">❤️ SAVE</Text>
          </View>
        </View>

        <View className="p-4">
          <Text className="text-lg font-extrabold text-gray-900" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
            {item.year} • {formatKM(item.kilometersDriven)} • {item.fuelType}
          </Text>

          <View className="flex-row justify-between items-end mt-4">
            <View>
              <Text className="text-2xl font-extrabold text-indigo-700">
                {formatPrice(item.price)}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">📍 {item.location}</Text>
            </View>
            <Button
              title="View"
              size="sm"
              rightIcon="arrow-forward"
              onPress={() => router.push(`/components/BikeDetails?id=${item.id}`)}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Card>
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
    return <LoadingScreen title="Loading bikes" subtitle="Fetching fresh listings" />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Unable to load bikes"
        description={`${error}. Check your LAN IP / API base and try again.`}
        onRetry={fetchVehicles}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary[800], Colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-10 pb-6 px-5 rounded-b-3xl"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-white text-3xl font-extrabold mb-1">
              Bikes
            </Text>
            <Text className="text-white/80 text-sm">
              Bold listings, verified sellers, instant test-drives.
            </Text>
          </View>
          <View className="px-3 py-2 rounded-full bg-white/10 border border-white/20">
            <Text className="text-white text-xs font-extrabold tracking-widest">H2M</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View className="bg-white mx-5 -mt-5 rounded-3xl p-5 shadow-sm flex-row justify-around mb-5 border border-gray-100">
        <View className="items-center">
          <Text className="text-xl font-extrabold text-gray-900">
            {originalBikes.length}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Total Bikes</Text>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="items-center">
          <Text className="text-xl font-extrabold text-gray-900">
            {originalBikes.filter((b) => b.featured).length}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Featured</Text>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="items-center">
          <Text className="text-xl font-extrabold text-gray-900">
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
          <View className="pt-10">
            <EmptyState
              icon="bicycle-outline"
              title="No bikes found"
              description="Try adjusting your search or clearing filters."
            />
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
    </SafeAreaView>
  );
};

export default Bikes;