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
      // Handled in CartContext
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group rounded-xl overflow-hidden flex flex-col h-full bg-[#1c1b1d] border border-[#d4af37]/20 hover:border-[#d4af37]/60 hover:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.9),0_0_24px_0_rgba(212,175,55,0.18)] transition-all duration-300">
      
      {/* Uniform Image Container (Stitch 1:1 Aspect Ratio against dark slate canvas) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#0e0e10]">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-full transition-all z-10 shadow-xs cursor-pointer ${
            isSaved 
              ? 'bg-[#c25e2e] text-white' 
              : 'bg-[#0e0e10]/80 backdrop-blur-xs text-[#d0c5af] hover:text-[#d4af37] hover:bg-[#1c1b1d]'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Top-Left Badges (Discount or Estate Reserve) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-[#c25e2e] text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-[#d4af37] text-[#131315] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shadow-xs">
              Vault Reserve
            </span>
          )}
        </div>
      </div>

      {/* Stitch Vault Card Info Section */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5 bg-[#1c1b1d]">
        <div>
          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-[#d4af37] transition-colors">
            <h3 className="text-xs sm:text-sm font-semibold text-[#e5e1e4] line-clamp-1 sm:line-clamp-2 leading-snug font-editorial">
              {product.name}
            </h3>
          </Link>

          {/* Pack Size / Variant Selector (Compact) */}
          <div className="flex items-center gap-1 mt-1 text-[10px] text-[#99907c]">
            <span className="uppercase tracking-wider">Pack:</span>
            {product.variants.length > 1 ? (
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-semibold bg-[#201f22] text-[#d0c5af] border border-[#353437] rounded px-1.5 py-0.5 focus:border-[#d4af37] cursor-pointer"
                aria-label="Select Pack Size"
              >
                {product.variants.map((v, idx) => (
                  <option key={v.id} value={idx}>
                    {v.packSize}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-[#d0c5af] bg-[#201f22] border border-[#353437] px-1.5 py-0.5 rounded">
                {selectedVariant.packSize}
              </span>
            )}
          </div>

          {/* Price Tag (Gold Price + Strikethrough Compare Price) */}
          <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-[#f2ca50] font-sans">
              {formatINR(selectedVariant.pricePaise)}
            </span>
            {selectedVariant.comparePricePaise && selectedVariant.comparePricePaise > selectedVariant.pricePaise && (
              <span className="text-[10px] sm:text-xs text-[#99907c] line-through font-sans">
                {formatINR(selectedVariant.comparePricePaise)}
              </span>
            )}
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 bg-[#201f22] text-[#e5e1e4] border border-[#353437] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 fill-[#d4af37] text-[#d4af37]" />
            </span>
            <span className="text-[10px] text-[#99907c]">
              ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Delivery Note */}
          <span className="text-[9px] text-[#99907c] font-medium block mt-1 uppercase tracking-wider">
            Complimentary dispatch on ₹499+
          </span>
        </div>

        {/* Action Button: Gilded Gold Add Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className={`w-full mt-2.5 py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans ${
            isOutOfStock
              ? 'bg-[#2a2a2c] text-[#99907c] cursor-not-allowed border border-[#353437]'
              : justAdded
              ? 'bg-[#435b43] text-white shadow-md'
              : 'bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] active:scale-98 shadow-sm hover:shadow-[0_0_16px_rgba(212,175,55,0.35)]'
          }`}
          aria-label={isOutOfStock ? 'Sold Out' : justAdded ? 'Added to Cart' : `Add ${product.name} to Cart`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Acquired</span>
            </>
          ) : isOutOfStock ? (
            <span>Allocation Exhausted</span>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Acquire to Vault</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default ProductCard;
