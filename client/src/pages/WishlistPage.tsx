import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.js';
import { api } from '../services/api.js';
import { IProduct } from '../types/index.js';
import { ProductCard } from '../components/ProductCard.js';
import { Heart, ShoppingBag } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlistProducts() {
      if (wishlistIds.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.getProducts({ limit: 50 });
        if (res.success && res.data) {
          const filtered = res.data.products.filter((p: IProduct) => wishlistIds.includes(p.id));
          setProducts(filtered);
        }
      } catch (err) {
        console.warn('Failed to load wishlist products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWishlistProducts();
  }, [wishlistIds]);

  if (wishlistIds.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="font-editorial text-3xl font-bold text-[#e5e1e4] mb-2">
          Your Spice Vault Wishlist is Empty
        </h1>
        <p className="text-xs text-[#d0c5af] max-w-sm mx-auto mb-6">
          Save your favorite single-origin peppercorns, high-altitude teas, and spice boxes for later.
        </p>
        <Link
          to="/shop"
          className="bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-editorial text-3xl font-bold text-[#e5e1e4]">
          Your Saved Spices ({wishlistIds.length})
        </h1>
        <p className="text-xs text-[#d0c5af]">
          Items you've earmarked for your next harvest order.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[#1c1b1d] rounded-xl border border-[#353437] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
