import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

export const LoadingScreen = ({
	title = "Loading",
	subtitle,
}: {
	title?: string;
	subtitle?: string;
}) => {
	return (
		<View className="flex-1 bg-gray-50 items-center justify-center px-6">
			<View className="w-full bg-white border border-gray-100 rounded-3xl p-6 items-center">
				<ActivityIndicator size="large" color="#4F46E5" />
				<Text className="text-lg font-extrabold text-gray-900 mt-4">{title}</Text>
				{subtitle ? (
					<Text className="text-sm text-gray-500 mt-1 text-center">{subtitle}</Text>
				) : null}
			</View>
		</View>
	);
};

export default LoadingScreen;
