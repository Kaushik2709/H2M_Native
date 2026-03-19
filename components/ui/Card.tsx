import React from 'react';
import {
  View,
  Text,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadows } from '@/constants/theme';

// --- Improved Card Component ---

export interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  className?: string; // Support for NativeWind classes if passed directly
  variant?: 'default' | 'outlined' | 'ghost';
  padding?: number; // Keep for backward compatibility
  shadow?: boolean; // Keep for backward compatibility
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  className = '',
  variant = 'default',
  padding,
  shadow,
}) => {
  const baseClasses = 'bg-white rounded-2xl overflow-hidden p-4';
  
  // Map legacy props to classes or styles if needed, but prefer new variant system
  // If shadow prop is explicitly false, override variant default
  
  const variantClasses = {
    default: 'border border-gray-100',
    outlined: 'border border-gray-200 bg-transparent',
    ghost: 'bg-transparent border-0',
  };

  let appliedVariantClass = variantClasses[variant];
  if (shadow === false) {
    // explicit override
  }

  const containerClasses = `${baseClasses} ${appliedVariantClass} ${className}`;
  
  // Handle padding via style if passed as number, else use default via class
  const dynamicStyle = [padding !== undefined ? { padding } : undefined, style];

  const variantShadowStyle =
    shadow === false
      ? undefined
      : shadow === true
        ? Shadows.lg
        : variant === 'default'
          ? Shadows.md
          : undefined;

  const Content = (
    <View className={containerClasses} style={[variantShadowStyle, ...dynamicStyle]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress} 
        className="active:opacity-90"
        style={({ pressed }) => [
          variantShadowStyle,
          ...dynamicStyle,
          { opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
        ]}
      >
        <View className={containerClasses}>{children}</View>
      </Pressable>
    );
  }

  return Content;
};

// --- Improved Vehicle Card Component ---

export interface VehicleCardProps {
  id: string;
  title: string;
  price: number;
  year: number;
  fuelType: string;
  transmission: string;
  kilometers?: number;
  location: string;
  images: string[];
  isAuction?: boolean;
  onPress: () => void;
  onWishlistPress?: () => void;
  isWishlisted?: boolean;
  compact?: boolean;
  featured?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  title,
  price,
  year,
  fuelType,
  transmission,
  kilometers,
  location,
  images,
  isAuction = false,
  onPress,
  onWishlistPress,
  isWishlisted = false,
  compact = false,
  featured = false,
}) => {
  // Helper for price formatting
  const formatPrice = (p: number) => {
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
    return `₹${p.toLocaleString('en-IN')}`;
  };

  const imageSource = images && images.length > 0
    ? { uri: images[0] }
    : require('../../assets/images/icon.png'); // Fallback

  const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayju';

  // --- Compact View (Horizontal Scroll usually) ---
  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className="mr-3 w-40 overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm"
        style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
      >
        <View className="h-28 w-full bg-gray-100 relative">
           <Image
            source={imageSource}
            style={{ flex: 1, width: '100%', height: '100%' }}
            contentFit="cover"
            placeholder={blurhash}
            transition={300}
          />
          {isAuction && (
             <View className="absolute top-2 left-2 bg-red-600 px-1.5 py-0.5 rounded flex-row items-center">
                <Ionicons name="hammer" size={8} color="white" /> 
                <Text className="text-[9px] font-bold text-white ml-1">LIVE</Text>
             </View>
          )}
        </View>
        <View className="p-2.5">
          <Text className="text-sm font-semibold text-gray-900 mb-0.5" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-sm font-bold text-emerald-600 mb-1">
            {formatPrice(price)}
          </Text>
          <Text className="text-[10px] text-gray-500 font-medium">
            {year} • {location}
          </Text>
        </View>
      </Pressable>
    );
  }

  // --- Default View (List) ---
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm mx-1" // Added mx-1 for shadow visibility on edges if needed
      style={({ pressed }) => ({ 
        opacity: pressed ? 0.98 : 1,
        elevation: 2, // Android shadow
      })}
    >
      {/* Image Section */}
      <View className="relative h-48 w-full bg-gray-100">
        <Image
          source={imageSource}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          placeholder={blurhash}
          transition={500}
        />
        
        {/* Gradient Overlay for Text legibility on image if needed, but used at bottom here */}
        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
        />

        {/* Status Badges */}
        <View className="absolute left-3 top-3 flex-row gap-2">
          {isAuction && (
            <View className="flex-row items-center gap-1 rounded-full bg-red-600 px-3 py-1 shadow-sm">
              <Ionicons name="hammer" size={10} color="#FFFFFF" />
              <Text className="text-[10px] font-extrabold text-white tracking-wide">AUCTION</Text>
            </View>
          )}
          {featured && (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-500 px-3 py-1 shadow-sm">
                <Ionicons name="star" size={10} color="#FFFFFF" />
                <Text className="text-[10px] font-extrabold text-white tracking-wide">FEATURED</Text>
            </View>
          )}
        </View>

        {/* Wishlist Button */}
        {onWishlistPress && (
          <Pressable
            onPress={(e) => {
                e.stopPropagation();
                onWishlistPress();
            }}
            hitSlop={8}
            className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={isWishlisted ? '#EF4444' : '#FFFFFF'}
            />
          </Pressable>
        )}
      </View>

      {/* Content Section */}
      <View className="p-4 pt-3">
        {/* Title & Price Header */}
        <View className="mb-3">
          <View className="flex-row justify-between items-start">
             <Text className="text-lg font-bold text-gray-900 flex-1 mr-2 leading-tight" numberOfLines={1}>
                {title}
             </Text>
          </View>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="text-xl font-extrabold text-emerald-700">
              {formatPrice(price)}
            </Text>
            {isAuction && (
              <Text className="text-xs text-gray-500 font-medium">current bid</Text>
            )}
          </View>
        </View>

        {/* Specs Grid */}
        <View className="flex-row items-center justify-between mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text className="text-xs font-semibold text-gray-600">{year}</Text>
          </View>
          
          <View className="w-[1px] h-3 bg-gray-300" />

          <View className="flex-row items-center gap-1.5">
            <Ionicons name="speedometer-outline" size={14} color="#6B7280" />
            <Text className="text-xs font-semibold text-gray-600">
              {kilometers ? `${(kilometers/1000).toFixed(0)}k km` : 'N/A'}
            </Text>
          </View>

          <View className="w-[1px] h-3 bg-gray-300" />

          <View className="flex-row items-center gap-1.5">
            <Ionicons name="pint-outline" size={14} color="#6B7280" />
            <Text className="text-xs font-semibold text-gray-600 capitalize">{fuelType}</Text>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-sharp" size={13} color="#9CA3AF" />
            <Text className="text-xs font-medium text-gray-500 max-w-[120px]" numberOfLines={1}>{location}</Text>
          </View>
          
          <View className="flex-row items-center">
            <Text className="text-xs font-bold text-blue-600 uppercase tracking-wide">View Details</Text>
            <Ionicons name="arrow-forward" size={12} color="#2563EB" style={{ marginLeft: 4 }} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};
