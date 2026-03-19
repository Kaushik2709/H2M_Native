import React, { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { Colors, Shadows } from "@/constants/theme";

export type InputProps = TextInputProps & {
	label?: string;
	hint?: string;
	error?: string;
	containerClassName?: string;
};

export const Input: React.FC<InputProps> = ({
	label,
	hint,
	error,
	containerClassName = "",
	...props
}) => {
	const [focused, setFocused] = useState(false);
	const borderColor = error
		? Colors.error[300]
		: focused
			? Colors.primary[300]
			: Colors.gray[200];
	const focusShadow = focused && !error ? Shadows.sm : undefined;

	return (
		<View className={containerClassName}>
			{label ? (
				<Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
					{label}
				</Text>
			) : null}
			<View
				className="bg-white rounded-2xl border px-4 py-3"
				style={[{ borderColor }, focusShadow]}
			>
				<TextInput
					{...props}
					onFocus={(e) => {
						setFocused(true);
						props.onFocus?.(e);
					}}
					onBlur={(e) => {
						setFocused(false);
						props.onBlur?.(e);
					}}
					className="text-base text-gray-900"
					placeholderTextColor={props.placeholderTextColor ?? "#9CA3AF"}
				/>
			</View>
			{error ? (
				<Text className="text-xs text-red-600 mt-2">{error}</Text>
			) : hint ? (
				<Text className="text-xs text-gray-500 mt-2">{hint}</Text>
			) : null}
		</View>
	);
};

export default Input;
