import { Platform } from 'react-native';
import { API_BASE } from '../config/api';
import { authService } from './auth.service';

export interface Vehicle {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    vehicleType: string;
    fuelType: string;
    transmission: string;
    price: number;
    city: string;
    images: string[];
    saleType?: string;
    isActive?: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Helper to make authenticated requests
const makeRequest = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    return authService.makeAuthenticatedRequest(endpoint, options);
};

export interface CreateVehicleData {
    title: string;
    brand: string;
    model: string;
    variant?: string;
    year: number;
    vehicleType: 'car' | 'bike';
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
    transmission: 'manual' | 'automatic' | 'cvt';
    kilometersDriven?: number;
    price: number;
    negotiable?: boolean;
    location: string;
    city: string;
    state: string;
    description?: string;
    features?: Record<string, any>;
    saleType?: 'direct' | 'auction';
    serviceHistory?: Record<string, any>;
    insuranceDetails?: Record<string, any>;
    financingAvailable?: boolean;
    testDriveAvailable?: boolean;
}

export const vehicleService = {
    /**
     * Get current user's vehicles
     */
    getMyVehicles: async (): Promise<ApiResponse<Vehicle[]>> => {
        try {
            // Ensure auth service is initialized
            if (!authService.getToken()) {
                await authService.initialize();
            }

            console.log('🚗 Fetching vehicles from:', `${API_BASE}/api/vehicles/my`);
            
            const response = await makeRequest('/api/vehicles/my');
            
            console.log('🚗 Response status:', response.status);
            console.log('🚗 Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Handle 401 - authentication required
            if (response.status === 401) {
                return { 
                    success: false, 
                    error: 'Authentication required. Please sign in to view your vehicles.' 
                };
            }

            // Handle network errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error('🚗 API Error:', errorText);
                return { 
                    success: false, 
                    error: `Failed to fetch vehicles: ${response.status} ${response.statusText}` 
                };
            }

            const data = await response.json();
            console.log('🚗 Vehicles fetched successfully:', data.success ? `Found ${data.data?.length || 0} vehicles` : data.error);
            return data;
        } catch (error: any) {
            console.error('🚗 Error fetching my vehicles:', error);
            console.error('🚗 Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });
            return { 
                success: false, 
                error: error.message || 'Failed to fetch vehicles. Check network connection and API URL.' 
            };
        }
    },

    /**
     * Create a new vehicle listing with images
     */
  createVehicle: async (
    vehicleData: CreateVehicleData,
    images: string[] // Array of local image URIs
  ): Promise<ApiResponse<Vehicle>> => {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      console.log('Creating vehicle with data:', { ...vehicleData, imagesCount: images.length });

      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Add vehicle data fields
      formData.append('title', vehicleData.title);
      formData.append('brand', vehicleData.brand);
      formData.append('model', vehicleData.model);
      if (vehicleData.variant) {
        formData.append('variant', vehicleData.variant);
      }
      formData.append('year', vehicleData.year.toString());
      formData.append('vehicleType', vehicleData.vehicleType);
      formData.append('fuelType', vehicleData.fuelType);
      formData.append('transmission', vehicleData.transmission);
      if (vehicleData.kilometersDriven) {
        formData.append('kilometersDriven', vehicleData.kilometersDriven.toString());
      }
      formData.append('price', vehicleData.price.toString());
      formData.append('negotiable', (vehicleData.negotiable ?? true).toString());
      formData.append('location', vehicleData.location);
      formData.append('city', vehicleData.city);
      formData.append('state', vehicleData.state);
      if (vehicleData.description) {
        formData.append('description', vehicleData.description);
      }
      if (vehicleData.saleType) {
        formData.append('saleType', vehicleData.saleType);
      }
      if (vehicleData.financingAvailable !== undefined) {
        formData.append('financingAvailable', vehicleData.financingAvailable.toString());
      }
      if (vehicleData.testDriveAvailable !== undefined) {
        formData.append('testDriveAvailable', vehicleData.testDriveAvailable.toString());
      }
      if (vehicleData.features) {
        formData.append('features', JSON.stringify(vehicleData.features));
      }
      if (vehicleData.serviceHistory) {
        formData.append('serviceHistory', JSON.stringify(vehicleData.serviceHistory));
      }
      if (vehicleData.insuranceDetails) {
        formData.append('insuranceDetails', JSON.stringify(vehicleData.insuranceDetails));
      }

      // Add images - Handle web and native platforms differently
      console.log('Processing images for platform:', Platform.OS);
      if (Platform.OS === 'web') {
        // For web, we need to convert the URI to a File/Blob
        console.log('Processing web images, count:', images.length);
        for (let i = 0; i < images.length; i++) {
          const imageUri = images[i];
          console.log(`Processing image ${i + 1}/${images.length}:`, imageUri.substring(0, 50) + '...');
          try {
            // Check if it's already a File/Blob (unlikely but handle it)
            const uriAsAny = imageUri as any;
            if (uriAsAny instanceof File || uriAsAny instanceof Blob) {
              console.log(`Image ${i + 1} is already a File/Blob`);
              formData.append('images', uriAsAny);
              continue;
            }

            // Check if it's a data URL
            if (imageUri.startsWith('data:')) {
              console.log(`Image ${i + 1} is a data URL`);
              const response = await fetch(imageUri);
              const blob = await response.blob();
              const filename = `image_${i}.jpg`;
              const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
              formData.append('images', file);
              console.log(`Image ${i + 1} converted from data URL`);
              continue;
            }

            // Fetch the image as a blob
            console.log(`Fetching image ${i + 1} from URI...`);
            const response = await fetch(imageUri);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            console.log(`Image ${i + 1} fetched, size:`, blob.size, 'bytes');
            const filename = imageUri.split('/').pop() || `image_${i}.jpg`;
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            formData.append('images', file);
            console.log(`Image ${i + 1} added to FormData`);
          } catch (error) {
            console.error(`Error processing image ${i + 1}:`, error);
            // Continue with other images
          }
        }
        console.log('All web images processed');
      } else {
        // For React Native (iOS/Android)
        images.forEach((imageUri, index) => {
          const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('images', {
            uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
            name: filename,
            type: type,
          } as any);
        });
      }

      console.log('Sending request to:', `${API_BASE}/api/vehicles`);
      console.log('FormData entries count:', images.length, 'images');
      console.log('Token present:', !!token);

      // Don't set Content-Type header - let fetch set it automatically with boundary
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('Request timeout after 60 seconds');
        controller.abort();
      }, 60000); // 60 second timeout

      let response: Response;
      try {
        console.log('Starting fetch request...');
        response = await fetch(`${API_BASE}/api/vehicles`, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('Fetch completed. Response status:', response.status);
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', error);
        if (error.name === 'AbortError') {
          console.error('Request was aborted due to timeout');
          return { success: false, error: 'Request timeout. Please check your connection and try again.' };
        }
        throw error;
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('Response not OK, reading error text...');
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error('Parsed error data:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: errorText || 'Failed to create vehicle listing' };
        }
        return { success: false, error: errorData.error || errorData.message || 'Failed to create vehicle listing' };
      }

      console.log('Response OK, parsing JSON...');
      const data = await response.json();
      console.log('Success response data:', data);
      return data;
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create vehicle listing. Please check your connection and try again.' 
      };
    }
  },
};

