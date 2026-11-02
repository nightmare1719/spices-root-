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
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
          Registered Customer Directory
        </h1>
        <p className="text-xs text-[#d0c5af]">
          Review customer accounts, total fulfilled orders, and lifetime purchase value.
        </p>
      </div>

      <div className="bg-[#1c1b1d] p-4 rounded-2xl border border-[#353437] shadow-2xs flex justify-between items-center max-w-md">
        <div className="relative w-full">
          <input
            id="admin-customers-search"
            name="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, phone..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#0e0e10] border border-[#353437] rounded-lg text-[#e5e1e4] placeholder-[#99907c] focus:outline-hidden focus:border-[#d4af37]"
          />
          <Search className="w-4 h-4 text-[#99907c] absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-[#1c1b1d] rounded-3xl border border-[#353437] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#201f22] text-[#99907c] uppercase text-[10px] tracking-wider border-b border-[#353437] font-sans">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Orders Placed</th>
                <th className="p-4">Total Lifetime Spend</th>
                <th className="p-4">Saved Addresses</th>
                <th className="p-4 text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#353437]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#99907c]">Loading customers...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#99907c]">No customers found.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#201f22]/60 transition-colors">
                    <td className="p-4 font-bold text-[#e5e1e4]">
                      {c.name}
                    </td>

                    <td className="p-4">
                      <p className="text-[#d0c5af] font-medium">{c.email}</p>
                      <p className="text-[10px] text-[#99907c]">{c.phone || 'No phone saved'}</p>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#f2ca50] bg-[#d4af37]/10 border border-[#d4af37]/30 px-2.5 py-0.5 rounded-full">
                        {c.totalOrders} orders
                      </span>
                    </td>

                    <td className="p-4 font-editorial text-sm font-bold text-[#f2ca50]">
                      {formatINR(c.totalSpentPaise)}
                    </td>

                    <td className="p-4 text-[#99907c]">
                      {c.addressesCount} address{c.addressesCount !== 1 ? 'es' : ''}
                    </td>

                    <td className="p-4 text-right text-[#99907c] text-[11px]">
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
