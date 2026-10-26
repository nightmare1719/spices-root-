import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { formatINR } from '../utils/format.js';
import { calculateTotalWeight } from '../utils/weight.js';
import confetti from 'canvas-confetti';
import {
  ShieldCheck, Lock, CreditCard, Banknote, Truck,
  CheckCircle2, AlertCircle, Sparkles, ChevronRight,
  QrCode, Smartphone, Copy, Check, Upload, FileText,
  Clock, ArrowRight, RefreshCw, Scale, MapPin
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
  const [pincode, setPincode] = useState(location.state?.pincode || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi_manual' | 'razorpay' | 'cod'>('upi_manual');
  const [couponCode, setCouponCode] = useState(location.state?.couponCode || '');

  // Live verified server quote
  const [serverQuote, setServerQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Active UPI Payment Step State (after order created)
  const [upiOrderData, setUpiOrderData] = useState<{ order: any; upi: any } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmittingUpiProof, setIsSubmittingUpiProof] = useState(false);

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

  // Load payment configuration once on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const configRes = await api.getPaymentConfig();
        if (configRes.success && configRes.data) {
          setPaymentConfig(configRes.data);
          setPaymentMethod('upi_manual');
        }
      } catch (err) {
        console.warn('Error fetching payment config:', err);
      }
    }
    loadConfig();
  }, []);

  // Recalculate verified quote whenever cart items, coupon, or pincode changes
  useEffect(() => {
    async function updateQuote() {
      if (cart.items.length === 0 && !upiOrderData) {
        navigate('/cart');
        return;
      }

      try {
        setIsLoadingQuote(true);
        const cleanPin = pincode.trim().replace(/\D/g, '');
        const quoteRes = await api.calculateQuote(
          cart.items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          couponCode || undefined,
          cleanPin.length === 6 ? cleanPin : undefined
        );

        if (quoteRes.success && quoteRes.data) {
          setServerQuote(quoteRes.data);
        }
      } catch (err) {
        setErrorMessage((err as Error).message || 'Failed to update delivery quote.');
      } finally {
        setIsLoadingQuote(false);
      }
    }

    const timer = setTimeout(() => {
      updateQuote();
    }, 250);

    return () => clearTimeout(timer);
  }, [cart.items, couponCode, pincode]);

  // Detect current location pincode via browser Geolocation + Reverse Geocode
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setTimeout(() => setLocationStatus(''), 4000);
      return;
    }

    setIsLocating(true);
    setLocationStatus('Accessing device location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocationStatus('Resolving postal pincode...');

          // Fast reverse geocoding via BigDataCloud client API
          let resolvedPin = '';
          let resolvedCity = '';
          let resolvedState = '';

          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const data = await res.json();
            if (data?.postcode) {
              resolvedPin = String(data.postcode).replace(/\D/g, '').substring(0, 6);
              resolvedCity = data.city || data.locality || '';
              resolvedState = data.principalSubdivision || '';
            }
          } catch {
            // Ignored, try fallback
          }

          if (!resolvedPin || resolvedPin.length !== 6) {
            try {
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
              const nomData = await nomRes.json();
              const pin = nomData?.address?.postcode?.replace(/\D/g, '').substring(0, 6);
              if (pin && pin.length === 6) {
                resolvedPin = pin;
                resolvedCity = nomData.address.city || nomData.address.town || nomData.address.village || nomData.address.suburb || '';
                resolvedState = nomData.address.state || '';
              }
            } catch {
              // Fallback failed
            }
          }

          if (resolvedPin && resolvedPin.length === 6) {
            setPincode(resolvedPin);
            if (resolvedCity) setCity(resolvedCity);
            if (resolvedState) {
              const matched = INDIAN_STATES.find(s => s.toLowerCase() === resolvedState.toLowerCase());
              if (matched) setState(matched);
            }
            setLocationStatus(`📍 Detected: ${resolvedCity ? `${resolvedCity}, ` : ''}${resolvedPin}`);
            setTimeout(() => setLocationStatus(''), 4000);
          } else {
            setLocationStatus('Could not auto-detect 6-digit postal code. Please enter PIN code manually.');
            setTimeout(() => setLocationStatus(''), 4000);
          }
        } catch (err) {
          setLocationStatus('Could not determine address. Please enter PIN code manually.');
          setTimeout(() => setLocationStatus(''), 4000);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('Location permission denied or unavailable. Please enter PIN code manually.');
        setTimeout(() => setLocationStatus(''), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Screenshot File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Screenshot file size must be less than 5MB.');
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowed.includes(file.type)) {
        setErrorMessage('Allowed image formats: JPG, PNG, WEBP.');
        return;
      }
      setErrorMessage('');
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, type: 'upi' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  // Handle Initial Order Creation (Step 1)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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

      // 1. Direct UPI Transfer Flow
      if (paymentMethod === 'upi_manual') {
        setUpiOrderData({
          order: createdOrder,
          upi: res.data.upi
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmitting(false);
        return;
      }

      // 2. Handle Cash On Delivery
      if (paymentMethod === 'cod') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        await clearCart();
        navigate(`/order-confirmation/${createdOrder.orderNumber}`);
        return;
      }

      // 3. Handle Razorpay
      const rzpData = res.data.razorpay;

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
        // Razorpay Test Sandbox
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

  // Handle "I've Paid" Submission (Step 2 of UPI flow)
  const handleIvePaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiOrderData) return;

    setErrorMessage('');
    setIsSubmittingUpiProof(true);

    try {
      const formData = new FormData();
      formData.append('orderNumber', upiOrderData.order.orderNumber);
      if (utrNumber.trim()) {
        formData.append('upiTransactionRef', utrNumber.trim());
      }
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      const res = await api.submitUpiPayment(formData);
      if (!res.success) {
        throw new Error(res.message || 'Payment submission failed.');
      }

      await clearCart();
      navigate(`/order-confirmation/${upiOrderData.order.orderNumber}`);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to submit payment verification. Please try again.');
    } finally {
      setIsSubmittingUpiProof(false);
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
          Enter your delivery details and proceed with Direct UPI transfer.
        </p>
      </div>

      {/* Razorpay banner hidden while gateway is deactivated */}

      {errorMessage && (
        <div className="bg-[#B85D3A]/10 p-4 rounded-xl border border-[#B85D3A]/30 flex items-center gap-2.5 text-xs text-[#B85D3A] font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Direct UPI Transfer Interactive Step */}
      {upiOrderData ? (
        <div className="bg-white rounded-3xl border border-[#EFE8D6] p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Header */}
          <div className="border-b border-stone-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block mb-1">
                Direct UPI Bank Transfer • Zero Extra Fees
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B]">
                Complete Your UPI Payment
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Transfer the exact amount to merchant UPI ID and click <strong className="text-[#153E2B]">I've Paid</strong> below.
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-[10px] uppercase font-bold text-stone-400">Order Reference</span>
              <span className="font-mono text-base font-bold text-[#153E2B]">{upiOrderData.order.orderNumber}</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full mt-1">
                Awaiting Payment
              </span>
            </div>
          </div>

          {/* Amount Display */}
          <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFE8D6] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-stone-500 font-medium">Exact Amount Payable:</span>
              <div className="font-editorial text-3xl font-bold text-[#153E2B]">
                {formatINR(upiOrderData.order.priceBreakdown.totalPaise)}
              </div>
              <p className="text-[11px] text-stone-500">
                Please transfer the exact rupees to match our automated bank reconciliation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(upiOrderData.upi.amountInRupees, 'amount')}
              className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:border-[#153E2B] transition-all flex items-center gap-2 shadow-2xs"
            >
              {copiedAmount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-400" />}
              <span>{copiedAmount ? 'Amount Copied!' : 'Copy Exact Amount'}</span>
            </button>
          </div>

          {/* Payment Method Interface: Mobile Deeplink & Desktop Dynamic QR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Desktop Dynamic QR Section */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#153E2B]">
                <QrCode className="w-4 h-4 text-[#C5A059]" />
                <span>Scan with Any UPI App</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#153E2B]/20 shadow-md">
                <img
                  src={upiOrderData.upi.qrDataUrl}
                  alt={`UPI QR Code for ${upiOrderData.order.orderNumber}`}
                  className="w-56 h-56 object-contain rounded-lg"
                />
              </div>

              <p className="text-xs text-stone-600 max-w-xs">
                Open <strong>Google Pay, PhonePe, Paytm, BHIM</strong> or your bank app on your phone and scan this code.
              </p>

              {/* Mobile Deep Link Button */}
              <div className="w-full md:hidden pt-2">
                <a
                  href={upiOrderData.upi.upiUri}
                  className="w-full py-3.5 bg-[#153E2B] text-white hover:bg-[#1E5138] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Smartphone className="w-4 h-4 text-[#D8B26E]" />
                  <span>Pay Now via UPI App</span>
                </a>
                <p className="text-[10px] text-stone-400 mt-1">
                  Supported on Android and iOS devices with installed UPI applications.
                </p>
              </div>
            </div>

            {/* Merchant Details & Manual Transfer Info */}
            <div className="space-y-4">
              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFE8D6] space-y-3">
                <h4 className="text-xs font-bold text-[#153E2B] uppercase tracking-wider">
                  Merchant Banking Information
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Merchant UPI ID</span>
                      <span className="font-mono font-bold text-[#153E2B] text-sm">
                        {upiOrderData.upi.upiId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiOrderData.upi.upiId, 'upi')}
                      className="p-2 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-400" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Beneficiary / Business Name</span>
                      <span className="font-bold text-stone-800">
                        {upiOrderData.upi.merchantName}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Transaction Reference / Note</span>
                      <span className="font-mono text-stone-800">
                        {upiOrderData.upi.transactionNote}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* "I've Paid" Verification Form */}
              <form onSubmit={handleIvePaidSubmit} className="bg-white p-6 rounded-2xl border border-[#C5A059]/40 shadow-xs space-y-4">
                <h3 className="font-editorial text-lg font-bold text-[#153E2B] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                  <span>Confirm Your Payment Submission</span>
                </h3>
                <p className="text-xs text-stone-600">
                  After initiating the transfer in your UPI application, enter your 12-digit reference number (UTR) or attach a screenshot below.
                </p>

                {/* UTR Input */}
                <div>
                  <label htmlFor="checkout-utr-input" className="block text-xs font-semibold text-stone-700 mb-1">
                    12-Digit UPI UTR / Transaction Reference Number
                  </label>
                  <input
                    id="checkout-utr-input"
                    name="utrNumber"
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. 429381749281 (from your payment receipt)"
                    maxLength={25}
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl font-mono focus:outline-hidden focus:border-[#C5A059]"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Found on your GPay / PhonePe / Paytm / Bank payment confirmation screen.
                  </span>
                </div>

                {/* Optional Screenshot Upload */}
                <div>
                  <label htmlFor="checkout-screenshot-file" className="block text-xs font-semibold text-stone-700 mb-1">
                    Payment Screenshot (Optional Alternative)
                  </label>
                  <input
                    id="checkout-screenshot-file"
                    name="screenshot"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileChange}
                    className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#153E2B] file:text-white hover:file:bg-[#1E5138] cursor-pointer"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    JPG, PNG, or WEBP up to 5MB. Stored securely and accessible only to administrators.
                  </span>

                  {screenshotPreview && (
                    <div className="mt-2 relative inline-block border border-stone-200 rounded-xl overflow-hidden p-1 bg-stone-50">
                      <img src={screenshotPreview} alt="Screenshot preview" className="w-24 h-24 object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                {/* Non-false-claim disclaimer */}
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    Manual Bank Verification Process
                  </p>
                  <p className="text-stone-600">
                    Clicking <strong>"I've Paid"</strong> will transition your order status to <strong>"Payment Verification Pending"</strong>. Our accounts team verifies incoming transactions directly with our bank statement before dispatching your package.
                  </p>
                </div>

                {/* "I've Paid" Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingUpiProof}
                  className="w-full py-4 bg-[#153E2B] text-white hover:bg-[#1E5138] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingUpiProof ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#D8B26E]" />
                      <span>Submitting For Verification...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#D8B26E]" />
                      <span>I've Paid — Submit for Verification</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setUpiOrderData(null)}
                    className="text-xs text-stone-500 hover:text-stone-800 underline"
                  >
                    Need to modify delivery address or items? Return to checkout form
                  </button>
                </div>
              </form>

            </div>

          </div>

        </div>
      ) : (
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
                  <label htmlFor="checkout-name-input" className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                  <input
                    id="checkout-name-input"
                    name="customerName"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-email-input" className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
                  <input
                    id="checkout-email-input"
                    name="customerEmail"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="for order tracking & receipt"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="checkout-phone-input" className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number (India +91) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs text-stone-500 font-semibold">+91</span>
                    <input
                      id="checkout-phone-input"
                      name="customerPhone"
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
                  <label htmlFor="checkout-address-input" className="block text-xs font-semibold text-stone-700 mb-1">House / Flat / Street Address *</label>
                  <input
                    id="checkout-address-input"
                    name="addressLine"
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
                    <label htmlFor="checkout-landmark-input" className="block text-xs font-semibold text-stone-700 mb-1">Landmark (Optional)</label>
                    <input
                      id="checkout-landmark-input"
                      name="landmark"
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Metro Station, opposite park"
                      className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-city-input" className="block text-xs font-semibold text-stone-700 mb-1">City / Town *</label>
                    <input
                      id="checkout-city-input"
                      name="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Kochi, Bengaluru, Mumbai"
                      className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-state-select" className="block text-xs font-semibold text-stone-700 mb-1">State *</label>
                    <select
                      id="checkout-state-select"
                      name="state"
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
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="checkout-pincode-input" className="block text-xs font-semibold text-stone-700">
                        PIN Code (6 digits) *
                      </label>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="text-[11px] font-bold text-[#153E2B] hover:text-[#C5A059] flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Auto-detect destination pincode using your device location"
                      >
                        <MapPin className={`w-3.5 h-3.5 text-[#C5A059] ${isLocating ? 'animate-bounce' : ''}`} />
                        <span>{isLocating ? 'Detecting...' : 'Use Current Location'}</span>
                      </button>
                    </div>
                    <input
                      id="checkout-pincode-input"
                      name="pincode"
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 625001 (Madurai), 682001 (Kochi)"
                      className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                    />
                    {locationStatus && (
                      <p className="text-[11px] text-[#153E2B] font-semibold flex items-center gap-1 mt-1 animate-pulse">
                        <span>{locationStatus}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-delivery-notes" className="block text-xs font-semibold text-stone-700 mb-1">Delivery Notes / Gate Instructions (Optional)</label>
                  <input
                    id="checkout-delivery-notes"
                    name="deliveryNotes"
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
                {/* Active Option: Direct UPI (Zero Fees) */}
                <label
                  htmlFor="payment-method-upi"
                  className="p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all border-[#153E2B] bg-[#153E2B]/5 ring-1 ring-[#153E2B]"
                >
                  <div className="flex items-center gap-3">
                    <input
                      id="payment-method-upi"
                      type="radio"
                      name="payment"
                      value="upi_manual"
                      checked={paymentMethod === 'upi_manual'}
                      onChange={() => setPaymentMethod('upi_manual')}
                      className="text-[#153E2B] focus:ring-[#153E2B]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#153E2B] flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#C5A059]" />
                        Direct UPI Payment (GPay, PhonePe, Paytm, BHIM)
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Direct to merchant UPI ID <strong className="text-[#153E2B] font-mono">{paymentConfig?.upi?.upiId || 'cynalbertoz@sbi'}</strong> with QR code scan
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#153E2B] bg-[#C5A059]/20 px-2.5 py-1 rounded-md">
                    Recommended • Zero Fees
                  </span>
                </label>

                {/* Note: Razorpay and COD payment methods are temporarily hidden for both customer and admin (can be reactivated later) */}
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

              {/* Package Aggregate Weight */}
              <div className="flex justify-between items-center text-xs py-2 px-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                <span className="flex items-center gap-1.5 font-medium text-stone-600">
                  <Scale className="w-3.5 h-3.5 text-[#C5A059]" />
                  Total Package Weight:
                </span>
                <span className="font-bold text-[#153E2B]">
                  {calculateTotalWeight(cart.items)}
                </span>
              </div>

              {/* Dynamic Courier Shipping Calculation Breakdown */}
              {serverQuote?.shippingDetails && (
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#153E2B]">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{serverQuote.shippingDetails.zoneName}</span>
                    </span>
                    <span className="font-mono text-[11px] text-stone-500">
                      {serverQuote.shippingDetails.pincode ? `PIN ${serverQuote.shippingDetails.pincode}` : 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-600">
                    <span>Courier Calculation (Weight + Distance):</span>
                    <span className="font-bold text-stone-800">₹{serverQuote.shippingDetails.shippingFeeINR}</span>
                  </div>
                  {serverQuote.shippingDetails.extraKg > 0 ? (
                    <div className="text-[10px] text-stone-500">
                      Base (₹{serverQuote.shippingDetails.baseRate}) + {serverQuote.shippingDetails.extraKg}kg Addl. (₹{serverQuote.shippingDetails.extraKg * serverQuote.shippingDetails.perAdditionalKgRate})
                    </div>
                  ) : (
                    <div className="text-[10px] text-stone-500">
                      Base rate slab covers up to {serverQuote.shippingDetails.baseWeightKg} kg
                    </div>
                  )}
                  <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 pt-0.5">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>Est. Delivery: {serverQuote.shippingDetails.estimatedDelivery}</span>
                  </div>
                </div>
              )}

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
                        <span className="text-emerald-700 font-bold"> FREE EXPRESS DELIVERY </span>
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
                    ? 'Securing Order...'
                    : paymentMethod === 'upi_manual'
                      ? `Proceed to UPI Payment • ${formatINR(serverQuote?.priceBreakdown?.totalPaise || cart.subtotalPaise)}`
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
      )}

    </div>
  );
};
