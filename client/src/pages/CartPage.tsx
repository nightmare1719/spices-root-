import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { formatINR } from '../utils/format.js';
import { calculateTotalWeight, calculateTotalWeightInGrams } from '../utils/weight.js';
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  Sparkles, Tag, CheckCircle2, ShieldCheck, Truck, Scale, Navigation
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Shipping & Location Pincode Calculation State (Weight + Distance [Pincode] = Shipping Charges)
  const defaultPin = user?.addresses?.find((a: any) => a.isDefault)?.pincode || user?.addresses?.[0]?.pincode || '';
  const [shippingPincode, setShippingPincode] = useState(defaultPin);
  const [courierShippingPaise, setCourierShippingPaise] = useState(6000); // Default 60 INR
  const [courierDetails, setCourierDetails] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const threshold = cart.freeShippingThresholdPaise;
  const progressPercent = Math.min(100, Math.round((cart.subtotalPaise / threshold) * 100));

  // Geolocation detector for customer's current location pincode
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setLocationStatus('Locating device...');
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          if (!res.ok) throw new Error('Geocoding service unavailable');
          const data = await res.json();
          const addr = data.address || {};
          const detectedPincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
          if (detectedPincode && detectedPincode.length === 6) {
            setShippingPincode(detectedPincode);
            setLocationStatus(`📍 ${addr.city || addr.town || addr.village || 'Detected'} (${detectedPincode})`);
          } else {
            setLocationStatus('⚠️ Could not extract 6-digit postal code');
          }
        } catch {
          setLocationStatus('⚠️ Could not fetch pincode from location');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(`⚠️ Location error: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Recalculate courier shipping fee whenever items or pincode change
  useEffect(() => {
    if (cart.items.length === 0) return;
    const totalWeightGrams = calculateTotalWeightInGrams(cart.items);

    api.calculateShippingRate(shippingPincode.trim() || '625001', totalWeightGrams)
      .then((res) => {
        if (res.success && res.data) {
          setCourierShippingPaise(res.data.shippingChargePaise || res.data.shippingChargeINR * 100);
          setCourierDetails(res.data);
        }
      })
      .catch(() => {
        // Fallback standard rate
        setCourierShippingPaise(6000);
      });
  }, [cart.items, shippingPincode]);

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
  const shippingFeePaise = cart.qualifiesForFreeShipping ? 0 : courierShippingPaise;
  const totalPaise = Math.max(0, cart.subtotalPaise - discountPaise) + shippingFeePaise;

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#D0AE70]/15 flex items-center justify-center mx-auto mb-4 text-[#D0AE70]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-editorial text-3xl font-bold text-[#171814] mb-2">
          Your Spice Basket is Empty
        </h1>
        <p className="text-xs sm:text-sm text-[#77766E] max-w-md mx-auto mb-8">
          Explore our authentic Kerala harvests, whole Tellicherry peppercorns, 8mm cardamom, and single-estate Munnar teas.
        </p>
        <Link
          to="/shop"
          className="bg-[#D0AE70] text-[#171814] text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full hover:bg-[#B99153] transition-all shadow-md inline-block"
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
          couponCode: appliedCoupon?.code,
          pincode: shippingPincode.trim() || undefined
        }
      });
    } else {
      navigate('/checkout', {
        state: {
          couponCode: appliedCoupon?.code,
          pincode: shippingPincode.trim() || undefined
        }
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-[#E5DED0]">
        <div>
          <h1 className="font-editorial text-3xl font-bold text-[#171814]">
            Your Shopping Basket
          </h1>
          <p className="text-xs text-[#77766E]">
            Review your harvest selections before proceeding to secure checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-[#A94F38] hover:underline font-semibold cursor-pointer"
        >
          Clear Basket
        </button>
      </div>

      {/* Free Shipping Progress Alert */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5DED0] shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          {cart.qualifiesForFreeShipping ? (
            <span className="text-[#435B43] flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-[#D0AE70]" />
              You qualify for free delivery across India!
            </span>
          ) : (
            <span className="text-[#77766E]">
              Add <strong className="text-[#171814]">{formatINR(cart.freeShippingRemainingPaise)}</strong> more to unlock <strong>free delivery</strong>
            </span>
          )}
          <span className="text-[#D0AE70] font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-[#E5DED0] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D0AE70] to-[#B99153] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5DED0] overflow-hidden shadow-xs divide-y divide-[#E5DED0]">
            {cart.items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-xl bg-[#F7F2E8] border border-[#E5DED0] shrink-0"
                  />
                  <div>
                    <Link
                      to={`/product/${item.productSlug}`}
                      className="font-editorial text-base font-bold text-[#171814] hover:text-[#D0AE70] hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-[#77766E] mt-0.5">
                      Pack Size: <span className="font-semibold text-[#292A25]">{item.packSize}</span>
                    </p>
                    <p className="text-xs text-[#77766E]">
                      Unit Price: <span className="font-semibold text-[#435B43] font-product">{formatINR(item.unitPricePaise)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#E5DED0] rounded-xl bg-[#F7F2E8] p-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="p-1.5 text-[#292A25] hover:text-[#D0AE70]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-3 text-[#171814] min-w-[24px] text-center font-product">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 text-[#292A25] hover:text-[#D0AE70] disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="font-product text-base font-bold text-[#435B43]">
                      {formatINR(item.lineTotalPaise)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    className="p-2 text-[#77766E] hover:text-[#A94F38] transition-colors cursor-pointer"
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
              className="text-xs font-bold text-[#171814] hover:text-[#D0AE70] hover:underline"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="space-y-6">

          {/* Coupon Input */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5DED0] shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#292A25] flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#D0AE70]" />
              Promotional Discount Code
            </h3>

            {appliedCoupon ? (
              <div className="flex justify-between items-center bg-[#435B43]/10 text-[#435B43] p-3 rounded-xl border border-[#435B43]/20 text-xs">
                <div>
                  <span className="font-bold block">Coupon "{appliedCoupon.code}" Applied!</span>
                  <span className="text-[11px]">Saved {formatINR(appliedCoupon.discountPaise)}</span>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-[#A94F38] hover:underline font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    id="cart-coupon-input"
                    name="couponCode"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10, KERALA20"
                    className="flex-1 text-xs uppercase px-3 py-2 bg-[#F7F2E8] border border-[#E5DED0] text-[#292A25] rounded-lg focus:outline-none focus:border-[#D0AE70]"
                  />
                  <button
                    type="submit"
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    className="px-4 py-2 bg-[#171814] text-[#D0AE70] hover:bg-[#D0AE70] hover:text-[#171814] border border-[#171814] text-xs font-bold rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isValidatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-[#A94F38] font-medium">{couponError}</p>
                )}
                <p className="text-[10px] text-[#77766E]">
                  Try <strong>WELCOME10</strong> (10% off &gt; ₹499) or <strong>FREESHIP</strong>
                </p>
              </form>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5DED0] shadow-xs space-y-4">
            <h3 className="font-editorial text-lg font-bold text-[#171814] pb-3 border-b border-[#E5DED0]">
              Basket Summary
            </h3>

            <div className="space-y-2.5 text-xs text-[#77766E]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#292A25] font-product">{formatINR(cart.subtotalPaise)}</span>
              </div>

              <div className="flex justify-between items-center text-xs py-1.5 px-2.5 bg-[#F7F2E8] rounded-lg border border-[#E5DED0]">
                <span className="flex items-center gap-1.5 font-medium text-[#292A25]">
                  <Scale className="w-3.5 h-3.5 text-[#D0AE70]" />
                  Total Package Weight:
                </span>
                <span className="font-bold text-[#171814] font-product">{calculateTotalWeight(cart.items)}</span>
              </div>

              {discountPaise > 0 && (
                <div className="flex justify-between text-[#A94F38] font-semibold">
                  <span>Coupon Discount:</span>
                  <span className="font-product">-{formatINR(discountPaise)}</span>
                </div>
              )}

              {/* Courier Shipping Estimate by Pincode & Location */}
              <div className="pt-2 pb-1 border-t border-[#E5DED0]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#292A25] flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#171814]" />
                    Delivery Pincode:
                  </span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="text-[10px] font-bold text-[#171814] hover:text-[#D0AE70] flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
                    title="Detect postal pincode from current device GPS"
                  >
                    <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={shippingPincode}
                    onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit Pincode"
                    className="flex-1 text-xs px-3 py-1.5 bg-[#F7F2E8] text-[#292A25] border border-[#E5DED0] rounded-lg font-mono focus:outline-none focus:border-[#D0AE70]"
                  />
                  {shippingPincode && shippingPincode.length === 6 && (
                    <span className="px-2 py-1 bg-[#435B43]/15 text-[#435B43] text-[10px] font-bold rounded-lg flex items-center">
                      PIN: {shippingPincode}
                    </span>
                  )}
                </div>

                {locationStatus && (
                  <p className="text-[10px] text-[#77766E] mt-1 font-medium">{locationStatus}</p>
                )}

                {courierDetails && !cart.qualifiesForFreeShipping && (
                  <p className="text-[10px] text-[#77766E] mt-1">
                    Zone: <strong className="text-[#292A25]">{courierDetails.zoneName}</strong> ({courierDetails.estimatedDelivery || '2-4 business days'})
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span>Shipping Charge:</span>
                <span className="font-semibold text-[#292A25]">
                  {shippingFeePaise === 0 ? (
                    <span className="text-[#435B43] font-bold">FREE</span>
                  ) : (
                    <span className="font-product">{formatINR(shippingFeePaise)}</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between text-[#77766E] text-[11px]">
                <span>Applicable GST:</span>
                <span>Included in price</span>
              </div>

              <div className="pt-3 border-t border-[#E5DED0] flex justify-between items-baseline text-base">
                <span className="font-bold text-[#171814]">Total Payable:</span>
                <span className="font-product text-2xl font-bold text-[#435B43]">
                  {formatINR(totalPaise)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-3 border-t border-[#E5DED0] flex items-center justify-center gap-4 text-[10px] text-[#77766E]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D0AE70]" />
                Razorpay Verified
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#D0AE70]" />
                India-wide Delivery
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
