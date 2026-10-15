import React from 'react';
import { useStore } from '../context/StoreContext.js';
import { Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="bg-[#153E2B] text-[#F7F3E9] text-xs font-medium py-2 px-4 border-b border-[#C5A059]/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2 tracking-wide text-center sm:text-left">
          <Sparkles className="w-3.5 h-3.5 text-[#D8B26E] shrink-0 animate-pulse" />
          <span>{settings.announcementText}</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-[#E3D9C0]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D8B26E]" />
            <span>100% Single-Origin & Unadulterated</span>
          </div>
          <a 
            href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`} 
            className="flex items-center gap-1.5 hover:text-[#D8B26E] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#D8B26E]" />
            <span>{settings.supportPhone}</span>
          </a>
          <Link to="/track-order" className="hover:text-[#D8B26E] transition-colors underline decoration-[#C5A059]/40">
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
};
