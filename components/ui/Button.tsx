import React from "react";
import {
	Pressable,
	Text,
	View,
	ActivityIndicator,
	type PressableProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Shadows } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = PressableProps & {
	title: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
	leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
	rightIcon?: React.ComponentProps<typeof Ionicons>["name"];
	loading?: boolean;
};

const variantClasses: Record<ButtonVariant, { container: string; text: string; spinner: string; icon: string }> = {
	primary: {
		container: "bg-indigo-600 border border-indigo-600",
		text: "text-white",
		spinner: "#FFFFFF",
		icon: "#FFFFFF",
	},
	secondary: {
		container: "bg-white border border-gray-200",
		text: "text-gray-900",
		spinner: "#111827",
		icon: "#111827",
	},
	ghost: {
		container: "bg-transparent border border-transparent",
		text: "text-indigo-700",
		spinner: "#4338CA",
		icon: "#4338CA",
	},
	danger: {
		container: "bg-red-600 border border-red-600",
		text: "text-white",
		spinner: "#FFFFFF",
		icon: "#FFFFFF",
	},
};

const sizeClasses: Record<ButtonSize, { container: string; text: string; icon: number }> = {
	sm: { container: "px-4 py-2 rounded-xl", text: "text-sm", icon: 16 },
	md: { container: "px-5 py-3 rounded-2xl", text: "text-base", icon: 18 },
	lg: { container: "px-6 py-4 rounded-2xl", text: "text-lg", icon: 20 },
};

export const Button: React.FC<ButtonProps> = ({
	title,
	variant = "primary",
	size = "md",
	leftIcon,
	rightIcon,
	loading = false,
	disabled,
	...props
}) => {
	const v = variantClasses[variant];
	const s = sizeClasses[size];
	const isDisabled = disabled || loading;

	return (
		<Pressable
			{...props}
			disabled={isDisabled}
			className={`flex-row items-center justify-center ${v.container} ${s.container} ${
				isDisabled ? "opacity-60" : "active:opacity-95"
			}`}
			style={({ pressed }) => {
				const hasDepth = variant === "primary" || variant === "danger";
				return [
					hasDepth ? Shadows.md : undefined,
					{
						opacity: pressed && !isDisabled ? 0.96 : 1,
						transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
					},
				];
			}}
		>
			{loading ? (
				<ActivityIndicator color={v.spinner} />
			) : (
				<View className="flex-row items-center" style={{ gap: 10 }}>
					{leftIcon && <Ionicons name={leftIcon} size={s.icon} color={v.icon} />}
					<Text className={`${v.text} ${s.text} font-bold tracking-wide`}>{title}</Text>
					{rightIcon && <Ionicons name={rightIcon} size={s.icon} color={v.icon} />}
				</View>
			)}
		</Pressable>
	);
};

export default Button;
