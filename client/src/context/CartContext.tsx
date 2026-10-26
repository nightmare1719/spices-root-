import React, { createContext, useContext, useState, useEffect } from 'react';
import { ICartCalculation, ICartItem } from '../types/index.js';
import { api } from '../services/api.js';

interface CartContextType {
  cart: ICartCalculation;
  totalItems: number;
  isLoading: boolean;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const defaultCartState: ICartCalculation = {
  items: [],
  subtotalPaise: 0,
  qualifiesForFreeShipping: false,
  freeShippingThresholdPaise: 99900,
  freeShippingRemainingPaise: 99900
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<ICartCalculation>(defaultCartState);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState<boolean>(false);

  const refreshCart = async () => {
    try {
      const res = await api.getCart();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.warn('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();

    const handleAuthChange = () => {
      refreshCart();
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
    };
  }, []);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);

  const addToCart = async (productId: string, variantId: string, quantity: number = 1) => {
    setIsLoading(true);
    try {
      const res = await api.addToCart(productId, variantId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
        setIsMiniCartOpen(true); // Delightful slide-out drawer on add
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to add item to cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, variantId: string, quantity: number) => {
    try {
      const res = await api.updateCartItem(productId, variantId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (productId: string, variantId: string) => {
    try {
      const res = await api.removeCartItem(productId, variantId);
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setCart({
        ...defaultCartState,
        freeShippingThresholdPaise: cart.freeShippingThresholdPaise,
        freeShippingRemainingPaise: cart.freeShippingThresholdPaise
      });
    } catch (err) {
      console.warn('Failed to clear cart:', err);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      totalItems,
      isLoading,
      isMiniCartOpen,
      openMiniCart,
      closeMiniCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
