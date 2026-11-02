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
        <RefreshCw className="w-8 h-8 text-[#D0AE70] animate-spin mx-auto" />
        <p className="text-xs text-[#77766E] font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#A94F38] mx-auto" />
        <h2 className="font-editorial text-2xl font-bold text-[#171814]">Order Not Found</h2>
        <p className="text-xs text-[#77766E]">Could not locate order reference "{orderNumber}".</p>
        <Link to="/shop" className="inline-block mt-4 text-xs font-bold uppercase tracking-wider text-[#171814] hover:text-[#D0AE70] underline">
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
        <div className="bg-[#D0AE70]/10 p-8 rounded-3xl border-2 border-[#D0AE70]/40 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#D0AE70]/20 text-[#171814] flex items-center justify-center mx-auto mb-2">
            <Clock className="w-10 h-10 text-[#D0AE70]" />
          </div>
          <span className="text-xs font-bold text-[#171814] uppercase tracking-widest block">
            Payment Verification Pending
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#171814]">
            Your UPI Payment Has Been Submitted
          </h1>
          <p className="text-xs sm:text-sm text-[#292A25] max-w-xl mx-auto">
            We have received your payment submission for Order reference <strong className="font-mono text-[#171814]">{orderNumber}</strong>. 
            Your transaction of <strong className="text-[#435B43] font-product">{formatINR(order.priceBreakdown.totalPaise)}</strong> is currently being verified against our bank statement before dispatch.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="bg-white px-4 py-1.5 rounded-full border border-[#E5DED0] text-xs">
              <span className="text-[#77766E] font-medium">Order: </span>
              <span className="font-mono font-bold text-[#171814]">{orderNumber}</span>
            </div>
            {order.upiTransactionRef && (
              <div className="bg-white px-4 py-1.5 rounded-full border border-[#E5DED0] text-xs">
                <span className="text-[#77766E] font-medium">UTR: </span>
                <span className="font-mono font-bold text-[#292A25]">{order.upiTransactionRef}</span>
              </div>
            )}
            <div className="bg-[#D0AE70]/20 px-4 py-1.5 rounded-full text-xs font-bold text-[#171814]">
              Not Yet Confirmed as Paid
            </div>
          </div>
        </div>
      )}

      {isAwaitingPayment && (
        <div className="bg-[#D0AE70]/10 p-8 rounded-3xl border-2 border-[#D0AE70]/40 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#D0AE70]/20 text-[#171814] flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-10 h-10 text-[#D0AE70]" />
          </div>
          <span className="text-xs font-bold text-[#171814] uppercase tracking-widest block">
            Action Required: Awaiting Transfer
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#171814]">
            Please Complete Your UPI Transfer
          </h1>
          <p className="text-xs sm:text-sm text-[#292A25] max-w-xl mx-auto">
            Please transfer <strong className="text-[#435B43] font-product">{formatINR(order.priceBreakdown.totalPaise)}</strong> to merchant UPI ID <strong className="font-mono text-[#171814]">cynalbertoz@sbi</strong> to process your order.
          </p>
          <div className="inline-block bg-white px-5 py-2 rounded-full border border-[#E5DED0] mt-2">
            <span className="text-xs text-[#77766E] font-medium">Order Reference: </span>
            <span className="text-xs font-mono font-bold text-[#171814]">{orderNumber}</span>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="bg-white p-8 rounded-3xl border border-[#E5DED0] text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#435B43]/15 text-[#435B43] flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-10 h-10 text-[#435B43]" />
          </div>
          <span className="text-xs font-bold text-[#435B43] uppercase tracking-widest block">
            Payment Verified & Order Confirmed
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#171814]">
            Thank You For Choosing Spice Roots!
          </h1>
          <p className="text-xs sm:text-sm text-[#77766E] max-w-lg mx-auto">
            Your payment has been officially verified by our plantation depot accounts team. Your package is scheduled for courier dispatch.
          </p>
          <div className="inline-block bg-[#F7F2E8] px-5 py-2 rounded-full border border-[#E5DED0] mt-2">
            <span className="text-xs text-[#77766E] font-medium">Order Reference: </span>
            <span className="text-xs font-mono font-bold text-[#171814]">{orderNumber}</span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 p-8 rounded-3xl border-2 border-red-300 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest block">
            Payment Verification Discrepancy
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-red-900">
            Payment Verification Rejected
          </h1>
          <p className="text-xs sm:text-sm text-stone-700 max-w-xl mx-auto">
            {order.rejectionReason || 'The submitted UPI transaction reference or screenshot could not be matched with incoming bank credits.'}
          </p>
          <p className="text-xs text-stone-500">
            Please re-submit your valid 12-digit UTR or contact our WhatsApp support team below.
          </p>
        </div>
      )}

      {/* 2. WhatsApp Integration Card (Sections 5 & 6) */}
      {isUpi && (
        <div className="bg-white rounded-3xl border border-[#075E54]/30 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#075E54] flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-editorial text-lg font-bold text-[#171814]">
                WhatsApp Payment Verification Support
              </h3>
              <p className="text-xs text-[#77766E]">
                Official Business Number: <strong className="text-[#075E54] font-mono">+91 9188570191</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Desktop WhatsApp QR Code */}
            <div className="hidden md:flex flex-col items-center text-center p-4 bg-[#F7F2E8] rounded-2xl border border-[#E5DED0] space-y-3">
              <span className="text-xs font-bold text-[#292A25]">
                Desktop WhatsApp Scan
              </span>
              {upiInfo?.whatsappQrDataUrl && (
                <div className="bg-white p-3 rounded-xl border border-[#E5DED0] shadow-xs">
                  <img
                    src={upiInfo.whatsappQrDataUrl}
                    alt="WhatsApp Chat QR"
                    className="w-44 h-44 object-contain rounded-md"
                  />
                </div>
              )}
              <p className="text-[11px] text-[#77766E] max-w-xs">
                Scan with your phone to open our WhatsApp chat with your order reference prefilled.
              </p>
            </div>

            {/* Mobile Button & Explanatory Guidance */}
            <div className="space-y-4">
              <div className="bg-[#F7F2E8] p-4 rounded-xl border border-[#E5DED0] text-xs space-y-2">
                <span className="font-bold text-[#171814] block">Important WhatsApp Instructions:</span>
                <p className="text-[#292A25]">
                  Clicking the button opens our business WhatsApp chat with your order details prefilled:
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-[#E5DED0] font-mono text-[11px] text-[#292A25] italic">
                  "{upiInfo?.whatsappMessage || `Hello, I have made a UPI payment. Order ID: ${order.orderNumber}. Amount: ₹${(order.priceBreakdown.totalPaise / 100).toFixed(2)}. Please verify my payment.`}"
                </div>
                <p className="text-[#292A25] font-medium">
                  ⚠️ Opening WhatsApp does NOT automatically attach an image. Please tap the attachment/camera icon in WhatsApp and send your payment confirmation screenshot.
                </p>
              </div>

              {/* Mobile WhatsApp Button */}
              {upiInfo?.whatsappUrl && (
                <a
                  href={upiInfo.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25D366] text-stone-900 hover:bg-[#20ba59] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-stone-900" />
                  <span>Send Payment Screenshot on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-700" />
                </a>
              )}
            </div>

          </div>

          {/* Section 8: Direct Screenshot Upload on Website */}
          <div className="pt-6 border-t border-[#E5DED0]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#292A25] mb-2">
              Website Screenshot Upload Alternative
            </h4>
            <p className="text-xs text-[#77766E] mb-4">
              If you prefer not to use WhatsApp, you can upload your payment receipt directly to our secure server.
            </p>

            {order.screenshotPath && (
              <div className="mb-4 bg-[#435B43]/10 p-3 rounded-xl border border-[#435B43]/20 text-xs text-[#435B43] flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-[#435B43] shrink-0" />
                <span>Payment screenshot has already been uploaded for this order (Stored securely for administrator audit).</span>
              </div>
            )}

            {uploadMessage && (
              <div className="mb-4 bg-[#435B43]/10 p-3 rounded-xl border border-[#435B43]/20 text-xs text-[#435B43] font-medium">
                {uploadMessage}
              </div>
            )}

            {uploadError && (
              <div className="mb-4 bg-[#A94F38]/10 p-3 rounded-xl border border-[#A94F38]/30 text-xs text-[#A94F38] font-medium">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleDirectScreenshotUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-[#292A25] mb-1">
                  Update 12-Digit UTR (Optional)
                </label>
                <input
                  id="confirm-utr-input"
                  name="additionalUtr"
                  type="text"
                  value={additionalUtr}
                  onChange={(e) => setAdditionalUtr(e.target.value.replace(/\s+/g, ''))}
                  placeholder={order.upiTransactionRef || "e.g. 429381749281"}
                  className="w-full text-xs p-2.5 bg-[#F7F2E8] text-[#292A25] border border-[#E5DED0] rounded-xl font-mono focus:outline-none focus:border-[#D0AE70]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#292A25] mb-1">
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
                  className="w-full text-xs text-[#77766E] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#F7F2E8] file:text-[#292A25] cursor-pointer"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
      <div className="bg-white rounded-3xl border border-[#E5DED0] p-6 sm:p-10 shadow-xs space-y-8">
        
        {/* Fulfillment Timeline */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#292A25] mb-6">
            Fulfillment Journey
          </h3>
          
          <div className="relative flex justify-between items-center max-w-2xl mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#E5DED0] -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-[#D0AE70] -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />

            {statusSteps.map((step, idx) => {
              const isPassed = idx <= currentStep;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed 
                        ? 'bg-[#171814] text-[#D0AE70] shadow-md border border-[#D0AE70]/40' 
                        : 'bg-[#E5DED0] text-[#77766E]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] mt-2 font-semibold text-center max-w-[80px] ${
                    isPassed ? 'text-[#171814]' : 'text-[#77766E]'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {order.trackingNumber && (
            <div className="mt-8 bg-[#F7F2E8] p-4 rounded-xl border border-[#D0AE70]/40 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#171814] block">Courier Partner: {order.courierName || 'Blue Dart Express'}</span>
                <span className="text-[#77766E]">Tracking AWB: <strong className="font-mono text-[#171814]">{order.trackingNumber}</strong></span>
              </div>
              <span className="text-[10px] bg-[#435B43]/15 text-[#435B43] font-bold px-2 py-1 rounded-md border border-[#435B43]/30">
                In Transit
              </span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="pt-6 border-t border-[#E5DED0] space-y-4">
          <h3 className="font-editorial text-lg font-bold text-[#171814]">
            Ordered Harvest Items
          </h3>
          <div className="divide-y divide-[#E5DED0]">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg bg-[#F7F2E8] border border-[#E5DED0] shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#171814]">{item.productName}</h4>
                    <p className="text-[11px] text-[#77766E]">{item.packSize} • Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-[#435B43] font-product">
                  {formatINR(item.lineTotalPaise)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#E5DED0] text-xs">
          
          {/* Delivery Details */}
          <div className="space-y-2 bg-[#F7F2E8] p-4 rounded-xl border border-[#E5DED0]">
            <h4 className="font-bold uppercase tracking-wider text-[#171814] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#D0AE70]" />
              Shipping Details
            </h4>
            <p className="font-semibold text-[#292A25]">{order.shippingAddress.name}</p>
            <p className="text-[#292A25]">{order.shippingAddress.addressLine}</p>
            {order.shippingAddress.landmark && <p className="text-[#77766E]">Landmark: {order.shippingAddress.landmark}</p>}
            <p className="text-[#292A25]">
              {order.shippingAddress.city}, {order.shippingAddress.state} - <strong>{order.shippingAddress.pincode}</strong>
            </p>
            <p className="text-[#292A25] pt-1">Phone: {order.shippingAddress.phone}</p>
            <p className="text-[#77766E] text-[11px] pt-1">
              Payment Method: <strong className="uppercase text-[#292A25]">{order.paymentMethod === 'upi_manual' ? 'Direct UPI Transfer' : order.paymentMethod}</strong>
            </p>
            <p className="text-[#77766E] text-[11px]">
              Payment Status: <strong className="uppercase text-[#171814]">{order.paymentStatus}</strong>
            </p>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 bg-[#F7F2E8] p-4 rounded-xl border border-[#E5DED0]">
            <h4 className="font-bold uppercase tracking-wider text-[#171814]">
              Price Summary
            </h4>
            <div className="flex justify-between text-[#292A25]">
              <span>Subtotal:</span>
              <span className="font-semibold font-product">{formatINR(order.priceBreakdown.subtotalPaise)}</span>
            </div>
            {order.priceBreakdown.discountPaise > 0 && (
              <div className="flex justify-between text-[#A94F38] font-semibold">
                <span>Discount:</span>
                <span className="font-product">-{formatINR(order.priceBreakdown.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#292A25]">
              <span>Shipping:</span>
              <span>{order.priceBreakdown.shippingFeePaise === 0 ? 'FREE' : formatINR(order.priceBreakdown.shippingFeePaise)}</span>
            </div>
            <div className="flex justify-between text-[#77766E] text-[11px]">
              <span>Tax / GST:</span>
              <span className="font-product">{formatINR(order.priceBreakdown.taxPaise)}</span>
            </div>
            <div className="pt-2 border-t border-[#E5DED0] flex justify-between font-bold text-sm text-[#171814]">
              <span>Total Payable:</span>
              <span className="font-product text-lg text-[#435B43]">{formatINR(order.priceBreakdown.totalPaise)}</span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#E5DED0] flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={handleFetchInvoice}
            disabled={isLoadingInvoice}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#292A25] hover:text-[#D0AE70] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D0AE70]" />
            <span>{isLoadingInvoice ? 'Generating Invoice...' : 'View Official Tax Invoice / Bill of Supply'}</span>
          </button>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#D0AE70] text-[#171814] text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full hover:bg-[#B99153] transition-colors shadow-xs"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Print Header */}
            <div className="border-b border-[#E5DED0] pb-4 flex justify-between items-start">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[#171814]">
                  {invoiceData.isRegisteredGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                </h3>
                <p className="text-xs font-bold text-[#292A25]">{invoiceData.businessName}</p>
                <p className="text-[11px] text-[#77766E]">{invoiceData.address}</p>
                {invoiceData.gstin && (
                  <p className="text-[11px] font-mono text-[#171814]">GSTIN: {invoiceData.gstin}</p>
                )}
                {invoiceData.pan && (
                  <p className="text-[11px] font-mono text-[#77766E]">PAN: {invoiceData.pan}</p>
                )}
              </div>
              <div className="text-right text-xs">
                <p className="font-mono font-bold text-[#171814]">{invoiceData.invoiceNumber}</p>
                <p className="text-[#77766E]">Date: {new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</p>
                <p className="text-[#77766E]">Order: {invoiceData.orderNumber}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="text-xs bg-[#F7F2E8] p-3 rounded-xl border border-[#E5DED0]">
              <span className="font-bold text-[#171814] block mb-1">Billed To (Customer):</span>
              <p className="font-semibold text-[#292A25]">{invoiceData.customer.name}</p>
              <p className="text-[#292A25]">{invoiceData.customer.addressLine}, {invoiceData.customer.city}, {invoiceData.customer.state} - {invoiceData.customer.pincode}</p>
              <p className="text-[#77766E]">Phone: {invoiceData.customer.phone} | Email: {invoiceData.customer.email}</p>
            </div>

            {/* Line Items */}
            <table className="w-full text-xs divide-y divide-[#E5DED0]">
              <thead>
                <tr className="text-[#77766E] text-left">
                  <th className="py-2">Item</th>
                  <th className="py-2">HSN</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DED0]">
                {invoiceData.items.map((it: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 text-[#292A25]">{it.name} <span className="text-[#77766E]">({it.packSize})</span></td>
                    <td className="py-2 font-mono text-[#77766E]">{it.hsnCode}</td>
                    <td className="py-2 text-center font-product">{it.quantity}</td>
                    <td className="py-2 text-right font-product">{formatINR(it.ratePaise)}</td>
                    <td className="py-2 text-right font-semibold font-product text-[#435B43]">{formatINR(it.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="border-t border-[#E5DED0] pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-[#77766E]">
                <span>Taxable Value:</span>
                <span className="font-product text-[#292A25]">{formatINR(invoiceData.subtotalPaise)}</span>
              </div>
              {invoiceData.discountPaise > 0 && (
                <div className="flex justify-between text-[#A94F38]">
                  <span>Discount:</span>
                  <span className="font-product">-{formatINR(invoiceData.discountPaise)}</span>
                </div>
              )}
              {invoiceData.isRegisteredGst && (
                invoiceData.taxRatePercent > 0 ? (
                  <>
                    <div className="flex justify-between text-[#77766E]">
                      <span>CGST ({invoiceData.taxRatePercent / 2}%):</span>
                      <span className="font-product">{formatINR(invoiceData.cgstPaise)}</span>
                    </div>
                    <div className="flex justify-between text-[#77766E]">
                      <span>SGST ({invoiceData.taxRatePercent / 2}%):</span>
                      <span className="font-product">{formatINR(invoiceData.sgstPaise)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-[#77766E]">
                    <span>GST (0% - Tax Exempt):</span>
                    <span className="font-product">₹0.00</span>
                  </div>
                )
              )}
              <div className="flex justify-between text-[#77766E]">
                <span>Shipping:</span>
                <span className="font-product">{invoiceData.shippingFeePaise === 0 ? 'FREE' : formatINR(invoiceData.shippingFeePaise)}</span>
              </div>
              <div className="pt-2 border-t border-[#E5DED0] flex justify-between font-bold text-sm text-[#171814]">
                <span>Invoice Total:</span>
                <span className="font-product text-[#435B43] text-base">{formatINR(invoiceData.totalPaise)}</span>
              </div>
              <p className="text-[10px] text-[#77766E] italic pt-1">
                Amount in Words: {invoiceData.totalInWords}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E5DED0]">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
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
