import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { formatINR } from '../utils/format.js';
import confetti from 'canvas-confetti';
import {
  ShieldCheck, Lock, CreditCard, Banknote, Truck,
  CheckCircle2, AlertCircle, Sparkles, ChevronRight
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

export const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Kerala');
  const [pincode, setPincode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [couponCode, setCouponCode] = useState(location.state?.couponCode || '');

  // Live verified server quote
  const [serverQuote, setServerQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);

  // Pre-fill default address if authenticated user has saved addresses
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setAddressLine(def.addressLine);
      setLandmark(def.landmark || '');
      setCity(def.city);
      setState(def.state);
      setPincode(def.pincode);
      if (def.phone && !customerPhone) setCustomerPhone(def.phone);
    }
  }, [user]);

  // Load payment configuration & calculate verified quote from backend
  useEffect(() => {
    async function initCheckout() {
      if (cart.items.length === 0) {
        navigate('/cart');
        return;
      }

      try {
        const [configRes, quoteRes] = await Promise.all([
          api.getPaymentConfig(),
          api.calculateQuote(
            cart.items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
            couponCode || undefined
          )
        ]);

        if (configRes.success && configRes.data) {
          setPaymentConfig(configRes.data);
        }
        if (quoteRes.success && quoteRes.data) {
          setServerQuote(quoteRes.data);
        }
      } catch (err) {
        setErrorMessage((err as Error).message || 'Failed to initialize checkout quote.');
      } finally {
        setIsLoadingQuote(false);
      }
    }

    initCheckout();
  }, [cart.items, couponCode]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations for Indian standards
    if (!customerPhone.replace(/\D/g, '').endsWith(customerPhone.replace(/\D/g, '')) || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (pincode.replace(/\D/g, '').length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Indian postal PIN code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: cart.items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        couponCode: couponCode || undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        shippingAddress: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          addressLine: addressLine.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim()
        },
        paymentMethod,
        deliveryNotes: deliveryNotes.trim() || undefined
      };

      const res = await api.createOrder(orderPayload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to place order');
      }

      const createdOrder = res.data.order;

      // Handle Cash On Delivery
      if (paymentMethod === 'cod') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        await clearCart();
        navigate(`/order-confirmation/${createdOrder.orderNumber}`);
        return;
      }

      // Handle Razorpay
      const rzpData = res.data.razorpay;

      // If official Razorpay checkout script is available and we're not using dummy keys
      if (window.Razorpay && !rzpData.isTestSandbox) {
        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: "Spice Roots",
          description: `Order ${createdOrder.orderNumber}`,
          image: "/images/logo.png",
          order_id: rzpData.orderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await api.verifyPayment({
                orderId: createdOrder.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              if (verifyRes.success) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                await clearCart();
                navigate(`/order-confirmation/${createdOrder.orderNumber}`);
              } else {
                setErrorMessage('Payment verification failed. Please contact support.');
              }
            } catch (vErr) {
              setErrorMessage('Verification failed: ' + (vErr as Error).message);
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
          },
          theme: {
            color: "#153E2B"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMessage('Payment failed: ' + resp.error.description);
        });
        rzp.open();
        setIsSubmitting(false);
      } else {
        // Razorpay Test Sandbox / Developer Verification Simulation
        // Officially verifies with backend using safe test token signature
        const simPaymentId = 'pay_test_' + Date.now().toString(36);
        const simSignature = 'sig_test_valid';

        const verifyRes = await api.verifyPayment({
          orderId: createdOrder.id,
          razorpayOrderId: rzpData.orderId,
          razorpayPaymentId: simPaymentId,
          razorpaySignature: simSignature
        });

        if (verifyRes.success) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          await clearCart();
          navigate(`/order-confirmation/${createdOrder.orderNumber}`);
        } else {
          setErrorMessage('Test payment verification failed.');
        }
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <Link to="/cart" className="hover:text-[#153E2B]">Basket</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#153E2B] font-bold">Secure Checkout</span>
        </nav>
        <h1 className="font-editorial text-3xl font-bold text-[#153E2B]">
          Complete Your Order
        </h1>
        <p className="text-xs text-stone-500">
          Enter your delivery details and select a secure payment method.
        </p>
      </div>

      {/* Razorpay Test Mode Indicator Banner */}
      {paymentConfig?.isTestSandbox && (
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#C5A059] flex items-center justify-between text-xs text-stone-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0" />
            <div>
              <span className="font-bold text-[#153E2B] block">Razorpay Test Mode Active</span>
              <span className="text-[11px] text-stone-600">
                You can test online payments safely without debiting real bank accounts.
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-[#153E2B] text-white font-mono px-2.5 py-1 rounded-full font-bold">
            TEST SANDBOX
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#B85D3A]/10 p-4 rounded-xl border border-[#B85D3A]/30 flex items-center gap-2.5 text-xs text-[#B85D3A] font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        {/* Left Form: Customer and Shipping Details */}
        <div className="lg:col-span-2 space-y-8">

          {/* Section 1: Customer Contact */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE8D6] shadow-2xs space-y-4">
            <h2 className="font-editorial text-lg font-bold text-[#153E2B] flex items-center gap-2 pb-3 border-b border-stone-100">
              <span className="w-6 h-6 rounded-full bg-[#153E2B] text-white text-xs flex items-center justify-center font-sans font-bold">1</span>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="for order tracking & receipt"
                  className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number (India +91) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-stone-500 font-semibold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs p-3 pl-12 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Required for courier dispatch and SMS tracking alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE8D6] shadow-2xs space-y-4">
            <h2 className="font-editorial text-lg font-bold text-[#153E2B] flex items-center gap-2 pb-3 border-b border-stone-100">
              <span className="w-6 h-6 rounded-full bg-[#153E2B] text-white text-xs flex items-center justify-center font-sans font-bold">2</span>
              Delivery Address (India)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">House / Flat / Street Address *</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. 402, Green Valley Apartments, MG Road"
                  className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near Metro Station, opposite park"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kochi, Bengaluru, Mumbai"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">State *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">PIN Code (6 digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 682001"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery Notes / Gate Instructions (Optional)</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Leave with security, call before arrival"
                  className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white p-6 rounded-2xl border border-[#EFE8D6] shadow-2xs space-y-4">
            <h2 className="font-editorial text-lg font-bold text-[#153E2B] flex items-center gap-2 pb-3 border-b border-stone-100">
              <span className="w-6 h-6 rounded-full bg-[#153E2B] text-white text-xs flex items-center justify-center font-sans font-bold">3</span>
              Payment Selection
            </h2>

            <div className="space-y-3">
              {/* Razorpay Online */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'razorpay'
                    ? 'border-[#153E2B] bg-[#153E2B]/5 ring-1 ring-[#153E2B]'
                    : 'border-stone-200 hover:border-stone-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="text-[#153E2B] focus:ring-[#153E2B]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#153E2B] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#C5A059]" />
                      Pay Online via Razorpay
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      UPI (GPay, PhonePe, Paytm), Debit/Credit Cards & NetBanking
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-[#153E2B] bg-[#C5A059]/20 px-2.5 py-1 rounded-md">
                  Recommended
                </span>
              </label>

              {/* Cash On Delivery */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'cod'
                    ? 'border-[#153E2B] bg-[#153E2B]/5 ring-1 ring-[#153E2B]'
                    : 'border-stone-200 hover:border-stone-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-[#153E2B] focus:ring-[#153E2B]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#153E2B] flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#C5A059]" />
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      Pay cash to the courier partner upon package handover
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Summary: Verified Order Breakdown */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#EFE8D6] shadow-2xs space-y-5">
            <h3 className="font-editorial text-lg font-bold text-[#153E2B] pb-3 border-b border-stone-100">
              Order Breakdown
            </h3>

            {/* Items summary */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 text-xs">
                  <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg bg-stone-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#153E2B] truncate">{item.productName}</p>
                    <p className="text-[11px] text-stone-500">{item.packSize} × {item.quantity}</p>
                  </div>
                  <span className="font-bold text-[#153E2B] shrink-0">
                    {formatINR(item.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            {serverQuote && serverQuote.priceBreakdown && (
              <div className="space-y-2.5 text-xs text-stone-600 pt-3 border-t border-stone-100">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-stone-800">
                    {formatINR(serverQuote.priceBreakdown.subtotalPaise)}
                  </span>
                </div>

                {serverQuote.priceBreakdown.discountPaise > 0 && (
                  <div className="flex justify-between text-[#B85D3A] font-semibold">
                    <span>Coupon ({serverQuote.appliedCouponCode}):</span>
                    <span>-{formatINR(serverQuote.priceBreakdown.discountPaise)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping Fee:</span>
                  <span className="font-semibold text-stone-800">
                    {serverQuote.priceBreakdown.shippingFeePaise === 0 ? (
                      <span className="text-emerald-700 font-bold"> transparency delivery </span>
                    ) : (
                      formatINR(serverQuote.priceBreakdown.shippingFeePaise)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-stone-400 text-[11px]">
                  <span>GST (Inclusive):</span>
                  <span>{formatINR(serverQuote.priceBreakdown.taxPaise)}</span>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-base">
                  <span className="font-bold text-[#153E2B]">Total Payable:</span>
                  <span className="font-editorial text-2xl font-bold text-[#153E2B]">
                    {formatINR(serverQuote.priceBreakdown.totalPaise)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoadingQuote}
              className="w-full py-4 bg-[#153E2B] text-[#F7F3E9] hover:bg-[#1E5138] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
            >
              <Lock className="w-4 h-4 text-[#D8B26E]" />
              <span>
                {isSubmitting
                  ? 'Verifying & Securing Order...'
                  : paymentMethod === 'cod'
                    ? 'Confirm Cash on Delivery Order'
                    : `Pay ${formatINR(serverQuote?.priceBreakdown?.totalPaise || cart.subtotalPaise)}`}
              </span>
            </button>

            <div className="space-y-1.5 text-center text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              <p className="flex items-center justify-center gap-1 text-emerald-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-bit SSL Encrypted & Verified Server Transactions
              </p>
              <p>By placing this order, you agree to our Terms and Shipping Policies.</p>
            </div>

          </div>
        </div>

      </form>

    </div>
  );
};
