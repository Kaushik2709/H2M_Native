import { authService } from './auth.service';

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle?: any;
  bookingAmount: number;
  status: string;
  paymentStatus: string;
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

export const bookingService = {
  /**
   * Get user's bookings
   */
  getMyBookings: async (): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await makeRequest('/api/bookings');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: 'Failed to fetch bookings' };
    }
  },

  /**
   * Create a new booking
   */
  createBooking: async (bookingData: {
    vehicleId: string;
    bookingAmount: number;
  }): Promise<ApiResponse<Booking>> => {
    try {
      const response = await makeRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  },
};
