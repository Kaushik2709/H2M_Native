import { authService } from './auth.service';

export interface TestDrive {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle?: any;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  status: string;
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

export const testDriveService = {
  /**
   * Get user's test drives
   */
  getMyTestDrives: async (): Promise<ApiResponse<TestDrive[]>> => {
    try {
      const response = await makeRequest('/api/test-drives');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching test drives:', error);
      return { success: false, error: 'Failed to fetch test drives' };
    }
  },

  /**
   * Book a test drive
   */
  bookTestDrive: async (testDriveData: {
    vehicleId: string;
    scheduledDate: string;
    scheduledTime: string;
    location: string;
  }): Promise<ApiResponse<TestDrive>> => {
    try {
      const response = await makeRequest('/api/test-drives', {
        method: 'POST',
        body: JSON.stringify(testDriveData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error booking test drive:', error);
      return { success: false, error: 'Failed to book test drive' };
    }
  },
};
