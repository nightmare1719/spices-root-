import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext.js';
import { Truck, RotateCcw, Shield, FileText } from 'lucide-react';

export const PoliciesPage: React.FC<{ initialTab?: string }> = ({ initialTab = 'shipping' }) => {
  const { settings } = useStore();
  const location = useLocation();

  const getTabFromPath = () => {
    if (location.pathname.includes('returns')) return 'returns';
    if (location.pathname.includes('privacy')) return 'privacy';
    if (location.pathname.includes('terms')) return 'terms';
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  const tabs = [
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'returns', label: 'Returns & Replacements', icon: RotateCcw },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block">
          Customer Transparency
        </span>
        <h1 className="font-editorial text-3xl font-bold text-[#153E2B]">
          Store Policies & Guarantees
        </h1>
        <p className="text-xs text-stone-500">
          Clear, honest guidelines for shopping with Spice Roots.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 border-b border-stone-200 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#153E2B] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Policy Content */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#EFE8D6] shadow-xs">
        
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl font-bold text-[#153E2B]">
              Shipping and Dispatch Policy
            </h2>
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-3 font-light">
              <p>{settings.shippingPolicy}</p>
              <h3 className="font-bold text-[#153E2B] text-sm pt-2">Domestic Transit Schedules</h3>
              <p>
                All orders are dispatched directly from our plantation warehouse at Post Office Junction, Munnar, Kerala - 685612. Shipments to metropolitan cities (Bengaluru, Chennai, Mumbai, Delhi, Hyderabad) typically arrive within 3-4 business days. Shipments to tier-2 and tier-3 locations arrive within 4-6 business days.
              </p>
              <h3 className="font-bold text-[#153E2B] text-sm pt-2">Free Shipping Eligibility</h3>
              <p>
                Orders with cart values above ₹{(settings.freeShippingThresholdPaise / 100).toFixed(0)} automatically qualify for zero shipping fees.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl font-bold text-[#153E2B]">
              Returns, Replacements & Refunds Policy
            </h2>
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-3 font-light">
              <p>{settings.returnPolicy}</p>
              <h3 className="font-bold text-[#153E2B] text-sm pt-2">Perishable Goods Compliance</h3>
              <p>
                Because agricultural spices and teas are consumable goods, returns cannot be accepted once the inner vacuum pouch seal is breached, unless there is a verifiable manufacturing defect.
              </p>
              <h3 className="font-bold text-[#153E2B] text-sm pt-2">How to Request a Replacement</h3>
              <p>
                Please email photographs of the damaged shipping box or product to <strong className="text-[#153E2B]">{settings.supportEmail}</strong> within 7 days of delivery. Once verified, our team will immediately dispatch an expedited replacement at no extra charge.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl font-bold text-[#153E2B]">
              Privacy and Data Protection
            </h2>
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-3 font-light">
              <p>{settings.privacyPolicy}</p>
              <h3 className="font-bold text-[#153E2B] text-sm pt-2">Payment Credentials</h3>
              <p>
                We do not collect or store raw debit/credit card numbers or CVVs. All electronic transactions are processed through Razorpay's PCI-DSS Level 1 compliant gateway.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl font-bold text-[#153E2B]">
              Terms of Service
            </h2>
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-3 font-light">
              <p>{settings.termsAndConditions}</p>
              <h3 className="font-bold text-[#153E2B] text-sm pt-2">Pricing & Weights</h3>
              <p>
                All prices are listed in Indian National Rupees (INR) and are inclusive of GST. Pack sizes are net weights measured at the time of hermetic packaging.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
