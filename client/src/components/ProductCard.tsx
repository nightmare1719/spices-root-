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
    <div className="group rounded-xl sm:rounded-2xl overflow-hidden flex flex-col h-full bg-white border border-[#E5DED0] hover:border-[#D0AE70] hover:shadow-md transition-all duration-200">
      
      {/* Uniform Image Container (Meesho Style 1:1 Aspect Ratio) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F7F2E8]">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
              ? 'bg-[#A94F38] text-white' 
              : 'bg-white/90 backdrop-blur-xs text-[#171814] hover:text-[#A94F38] hover:bg-white'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Top-Left Badges (Discount or Estate Reserve) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-[#A94F38] text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-[#171814] text-[#D0AE70] text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs border border-[#D0AE70]/30">
              Reserve
            </span>
          )}
        </div>
      </div>

      {/* Meesho Catalog Style Info Section */}
      <div className="p-2 sm:p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-[#D0AE70] transition-colors">
            <h3 className="text-xs sm:text-sm font-semibold text-[#292A25] line-clamp-1 sm:line-clamp-2 leading-snug font-product">
              {product.name}
            </h3>
          </Link>

          {/* Pack Size / Variant Selector (Compact) */}
          <div className="flex items-center gap-1 mt-1 text-[10px] text-[#77766E]">
            <span>Pack:</span>
            {product.variants.length > 1 ? (
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-semibold bg-[#F7F2E8] text-[#292A25] border border-[#E5DED0] rounded px-1.5 py-0.5 focus:border-[#D0AE70] cursor-pointer"
                aria-label="Select Pack Size"
              >
                {product.variants.map((v, idx) => (
                  <option key={v.id} value={idx}>
                    {v.packSize}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-[#292A25] bg-[#F7F2E8] border border-[#E5DED0] px-1.5 py-0.5 rounded">
                {selectedVariant.packSize}
              </span>
            )}
          </div>

          {/* Price Tag (Meesho Style: Bold Price + Strikethrough Compare Price) */}
          <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-extrabold text-[#435B43] font-product">
              {formatINR(selectedVariant.pricePaise)}
            </span>
            {selectedVariant.comparePricePaise && selectedVariant.comparePricePaise > selectedVariant.pricePaise && (
              <span className="text-[10px] sm:text-xs text-[#77766E] line-through font-product">
                {formatINR(selectedVariant.comparePricePaise)}
              </span>
            )}
          </div>

          {/* Meesho Signature Rating Badge (Solid Pill + Star + Review Count) */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-0.5 bg-[#171814] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 fill-[#D0AE70] text-[#D0AE70]" />
            </span>
            <span className="text-[10px] text-[#77766E]">
              ({product.reviewCount})
            </span>
          </div>

          {/* Delivery Note */}
          <span className="text-[9px] text-[#77766E] font-medium block mt-1">
            Free Delivery on ₹499+
          </span>
        </div>

        {/* Action Button: Compact, Clean Black & Gold Add to Bag Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className={`w-full mt-2 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isOutOfStock
              ? 'bg-[#E5DED0] text-[#77766E] cursor-not-allowed'
              : justAdded
              ? 'bg-[#435B43] text-white'
              : 'bg-[#171814] text-[#D0AE70] hover:bg-[#D0AE70] hover:text-[#171814] border border-[#171814] active:scale-98 shadow-xs'
          }`}
          aria-label={isOutOfStock ? 'Sold Out' : justAdded ? 'Added to Cart' : `Add ${product.name} to Cart`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Added</span>
            </>
          ) : isOutOfStock ? (
            <span>Sold Out</span>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default ProductCard;
