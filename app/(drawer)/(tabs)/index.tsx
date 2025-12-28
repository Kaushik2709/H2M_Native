import { API_BASE } from "@/config/api";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * OLX Style Landing Page with Filters
 * Features: Horizontal scrolling filter chips, bottom sheet modals
 */

const cities = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad"];
const brands = ["BMW", "Audi", "Honda", "Maruti", "Toyota", "Mahindra"];
const budgets = [
  { label: "Under 5 Lakhs", value: "0-5" },
  { label: "5-10 Lakhs", value: "5-10" },
  { label: "10-20 Lakhs", value: "10-20" },
  { label: "20-50 Lakhs", value: "20-50" },
  { label: "50+ Lakhs", value: "50+" },
];

/* ================= API BASE (SAME FILE) ================= */
// const LOCAL_IP = "10.254.100.202";

// const API_BASE = Platform.select({
//   web: "http://localhost:3001",
//   android: __DEV__
//     ? `http://${LOCAL_IP}:3001` // physical device in dev
//     : `http://${LOCAL_IP}:3001`, // production build
//   ios: `http://${LOCAL_IP}:3001`,
// });

/* ======================================================== */

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const [featured, setFeatured] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("buy");

  // Filters
  const [city, setCity] = useState("");
  const [brand, setBrand] = useState("");
  const [budget, setBudget] = useState("");

  // Modal state (SINGLE MODAL)
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<
    "City" | "Brand" | "Budget"
  >("City");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vehicles`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        setFeatured(json.data.items);
      } catch (err) {
        console.error("Fetch vehicles failed:", err);
      }
    };

    fetchVehicles();
  }, []);

  const hasActiveFilters = city || brand || budget;

  const onSearch = () => {
    const results = featured.filter((v: any) => {
      const matchCity = city ? v.location === city : true;
      const matchBrand = brand
        ? v.title.toLowerCase().includes(brand.toLowerCase())
        : true;

      const matchBudget = (() => {
        if (!budget) return true;
        const price = parseFloat(v.price);
        if (budget === "0-5") return price < 5;
        if (budget === "5-10") return price >= 5 && price <= 10;
        if (budget === "10-20") return price > 10 && price <= 20;
        if (budget === "20-50") return price > 20 && price <= 50;
        if (budget === "50+") return price > 50;
        return true;
      })();

      const matchQuery = searchQuery
        ? v.title.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      return matchCity && matchBrand && matchBudget && matchQuery;
    });

    setFeatured(results);
  };

  const clearFilters = () => {
    setCity("");
    setBrand("");
    setBudget("");
  };

  /* ================= FILTER MODAL ================= */

  const FilterModal = ({
    visible,
    onClose,
  }: {
    visible: boolean;
    onClose: () => void;
  }) => {
    const filterTabs = ["City", "Brand", "Budget"];

    const getOptionsForTab = (tab: string) => {
      if (tab === "City") return cities;
      if (tab === "Brand") return brands;
      if (tab === "Budget") return budgets;
      return [];
    };

    const handleSelectOption = (option: any) => {
      if (activeFilterTab === "City") {
        setCity(typeof option === "string" ? option : option.label);
      }
      if (activeFilterTab === "Brand") {
        setBrand(typeof option === "string" ? option : option.label);
      }
      if (activeFilterTab === "Budget") {
        setBudget(option.value);
      }
    };

    const currentOptions = getOptionsForTab(activeFilterTab);

    return (
      <Modal visible={visible} transparent animationType="none">
        <Pressable className="flex-1 justify-end" onPress={onClose}>
          <Pressable
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
            style={{ minHeight: "60%", maxHeight: "85%" }}
          >
            {/* Header */}
            <View className="p-4 border-b flex-row justify-between">
              <Text className="text-xl font-bold">Filters</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-3xl text-gray-400">×</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View className="flex-row flex-1">
              {/* Tabs */}
              <View className="w-32 border-r bg-gray-50">
                {filterTabs.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() =>
                      setActiveFilterTab(tab as "City" | "Brand" | "Budget")
                    }
                    className={`py-4 px-3 border-b ${
                      activeFilterTab === tab
                        ? "bg-white border-l-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        activeFilterTab === tab
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Options */}
              <View className="flex-1 px-4 py-3">
                <ScrollView>
                  {currentOptions.map((option: any, index: number) => {
                    const label =
                      typeof option === "string" ? option : option.label;
                    const value =
                      typeof option === "string" ? option : option.value;

                    const isSelected =
                      (activeFilterTab === "City" && city === label) ||
                      (activeFilterTab === "Brand" && brand === label) ||
                      (activeFilterTab === "Budget" && budget === value);

                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleSelectOption(option)}
                        className={`py-3 px-3 mb-2 rounded-lg flex-row items-center border ${
                          isSelected
                            ? "bg-blue-50 border-blue-600"
                            : "border-gray-200"
                        }`}
                      >
                        <View
                          className={`w-5 h-5 mr-3 rounded border-2 items-center justify-center ${
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Text className="text-white text-xs">✓</Text>
                          )}
                        </View>
                        <Text
                          className={`text-sm ${
                            isSelected ? "text-blue-600" : "text-gray-700"
                          }`}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Footer */}
            <View className="border-t p-4 flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setCity("");
                  setBrand("");
                  setBudget("");
                }}
                className="flex-1 py-3 border rounded-lg items-center"
              >
                <Text className="font-semibold text-gray-700">CLEAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
              >
                <Text className="font-bold text-white">APPLY</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Hero */}
        <LinearGradient
          colors={["#4A90E2", "#1A4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="py-14 rounded-b-3xl items-center justify-center shadow-lg"
        >
          <View className="items-center">
            <Text className="text-white text-3xl px-3 font-extrabold tracking-wide drop-shadow-lg text-center">
              Powered by a growing community of 10,000+ verified agents.
            </Text>

            <Text className="text-white text-lg mt-3 text-center opacity-90 px-6 leading-6">
              Buy, sell, and explore the best local deals. Our trusted sellers
              help you find your dream car with ease.
            </Text>

            <View className="mt-4 bg-white/20 px-4 py-1.5 rounded-full">
              <Text className="text-white font-semibold tracking-wide text-sm">
                Your Trusted Marketplace
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Search */}
        <View className="px-5" style={{ marginTop: -28 }}>
          <View
            className="bg-white rounded-lg shadow-lg"
            style={{ elevation: 4 }}
          >
            <TextInput
              className="py-4 px-5 text-base"
              placeholder="Find Cars, Bikes and more..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Tabs for BUY / SELL */}
        <View
          className="mx-5 mt-4 bg-white rounded-lg shadow-sm"
          style={{ elevation: 2 }}
        >
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setTab("buy")}
              className={`flex-1 py-3 items-center border-b-2 ${
                tab === "buy" ? "border-blue-600" : "border-transparent"
              }`}
            >
              <Text
                className={`font-semibold ${tab === "buy" ? "text-blue-600" : "text-gray-500"}`}
              >
                BUY
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab("sell")}
              className={`flex-1 py-3 items-center border-b-2 ${
                tab === "sell" ? "border-blue-600" : "border-transparent"
              }`}
            >
              <Text
                className={`font-semibold ${tab === "sell" ? "text-blue-600" : "text-gray-500"}`}
              >
                SELL
              </Text>
            </TouchableOpacity>
          </View>

          {tab === "buy" ? (
            <View className="p-4">
              {/* OLX Style Horizontal Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {/* City Filter */}
                <TouchableOpacity
                  onPress={() => {
                    setActiveFilterTab("City");
                    setShowFilterModal(true);
                  }}
                  className={`mr-2 px-4 py-2.5 rounded-full border flex-row items-center ${
                    city
                      ? "bg-blue-50 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${city ? "text-blue-600" : "text-gray-700"}`}
                  >
                    {city || "City"}
                  </Text>
                  <Text
                    className={`ml-1 text-xs ${city ? "text-blue-600" : "text-gray-400"}`}
                  >
                    ▼
                  </Text>
                </TouchableOpacity>

                {/* Brand Filter */}
                <TouchableOpacity
                  onPress={() => {
                    setActiveFilterTab("Brand");
                    setShowFilterModal(true);
                  }}
                  className={`mr-2 px-4 py-2.5 rounded-full border flex-row items-center ${
                    brand
                      ? "bg-blue-50 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${brand ? "text-blue-600" : "text-gray-700"}`}
                  >
                    {brand || "Brand"}
                  </Text>
                  <Text
                    className={`ml-1 text-xs ${brand ? "text-blue-600" : "text-gray-400"}`}
                  >
                    ▼
                  </Text>
                </TouchableOpacity>

                {/* Budget Filter */}
                <TouchableOpacity
                  onPress={() => {
                    setActiveFilterTab("Budget");
                    setShowFilterModal(true);
                  }}
                  className={`mr-2 px-4 py-2.5 rounded-full border flex-row items-center ${
                    budget
                      ? "bg-blue-50 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${budget ? "text-blue-600" : "text-gray-700"}`}
                  >
                    {budget
                      ? budgets.find((b) => b.value === budget)?.label
                      : "Budget"}
                  </Text>
                  <Text
                    className={`ml-1 text-xs ${budget ? "text-blue-600" : "text-gray-400"}`}
                  >
                    ▼
                  </Text>
                </TouchableOpacity>

                {/* Clear All (only when filters active) */}
                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    className="px-4 py-2.5 rounded-full bg-gray-100 border border-gray-300"
                  >
                    <Text className="text-sm font-medium text-gray-700">
                      Clear All ×
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Search Button */}
              <TouchableOpacity
                onPress={onSearch}
                className="py-3.5 rounded-lg items-center bg-blue-600"
                style={{ elevation: 2 }}
              >
                <Text className="text-white font-bold text-base">SEARCH</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4">
              <TouchableOpacity
                onPress={() => router.push("/(drawer)/Sell")}
                className="py-3.5 rounded-lg items-center bg-blue-600"
                style={{ elevation: 2 }}
              >
                <Text className="text-white font-bold text-base">
                  SELL YOUR CAR
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
        />

        {/* Results Count (OLX Style) */}
        {hasActiveFilters && (
          <View className="px-5 py-3">
            <Text className="text-sm text-gray-600">
              Showing {featured.length} result{featured.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Featured Listings Horizontal */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center px-5 mb-3">
            <Text className="text-lg font-bold text-gray-900">
              Featured Listings
            </Text>
            <TouchableOpacity>
              <Text className="text-blue-600 text-sm font-semibold">
                SEE ALL
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {featured.map((item: any) => {
              return (
                item.vehicleType === "car" && (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      router.push(`/components/CarDetails?id=${item.id}`)
                    }
                    className="w-44 mr-3 bg-white rounded-tr-3xl rounded-bl-3xl overflow-hidden border-[0.5px]"
                    style={{
                      elevation: 2,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    }}
                  >
                    <Image
                      source={{ uri: item.images?.[0] }}
                      style={{ width: "100%", height: 100 }}
                      resizeMode="cover"
                    />

                    <View className="p-3">
                      <Text className="font-bold text-base text-gray-900 mb-1">
                        {item.title}
                      </Text>

                      <Text
                        className="text-md text-gray-700 mb-2"
                        numberOfLines={2}
                      >
                        ₹{item.price.toLocaleString("en-IN")}
                        {item.price > 100000 ? "L" : "K"}
                      </Text>

                      <Text className="text-xs text-gray-500">
                        {item.location}
                      </Text>
                    </View>
                  </Pressable>
                )
              );
            })}
          </ScrollView>
        </View>

        {/* CAR CHEMISTRY SECTION */}
        <View className="py-10 bg-gray-50 mt-8 px-4">
          <Text className="text-center text-2xl font-bold text-gray-900 mb-2">
            Why Choose Us
          </Text>
          <Text className="text-center text-gray-600 mb-8 px-4">
            The perfect platform for buying and selling vehicles
          </Text>

          <View
            className="flex-row flex-wrap justify-center"
            style={{ gap: 20 }}
          >
            <View className="w-36 items-center">
              <View className="bg-purple-100 rounded-2xl w-16 h-16 items-center justify-center mb-3">
                <Text className="text-3xl">💰</Text>
              </View>
              <Text className="font-bold text-gray-900 text-center mb-1">
                Best Price
              </Text>
              <Text className="text-gray-600 text-xs text-center">
                Get the best deals on quality vehicles
              </Text>
            </View>

            <View className="w-36 items-center">
              <View className="bg-orange-100 rounded-2xl w-16 h-16 items-center justify-center mb-3">
                <Text className="text-3xl">⚡</Text>
              </View>
              <Text className="font-bold text-gray-900 text-center mb-1">
                Quick & Easy
              </Text>
              <Text className="text-gray-600 text-xs text-center">
                Buy and sell with ease
              </Text>
            </View>

            <View className="w-36 items-center">
              <View className="bg-blue-100 rounded-2xl w-16 h-16 items-center justify-center mb-3">
                <Text className="text-3xl">✓</Text>
              </View>
              <Text className="font-bold text-gray-900 text-center mb-1">
                100% Verified
              </Text>
              <Text className="text-gray-600 text-xs text-center">
                All vehicles verified
              </Text>
            </View>

            <View className="w-36 items-center">
              <View className="bg-green-100 rounded-2xl w-16 h-16 items-center justify-center mb-3">
                <Text className="text-3xl">📋</Text>
              </View>
              <Text className="font-bold text-gray-900 text-center mb-1">
                Easy Paperwork
              </Text>
              <Text className="text-gray-600 text-xs text-center">
                We handle documentation
              </Text>
            </View>
          </View>
        </View>

        {/* All Featured Vehicles Grid */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">
              All Vehicles
            </Text>
            <TouchableOpacity onPress={() => router.push("/Bikes")}>
              <Text className="text-blue-600 text-sm font-semibold">
                VIEW ALL
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={featured}
            keyExtractor={(i: any) => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }: any) => (
              <Pressable
                onPress={() => {
                  if (item.vehicleType === "bike") {
                    router.push(`/components/BikeDetails?id=${item.id}`);
                  } else {
                    router.push(`/components/CarDetails?id=${item.id}`);
                  }
                }}
                className="w-72 mr-4 bg-white rounded-tr-3xl rounded-bl-3xl overflow-hidden border-[0.5px]"
                style={{
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Image
                  source={{ uri: item.images?.[0] }}
                  style={{ width: "100%", height: 160 }}
                />
                <View className="p-3">
                  <View className="mb-2">
                    <Text className="font-bold text-xl text-gray-900 mb-1">
                      {item.title}
                    </Text>
                    <Text
                      className="font-medium text-gray-800"
                      numberOfLines={1}
                    >
                      ₹{item.price} Lakhs
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-500 mb-2">
                      {item.year}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-2 mx-1">•</Text>
                    <Text className="text-sm text-gray-500 mb-2">
                      {item.kilometersDriven}km
                    </Text>
                    <Text className="text-sm text-gray-500 mb-2 mx-1">•</Text>
                    <Text className="text-sm text-gray-500 mb-2">
                      {item.fuelType.toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
                    <Text className="text-sm text-gray-600">
                      {item.location}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (item.isAuction) {
                          router.push(
                            `/components/Auctionroom?id=${item.id}`
                          );
                        } else if (item.vehicleType === "bike") {
                          router.push(`/components/BikeDetails?id=${item.id}`);
                        } else {
                          router.push(`/components/CarDetails?id=${item.id}`);
                        }
                      }}
                    >
                      <Text className="text-blue-600 font-semibold text-sm">
                        {item.isAuction ? "BID NOW" : "VIEW DETAILS"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        </View>

        {/* Footer */}
        <View className="bg-gray-900 py-8 mt-8 px-6">
          <Text className="text-white text-xl font-bold mb-2">Hand2Mart</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Your trusted marketplace for quality used cars and bikes.
          </Text>
          <View className="border-t border-gray-700 pt-4">
            <Text className="text-gray-500 text-xs">
              © 2024 Hand2Mart. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // using className + inline styles
});
