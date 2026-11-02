import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { ICoupon } from '../../types/index.js';
import { formatINR, formatDate } from '../../utils/format.js';
import { Plus, Tag, Trash2, Check, X, Percent, Banknote } from 'lucide-react';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Coupon Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderINR, setMinOrderINR] = useState(499);
  const [maxDiscountINR, setMaxDiscountINR] = useState<number | undefined>(200);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(500);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await api.admin.getCoupons();
      if (res.success && res.data) {
        setCoupons(res.data);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    try {
      await api.admin.createCoupon({
        code: newCode.trim().toUpperCase(),
        discountType,
        discountValue: discountType === 'flat' ? discountValue * 100 : discountValue,
        minOrderValuePaise: minOrderINR * 100,
        maxDiscountPaise: maxDiscountINR ? maxDiscountINR * 100 : undefined,
        usageLimit,
        isActive: true
      });
      setIsModalOpen(false);
      setNewCode('');
      await loadCoupons();
    } catch (err) {
      alert((err as Error).message || 'Failed to create coupon');
    }
  };

  const handleToggleActive = async (cpn: ICoupon) => {
    try {
      await api.admin.updateCoupon(cpn.id || '', { isActive: !cpn.isActive });
      await loadCoupons();
    } catch (err) {
      alert('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon code "${code}"?`)) return;
    try {
      await api.admin.deleteCoupon(id);
      await loadCoupons();
    } catch (err) {
      alert('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#171814]">
            Promotional Coupons & Discounts
          </h1>
          <p className="text-xs text-[#77766E]">
            Configure server-verified discount codes with minimum order limits.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#171814]" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-[#E5DED0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F2E8] text-[#292A25] uppercase text-[10px] tracking-wider border-b border-[#E5DED0] font-sans">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount Type & Value</th>
                <th className="p-4">Min Cart Value</th>
                <th className="p-4">Times Redeemed</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DED0]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#77766E]">Loading coupons...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#77766E]">No active coupons configured.</td>
                </tr>
              ) : (
                coupons.map((cpn) => (
                  <tr key={cpn.id} className="hover:bg-[#F7F2E8]/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#171814] text-xs bg-[#F7F2E8] px-2.5 py-1 rounded-md border border-[#E5DED0]">
                        {cpn.code}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-[#292A25]">
                      {cpn.discountType === 'percent' ? (
                        <span>{cpn.discountValue}% Off {cpn.maxDiscountPaise ? `(Max ₹${cpn.maxDiscountPaise / 100})` : ''}</span>
                      ) : (
                        <span>Flat ₹{(cpn.discountValue / 100).toFixed(0)} Off</span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-[#435B43]">
                      {formatINR(cpn.minOrderValuePaise)}
                    </td>

                    <td className="p-4 text-[#77766E]">
                      {cpn.timesUsed} {cpn.usageLimit ? `/ ${cpn.usageLimit}` : 'times'}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(cpn)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider cursor-pointer ${
                          cpn.isActive ? 'bg-[#435B43]/15 text-[#435B43]' : 'bg-[#E5DED0] text-[#77766E]'
                        }`}
                      >
                        {cpn.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(cpn.id || '', cpn.code)}
                        className="p-1.5 text-[#77766E] hover:text-[#A94F38] rounded-lg transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5DED0] shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5DED0]">
              <h2 className="font-editorial text-lg font-bold text-[#171814]">
                Create Discount Coupon
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#77766E] hover:text-[#171814] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label htmlFor="coupon-code-input" className="block font-semibold text-[#292A25] mb-1">Coupon Code *</label>
                <input
                  id="coupon-code-input"
                  name="couponCode"
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MONSOON25"
                  className="w-full p-2.5 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl font-mono uppercase font-bold text-[#171814] focus:outline-hidden focus:border-[#D0AE70]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="coupon-type-select" className="block font-semibold text-[#292A25] mb-1">Type</label>
                  <select
                    id="coupon-type-select"
                    name="discountType"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="coupon-value-input" className="block font-semibold text-[#292A25] mb-1">
                    {discountType === 'percent' ? 'Discount %' : 'Discount INR ₹'}
                  </label>
                  <input
                    id="coupon-value-input"
                    name="discountValue"
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl font-bold text-[#435B43] focus:outline-hidden focus:border-[#D0AE70]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="coupon-min-order-input" className="block font-semibold text-[#292A25] mb-1">Min Order Value (₹)</label>
                  <input
                    id="coupon-min-order-input"
                    name="minOrderINR"
                    type="number"
                    value={minOrderINR}
                    onChange={(e) => setMinOrderINR(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                  />
                </div>

                <div>
                  <label htmlFor="coupon-max-cap-input" className="block font-semibold text-[#292A25] mb-1">Max Cap (₹, optional)</label>
                  <input
                    id="coupon-max-cap-input"
                    name="maxDiscountINR"
                    type="number"
                    value={maxDiscountINR || ''}
                    onChange={(e) => setMaxDiscountINR(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 300"
                    className="w-full p-2.5 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5DED0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#77766E] hover:text-[#171814] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
