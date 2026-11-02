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
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#171814]">
          Registered Customer Directory
        </h1>
        <p className="text-xs text-[#77766E]">
          Review customer accounts, total fulfilled orders, and lifetime purchase value.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E5DED0] shadow-2xs flex justify-between items-center max-w-md">
        <div className="relative w-full">
          <input
            id="admin-customers-search"
            name="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, phone..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#F7F2E8] border border-[#E5DED0] rounded-lg text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
          />
          <Search className="w-4 h-4 text-[#77766E] absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5DED0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F2E8] text-[#292A25] uppercase text-[10px] tracking-wider border-b border-[#E5DED0] font-sans">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Orders Placed</th>
                <th className="p-4">Total Lifetime Spend</th>
                <th className="p-4">Saved Addresses</th>
                <th className="p-4 text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DED0]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#77766E]">Loading customers...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#77766E]">No customers found.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F2E8]/40 transition-colors">
                    <td className="p-4 font-bold text-[#171814]">
                      {c.name}
                    </td>

                    <td className="p-4">
                      <p className="text-[#292A25] font-medium">{c.email}</p>
                      <p className="text-[10px] text-[#77766E]">{c.phone || 'No phone saved'}</p>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#171814] bg-[#171814]/10 px-2.5 py-0.5 rounded-full">
                        {c.totalOrders} orders
                      </span>
                    </td>

                    <td className="p-4 font-editorial text-sm font-bold text-[#435B43]">
                      {formatINR(c.totalSpentPaise)}
                    </td>

                    <td className="p-4 text-[#77766E]">
                      {c.addressesCount} address{c.addressesCount !== 1 ? 'es' : ''}
                    </td>

                    <td className="p-4 text-right text-[#77766E] text-[11px]">
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
