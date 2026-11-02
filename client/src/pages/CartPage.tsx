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
        <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-editorial text-3xl font-bold text-[#e5e1e4] mb-2">
          Your Spice Vault is Empty
        </h1>
        <p className="text-xs sm:text-sm text-[#d0c5af] max-w-md mx-auto mb-8">
          Explore our authentic Kerala harvests, whole Tellicherry peppercorns, 8mm cardamom, and single-estate Munnar teas.
        </p>
        <Link
          to="/shop"
          className="bg-[#d4af37] text-[#131315] text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full hover:bg-[#f2ca50] transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] inline-block"
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-[#353437]">
        <div>
          <h1 className="font-editorial text-3xl font-bold text-[#e5e1e4]">
            Your Shopping Basket
          </h1>
          <p className="text-xs text-[#d0c5af]">
            Review your harvest selections before proceeding to secure checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-[#a94f38] hover:text-[#c25e2e] hover:underline font-semibold cursor-pointer"
        >
          Clear Basket
        </button>
      </div>

      {/* Free Shipping Progress Alert */}
      <div className="bg-[#1c1b1d] p-5 rounded-2xl border border-[#353437] shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          {cart.qualifiesForFreeShipping ? (
            <span className="text-[#8b9b7b] flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              You qualify for free delivery across India!
            </span>
          ) : (
            <span className="text-[#d0c5af]">
              Add <strong className="text-[#f2ca50]">{formatINR(cart.freeShippingRemainingPaise)}</strong> more to unlock <strong className="text-[#e5e1e4]">free delivery</strong>
            </span>
          )}
          <span className="text-[#d4af37] font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-[#0e0e10] rounded-full overflow-hidden border border-[#353437]/50">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] to-[#f2ca50] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#1c1b1d] rounded-2xl border border-[#353437] overflow-hidden shadow-sm divide-y divide-[#353437]">
            {cart.items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-xl bg-[#0e0e10] border border-[#353437] shrink-0"
                  />
                  <div>
                    <Link
                      to={`/product/${item.productSlug}`}
                      className="font-editorial text-base font-bold text-[#e5e1e4] hover:text-[#d4af37] hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-[#99907c] mt-0.5">
                      Pack Size: <span className="font-semibold text-[#d0c5af]">{item.packSize}</span>
                    </p>
                    <p className="text-xs text-[#99907c]">
                      Unit Price: <span className="font-semibold text-[#f2ca50] font-product">{formatINR(item.unitPricePaise)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#353437] rounded-xl bg-[#201f22] p-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="p-1.5 text-[#d0c5af] hover:text-[#d4af37]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-3 text-[#e5e1e4] min-w-[24px] text-center font-product">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 text-[#d0c5af] hover:text-[#d4af37] disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="font-product text-base font-bold text-[#f2ca50]">
                      {formatINR(item.lineTotalPaise)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    className="p-2 text-[#99907c] hover:text-[#a94f38] transition-colors cursor-pointer"
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
              className="text-xs font-bold text-[#d0c5af] hover:text-[#d4af37] hover:underline"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="space-y-6">

          {/* Coupon Input */}
          <div className="bg-[#1c1b1d] p-6 rounded-2xl border border-[#353437] shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4] flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#d4af37]" />
              Promotional Discount Code
            </h3>

            {appliedCoupon ? (
              <div className="flex justify-between items-center bg-[#435b43]/20 text-[#8b9b7b] p-3 rounded-xl border border-[#435b43]/40 text-xs">
                <div>
                  <span className="font-bold block text-[#e5e1e4]">Coupon "{appliedCoupon.code}" Applied!</span>
                  <span className="text-[11px] text-[#8b9b7b]">Saved {formatINR(appliedCoupon.discountPaise)}</span>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-[#a94f38] hover:text-[#c25e2e] hover:underline font-semibold cursor-pointer"
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
                    className="flex-1 text-xs uppercase px-3 py-2 bg-[#0e0e10] border border-[#353437] text-[#e5e1e4] placeholder-[#99907c] rounded-lg focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="submit"
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    className="px-4 py-2 bg-[#201f22] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#131315] border border-[#4d4635] text-xs font-bold rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isValidatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-[#a94f38] font-medium">{couponError}</p>
                )}
                <p className="text-[10px] text-[#99907c]">
                  Try <strong className="text-[#d0c5af]">WELCOME10</strong> (10% off &gt; ₹499) or <strong className="text-[#d0c5af]">FREESHIP</strong>
                </p>
              </form>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-[#1c1b1d] p-6 rounded-2xl border border-[#353437] shadow-sm space-y-4">
            <h3 className="font-editorial text-lg font-bold text-[#e5e1e4] pb-3 border-b border-[#353437]">
              Basket Summary
            </h3>

            <div className="space-y-2.5 text-xs text-[#d0c5af]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#e5e1e4] font-product">{formatINR(cart.subtotalPaise)}</span>
              </div>

              <div className="flex justify-between items-center text-xs py-1.5 px-2.5 bg-[#201f22] rounded-lg border border-[#353437]">
                <span className="flex items-center gap-1.5 font-medium text-[#d0c5af]">
                  <Scale className="w-3.5 h-3.5 text-[#d4af37]" />
                  Total Package Weight:
                </span>
                <span className="font-bold text-[#e5e1e4] font-product">{calculateTotalWeight(cart.items)}</span>
              </div>

              {discountPaise > 0 && (
                <div className="flex justify-between text-[#a94f38] font-semibold">
                  <span>Coupon Discount:</span>
                  <span className="font-product">-{formatINR(discountPaise)}</span>
                </div>
              )}

              {/* Courier Shipping Estimate by Pincode & Location */}
              <div className="pt-2 pb-1 border-t border-[#353437]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#e5e1e4] flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#d4af37]" />
                    Delivery Pincode:
                  </span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="text-[10px] font-bold text-[#d4af37] hover:text-[#f2ca50] flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
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
                    className="flex-1 text-xs px-3 py-1.5 bg-[#0e0e10] text-[#e5e1e4] border border-[#353437] rounded-lg font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                  {shippingPincode && shippingPincode.length === 6 && (
                    <span className="px-2 py-1 bg-[#435b43]/30 text-[#8b9b7b] text-[10px] font-bold rounded-lg flex items-center border border-[#435b43]/40">
                      PIN: {shippingPincode}
                    </span>
                  )}
                </div>

                {locationStatus && (
                  <p className="text-[10px] text-[#99907c] mt-1 font-medium">{locationStatus}</p>
                )}

                {courierDetails && !cart.qualifiesForFreeShipping && (
                  <p className="text-[10px] text-[#99907c] mt-1">
                    Zone: <strong className="text-[#e5e1e4]">{courierDetails.zoneName}</strong> ({courierDetails.estimatedDelivery || '2-4 business days'})
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span>Shipping Charge:</span>
                <span className="font-semibold text-[#e5e1e4]">
                  {shippingFeePaise === 0 ? (
                    <span className="text-[#8b9b7b] font-bold">FREE</span>
                  ) : (
                    <span className="font-product text-[#f2ca50]">{formatINR(shippingFeePaise)}</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between text-[#99907c] text-[11px]">
                <span>Applicable GST:</span>
                <span>Included in price</span>
              </div>

              <div className="pt-3 border-t border-[#353437] flex justify-between items-baseline text-base">
                <span className="font-bold text-[#e5e1e4]">Total Payable:</span>
                <span className="font-product text-2xl font-bold text-[#f2ca50]">
                  {formatINR(totalPaise)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-3 border-t border-[#353437] flex items-center justify-center gap-4 text-[10px] text-[#99907c]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                Razorpay Verified
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#d4af37]" />
                India-wide Delivery
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
