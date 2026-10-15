import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useStore } from '../../context/StoreContext.js';
import { 
  Save, CheckCircle2, ShieldCheck, Cpu, 
  CreditCard, Database, Sparkles, Building 
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { refreshSettings } = useStore();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const res = await api.admin.getSettings();
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await api.admin.updateSettings({
        storeName: settings.storeName,
        brandTagline: settings.brandTagline,
        announcementText: settings.announcementText,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        businessAddress: settings.businessAddress,
        freeShippingThresholdPaise: Number(settings.freeShippingThresholdINR) * 100,
        standardShippingFeePaise: Number(settings.standardShippingFeeINR) * 100,
        taxPercent: Number(settings.taxPercent),
        isCodEnabled: settings.isCodEnabled,
        isRazorpayEnabled: settings.isRazorpayEnabled,
        isAiEnabled: settings.isAiEnabled,
        shippingPolicy: settings.shippingPolicy,
        returnPolicy: settings.returnPolicy,
        privacyPolicy: settings.privacyPolicy,
        termsAndConditions: settings.termsAndConditions
      });

      await refreshSettings();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert((err as Error).message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        Loading store configuration...
      </div>
    );
  }

  const freeThresholdINR = settings.freeShippingThresholdPaise ? (settings.freeShippingThresholdPaise / 100) : (settings.freeShippingThresholdINR || 999);
  const standardFeeINR = settings.standardShippingFeePaise ? (settings.standardShippingFeePaise / 100) : (settings.standardShippingFeeINR || 60);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#153E2B]">
            Store & System Settings
          </h1>
          <p className="text-xs text-stone-500">
            Configure brand parameters, shipping policies, and monitor system integration health.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved & Applied Live</span>
          </div>
        )}
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Gemini AI Status */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#153E2B]">
            <Cpu className="w-4 h-4 text-[#C5A059]" />
            <span>AI Shopping Assistant</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`w-2 h-2 rounded-full ${settings.systemStatus?.isGeminiConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold text-stone-800">
              {settings.systemStatus?.isGeminiConfigured ? 'Gemini 1.5 Active' : 'Smart Catalog Engine Active'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400">
            {settings.systemStatus?.isGeminiConfigured 
              ? 'Server GEMINI_API_KEY verified.' 
              : 'Operating intelligent grounded catalog matcher.'}
          </p>
        </div>

        {/* Razorpay Status */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#153E2B]">
            <CreditCard className="w-4 h-4 text-[#C5A059]" />
            <span>Payment Gateway</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-stone-800">
              {settings.systemStatus?.isRazorpayLive ? 'Razorpay Production' : 'Razorpay Test Sandbox'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400">
            HMAC SHA256 Signature Verification Active.
          </p>
        </div>

        {/* Database Status */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#153E2B]">
            <Database className="w-4 h-4 text-[#C5A059]" />
            <span>Database Storage</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-stone-800 truncate">
              {settings.systemStatus?.databaseMode || 'Embedded DataStore'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400">
            Persistent state in data/store.json & Mongoose ready.
          </p>
        </div>

      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Brand & Contact */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-editorial text-lg font-bold text-[#153E2B] pb-3 border-b border-stone-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#C5A059]" />
            Brand & Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={settings.storeName || ''}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={settings.brandTagline || ''}
                onChange={(e) => setSettings({ ...settings, brandTagline: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Announcement Bar Message</label>
              <input
                type="text"
                value={settings.announcementText || ''}
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Customer Support Phone</label>
              <input
                type="text"
                value={settings.supportPhone || ''}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Customer Support Email</label>
              <input
                type="email"
                value={settings.supportEmail || ''}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Munnar Plantation Depot Address</label>
              <input
                type="text"
                value={settings.businessAddress || ''}
                onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Payment Rules */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-editorial text-lg font-bold text-[#153E2B] pb-3 border-b border-stone-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#C5A059]" />
            Shipping & Payment Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                value={settings.freeShippingThresholdINR !== undefined ? settings.freeShippingThresholdINR : freeThresholdINR}
                onChange={(e) => setSettings({ ...settings, freeShippingThresholdINR: Number(e.target.value) })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl font-bold text-[#153E2B]"
              />
              <p className="text-[10px] text-stone-400 mt-1">Orders above this qualify for free shipping</p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Standard Shipping Fee (₹)</label>
              <input
                type="number"
                value={settings.standardShippingFeeINR !== undefined ? settings.standardShippingFeeINR : standardFeeINR}
                onChange={(e) => setSettings({ ...settings, standardShippingFeeINR: Number(e.target.value) })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl font-bold text-[#153E2B]"
              />
              <p className="text-[10px] text-stone-400 mt-1">Charged on orders below threshold</p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={settings.taxPercent || 5}
                onChange={(e) => setSettings({ ...settings, taxPercent: Number(e.target.value) })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl font-bold text-[#153E2B]"
              />
              <p className="text-[10px] text-stone-400 mt-1">Included in listed catalog prices</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={settings.isRazorpayEnabled !== false}
                onChange={(e) => setSettings({ ...settings, isRazorpayEnabled: e.target.checked })}
                className="rounded text-[#153E2B]"
              />
              <span>Enable Razorpay Online Checkout</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={settings.isCodEnabled !== false}
                onChange={(e) => setSettings({ ...settings, isCodEnabled: e.target.checked })}
                className="rounded text-[#153E2B]"
              />
              <span>Enable Cash on Delivery (COD)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={settings.isAiEnabled !== false}
                onChange={(e) => setSettings({ ...settings, isAiEnabled: e.target.checked })}
                className="rounded text-[#153E2B]"
              />
              <span>Enable AI Shopping Concierge</span>
            </label>
          </div>
        </div>

        {/* Editable Policies */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-editorial text-lg font-bold text-[#153E2B] pb-3 border-b border-stone-100">
            Store Policies (Editable by Owner)
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Shipping & Dispatch Policy</label>
              <textarea
                rows={3}
                value={settings.shippingPolicy || ''}
                onChange={(e) => setSettings({ ...settings, shippingPolicy: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Returns, Replacements & Refund Policy</label>
              <textarea
                rows={3}
                value={settings.returnPolicy || ''}
                onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Privacy Policy</label>
              <textarea
                rows={3}
                value={settings.privacyPolicy || ''}
                onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={settings.termsAndConditions || ''}
                onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                className="w-full p-2.5 bg-[#FAF7F2] border border-stone-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3.5 px-8 bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1E5138] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#D8B26E]" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
