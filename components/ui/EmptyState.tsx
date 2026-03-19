import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const EmptyState = ({
	title,
	description,
	icon = "albums-outline",
}: {
	title: string;
	description?: string;
	icon?: React.ComponentProps<typeof Ionicons>["name"];
}) => {
	return (
		<View className="bg-white border border-gray-100 rounded-3xl p-6 items-center">
			<View className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center">
				<Ionicons name={icon} size={26} color="#4F46E5" />
			</View>
			<Text className="text-lg font-extrabold text-gray-900 mt-4 text-center">
				{title}
			</Text>
			{description ? (
				<Text className="text-sm text-gray-500 mt-2 text-center leading-5">
					{description}
				</Text>
			) : null}
		</View>
	);
};

export default EmptyState;
