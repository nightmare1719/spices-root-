import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { formatINR } from '../utils/format.js';
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  Sparkles, Tag, CheckCircle2, ShieldCheck, Truck
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const threshold = cart.freeShippingThresholdPaise;
  const progressPercent = Math.min(100, Math.round((cart.subtotalPaise / threshold) * 100));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api.validateCoupon(couponCode.trim(), cart.subtotalPaise);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
      }
    } catch (err) {
      setCouponError((err as Error).message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const discountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const shippingFeePaise = cart.qualifiesForFreeShipping ? 0 : 6000;
  const totalPaise = Math.max(0, cart.subtotalPaise - discountPaise) + shippingFeePaise;

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#153E2B]/10 flex items-center justify-center mx-auto mb-4 text-[#153E2B]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-editorial text-3xl font-bold text-[#153E2B] mb-2">
          Your Spice Basket is Empty
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-8">
          Explore our authentic Kerala harvests, whole Tellicherry peppercorns, 8mm cardamom, and single-estate Munnar teas.
        </p>
        <Link
          to="/shop"
          className="bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full hover:bg-[#1E5138] transition-all shadow-md"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout', {
        state: {
          message: 'Please sign in to proceed to checkout and payment.',
          couponCode: appliedCoupon?.code
        }
      });
    } else {
      navigate('/checkout', { state: { couponCode: appliedCoupon?.code } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-editorial text-3xl font-bold text-[#153E2B]">
            Your Shopping Basket
          </h1>
          <p className="text-xs text-stone-500">
            Review your harvest selections before proceeding to secure checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-[#B85D3A] hover:underline font-semibold"
        >
          Clear Basket
        </button>
      </div>

      {/* Free Shipping Progress Alert */}
      <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFE8D6]">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          {cart.qualifiesForFreeShipping ? (
            <span className="text-[#153E2B] flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              You qualify for  transparency delivery  across India!
            </span>
          ) : (
            <span className="text-stone-600">
              Add <strong className="text-[#153E2B]">{formatINR(cart.freeShippingRemainingPaise)}</strong> more to unlock <strong> transparency delivery </strong>
            </span>
          )}
          <span className="text-[#C5A059] font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C5A059] to-[#153E2B] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#EFE8D6] overflow-hidden shadow-2xs divide-y divide-stone-100">
            {cart.items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-xl bg-stone-100 shrink-0"
                  />
                  <div>
                    <Link
                      to={`/product/${item.productSlug}`}
                      className="font-editorial text-base font-bold text-[#153E2B] hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Pack Size: <span className="font-semibold text-stone-700">{item.packSize}</span>
                    </p>
                    <p className="text-xs text-stone-500">
                      Unit Price: <span className="font-semibold text-[#153E2B]">{formatINR(item.unitPricePaise)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-200 rounded-xl bg-[#FAF7F2] p-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="p-1.5 text-stone-500 hover:text-black"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-3 text-[#153E2B] min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 text-stone-500 hover:text-black disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="font-editorial text-base font-bold text-[#153E2B]">
                      {formatINR(item.lineTotalPaise)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    className="p-2 text-stone-400 hover:text-[#B85D3A] transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              to="/shop"
              className="text-xs font-bold text-[#153E2B] hover:underline"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="space-y-6">

          {/* Coupon Input */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE8D6] shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#C5A059]" />
              Promotional Discount Code
            </h3>

            {appliedCoupon ? (
              <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs">
                <div>
                  <span className="font-bold block">Coupon "{appliedCoupon.code}" Applied!</span>
                  <span className="text-[11px]">Saved {formatINR(appliedCoupon.discountPaise)}</span>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-[#B85D3A] hover:underline font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10, KERALA20"
                    className="flex-1 text-xs uppercase px-3 py-2 bg-[#FAF7F2] border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#C5A059]"
                  />
                  <button
                    type="submit"
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    className="px-4 py-2 bg-[#153E2B] text-white text-xs font-bold rounded-lg hover:bg-[#1E5138] disabled:opacity-40 transition-colors"
                  >
                    {isValidatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-[#B85D3A] font-medium">{couponError}</p>
                )}
                <p className="text-[10px] text-stone-400">
                  Try <strong>WELCOME10</strong> (10% off &gt; ₹499) or <strong>FREESHIP</strong>
                </p>
              </form>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE8D6] shadow-2xs space-y-4">
            <h3 className="font-editorial text-lg font-bold text-[#153E2B] pb-3 border-b border-stone-100">
              Basket Summary
            </h3>

            <div className="space-y-2.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-stone-800">{formatINR(cart.subtotalPaise)}</span>
              </div>

              {discountPaise > 0 && (
                <div className="flex justify-between text-[#B85D3A] font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-{formatINR(discountPaise)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping:</span>
                <span className="font-semibold text-stone-800">
                  {shippingFeePaise === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatINR(shippingFeePaise)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Applicable GST:</span>
                <span>Included in price</span>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-base">
                <span className="font-bold text-[#153E2B]">Total Payable:</span>
                <span className="font-editorial text-2xl font-bold text-[#153E2B]">
                  {formatINR(totalPaise)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 bg-[#153E2B] text-[#F7F3E9] hover:bg-[#1E5138] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-center gap-4 text-[10px] text-stone-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                Razorpay Verified
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                India-wide Delivery
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
