import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { formatINR, formatDateTime } from '../../utils/format.js';
import { 
  TrendingUp, ShoppingCart, AlertTriangle, Package, 
  Users, ArrowRight, ShieldCheck, Clock, X, 
  MapPin, Phone, Mail, Truck, CheckCircle2, ChevronRight, ExternalLink 
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order for the "Recent Orders" Detail Breakdown Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('processing');
  const [modalCourier, setModalCourier] = useState<string>('Blue Dart Express');
  const [modalTracking, setModalTracking] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await api.admin.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleOpenOrderModal = (ord: any) => {
    setSelectedOrder(ord);
    setModalStatus(ord.fulfillmentStatus || 'processing');
    setModalCourier(ord.courierName || 'Blue Dart Express');
    setModalTracking(ord.trackingNumber || '');
  };

  const handleSaveModalStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdatingStatus(true);
    try {
      await api.admin.updateOrderStatus(selectedOrder.id || selectedOrder.orderNumber, {
        fulfillmentStatus: modalStatus as any,
        courierName: modalCourier.trim() || undefined,
        trackingNumber: modalTracking.trim() || undefined,
        note: `Status updated to ${modalStatus} from recent orders panel`
      });

      // Update local selectedOrder state and reload dashboard
      setSelectedOrder((prev: any) => ({
        ...prev,
        fulfillmentStatus: modalStatus,
        courierName: modalCourier,
        trackingNumber: modalTracking
      }));
      await loadDashboard();
      alert(`Order ${selectedOrder.orderNumber} status updated to ${modalStatus}!`);
    } catch (err) {
      alert((err as Error).message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-[#D0AE70] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#77766E]">Compiling store metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-[#77766E] text-xs">
        Could not load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#171814]">
          Store Overview & Logistics
        </h1>
        <p className="text-xs text-[#77766E]">
          Live sales data, order processing queues, and plantation warehouse inventory.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-[#E5DED0] shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-[#77766E]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Total Sales</span>
            <div className="p-2 bg-[#435B43]/10 rounded-xl text-[#435B43]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#435B43] block">
            {formatINR(data.totalRevenuePaise)}
          </span>
          <span className="text-[11px] text-[#77766E]">From paid & confirmed orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5DED0] shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-[#77766E]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Total Orders</span>
            <div className="p-2 bg-[#171814]/10 rounded-xl text-[#171814]">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#171814] block">
            {data.totalOrders}
          </span>
          <span className="text-[11px] text-[#77766E]">{data.pendingOrdersCount} awaiting dispatch</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5DED0] shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-[#77766E]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Active Products</span>
            <div className="p-2 bg-[#D0AE70]/15 rounded-xl text-[#D0AE70]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#171814] block">
            {data.totalProducts}
          </span>
          <span className="text-[11px] text-[#77766E]">Across 6 categories</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5DED0] shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-[#77766E]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Stock Alerts</span>
            <div className="p-2 bg-[#A94F38]/10 rounded-xl text-[#A94F38]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#A94F38] block">
            {data.lowStockAlerts.length}
          </span>
          <span className="text-[11px] text-[#77766E]">Variants with stock &le; 15</span>
        </div>

      </div>

      {/* Low Stock Warning Alert */}
      {data.lowStockAlerts.length > 0 && (
        <div className="bg-[#A94F38]/5 border border-[#A94F38]/20 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-[#A94F38] font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Alert — Replenishment Recommended</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data.lowStockAlerts.map((alert: any, idx: number) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-[#E5DED0] text-xs flex justify-between items-center">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-[#292A25] truncate">{alert.productName}</p>
                  <p className="text-[10px] text-[#77766E]">{alert.variantPackSize} • SKU: {alert.sku}</p>
                </div>
                <span className="text-[10px] bg-[#A94F38]/15 text-[#A94F38] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {alert.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Recent Orders & Bestselling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E5DED0] shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#E5DED0]">
            <div>
              <h2 className="font-editorial text-lg font-bold text-[#171814]">
                Recent Orders
              </h2>
              <p className="text-[11px] text-[#77766E]">Click "Manage" on any order to view full customer and item breakdown.</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-[#171814] hover:text-[#D0AE70] flex items-center gap-1 transition-colors">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F2E8] text-[#292A25] uppercase text-[10px] tracking-wider font-sans">
                <tr>
                  <th className="p-3 rounded-l-lg">Order Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DED0]">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-[#77766E] italic">No orders yet.</td>
                  </tr>
                ) : (
                  data.recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-[#F7F2E8]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#171814]">{ord.orderNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-[#292A25] capitalize">{ord.customerName}</p>
                        <p className="text-[10px] text-[#77766E]">{ord.customerEmail}</p>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          ord.fulfillmentStatus === 'delivered' ? 'bg-[#435B43]/15 text-[#435B43]' :
                          ord.fulfillmentStatus === 'shipped' ? 'bg-[#171814]/10 text-[#171814]' :
                          ord.fulfillmentStatus === 'processing' ? 'bg-[#D0AE70]/20 text-[#79503A]' :
                          'bg-[#E5DED0] text-[#292A25]'
                        }`}>
                          {ord.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#435B43]">
                        {formatINR(ord.priceBreakdown?.totalPaise || 0)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenOrderModal(ord)}
                          className="px-3 py-1.5 bg-[#171814] text-[#D0AE70] hover:bg-[#292A25] rounded-lg text-xs font-semibold shadow-2xs transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bestselling Spices */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5DED0] shadow-xs space-y-4">
          <h2 className="font-editorial text-lg font-bold text-[#171814] pb-3 border-b border-[#E5DED0]">
            Top Selling Harvests
          </h2>

          {data.bestsellers.length === 0 ? (
            <p className="text-xs text-[#77766E] italic py-6 text-center">
              No sales data aggregated yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.bestsellers.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F2E8] border border-[#E5DED0] text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-[#171814] block truncate">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="text-[10px] text-[#77766E]">
                      {item.quantity} units fulfilled
                    </span>
                  </div>
                  <span className="font-bold text-[#435B43] shrink-0">
                    {formatINR(item.revenuePaise)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RECENT ORDERS DETAIL BREAKDOWN MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#E5DED0] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#E5DED0]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-editorial text-xl font-bold text-[#171814]">
                    Order Details: {selectedOrder.orderNumber}
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedOrder.fulfillmentStatus === 'delivered' ? 'bg-[#435B43]/15 text-[#435B43]' :
                    selectedOrder.fulfillmentStatus === 'shipped' ? 'bg-[#171814]/10 text-[#171814]' :
                    selectedOrder.fulfillmentStatus === 'processing' ? 'bg-[#D0AE70]/20 text-[#79503A]' :
                    'bg-[#E5DED0] text-[#292A25]'
                  }`}>
                    {selectedOrder.fulfillmentStatus}
                  </span>
                </div>
                <p className="text-xs text-[#77766E] mt-1">
                  Placed on {formatDateTime(selectedOrder.createdAt)} • Customer: <strong className="capitalize text-[#292A25]">{selectedOrder.customerName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1 rounded-full text-[#77766E] hover:text-[#171814] hover:bg-[#F7F2E8] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F7F2E8] p-3.5 rounded-2xl border border-[#E5DED0] space-y-1">
                <span className="font-bold text-[#171814] flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-sans">
                  <Users className="w-3.5 h-3.5 text-[#D0AE70]" />
                  Customer Information
                </span>
                <p className="font-semibold text-[#292A25] capitalize">{selectedOrder.customerName}</p>
                <p className="text-[#77766E] flex items-center gap-1"><Mail className="w-3 h-3 text-[#77766E]" /> {selectedOrder.customerEmail}</p>
                <p className="text-[#77766E] flex items-center gap-1"><Phone className="w-3 h-3 text-[#77766E]" /> {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div className="bg-[#F7F2E8] p-3.5 rounded-2xl border border-[#E5DED0] space-y-1">
                <span className="font-bold text-[#171814] flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-sans">
                  <MapPin className="w-3.5 h-3.5 text-[#D0AE70]" />
                  Delivery Destination
                </span>
                <p className="text-[#292A25] leading-tight">
                  {selectedOrder.shippingAddress?.addressLine}
                  {selectedOrder.shippingAddress?.landmark && `, ${selectedOrder.shippingAddress.landmark}`}
                </p>
                <p className="text-[#292A25] font-semibold">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </p>
                <p className="text-[11px] text-[#77766E]">
                  Payment: <strong className="uppercase text-[#292A25]">{selectedOrder.paymentMethod}</strong> ({selectedOrder.paymentStatus})
                </p>
              </div>
            </div>

            {/* STRUCTURED LIST OF ITEMS (Exact Product Name, Quantity Ordered, Total Individual Amount) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#171814] flex items-center gap-1.5 font-sans">
                  <Package className="w-4 h-4 text-[#D0AE70]" />
                  <span>Ordered Items Breakdown ({selectedOrder.items?.length || 0})</span>
                </h4>
                <span className="text-[11px] text-[#77766E]">Itemized line totals</span>
              </div>

              <div className="border border-[#E5DED0] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F2E8] text-[#292A25] text-[10px] uppercase tracking-wider border-b border-[#E5DED0] font-sans">
                    <tr>
                      <th className="p-3">Product Name & Variant</th>
                      <th className="p-3 text-center">Unit Price</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Total Charged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DED0]">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#F7F2E8]/40">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.productName} 
                                className="w-10 h-10 rounded-lg object-cover border border-[#E5DED0] bg-[#F7F2E8] shrink-0" 
                              />
                            )}
                            <div>
                              <p className="font-bold text-[#171814] leading-tight">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-[#77766E] font-mono">
                                Pack: {item.packSize} • SKU: {item.sku || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-medium text-[#292A25]">
                          {formatINR(item.unitPricePaise || (item.lineTotalPaise / (item.quantity || 1)))}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 bg-[#E5DED0] text-[#171814] font-bold rounded-md">
                            &times; {item.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-[#435B43]">
                          {formatINR(item.lineTotalPaise || (item.unitPricePaise * item.quantity))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="bg-[#F7F2E8] p-4 rounded-2xl border border-[#E5DED0] space-y-2 text-xs">
              <div className="flex justify-between text-[#77766E]">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-[#292A25]">{formatINR(selectedOrder.priceBreakdown?.subtotalPaise || 0)}</span>
              </div>
              {selectedOrder.priceBreakdown?.discountPaise > 0 && (
                <div className="flex justify-between text-[#A94F38] font-semibold">
                  <span>Discount Applied:</span>
                  <span>-{formatINR(selectedOrder.priceBreakdown.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#77766E]">
                <span>Shipping Delivery Fee:</span>
                <span className="font-semibold text-[#435B43]">
                  {selectedOrder.priceBreakdown?.shippingFeePaise === 0 ? 'FREE' : formatINR(selectedOrder.priceBreakdown?.shippingFeePaise || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[#77766E]">
                <span>Taxes & GST (Included):</span>
                <span className="font-semibold text-[#292A25]">{formatINR(selectedOrder.priceBreakdown?.taxPaise || 0)}</span>
              </div>
              <div className="pt-2 border-t border-[#E5DED0] flex justify-between items-baseline font-bold text-sm text-[#171814]">
                <span>Total Amount Charged:</span>
                <span className="font-editorial text-xl font-bold text-[#435B43]">
                  {formatINR(selectedOrder.priceBreakdown?.totalPaise || 0)}
                </span>
              </div>
            </div>

            {/* Quick Status Update Form */}
            <form onSubmit={handleSaveModalStatus} className="pt-2 border-t border-[#E5DED0] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#292A25] mb-1">
                    Update Fulfillment Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing at Depot</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {modalStatus === 'shipped' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#292A25] mb-1">
                      Tracking AWB Number
                    </label>
                    <input
                      type="text"
                      value={modalTracking}
                      onChange={(e) => setModalTracking(e.target.value)}
                      placeholder="e.g. BD94820129IN"
                      className="w-full text-xs p-2.5 bg-white border border-[#E5DED0] rounded-xl font-mono text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/admin/orders"
                    className="text-xs text-[#171814] hover:text-[#D0AE70] font-bold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full Orders Logistics Panel</span>
                  </Link>
                  {(modalTracking || selectedOrder.trackingNumber) && (
                    <Link
                      to={`/track/${encodeURIComponent(modalTracking || selectedOrder.trackingNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#435B43] hover:underline font-bold flex items-center gap-1 bg-[#435B43]/10 px-2.5 py-1 rounded-lg border border-[#435B43]/20"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Package Live</span>
                    </Link>
                  )}
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-[#E5DED0] rounded-xl text-xs font-semibold text-[#77766E] hover:bg-[#F7F2E8] cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="flex-1 sm:flex-none px-5 py-2 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
