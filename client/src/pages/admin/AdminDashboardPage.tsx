import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { formatINR, formatDateTime } from '../../utils/format.js';
import { 
  TrendingUp, ShoppingCart, AlertTriangle, Package, 
  Users, ArrowRight, ShieldCheck, Clock 
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
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
    }
    loadDashboard();
  }, []);

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

      {/* Low Stock Warning Alert (if any) */}
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
            <h2 className="font-editorial text-lg font-bold text-[#153E2B]">
              Recent Orders
            </h2>
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
                    <tr key={ord.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold text-[#153E2B]">{ord.orderNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-stone-800">{ord.customerName}</p>
                        <p className="text-[10px] text-stone-400">{ord.customerEmail}</p>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          ord.fulfillmentStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          ord.fulfillmentStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          ord.fulfillmentStatus === 'processing' ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-200 text-stone-700'
                        }`}>
                          {ord.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#153E2B]">
                        {formatINR(ord.priceBreakdown.totalPaise)}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/admin/orders`}
                          className="text-[11px] text-[#C5A059] font-bold hover:underline"
                        >
                          Manage
                        </Link>
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

    </div>
  );
};
