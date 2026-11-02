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
    <footer className="bg-[#0e0e10] text-[#e5e1e4] pt-16 pb-8 border-t border-[#d4af37]/20">

      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-[#2a261d]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-lg bg-[#1c1b1d] border border-[#d4af37]/25 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4]">100% Single-Origin</h4>
              <p className="text-[11px] text-[#99907c]">Direct from Kerala plantations</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-lg bg-[#1c1b1d] border border-[#d4af37]/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4]">Zero Adulteration</h4>
              <p className="text-[11px] text-[#99907c]">Natural sun-dried spices</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-lg bg-[#1c1b1d] border border-[#d4af37]/25 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4]">Pan-India Delivery</h4>
              <p className="text-[11px] text-[#99907c]">Transparent shipping</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-lg bg-[#1c1b1d] border border-[#d4af37]/25 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5e1e4]">Guaranteed Freshness</h4>
              <p className="text-[11px] text-[#99907c]">Harvested in peak season</p>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#2a261d]">

          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt={settings.storeName}
                className="h-10 w-auto object-contain brightness-110"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="font-editorial text-2xl font-bold tracking-tight text-[#d4af37]">
                {settings.storeName.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#d0c5af] leading-relaxed max-w-sm">
              Cultivated in the misty rainforests of Idukki and the high plateaus of Munnar. We bring authentic, untampered Indian spices directly to kitchens that honor deep, traditional flavor.
            </p>
            <div className="space-y-2 text-xs text-[#d0c5af] pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>{settings.businessAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`} className="hover:text-[#d4af37] transition-colors">
                  {settings.supportPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-[#d4af37] transition-colors">
                  {settings.supportEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Catalog Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">
              Our Collections
            </h3>
            <ul className="space-y-2.5 text-xs text-[#e5e1e4]">
              <li><Link to="/category/spices" className="hover:text-[#d4af37] transition-colors">Whole Spices</Link></li>
              <li><Link to="/category/masalas" className="hover:text-[#d4af37] transition-colors">Stone-Ground Masalas</Link></li>
              <li><Link to="/category/tea" className="hover:text-[#d4af37] transition-colors">Munnar Orthodox Teas</Link></li>
              <li><Link to="/category/essential_oils" className="hover:text-[#d4af37] transition-colors">Essential Oils & Aromas</Link></li>
              <li><Link to="/category/gift_boxes" className="hover:text-[#d4af37] transition-colors">Handcrafted Spice Caskets</Link></li>
              <li><Link to="/category/chocolates" className="hover:text-[#d4af37] transition-colors">Artisan Munnar Chocolates</Link></li>
            </ul>
          </div>

          {/* Quick Help Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">
              Customer Care
            </h3>
            <ul className="space-y-2.5 text-xs text-[#e5e1e4]">
              <li><Link to="/track-order" className="hover:text-[#d4af37] transition-colors">Track My Order</Link></li>
              <li><Link to="/faq" className="hover:text-[#d4af37] transition-colors">Frequently Asked Questions</Link></li>
              <li><Link to="/contact" className="hover:text-[#d4af37] transition-colors">Contact Our Plantation</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-[#d4af37] transition-colors">Shipping & Delivery Policy</Link></li>
              <li><Link to="/returns-policy" className="hover:text-[#d4af37] transition-colors">Returns & Replacement</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-[#d4af37] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#d4af37] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">
              Harvest Updates
            </h3>
            <p className="text-xs text-[#d0c5af] leading-relaxed mb-3">
              Receive seasonal harvest announcements, secret Kerala family recipes, and private subscriber promotions.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-xs text-[#d4af37] bg-[#1c1b1d] p-3 rounded-lg border border-[#d4af37]/40 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
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
                    className="w-full text-xs bg-[#1c1b1d] border border-[#353437] rounded-lg px-3 py-2 text-[#e5e1e4] placeholder-[#99907c] focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 p-1 text-[#d4af37] hover:text-[#f2ca50] transition-colors cursor-pointer"
                    aria-label="Subscribe"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#99907c]">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Credits & Payments */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#99907c]">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved. Sourced sustainably from Kerala.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#99907c]">Secure Payments via</span>
            <span className="font-bold text-[#d4af37] bg-[#1c1b1d] px-2.5 py-1 rounded text-[11px] border border-[#d4af37]/30">
              UPI • Cards • NetBanking • Razorpay
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
