import { API_BASE } from '../config/api';

export interface Auction {
  id: string;
  vehicleId: string;
  vehicle?: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    city: string;
    vehicleType: string;
    images: string[];
    viewsCount?: number;
    fuelType?: string;
    transmission?: string;
    description?: string;
    features?: any;
  };
  startingPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  currentBid: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'live' | 'ended' | 'cancelled';
  auctionType: string;
  totalBids: number;
  watchersCount?: number;
  winnerId?: string;
  winner?: any;
  isDepositRequired?: boolean;
  depositAmount?: number;
  inspectionReport?: {
    overallScore: number;
    summary: string;
    reportUrl: string;
    engineScore?: number;
    exteriorScore?: number;
    interiorScore?: number;
    tyreScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidder?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
  };
  amount: number;
  isWinning: boolean;
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

// Use auth service for token management
import { authService } from './auth.service';

// Helper to make authenticated requests
const makeRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  return authService.makeAuthenticatedRequest(endpoint, options);
};

export const auctionService = {
  /**
   * Get all auctions with optional filters
   */
  getAuctions: async (filters?: {
    status?: string;
    auctionType?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    vehicleType?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Auction[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await makeRequest(`/api/auctions?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching auctions:', error);
      return { success: false, error: 'Failed to fetch auctions' };
    }
  },

  /**
   * Get live auctions
   */
  getLiveAuctions: async (): Promise<ApiResponse<Auction[]>> => {
    try {
      const response = await makeRequest('/api/auctions/db/live');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching live auctions:', error);
      return { success: false, error: 'Failed to fetch live auctions' };
    }
  },

  /**
   * Get auction by ID
   */
  getAuction: async (id: string): Promise<ApiResponse<Auction>> => {
    try {
      const response = await makeRequest(`/api/auctions/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching auction:', error);
      return { success: false, error: 'Failed to fetch auction' };
    }
  },

  /**
   * Get bid history for an auction
   */
  getBidHistory: async (
    auctionId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<Bid[]>> => {
    try {
      const response = await makeRequest(
        `/api/auctions/${auctionId}/bids?page=${page}&limit=${limit}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bid history:', error);
      return { success: false, error: 'Failed to fetch bid history' };
    }
  },

  /**
   * Place a bid on an auction
   */
  placeBid: async (
    auctionId: string,
    amount: number
  ): Promise<ApiResponse<{ bid: Bid; auction: Auction }>> => {
    try {
      const response = await makeRequest(`/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error placing bid:', error);
      return { success: false, error: 'Failed to place bid' };
    }
  },

  /**
   * Place deposit for auction participation
   */
  placeDeposit: async (
    auctionId: string,
    paymentMethod: string,
    transactionId?: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest(`/api/auctions/${auctionId}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod, transactionId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error placing deposit:', error);
      return { success: false, error: 'Failed to place deposit' };
    }
  },

  /**
   * Buy Now option
   */
  buyNow: async (auctionId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest(`/api/auctions/${auctionId}/buy-now`, {
        method: 'POST',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing buy now:', error);
      return { success: false, error: 'Failed to process buy now' };
    }
  },

  /**
   * Watch/Unwatch auction
   */
  watchAuction: async (auctionId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await makeRequest(`/api/auctions/${auctionId}/watch`, {
        method: 'POST',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error watching auction:', error);
      return { success: false, error: 'Failed to watch auction' };
    }
  },

  unwatchAuction: async (auctionId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await makeRequest(`/api/auctions/${auctionId}/watch`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error unwatching auction:', error);
      return { success: false, error: 'Failed to unwatch auction' };
    }
  },

  /**
   * Get user's bid history
   */
  getMyBids: async (page: number = 1, limit: number = 20): Promise<ApiResponse<Bid[]>> => {
    try {
      const response = await makeRequest(`/api/auctions/my/bids?page=${page}&limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching my bids:', error);
      return { success: false, error: 'Failed to fetch my bids' };
    }
  },

  /**
   * Get auctions user has won
   */
  getWonAuctions: async (): Promise<ApiResponse<Auction[]>> => {
    try {
      const response = await makeRequest('/api/auctions/my/won');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching won auctions:', error);
      return { success: false, error: 'Failed to fetch won auctions' };
    }
  },

  /**
   * Get auctions user is watching
   */
  getWatchedAuctions: async (): Promise<ApiResponse<Auction[]>> => {
    try {
      const response = await makeRequest('/api/auctions/my/watching');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching watched auctions:', error);
      return { success: false, error: 'Failed to fetch watched auctions' };
    }
  },

  /**
   * Create a new auction (dealer/seller only)
   */
  createAuction: async (auctionData: {
    vehicleId: string;
    startingPrice: number;
    reservePrice?: number;
    buyNowPrice?: number;
    startTime: string;
    endTime: string;
    auctionType?: string;
    bidIncrement?: number;
    depositRequired?: boolean;
    depositAmount?: number;
    autoExtendMins?: number;
    maxExtensions?: number;
    pickupLocation?: string;
    pickupDeadlineDays?: number;
    storageFeeDaily?: number;
  }): Promise<ApiResponse<Auction>> => {
    try {
      console.log('Creating auction with data:', auctionData);
      
      const response = await makeRequest('/api/auctions', {
        method: 'POST',
        body: JSON.stringify(auctionData),
      });

      console.log('Auction creation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auction creation error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to create auction' };
        }
        return { success: false, error: errorData.error || errorData.message || 'Failed to create auction' };
      }

      const data = await response.json();
      console.log('Auction creation success:', data);
      return data;
    } catch (error: any) {
      console.error('Error creating auction:', error);
      return { success: false, error: error.message || 'Failed to create auction' };
    }
  },

  // ============================================================================
  // LIVE AUCTION METHODS (Go Server Bridge)
  // ============================================================================

  /**
   * Get live auction server status
   */
  getLiveServerStatus: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest('/api/auctions/live/status');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching live server status:', error);
      return { success: false, error: 'Failed to fetch live server status' };
    }
  },

  /**
   * Get current live auction state
   */
  getLiveAuctionState: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest('/api/auctions/live/state');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching live auction state:', error);
      return { success: false, error: 'Failed to fetch live auction state' };
    }
  },

  /**
   * Place bid on live auction
   */
  placeLiveBid: async (amount: number): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest('/api/auctions/live/bid', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error placing live bid:', error);
      return { success: false, error: 'Failed to place live bid' };
    }
  },

  /**
   * Start live auction (admin only)
   */
  startLiveAuction: async (itemName: string, startingPrice: number): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest('/api/auctions/live/start', {
        method: 'POST',
        body: JSON.stringify({ itemName, startingPrice }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting live auction:', error);
      return { success: false, error: 'Failed to start live auction' };
    }
  },

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get auction statistics
   */
  getAuctionStats: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await makeRequest('/api/auctions/admin/stats');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching auction stats:', error);
      return { success: false, error: 'Failed to fetch auction stats' };
    }
  },
};

