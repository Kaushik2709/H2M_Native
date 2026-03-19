import { authService } from './auth.service';

export interface WishlistItem {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle?: any;
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

export const wishlistService = {
  /**
   * Get user's wishlist
   */
  getWishlist: async (): Promise<ApiResponse<WishlistItem[]>> => {
    try {
      const response = await makeRequest('/api/wishlists');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { success: false, error: 'Failed to fetch wishlist' };
    }
  },

  /**
   * Add vehicle to wishlist
   */
  addToWishlist: async (vehicleId: string): Promise<ApiResponse<WishlistItem>> => {
    try {
      const response = await makeRequest(`/api/wishlists/${vehicleId}`, {
        method: 'POST',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, error: 'Failed to add to wishlist' };
    }
  },

  /**
   * Remove vehicle from wishlist
   */
  removeFromWishlist: async (vehicleId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await makeRequest(`/api/wishlists/${vehicleId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: 'Failed to remove from wishlist' };
    }
  },
};
