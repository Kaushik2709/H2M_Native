import { API_BASE } from "@/config/api";
import api from "@/services/api.client";
import { Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(true);
      setError(null);
      try {
        const payload = await api.get<any>("/api/vehicles");
        const items = payload?.data?.items || payload?.items || payload || [];
        setVehicles(Array.isArray(items) ? items : []);
      } catch (err: any) {
        console.error("Fetch vehicles failed:", err);
        const message = err?.message || "Unable to reach the backend";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v: any) => {
      const title = v.title?.toLowerCase?.() || "";
      const price = typeof v.price === "number" ? v.price : parseFloat(v.price || "0");

      const matchCity = city ? v.location === city : true;
      const matchBrand = brand ? title.includes(brand.toLowerCase()) : true;

      const matchBudget = (() => {
        if (!budget) return true;
        const inLakhs = price > 100000 ? price / 100000 : price; // tolerate raw or lakh pricing
        if (budget === "0-5") return inLakhs < 5;
        if (budget === "5-10") return inLakhs >= 5 && inLakhs <= 10;
        if (budget === "10-20") return inLakhs > 10 && inLakhs <= 20;
        if (budget === "20-50") return inLakhs > 20 && inLakhs <= 50;
        if (budget === "50+") return inLakhs > 50;
        return true;
      })();

      const matchQuery = searchQuery
        ? title.includes(searchQuery.toLowerCase())
        : true;

      return matchCity && matchBrand && matchBudget && matchQuery;
    });
  }, [vehicles, city, brand, budget, searchQuery]);

  const hasActiveFilters = city || brand || budget || searchQuery;

  const onSearch = () => {
    // filtering happens reactively; this keeps the CTA purposeful for UX
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Hero */}
        <LinearGradient
          colors={[Colors.primary[900], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="py-16 rounded-b-3xl px-6"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-white text-3xl font-extrabold leading-tight">
                Your premium marketplace for trusted vehicles
              </Text>
              <Text className="text-white/80 text-base mt-3 leading-6">
                Curated by verified agents. Bid, buy, or list with confidence.
              </Text>
              <View className="flex-row mt-4" style={{ gap: 10 }}>
                <View className="px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <Text className="text-white text-sm font-semibold">24/7 support</Text>
                </View>
                <View className="px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <Text className="text-white text-sm font-semibold">Secure payments</Text>
                </View>
              </View>
            </View>
            <View className="w-28 h-28 rounded-3xl overflow-hidden border border-white/20 bg-white/10 items-center justify-center">
              <Image
                source={require("../../../assets/images/icon.png")}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <View className="flex-row mt-6" style={{ gap: 12 }}>
            <StatPill label="Verified agents" value="10k+" />
            <StatPill label="Live auctions" value="120" />
            <StatPill label="Avg. response" value="<10m" />
          </View>
        </LinearGradient>

        {/* Search */}
        <View className="px-5" style={{ marginTop: -36 }}>
          <View className="bg-white rounded-2xl shadow-lg px-4 py-3 flex-row items-center border border-gray-100">
            <View className="flex-1">
              <Text className="text-xs text-gray-400">Search inventory</Text>
              <TextInput
                className="py-1 text-base"
                placeholder="Find cars, bikes, auctions..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              onPress={onSearch}
              className="px-4 py-2 rounded-full bg-blue-600"
            >
              <Text className="text-white font-semibold">Go</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs for BUY / SELL */}
        <View className="mx-5 mt-5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setTab("buy")}
              className={`flex-1 py-3 items-center rounded-l-2xl ${
                tab === "buy" ? "bg-blue-50" : ""
              }`}
            >
              <Text
                className={`font-semibold ${tab === "buy" ? "text-blue-700" : "text-gray-500"}`}
              >
                BUY
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab("sell")}
              className={`flex-1 py-3 items-center rounded-r-2xl ${
                tab === "sell" ? "bg-blue-50" : ""
              }`}
            >
              <Text
                className={`font-semibold ${tab === "sell" ? "text-blue-700" : "text-gray-500"}`}
              >
                SELL
              </Text>
            </TouchableOpacity>
          </View>

          {tab === "buy" ? (
            <View className="p-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
                contentContainerStyle={{ paddingRight: 20 }}
              >
                <FilterChip
                  label={city || "City"}
                  active={!!city}
                  onPress={() => {
                    setActiveFilterTab("City");
                    setShowFilterModal(true);
                  }}
                />
                <FilterChip
                  label={brand || "Brand"}
                  active={!!brand}
                  onPress={() => {
                    setActiveFilterTab("Brand");
                    setShowFilterModal(true);
                  }}
                />
                <FilterChip
                  label={budget ? budgets.find((b) => b.value === budget)?.label || "Budget" : "Budget"}
                  active={!!budget}
                  onPress={() => {
                    setActiveFilterTab("Budget");
                    setShowFilterModal(true);
                  }}
                />

                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    className="px-4 py-2.5 rounded-full bg-gray-100 border border-gray-200 ml-1"
                  >
                    <Text className="text-sm font-medium text-gray-700">
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <TouchableOpacity
                onPress={onSearch}
                className="py-3.5 rounded-xl items-center bg-blue-600"
                style={{ elevation: 2 }}
              >
                <Text className="text-white font-bold text-base">Refine results</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4">
              <TouchableOpacity
                onPress={() => router.push("/(drawer)/Sell")}
                className="py-3.5 rounded-xl items-center bg-blue-600"
                style={{ elevation: 2 }}
              >
                <Text className="text-white font-bold text-base">
                  List your vehicle
                </Text>
                <Text className="text-white/80 text-xs mt-1">Free listing, verified buyers</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
        />

        {/* Results Count */}
        <View className="px-5 py-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">Discover</Text>
            <Text className="text-sm text-gray-500">Curated inventory matched to your filters</Text>
          </View>
          <View className="px-3 py-2 rounded-full bg-blue-50 border border-blue-100">
            <Text className="text-blue-700 font-semibold text-sm">
              {filteredVehicles.length} listings
            </Text>
          </View>
        </View>

        {error && (
          <View className="mx-5 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <Text className="text-red-700 font-semibold">Cannot reach backend</Text>
            <Text className="text-red-600 text-sm mt-1">
              {error}. Check API_BASE and that your device can reach the server over LAN.
            </Text>
            <Text className="text-red-500 text-xs mt-2">Base URL: {API_BASE}</Text>
          </View>
        )}

        {/* Featured Listings */}
        <SectionHeader
          title="Featured picks"
          actionLabel="See all"
          onAction={() => router.push("/Bikes")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => <SkeletonCard key={idx} />)
            : filteredVehicles
                .filter((item: any) => item.vehicleType === "car")
                .slice(0, 10)
                .map((item: any) => (
                  <VehicleCard key={item.id} item={item} router={router} compact />
                ))}
        </ScrollView>

        {/* Value props */}
        <View className="py-10 bg-white mt-4 px-5 rounded-3xl mx-5 shadow-sm border border-gray-100">
          <Text className="text-center text-2xl font-bold text-gray-900 mb-2">
            Built for serious buyers & sellers
          </Text>
          <Text className="text-center text-gray-600 mb-8 px-4">
            From instant bidding to concierge paperwork, we cover the hard parts so you don’t have to.
          </Text>

          <View className="flex-row flex-wrap justify-center" style={{ gap: 18 }}>
            <ValueCard emoji="🔒" title="Escrow-ready" desc="Secure payments and verified documentation" />
            <ValueCard emoji="⚡" title="Fast approvals" desc="Finance-friendly listings with quick checks" />
            <ValueCard emoji="🛠️" title="Inspector network" desc="Pre-purchase inspections by certified partners" />
            <ValueCard emoji="🛰️" title="Live tracking" desc="Watch bids and inquiries in real time" />
          </View>
        </View>

        {/* All Vehicles */}
        <SectionHeader
          title="All vehicles"
          actionLabel="View catalog"
          onAction={() => router.push("/Bikes")}
        />
        <FlatList
          data={filteredVehicles}
          keyExtractor={(i: any) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }: any) => <VehicleCard item={item} router={router} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          ListEmptyComponent={
            loading ? null : (
              <View className="mx-5 mt-2 p-4 rounded-2xl bg-gray-100">
                <Text className="text-gray-700 font-semibold">No vehicles match these filters.</Text>
                <Text className="text-gray-600 text-sm mt-1">Try clearing filters or adjust your budget.</Text>
              </View>
            )
          }
        />

        {/* Footer */}
        <View className="bg-gray-900 py-8 mt-8 px-6 rounded-t-3xl">
          <Text className="text-white text-xl font-bold mb-2">Hand2Mart</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Premium marketplace for certified cars and bikes.
          </Text>
          <View className="flex-row" style={{ gap: 14 }}>
            <Text className="text-gray-400 text-xs">Privacy</Text>
            <Text className="text-gray-400 text-xs">Terms</Text>
            <Text className="text-gray-400 text-xs">Support</Text>
          </View>
          <View className="border-t border-gray-800 pt-4 mt-4">
            <Text className="text-gray-600 text-xs">
              © 2026 Hand2Mart. Ship-ready for production.
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

const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`mr-2 px-4 py-2.5 rounded-full border flex-row items-center ${
      active ? "bg-blue-50 border-blue-600" : "bg-white border-gray-200"
    }`}
  >
    <Text className={`text-sm font-medium ${active ? "text-blue-700" : "text-gray-700"}`}>{label}</Text>
    <Text className={`ml-1 text-xs ${active ? "text-blue-600" : "text-gray-400"}`}>▼</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) => (
  <View className="flex-row items-center justify-between px-5 mt-6 mb-3">
    <Text className="text-xl font-bold text-gray-900">{title}</Text>
    {actionLabel && onAction && (
      <TouchableOpacity onPress={onAction}>
        <Text className="text-blue-600 text-sm font-semibold">{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const StatPill = ({ label, value }: { label: string; value: string }) => (
  <View className="px-4 py-3 rounded-2xl bg-white/10 border border-white/20">
    <Text className="text-white text-lg font-extrabold">{value}</Text>
    <Text className="text-white/80 text-xs mt-1">{label}</Text>
  </View>
);

const ValueCard = ({ emoji, title, desc }: { emoji: string; title: string; desc: string }) => (
  <View className="w-40 bg-gray-50 rounded-2xl p-4 border border-gray-100">
    <Text className="text-2xl mb-2">{emoji}</Text>
    <Text className="font-semibold text-gray-900 mb-1">{title}</Text>
    <Text className="text-gray-600 text-xs leading-5">{desc}</Text>
  </View>
);

const SkeletonCard = () => (
  <View
    className="w-48 mr-3 bg-gray-200 rounded-2xl"
    style={{ height: 200, opacity: 0.7 }}
  />
);

const VehicleCard = ({ item, router, compact = false }: { item: any; router: any; compact?: boolean }) => (
  <Pressable
    onPress={() => {
      if (item.vehicleType === "bike") {
        router.push(`/components/BikeDetails?id=${item.id}`);
      } else {
        router.push(`/components/CarDetails?id=${item.id}`);
      }
    }}
    className={`bg-white overflow-hidden border border-gray-100 ${compact ? "w-48 mr-3 rounded-2xl" : "w-72 mr-4 rounded-3xl"}`}
    style={{
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    }}
  >
    <Image
      source={{ uri: item.images?.[0] }}
      style={{ width: "100%", height: compact ? 120 : 170 }}
      resizeMode="cover"
    />
    <View className="p-3">
      <Text className="font-bold text-base text-gray-900" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-gray-800 font-semibold mt-1">
        ₹{(item.price || 0).toLocaleString("en-IN")}
      </Text>
      <View className="flex-row items-center mt-1">
        {item.year && <Text className="text-xs text-gray-500">{item.year}</Text>}
        {item.kilometersDriven && <Text className="text-xs text-gray-500 mx-1">•</Text>}
        {item.kilometersDriven && <Text className="text-xs text-gray-500">{item.kilometersDriven} km</Text>}
      </View>
      <View className="flex-row justify-between items-center pt-2">
        <Text className="text-xs text-gray-600">{item.location}</Text>
        <TouchableOpacity
          onPress={() => {
            if (item.isAuction) {
              router.push(`/components/Auctionroom?id=${item.id}`);
            } else if (item.vehicleType === "bike") {
              router.push(`/components/BikeDetails?id=${item.id}`);
            } else {
              router.push(`/components/CarDetails?id=${item.id}`);
            }
          }}
        >
          <Text className="text-blue-600 font-semibold text-xs">
            {item.isAuction ? "BID NOW" : "VIEW"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Pressable>
);
