import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { IOrder, OrderFulfillmentStatus, PaymentState } from '../../types/index.js';
import { formatINR, formatDateTime } from '../../utils/format.js';
import { 
  CheckCircle2, Clock, X, 
  ShieldCheck, AlertCircle, Image as ImageIcon,
  ExternalLink, Printer, Check, RefreshCw,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Eye, Download
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Fulfillment Status Modal
  const [statusOrder, setStatusOrder] = useState<IOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderFulfillmentStatus>('processing');
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentState>('AWAITING_PAYMENT');
  const [newCourier, setNewCourier] = useState('Blue Dart Express');
  const [newTracking, setNewTracking] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // UPI Payment Verification Modal
  const [verifyModalOrder, setVerifyModalOrder] = useState<IOrder | null>(null);
  const [adminUtr, setAdminUtr] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentActionMessage, setPaymentActionMessage] = useState('');
  const [paymentActionError, setPaymentActionError] = useState('');

  // Image Screenshot Viewer State
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotation, setImgRotation] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);

  // Invoice Modal
  const [invoiceOrder, setInvoiceOrder] = useState<IOrder | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await api.admin.getOrders({ 
        status: fulfillmentFilter !== 'all' ? fulfillmentFilter : undefined,
        paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
        search: search.trim() || undefined 
      });
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setLoadError((err as Error).message || 'Failed to retrieve orders from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [fulfillmentFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    loadOrders();
  };

  // Open Fulfillment Modal
  const openStatusModal = (ord: IOrder) => {
    setStatusOrder(ord);
    setNewStatus(ord.fulfillmentStatus);
    setNewPaymentStatus(ord.paymentStatus);
    setNewCourier(ord.courierName || 'Professional Courier');
    setNewTracking(ord.trackingNumber || '');
    setStatusNote('');
  };

  // Handle Fulfillment Update
  const handleUpdateStatus = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!statusOrder) return;

    setIsUpdatingStatus(true);
    try {
      await api.admin.updateOrderStatus(statusOrder.id || statusOrder.orderNumber, {
        fulfillmentStatus: newStatus,
        paymentStatus: newPaymentStatus,
        courierName: newCourier.trim() || undefined,
        trackingNumber: newTracking.trim() || undefined,
        note: statusNote.trim() || `Status updated to ${newStatus} (${newPaymentStatus})`
      });
      setStatusOrder(null);
      await loadOrders();
    } catch (err) {
      alert((err as Error).message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick 1-click Approve Payment
  const handleQuickApprove = async (ord: IOrder) => {
    try {
      const res = await api.admin.verifyPayment(ord.id || ord.orderNumber, {
        upiTransactionRef: ord.upiTransactionRef || 'Verified via Bank Statement',
        adminNotes: 'Quick verified by administrator'
      });
      if (res.success) {
        await loadOrders();
      } else {
        alert(res.message || 'Verification failed');
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to verify payment');
    }
  };

  // Open Payment Verification Modal
  const openPaymentModal = (ord: IOrder) => {
    setVerifyModalOrder(ord);
    setAdminUtr(ord.upiTransactionRef || '');
    setAdminNote(ord.adminNotes || '');
    setRejectionReason('');
    setIsRejectMode(false);
    setPaymentActionMessage('');
    setPaymentActionError('');
    setImgZoom(1);
    setImgRotation(0);
    setImgLoadError(false);
  };

  // Handle Verify & Mark Paid
  const handleVerifyPayment = async () => {
    if (!verifyModalOrder) return;
    setIsProcessingPayment(true);
    setPaymentActionError('');
    setPaymentActionMessage('');

    try {
      const res = await api.admin.verifyPayment(verifyModalOrder.id || verifyModalOrder.orderNumber, {
        upiTransactionRef: adminUtr.trim() || undefined,
        utr: adminUtr.trim() || undefined,
        adminNotes: adminNote.trim() || undefined,
        adminNote: adminNote.trim() || undefined
      });

      if (res.success) {
        setPaymentActionMessage(`Payment for order ${verifyModalOrder.orderNumber} successfully marked as PAID.`);
        await loadOrders();
        // Refresh local modal order
        setVerifyModalOrder(res.data);
      } else {
        setPaymentActionError(res.message || 'Verification failed');
      }
    } catch (err) {
      setPaymentActionError((err as Error).message || 'Failed to verify payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Reject Payment
  const handleRejectPayment = async () => {
    if (!verifyModalOrder) return;
    if (!rejectionReason.trim()) {
      setPaymentActionError('Please provide a reason for rejecting this payment submission.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentActionError('');
    setPaymentActionMessage('');

    try {
      const res = await api.admin.rejectPayment(verifyModalOrder.id || verifyModalOrder.orderNumber, {
        rejectionReason: rejectionReason.trim(),
        reason: rejectionReason.trim(),
        adminNotes: adminNote.trim() || undefined,
        adminNote: adminNote.trim() || undefined
      });

      if (res.success) {
        setPaymentActionMessage(`Payment for order ${verifyModalOrder.orderNumber} rejected.`);
        await loadOrders();
        setVerifyModalOrder(res.data);
      } else {
        setPaymentActionError(res.message || 'Rejection failed');
      }
    } catch (err) {
      setPaymentActionError((err as Error).message || 'Failed to reject payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Open Invoice Preview Modal
  const openInvoiceModal = async (ord: IOrder) => {
    setInvoiceOrder(ord);
    setIsLoadingInvoice(true);
    try {
      const res = await api.admin.getOrderInvoice(ord.id || ord.orderNumber);
      if (res.success && res.data) {
        setInvoiceData(res.data);
      }
    } catch (err) {
      alert('Failed to load invoice: ' + (err as Error).message);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  // Payment state counts
  const pendingCount = orders.filter(o => o.paymentStatus === 'VERIFICATION_PENDING').length;
  const paidCount = orders.filter(o => o.paymentStatus === 'PAID' || o.paymentStatus === 'paid').length;
  const awaitingCount = orders.filter(o => o.paymentStatus === 'AWAITING_PAYMENT' || o.paymentStatus === 'pending').length;
  const rejectedCount = orders.filter(o => o.paymentStatus === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B]">
            Orders & Direct UPI Payment Verification
          </h1>
          <p className="text-xs text-stone-500">
            Verify direct UPI bank credits, audit customer submissions, manage shipments, and print GST invoices.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-stone-700 hover:text-stone-900 border border-stone-200 rounded-xl text-xs font-bold shadow-2xs hover:bg-stone-50 transition-colors"
          title="Refresh orders list"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Quick Payment Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPaymentFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            paymentFilter === 'all'
              ? 'bg-[#153E2B] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <span>All Orders</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${paymentFilter === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentFilter('VERIFICATION_PENDING')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            paymentFilter === 'VERIFICATION_PENDING'
              ? 'bg-amber-500 text-stone-900 shadow-md ring-2 ring-amber-400 font-extrabold'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100/70 border border-amber-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          <span>Pending Verification</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-mono font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPaymentFilter('PAID')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            paymentFilter === 'PAID'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Paid & Verified</span>
          {paidCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${paymentFilter === 'PAID' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
              {paidCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPaymentFilter('AWAITING_PAYMENT')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            paymentFilter === 'AWAITING_PAYMENT'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <span>Awaiting Transfer</span>
          {awaitingCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${paymentFilter === 'AWAITING_PAYMENT' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
              {awaitingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPaymentFilter('REJECTED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            paymentFilter === 'REJECTED'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
          }`}
        >
          <span>Rejected</span>
          {rejectedCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${paymentFilter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'}`}>
              {rejectedCount}
            </span>
          )}
        </button>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-xs text-red-800 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={loadOrders}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[240px] max-w-md">
          <input
            id="admin-orders-search"
            name="adminOrdersSearch"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ref, customer, phone, UTR..."
            className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
          />
          <button type="submit" className="px-4 bg-[#153E2B] text-white rounded-xl text-xs font-bold hover:bg-[#1E5138] transition-colors">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Payment State Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="admin-orders-payment-filter" className="text-xs font-semibold text-stone-600">Payment:</label>
            <select
              id="admin-orders-payment-filter"
              name="adminOrdersPaymentFilter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs bg-[#FAF7F2] border border-stone-200 rounded-xl p-2 font-medium"
            >
              <option value="all">All Payment States</option>
              <option value="VERIFICATION_PENDING">⏳ Verification Pending</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="PAID">✓ Paid & Verified</option>
              <option value="REJECTED">✕ Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Fulfillment Status Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="admin-orders-fulfillment-filter" className="text-xs font-semibold text-stone-600">Fulfillment:</label>
            <select
              id="admin-orders-fulfillment-filter"
              name="adminOrdersFulfillmentFilter"
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className="text-xs bg-[#FAF7F2] border border-stone-200 rounded-xl p-2 font-medium"
            >
              <option value="all">All Fulfillment</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing at Depot</option>
              <option value="shipped">Dispatched / Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
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
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Verification</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400">No matching orders found.</td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const isPending = ord.paymentStatus === 'VERIFICATION_PENDING';
                  const isPaid = ord.paymentStatus === 'PAID' || ord.paymentStatus === 'paid';
                  const isRejected = ord.paymentStatus === 'REJECTED';

                  return (
                    <tr key={ord.id || ord.orderNumber} className={`hover:bg-stone-50/70 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}>
                      
                      {/* Order Ref & Date */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-[#153E2B] text-xs block">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {formatDateTime(ord.createdAt)}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4">
                        <p className="font-bold text-stone-800">{ord.customerName}</p>
                        <p className="text-[10px] text-stone-500 font-mono">{ord.customerPhone}</p>
                        <p className="text-[10px] text-stone-400 truncate max-w-[150px]">{ord.customerEmail}</p>
                        <p className="text-[10px] text-stone-500 pt-0.5">
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.state}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="p-4">
                        <span className="font-bold text-[#153E2B] text-sm block">
                          {formatINR(ord.priceBreakdown?.totalPaise || 0)}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          {ord.items?.length || 0} item{(ord.items?.length || 0) > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Payment Verification Status */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isPaid 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isPending 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                                : isRejected
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-stone-100 text-stone-700'
                          }`}>
                            {isPending && <Clock className="w-3 h-3 text-amber-700" />}
                            {isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                            {ord.paymentStatus}
                          </span>

                          <span className="text-[10px] text-stone-500 uppercase font-mono">
                            ({ord.paymentMethod === 'upi_manual' ? 'Direct UPI' : ord.paymentMethod})
                          </span>
                        </div>

                        {/* UTR reference if provided */}
                        {ord.upiTransactionRef && (
                          <div className="text-[10px] text-stone-600 font-mono">
                            UTR: <strong className="text-stone-900">{ord.upiTransactionRef}</strong>
                          </div>
                        )}

                        {/* Screenshot indicator with click-to-view preview */}
                        {ord.screenshotPath ? (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => openPaymentModal(ord)}
                              className="group inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-lg text-amber-900 transition-all cursor-pointer text-left shadow-2xs"
                              title="Click to view and audit customer payment receipt"
                            >
                              <img
                                src={api.admin.getScreenshotUrl(ord.id || ord.orderNumber)}
                                alt="Receipt Thumbnail"
                                className="w-5 h-5 object-cover rounded shrink-0 border border-amber-300"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                              <span className="text-[10px] font-bold group-hover:underline flex items-center gap-1">
                                <Eye className="w-3 h-3 text-amber-700" />
                                <span>View Receipt</span>
                              </span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic block">No receipt uploaded</span>
                        )}
                      </td>

                      {/* Fulfillment Status */}
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

                      {/* Actions */}
                      <td className="p-4 text-right space-y-1.5">
                        {ord.paymentMethod === 'upi_manual' && (
                          <div className="flex flex-col gap-1">
                            <button
                              id={`verify-btn-${ord.orderNumber}`}
                              name={`verify-btn-${ord.orderNumber}`}
                              onClick={() => openPaymentModal(ord)}
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                isPending
                                  ? 'bg-[#153E2B] text-white hover:bg-[#1E5138] shadow-xs'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>{isPending ? 'Audit & Verify' : 'Payment Details'}</span>
                            </button>

                            {isPending && (
                              <button
                                id={`quick-approve-${ord.orderNumber}`}
                                name={`quick-approve-${ord.orderNumber}`}
                                onClick={() => handleQuickApprove(ord)}
                                className="w-full py-1 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                title="Quick approve and mark as Paid immediately"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Quick Approve</span>
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex gap-1 justify-end pt-0.5">
                          <button
                            id={`status-modal-btn-${ord.orderNumber}`}
                            name={`status-modal-btn-${ord.orderNumber}`}
                            onClick={() => openStatusModal(ord)}
                            className="py-1 px-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Update Status
                          </button>

                          <button
                            id={`invoice-modal-btn-${ord.orderNumber}`}
                            name={`invoice-modal-btn-${ord.orderNumber}`}
                            onClick={() => openInvoiceModal(ord)}
                            className="py-1 px-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[11px] font-semibold transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            Invoice
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Protected UPI Payment Verification & Audit Modal */}
      {verifyModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8 relative">
            <button
              onClick={() => setVerifyModalOrder(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-stone-200 pb-4">
              <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block">
                Manual UPI Bank Transfer Verification
              </span>
              <h2 className="font-editorial text-2xl font-bold text-[#153E2B] mt-0.5">
                Verify Order {verifyModalOrder.orderNumber}
              </h2>
              <p className="text-xs text-stone-500">
                Cross-check incoming credits in your merchant account (<strong className="font-mono text-stone-700">cynalbertoz@sbi</strong>) before approving.
              </p>
            </div>

            {/* Notification messages */}
            {paymentActionMessage && (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paymentActionMessage}</span>
              </div>
            )}
            {paymentActionError && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{paymentActionError}</span>
              </div>
            )}

            {/* Order & Payment Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-stone-400">Payable Amount</span>
                <div className="font-editorial text-2xl font-bold text-[#153E2B]">
                  {formatINR(verifyModalOrder.priceBreakdown?.totalPaise || 0)}
                </div>
                <div className="text-stone-600">
                  Current Status: <strong className="uppercase text-[#153E2B]">{verifyModalOrder.paymentStatus}</strong>
                </div>
                {verifyModalOrder.paymentSubmittedAt && (
                  <div className="text-stone-500 text-[11px]">
                    Customer Submitted: {formatDateTime(verifyModalOrder.paymentSubmittedAt)}
                  </div>
                )}
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-stone-400">Customer Details</span>
                <p className="font-bold text-stone-800 text-sm">{verifyModalOrder.customerName}</p>
                <p className="text-stone-600 font-mono">{verifyModalOrder.customerPhone}</p>
                <p className="text-stone-500">{verifyModalOrder.customerEmail}</p>
              </div>
            </div>

            {/* Private Payment Screenshot Preview (Protected: served via admin route) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                  Customer Payment Screenshot & Proof
                </h4>
                {verifyModalOrder.screenshotPath && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setImgZoom((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                      className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-stone-500 w-10 text-center">
                      {Math.round(imgZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setImgZoom((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
                      className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImgRotation((prev) => (prev + 90) % 360)}
                      className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImgZoom(1);
                        setImgRotation(0);
                      }}
                      className="text-[10px] text-stone-500 hover:text-stone-800 px-1.5 py-0.5 rounded hover:bg-stone-100"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="ml-1 p-1 bg-[#153E2B]/10 text-[#153E2B] hover:bg-[#153E2B]/20 rounded font-bold flex items-center gap-1 text-[11px] px-2 py-0.5"
                      title="Open Fullscreen Audit Mode"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Audit View</span>
                    </button>
                  </div>
                )}
              </div>

              {verifyModalOrder.screenshotPath ? (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                  <div 
                    className="max-h-72 min-h-48 overflow-hidden rounded-xl border border-stone-200 flex items-center justify-center bg-stone-900/5 p-2 relative cursor-zoom-in"
                    onClick={() => setIsLightboxOpen(true)}
                    title="Click to view full screen"
                  >
                    {!imgLoadError ? (
                      <img
                        src={api.admin.getScreenshotUrl(verifyModalOrder.id || verifyModalOrder.orderNumber)}
                        alt="Customer Payment Receipt"
                        onError={() => setImgLoadError(true)}
                        style={{
                          transform: `scale(${imgZoom}) rotate(${imgRotation}deg)`,
                          transition: 'transform 0.15s ease-out'
                        }}
                        className="max-h-64 object-contain rounded-lg shadow-xs"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2 text-stone-500">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="text-xs font-semibold">Image preview couldn't be rendered directly.</p>
                        <a
                          href={api.admin.getScreenshotUrl(verifyModalOrder.id || verifyModalOrder.orderNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#153E2B] font-bold underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Click here to open directly in browser</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-between items-center text-[11px] text-stone-500 gap-2">
                    <span className="font-mono truncate max-w-xs">
                      File: {verifyModalOrder.screenshotPath}
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href={api.admin.getScreenshotUrl(verifyModalOrder.id || verifyModalOrder.orderNumber)}
                        download={`payment_proof_${verifyModalOrder.orderNumber}.png`}
                        className="text-stone-600 hover:text-stone-900 inline-flex items-center gap-1"
                        title="Download proof to disk"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                      <a
                        href={api.admin.getScreenshotUrl(verifyModalOrder.id || verifyModalOrder.orderNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#153E2B] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-400 text-center italic">
                  No payment screenshot uploaded on the website. Customer may have contacted via WhatsApp.
                </div>
              )}
            </div>

            {/* Admin Verification Inputs */}
            <div className="space-y-4 pt-2 border-t border-stone-100 text-xs">
              <div>
                <label htmlFor="admin-utr-input" className="block font-semibold text-stone-700 mb-1">
                  Verified UPI UTR / Transaction Reference Number
                </label>
                <input
                  id="admin-utr-input"
                  name="adminUtr"
                  type="text"
                  value={adminUtr}
                  onChange={(e) => setAdminUtr(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. 429381749281 (12 digits from your SBI / UPI bank statement)"
                  className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl font-mono text-[#153E2B] font-bold"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Record the confirmed bank reference for invoice reconciliation and accounting audits.
                </span>
              </div>

              <div>
                <label htmlFor="admin-note-input" className="block font-semibold text-stone-700 mb-1">
                  Internal Administrator Note (Optional)
                </label>
                <input
                  id="admin-note-input"
                  name="adminNote"
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Verified credit of ₹350 in SBI account at 11:20 AM"
                  className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                />
              </div>

              {/* Rejection Reason Form */}
              {isRejectMode && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 space-y-2">
                  <label htmlFor="rejection-reason-input" className="block font-bold text-red-900">
                    Reason for Rejection *
                  </label>
                  <input
                    id="rejection-reason-input"
                    name="rejectionReason"
                    type="text"
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. No matching credit in SBI account / Incorrect amount transferred / Duplicate UTR"
                    className="w-full p-2.5 bg-white border border-red-300 rounded-xl text-red-900"
                  />
                  <p className="text-[11px] text-red-700">
                    This reason will be displayed to the customer on their order confirmation and tracking screens.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-stone-200">
              <div className="flex gap-2">
                {!isRejectMode ? (
                  <button
                    type="button"
                    onClick={() => setIsRejectMode(true)}
                    className="px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Reject Submission...
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRejectPayment}
                    disabled={isProcessingPayment}
                    className="px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    {isProcessingPayment ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                )}

                {isRejectMode && (
                  <button
                    type="button"
                    onClick={() => setIsRejectMode(false)}
                    className="px-3 py-2.5 text-stone-500 hover:text-stone-800 text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={isProcessingPayment}
                className="px-6 py-2.5 bg-[#153E2B] text-white hover:bg-[#1E5138] rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D8B26E]" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#D8B26E]" />
                    <span>Verify & Mark as Paid</span>
                  </>
                )}
              </button>
            </div>

            {/* Payment Audit Logs History */}
            {verifyModalOrder.paymentAuditLogs && verifyModalOrder.paymentAuditLogs.length > 0 && (
              <div className="pt-4 border-t border-stone-100">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Payment Audit Trail & Logs
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {verifyModalOrder.paymentAuditLogs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-stone-50 rounded-lg text-[10px] text-stone-600 flex justify-between">
                      <div>
                        <span className="font-bold text-stone-800">{log.changedBy}</span>: {log.previousStatus} → <span className="font-bold text-[#153E2B]">{log.newStatus}</span>
                        {log.note && <span className="block text-stone-500 italic mt-0.5">{log.note}</span>}
                        {log.utr && <span className="block font-mono text-stone-700">UTR: {log.utr}</span>}
                      </div>
                      <span className="text-stone-400 shrink-0 font-mono">{formatDateTime(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. Fulfillment Status Update Modal */}
      {statusOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[#153E2B]">
                  Update Fulfillment: {statusOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-400">Customer: {statusOrder.customerName}</p>
              </div>
              <button onClick={() => setStatusOrder(null)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-fulfillment-status" className="block font-semibold text-stone-700 mb-1">
                    Fulfillment Status *
                  </label>
                  <select
                    id="modal-fulfillment-status"
                    name="fulfillmentStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing at Depot</option>
                    <option value="shipped">Shipped / Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-payment-status" className="block font-semibold text-stone-700 mb-1">
                    Payment Verification Status *
                  </label>
                  <select
                    id="modal-payment-status"
                    name="paymentStatus"
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl font-bold text-[#153E2B]"
                  >
                    <option value="VERIFICATION_PENDING">⏳ VERIFICATION_PENDING</option>
                    <option value="PAID">✓ PAID (Verified)</option>
                    <option value="AWAITING_PAYMENT">AWAITING_PAYMENT</option>
                    <option value="REJECTED">✕ REJECTED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="modal-courier-name" className="block font-semibold text-stone-700 mb-1">Courier Partner</label>
                <input
                  id="modal-courier-name"
                  name="courierName"
                  type="text"
                  value={newCourier}
                  onChange={(e) => setNewCourier(e.target.value)}
                  placeholder="e.g. Blue Dart Express, Delhivery, DTDC"
                  className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label htmlFor="modal-tracking-number" className="block font-semibold text-stone-700 mb-1">Tracking Number / AWB</label>
                <input
                  id="modal-tracking-number"
                  name="trackingNumber"
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="Tracking AWB code"
                  className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label htmlFor="modal-status-note" className="block font-semibold text-stone-700 mb-1">Status Note</label>
                <input
                  id="modal-status-note"
                  name="statusNote"
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched from Munnar plantation hub"
                  className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStatusOrder(null)}
                  className="px-4 py-2 border rounded-xl hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 bg-[#153E2B] text-white rounded-xl font-bold hover:bg-[#1E5138]"
                >
                  {isUpdatingStatus ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Invoice Preview / Print Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => { setInvoiceOrder(null); setInvoiceData(null); }}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>

            {isLoadingInvoice || !invoiceData ? (
              <div className="py-20 text-center text-xs text-stone-500">
                <RefreshCw className="w-6 h-6 animate-spin text-[#153E2B] mx-auto mb-2" />
                <span>Generating official invoice document...</span>
              </div>
            ) : (
              <>
                {/* Invoice Header */}
                <div className="border-b border-stone-200 pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[#153E2B]">
                      {invoiceData.isRegisteredGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                    </h3>
                    <p className="text-xs font-bold text-stone-800">{invoiceData.businessName}</p>
                    <p className="text-[11px] text-stone-500">{invoiceData.address}</p>
                    {invoiceData.gstin && (
                      <p className="text-[11px] font-mono text-[#153E2B]">GSTIN: {invoiceData.gstin}</p>
                    )}
                    {invoiceData.pan && (
                      <p className="text-[11px] font-mono text-stone-600">PAN: {invoiceData.pan}</p>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-mono font-bold text-[#153E2B]">{invoiceData.invoiceNumber}</p>
                    <p className="text-stone-500">Date: {new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</p>
                    <p className="text-stone-500">Order: {invoiceData.orderNumber}</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-700 block mb-1">Billed To (Customer):</span>
                  <p className="font-semibold text-stone-900">{invoiceData.customer.name}</p>
                  <p className="text-stone-600">{invoiceData.customer.addressLine}, {invoiceData.customer.city}, {invoiceData.customer.state} - {invoiceData.customer.pincode}</p>
                  <p className="text-stone-600">Phone: {invoiceData.customer.phone} | Email: {invoiceData.customer.email}</p>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs divide-y divide-stone-200">
                  <thead>
                    <tr className="text-stone-500 text-left">
                      <th className="py-2">Item</th>
                      <th className="py-2">HSN</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {invoiceData.items.map((it: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2">{it.name} <span className="text-stone-400">({it.packSize})</span></td>
                        <td className="py-2 font-mono text-stone-500">{it.hsnCode}</td>
                        <td className="py-2 text-center">{it.quantity}</td>
                        <td className="py-2 text-right">{formatINR(it.ratePaise)}</td>
                        <td className="py-2 text-right font-semibold">{formatINR(it.totalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="border-t border-stone-200 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Value:</span>
                    <span>{formatINR(invoiceData.subtotalPaise)}</span>
                  </div>
                  {invoiceData.discountPaise > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{formatINR(invoiceData.discountPaise)}</span>
                    </div>
                  )}
                  {invoiceData.isRegisteredGst && (
                    <>
                      <div className="flex justify-between text-stone-500">
                        <span>CGST ({invoiceData.taxRatePercent / 2}%):</span>
                        <span>{formatINR(invoiceData.cgstPaise)}</span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>SGST ({invoiceData.taxRatePercent / 2}%):</span>
                        <span>{formatINR(invoiceData.sgstPaise)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping:</span>
                    <span>{invoiceData.shippingFeePaise === 0 ? 'FREE' : formatINR(invoiceData.shippingFeePaise)}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-300 flex justify-between font-bold text-sm text-[#153E2B]">
                    <span>Invoice Total:</span>
                    <span>{formatINR(invoiceData.totalPaise)}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 italic pt-1">
                    Amount in Words: {invoiceData.totalInWords}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#153E2B] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* 6. Fullscreen Payment Screenshot Lightbox Modal */}
      {isLightboxOpen && verifyModalOrder && verifyModalOrder.screenshotPath && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLightboxOpen(false);
          }}
        >
          {/* Lightbox Top Navigation Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-stone-900/90 border-b border-stone-800 text-white z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest font-bold text-[#D8B26E]">
                Payment Audit Lightbox
              </span>
              <span className="text-stone-500">•</span>
              <h3 className="font-mono text-sm font-bold text-white">
                {verifyModalOrder.orderNumber}
              </h3>
              <span className="text-xs text-stone-300">
                ({verifyModalOrder.customerName} - {formatINR(verifyModalOrder.priceBreakdown?.totalPaise || 0)})
              </span>
            </div>

            {/* Controls Toolbar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImgZoom((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-stone-400 w-12 text-center">
                {Math.round(imgZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setImgZoom((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))))}
                className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setImgRotation((prev) => (prev + 90) % 360)}
                className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setImgZoom(1);
                  setImgRotation(0);
                }}
                className="px-2.5 py-1 text-xs text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
              >
                Reset
              </button>
              <a
                href={api.admin.getScreenshotUrl(verifyModalOrder.id || verifyModalOrder.orderNumber)}
                download={`payment_${verifyModalOrder.orderNumber}.png`}
                className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                title="Download screenshot"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors ml-4"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image Stage */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-6 relative select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsLightboxOpen(false);
            }}
          >
            <img
              src={api.admin.getScreenshotUrl(verifyModalOrder.id || verifyModalOrder.orderNumber)}
              alt="Payment Screenshot High Resolution"
              style={{
                transform: `scale(${imgZoom}) rotate(${imgRotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                maxWidth: '90vw',
                maxHeight: '75vh'
              }}
              className="object-contain rounded-xl shadow-2xl border border-stone-800 bg-stone-900"
            />
          </div>

          {/* Lightbox Bottom Action Footer */}
          <div className="px-6 py-3 bg-stone-900/90 border-t border-stone-800 text-stone-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {verifyModalOrder.upiTransactionRef && (
                <span>
                  Submitted UTR: <strong className="font-mono text-[#D8B26E]">{verifyModalOrder.upiTransactionRef}</strong>
                </span>
              )}
              <span>
                Status: <strong className="uppercase text-white">{verifyModalOrder.paymentStatus}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setIsRejectMode(true);
                }}
                className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-xl font-bold transition-colors"
              >
                Reject Proof...
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  handleVerifyPayment();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Mark Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
