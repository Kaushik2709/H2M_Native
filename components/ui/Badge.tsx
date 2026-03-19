import React from "react";
import { Text, View } from "react-native";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, { wrap: string; text: string }> = {
	neutral: { wrap: "bg-gray-100 border-gray-200", text: "text-gray-700" },
	info: { wrap: "bg-blue-50 border-blue-100", text: "text-blue-700" },
	success: { wrap: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
	warning: { wrap: "bg-amber-50 border-amber-100", text: "text-amber-800" },
	danger: { wrap: "bg-red-50 border-red-100", text: "text-red-700" },
};

export const Badge = ({
	label,
	tone = "neutral",
}: {
	label: string;
	tone?: BadgeTone;
}) => {
	const t = toneClasses[tone];
	return (
		<View className={`px-3 py-1 rounded-full border ${t.wrap}`}>
			<Text className={`text-[10px] font-bold tracking-wider ${t.text}`}>{label}</Text>
		</View>
	);
};

export default Badge;
