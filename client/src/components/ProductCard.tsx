import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IProduct } from '../types/index.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { formatINR, getDiscountPercentage } from '../utils/format.js';
import { Heart, Star, ShoppingBag, Check } from 'lucide-react';

interface ProductCardProps {
  product: IProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Selected variant on the card (defaults to first variant)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const isSaved = isWishlisted(product.id);
  const discountPercent = getDiscountPercentage(selectedVariant.pricePaise, selectedVariant.comparePricePaise);
  const isOutOfStock = selectedVariant.stock <= 0 || !selectedVariant.isAvailable;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(product.id, selectedVariant.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch {
      // Handled in context
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group luxury-card rounded-2xl overflow-hidden flex flex-col h-full relative bg-white border border-[#EFE8D6]">
      
      {/* Product Image & Badges */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-108"
            loading="lazy"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isFeatured && (
            <span className="bg-[#153E2B] text-[#F7F3E9] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-xs">
              Estate Reserve
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-[#B85D3A] text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 shadow-xs ${
            isSaved 
              ? 'bg-[#B85D3A] text-white' 
              : 'bg-white/80 backdrop-blur-xs text-stone-600 hover:text-[#B85D3A] hover:bg-white'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Origin / Category Tag */}
        {product.origin && (
          <div className="absolute bottom-2.5 left-3 bg-[#FCFAF6]/90 backdrop-blur-xs text-[#153E2B] text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#EFE8D6]">
            📍 {product.origin.split(',')[0]}
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-[#C5A059]">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating) 
                      ? 'fill-[#C5A059] text-[#C5A059]' 
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-[#382F26] text-[11px]">{product.rating.toFixed(1)}</span>
            <span className="text-stone-400 text-[10px]">({product.reviewCount})</span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-[#153E2B] transition-colors">
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#241D17] line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Variant Selector Pills */}
          {product.variants.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.variants.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariantIndex(idx);
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                    idx === selectedVariantIndex
                      ? 'bg-[#153E2B] text-[#F7F3E9] shadow-2xs font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {v.packSize}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-editorial text-lg sm:text-xl font-bold text-[#153E2B]">
                {formatINR(selectedVariant.pricePaise)}
              </span>
              {selectedVariant.comparePricePaise && selectedVariant.comparePricePaise > selectedVariant.pricePaise && (
                <span className="text-xs text-stone-400 line-through">
                  {formatINR(selectedVariant.comparePricePaise)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-400 block font-medium">
              Tax included
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`p-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : justAdded
                ? 'bg-[#1E5138] text-white'
                : 'bg-[#153E2B] text-[#F7F3E9] hover:bg-[#1E5138] active:scale-95 shadow-xs'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#D8B26E]" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-[#D8B26E]" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
