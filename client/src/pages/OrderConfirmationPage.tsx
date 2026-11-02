import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { IOrder } from '../types/index.js';
import { formatINR, formatDateTime } from '../utils/format.js';
import { 
  CheckCircle2, Package, Truck, Printer, ArrowRight, 
  MapPin, Phone, Mail, Clock, ShieldCheck, AlertCircle,
  QrCode, Smartphone, MessageCircle, Upload, Check, Copy,
  X, ExternalLink, RefreshCw
} from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [upiInfo, setUpiInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Screenshot upload state on confirmation page
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [additionalUtr, setAdditionalUtr] = useState('');

  // Invoice modal state
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!orderNumber) return;
      try {
        const [orderRes, upiRes] = await Promise.all([
          api.getOrderById(orderNumber),
          api.getUpiPaymentInfo(orderNumber).catch(() => null)
        ]);

        if (orderRes.success && orderRes.data) {
          setOrder(orderRes.data);
        }
        if (upiRes && upiRes.success && upiRes.data) {
          setUpiInfo(upiRes.data.upi);
        }
      } catch (err) {
        console.warn('Error loading order confirmation:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleFetchInvoice = async () => {
    if (!order) return;
    setIsLoadingInvoice(true);
    try {
      const res = await api.getOrderInvoice(order.id || order.orderNumber);
      if (res.success && res.data) {
        setInvoiceData(res.data);
        setShowInvoiceModal(true);
      }
    } catch (err) {
      alert('Failed to generate invoice: ' + (err as Error).message);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleDirectScreenshotUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!screenshotFile && !additionalUtr.trim()) {
      setUploadError('Please select a screenshot file or enter your 12-digit UTR.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('orderNumber', order.orderNumber);
      if (additionalUtr.trim()) {
        formData.append('upiTransactionRef', additionalUtr.trim());
      }
      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      const res = await api.submitUpiPayment(formData);
      if (res.success) {
        setUploadMessage('Payment proof submitted successfully! Our team will verify your payment.');
        setOrder(res.data.order);
        setScreenshotFile(null);
        setScreenshotPreview(null);
      } else {
        setUploadError(res.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError((err as Error).message || 'Failed to submit screenshot');
    } finally {
      setIsUploading(false);
    }
  };

  const statusSteps = [
    { key: 'confirmed', label: 'Order Confirmed' },
    { key: 'processing', label: 'Processing at Depot' },
    { key: 'shipped', label: 'Dispatched with Courier' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'confirmed': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order?.fulfillmentStatus || 'pending');

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
        <p className="text-xs text-[#99907c] font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#a94f38] mx-auto" />
        <h2 className="font-editorial text-2xl font-bold text-[#e5e1e4]">Order Not Found</h2>
        <p className="text-xs text-[#d0c5af]">Could not locate order reference "{orderNumber}".</p>
        <Link to="/shop" className="inline-block mt-4 text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:text-[#f2ca50] underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isUpi = order.paymentMethod === 'upi_manual';
  const isPendingVerification = isUpi && order.paymentStatus === 'VERIFICATION_PENDING';
  const isAwaitingPayment = isUpi && order.paymentStatus === 'AWAITING_PAYMENT';
  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'paid';
  const isRejected = order.paymentStatus === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* 1. Header Banner: Tailored strictly by payment status */}
      {isPendingVerification && (
        <div className="bg-[#201f22] p-8 rounded-3xl border border-[#d4af37]/40 text-center space-y-3 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#0e0e10] text-[#d4af37] border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-10 h-10 text-[#d4af37]" />
          </div>
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block">
            Payment Verification Pending
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
            Your UPI Payment Has Been Submitted
          </h1>
          <p className="text-xs sm:text-sm text-[#d0c5af] max-w-xl mx-auto">
            We have received your payment submission for Order reference <strong className="font-mono text-[#e5e1e4]">{orderNumber}</strong>. 
            Your transaction of <strong className="text-[#f2ca50] font-product">{formatINR(order.priceBreakdown.totalPaise)}</strong> is currently being verified against our bank statement before dispatch.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="bg-[#1c1b1d] px-4 py-1.5 rounded-full border border-[#353437] text-xs">
              <span className="text-[#99907c] font-medium">Order: </span>
              <span className="font-mono font-bold text-[#e5e1e4]">{orderNumber}</span>
            </div>
            {order.upiTransactionRef && (
              <div className="bg-[#1c1b1d] px-4 py-1.5 rounded-full border border-[#353437] text-xs">
                <span className="text-[#99907c] font-medium">UTR: </span>
                <span className="font-mono font-bold text-[#f2ca50]">{order.upiTransactionRef}</span>
              </div>
            )}
            <div className="bg-[#d4af37]/15 border border-[#d4af37]/30 px-4 py-1.5 rounded-full text-xs font-bold text-[#f2ca50]">
              Not Yet Confirmed as Paid
            </div>
          </div>
        </div>
      )}

      {isAwaitingPayment && (
        <div className="bg-[#201f22] p-8 rounded-3xl border border-[#d4af37]/40 text-center space-y-3 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#0e0e10] text-[#d4af37] border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-10 h-10 text-[#d4af37]" />
          </div>
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block">
            Action Required: Awaiting Transfer
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
            Please Complete Your UPI Transfer
          </h1>
          <p className="text-xs sm:text-sm text-[#d0c5af] max-w-xl mx-auto">
            Please transfer <strong className="text-[#f2ca50] font-product">{formatINR(order.priceBreakdown.totalPaise)}</strong> to merchant UPI ID <strong className="font-mono text-[#e5e1e4]">cynalbertoz@sbi</strong> to process your order.
          </p>
          <div className="inline-block bg-[#1c1b1d] px-5 py-2 rounded-full border border-[#353437] mt-2">
            <span className="text-xs text-[#99907c] font-medium">Order Reference: </span>
            <span className="text-xs font-mono font-bold text-[#e5e1e4]">{orderNumber}</span>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="bg-[#1c1b1d] p-8 rounded-3xl border border-[#353437] text-center space-y-3 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#435b43]/20 text-[#8b9b7b] border border-[#435b43]/30 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-10 h-10 text-[#8b9b7b]" />
          </div>
          <span className="text-xs font-bold text-[#8b9b7b] uppercase tracking-widest block">
            Payment Verified & Order Confirmed
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#e5e1e4]">
            Thank You For Choosing The Spice Vault!
          </h1>
          <p className="text-xs sm:text-sm text-[#d0c5af] max-w-lg mx-auto">
            Your payment has been officially verified by our plantation depot accounts team. Your package is scheduled for courier dispatch.
          </p>
          <div className="inline-block bg-[#201f22] px-5 py-2 rounded-full border border-[#353437] mt-2">
            <span className="text-xs text-[#99907c] font-medium">Order Reference: </span>
            <span className="text-xs font-mono font-bold text-[#e5e1e4]">{orderNumber}</span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-[#a94f38]/20 p-8 rounded-3xl border border-[#a94f38]/40 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#a94f38]/30 text-[#e5e1e4] flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-10 h-10 text-[#a94f38]" />
          </div>
          <span className="text-xs font-bold text-[#a94f38] uppercase tracking-widest block">
            Payment Verification Discrepancy
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
            Payment Verification Rejected
          </h1>
          <p className="text-xs sm:text-sm text-[#d0c5af] max-w-xl mx-auto">
            {order.rejectionReason || 'The submitted UPI transaction reference or screenshot could not be matched with incoming bank credits.'}
          </p>
          <p className="text-xs text-[#99907c]">
            Please re-submit your valid 12-digit UTR or contact our WhatsApp support team below.
          </p>
        </div>
      )}

      {/* 2. WhatsApp Integration Card */}
      {isUpi && (
        <div className="bg-[#1c1b1d] rounded-3xl border border-[#353437] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#353437]">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-editorial text-lg font-bold text-[#e5e1e4]">
                WhatsApp Payment Verification Support
              </h3>
              <p className="text-xs text-[#99907c]">
                Official Business Number: <strong className="text-[#d4af37] font-mono">+91 9188570191</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Desktop WhatsApp QR Code */}
            <div className="hidden md:flex flex-col items-center text-center p-4 bg-[#201f22] rounded-2xl border border-[#353437] space-y-3">
              <span className="text-xs font-bold text-[#e5e1e4]">
                Desktop WhatsApp Scan
              </span>
              {upiInfo?.whatsappQrDataUrl && (
                <div className="bg-white p-3 rounded-xl border border-[#353437] shadow-sm">
                  <img
                    src={upiInfo.whatsappQrDataUrl}
                    alt="WhatsApp Chat QR"
                    className="w-44 h-44 object-contain rounded-md"
                  />
                </div>
              )}
              <p className="text-[11px] text-[#99907c] max-w-xs">
                Scan with your phone to open our WhatsApp chat with your order reference prefilled.
              </p>
            </div>

            {/* Mobile Button & Explanatory Guidance */}
            <div className="space-y-4">
              <div className="bg-[#201f22] p-4 rounded-xl border border-[#353437] text-xs space-y-2">
                <span className="font-bold text-[#e5e1e4] block">Important WhatsApp Instructions:</span>
                <p className="text-[#d0c5af]">
                  Clicking the button opens our business WhatsApp chat with your order details prefilled:
                </p>
                <div className="p-2.5 bg-[#0e0e10] rounded-lg border border-[#353437] font-mono text-[11px] text-[#d0c5af] italic">
                  "{upiInfo?.whatsappMessage || `Hello, I have made a UPI payment. Order ID: ${order.orderNumber}. Amount: ₹${(order.priceBreakdown.totalPaise / 100).toFixed(2)}. Please verify my payment.`}"
                </div>
                <p className="text-[#d0c5af] font-medium">
                  ⚠️ Opening WhatsApp does NOT automatically attach an image. Please tap the attachment/camera icon in WhatsApp and send your payment confirmation screenshot.
                </p>
              </div>

              {/* Mobile WhatsApp Button */}
              {upiInfo?.whatsappUrl && (
                <a
                  href={upiInfo.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25D366] text-stone-900 hover:bg-[#20ba59] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all font-mono"
                >
                  <MessageCircle className="w-4 h-4 text-stone-900" />
                  <span>Send Payment Screenshot on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-700" />
                </a>
              )}
            </div>

          </div>

          {/* Section 8: Direct Screenshot Upload on Website */}
          <div className="pt-6 border-t border-[#353437]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4] mb-2">
              Website Screenshot Upload Alternative
            </h4>
            <p className="text-xs text-[#99907c] mb-4">
              If you prefer not to use WhatsApp, you can upload your payment receipt directly to our secure server.
            </p>

            {order.screenshotPath && (
              <div className="mb-4 bg-[#435b43]/20 p-3 rounded-xl border border-[#435b43]/30 text-xs text-[#8b9b7b] flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#8b9b7b] shrink-0" />
                <span>Payment screenshot has already been uploaded for this order (Stored securely for administrator audit).</span>
              </div>
            )}

            {uploadMessage && (
              <div className="mb-4 bg-[#435b43]/20 p-3 rounded-xl border border-[#435b43]/30 text-xs text-[#8b9b7b] font-medium">
                {uploadMessage}
              </div>
            )}

            {uploadError && (
              <div className="mb-4 bg-[#a94f38]/20 p-3 rounded-xl border border-[#a94f38]/30 text-xs text-[#a94f38] font-medium">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleDirectScreenshotUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">
                  Update 12-Digit UTR (Optional)
                </label>
                <input
                  id="confirm-utr-input"
                  name="additionalUtr"
                  type="text"
                  value={additionalUtr}
                  onChange={(e) => setAdditionalUtr(e.target.value.replace(/\s+/g, ''))}
                  placeholder={order.upiTransactionRef || "e.g. 429381749281"}
                  className="w-full text-xs p-2.5 bg-[#0e0e10] text-[#e5e1e4] placeholder-[#99907c] border border-[#353437] rounded-xl font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">
                  Upload Screenshot (JPG, PNG, WEBP &lt; 5MB)
                </label>
                <input
                  id="confirm-screenshot-input"
                  name="screenshot"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setScreenshotFile(e.target.files[0]);
                      setScreenshotPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  className="w-full text-xs text-[#99907c] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#201f22] file:text-[#d4af37] file:border file:border-[#353437] hover:file:bg-[#d4af37] hover:file:text-[#131315] cursor-pointer"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Proof</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Main Order Details & Fulfillment Card */}
      <div className="bg-[#1c1b1d] rounded-3xl border border-[#353437] p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Fulfillment Timeline */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4] mb-6">
            Fulfillment Journey
          </h3>
          
          <div className="relative flex justify-between items-center max-w-2xl mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#0e0e10] -translate-y-1/2 z-0 border-y border-[#353437]/60" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#d4af37] to-[#f2ca50] -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />

            {statusSteps.map((step, idx) => {
              const isPassed = idx <= currentStep;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed 
                        ? 'bg-[#d4af37] text-[#131315] shadow-md ring-2 ring-[#d4af37]/30' 
                        : 'bg-[#201f22] text-[#99907c] border border-[#353437]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] mt-2 font-semibold text-center max-w-[80px] ${
                    isPassed ? 'text-[#e5e1e4]' : 'text-[#99907c]'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {order.trackingNumber && (
            <div className="mt-8 bg-[#201f22] p-4 rounded-xl border border-[#d4af37]/40 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#e5e1e4] block">Courier Partner: {order.courierName || 'Blue Dart Express'}</span>
                <span className="text-[#99907c]">Tracking AWB: <strong className="font-mono text-[#f2ca50]">{order.trackingNumber}</strong></span>
              </div>
              <span className="text-[10px] bg-[#435b43]/30 text-[#8b9b7b] font-bold px-2 py-1 rounded-md border border-[#435b43]/40">
                In Transit
              </span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="pt-6 border-t border-[#353437] space-y-4">
          <h3 className="font-editorial text-lg font-bold text-[#e5e1e4]">
            Ordered Harvest Items
          </h3>
          <div className="divide-y divide-[#353437]">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg bg-[#0e0e10] border border-[#353437] shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#e5e1e4]">{item.productName}</h4>
                    <p className="text-[11px] text-[#99907c]">{item.packSize} • Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-[#f2ca50] font-product">
                  {formatINR(item.lineTotalPaise)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#353437] text-xs">
          
          {/* Delivery Details */}
          <div className="space-y-2 bg-[#201f22] p-4 rounded-xl border border-[#353437]">
            <h4 className="font-bold uppercase tracking-wider text-[#e5e1e4] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#d4af37]" />
              Shipping Details
            </h4>
            <p className="font-semibold text-[#e5e1e4]">{order.shippingAddress.name}</p>
            <p className="text-[#d0c5af]">{order.shippingAddress.addressLine}</p>
            {order.shippingAddress.landmark && <p className="text-[#99907c]">Landmark: {order.shippingAddress.landmark}</p>}
            <p className="text-[#d0c5af]">
              {order.shippingAddress.city}, {order.shippingAddress.state} - <strong className="text-[#e5e1e4]">{order.shippingAddress.pincode}</strong>
            </p>
            <p className="text-[#d0c5af] pt-1">Phone: {order.shippingAddress.phone}</p>
            <p className="text-[#99907c] text-[11px] pt-1">
              Payment Method: <strong className="uppercase text-[#e5e1e4]">{order.paymentMethod === 'upi_manual' ? 'Direct UPI Transfer' : order.paymentMethod}</strong>
            </p>
            <p className="text-[#99907c] text-[11px]">
              Payment Status: <strong className="uppercase text-[#f2ca50]">{order.paymentStatus}</strong>
            </p>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 bg-[#201f22] p-4 rounded-xl border border-[#353437]">
            <h4 className="font-bold uppercase tracking-wider text-[#e5e1e4]">
              Price Summary
            </h4>
            <div className="flex justify-between text-[#d0c5af]">
              <span>Subtotal:</span>
              <span className="font-semibold font-product text-[#e5e1e4]">{formatINR(order.priceBreakdown.subtotalPaise)}</span>
            </div>
            {order.priceBreakdown.discountPaise > 0 && (
              <div className="flex justify-between text-[#a94f38] font-semibold">
                <span>Discount:</span>
                <span className="font-product">-{formatINR(order.priceBreakdown.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#d0c5af]">
              <span>Shipping:</span>
              <span>{order.priceBreakdown.shippingFeePaise === 0 ? <span className="text-[#8b9b7b] font-bold">FREE</span> : <span className="text-[#f2ca50] font-product">{formatINR(order.priceBreakdown.shippingFeePaise)}</span>}</span>
            </div>
            <div className="flex justify-between text-[#99907c] text-[11px]">
              <span>Tax / GST:</span>
              <span className="font-product">{formatINR(order.priceBreakdown.taxPaise)}</span>
            </div>
            <div className="pt-2 border-t border-[#353437] flex justify-between font-bold text-sm text-[#e5e1e4]">
              <span>Total Payable:</span>
              <span className="font-product text-lg text-[#f2ca50]">{formatINR(order.priceBreakdown.totalPaise)}</span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#353437] flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={handleFetchInvoice}
            disabled={isLoadingInvoice}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#d4af37] hover:text-[#f2ca50] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#d4af37]" />
            <span>{isLoadingInvoice ? 'Generating Invoice...' : 'View Official Tax Invoice / Bill of Supply'}</span>
          </button>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#d4af37] text-[#131315] text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full hover:bg-[#f2ca50] transition-colors shadow-sm"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1c1b1d] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 border border-[#353437] text-[#e5e1e4]">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#201f22] text-[#99907c] hover:text-[#e5e1e4]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Print Header */}
            <div className="border-b border-[#353437] pb-4 flex justify-between items-start">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[#e5e1e4]">
                  {invoiceData.isRegisteredGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                </h3>
                <p className="text-xs font-bold text-[#d0c5af]">{invoiceData.businessName}</p>
                <p className="text-[11px] text-[#99907c]">{invoiceData.address}</p>
                {invoiceData.gstin && (
                  <p className="text-[11px] font-mono text-[#d4af37]">GSTIN: {invoiceData.gstin}</p>
                )}
                {invoiceData.pan && (
                  <p className="text-[11px] font-mono text-[#99907c]">PAN: {invoiceData.pan}</p>
                )}
              </div>
              <div className="text-right text-xs">
                <p className="font-mono font-bold text-[#f2ca50]">{invoiceData.invoiceNumber}</p>
                <p className="text-[#99907c]">Date: {new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</p>
                <p className="text-[#99907c]">Order: {invoiceData.orderNumber}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="text-xs bg-[#201f22] p-3 rounded-xl border border-[#353437]">
              <span className="font-bold text-[#e5e1e4] block mb-1">Billed To (Customer):</span>
              <p className="font-semibold text-[#d0c5af]">{invoiceData.customer.name}</p>
              <p className="text-[#d0c5af]">{invoiceData.customer.addressLine}, {invoiceData.customer.city}, {invoiceData.customer.state} - {invoiceData.customer.pincode}</p>
              <p className="text-[#99907c]">Phone: {invoiceData.customer.phone} | Email: {invoiceData.customer.email}</p>
            </div>

            {/* Line Items */}
            <table className="w-full text-xs divide-y divide-[#353437]">
              <thead>
                <tr className="text-[#99907c] text-left">
                  <th className="py-2">Item</th>
                  <th className="py-2">HSN</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353437]">
                {invoiceData.items.map((it: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 text-[#e5e1e4]">{it.name} <span className="text-[#99907c]">({it.packSize})</span></td>
                    <td className="py-2 font-mono text-[#99907c]">{it.hsnCode}</td>
                    <td className="py-2 text-center font-product text-[#d0c5af]">{it.quantity}</td>
                    <td className="py-2 text-right font-product text-[#d0c5af]">{formatINR(it.ratePaise)}</td>
                    <td className="py-2 text-right font-semibold font-product text-[#f2ca50]">{formatINR(it.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="border-t border-[#353437] pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-[#99907c]">
                <span>Taxable Value:</span>
                <span className="font-product text-[#e5e1e4]">{formatINR(invoiceData.subtotalPaise)}</span>
              </div>
              {invoiceData.discountPaise > 0 && (
                <div className="flex justify-between text-[#a94f38]">
                  <span>Discount:</span>
                  <span className="font-product">-{formatINR(invoiceData.discountPaise)}</span>
                </div>
              )}
              {invoiceData.isRegisteredGst && (
                invoiceData.taxRatePercent > 0 ? (
                  <>
                    <div className="flex justify-between text-[#99907c]">
                      <span>CGST ({invoiceData.taxRatePercent / 2}%):</span>
                      <span className="font-product">{formatINR(invoiceData.cgstPaise)}</span>
                    </div>
                    <div className="flex justify-between text-[#99907c]">
                      <span>SGST ({invoiceData.taxRatePercent / 2}%):</span>
                      <span className="font-product">{formatINR(invoiceData.sgstPaise)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-[#99907c]">
                    <span>GST (0% - Tax Exempt):</span>
                    <span className="font-product">₹0.00</span>
                  </div>
                )
              )}
              <div className="flex justify-between text-[#99907c]">
                <span>Shipping:</span>
                <span className="font-product">{invoiceData.shippingFeePaise === 0 ? 'FREE' : formatINR(invoiceData.shippingFeePaise)}</span>
              </div>
              <div className="pt-2 border-t border-[#353437] flex justify-between font-bold text-sm text-[#e5e1e4]">
                <span>Invoice Total:</span>
                <span className="font-product text-[#f2ca50] text-base">{formatINR(invoiceData.totalPaise)}</span>
              </div>
              <p className="text-[10px] text-[#99907c] italic pt-1">
                Amount in Words: {invoiceData.totalInWords}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#353437]">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
