import { authService } from './auth.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const makeRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  return authService.makeAuthenticatedRequest(endpoint, options);
};

export const notificationService = {
  /**
   * Get all notifications for current user
   */
  getNotifications: async (page: number = 1, limit: number = 20): Promise<ApiResponse<Notification[]>> => {
    try {
      const response = await makeRequest(`/api/notifications?page=${page}&limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    try {
      const response = await makeRequest('/api/notifications/unread-count');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: 'Failed to fetch unread count' };
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await makeRequest(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    try {
      const response = await makeRequest('/api/notifications/read-all', {
        method: 'PUT',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await makeRequest(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  },
};
