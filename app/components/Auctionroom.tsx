// AuctionRoomWithTailwind.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auctionService, Auction, Bid } from "../../services/auction.service";
import { useAuctionSocket } from "../../hooks/useAuctionSocket";

const WINDOW_WIDTH = Dimensions.get("window").width;

const AuctionRoom = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams() as { id?: string };

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const router = useRouter();

  const { lastBid, auctionStatus, timer, isConnected, sendBid } =
    useAuctionSocket(id || null);

  useEffect(() => {
    if (id) {
      fetchAuctionDetails(id);
      fetchBidHistory(id);
    }
  }, [id]);

  // Update auction state from socket
  useEffect(() => {
    if (lastBid) {
      setAuction((prev) =>
        prev ? { ...prev, currentBid: lastBid.amount } : null,
      );
      setBids((prev) => [lastBid, ...prev]);
    }
  }, [lastBid]);

  useEffect(() => {
    if (auctionStatus) {
      setAuction((prev) => (prev ? { ...prev, status: auctionStatus } : null));
    }
  }, [auctionStatus]);

  useEffect(() => {
    if (timer !== null) {
      setTimeLeft(timer);
    } else if (auction) {
      const now = Date.now();
      const end = new Date(auction.endTime).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    }
  }, [timer, auction]);

  useEffect(() => {
    if (!auction) return;
    const interval = setInterval(() => {
      if (timer === null) {
        // Only run internal timer if socket timer is not available
        const now = Date.now();
        const end = new Date(auction.endTime).getTime();
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [auction, timer]);

  const fetchAuctionDetails = async (auctionId: string) => {
    if (!auctionId) return;
    setLoading(true);
    try {
      const response = await auctionService.getAuction(auctionId);
      if (response?.success && response.data) {
        setAuction(response.data);
      } else {
        Alert.alert(
          "Auction Not Found",
          response.error || "The requested auction could not be found.",
          [{ text: "OK", onPress: () => router.push("/(drawer)/Auctions") }],
        );
      }
    } catch (err) {
      console.warn(err);
      Alert.alert(
        "Error",
        "Something went wrong while fetching auction details",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBidHistory = async (auctionId: string) => {
    try {
      const response = await auctionService.getBidHistory(auctionId);
      if (response?.success && response.data) {
        setBids(response.data);
      }
    } catch (err) {
      console.warn("Error fetching bid history:", err);
    }
  };

  const handlePlaceBid = async () => {
    if (!auction) return;
    const val = parseInt(bidAmount, 10);
    if (!val || val <= auction.currentBid) {
      return Alert.alert(
        "Invalid Bid",
        `Bid must be higher than current bid of ₹${auction.currentBid.toLocaleString()}`,
      );
    }

    setIsPlacingBid(true);
    try {
      const response = await auctionService.placeBid(auction.id, val);

      if (response?.success && response.data) {
        Alert.alert(
          "Success",
          `Your bid of ₹${val.toLocaleString()} has been placed`,
        );

        // Update auction with new data from response
        if (response.data?.auction) {
          setAuction(response.data.auction);
        }

        // Update bid in list
        if (response.data?.bid) {
          const newBid = response.data.bid;
          setBids((prev) => {
            const exists = prev.some((b) => b.id === newBid.id);
            let next;
            if (exists) {
              next = prev.map((b) => (b.id === newBid.id ? newBid : b));
            } else {
              next = [newBid, ...prev];
            }
            next.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
            return next;
          });
        }

        // Refresh bid history to get all updated bids
        await fetchBidHistory(auction.id);
        setBidAmount("");
      } else {
        Alert.alert("Failed", response?.error || "Failed to place bid");
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Failed to place bid");
    } finally {
      setIsPlacingBid(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(price);
    } catch (e) {
      return `₹${price.toLocaleString()}`;
    }
  };

  const progressPercentage = useMemo(() => {
    if (!auction) return 0;
    const pct =
      ((auction.currentBid - auction.startingPrice) / auction.startingPrice) *
      100;
    return Math.min(Math.max(pct, 0), 100);
  }, [auction]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-600">Loading auction details...</Text>
      </SafeAreaView>
    );
  }

  if (!auction) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg font-bold">Auction Not Found</Text>
        <Text className="mt-2 text-gray-500">
          The requested auction could not be found.
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-4 py-2 rounded"
          onPress={() => router.push("/(drawer)/Auctions")}
        >
          <Text className="text-white font-semibold">Back to Auctions</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        className="px-3"
      >
        {/* Header */}
        <View className="bg-white rounded-md mt-3 p-3 flex-row items-center justify-between border border-gray-100">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-semibold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-center flex-1 mx-2">
            {auction.vehicle?.title || "Auction"}
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push("/(drawer)/CreateAuction")}
              className="bg-green-600 px-2 py-1 rounded"
            >
              <Text className="text-white text-xs font-semibold">+ New</Text>
            </TouchableOpacity>
            <View className="bg-red-500 px-2 py-1 rounded">
              <Text className="text-white font-bold">
                {auction.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Images */}
        <View className="bg-white rounded-md mt-4 overflow-hidden">
          <Image
            source={{
              uri:
                auction.vehicle?.images?.[currentImageIndex] ||
                "https://via.placeholder.com/800x600.png?text=No+Image",
            }}
            style={{ width: "100%", height: 220 }}
            resizeMode="cover"
          />
          {auction.vehicle?.images && auction.vehicle.images.length > 1 && (
            <View className="flex-row justify-center px-2 py-2 space-x-2">
              {auction.vehicle.images.map((img: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setCurrentImageIndex(i)}
                >
                  <Image
                    source={{ uri: img }}
                    style={{
                      width: 54,
                      height: 40,
                      borderRadius: 6,
                      opacity: i === currentImageIndex ? 1 : 0.6,
                      borderWidth: i === currentImageIndex ? 2 : 0,
                      borderColor:
                        i === currentImageIndex ? "#0b5cff" : "transparent",
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View className="bg-white rounded-md mt-4 overflow-hidden">
          <View className="flex-row border-b border-gray-100">
            {["details", "inspection", "history", "documents"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                className={`flex-1 py-3 items-center ${activeTab === t ? "border-b-2 border-blue-600" : ""}`}
              >
                <Text
                  className={`${activeTab === t ? "text-blue-600 font-bold" : "text-gray-700"}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="p-3">
            {activeTab === "details" && (
              <View>
                <View className="flex-row flex-wrap -mx-2">
                  <View className="w-1/3 px-2">
                    <Text className="text-sm text-gray-500">Year</Text>
                    <Text className="font-bold">
                      {auction.vehicle?.year || "N/A"}
                    </Text>
                  </View>
                  <View className="w-1/3 px-2">
                    <Text className="text-sm text-gray-500">Fuel</Text>
                    <Text className="font-bold">
                      {auction.vehicle?.fuelType || "N/A"}
                    </Text>
                  </View>
                  <View className="w-1/3 px-2">
                    <Text className="text-sm text-gray-500">Trans</Text>
                    <Text className="font-bold">
                      {auction.vehicle?.transmission || "N/A"}
                    </Text>
                  </View>
                </View>

                {auction.vehicle?.description ? (
                  <View className="mt-3">
                    <Text className="font-extrabold">Description</Text>
                    <Text className="text-gray-700">
                      {auction.vehicle.description}
                    </Text>
                  </View>
                ) : null}

                {auction.vehicle?.features &&
                  Object.keys(auction.vehicle.features).length > 0 && (
                    <View className="mt-3">
                      <Text className="font-extrabold">Features</Text>
                      {Object.entries(auction.vehicle.features).map(
                        ([cat, list]: any) => (
                          <View key={cat} className="mt-2">
                            <Text className="font-semibold capitalize">
                              {cat}
                            </Text>
                            {Array.isArray(list) &&
                              list.map((f: any, i: number) => (
                                <Text key={i}>• {f}</Text>
                              ))}
                          </View>
                        ),
                      )}
                    </View>
                  )}
              </View>
            )}

            {activeTab === "inspection" && (
              <View>
                <Text className="mb-2">Inspection Report</Text>
                {auction.inspectionReport &&
                  Object.entries(auction.inspectionReport).map(
                    ([k, v]: [string, any]) => (
                      <View
                        key={k}
                        className="flex-row justify-between py-2 border-b border-gray-100"
                      >
                        <Text className="capitalize">{k}</Text>
                        <Text>{v}</Text>
                      </View>
                    ),
                  )}
                {(!auction.inspectionReport ||
                  Object.keys(auction.inspectionReport).length === 0) && (
                  <Text className="text-gray-500">
                    No inspection report available
                  </Text>
                )}
              </View>
            )}

            {activeTab === "history" && (
              <View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text>Service Records</Text>
                  <Text>Available</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text>Accident History</Text>
                  <Text>Clean</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text>Previous Owners</Text>
                  <Text>1</Text>
                </View>
              </View>
            )}

            {activeTab === "documents" && (
              <View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text>RC</Text>
                  <Text>Verified</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text>Insurance</Text>
                  <Text>Valid</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text>PUC</Text>
                  <Text>Valid</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text>NOC</Text>
                  <Text>Available</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Bid History */}
        <View className="bg-white rounded-md mt-4 p-3">
          <Text className="font-extrabold">Bid History ({bids.length})</Text>
          <FlatList
            data={bids}
            keyExtractor={(item) =>
              item.id || `${item.auctionId}-${item.amount}-${item.createdAt}`
            }
            className="mt-2"
            renderItem={({ item }) => (
              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <View>
                  <Text className="font-semibold">
                    {item.bidder?.firstName || "Unknown"}{" "}
                    {item.bidder?.lastName || ""}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-extrabold text-blue-600">
                    {formatPrice(item.amount)}
                  </Text>
                  {item.isWinning && (
                    <Text className="text-xs text-gray-500">Winning</Text>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-gray-500 text-center py-4">
                No bids yet
              </Text>
            }
          />
        </View>

        {/* Timer / Stats / Place Bid */}
        <View className="bg-white rounded-md mt-4 p-4 items-center">
          <Text className="text-xl font-extrabold">
            {auction.status === "live"
              ? formatTime(timeLeft)
              : auction.status?.toUpperCase()}
          </Text>
          <Text className="text-gray-500 mt-1">
            {auction.status === "live" ? "Time Remaining" : "Auction Status"}
          </Text>
        </View>

        <View className="bg-white rounded-md mt-4 p-4 items-center">
          <Text className="font-extrabold text-center">
            Current Highest Bid
          </Text>
          <Text className="text-2xl font-extrabold text-blue-600 mt-2">
            {formatPrice(auction.currentBid)}
          </Text>

          <View
            style={{ width: WINDOW_WIDTH - 48 }}
            className="bg-gray-200 h-2 rounded-full overflow-hidden mt-3"
          >
            <View
              style={{ width: `${progressPercentage}%`, height: 8 }}
              className="bg-blue-600 rounded-full"
            />
          </View>

          <Text className="text-gray-500 mt-2">
            Starting: {formatPrice(auction.startingPrice)}
          </Text>
          {auction.reservePrice ? (
            <Text className="text-gray-500">
              Reserve: {formatPrice(auction.reservePrice)}
            </Text>
          ) : null}
          {auction.buyNowPrice ? (
            <Text className="text-green-600 font-semibold mt-1">
              Buy Now: {formatPrice(auction.buyNowPrice)}
            </Text>
          ) : null}
        </View>

        {auction.status === "live" && (
          <View className="bg-white rounded-md mt-4 p-4">
            <Text className="font-extrabold">Place Your Bid</Text>
            <TextInput
              keyboardType="numeric"
              placeholder={`Minimum: ₹${((auction.currentBid || auction.startingPrice) + 1000).toLocaleString()}`}
              value={bidAmount}
              onChangeText={setBidAmount}
              className="border border-gray-200 rounded p-3 mt-3"
            />
            <TouchableOpacity
              className={`mt-3 rounded p-3 ${isPlacingBid || !bidAmount || parseInt(bidAmount) <= (auction.currentBid || auction.startingPrice) ? "bg-blue-400" : "bg-blue-600"}`}
              onPress={handlePlaceBid}
              disabled={
                isPlacingBid ||
                !bidAmount ||
                parseInt(bidAmount) <=
                  (auction.currentBid || auction.startingPrice)
              }
            >
              <Text className="text-white font-bold text-center">
                {isPlacingBid ? "Placing Bid..." : "Place Bid"}
              </Text>
            </TouchableOpacity>
            {auction.buyNowPrice && (
              <TouchableOpacity
                className="mt-2 rounded p-3 bg-green-600"
                onPress={async () => {
                  const result = await Alert.alert(
                    "Buy Now",
                    `Purchase this vehicle for ₹${auction.buyNowPrice?.toLocaleString()}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Confirm",
                        onPress: async () => {
                          const response = await auctionService.buyNow(
                            auction.id,
                          );
                          if (response.success) {
                            Alert.alert(
                              "Success",
                              "Purchase successful! You have won this auction.",
                            );
                            fetchAuctionDetails(auction.id);
                          } else {
                            Alert.alert(
                              "Error",
                              response.error || "Failed to process purchase",
                            );
                          }
                        },
                      },
                    ],
                  );
                }}
              >
                <Text className="text-white font-bold text-center">
                  Buy Now: {formatPrice(auction.buyNowPrice)}
                </Text>
              </TouchableOpacity>
            )}
            <Text className="text-xs text-gray-500 text-center mt-2">
              Minimum increment: ₹1,000
            </Text>
          </View>
        )}

        <View className="bg-white rounded-md mt-4 p-4">
          <Text className="font-extrabold">Seller Information</Text>
          <View className="flex-row items-center mt-3">
            <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center">
              <Text className="text-white">DS</Text>
            </View>
            <View className="ml-3">
              <Text className="font-bold">Dealer Sales</Text>
              <Text className="text-gray-500">Verified Dealer</Text>
            </View>
          </View>

          <View className="mt-3">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text>Rating:</Text>
              <Text>★★★★★ (4.8)</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text>Total Sales:</Text>
              <Text>120+</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text>Member Since:</Text>
              <Text>2020</Text>
            </View>
          </View>

          <TouchableOpacity
            className="mt-3 border border-gray-200 rounded p-3 items-center"
            onPress={() => Alert.alert("Contact", "Contact seller pressed")}
          >
            <Text className="font-bold">Contact Seller</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-md mt-4 p-4">
          <Text className="font-extrabold">Auction Statistics</Text>
          <View className="mt-3">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text>Total Bids:</Text>
              <Text>{auction.totalBids}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text>Unique Bidders:</Text>
              <Text>{Math.min(auction.totalBids, 8)}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text>Started:</Text>
              <Text>{new Date(auction.startTime).toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text>Ends:</Text>
              <Text>{new Date(auction.endTime).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuctionRoom;
