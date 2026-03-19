import React from "react";
import { Text, View } from "react-native";
import { Button } from "./Button";

export const ErrorScreen = ({
	title = "Something went wrong",
	description,
	onRetry,
}: {
	title?: string;
	description?: string;
	onRetry?: () => void;
}) => {
	return (
		<View className="flex-1 bg-gray-50 items-center justify-center px-6">
			<View className="w-full bg-white border border-gray-100 rounded-3xl p-6">
				<Text className="text-xl font-extrabold text-gray-900">{title}</Text>
				{description ? (
					<Text className="text-sm text-gray-600 mt-2 leading-5">{description}</Text>
				) : null}
				{onRetry ? (
					<View className="mt-5">
						<Button title="Try again" onPress={onRetry} />
					</View>
				) : null}
			</View>
		</View>
	);
};

export default ErrorScreen;
