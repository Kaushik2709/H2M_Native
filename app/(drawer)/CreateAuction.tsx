import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-base text-gray-600">
          {authLoading ? 'Checking authentication...' : 'Loading your vehicles...'}
        </Text>
      </SafeAreaView>
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
        <TouchableOpacity
          className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
          onPress={() => router.push('/(drawer)/Profile')}
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Create Auction</Text>
        </View>

        {/* Select Vehicle */}
        <View className="bg-white mt-4 mx-4 p-4 rounded-xl shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Select Vehicle *</Text>
          {vehicles.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="car-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-2 text-center">
                No available vehicles found.{'\n'}Add a vehicle first to create an auction.
              </Text>
              <TouchableOpacity
                className="mt-4 bg-blue-600 px-6 py-2 rounded-lg"
                onPress={() => router.push('/(drawer)/Sell')}
              >
                <Text className="text-white font-semibold">Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  onPress={() => setSelectedVehicle(vehicle)}
                  className={`mr-3 w-48 rounded-lg overflow-hidden border-2 ${
                    selectedVehicle?.id === vehicle.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Image
                    source={{
                      uri: vehicle.images?.[0] || 'https://via.placeholder.com/300x200.png?text=No+Image',
                    }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <Text className="font-semibold text-gray-900" numberOfLines={1}>
                      {vehicle.title}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {vehicle.year} • {vehicle.city}
                    </Text>
                    <Text className="text-sm font-semibold text-blue-600 mt-1">
                      {formatPrice(vehicle.price)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Debug Info */}
        {__DEV__ && (
          <View className="mx-4 mt-4 p-3 bg-yellow-100 rounded-lg">
            <Text className="text-xs text-gray-700">
              Debug: Vehicle Selected: {selectedVehicle ? 'Yes' : 'No'} | 
              Submitting: {submitting ? 'Yes' : 'No'}
            </Text>
          </View>
        )}

        {selectedVehicle && (
          <>
            {/* Pricing */}
            <View className="bg-white mt-4 mx-4 p-4 rounded-xl shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Pricing</Text>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Starting Price *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="e.g., 500000"
                  value={startingPrice}
                  onChangeText={setStartingPrice}
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Reserve Price (Optional)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Minimum acceptable price"
                  value={reservePrice}
                  onChangeText={setReservePrice}
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Buy Now Price (Optional)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="Instant purchase price"
                  value={buyNowPrice}
                  onChangeText={setBuyNowPrice}
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Bid Increment</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="1000"
                  value={bidIncrement}
                  onChangeText={setBidIncrement}
                  keyboardType="numeric"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Minimum amount by which bids must increase
                </Text>
              </View>
            </View>

            {/* Auction Timing */}
            <View className="bg-white mt-4 mx-4 p-4 rounded-xl shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Auction Timing *</Text>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Start Date *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Format: YYYY-MM-DD (e.g., {getTomorrowDate()})
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Start Time *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="HH:MM (24-hour format)"
                  value={startTime}
                  onChangeText={setStartTime}
                />
                <Text className="text-xs text-gray-500 mt-1">Format: HH:MM (e.g., 10:00)</Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">End Date *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">End Time *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="HH:MM (24-hour format)"
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            {/* Auction Type */}
            <View className="bg-white mt-4 mx-4 p-4 rounded-xl shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Auction Type</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setAuctionType('open')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                    auctionType === 'open'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      auctionType === 'open' ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Open
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAuctionType('dealer_only')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                    auctionType === 'dealer_only'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      auctionType === 'dealer_only' ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Dealer Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Deposit Settings */}
            <View className="bg-white mt-4 mx-4 p-4 rounded-xl shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">Require Deposit</Text>
                <TouchableOpacity
                  onPress={() => setDepositRequired(!depositRequired)}
                  className={`w-12 h-6 rounded-full ${
                    depositRequired ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                      depositRequired ? 'ml-6' : 'ml-0.5'
                    }`}
                  />
                </TouchableOpacity>
              </View>

              {depositRequired && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Deposit Amount</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="e.g., 50000"
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>

            {/* Submit Button */}
            <View className="mx-4 mt-6 mb-8" style={{ zIndex: 10, elevation: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  console.log('🔵 Create Auction button pressed');
                  console.log('Button state - submitting:', submitting);
                  console.log('Button state - selectedVehicle:', selectedVehicle?.id);
                  console.log('Form values:', {
                    startingPrice,
                    startDate,
                    startTime,
                    endDate,
                    endTime,
                  });
                  if (!submitting) {
                    handleCreateAuction();
                  } else {
                    console.log('⚠️ Button is disabled (submitting)');
                  }
                }}
                onPressIn={() => {
                  console.log('🔵 Button onPressIn - touch detected');
                  Alert.alert('Debug', 'Button touched!');
                }}
                disabled={submitting}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  backgroundColor: submitting ? '#9CA3AF' : '#2563EB',
                  paddingVertical: 16,
                  borderRadius: 8,
                  minHeight: 56,
                  width: '100%',
                }}
              >
                {submitting ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text className="text-white font-semibold ml-2">Creating Auction...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-center text-lg">
                    Create Auction
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateAuction;

