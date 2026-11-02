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
        <div className="w-10 h-10 border-4 border-[#D0AE70] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#77766E]">Loading plantation harvest details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-editorial text-2xl font-bold text-[#171814] mb-2">Product Not Found</h2>
        <p className="text-xs text-[#77766E] mb-6">The requested product could not be found or is unavailable.</p>
        <Link to="/shop" className="bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all">
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
      <nav className="flex items-center gap-2 text-xs text-[#99907c] font-sans">
        <Link to="/" className="hover:text-[#d4af37] transition-colors">Archive</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-[#d4af37] transition-colors">Catalog</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/category/${product.category}`} className="hover:text-[#d4af37] capitalize transition-colors">
          {product.category.replace('_', ' ')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#d4af37] font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#0e0e10] border border-[#353437] shadow-2xl relative group">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-[#c25e2e] text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider shadow-md">
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
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-[#0e0e10] cursor-pointer ${activeImageIndex === idx
                    ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 opacity-100'
                    : 'border-[#353437] opacity-60 hover:opacity-100'
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
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#d0c5af] bg-[#201f22] border border-[#353437] px-2.5 py-0.5 rounded-full font-sans">
                  <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                  {product.origin}
                </span>
              )}

              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center text-[#d4af37]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-[#353437]'
                        }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#e5e1e4] font-sans">{product.rating.toFixed(1)}</span>
                <span className="text-[#99907c] font-sans">({reviews.length} appraisals)</span>
              </div>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e5e1e4] leading-snug">
              {product.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#d0c5af] mt-2 leading-relaxed font-light">
              {product.shortDescription}
            </p>
          </div>

          {/* Price Section */}
          <div className="bg-[#1c1b1d] p-4 rounded-xl border border-[#353437] flex items-baseline justify-between shadow-lg">
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-3xl font-bold text-[#f2ca50]">
                {formatINR(selectedVariant.pricePaise)}
              </span>
              {selectedVariant.comparePricePaise && selectedVariant.comparePricePaise > selectedVariant.pricePaise && (
                <span className="text-sm text-[#99907c] line-through font-sans">
                  {formatINR(selectedVariant.comparePricePaise)}
                </span>
              )}
              <span className="text-xs text-[#dccf96] font-semibold bg-[#435b43]/20 px-2 py-0.5 rounded border border-[#435b43]/30 font-sans">
                Inclusive of all taxes
              </span>
            </div>

            <span className="text-[11px] text-[#99907c] font-mono">
              SKU: {selectedVariant.sku}
            </span>
          </div>

          {/* Pack Size Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#dccf96] font-sans">
                Select Allocation Weight:
              </label>
              <span className="text-xs text-[#99907c] font-medium font-sans">
                Selected: <strong className="text-[#e5e1e4]">{selectedVariant.packSize}</strong>
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
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer font-sans ${idx === selectedVariantIndex
                    ? 'border-[#d4af37] bg-[#201f22] text-[#f2ca50] shadow-md ring-1 ring-[#d4af37]'
                    : 'border-[#353437] bg-[#1c1b1d] text-[#d0c5af] hover:border-[#d4af37]/60'
                    }`}
                >
                  <span className="block text-xs font-bold text-[#e5e1e4]">{v.packSize}</span>
                  <span className={`block text-[11px] mt-0.5 ${idx === selectedVariantIndex ? 'text-[#f2ca50]' : 'text-[#99907c]'}`}>
                    {formatINR(v.pricePaise)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs font-sans">
            {isOutOfStock ? (
              <span className="text-[#ffb4ab] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab]" />
                Allocation Exhausted
              </span>
            ) : (
              <span className="text-[#dccf96] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                Cellar Reserve Available ({selectedVariant.stock} units remaining)
              </span>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">

              {/* Stepper */}
              <div className="flex items-center border border-[#353437] rounded-lg bg-[#201f22] p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-[#d0c5af] hover:text-[#d4af37] disabled:opacity-30 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold px-4 text-[#e5e1e4] min-w-[36px] text-center font-sans">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  disabled={quantity >= selectedVariant.stock || isOutOfStock}
                  className="p-2 text-[#d0c5af] hover:text-[#d4af37] disabled:opacity-30 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className="flex-1 py-3.5 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] rounded-lg text-xs sm:text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <ShoppingBag className="w-4 h-4 text-[#131315]" />
                <span>{isAdding ? 'Securing...' : 'Add to Cart '}</span>
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 border rounded-lg transition-colors shadow-xs cursor-pointer ${isSaved
                  ? 'border-[#c25e2e] bg-[#c25e2e] text-white'
                  : 'border-[#353437] hover:border-[#d4af37] text-[#d0c5af] bg-[#1c1b1d]'
                  }`}
                aria-label="Wishlist toggle"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Buy Now: Vault Outline */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 bg-[#1c1b1d] text-[#f2ca50] hover:bg-[#201f22] border border-[#d4af37]/60 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <Zap className="w-4 h-4 fill-current text-[#d4af37]" />
                <span>Instant Checkout </span>
              </button>
            )}
          </div>

          {/* Delivery & Assurance Strip */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#353437] text-center">
            <div className="p-3 bg-[#1c1b1d] rounded-lg border border-[#353437] shadow-xs">
              <Truck className="w-4 h-4 text-[#d4af37] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#e5e1e4] block uppercase tracking-wider font-sans">Free Courier</span>
              <span className="text-[9px] text-[#99907c]">On orders &gt; ₹499</span>
            </div>
            <div className="p-3 bg-[#1c1b1d] rounded-lg border border-[#353437] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#d4af37] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#e5e1e4] block uppercase tracking-wider font-sans">100% Authentic</span>
              <span className="text-[9px] text-[#99907c]">Single-origin harvest</span>
            </div>
            <div className="p-3 bg-[#1c1b1d] rounded-lg border border-[#353437] shadow-xs">
              <RotateCcw className="w-4 h-4 text-[#d4af37] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#e5e1e4] block uppercase tracking-wider font-sans">7-Day Guarantee</span>
              <span className="text-[9px] text-[#99907c]">Replacement protection</span>
            </div>
          </div>

        </div>

      </div>

      {/* Product Details Tabs / Editorial Accordion */}
      <div className="bg-[#1c1b1d] p-6 sm:p-10 rounded-xl border border-[#353437] space-y-8 shadow-xl">

        <div>
          <h2 className="font-editorial text-2xl font-bold text-[#e5e1e4] mb-3">
            Product Story &amp; Terroir Provenance
          </h2>
          <p className="text-xs sm:text-sm text-[#d0c5af] leading-relaxed max-w-4xl whitespace-pre-line font-light">
            {product.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#353437]">

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="bg-[#201f22] p-5 rounded-lg border border-[#353437]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-2 flex items-center gap-1.5 font-sans">
                <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                Ingredients &amp; Botanical Profile
              </h3>
              <ul className="list-disc list-inside text-xs text-[#d0c5af] space-y-1">
                {product.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
          )}

          {product.storageInfo && (
            <div className="bg-[#201f22] p-5 rounded-lg border border-[#353437]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-2 flex items-center gap-1.5 font-sans">
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                Preservation Guidelines
              </h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed">
                {product.storageInfo}
              </p>
            </div>
          )}

          {product.usageTips && (
            <div className="bg-[#201f22] p-5 rounded-lg border border-[#353437]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-2 flex items-center gap-1.5 font-sans">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                Culinary Sommelier Tips
              </h3>
              <p className="text-xs text-[#d0c5af] leading-relaxed">
                {product.usageTips}
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Customer Reviews & Submit Review */}
      <section className="bg-[#1c1b1d] p-6 sm:p-10 rounded-xl border border-[#353437] space-y-8 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[#e5e1e4]">
              Verified Guild Palate Appraisals
            </h2>
            <p className="text-xs text-[#99907c] mt-1">
              Genuine reviews from culinary collectors who purchased this harvest lot.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#201f22] px-4 py-2 rounded-lg border border-[#353437]">
            <Star className="w-5 h-5 fill-[#d4af37] text-[#d4af37]" />
            <span className="font-bold text-sm text-[#e5e1e4] font-sans">{product.rating.toFixed(1)} / 5.0</span>
            <span className="text-xs text-[#99907c] font-sans">({reviews.length} ratings)</span>
          </div>
        </div>

        {/* Existing Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-[#99907c] italic col-span-2">
              No reviews yet for this specific lot. Be the first to share your culinary appraisal!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="bg-[#201f22] p-5 rounded-lg border border-[#353437] shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[#d4af37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-[#353437]'}`} />
                    ))}
                  </div>
                  {rev.isVerifiedPurchase && (
                    <span className="text-[10px] bg-[#435b43]/20 text-[#dccf96] font-semibold px-2 py-0.5 rounded-full border border-[#435b43]/40">
                      Verified Buyer
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#d0c5af] leading-relaxed italic">"{rev.comment}"</p>
                <div className="text-[11px] font-bold text-[#e5e1e4] pt-1 font-editorial">
                  — {rev.customerName}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Write a Review Form */}
        <div className="bg-[#201f22] p-6 rounded-xl border border-[#353437] max-w-2xl">
          <h3 className="font-editorial text-lg font-bold text-[#e5e1e4] mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#d4af37]" />
            Leave a Verified Impression
          </h3>
          <p className="text-xs text-[#99907c] mb-4">
            Share how you cooked with or infused this product with the vault culinary community.
          </p>

          {reviewSuccess && (
            <div className="mb-4 p-3 bg-[#435b43]/20 text-[#dccf96] font-semibold text-xs rounded-lg border border-[#435b43]/40 font-sans">
              Thank you! Your appraisal has been submitted and published to the vault.
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#d0c5af] mb-1 font-sans">Your Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Ramesh K. (Bangalore)"
                  className="w-full text-xs p-2.5 bg-[#0e0e10] text-[#e5e1e4] border border-[#353437] rounded-lg focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d0c5af] mb-1 font-sans">Your Rating</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-[#0e0e10] text-[#e5e1e4] border border-[#353437] rounded-lg focus:outline-none focus:border-[#d4af37] cursor-pointer"
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
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1 font-sans">Your Appraisal</label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How did the flavor, aroma, piperine density, or packaging feel?"
                className="w-full text-xs p-2.5 bg-[#0e0e10] text-[#e5e1e4] border border-[#353437] rounded-lg focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="py-2.5 px-6 bg-[#d4af37] text-[#131315] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#f2ca50] disabled:opacity-50 transition-colors cursor-pointer font-sans"
            >
              {isSubmittingReview ? 'Submitting...' : 'Post Appraisal'}
            </button>
          </form>
        </div>

      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block mb-1 font-sans">
                More From This Harvest
              </span>
              <h2 className="font-editorial text-2xl font-bold text-[#e5e1e4]">
                Related Plantations &amp; Blends
              </h2>
            </div>
            <Link to="/shop" className="text-xs font-bold text-[#d4af37] hover:underline font-sans uppercase tracking-wider">
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
