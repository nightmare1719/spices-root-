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
        <div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#99907c]">Compiling store metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-[#99907c] text-xs">
        Could not load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
          Store Overview & Logistics
        </h1>
        <p className="text-xs text-[#d0c5af]">
          Live sales data, order processing queues, and plantation warehouse inventory.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-[#1c1b1d] p-5 rounded-2xl border border-[#353437] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#d0c5af]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Total Sales</span>
            <div className="p-2 bg-[#435b43]/20 rounded-xl text-[#8b9b7b]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#f2ca50] font-product block">
            {formatINR(data.totalRevenuePaise)}
          </span>
          <span className="text-[11px] text-[#99907c]">From paid & confirmed orders</span>
        </div>

        <div className="bg-[#1c1b1d] p-5 rounded-2xl border border-[#353437] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#d0c5af]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Total Orders</span>
            <div className="p-2 bg-[#201f22] text-[#d4af37] rounded-xl border border-[#353437]">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4] block">
            {data.totalOrders}
          </span>
          <span className="text-[11px] text-[#99907c]">{data.pendingOrdersCount} awaiting dispatch</span>
        </div>

        <div className="bg-[#1c1b1d] p-5 rounded-2xl border border-[#353437] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#d0c5af]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Active Products</span>
            <div className="p-2 bg-[#201f22] text-[#d4af37] rounded-xl border border-[#353437]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4] block">
            {data.totalProducts}
          </span>
          <span className="text-[11px] text-[#99907c]">Across 6 categories</span>
        </div>

        <div className="bg-[#1c1b1d] p-5 rounded-2xl border border-[#353437] shadow-sm space-y-2">
          <div className="flex justify-between items-center text-[#d0c5af]">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Stock Alerts</span>
            <div className="p-2 bg-[#a94f38]/20 rounded-xl text-[#a94f38]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#a94f38] block">
            {data.lowStockAlerts.length}
          </span>
          <span className="text-[11px] text-[#99907c]">Variants with stock &le; 15</span>
        </div>

      </div>

      {/* Low Stock Warning Alert */}
      {data.lowStockAlerts.length > 0 && (
        <div className="bg-[#a94f38]/10 border border-[#a94f38]/30 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-[#a94f38] font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Alert — Replenishment Recommended</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data.lowStockAlerts.map((alert: any, idx: number) => (
              <div key={idx} className="bg-[#1c1b1d] p-2.5 rounded-xl border border-[#353437] text-xs flex justify-between items-center">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-[#e5e1e4] truncate">{alert.productName}</p>
                  <p className="text-[10px] text-[#99907c]">{alert.variantPackSize} • SKU: {alert.sku}</p>
                </div>
                <span className="text-[10px] bg-[#a94f38]/20 text-[#a94f38] font-bold px-2 py-0.5 rounded-full shrink-0 border border-[#a94f38]/30">
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
        <div className="lg:col-span-2 bg-[#1c1b1d] p-6 rounded-3xl border border-[#353437] shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#353437]">
            <div>
              <h2 className="font-editorial text-lg font-bold text-[#e5e1e4]">
                Recent Orders
              </h2>
              <p className="text-[11px] text-[#99907c]">Click "Manage" on any order to view full customer and item breakdown.</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-[#d4af37] hover:text-[#f2ca50] flex items-center gap-1 transition-colors">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#201f22] text-[#d0c5af] uppercase text-[10px] tracking-wider font-sans">
                <tr>
                  <th className="p-3 rounded-l-lg">Order Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353437]">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-[#99907c] italic">No orders yet.</td>
                  </tr>
                ) : (
                  data.recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-[#201f22]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#e5e1e4]">{ord.orderNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-[#e5e1e4] capitalize">{ord.customerName}</p>
                        <p className="text-[10px] text-[#99907c]">{ord.customerEmail}</p>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          ord.fulfillmentStatus === 'delivered' ? 'bg-[#435b43]/30 text-[#8b9b7b] border border-[#435b43]/40' :
                          ord.fulfillmentStatus === 'shipped' ? 'bg-[#201f22] text-[#d4af37] border border-[#353437]' :
                          ord.fulfillmentStatus === 'processing' ? 'bg-[#d4af37]/15 text-[#f2ca50] border border-[#d4af37]/30' :
                          'bg-[#201f22] text-[#d0c5af] border border-[#353437]'
                        }`}>
                          {ord.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#f2ca50] font-product">
                        {formatINR(ord.priceBreakdown?.totalPaise || 0)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenOrderModal(ord)}
                          className="px-3 py-1.5 bg-[#201f22] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#131315] border border-[#353437] rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-1"
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
        <div className="bg-[#1c1b1d] p-6 rounded-3xl border border-[#353437] shadow-sm space-y-4">
          <h2 className="font-editorial text-lg font-bold text-[#e5e1e4] pb-3 border-b border-[#353437]">
            Top Selling Harvests
          </h2>

          {data.bestsellers.length === 0 ? (
            <p className="text-xs text-[#99907c] italic py-6 text-center">
              No sales data aggregated yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.bestsellers.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#201f22] border border-[#353437] text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-[#e5e1e4] block truncate">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="text-[10px] text-[#99907c]">
                      {item.quantity} units fulfilled
                    </span>
                  </div>
                  <span className="font-bold text-[#f2ca50] shrink-0 font-product">
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1d] w-full max-w-2xl rounded-3xl border border-[#353437] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-[#e5e1e4] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#353437]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-editorial text-xl font-bold text-[#e5e1e4]">
                    Order Details: {selectedOrder.orderNumber}
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedOrder.fulfillmentStatus === 'delivered' ? 'bg-[#435b43]/30 text-[#8b9b7b] border border-[#435b43]/40' :
                    selectedOrder.fulfillmentStatus === 'shipped' ? 'bg-[#201f22] text-[#d4af37] border border-[#353437]' :
                    selectedOrder.fulfillmentStatus === 'processing' ? 'bg-[#d4af37]/15 text-[#f2ca50] border border-[#d4af37]/30' :
                    'bg-[#201f22] text-[#d0c5af] border border-[#353437]'
                  }`}>
                    {selectedOrder.fulfillmentStatus}
                  </span>
                </div>
                <p className="text-xs text-[#99907c] mt-1">
                  Placed on {formatDateTime(selectedOrder.createdAt)} • Customer: <strong className="capitalize text-[#e5e1e4]">{selectedOrder.customerName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1 rounded-full text-[#99907c] hover:text-[#e5e1e4] hover:bg-[#201f22] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#201f22] p-3.5 rounded-2xl border border-[#353437] space-y-1">
                <span className="font-bold text-[#e5e1e4] flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-sans">
                  <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                  Customer Information
                </span>
                <p className="font-semibold text-[#e5e1e4] capitalize">{selectedOrder.customerName}</p>
                <p className="text-[#99907c] flex items-center gap-1"><Mail className="w-3 h-3 text-[#99907c]" /> {selectedOrder.customerEmail}</p>
                <p className="text-[#99907c] flex items-center gap-1"><Phone className="w-3 h-3 text-[#99907c]" /> {selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div className="bg-[#201f22] p-3.5 rounded-2xl border border-[#353437] space-y-1">
                <span className="font-bold text-[#e5e1e4] flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-sans">
                  <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                  Delivery Destination
                </span>
                <p className="text-[#d0c5af] leading-tight">
                  {selectedOrder.shippingAddress?.addressLine}
                  {selectedOrder.shippingAddress?.landmark && `, ${selectedOrder.shippingAddress.landmark}`}
                </p>
                <p className="text-[#e5e1e4] font-semibold">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </p>
                <p className="text-[11px] text-[#99907c]">
                  Payment: <strong className="uppercase text-[#e5e1e4]">{selectedOrder.paymentMethod}</strong> ({selectedOrder.paymentStatus})
                </p>
              </div>
            </div>

            {/* STRUCTURED LIST OF ITEMS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#e5e1e4] flex items-center gap-1.5 font-sans">
                  <Package className="w-4 h-4 text-[#d4af37]" />
                  <span>Ordered Items Breakdown ({selectedOrder.items?.length || 0})</span>
                </h4>
                <span className="text-[11px] text-[#99907c]">Itemized line totals</span>
              </div>

              <div className="border border-[#353437] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#201f22] text-[#d0c5af] text-[10px] uppercase tracking-wider border-b border-[#353437] font-sans">
                    <tr>
                      <th className="p-3">Product Name & Variant</th>
                      <th className="p-3 text-center">Unit Price</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Total Charged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#353437]">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#201f22]/40">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.productName} 
                                className="w-10 h-10 rounded-lg object-cover border border-[#353437] bg-[#0e0e10] shrink-0" 
                              />
                            )}
                            <div>
                              <p className="font-bold text-[#e5e1e4] leading-tight">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-[#99907c] font-mono">
                                Pack: {item.packSize} • SKU: {item.sku || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-medium text-[#d0c5af] font-product">
                          {formatINR(item.unitPricePaise || (item.lineTotalPaise / (item.quantity || 1)))}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 bg-[#201f22] border border-[#353437] text-[#e5e1e4] font-bold rounded-md">
                            &times; {item.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-[#f2ca50] font-product">
                          {formatINR(item.lineTotalPaise || (item.unitPricePaise * item.quantity))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="bg-[#201f22] p-4 rounded-2xl border border-[#353437] space-y-2 text-xs">
              <div className="flex justify-between text-[#99907c]">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-[#e5e1e4] font-product">{formatINR(selectedOrder.priceBreakdown?.subtotalPaise || 0)}</span>
              </div>
              {selectedOrder.priceBreakdown?.discountPaise > 0 && (
                <div className="flex justify-between text-[#a94f38] font-semibold">
                  <span>Discount Applied:</span>
                  <span className="font-product">-{formatINR(selectedOrder.priceBreakdown.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#99907c]">
                <span>Shipping Delivery Fee:</span>
                <span className="font-semibold text-[#8b9b7b]">
                  {selectedOrder.priceBreakdown?.shippingFeePaise === 0 ? 'FREE' : formatINR(selectedOrder.priceBreakdown?.shippingFeePaise || 0)}
                </span>
              </div>
              <div className="flex justify-between text-[#99907c]">
                <span>Taxes & GST (Included):</span>
                <span className="font-semibold text-[#e5e1e4] font-product">{formatINR(selectedOrder.priceBreakdown?.taxPaise || 0)}</span>
              </div>
              <div className="pt-2 border-t border-[#353437] flex justify-between items-baseline font-bold text-sm text-[#e5e1e4]">
                <span>Total Amount Charged:</span>
                <span className="font-editorial text-xl font-bold text-[#f2ca50] font-product">
                  {formatINR(selectedOrder.priceBreakdown?.totalPaise || 0)}
                </span>
              </div>
            </div>

            {/* Quick Status Update Form */}
            <form onSubmit={handleSaveModalStatus} className="pt-2 border-t border-[#353437] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">
                    Update Fulfillment Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] focus:outline-hidden focus:border-[#d4af37]"
                  >
                    <option value="confirmed" className="bg-[#1c1b1d] text-[#e5e1e4]">Confirmed</option>
                    <option value="processing" className="bg-[#1c1b1d] text-[#e5e1e4]">Processing at Depot</option>
                    <option value="shipped" className="bg-[#1c1b1d] text-[#e5e1e4]">Shipped</option>
                    <option value="delivered" className="bg-[#1c1b1d] text-[#e5e1e4]">Delivered</option>
                    <option value="cancelled" className="bg-[#1c1b1d] text-[#e5e1e4]">Cancelled</option>
                  </select>
                </div>

                {modalStatus === 'shipped' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">
                      Tracking AWB Number
                    </label>
                    <input
                      type="text"
                      value={modalTracking}
                      onChange={(e) => setModalTracking(e.target.value)}
                      placeholder="e.g. BD94820129IN"
                      className="w-full text-xs p-2.5 bg-[#0e0e10] border border-[#353437] rounded-xl font-mono text-[#e5e1e4] focus:outline-hidden focus:border-[#d4af37]"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/admin/orders"
                    className="text-xs text-[#d4af37] hover:text-[#f2ca50] font-bold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full Orders Logistics Panel</span>
                  </Link>
                  {(modalTracking || selectedOrder.trackingNumber) && (
                    <Link
                      to={`/track/${encodeURIComponent(modalTracking || selectedOrder.trackingNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#8b9b7b] hover:underline font-bold flex items-center gap-1 bg-[#435b43]/20 px-2.5 py-1 rounded-lg border border-[#435b43]/30"
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
                    className="flex-1 sm:flex-none px-4 py-2 border border-[#353437] rounded-xl text-xs font-semibold text-[#99907c] hover:bg-[#201f22] hover:text-[#e5e1e4] cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="flex-1 sm:flex-none px-5 py-2 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
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
