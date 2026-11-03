import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { IProduct } from '../types/index.js';
import { api } from '../services/api.js';
import { useProductSocket } from '../hooks/useProductSocket.js';

interface ProductContextType {
  products: IProduct[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  updateProduct: (id: string, updates: Partial<IProduct>) => Promise<IProduct>;
  deleteProduct: (id: string) => Promise<void>;
  createProduct: (data: Partial<IProduct>) => Promise<IProduct>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Anti-Reversion Guard: Flag ensures initial data fetch executes only ONCE on mount
  const hasInitializedRef = useRef<boolean>(false);

  /**
   * Fetches the products from backend API.
   * Runs once on mount; zero background interval polling loops.
   */
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getProducts({ limit: 100 });
      if (res.success && res.data?.products) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setError((err as Error).message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ensure initial data fetch ONLY runs once on mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadProducts();
    }
  }, [loadProducts]);

  /**
   * Real-Time Socket.io Handlers:
   * When manual changes are made in MongoDB Compass or Atlas,
   * the Mongoose Change Stream emits events, cleanly updating local React state.
   */
  const handleProductUpdated = useCallback((updatedProduct: IProduct) => {
    setProducts((prev) => {
      const targetId = updatedProduct._id || updatedProduct.id;
      const index = prev.findIndex((p) => (p._id && p._id === targetId) || (p.id && p.id === targetId));

      if (index !== -1) {
        const next = [...prev];
        next[index] = { ...next[index], ...updatedProduct };
        return next;
      }
      // If product didn't exist in current state, append it
      return [...prev, updatedProduct];
    });
  }, []);

  const handleProductCreated = useCallback((newProduct: IProduct) => {
    setProducts((prev) => {
      const targetId = newProduct._id || newProduct.id;
      const exists = prev.some((p) => (p._id && p._id === targetId) || (p.id && p.id === targetId));
      if (exists) return prev;
      return [newProduct, ...prev];
    });
  }, []);

  const handleProductDeleted = useCallback((payload: { _id?: string; id?: string }) => {
    const targetId = payload._id || payload.id;
    setProducts((prev) => prev.filter((p) => p._id !== targetId && p.id !== targetId));
  }, []);

  // Listen to Socket.io events
  useProductSocket({
    onProductUpdated: handleProductUpdated,
    onProductCreated: handleProductCreated,
    onProductDeleted: handleProductDeleted
  });

  /**
   * Optimistic Update with Guaranteed Rollback:
   * 1. Takes snapshot of current products state.
   * 2. Immediately updates the UI array so user sees changes instantly.
   * 3. Sends HTTP PUT request to backend.
   * 4. If server succeeds, commits authoritative server response.
   * 5. If server fails, rolls back state snapshot and propagates error.
   */
  const updateProduct = async (id: string, updates: Partial<IProduct>): Promise<IProduct> => {
    // 1. Snapshot previous state
    let rollbackSnapshot: IProduct[] = [];
    setProducts((prev) => {
      rollbackSnapshot = [...prev];
      return prev.map((p) => {
        if (p._id === id || p.id === id) {
          return { ...p, ...updates, updatedAt: new Date().toISOString() };
        }
        return p;
      });
    });

    try {
      // 2. HTTP PUT to persist directly to MongoDB
      const res = await api.admin.updateProduct(id, updates);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Server rejected product update');
      }

      const authoritativeProduct = res.data;

      // 3. Commit authoritative server payload to prevent stale local divergence
      setProducts((prev) =>
        prev.map((p) => {
          if (p._id === id || p.id === id) {
            return { ...p, ...authoritativeProduct };
          }
          return p;
        })
      );

      return authoritativeProduct;
    } catch (err) {
      // 4. Rollback on failure
      console.error('❌ [ProductContext] Update failed. Rolling back state:', err);
      setProducts(rollbackSnapshot);
      throw err;
    }
  };

  const createProduct = async (data: Partial<IProduct>): Promise<IProduct> => {
    const res = await api.admin.createProduct(data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to create product');
    }
    const created = res.data;
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const res = await api.admin.deleteProduct(id);
    if (!res.success) {
      throw new Error(res.message || 'Failed to delete product');
    }
    setProducts((prev) => prev.filter((p) => p._id !== id && p.id !== id));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        error,
        refreshProducts: loadProducts,
        updateProduct,
        deleteProduct,
        createProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

