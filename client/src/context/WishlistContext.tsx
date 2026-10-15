import React, { createContext, useContext, useState, useEffect } from 'react';

interface WishlistContextType {
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('spiceroots_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('spiceroots_wishlist', JSON.stringify(wishlistIds));
    } catch {
      // Ignored
    }
  }, [wishlistIds]);

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
