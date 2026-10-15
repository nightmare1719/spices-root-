import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { IOrder } from '../types/index.js';
import { formatINR, formatDateTime } from '../utils/format.js';
import { 
  CheckCircle2, Package, Truck, Printer, ArrowRight, 
  MapPin, Phone, Mail, Clock, ShieldCheck 
} from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) return;
      try {
        const res = await api.getOrderById(orderNumber);
        if (res.success && res.data) {
          setOrder(res.data);
        }
      } catch (err) {
        console.warn('Could not load order by param:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
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

  const currentStep = getStepIndex(order?.fulfillmentStatus || 'confirmed');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Celebration Header */}
      <div className="bg-[#FAF7F2] p-8 rounded-3xl border border-[#EFE8D6] text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block">
          Order Placed Successfully
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#153E2B]">
          Thank You For Choosing Spice Roots!
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          Your order has been received at our Munnar plantation depot. A confirmation email with full dispatch details has been sent to{' '}
          <strong className="text-[#153E2B]">{order?.customerEmail || 'your email'}</strong>.
        </p>
        <div className="inline-block bg-white px-5 py-2 rounded-full border border-stone-200 mt-2">
          <span className="text-xs text-stone-500 font-medium">Order Reference: </span>
          <span className="text-xs font-mono font-bold text-[#153E2B]">{orderNumber}</span>
        </div>
      </div>

      {order && (
        <div className="bg-white rounded-3xl border border-[#EFE8D6] p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Status Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-6">
              Fulfillment Journey
            </h3>
            
            <div className="relative flex justify-between items-center max-w-2xl mx-auto">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-200 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-[#153E2B] -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />

              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed 
                          ? 'bg-[#153E2B] text-white shadow-md' 
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-[10px] mt-2 font-semibold text-center max-w-[80px] ${
                      isPassed ? 'text-[#153E2B]' : 'text-stone-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.trackingNumber && (
              <div className="mt-8 bg-[#FAF7F2] p-4 rounded-xl border border-[#C5A059]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#153E2B] block">Courier Partner: {order.courierName || 'Blue Dart Express'}</span>
                  <span className="text-stone-500">Tracking AWB: <strong className="font-mono text-[#153E2B]">{order.trackingNumber}</strong></span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md">
                  In Transit
                </span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="pt-6 border-t border-stone-100 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-[#153E2B]">
              Ordered Harvest Items
            </h3>
            <div className="divide-y divide-stone-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg bg-stone-100" />
                    <div>
                      <h4 className="font-bold text-[#153E2B]">{item.productName}</h4>
                      <p className="text-[11px] text-stone-500">{item.packSize} • Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#153E2B]">
                    {formatINR(item.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Address & Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-stone-100 text-xs">
            
            {/* Delivery Details */}
            <div className="space-y-2 bg-[#FAF7F2] p-4 rounded-xl border border-[#EFE8D6]">
              <h4 className="font-bold uppercase tracking-wider text-[#153E2B] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                Shipping Details
              </h4>
              <p className="font-semibold text-stone-800">{order.shippingAddress.name}</p>
              <p className="text-stone-600">{order.shippingAddress.addressLine}</p>
              {order.shippingAddress.landmark && <p className="text-stone-500">Landmark: {order.shippingAddress.landmark}</p>}
              <p className="text-stone-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} - <strong>{order.shippingAddress.pincode}</strong>
              </p>
              <p className="text-stone-600 pt-1">Phone: {order.shippingAddress.phone}</p>
              <p className="text-stone-500 text-[11px]">Payment Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Razorpay'}</p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 bg-[#FAF7F2] p-4 rounded-xl border border-[#EFE8D6]">
              <h4 className="font-bold uppercase tracking-wider text-[#153E2B]">
                Price Summary
              </h4>
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatINR(order.priceBreakdown.subtotalPaise)}</span>
              </div>
              {order.priceBreakdown.discountPaise > 0 && (
                <div className="flex justify-between text-[#B85D3A] font-semibold">
                  <span>Discount:</span>
                  <span>-{formatINR(order.priceBreakdown.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping:</span>
                <span>{order.priceBreakdown.shippingFeePaise === 0 ? 'FREE' : formatINR(order.priceBreakdown.shippingFeePaise)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-[#153E2B]">
                <span>Total Paid / Payable:</span>
                <span className="font-editorial text-lg">{formatINR(order.priceBreakdown.totalPaise)}</span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-black"
            >
              <Printer className="w-4 h-4 text-[#C5A059]" />
              <span>Print Tax Invoice</span>
            </button>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full hover:bg-[#1E5138] transition-colors shadow-xs"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
};
