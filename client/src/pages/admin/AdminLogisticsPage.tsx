import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { ShippingZoneRate } from '../../types/index.js';
import { 
  Truck, Plus, Edit2, Trash2, CheckCircle2, 
  Package, MapPin, Scale, RefreshCw, X, AlertCircle,
  Navigation, Info, Compass
} from 'lucide-react';

export const AdminLogisticsPage: React.FC = () => {
  const [rates, setRates] = useState<ShippingZoneRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<ShippingZoneRate>>({
    zoneName: '',
    pincodePrefix: '',
    baseWeightKg: 1,
    baseRate: 100,
    perAdditionalKgRate: 40,
    estimatedDelivery: '2-4 business days',
    isActive: true
  });

  // Simulator Calculator state
  const [simPincode, setSimPincode] = useState('625001');
  const [simWeightGrams, setSimWeightGrams] = useState(1500);
  const [simResult, setSimResult] = useState<number | null>(null);
  const [simDetails, setSimDetails] = useState<{
    zoneName: string;
    baseWeightKg: number;
    baseRate: number;
    perAdditionalKgRate: number;
    extraKg: number;
    shippingChargeINR: number;
    estimatedDelivery?: string;
  } | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const loadRates = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.getShippingRates();
      if (res.success && res.data) {
        setRates(res.data);
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to load shipping zone slabs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  // Use Current Location via Geolocation + Reverse Geocoding
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setLocationStatus('Locating current device coordinates...');
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          if (!res.ok) throw new Error('Geocoding service unavailable');
          const data = await res.json();
          const addr = data.address || {};
          const detectedPincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
          if (detectedPincode && detectedPincode.length === 6) {
            setSimPincode(detectedPincode);
            setLocationStatus(`📍 Detected: ${addr.city || addr.town || addr.village || addr.county || 'Local Area'} (${detectedPincode})`);
          } else {
            setLocationStatus('⚠️ Could not determine a 6-digit postal code. Please enter manually.');
          }
        } catch {
          setLocationStatus('⚠️ Could not fetch pincode from location. Please enter manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(`⚠️ Location error: ${err.message}. Please enter pincode manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Compute live test estimate and detailed breakdown (Weight + Distance Zone = Shipping Charge)
  useEffect(() => {
    if (!simPincode.trim() || simWeightGrams <= 0) {
      setSimResult(null);
      setSimDetails(null);
      return;
    }

    let isMounted = true;

    // First attempt to call the live backend API for guaranteed exact checkout parity
    api.calculateShippingRate(simPincode.trim(), simWeightGrams)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setSimResult(res.data.shippingChargeINR);
          setSimDetails(res.data);
          return;
        }
        throw new Error('API fallback');
      })
      .catch(() => {
        if (!isMounted || rates.length === 0) return;
        // Fallback local matching
        const cleanPincode = simPincode.trim().replace(/\D/g, '');
        let matched: ShippingZoneRate | null = null;

        for (const r of rates) {
          if (r.isActive === false) continue;
          const codes = (r.pincodePrefix || '').split(',').map(p => p.trim());
          for (const entry of codes) {
            if (!entry) continue;
            if (entry === '*' || entry.toLowerCase() === 'default' || entry.toLowerCase() === 'all') continue;

            const cleanEntry = entry.replace(/\D/g, '');
            if (cleanEntry.length === 6 && cleanPincode.length === 6 && cleanEntry === cleanPincode) {
              matched = r;
              break;
            }

            if (entry.includes('-')) {
              const [startStr, endStr] = entry.split('-').map(s => s.trim().replace(/\D/g, ''));
              if (startStr.length === 6 && endStr.length === 6 && cleanPincode.length === 6) {
                const pinNum = parseInt(cleanPincode, 10);
                const startNum = parseInt(startStr, 10);
                const endNum = parseInt(endStr, 10);
                if (!isNaN(pinNum) && !isNaN(startNum) && !isNaN(endNum) && pinNum >= startNum && pinNum <= endNum) {
                  matched = r;
                  break;
                }
              }
            }
          }
          if (matched) break;
        }

        if (!matched) {
          matched = rates.find(r => 
            (r.pincodePrefix && (r.pincodePrefix.includes('*') || r.pincodePrefix.toLowerCase().includes('default') || r.pincodePrefix.toLowerCase().includes('all'))) || 
            r.zoneName.toLowerCase().includes('rest of india')
          ) || rates[0];
        }

        if (matched) {
          const totalWeightKg = simWeightGrams / 1000;
          const baseWeightKg = matched.baseWeightKg > 0 ? matched.baseWeightKg : 1;
          const extraKg = totalWeightKg > baseWeightKg ? Math.ceil(totalWeightKg - baseWeightKg) : 0;
          const totalFee = matched.baseRate + (extraKg * matched.perAdditionalKgRate);

          setSimResult(totalFee);
          setSimDetails({
            zoneName: matched.zoneName,
            baseWeightKg,
            baseRate: matched.baseRate,
            perAdditionalKgRate: matched.perAdditionalKgRate,
            extraKg,
            shippingChargeINR: totalFee,
            estimatedDelivery: matched.estimatedDelivery
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [simPincode, simWeightGrams, rates]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      zoneName: '',
      pincodePrefix: '',
      baseWeightKg: 1,
      baseRate: 100,
      perAdditionalKgRate: 40,
      estimatedDelivery: '2-4 business days',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ShippingZoneRate) => {
    setEditingId(item.id || item._id || null);
    setFormData({
      zoneName: item.zoneName,
      pincodePrefix: item.pincodePrefix,
      baseWeightKg: item.baseWeightKg,
      baseRate: item.baseRate,
      perAdditionalKgRate: item.perAdditionalKgRate,
      estimatedDelivery: item.estimatedDelivery,
      isActive: item.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      if (editingId) {
        const res = await api.admin.updateShippingRate(editingId, formData);
        if (res.success) {
          setSuccessMessage('Shipping slab updated successfully!');
          await loadRates();
          setIsModalOpen(false);
        }
      } else {
        const res = await api.admin.createShippingRate(formData);
        if (res.success) {
          setSuccessMessage('New shipping slab saved to MongoDB!');
          await loadRates();
          setIsModalOpen(false);
        }
      }
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to save shipping slab');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this shipping slab?')) return;
    try {
      const res = await api.admin.deleteShippingRate(id);
      if (res.success) {
        setSuccessMessage('Shipping slab deleted.');
        await loadRates();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to delete shipping slab');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Horizontal Navigation Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#153E2B] text-[#D8B26E] flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-editorial text-xl font-bold text-[#153E2B]">
              Store Overview & Logistics
            </h1>
            <p className="text-xs text-stone-500">
              Manage Destination Pincode & Weight-based rate slabs stored in MongoDB
            </p>
          </div>
        </div>

        {/* Action Buttons: Add New Product & Add Shipping Zone */}
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#153E2B] bg-[#C5A059]/20 hover:bg-[#C5A059]/30 border border-[#C5A059]/40 transition-colors shadow-2xs"
          >
            <Package className="w-4 h-4 text-[#C5A059]" />
            <span>Add New Product</span>
          </a>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#153E2B] hover:bg-[#1E5138] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#D8B26E]" />
            <span>Add Shipping Zone</span>
          </button>
        </div>
      </div>

      {/* Real-time Checkout Courier Integration Banner */}
      <div className="bg-gradient-to-r from-[#153E2B] via-[#1E5138] to-[#153E2B] border border-[#C5A059]/30 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#C5A059] text-[#153E2B] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
              Live Checkout Integrated
            </span>
            <span className="text-xs text-[#D8B26E] font-bold">Weight + Distance [Pincode] Formula Active</span>
          </div>
          <h3 className="font-editorial text-lg font-bold text-white">
            Total Courier Amount = Customer Shipping Charge
          </h3>
          <p className="text-xs text-stone-300 max-w-3xl">
            The rate slabs configured below calculate the courier shipping fee based on customer's exact 6-digit destination pincode and total cart weight in grams. The resulting courier total is automatically charged to the customer at checkout.
          </p>
        </div>
        <div className="shrink-0 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-center">
          <span className="text-[10px] text-[#D8B26E] font-bold uppercase tracking-wider block">Customer Billing</span>
          <span className="font-mono text-xs text-white font-bold">Weight + Pincode</span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Active Shipping Slabs</p>
            <p className="font-editorial text-2xl font-bold text-[#153E2B] mt-1">{rates.filter(r => r.isActive !== false).length}</p>
          </div>
          <MapPin className="w-8 h-8 text-[#153E2B]/15" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Default Base Weight</p>
            <p className="font-editorial text-2xl font-bold text-[#153E2B] mt-1">1.0 kg</p>
          </div>
          <Scale className="w-8 h-8 text-[#153E2B]/15" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Database Storage</p>
            <p className="font-editorial text-2xl font-bold text-[#153E2B] mt-1">MongoDB Atlas</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-[#153E2B]/15" />
        </div>
      </div>

      {/* 2. Responsive Table Grid of Rate Slabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#153E2B] uppercase tracking-wider">
              Destination Pincode & Weight Rate Slabs
            </h2>
            <p className="text-xs text-stone-500">
              Matches customer full 6-digit postal pincodes (or ranges like 625001-625025) with base weight allowance (₹) + per additional kilogram increments.
            </p>
          </div>
          <button
            id="refresh-rates-btn"
            name="refreshRates"
            onClick={loadRates}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50"
            title="Refresh Rates"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading rate slabs...</div>
        ) : rates.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">No shipping slabs configured yet. Click "Add Shipping Zone" above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5">Zone Name</th>
                  <th className="px-5 py-3.5">Serviceable 6-Digit Pincodes</th>
                  <th className="px-5 py-3.5">Base Weight</th>
                  <th className="px-5 py-3.5">Base Rate</th>
                  <th className="px-5 py-3.5">Per Addl. Kg</th>
                  <th className="px-5 py-3.5">Delivery Time</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rates.map((rate) => (
                  <tr key={rate.id || rate._id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-stone-900">
                      {rate.zoneName}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(rate.pincodePrefix || '').split(',').map((p, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                              p.trim() === '*'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-[#153E2B]/10 text-[#153E2B]'
                            }`}
                          >
                            {p.trim() === '*' ? 'REST OF INDIA (*)' : p.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-700 font-medium">
                      {rate.baseWeightKg} kg
                    </td>
                    <td className="px-5 py-4 font-bold text-[#153E2B]">
                      ₹{rate.baseRate}
                    </td>
                    <td className="px-5 py-4 font-medium text-stone-700">
                      +₹{rate.perAdditionalKgRate} / kg
                    </td>
                    <td className="px-5 py-4 text-stone-500">
                      {rate.estimatedDelivery || '—'}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(rate)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#153E2B] hover:bg-stone-100 transition-colors"
                        title="Edit Slab"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rate.id || rate._id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Delete Slab"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Live Shipping Rate Calculation Simulator Widget */}
      <div className="bg-[#153E2B] text-white rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#D8B26E] font-bold text-xs uppercase tracking-widest">
              <Scale className="w-4 h-4" />
              <span>Interactive Courier Logistics Calculator</span>
            </div>
            <span className="text-[10px] bg-[#1E5138] text-amber-200 px-2.5 py-1 rounded-full font-mono font-bold">
              Formula: Weight + Distance [Pincode] = Shipping Fee
            </span>
          </div>

          <p className="text-xs text-stone-300">
            Preview the exact shipping charge that will be applied to the customer at checkout. Test with any destination pincode across India or use your current GPS location.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="sim-pincode-input" className="block text-xs font-semibold text-stone-300">
                  Destination Pincode (6 digits)
                </label>
                <button
                  type="button"
                  id="detect-location-btn"
                  name="detectLocation"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="text-[11px] font-bold text-[#D8B26E] hover:text-amber-200 hover:underline flex items-center gap-1 disabled:opacity-50 transition-colors"
                  title="Detect 6-digit postal code from device GPS"
                >
                  <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Detecting...' : 'Use Current Location'}</span>
                </button>
              </div>
              <input
                id="sim-pincode-input"
                name="simPincode"
                type="text"
                value={simPincode}
                onChange={(e) => setSimPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 625001 (Madurai) or 400001 (Mumbai)"
                maxLength={6}
                className="w-full bg-[#1E5138] border border-[#2A6C4B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-400 focus:outline-hidden focus:border-[#D8B26E] font-mono tracking-wider"
              />
              {locationStatus && (
                <p className="text-[10px] text-amber-200 mt-1 font-medium">{locationStatus}</p>
              )}
            </div>

            <div>
              <label htmlFor="sim-weight-input" className="block text-xs font-semibold text-stone-300 mb-1">
                Total Cart / Package Weight (Grams)
              </label>
              <input
                id="sim-weight-input"
                name="simWeightGrams"
                type="number"
                min="1"
                step="50"
                value={simWeightGrams}
                onChange={(e) => setSimWeightGrams(Math.max(1, Number(e.target.value)))}
                placeholder="e.g. 1500 for 1.5kg"
                className="w-full bg-[#1E5138] border border-[#2A6C4B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-400 focus:outline-hidden focus:border-[#D8B26E] font-mono"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                {(simWeightGrams / 1000).toFixed(2)} kg (Calculated automatically from spice pack weights in cart)
              </p>
            </div>
          </div>

          {/* Result & Breakdown Card */}
          <div className="bg-[#0F2E20] p-4 sm:p-5 rounded-2xl border border-[#2A6C4B] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A6C4B]/60 pb-3">
              <div>
                <span className="text-[10px] text-[#D8B26E] uppercase font-bold tracking-wider block">
                  Customer Shipping Charge (Checkout Total Courier Amount):
                </span>
                <span className="text-xs text-stone-300">
                  Target: PIN <strong className="text-white font-mono">{simPincode || '—'}</strong> | Package:{' '}
                  <strong className="text-white font-mono">{(simWeightGrams / 1000).toFixed(2)} kg</strong>
                </span>
              </div>
              <div className="text-right">
                <div className="font-editorial text-3xl font-bold text-[#D8B26E]">
                  {simResult !== null ? `₹${simResult}` : '—'}
                </div>
                <span className="text-[10px] text-emerald-400 block font-semibold">
                  ✓ Charged to customer at checkout
                </span>
              </div>
            </div>

            {simDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
                <div className="bg-[#153E2B] p-2.5 rounded-xl border border-[#2A6C4B]">
                  <span className="text-stone-400 text-[10px] block">Matched Logistics Zone</span>
                  <span className="font-bold text-white">{simDetails.zoneName}</span>
                  {simDetails.estimatedDelivery && (
                    <span className="text-[10px] text-stone-400 block mt-0.5">⏱ {simDetails.estimatedDelivery}</span>
                  )}
                </div>

                <div className="bg-[#153E2B] p-2.5 rounded-xl border border-[#2A6C4B]">
                  <span className="text-stone-400 text-[10px] block">Base Rate Allowance</span>
                  <span className="font-bold text-white">
                    ₹{simDetails.baseRate} <span className="font-normal text-stone-400">(up to {simDetails.baseWeightKg} kg)</span>
                  </span>
                </div>

                <div className="bg-[#153E2B] p-2.5 rounded-xl border border-[#2A6C4B]">
                  <span className="text-stone-400 text-[10px] block">Incremental Weight</span>
                  <span className="font-bold text-white">
                    {simDetails.extraKg > 0 ? (
                      <>+{simDetails.extraKg} kg @ ₹{simDetails.perAdditionalKgRate}/kg = ₹{simDetails.extraKg * simDetails.perAdditionalKgRate}</>
                    ) : (
                      <span className="text-emerald-400">Within base allowance (₹0)</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Creating / Editing Rate Slab */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold text-[#153E2B]">
                {editingId ? 'Edit Shipping Slab' : 'Add New Shipping Slab'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label htmlFor="zone-name-input" className="block font-semibold text-stone-700 mb-1">
                  Zone Name *
                </label>
                <input
                  id="zone-name-input"
                  name="zoneName"
                  type="text"
                  required
                  value={formData.zoneName}
                  onChange={e => setFormData({ ...formData, zoneName: e.target.value })}
                  placeholder="e.g. Madurai & South TN, Mumbai/Delhi Metros"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 bg-[#FAF7F2] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label htmlFor="pincode-list-input" className="block font-semibold text-stone-700 mb-1">
                  Serviceable 6-Digit Pincodes (comma separated, ranges like 625001-625025, or * for default) *
                </label>
                <input
                  id="pincode-list-input"
                  name="pincodePrefix"
                  type="text"
                  required
                  value={formData.pincodePrefix}
                  onChange={e => setFormData({ ...formData, pincodePrefix: e.target.value })}
                  placeholder="e.g. 625001, 625020, 625001-625025 or *"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 bg-[#FAF7F2] font-mono focus:outline-hidden focus:border-[#C5A059]"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Enter exact 6-digit Indian postal codes or ranges (e.g. 625001-625025). Use * for Rest of India.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="base-weight-input" className="block font-semibold text-stone-700 mb-1">
                    Base Wt (kg)
                  </label>
                  <input
                    id="base-weight-input"
                    name="baseWeightKg"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.baseWeightKg}
                    onChange={e => setFormData({ ...formData, baseWeightKg: parseFloat(e.target.value) || 1 })}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2 bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label htmlFor="base-rate-input" className="block font-semibold text-stone-700 mb-1">
                    Base Rate (₹)
                  </label>
                  <input
                    id="base-rate-input"
                    name="baseRate"
                    type="number"
                    min="0"
                    required
                    value={formData.baseRate}
                    onChange={e => setFormData({ ...formData, baseRate: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2 bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label htmlFor="addl-rate-input" className="block font-semibold text-stone-700 mb-1">
                    Addl. / kg (₹)
                  </label>
                  <input
                    id="addl-rate-input"
                    name="perAdditionalKgRate"
                    type="number"
                    min="0"
                    required
                    value={formData.perAdditionalKgRate}
                    onChange={e => setFormData({ ...formData, perAdditionalKgRate: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2 bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="estimated-delivery-input" className="block font-semibold text-stone-700 mb-1">
                  Estimated Delivery Timeline
                </label>
                <input
                  id="estimated-delivery-input"
                  name="estimatedDelivery"
                  type="text"
                  value={formData.estimatedDelivery || ''}
                  onChange={e => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                  placeholder="e.g. 1-2 business days"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2 bg-[#FAF7F2]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#153E2B] text-white font-bold hover:bg-[#1E5138] transition-colors shadow-xs"
                >
                  {isSaving ? 'Saving to MongoDB...' : 'Save Rate Slab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
