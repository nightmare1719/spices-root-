import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { IOrder } from '../types/index.js';
import { formatINR, formatDateTime } from '../utils/format.js';
import { 
  Search, Package, Truck, CheckCircle2, Clock, 
  MapPin, AlertCircle, Sparkles, ArrowLeft, RefreshCw 
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { trackingId: routeTrackingId } = useParams<{ trackingId?: string }>();
  const [searchParams] = useSearchParams();
  const queryTrackingId = searchParams.get('trackingId') || searchParams.get('order') || searchParams.get('awb');
  const activeTrackingParam = routeTrackingId || queryTrackingId;

  const [orderNumber, setOrderNumber] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [order, setOrder] = useState<IOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showManualForm, setShowManualForm] = useState(!activeTrackingParam);

  // Auto-fetch shipment tracking updates dynamically without intermediate landing wall blockers
  useEffect(() => {
    if (activeTrackingParam) {
      const fetchDirectTracking = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
          const res = await api.trackByTrackingId(activeTrackingParam.trim());
          if (res.success && res.data) {
            setOrder(res.data);
            setOrderNumber(res.data.orderNumber);
            setShowManualForm(false);
          } else {
            setErrorMessage(res.message || `No active shipment matching reference "${activeTrackingParam}" found.`);
            setShowManualForm(true);
          }
        } catch (err) {
          setErrorMessage((err as Error).message || `Could not retrieve live tracking for "${activeTrackingParam}". Please verify your details.`);
          setShowManualForm(true);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDirectTracking();
    }
  }, [activeTrackingParam]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !emailOrPhone.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setOrder(null);

    try {
      const res = await api.trackGuestOrder(orderNumber.trim(), emailOrPhone.trim());
      if (res.success && res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'No matching order found. Please check your reference number and contact info.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusSteps = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Packaging at Munnar' },
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block">
          Live Shipment Status
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#153E2B]">
          {order ? `Shipment Tracking: ${order.orderNumber}` : 'Track Your Spice Shipment'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          {order 
            ? 'Real-time transit updates and dispatch verification from Munnar plantation depot.'
            : 'Enter your Order Number and the Email or Phone used during checkout to monitor dispatch from our Munnar depot.'}
        </p>
      </div>

      {/* Loading direct tracking */}
      {isLoading && (
        <div className="py-12 text-center bg-white p-8 rounded-3xl border border-[#EFE8D6] shadow-xs max-w-2xl mx-auto space-y-3">
          <div className="w-8 h-8 border-4 border-[#153E2B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-600 font-medium">Fetching real-time shipment status from logistics network...</p>
        </div>
      )}

      {/* Tracking Search Form (shown when manual search is active or when toggled) */}
      {(!order || showManualForm) && !isLoading && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8D6] shadow-xs max-w-2xl mx-auto">
          <form onSubmit={handleTrackSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Order Reference *
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. SR-2026-91823"
                  className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059] uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Billing Email or Mobile *
                </label>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="email@example.com or 10-digit phone"
                  className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#153E2B] text-white hover:bg-[#1E5138] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-[#D8B26E]" />
              <span>{isLoading ? 'Searching Plantation Log...' : 'Track Shipment'}</span>
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 p-4 bg-[#B85D3A]/10 text-[#B85D3A] rounded-xl border border-[#B85D3A]/30 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {order && !isLoading && (
        <div className="bg-white rounded-3xl border border-[#EFE8D6] p-6 sm:p-10 shadow-xs space-y-8 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-6 border-b border-stone-100">
            <div>
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Tracking Reference</span>
              <h2 className="font-editorial text-2xl font-bold text-[#153E2B] font-mono">
                {order.orderNumber}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="text-xs font-semibold text-stone-600 hover:text-[#153E2B] bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                {showManualForm ? 'Hide Lookup Form' : 'Track Another Order'}
              </button>
              <div className="text-right">
                <span className="text-xs bg-[#153E2B]/10 text-[#153E2B] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Status: {order.fulfillmentStatus}
                </span>
                <p className="text-[11px] text-stone-400 mt-1">Placed on {formatDateTime(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="py-4">
            <div className="relative flex justify-between items-center max-w-xl mx-auto">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-200 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-[#153E2B] -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${(getStepIndex(order.fulfillmentStatus) / 3) * 100}%` }}
              />

              {statusSteps.map((step, idx) => {
                const isPassed = idx <= getStepIndex(order.fulfillmentStatus);
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPassed ? 'bg-[#153E2B] text-white shadow-md' : 'bg-stone-200 text-stone-500'
                    }`}>
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
          </div>

          {/* Courier Dispatch Banner */}
          {order.trackingNumber ? (
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#C5A059]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#153E2B] uppercase tracking-wider">
                  Carrier Information
                </h4>
                <p className="text-sm font-semibold text-stone-800 mt-0.5">
                  Courier: {order.courierName || 'Blue Dart Express'}
                </p>
                <p className="text-xs text-stone-500">
                  AWB Number: <strong className="font-mono text-[#153E2B]">{order.trackingNumber}</strong>
                </p>
              </div>

              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-300">
                Active Tracking
              </span>
            </div>
          ) : (
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C5A059]" />
              <span>
                Your items are being cured and packed at our Munnar Plantation Depot. Courier tracking number will be updated here upon pickup.
              </span>
            </div>
          )}

          {/* Items Preview */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Shipment Contents ({order.items.length} items)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                  <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg bg-stone-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-[#153E2B] truncate">{item.productName}</p>
                    <p className="text-[11px] text-stone-500">{item.packSize} • Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
