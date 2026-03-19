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

type BackendVehicleReviewsResponse = {
  items?: any[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

const normalizeReview = (raw: any): Review => {
  const ratingNumber = Number(
    raw?.rating ?? raw?.overallRating ?? raw?.overall_rating ?? 0
  );

  return {
    id: String(raw?.id ?? ''),
    vehicleId: String(raw?.vehicleId ?? raw?.vehicle_id ?? ''),
    userId: String(raw?.userId ?? raw?.user_id ?? ''),
    user: raw?.user
      ? {
          firstName: String(raw.user.firstName ?? raw.user.first_name ?? ''),
          lastName: String(raw.user.lastName ?? raw.user.last_name ?? ''),
          avatar: (raw.user.avatar ?? raw.user.avatarUrl ?? raw.user.avatar_url) as
            | string
            | undefined,
        }
      : undefined,
    rating: Number.isFinite(ratingNumber)
      ? Math.max(0, Math.min(5, Math.round(ratingNumber)))
      : 0,
    title: (raw?.title as string | undefined) ?? undefined,
    content: String(raw?.content ?? raw?.reviewText ?? raw?.review_text ?? ''),
    pros: (raw?.pros as string[] | undefined) ?? undefined,
    cons: (raw?.cons as string[] | undefined) ?? undefined,
    isExpertReview: Boolean(raw?.isExpertReview ?? raw?.reviewType === 'expert'),
    helpfulCount: Number(raw?.helpfulCount ?? raw?.helpful_count ?? 0) || 0,
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? new Date().toISOString()),
  };
};

const normalizeReviewsPayload = (payload: unknown): Review[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeReview);
  }

  if (payload && typeof payload === 'object') {
    const maybe = payload as BackendVehicleReviewsResponse;
    if (Array.isArray(maybe.items)) {
      return maybe.items.map(normalizeReview);
    }
  }

  return [];
};

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

      return {
        ...data,
        data: normalizeReviewsPayload(data?.data),
      } as ApiResponse<Review[]>;
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
