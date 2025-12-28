import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vehicleService, CreateVehicleData } from '../../services/vehicle.service';
import { vehicleSpecsService } from '../../services/vehicle-specs.service';

const Sell = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingAI, setFetchingAI] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [aiSpecs, setAiSpecs] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    model: '',
    variant: '',
    year: new Date().getFullYear().toString(),
    vehicleType: 'car' as 'car' | 'bike',
    fuelType: 'petrol' as 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng',
    transmission: 'manual' as 'manual' | 'automatic' | 'cvt',
    kilometersDriven: '',
    price: '',
    negotiable: true,
    location: '',
    city: '',
    state: '',
    description: '',
    financingAvailable: false,
    testDriveAvailable: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFetchAISpecs = async () => {
    if (!formData.brand || !formData.model || !formData.year) {
      Alert.alert('Error', 'Please fill in Brand, Model, and Year first');
      return;
    }

    // Check if user is authenticated
    const { authService } = await import('../../services/auth.service');
    
    if (!authService.isAuthenticated()) {
      Alert.alert(
        'Authentication Required',
        'AI vehicle recognition requires authentication. Please log in to your account first.\n\nNote: You can still fill the form manually without using AI features.',
        [{ text: 'OK' }]
      );
      return;
    }

    setFetchingAI(true);
    try {
      const response = await vehicleSpecsService.recognizeVehicle({
        brand: formData.brand,
        model: formData.model,
        variant: formData.variant || undefined,
        year: parseInt(formData.year) || new Date().getFullYear(),
        vehicleType: formData.vehicleType,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
      });

      if (response.success && response.data?.specification) {
        const spec = response.data.specification;
        setAiSpecs(spec);

        // Auto-fill form with AI data
        const updates: any = {};

        // Auto-fill fuel type and transmission if not set
        if (spec.fuel?.type && !formData.fuelType) {
          updates.fuelType = spec.fuel.type.toLowerCase();
        }
        if (spec.transmission?.type && !formData.transmission) {
          const trans = spec.transmission.type.toLowerCase();
          if (trans.includes('automatic') || trans.includes('cvt')) {
            updates.transmission = trans.includes('cvt') ? 'cvt' : 'automatic';
          }
        }

        // Auto-generate title if empty
        if (!formData.title) {
          updates.title = `${formData.year} ${formData.brand} ${formData.model} ${formData.variant || ''}`.trim();
        }

        // Auto-fill description with features if empty
        if (!formData.description && spec.features) {
          const featureList: string[] = [];
          Object.entries(spec.features).forEach(([category, features]: [string, any]) => {
            if (Array.isArray(features) && features.length > 0) {
              featureList.push(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${features.slice(0, 5).join(', ')}`);
            }
          });
          if (featureList.length > 0) {
            updates.description = `Well-maintained ${formData.brand} ${formData.model} with features:\n${featureList.join('\n')}`;
          }
        }

        setFormData((prev) => ({ ...prev, ...updates }));

        Alert.alert(
          'AI Specs Loaded',
          response.data.isNewVehicle
            ? 'New vehicle recognized! Specifications fetched from AI.'
            : 'Vehicle specifications found in database.',
          [{ text: 'OK' }]
        );
      } else {
        if (response.error?.includes('Unauthorized') || response.error?.includes('Authentication')) {
          Alert.alert(
            'Authentication Required',
            'Please log in to use AI features. You can continue filling the form manually.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Info', response.error || 'Could not fetch AI specifications. You can continue filling manually.');
        }
      }
    } catch (error: any) {
      console.error('Error fetching AI specs:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        Alert.alert(
          'Authentication Required',
          'Please log in to use AI features. You can continue filling the form manually.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch AI specifications. Please continue filling manually.');
      }
    } finally {
      setFetchingAI(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to upload images'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        const totalImages = selectedImages.length + newImages.length;
        
        if (totalImages > 10) {
          Alert.alert('Error', 'Maximum 10 images allowed');
          return;
        }

        setSelectedImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.title || !formData.brand || !formData.model) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        return true;
      case 2:
        if (!formData.city || !formData.state || !formData.location || !formData.price) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    if (!formData.title || !formData.brand || !formData.model || !formData.price || !formData.city || !formData.state || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const vehicleData: CreateVehicleData = {
        title: formData.title,
        brand: formData.brand,
        model: formData.model,
        variant: formData.variant || undefined,
        year: parseInt(formData.year) || new Date().getFullYear(),
        vehicleType: formData.vehicleType,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        kilometersDriven: formData.kilometersDriven ? parseInt(formData.kilometersDriven) : undefined,
        price: parseFloat(formData.price),
        negotiable: formData.negotiable,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        description: formData.description || undefined,
        financingAvailable: formData.financingAvailable,
        testDriveAvailable: formData.testDriveAvailable,
        saleType: 'direct', // Default to direct sale
      };

      console.log('Submitting vehicle data:', { ...vehicleData, imagesCount: selectedImages.length });

      const response = await vehicleService.createVehicle(vehicleData, selectedImages);

      console.log('Vehicle creation response:', response);

      if (response.success) {
        Alert.alert(
          'Success',
          'Vehicle listed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  title: '',
                  brand: '',
                  model: '',
                  variant: '',
                  year: new Date().getFullYear().toString(),
                  vehicleType: 'car',
                  fuelType: 'petrol',
                  transmission: 'manual',
                  kilometersDriven: '',
                  price: '',
                  negotiable: true,
                  location: '',
                  city: '',
                  state: '',
                  description: '',
                  financingAvailable: false,
                  testDriveAvailable: false,
                });
                setSelectedImages([]);
                setStep(1);
                // Navigate to home or profile
                router.push('/(drawer)/(tabs)');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to list vehicle. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting vehicle:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to list vehicle. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center items-center px-5 mb-6">
      {[1, 2, 3, 4].map((num) => (
        <View key={num} className="flex-row items-center">
          <View
            className={`w-9 h-9 rounded-full justify-center items-center ${
              step >= num ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                step >= num ? 'text-white' : 'text-gray-600'
              }`}
            >
              {num}
            </Text>
          </View>
          {num < 4 && (
            <View
              className={`w-10 h-0.5 ${
                step > num ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="bg-white mx-5 mb-5 rounded-xl p-5 shadow-sm">
      <Text className="text-xl font-bold text-gray-900 mb-1">
        Basic Information
      </Text>
      <Text className="text-sm text-gray-500 mb-5">
        Provide essential details about your vehicle
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Vehicle Title *
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
          placeholder="e.g., Honda City VX Diesel"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Vehicle Type
        </Text>
        <View className="border border-gray-300 rounded-lg overflow-hidden">
          <Picker
            selectedValue={formData.vehicleType}
            onValueChange={(value) => handleInputChange('vehicleType', value)}
            className="h-12"
          >
            <Picker.Item label="Car" value="car" />
            <Picker.Item label="Bike" value="bike" />
          </Picker>
        </View>
      </View>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Brand *
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
            value={formData.brand}
            onChangeText={(value) => handleInputChange('brand', value)}
            placeholder="e.g., Honda"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Model *
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
            value={formData.model}
            onChangeText={(value) => handleInputChange('model', value)}
            placeholder="e.g., City"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* AI Recognition Button */}
      {formData.brand && formData.model && formData.year && (
        <TouchableOpacity
          onPress={handleFetchAISpecs}
          disabled={fetchingAI}
          className={`mb-4 flex-row items-center justify-center py-3 px-4 rounded-lg border-2 ${
            fetchingAI
              ? 'bg-gray-100 border-gray-300'
              : 'bg-blue-50 border-blue-500'
          }`}
        >
          {fetchingAI ? (
            <>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text className="text-blue-600 font-semibold ml-2">Fetching AI Specs...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#2563EB" />
              <Text className="text-blue-600 font-semibold ml-2">
                🤖 Auto-fill with AI
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {aiSpecs && (
        <View className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <View className="flex-row items-center mb-2">
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text className="text-green-800 font-semibold ml-2">AI Specs Loaded</Text>
          </View>
          {aiSpecs.features && (
            <Text className="text-green-700 text-xs">
              Features: {Object.values(aiSpecs.features).flat().slice(0, 5).join(', ')}...
            </Text>
          )}
        </View>
      )}

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Variant
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
          value={formData.variant}
          onChangeText={(value) => handleInputChange('variant', value)}
          placeholder="e.g., VX"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Year</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
            value={formData.year}
            onChangeText={(value) => handleInputChange('year', value)}
            keyboardType="numeric"
            placeholder="2024"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            KM Driven
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
            value={formData.kilometersDriven}
            onChangeText={(value) =>
              handleInputChange('kilometersDriven', value)
            }
            keyboardType="numeric"
            placeholder="45000"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Fuel Type
        </Text>
        <View className="border border-gray-300 rounded-lg overflow-hidden">
          <Picker
            selectedValue={formData.fuelType}
            onValueChange={(value) => handleInputChange('fuelType', value)}
            className="h-12"
          >
            <Picker.Item label="Petrol" value="petrol" />
            <Picker.Item label="Diesel" value="diesel" />
            <Picker.Item label="Electric" value="electric" />
            <Picker.Item label="Hybrid" value="hybrid" />
            <Picker.Item label="CNG" value="cng" />
          </Picker>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Transmission
        </Text>
        <View className="border border-gray-300 rounded-lg overflow-hidden">
          <Picker
            selectedValue={formData.transmission}
            onValueChange={(value) => handleInputChange('transmission', value)}
            className="h-12"
          >
            <Picker.Item label="Manual" value="manual" />
            <Picker.Item label="Automatic" value="automatic" />
            <Picker.Item label="CVT" value="cvt" />
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="bg-white mx-5 mb-5 rounded-xl p-5 shadow-sm">
      <Text className="text-xl font-bold text-gray-900 mb-1">
        Location & Pricing
      </Text>
      <Text className="text-sm text-gray-500 mb-5">
        Where is your vehicle located and what's your asking price?
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">City *</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
          value={formData.city}
          onChangeText={(value) => handleInputChange('city', value)}
          placeholder="e.g., Mumbai"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">State *</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
          value={formData.state}
          onChangeText={(value) => handleInputChange('state', value)}
          placeholder="e.g., Maharashtra"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Specific Location *
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
          value={formData.location}
          onChangeText={(value) => handleInputChange('location', value)}
          placeholder="e.g., Andheri West"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Asking Price (₹) *
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900"
          value={formData.price}
          onChangeText={(value) => handleInputChange('price', value)}
          keyboardType="numeric"
          placeholder="850000"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        className="flex-row items-center mb-3"
        onPress={() => handleInputChange('negotiable', !formData.negotiable)}
      >
        <View
          className={`w-5 h-5 border-2 rounded mr-2 justify-center items-center ${
            formData.negotiable
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300'
          }`}
        >
          {formData.negotiable && (
            <Text className="text-white text-sm font-bold">✓</Text>
          )}
        </View>
        <Text className="text-sm text-gray-700">Price is negotiable</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View className="bg-white mx-5 mb-5 rounded-xl p-5 shadow-sm">
      <Text className="text-xl font-bold text-gray-900 mb-1">
        Description & Additional Details
      </Text>
      <Text className="text-sm text-gray-500 mb-5">
        Provide more details about your vehicle
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Description
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-900 min-h-[100px]"
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Describe your vehicle's condition, features, service history, etc."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        className="flex-row items-center mb-3"
        onPress={() =>
          handleInputChange('financingAvailable', !formData.financingAvailable)
        }
      >
        <View
          className={`w-5 h-5 border-2 rounded mr-2 justify-center items-center ${
            formData.financingAvailable
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300'
          }`}
        >
          {formData.financingAvailable && (
            <Text className="text-white text-sm font-bold">✓</Text>
          )}
        </View>
        <Text className="text-sm text-gray-700">Financing Available</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center mb-3"
        onPress={() =>
          handleInputChange('testDriveAvailable', !formData.testDriveAvailable)
        }
      >
        <View
          className={`w-5 h-5 border-2 rounded mr-2 justify-center items-center ${
            formData.testDriveAvailable
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300'
          }`}
        >
          {formData.testDriveAvailable && (
            <Text className="text-white text-sm font-bold">✓</Text>
          )}
        </View>
        <Text className="text-sm text-gray-700">Test Drive Available</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View className="bg-white mx-5 mb-5 rounded-xl p-5 shadow-sm">
      <Text className="text-xl font-bold text-gray-900 mb-1">
        Vehicle Images
      </Text>
      <Text className="text-sm text-gray-500 mb-5">
        Upload high-quality images (Max 10 images, 5MB each)
      </Text>

      <TouchableOpacity
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center mb-4"
        onPress={handleImagePicker}
      >
        <Text className="text-5xl mb-2">📷</Text>
        <Text className="text-base font-semibold text-gray-700 mb-1">
          Click to upload images
        </Text>
        <Text className="text-sm text-gray-400">
          JPEG, PNG, WebP up to 5MB each
        </Text>
      </TouchableOpacity>

      {selectedImages.length > 0 && (
        <View className="flex-row flex-wrap gap-3">
          {selectedImages.map((img, index) => (
            <View key={index} className="w-[30%] aspect-square relative">
              <Image
                source={{ uri: img }}
                className="w-full h-full rounded-lg"
              />
              <TouchableOpacity
                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
                onPress={() => removeImage(index)}
              >
                <Text className="text-white text-base font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {selectedImages.length > 0 && (
        <Text className="text-sm text-gray-500 mt-2">
          {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''}{' '}
          selected
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-5 pt-10">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Sell Your Vehicle
          </Text>
          <Text className="text-base text-gray-600">
            List your car or bike and reach thousands of buyers
          </Text>
        </View>

        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <View className="flex-row gap-3 p-5 pb-10">
          {step > 1 && (
            <TouchableOpacity
              className="flex-1 bg-white border border-gray-300 py-3.5 rounded-lg items-center"
              onPress={handleBack}
            >
              <Text className="text-gray-700 text-base font-semibold">
                Back
              </Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3.5 rounded-lg items-center"
              onPress={handleNext}
            >
              <Text className="text-white text-base font-semibold">Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3.5 rounded-lg items-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  List Vehicle
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Sell;