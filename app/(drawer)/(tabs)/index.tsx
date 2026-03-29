import { View, Text, Pressable } from "react-native";
import React from "react";
import { Button, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const index = () => {
  const router = useRouter();

  return (
    <View>
      <View className="flex flex-col items-center justify-center mt-5">
        <ImageBackground
          source={{
            uri: "https://i.pinimg.com/1200x/51/b5/b2/51b5b2bfa3c86f9c82d6503ee62fc096.jpg",
          }}
          className="w-10/12 p-5 rounded-[30px] overflow-hidden"
          resizeMode="cover"
        >
          <View className="gap-2">
            <Text className="text-white text-xs font-bold bg-[#e6a16d] px-4 py-1 rounded-full self-start tracking-widest uppercase">
              LIVE AUCTION NOW
            </Text>

            <Text className="text-white text-5xl font-bold tracking-wide ">
              THE{"\n"}PRECISION{"\n"}CURATOR.
            </Text>

            <Text className="text-gray-400 text-sm font-medium mt-2 leading-7">
              Experience a high-performance marketplace where every machine is a
              masterpiece. Engineering excellence meets editorial curation
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(drawer)/(tabs)/index")}
            className="mt-4 self-start rounded-xl overflow-hidden"
          >
            <LinearGradient
              colors={["#ffffff", "#38b073"]} // white → sky blue
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }} // top → bottom
              className="px-5 py-3 rounded-xl"
            >
              <Text className="text-black font-semibold tracking-wide text-center">
                BROWSE COLLECTION
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(drawer)/(tabs)/index")}
            className="bg-white/15 px-5 py-3 rounded-xl mt-4 self-start"
          >
            <Text className="text-white text-center font-semibold tracking-wide">
              SELL YOUR VEHICLE
            </Text>
          </Pressable>
        </ImageBackground>
      </View>
    </View>
  );
};

export default index;
