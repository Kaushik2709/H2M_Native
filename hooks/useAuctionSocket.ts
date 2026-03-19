import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE } from '../config/api';
import { Auction, Bid } from '../services/auction.service';

// Convert http:// to ws://
const WS_URL = (API_BASE || '').replace('http', 'ws') + '/ws/auction';

// Connection states for better UI feedback
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface AuctionSocketState {
  currentBid: number;
  totalBids: number;
  bidder?: {
    id: string;
    name: string;
  };
}

interface UseAuctionSocketReturn {
  // Bid data
  lastBid: Bid | null;
  currentBid: number;
  totalBids: number;
  currentBidder: string | null;

  // Auction state
  auctionStatus: Auction['status'] | null;
  auctionState: AuctionSocketState | null;

  // Timer
  timer: number | null;
  formattedTimer: string;

  // Connection
  isConnected: boolean;
  connectionState: ConnectionState;
  reconnectAttempts: number;

  // Actions
  sendBid: (amount: number, userId?: string, username?: string) => boolean;
  reconnect: () => void;
  disconnect: () => void;
}

// Format time remaining as HH:MM:SS or MM:SS
const formatTimer = (seconds: number | null): string => {
  if (seconds === null || seconds < 0) return '--:--';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const useAuctionSocket = (auctionId: string | null): UseAuctionSocketReturn => {
  // Bid state
  const [lastBid, setLastBid] = useState<Bid | null>(null);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [totalBids, setTotalBids] = useState<number>(0);
  const [currentBidder, setCurrentBidder] = useState<string | null>(null);

  // Auction state
  const [auctionStatus, setAuctionStatus] = useState<Auction['status'] | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionSocketState | null>(null);

  // Timer
  const [timer, setTimer] = useState<number | null>(null);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Constants
  const MAX_RECONNECT_ATTEMPTS = 15;
  const BASE_RECONNECT_DELAY = 1000;
  const MAX_RECONNECT_DELAY = 30000;
  const PING_INTERVAL = 25000;

  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = useCallback((attempt: number): number => {
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(1.5, attempt),
      MAX_RECONNECT_DELAY
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Disconnect cleanly
  const disconnect = useCallback(() => {
    clearTimers();
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnect');
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, [clearTimers]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!auctionId) {
      setConnectionState('disconnected');
      return;
    }

    // Don't connect if already connecting or connected
    if (socketRef.current &&
        (socketRef.current.readyState === WebSocket.CONNECTING ||
         socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setConnectionState(reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const wsUrl = `${WS_URL}/${auctionId}`;
      console.log(`🔌 Connecting to auction WebSocket: ${wsUrl}`);

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('✅ Auction WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        setReconnectAttempts(0);

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'PING' }));
          }
        }, PING_INTERVAL);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'AUCTION_STATE':
              // Full state update
              const state = message.data || message.payload;
              if (state) {
                setCurrentBid(state.currentBid || state.current_bid || 0);
                setTotalBids(state.totalBids || state.total_bids || 0);
                setAuctionStatus(state.status);
                setCurrentBidder(state.bidderName || state.bidder_name || null);
                setAuctionState({
                  currentBid: state.currentBid || state.current_bid || 0,
                  totalBids: state.totalBids || state.total_bids || 0,
                  bidder: state.bidder,
                });
              }
              break;

            case 'BID_UPDATE':
              const bidData = message.data || message.payload;
              if (bidData) {
                setCurrentBid(bidData.currentBid || bidData.amount);
                setTotalBids(prev => bidData.totalBids || prev + 1);
                if (bidData.bidder) {
                  setCurrentBidder(bidData.bidder.name || bidData.bidder.username);
                }
                if (bidData.bid) {
                  setLastBid(bidData.bid);
                }
                setAuctionState(prev => ({
                  ...prev,
                  currentBid: bidData.currentBid || bidData.amount,
                  totalBids: bidData.totalBids || (prev?.totalBids || 0) + 1,
                  bidder: bidData.bidder,
                }));
              }
              break;

            case 'STATUS_UPDATE':
              const statusData = message.data || message.payload;
              if (statusData) {
                setAuctionStatus(statusData.status);
              }
              break;

            case 'TIMER_TICK':
              const timerData = message.data || message.payload;
              if (timerData) {
                setTimer(timerData.secondsLeft ?? timerData.seconds_left);
              }
              break;

            case 'ERROR':
              console.error('Auction socket error:', message.payload?.error || message.data?.error);
              break;

            case 'PONG':
              // Heartbeat response - connection is alive
              break;

            default:
              console.log('Unknown auction socket message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing auction socket message:', err);
        }
      };

      socket.onclose = (event) => {
        console.log(`🔌 Auction WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
        setIsConnected(false);
        clearTimers();

        // Don't reconnect if closed intentionally or max attempts reached
        if (event.code === 1000 || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionState('disconnected');
          return;
        }

        // Only reconnect if app is active
        if (appStateRef.current === 'active') {
          setConnectionState('reconnecting');
          const delay = getReconnectDelay(reconnectAttempts);
          console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      socket.onerror = (error) => {
        console.error('Auction WebSocket error:', error);
        setConnectionState('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState('error');
    }
  }, [auctionId, reconnectAttempts, getReconnectDelay, clearTimers]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Send bid through WebSocket
  const sendBid = useCallback((amount: number, userId?: string, username?: string): boolean => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send bid: WebSocket not connected');
      return false;
    }

    if (!auctionId) {
      console.warn('Cannot send bid: No auction ID');
      return false;
    }

    try {
      socketRef.current.send(JSON.stringify({
        type: 'PLACE_BID',
        auction_id: auctionId,
        payload: {
          amount,
          user_id: userId,
          username,
        },
      }));
      console.log(`💰 Bid sent via WebSocket: ₹${amount}`);
      return true;
    } catch (err) {
      console.error('Failed to send bid:', err);
      return false;
    }
  }, [auctionId]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - reconnect if needed
        if (!isConnected && auctionId) {
          console.log('📱 App active - reconnecting WebSocket');
          reconnect();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - could close connection to save battery
        // For auctions, we might want to keep it open for notifications
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isConnected, auctionId, reconnect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [auctionId]); // Reconnect when auctionId changes

  // Format timer for display
  const formattedTimer = formatTimer(timer);

  return {
    // Bid data
    lastBid,
    currentBid,
    totalBids,
    currentBidder,

    // Auction state
    auctionStatus,
    auctionState,

    // Timer
    timer,
    formattedTimer,

    // Connection
    isConnected,
    connectionState,
    reconnectAttempts,

    // Actions
    sendBid,
    reconnect,
    disconnect,
  };
};
