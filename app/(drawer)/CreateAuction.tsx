import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auctionService } from '../../services/auction.service';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const CreateAuction = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form fields
  const [startingPrice, setStartingPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bidIncrement, setBidIncrement] = useState('1000');
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [auctionType, setAuctionType] = useState('open');

  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading) {
      if (!isAuthenticated) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to create an auction.',
          [
            {
              text: 'Sign In',
              onPress: () => router.push('/(drawer)/Profile'),
            },
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          ]
        );
        setLoading(false);
        return;
      }
      fetchMyVehicles();
    }
  }, [authLoading, isAuthenticated]);

  const fetchMyVehicles = async () => {
    try {
      console.log('🚗 CreateAuction: Starting to fetch vehicles...');
      console.log('🚗 CreateAuction: isAuthenticated:', isAuthenticated);
      console.log('🚗 CreateAuction: authLoading:', authLoading);
      
      setLoading(true);
      const response = await vehicleService.getMyVehicles();
      
      console.log('🚗 CreateAuction: Vehicle service response:', {
        success: response.success,
        hasData: !!response.data,
        dataLength: response.data?.length || 0,
        error: response.error,
      });
      
      if (response.success && response.data) {
        // Filter only active vehicles that aren't already in auction
        const availableVehicles = response.data.filter(
          (v) => v.isActive && v.saleType !== 'auction'
        );
        console.log('🚗 CreateAuction: Available vehicles after filtering:', availableVehicles.length);
        setVehicles(availableVehicles);
        
        if (availableVehicles.length === 0) {
          console.log('⚠️ CreateAuction: No available vehicles found');
        }
      } else {
        console.error('🚗 CreateAuction: Failed to fetch vehicles:', response.error);
        // Check if it's an authentication error
        if (response.error?.includes('Authentication required')) {
          Alert.alert(
            'Authentication Required',
            'Please sign in to view your vehicles.',
            [
              {
                text: 'Sign In',
                onPress: () => router.push('/(drawer)/Profile'),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        } else {
          // Don't show alert for empty vehicles, just log
          console.warn('🚗 CreateAuction: No vehicles available:', response.error);
        }
      }
    } catch (error: any) {
      console.error('🚗 CreateAuction: Error fetching vehicles:', error);
      console.error('🚗 CreateAuction: Error details:', {
        message: error.message,
        stack: error.stack,
      });
      // Don't show alert for network errors, just log
      console.warn('🚗 CreateAuction: Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = async () => {
    console.log('🔵 handleCreateAuction called');
    console.log('Selected vehicle:', selectedVehicle);
    console.log('Form data:', {
      startingPrice,
      startDate,
      startTime,
      endDate,
      endTime,
      auctionType,
      bidIncrement,
    });

    if (!selectedVehicle) {
      console.log('❌ No vehicle selected');
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    if (!startingPrice || !startDate || !startTime || !endDate || !endTime) {
      console.log('❌ Missing required fields:', {
        startingPrice: !!startingPrice,
        startDate: !!startDate,
        startTime: !!startTime,
        endDate: !!endDate,
        endTime: !!endTime,
      });
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    console.log('✅ All required fields present');

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('Error', 'Date must be in YYYY-MM-DD format (e.g., 2025-01-15)');
      return;
    }

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Error', 'Time must be in HH:MM format (e.g., 10:00)');
      return;
    }

    // Parse dates with proper timezone handling
    const startDateTimeStr = `${startDate}T${startTime}:00`;
    const endDateTimeStr = `${endDate}T${endTime}:00`;
    
    const startDateTime = new Date(startDateTimeStr);
    const endDateTime = new Date(endDateTimeStr);

    // Validate date parsing
    if (isNaN(startDateTime.getTime())) {
      Alert.alert('Error', 'Invalid start date/time. Please check the format.');
      return;
    }

    if (isNaN(endDateTime.getTime())) {
      Alert.alert('Error', 'Invalid end date/time. Please check the format.');
      return;
    }

    if (startDateTime >= endDateTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (new Date() >= startDateTime) {
      Alert.alert('Error', 'Start time must be in the future');
      return;
    }

    // Validate price
    const startingPriceNum = parseFloat(startingPrice);
    if (isNaN(startingPriceNum) || startingPriceNum <= 0) {
      Alert.alert('Error', 'Starting price must be a valid positive number');
      return;
    }

    setSubmitting(true);
    try {
      const auctionData: any = {
        vehicleId: selectedVehicle.id,
        startingPrice: startingPriceNum,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        auctionType: auctionType,
        bidIncrement: parseInt(bidIncrement) || 1000,
      };

      if (reservePrice && reservePrice.trim()) {
        const reservePriceNum = parseFloat(reservePrice);
        if (!isNaN(reservePriceNum) && reservePriceNum > 0) {
          auctionData.reservePrice = reservePriceNum;
        }
      }

      if (buyNowPrice && buyNowPrice.trim()) {
        const buyNowPriceNum = parseFloat(buyNowPrice);
        if (!isNaN(buyNowPriceNum) && buyNowPriceNum > 0) {
          auctionData.buyNowPrice = buyNowPriceNum;
        }
      }

      if (depositRequired && depositAmount && depositAmount.trim()) {
        const depositAmountNum = parseFloat(depositAmount);
        if (!isNaN(depositAmountNum) && depositAmountNum > 0) {
          auctionData.depositRequired = true;
          auctionData.depositAmount = depositAmountNum;
        }
      }

      console.log('Submitting auction data:', auctionData);

      const response = await auctionService.createAuction(auctionData);

      console.log('Auction creation response:', response);

      if (response.success) {
        Alert.alert(
          'Success',
          'Auction created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to Auctions page - it will auto-refresh due to useFocusEffect
                router.push('/(drawer)/Auctions');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to create auction');
      }
    } catch (error: any) {
      console.error('Error creating auction:', error);
      Alert.alert('Error', error.message || 'Failed to create auction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (authLoading || loading) {
    return (
      <LoadingScreen
        title={authLoading ? "Checking authentication" : "Loading your vehicles"}
        subtitle="Preparing your auction setup"
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Ionicons name="lock-closed-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
          Authentication Required
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          Please sign in to create an auction
        </Text>
        <View className="mt-6 w-full">
          <Button
            title="Sign in"
            leftIcon="log-in"
            onPress={() => router.push("/(drawer)/Profile")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary[900], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-10 pb-6 px-5 rounded-b-3xl"
        >
          <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 items-center justify-center"
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-2xl font-extrabold">Create Auction</Text>
              <Text className="text-white/80 text-sm mt-1">
                Pick a vehicle and set auction rules.
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Select Vehicle */}
        <View className="px-5" style={{ marginTop: -18 }}>
          <Card className="p-0">
            <View className="p-5">
              <Text className="text-lg font-extrabold text-gray-900 mb-1">
                Select vehicle
              </Text>
              <Text className="text-sm text-gray-600">
                Only active vehicles not already in auction.
              </Text>
            </View>

            {vehicles.length === 0 ? (
              <View className="px-5 pb-6">
                <EmptyState
                  icon="car-outline"
                  title="No available vehicles"
                  description="Add a vehicle first to create an auction."
                />
                <View className="mt-4">
                  <Button
                    title="Add vehicle"
                    leftIcon="add-circle"
                    onPress={() => router.push("/(drawer)/Sell")}
                  />
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 18 }}
              >
                {vehicles.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    onPress={() => setSelectedVehicle(vehicle)}
                    activeOpacity={0.9}
                    className={`mr-3 w-56 rounded-2xl overflow-hidden border ${
                      selectedVehicle?.id === vehicle.id
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-100 bg-white"
                    }`}
                  >
                    <Image
                      source={{
                        uri:
                          vehicle.images?.[0] ||
                          "https://via.placeholder.com/300x200.png?text=No+Image",
                      }}
                      className="w-full h-36"
                      resizeMode="cover"
                    />
                    <View className="p-4">
                      <Text className="font-extrabold text-gray-900" numberOfLines={1}>
                        {vehicle.title}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {vehicle.year} • {vehicle.city}
                      </Text>
                      <Text className="text-sm font-extrabold text-indigo-700 mt-2">
                        {formatPrice(vehicle.price)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Card>
        </View>

        {selectedVehicle && (
          <>
            {/* Pricing */}
            <View className="px-5 mt-4">
              <Card className="p-5">
                <Text className="text-lg font-extrabold text-gray-900 mb-1">Pricing</Text>
                <Text className="text-sm text-gray-600 mb-5">
                  Set starting price and optional guardrails.
                </Text>

                <Input
                  label="Starting price *"
                  placeholder="e.g., 500000"
                  value={startingPrice}
                  onChangeText={setStartingPrice}
                  keyboardType="numeric"
                  containerClassName="mb-4"
                />

                <Input
                  label="Reserve price (optional)"
                  placeholder="Minimum acceptable price"
                  value={reservePrice}
                  onChangeText={setReservePrice}
                  keyboardType="numeric"
                  containerClassName="mb-4"
                />

                <Input
                  label="Buy now price (optional)"
                  placeholder="Instant purchase price"
                  value={buyNowPrice}
                  onChangeText={setBuyNowPrice}
                  keyboardType="numeric"
                  containerClassName="mb-4"
                />

                <Input
                  label="Bid increment"
                  placeholder="1000"
                  value={bidIncrement}
                  onChangeText={setBidIncrement}
                  keyboardType="numeric"
                  hint="Minimum amount by which bids must increase"
                />
              </Card>
            </View>

            {/* Auction Timing */}
            <View className="px-5 mt-4">
              <Card className="p-5">
                <Text className="text-lg font-extrabold text-gray-900 mb-1">Auction timing</Text>
                <Text className="text-sm text-gray-600 mb-5">Use local time. Format matters.</Text>

                <Input
                  label="Start date *"
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                  hint={`Format: YYYY-MM-DD (e.g., ${getTomorrowDate()})`}
                  containerClassName="mb-4"
                />

                <Input
                  label="Start time *"
                  placeholder="HH:MM (24-hour)"
                  value={startTime}
                  onChangeText={setStartTime}
                  hint="Format: HH:MM (e.g., 10:00)"
                  containerClassName="mb-4"
                />

                <Input
                  label="End date *"
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                  containerClassName="mb-4"
                />

                <Input
                  label="End time *"
                  placeholder="HH:MM (24-hour)"
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </Card>
            </View>

            {/* Auction Type */}
            <View className="px-5 mt-4">
              <Card className="p-5">
                <Text className="text-lg font-extrabold text-gray-900 mb-3">Auction type</Text>
                <View className="flex-row" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setAuctionType("open")}
                    activeOpacity={0.9}
                    className={`flex-1 py-3 px-4 rounded-2xl border ${
                      auctionType === "open"
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-center font-extrabold ${
                        auctionType === "open" ? "text-indigo-700" : "text-gray-800"
                      }`}
                    >
                      Open
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAuctionType("dealer_only")}
                    activeOpacity={0.9}
                    className={`flex-1 py-3 px-4 rounded-2xl border ${
                      auctionType === "dealer_only"
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-center font-extrabold ${
                        auctionType === "dealer_only"
                          ? "text-indigo-700"
                          : "text-gray-800"
                      }`}
                    >
                      Dealer only
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>

            {/* Deposit Settings */}
            <View className="px-5 mt-4">
              <Card className="p-5">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-extrabold text-gray-900">Require deposit</Text>
                  <TouchableOpacity
                    onPress={() => setDepositRequired(!depositRequired)}
                    activeOpacity={0.9}
                    className={`w-12 h-6 rounded-full ${
                      depositRequired ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                        depositRequired ? "ml-6" : "ml-0.5"
                      }`}
                    />
                  </TouchableOpacity>
                </View>

                {depositRequired ? (
                  <Input
                    label="Deposit amount"
                    placeholder="e.g., 50000"
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text className="text-sm text-gray-600">
                    Optional: require a refundable deposit to place bids.
                  </Text>
                )}
              </Card>
            </View>

            {/* Submit */}
            <View className="px-5 mt-6 mb-8">
              <Button
                title={submitting ? "Creating auction..." : "Create auction"}
                leftIcon="hammer"
                onPress={handleCreateAuction}
                disabled={submitting}
                loading={submitting}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateAuction;

