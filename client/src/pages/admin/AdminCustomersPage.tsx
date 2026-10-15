import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { formatINR, formatDate } from '../../utils/format.js';
import { Users, Search, ShoppingBag, ShieldCheck } from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true);
      try {
        const res = await api.admin.getCustomers();
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      <div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B]">
          Registered Customer Directory
        </h1>
        <p className="text-xs text-stone-500">
          Review customer accounts, total fulfilled orders, and lifetime purchase value.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex justify-between items-center max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, phone..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#FAF7F2] border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#C5A059]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Orders Placed</th>
                <th className="p-4">Total Lifetime Spend</th>
                <th className="p-4">Saved Addresses</th>
                <th className="p-4 text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone-400">Loading customers...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone-400">No customers found.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="p-4 font-bold text-[#153E2B]">
                      {c.name}
                    </td>

                    <td className="p-4">
                      <p className="text-stone-800 font-medium">{c.email}</p>
                      <p className="text-[10px] text-stone-400">{c.phone || 'No phone saved'}</p>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#153E2B] bg-[#153E2B]/10 px-2.5 py-0.5 rounded-full">
                        {c.totalOrders} orders
                      </span>
                    </td>

                    <td className="p-4 font-editorial text-sm font-bold text-[#153E2B]">
                      {formatINR(c.totalSpentPaise)}
                    </td>

                    <td className="p-4 text-stone-600">
                      {c.addressesCount} address{c.addressesCount !== 1 ? 'es' : ''}
                    </td>

                    <td className="p-4 text-right text-stone-400 text-[11px]">
                      {formatDate(c.joinedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
