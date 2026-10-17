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
        <div className="w-8 h-8 border-4 border-[#153E2B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-stone-500">Compiling store metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-stone-500 text-xs">
        Could not load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B]">
          Store Overview & Logistics
        </h1>
        <p className="text-xs text-stone-500">
          Live sales data, order processing queues, and plantation warehouse inventory.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B] block">
            {formatINR(data.totalRevenuePaise)}
          </span>
          <span className="text-[11px] text-stone-400">From paid & confirmed orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B] block">
            {data.totalOrders}
          </span>
          <span className="text-[11px] text-stone-400">{data.pendingOrdersCount} awaiting dispatch</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Products</span>
            <div className="p-2 bg-[#C5A059]/15 rounded-xl text-[#C5A059]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B] block">
            {data.totalProducts}
          </span>
          <span className="text-[11px] text-stone-400">Across 6 categories</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-amber-600 block">
            {data.lowStockAlerts.length}
          </span>
          <span className="text-[11px] text-stone-400">Variants with stock &le; 15</span>
        </div>

      </div>

      {/* Low Stock Warning Alert */}
      {data.lowStockAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Alert — Replenishment Recommended</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data.lowStockAlerts.map((alert: any, idx: number) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs flex justify-between items-center">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-stone-800 truncate">{alert.productName}</p>
                  <p className="text-[10px] text-stone-400">{alert.variantPackSize} • SKU: {alert.sku}</p>
                </div>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full shrink-0">
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
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-editorial text-lg font-bold text-[#153E2B]">
                Recent Orders
              </h2>
              <p className="text-[11px] text-stone-400">Click "Manage" on any order to view full customer and item breakdown.</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-[#153E2B] hover:text-[#C5A059] flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-stone-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">Order Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-stone-400 italic">No orders yet.</td>
                  </tr>
                ) : (
                  data.recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#153E2B]">{ord.orderNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-stone-800 capitalize">{ord.customerName}</p>
                        <p className="text-[10px] text-stone-400">{ord.customerEmail}</p>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          ord.fulfillmentStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          ord.fulfillmentStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          ord.fulfillmentStatus === 'processing' ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-200 text-stone-700'
                        }`}>
                          {ord.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#153E2B]">
                        {formatINR(ord.priceBreakdown?.totalPaise || 0)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenOrderModal(ord)}
                          className="px-3 py-1.5 bg-[#153E2B] text-white hover:bg-[#1E5138] rounded-lg text-xs font-semibold shadow-2xs transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-1"
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
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-editorial text-lg font-bold text-[#153E2B] pb-3 border-b border-stone-100">
            Top Selling Harvests
          </h2>

          {data.bestsellers.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-6 text-center">
              No sales data aggregated yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.bestsellers.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-stone-100 text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-[#153E2B] block truncate">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {item.quantity} units fulfilled
                    </span>
                  </div>
                  <span className="font-bold text-[#153E2B] shrink-0">
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
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-editorial text-xl font-bold text-[#153E2B]">
                    Order Details: {selectedOrder.orderNumber}
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedOrder.fulfillmentStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                    selectedOrder.fulfillmentStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    selectedOrder.fulfillmentStatus === 'processing' ? 'bg-amber-100 text-amber-800' :
                    'bg-stone-200 text-stone-700'
                  }`}>
                    {selectedOrder.fulfillmentStatus}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Placed on {formatDateTime(selectedOrder.createdAt)} • Customer: <strong className="capitalize text-stone-800">{selectedOrder.customerName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-stone-200 space-y-1">
                <span className="font-bold text-[#153E2B] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                  Customer Information
                </span>
                <p className="font-semibold text-stone-800 capitalize">{selectedOrder.customerName}</p>
                <p className="text-stone-600 flex items-center gap-1"><Mail className="w-3 h-3 text-stone-400" /> {selectedOrder.customerEmail}</p>
                <p className="text-stone-600 flex items-center gap-1"><Phone className="w-3 h-3 text-stone-400" /> {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-stone-200 space-y-1">
                <span className="font-bold text-[#153E2B] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  Delivery Destination
                </span>
                <p className="text-stone-700 leading-tight">
                  {selectedOrder.shippingAddress?.addressLine}
                  {selectedOrder.shippingAddress?.landmark && `, ${selectedOrder.shippingAddress.landmark}`}
                </p>
                <p className="text-stone-600 font-semibold">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </p>
                <p className="text-[11px] text-stone-500">
                  Payment: <strong className="uppercase">{selectedOrder.paymentMethod}</strong> ({selectedOrder.paymentStatus})
                </p>
              </div>
            </div>

            {/* STRUCTURED LIST OF ITEMS (Exact Product Name, Quantity Ordered, Total Individual Amount) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#153E2B] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#C5A059]" />
                  <span>Ordered Items Breakdown ({selectedOrder.items?.length || 0})</span>
                </h4>
                <span className="text-[11px] text-stone-500">Itemized line totals</span>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-stone-600 text-[10px] uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Product Name & Variant</th>
                      <th className="p-3 text-center">Unit Price</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Total Charged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.productName} 
                                className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0" 
                              />
                            )}
                            <div>
                              <p className="font-bold text-[#153E2B] leading-tight">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-stone-500 font-mono">
                                Pack: {item.packSize} • SKU: {item.sku || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-medium text-stone-600">
                          {formatINR(item.unitPricePaise || (item.lineTotalPaise / (item.quantity || 1)))}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 bg-stone-100 text-stone-800 font-bold rounded-md">
                            &times; {item.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-[#153E2B]">
                          {formatINR(item.lineTotalPaise || (item.unitPricePaise * item.quantity))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-stone-800">{formatINR(selectedOrder.priceBreakdown?.subtotalPaise || 0)}</span>
              </div>
              {selectedOrder.priceBreakdown?.discountPaise > 0 && (
                <div className="flex justify-between text-[#B85D3A] font-semibold">
                  <span>Discount Applied:</span>
                  <span>-{formatINR(selectedOrder.priceBreakdown.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping Delivery Fee:</span>
                <span className="font-semibold text-stone-800">
                  {selectedOrder.priceBreakdown?.shippingFeePaise === 0 ? 'FREE' : formatINR(selectedOrder.priceBreakdown?.shippingFeePaise || 0)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Taxes & GST (Included):</span>
                <span className="font-semibold text-stone-800">{formatINR(selectedOrder.priceBreakdown?.taxPaise || 0)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-sm text-[#153E2B]">
                <span>Total Amount Charged:</span>
                <span className="font-editorial text-xl font-bold text-[#153E2B]">
                  {formatINR(selectedOrder.priceBreakdown?.totalPaise || 0)}
                </span>
              </div>
            </div>

            {/* Quick Status Update Form */}
            <form onSubmit={handleSaveModalStatus} className="pt-2 border-t border-stone-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Update Fulfillment Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-xl"
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
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Tracking AWB Number
                    </label>
                    <input
                      type="text"
                      value={modalTracking}
                      onChange={(e) => setModalTracking(e.target.value)}
                      placeholder="e.g. BD94820129IN"
                      className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <Link
                  to="/admin/orders"
                  className="text-xs text-[#153E2B] hover:text-[#C5A059] font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Orders Logistics Panel</span>
                </Link>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="flex-1 sm:flex-none px-5 py-2 bg-[#153E2B] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#1E5138] transition-colors"
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
