import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.js';
import { 
  Phone, Mail, MapPin, ShieldCheck, Truck, 
  RotateCcw, Sparkles, Send, CheckCircle2 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.includes('@')) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#0F2E20] text-[#F7F3E9] pt-16 pb-8 border-t border-[#C5A059]/30">
      
      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-[#1E5138]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#153E2B] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#D8B26E]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F3E9]">100% Single-Origin</h4>
              <p className="text-[11px] text-[#E3D9C0]">Direct from Kerala plantations</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#153E2B] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#D8B26E]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F3E9]">Zero Adulteration</h4>
              <p className="text-[11px] text-[#E3D9C0]">Natural sun-dried spices</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#153E2B] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-[#D8B26E]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F3E9]">Pan-India Delivery</h4>
              <p className="text-[11px] text-[#E3D9C0]">Free on orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#153E2B] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-[#D8B26E]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F3E9]">Guaranteed Freshness</h4>
              <p className="text-[11px] text-[#E3D9C0]">Harvested in peak season</p>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#1E5138]">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo.png" 
                alt={settings.storeName}
                className="h-10 w-auto object-contain brightness-125"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="font-editorial text-2xl font-bold tracking-tight text-[#F7F3E9]">
                {settings.storeName.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#E3D9C0] leading-relaxed max-w-sm">
              Cultivated in the misty rainforests of Idukki and the high plateaus of Munnar. We bring authentic, untampered Indian spices directly to kitchens that honor deep, traditional flavor.
            </p>
            <div className="space-y-2 text-xs text-[#E3D9C0] pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D8B26E] shrink-0 mt-0.5" />
                <span>{settings.businessAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D8B26E] shrink-0" />
                <a href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`} className="hover:text-white">
                  {settings.supportPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D8B26E] shrink-0" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-white">
                  {settings.supportEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Catalog Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#D8B26E] mb-4">
              Our Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E3D9C0]">
              <li><Link to="/category/spices" className="hover:text-white transition-colors">Whole Spices</Link></li>
              <li><Link to="/category/masalas" className="hover:text-white transition-colors">Stone-Ground Masalas</Link></li>
              <li><Link to="/category/tea" className="hover:text-white transition-colors">Munnar Orthodox Teas</Link></li>
              <li><Link to="/category/essential_oils" className="hover:text-white transition-colors">Essential Oils & Aromas</Link></li>
              <li><Link to="/category/gift_boxes" className="hover:text-white transition-colors">Handcrafted Spice Caskets</Link></li>
              <li><Link to="/category/chocolates" className="hover:text-white transition-colors">Artisan Munnar Chocolates</Link></li>
            </ul>
          </div>

          {/* Quick Help Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#D8B26E] mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E3D9C0]">
              <li><Link to="/track-order" className="hover:text-white transition-colors">Track My Order</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Our Plantation</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery Policy</Link></li>
              <li><Link to="/returns-policy" className="hover:text-white transition-colors">Returns & Replacement</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#D8B26E] mb-4">
              Harvest Updates
            </h4>
            <p className="text-xs text-[#E3D9C0] leading-relaxed mb-3">
              Receive seasonal harvest announcements, secret Kerala family recipes, and private subscriber promotions.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-[#153E2B] p-3 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you! You are now subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full text-xs bg-[#153E2B] border border-[#1E5138] rounded-lg px-3 py-2 text-white placeholder-[#E3D9C0]/50 focus:outline-hidden focus:border-[#C5A059]"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 p-1 text-[#D8B26E] hover:text-white transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-stone-400">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Credits & Payments */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E3D9C0]">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved. Sourced sustainably from Kerala.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400">Secure Payments via</span>
            <span className="font-bold text-[#D8B26E] bg-[#153E2B] px-2 py-0.5 rounded text-[11px] border border-[#C5A059]/30">
              UPI • Cards • NetBanking • Razorpay
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
