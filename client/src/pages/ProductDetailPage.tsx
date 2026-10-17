import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { IProduct, IReview } from '../types/index.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { formatINR, getDiscountPercentage } from '../utils/format.js';
import { ProductCard } from '../components/ProductCard.js';
import {
  Heart, ShoppingBag, Zap, Star, ShieldCheck,
  Truck, RotateCcw, ChevronRight, Plus, Minus,
  MapPin, CheckCircle, Sparkles, MessageSquare
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [related, setRelated] = useState<IProduct[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Review form states
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const res = await api.getProductBySlug(slug);
        if (res.success && res.data) {
          setProduct(res.data.product);
          setRelated(res.data.related || []);
          setReviews(res.data.reviews || []);
          setSelectedVariantIndex(0);
          setActiveImageIndex(0);
          setQuantity(1);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#153E2B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-stone-500">Loading plantation harvest details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-editorial text-2xl font-bold text-[#153E2B] mb-2">Product Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">The requested product could not be found or is unavailable.</p>
        <Link to="/shop" className="bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full">
          Browse Catalog
        </Link>
      </div>
    );
  }

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const discountPercent = getDiscountPercentage(selectedVariant.pricePaise, selectedVariant.comparePricePaise);
  const isOutOfStock = selectedVariant.stock <= 0 || !selectedVariant.isAvailable;
  const isSaved = isWishlisted(product.id);

  const handleAddToCart = async () => {
    if (isOutOfStock || isAdding) return;
    setIsAdding(true);
    try {
      await addToCart(product.id, selectedVariant.id, quantity);
    } catch {
      // Handled in context
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    try {
      await addToCart(product.id, selectedVariant.id, quantity);
      navigate('/checkout');
    } catch {
      // Handled
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.addReview(product.id, {
        customerName: reviewerName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      if (res.success && res.data) {
        setReviews(prev => [res.data, ...prev]);
        setReviewerName('');
        setReviewComment('');
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 5000);
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-[#153E2B]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-[#153E2B]">Catalog</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/category/${product.category}`} className="hover:text-[#153E2B] capitalize">
          {product.category.replace('_', ' ')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#153E2B] font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-stone-100 border border-[#EFE8D6] shadow-sm relative group">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-[#B85D3A] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === idx
                      ? 'border-[#153E2B] ring-2 ring-[#C5A059]/40'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                >
                  <img src={img} alt={`${product.name} thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="space-y-6">

          <div>
            {/* Origin & Rating */}
            <div className="flex items-center justify-between gap-2 mb-2">
              {product.origin && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#153E2B] bg-[#153E2B]/10 px-2.5 py-0.5 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  {product.origin}
                </span>
              )}

              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center text-[#C5A059]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-stone-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#153E2B]">{product.rating.toFixed(1)}</span>
                <span className="text-stone-400">({reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B] leading-snug">
              {product.name}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Price Section */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFE8D6] flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-editorial text-3xl font-bold text-[#153E2B]">
                {formatINR(selectedVariant.pricePaise)}
              </span>
              {selectedVariant.comparePricePaise && selectedVariant.comparePricePaise > selectedVariant.pricePaise && (
                <span className="text-sm text-stone-400 line-through">
                  {formatINR(selectedVariant.comparePricePaise)}
                </span>
              )}
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Inclusive of all taxes
              </span>
            </div>

            <span className="text-[11px] text-stone-400 font-mono">
              SKU: {selectedVariant.sku}
            </span>
          </div>

          {/* Pack Size Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#382F26]">
                Select Pack Size / Weight:
              </label>
              <span className="text-xs text-stone-500 font-medium">
                Selected: <strong className="text-[#153E2B]">{selectedVariant.packSize}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {product.variants.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVariantIndex(idx);
                    setQuantity(1);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${idx === selectedVariantIndex
                      ? 'border-[#153E2B] bg-[#153E2B] text-white shadow-xs font-bold'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-[#C5A059]'
                    }`}
                >
                  <span className="block text-xs font-bold">{v.packSize}</span>
                  <span className={`block text-[11px] mt-0.5 ${idx === selectedVariantIndex ? 'text-[#D8B26E]' : 'text-stone-500'}`}>
                    {formatINR(v.pricePaise)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs">
            {isOutOfStock ? (
              <span className="text-[#B85D3A] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B85D3A]" />
                Temporarily Sold Out
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock ({selectedVariant.stock} units available) — Dispatches within 24-48 hrs
              </span>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">

              {/* Stepper */}
              <div className="flex items-center border border-stone-300 rounded-xl bg-white p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-stone-500 hover:text-black disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold px-4 text-[#153E2B] min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  disabled={quantity >= selectedVariant.stock || isOutOfStock}
                  className="p-2 text-stone-500 hover:text-black disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className="flex-1 py-3.5 bg-[#153E2B] text-[#F7F3E9] hover:bg-[#1E5138] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#D8B26E]" />
                <span>{isAdding ? 'Adding to Basket...' : 'Add to Cart'}</span>
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 border rounded-xl transition-colors shadow-xs ${isSaved
                    ? 'border-[#B85D3A] bg-[#B85D3A] text-white'
                    : 'border-stone-300 hover:border-[#153E2B] text-stone-700 bg-white'
                  }`}
                aria-label="Wishlist toggle"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Buy Now Button */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 bg-[#C5A059] text-[#0F2E20] hover:bg-[#D8B26E] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Buy Now with 1-Click Checkout</span>
              </button>
            )}
          </div>

          {/* Delivery & Assurance Strip */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-200 text-center">
            <div className="p-3 bg-white rounded-xl border border-stone-100 shadow-2xs">
              <Truck className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#153E2B] block"> transparency delivery </span>
              <span className="text-[9px] text-stone-500">On orders &gt; ₹999</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-stone-100 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#153E2B] block">100% Authentic</span>
              <span className="text-[9px] text-stone-500">Unadulterated hill crop</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-stone-100 shadow-2xs">
              <RotateCcw className="w-4 h-4 text-[#C5A059] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#153E2B] block">7-Day Return</span>
              <span className="text-[9px] text-stone-500">For damaged packages</span>
            </div>
          </div>

        </div>

      </div>

      {/* Product Details Tabs / Editorial Accordion */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#EFE8D6] space-y-8 shadow-xs">

        <div>
          <h2 className="font-editorial text-2xl font-bold text-[#153E2B] mb-3">
            Product Story & Description
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-4xl whitespace-pre-line font-light">
            {product.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-stone-100">

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFE8D6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#153E2B] mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#C5A059]" />
                Ingredients & Composition
              </h3>
              <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                {product.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
          )}

          {product.storageInfo && (
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFE8D6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#153E2B] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                Storage Guidelines
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {product.storageInfo}
              </p>
            </div>
          )}

          {product.usageTips && (
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFE8D6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#153E2B] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                Culinary Usage Tips
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {product.usageTips}
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Customer Reviews & Submit Review */}
      <section className="bg-[#FAF7F2] p-6 sm:p-10 rounded-3xl border border-[#EFE8D6] space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[#153E2B]">
              Verified Customer Reviews
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Genuine reviews from customers who purchased this harvest.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-stone-200">
            <Star className="w-5 h-5 fill-[#C5A059] text-[#C5A059]" />
            <span className="font-bold text-sm text-[#153E2B]">{product.rating.toFixed(1)} / 5.0</span>
            <span className="text-xs text-stone-400">({reviews.length} ratings)</span>
          </div>
        </div>

        {/* Existing Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-stone-500 italic col-span-2">
              No reviews yet for this specific product. Be the first to share your experience!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[#C5A059]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-stone-300'}`} />
                    ))}
                  </div>
                  {rev.isVerifiedPurchase && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                      Verified Buyer
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed italic">"{rev.comment}"</p>
                <div className="text-[11px] font-bold text-[#153E2B] pt-1">
                  — {rev.customerName}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Write a Review Form */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 max-w-2xl">
          <h3 className="font-editorial text-lg font-bold text-[#153E2B] mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#C5A059]" />
            Leave a Verified Impression
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            Share how you cooked with or brewed this product with the Spice Roots community.
          </p>

          {reviewSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
              Thank you! Your review has been submitted and published.
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Ramesh K. (Bangalore)"
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Your Rating</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#C5A059]"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ 5 Stars (Exceptional)</option>
                  <option value={4}>⭐⭐⭐⭐ 4 Stars (Very Good)</option>
                  <option value={3}>⭐⭐⭐ 3 Stars (Satisfactory)</option>
                  <option value={2}>⭐⭐ 2 Stars (Below Expectation)</option>
                  <option value={1}>⭐ 1 Star (Disappointed)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Your Review</label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How did the flavor, aroma, or packaging feel?"
                className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="py-2.5 px-6 bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1E5138] disabled:opacity-50 transition-colors"
            >
              {isSubmittingReview ? 'Submitting...' : 'Post Review'}
            </button>
          </form>
        </div>

      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block mb-1">
                More From This Harvest
              </span>
              <h2 className="font-editorial text-2xl font-bold text-[#153E2B]">
                Related Plantations & Blends
              </h2>
            </div>
            <Link to="/shop" className="text-xs font-bold text-[#153E2B] hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
