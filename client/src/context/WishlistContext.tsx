import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.js';

interface WishlistContextType {
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user ? (user.id || user._id) : null;
  const storageKey = userId ? `spiceroots_wishlist_${userId}` : 'spiceroots_wishlist_guest';

  // Helper to load wishlist for key
  const loadStored = (key: string): string[] => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadStored(storageKey));
  const prevUserIdRef = useRef<string | null>(userId);

  // Sync whenever customer login/logout occurs
  useEffect(() => {
    const currentKey = userId ? `spiceroots_wishlist_${userId}` : 'spiceroots_wishlist_guest';
    const currentList = loadStored(currentKey);

    // If customer just logged in, migrate guest wishlist items into user's private wishlist
    if (userId && !prevUserIdRef.current) {
      const guestItems = loadStored('spiceroots_wishlist_guest');
      if (guestItems.length > 0) {
        const merged = Array.from(new Set([...currentList, ...guestItems]));
        localStorage.setItem(currentKey, JSON.stringify(merged));
        localStorage.removeItem('spiceroots_wishlist_guest');
        setWishlistIds(merged);
        prevUserIdRef.current = userId;
        return;
      }
    }

    setWishlistIds(currentList);
    prevUserIdRef.current = userId;
  }, [userId]);

  // Persist whenever wishlistIds changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(wishlistIds));
    } catch {
      // Ignored
    }
  }, [wishlistIds, storageKey]);

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = (productId: string) => {
    setWishlistIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <WishlistContext.Provider value={{
      wishlistIds,
      isWishlisted,
      toggleWishlist,
      wishlistCount: wishlistIds.length
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
