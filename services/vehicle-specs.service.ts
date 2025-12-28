import { API_BASE } from '../config/api';
import { authService } from './auth.service';

export interface VehicleSpec {
  id: string;
  specKey: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  vehicleType: string;
  displayName: string;
  engine?: any;
  fuel?: any;
  transmission?: any;
  dimensions?: any;
  features?: Record<string, string[]>;
  colors?: Array<{ name: string; hexCode?: string }>;
  variants?: Array<{ name: string; price?: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const makeRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  return authService.makeAuthenticatedRequest(endpoint, options);
};

export const vehicleSpecsService = {
  /**
   * Search for vehicle specifications (autocomplete)
   */
  searchSpecs: async (query: string, limit: number = 10): Promise<ApiResponse<VehicleSpec[]>> => {
    try {
      const response = await makeRequest(`/api/vehicle-specs/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching specs:', error);
      return { success: false, error: 'Failed to search specifications' };
    }
  },

  /**
   * Get popular brands
   */
  getBrands: async (vehicleType?: string): Promise<ApiResponse<string[]>> => {
    try {
      const url = vehicleType 
        ? `/api/vehicle-specs/brands?vehicleType=${vehicleType}`
        : '/api/vehicle-specs/brands';
      const response = await makeRequest(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      return { success: false, error: 'Failed to fetch brands' };
    }
  },

  /**
   * Get models for a brand
   */
  getModels: async (brand: string, vehicleType?: string): Promise<ApiResponse<string[]>> => {
    try {
      const params = new URLSearchParams({ brand });
      if (vehicleType) params.append('vehicleType', vehicleType);
      
      const response = await makeRequest(`/api/vehicle-specs/models?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching models:', error);
      return { success: false, error: 'Failed to fetch models' };
    }
  },

  /**
   * Recognize vehicle and fetch AI-generated specifications
   */
  recognizeVehicle: async (vehicleData: {
    brand: string;
    model: string;
    variant?: string;
    year: number;
    vehicleType: string;
    fuelType?: string;
    transmission?: string;
  }): Promise<ApiResponse<{ isNewVehicle: boolean; specification: VehicleSpec }>> => {
    try {
      const response = await makeRequest('/api/vehicle-specs/recognize', {
        method: 'POST',
        body: JSON.stringify(vehicleData),
      });

      // Check for authentication errors
      if (response.status === 401) {
        return { success: false, error: 'Authentication required. Please log in to use AI features.' };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to recognize vehicle' }));
        return { success: false, error: errorData.error || 'Failed to recognize vehicle' };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error recognizing vehicle:', error);
      return { success: false, error: 'Failed to recognize vehicle' };
    }
  },
};

