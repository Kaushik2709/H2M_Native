import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { vehicleService } from "../../services/vehicle.service";
import { bookingService } from "../../services/booking.service";
import { testDriveService } from "../../services/testdrive.service";
import { wishlistService } from "../../services/wishlist.service";
import { reviewService, Review } from "../../services/review.service";

const { width, height } = Dimensions.get("window");

const BikeDetails = () => {
  const { id } = useLocalSearchParams() as { id: string };
  const router = useRouter();
  const [bike, setBike] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [imageIndex, setImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchBikeData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await vehicleService.getVehicleById(id);
        if (response.success && response.data) {
          setBike(response.data);
          fetchReviews();
          checkWishlist();
        } else {
          throw new Error(response.error || "Failed to load bike");
        }
      } catch (err) {
        console.error("Failed to load bike", err);
        setError((err as Error)?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBikeData();
  }, [id]);

  const fetchReviews = async () => {
    const response = await reviewService.getVehicleReviews(id);
    if (response.success && response.data) {
      setReviews(response.data);
    }
  };

  const checkWishlist = async () => {
    const response = await wishlistService.getWishlist();
    if (response.success && response.data) {
      setIsWishlisted(response.data.some((item: any) => item.vehicleId === id));
    }
  };

  const handleToggleWishlist = async () => {
    setIsActionLoading(true);
    try {
      if (isWishlisted) {
        const res = await wishlistService.removeFromWishlist(id);
        if (res.success) setIsWishlisted(false);
      } else {
        const res = await wishlistService.addToWishlist(id);
        if (res.success) setIsWishlisted(true);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBookNow = () => {
    Alert.alert(
      "Confirm Booking",
      `Would you like to book ${bike.title} for ₹${bike.price.toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const res = await bookingService.createBooking({
              vehicleId: id,
              bookingAmount: bike.price * 0.1,
            });
            if (res.success) {
              Alert.alert("Success", "Bike booked successfully!");
            } else {
              Alert.alert("Error", res.error || "Failed to book bike");
            }
          },
        },
      ],
    );
  };

  const handleScheduleTestDrive = () => {
    Alert.alert("Test Drive", "Navigate to test drive scheduling screen");
  };

  useEffect(() => {
    if (scrollViewRef.current && bike?.images?.length > 0) {
      scrollViewRef.current.scrollTo({
        x: imageIndex * width,
        animated: true,
      });
    }
  }, [imageIndex]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    if (currentIndex !== imageIndex) {
      setImageIndex(currentIndex);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-base text-slate-600 font-medium">
          Loading your dream bike...
        </Text>
      </View>
    );
  }

  if (!bike) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-slate-600">🏍️ Bike not found</Text>
        {error && (
          <Text className="mt-2 text-sm text-red-600">Error: {error}</Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image Carousel */}
        <View className="relative">
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
          >
            {bike.images?.map((image: string, idx: number) => (
              <Image
                key={idx}
                source={{ uri: image }}
                style={{ width, height: width * 0.65 }}
                resizeMode="contain"
              />
            ))}
          </ScrollView>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
          />

          {/* Image Counter Badge */}
          <View className="absolute top-12 left-4">
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text className="text-white font-semibold text-sm">
                {imageIndex + 1} / {bike.images?.length || 1}
              </Text>
            </View>
          </View>

          {/* Image Indicators */}
          {bike.images?.length > 1 && (
            <View className="absolute bottom-5 left-0 right-0 flex-row justify-center gap-2">
              {bike.images.map((_: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setImageIndex(idx)}
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      imageIndex === idx ? "#ffffff" : "rgba(255,255,255,0.5)",
                    width: imageIndex === idx ? 24 : 8,
                  }}
                />
              ))}
            </View>
          )}

          {/* Wishlist Toggle */}
          <View className="absolute top-12 right-4">
            <TouchableOpacity
              onPress={handleToggleWishlist}
              disabled={isActionLoading}
              className="bg-white/80 p-3 rounded-full"
            >
              <Text className="text-2xl">{isWishlisted ? "❤️" : "🤍"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Section */}
        <View className="p-5 bg-white">
          <Text className="text-3xl font-bold text-slate-900 mb-3">
            {bike.title}
          </Text>

          {/* Price Badge */}
          <View className="mb-3">
            <View className="bg-blue-600 px-4 py-2 rounded-full self-start">
              <Text className="text-2xl font-bold text-white">
                ₹{bike.price.toLocaleString("en-IN")}
              </Text>
            </View>
            {bike.negotiable && (
              <View className="mt-1 self-start">
                <View className="border-[0.5px] border-black ml-1 px-3 py-1 rounded-full">
                  <Text className="text-sm text-black font-semibold">
                    Negotiable
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View className="flex-row gap-2">
            <View className="bg-slate-100 px-3 py-1.5 rounded-lg">
              <Text className="text-sm text-slate-600 font-semibold">
                {bike.year}
              </Text>
            </View>
            <View className="bg-slate-100 px-3 py-1.5 rounded-lg">
              <Text className="text-sm text-slate-600 font-semibold">
                {bike.fuelType}
              </Text>
            </View>
            <View className="bg-slate-100 px-3 py-1.5 rounded-lg">
              <Text className="text-sm text-slate-600 font-semibold">
                {bike.transmission}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Cards - Removed Views */}
        <View className="flex-row px-4 gap-3 mt-2">
          <StatCard
            icon="🏃"
            label="Driven"
            value={`${bike.kilometersDriven} km`}
          />
          <StatCard icon="📍" label="Location" value={bike.city} />
        </View>

        {/* Tabs - Swapped details and features */}
        <View className="flex-row bg-white mt-2 px-4 gap-2">
          {["overview", "details", "features", "reviews"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-4 items-center border-b-2 ${
                activeTab === tab ? "border-blue-600" : "border-transparent"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  activeTab === tab ? "text-blue-600" : "text-slate-400"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View className="p-4">
          {activeTab === "overview" && (
            <>
              <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
                <Text className="text-lg font-bold text-slate-900 mb-4">
                  📝 Description
                </Text>
                <Text className="text-base text-slate-600 leading-6">
                  {bike.description}
                </Text>
              </View>

              <View className="bg-white rounded-2xl p-5 shadow-sm">
                <Text className="text-lg font-bold text-slate-900 mb-4">
                  👤 Owner Details
                </Text>
                <View className="flex-row items-center gap-4">
                  <View className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center">
                    <Text className="text-2xl font-bold text-white">
                      {bike.ownerName?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-slate-900">
                      {bike.ownerName}
                    </Text>
                    <Text className="text-sm text-slate-500 mt-0.5">
                      Bike Owner
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === "details" && (
            <View className="bg-white rounded-2xl p-5 shadow-sm">
              <Text className="text-lg font-bold text-slate-900 mb-4">
                🔍 Full Specifications
              </Text>
              <DetailRow label="Variant" value={bike.variant} />
              <DetailRow label="Vehicle Type" value={bike.vehicleType} />
              <DetailRow label="Year" value={bike.year} />
              <DetailRow label="Fuel Type" value={bike.fuelType} />
              <DetailRow label="Transmission" value={bike.transmission} />
              <DetailRow
                label="KM Driven"
                value={`${bike.kilometersDriven} km`}
              />
              <DetailRow label="City" value={bike.city} />
              <DetailRow label="State" value={bike.state} />
            </View>
          )}

          {activeTab === "features" && (
            <View className="bg-white rounded-2xl p-5 shadow-sm">
              <Text className="text-lg font-bold text-slate-900 mb-4">
                ✨ Features & Services
              </Text>
              <FeatureItem
                icon="💰"
                title="Financing Available"
                available={bike.financingAvailable}
              />
              <FeatureItem
                icon="🚗"
                title="Test Drive"
                available={bike.testDriveAvailable}
              />
              <FeatureItem
                icon="🤝"
                title="Negotiable Price"
                available={bike.negotiable}
              />
            </View>
          )}

          {activeTab === "reviews" && (
            <View className="bg-white rounded-2xl p-5 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-900">
                  ⭐ Customer Reviews
                </Text>
                <TouchableOpacity
                  onPress={() => Alert.alert("Review", "Add review logic")}
                  className="bg-blue-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-blue-600 text-xs font-bold">+ Add</Text>
                </TouchableOpacity>
              </View>
              {reviews.length === 0 ? (
                <Text className="text-slate-400 text-center py-4">
                  No reviews yet
                </Text>
              ) : (
                reviews.map((review) => (
                  <View
                    key={review.id}
                    className="mb-4 border-b border-slate-100 pb-3"
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="font-bold text-slate-800">
                        {review.user?.firstName} {review.user?.lastName}
                      </Text>
                      <Text className="text-yellow-500">
                        {"⭐".repeat(review.rating)}
                      </Text>
                    </View>
                    <Text className="text-slate-600 text-sm">
                      {review.content}
                    </Text>
                    <Text className="text-slate-400 text-[10px] mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-slate-200 flex-row gap-3">
        <TouchableOpacity
          className="flex-1 rounded-xl overflow-hidden shadow-lg"
          onPress={handleScheduleTestDrive}
        >
          <View className="bg-slate-800 py-4 items-center">
            <Text className="text-white font-bold">Schedule Test Drive</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 rounded-xl overflow-hidden shadow-lg"
          onPress={handleBookNow}
        >
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 items-center"
          >
            <Text className="text-lg font-bold text-white">Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StatCard = ({ icon, label, value }: any) => (
  <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
    <Text className="text-3xl mb-2">{icon}</Text>
    <Text className="text-base font-bold text-slate-900 mb-1">{value}</Text>
    <Text className="text-xs text-slate-500">{label}</Text>
  </View>
);

const FeatureItem = ({ icon, title, available }: any) => (
  <View className="flex-row items-center py-3 border-b border-slate-100 gap-3">
    <Text className="text-2xl">{icon}</Text>
    <Text className="flex-1 text-base text-slate-600 font-medium">{title}</Text>
    <View
      className={`px-3 py-1.5 rounded-lg ${
        available ? "bg-green-100" : "bg-red-100"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          available ? "text-green-700" : "text-red-700"
        }`}
      >
        {available ? "✓ Yes" : "✗ No"}
      </Text>
    </View>
  </View>
);

const DetailRow = ({ label, value }: any) => (
  <View className="flex-row justify-between py-3.5 border-b border-slate-100">
    <Text className="text-base text-slate-500">{label}</Text>
    <Text className="text-base font-semibold text-slate-900">{value}</Text>
  </View>
);

export default BikeDetails;
