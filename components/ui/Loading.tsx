import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

export const Loading = ({
	label,
	size = "small",
}: {
	label?: string;
	size?: "small" | "large";
}) => {
	return (
		<View className="flex-row items-center justify-center" style={{ gap: 10 }}>
			<ActivityIndicator size={size} color="#4F46E5" />
			{label ? <Text className="text-sm text-gray-600">{label}</Text> : null}
		</View>
	);
};

export default Loading;
