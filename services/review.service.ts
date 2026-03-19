import { authService } from './auth.service';

export interface Review {
  id: string;
  vehicleId: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  rating: number;
  title?: string;
  content: string;
  pros?: string[];
  cons?: string[];
  isExpertReview: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const makeRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  return authService.makeAuthenticatedRequest(endpoint, options);
};

export const reviewService = {
  /**
   * Get reviews for a vehicle
   */
  getVehicleReviews: async (vehicleId: string): Promise<ApiResponse<Review[]>> => {
    try {
      const response = await makeRequest(`/api/reviews/vehicles/${vehicleId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching vehicle reviews:', error);
      return { success: false, error: 'Failed to fetch vehicle reviews' };
    }
  },

  /**
   * Get expert review for a vehicle
   */
  getExpertReview: async (vehicleId: string): Promise<ApiResponse<Review>> => {
    try {
      const response = await makeRequest(`/api/reviews/expert/${vehicleId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching expert review:', error);
      return { success: false, error: 'Failed to fetch expert review' };
    }
  },

  /**
   * Create a customer review
   */
  createReview: async (reviewData: {
    vehicleId: string;
    rating: number;
    title?: string;
    content: string;
    pros?: string[];
    cons?: string[];
  }): Promise<ApiResponse<Review>> => {
    try {
      const response = await makeRequest('/api/reviews/vehicles', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      return { success: false, error: 'Failed to create review' };
    }
  },

  /**
   * Mark review as helpful
   */
  markAsHelpful: async (reviewId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await makeRequest(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      return { success: false, error: 'Failed to mark review as helpful' };
    }
  },
};
