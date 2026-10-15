import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { IOrder, OrderFulfillmentStatus } from '../../types/index.js';
import { formatINR, formatDateTime } from '../../utils/format.js';
import { 
  Search, Truck, CheckCircle2, Clock, X, 
  MapPin, Phone, Mail, FileText, ChevronRight 
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order for Status Management Modal
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderFulfillmentStatus>('processing');
  const [newCourier, setNewCourier] = useState('Blue Dart Express');
  const [newTracking, setNewTracking] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.admin.getOrders({ status: statusFilter, search });
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const openStatusModal = (ord: IOrder) => {
    setSelectedOrder(ord);
    setNewStatus(ord.fulfillmentStatus);
    setNewCourier(ord.courierName || 'Blue Dart Express');
    setNewTracking(ord.trackingNumber || '');
    setStatusNote('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      await api.admin.updateOrderStatus(selectedOrder.id || selectedOrder.orderNumber, {
        fulfillmentStatus: newStatus,
        courierName: newCourier.trim() || undefined,
        trackingNumber: newTracking.trim() || undefined,
        note: statusNote.trim() || `Status updated to ${newStatus}`
      });
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      alert((err as Error).message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B]">
          Order Logistics & Shipment Fulfillment
        </h1>
        <p className="text-xs text-stone-500">
          Track customer payments, dispatch parcels, and update tracking numbers.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ref, customer, phone..."
            className="w-full text-xs p-2 bg-[#FAF7F2] border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#C5A059]"
          />
          <button type="submit" className="px-3 bg-[#153E2B] text-white rounded-lg text-xs font-bold">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#FAF7F2] border border-stone-200 rounded-lg p-2"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing at Depot</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Order Ref & Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total & Payment</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone-400">No matching orders found.</td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70">
                    
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#153E2B] text-xs block">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {formatDateTime(ord.createdAt)}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-stone-800">{ord.customerName}</p>
                      <p className="text-[10px] text-stone-500">{ord.customerPhone}</p>
                      <p className="text-[10px] text-stone-400 truncate max-w-[150px]">{ord.customerEmail}</p>
                    </td>

                    <td className="p-4">
                      <div className="text-[11px] space-y-0.5">
                        <span className="font-semibold text-stone-800">{ord.items.length} items:</span>
                        <p className="text-[10px] text-stone-500 truncate max-w-[180px]">
                          {ord.items.map(i => `${i.productName} (${i.packSize})`).join(', ')}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#153E2B] text-xs block">
                        {formatINR(ord.priceBreakdown.totalPaise)}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        ord.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.paymentMethod === 'cod' ? 'COD' : 'Razorpay'} ({ord.paymentStatus})
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit ${
                        ord.fulfillmentStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        ord.fulfillmentStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        ord.fulfillmentStatus === 'processing' ? 'bg-amber-100 text-amber-800' :
                        ord.fulfillmentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-stone-200 text-stone-700'
                      }`}>
                        {ord.fulfillmentStatus}
                      </span>
                      {ord.trackingNumber && (
                        <span className="text-[10px] text-stone-500 font-mono block mt-1">
                          AWB: {ord.trackingNumber}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => openStatusModal(ord)}
                        className="py-1.5 px-3 bg-[#153E2B] text-white rounded-lg text-xs font-semibold hover:bg-[#1E5138] transition-colors"
                      >
                        Update Status
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-stone-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[#153E2B]">
                  Update Order {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-400">Customer: {selectedOrder.customerName}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Fulfillment Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing at Depot</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {newStatus === 'shipped' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Courier Service</label>
                    <select
                      value={newCourier}
                      onChange={(e) => setNewCourier(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg"
                    >
                      <option value="Blue Dart Express">Blue Dart Express</option>
                      <option value="DTDC Logistics">DTDC Logistics</option>
                      <option value="India Post Speed Post">India Post Speed Post</option>
                      <option value="Delhivery">Delhivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Tracking Number (AWB)</label>
                    <input
                      type="text"
                      required
                      value={newTracking}
                      onChange={(e) => setNewTracking(e.target.value)}
                      placeholder="e.g. BD84920194IN"
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Audit Log Note (Optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Packed in heat-sealed vacuum tin and handed to Blue Dart courier"
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                />
              </div>

              {/* Shipping Address Snapshot view */}
              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-stone-200 text-[11px] space-y-1">
                <span className="font-bold text-[#153E2B] block">Delivery Destination:</span>
                <p className="text-stone-600">{selectedOrder.shippingAddress.addressLine}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                <p className="text-stone-500">Contact: {selectedOrder.shippingAddress.phone}</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-[#153E2B] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#1E5138]"
                >
                  {isUpdating ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
