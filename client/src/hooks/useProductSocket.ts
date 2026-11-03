import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { IProduct } from '../types/index.js';
import { API_BASE } from '../services/api.js';

interface UseProductSocketProps {
  onProductUpdated?: (product: IProduct) => void;
  onProductCreated?: (product: IProduct) => void;
  onProductDeleted?: (payload: { _id?: string; id?: string }) => void;
}

/**
 * Socket URL determination:
 * Extracts host from API_BASE (e.g. http://localhost:5000/api -> http://localhost:5000)
 */
function getSocketUrl(): string {
  try {
    const url = new URL(API_BASE, window.location.origin);
    return url.origin;
  } catch {
    return window.location.origin;
  }
}

/**
 * Custom React Hook: useProductSocket
 * Manages WebSocket connection via Socket.io and listens for real-time
 * database changes broadcast from MongoDB Change Streams.
 */
export function useProductSocket({
  onProductUpdated,
  onProductCreated,
  onProductDeleted
}: UseProductSocketProps) {
  useEffect(() => {
    const socketUrl = getSocketUrl();
    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('⚡ [ProductSocket] Connected to real-time sync server:', socket.id);
    });

    if (onProductUpdated) {
      socket.on('product:updated', (product: IProduct) => {
        console.log('🔄 [ProductSocket] Real-time update received for product:', product._id || product.id);
        onProductUpdated(product);
      });
    }

    if (onProductCreated) {
      socket.on('product:created', (product: IProduct) => {
        console.log('✨ [ProductSocket] Real-time create received for product:', product._id || product.id);
        onProductCreated(product);
      });
    }

    if (onProductDeleted) {
      socket.on('product:deleted', (payload: { _id?: string; id?: string }) => {
        console.log('🗑️ [ProductSocket] Real-time delete received for product:', payload);
        onProductDeleted(payload);
      });
    }

    socket.on('disconnect', (reason) => {
      console.log('🔌 [ProductSocket] Disconnected from real-time sync server:', reason);
    });

    return () => {
      socket.off('product:updated');
      socket.off('product:created');
      socket.off('product:deleted');
      socket.disconnect();
    };
  }, [onProductUpdated, onProductCreated, onProductDeleted]);
}

