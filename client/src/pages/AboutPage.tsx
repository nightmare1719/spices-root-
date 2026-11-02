import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.js';
import { Sparkles, Leaf, ShieldCheck, Award, HeartHandshake, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="space-y-16 pb-20">

      {/* Editorial Hero */}
      <section className="bg-[#0e0e10] text-[#e5e1e4] py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden border-b border-[#353437]">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block font-sans">
            Our Heritage & Roots
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold leading-tight text-[#e5e1e4]">
            The Story Behind The Spice Vault
          </h1>
          <p className="text-sm sm:text-base text-[#d0c5af] leading-relaxed font-light">
            Rooted in the high hills of Munnar, Idukki, and the Western Ghats, we connect centuries of spice cultivation with kitchens that revere unadulterated flavor.
          </p>
        </div>
      </section>

      {/* Main Narrative */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-xs sm:text-sm text-[#d0c5af] leading-relaxed font-light">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#e5e1e4]">
              Why Real Hill Spices Matter
            </h2>
            <p>
              In contemporary industrial markets, spices often pass through dozens of intermediaries, spending months in hot warehouses where volatile essential oils—the essence of aroma and flavor—slowly evaporate. In some cases, spent spices (those that have already had their valuable oils extracted for perfume or pharmacy) are mixed back in.
            </p>
            <p>
              <strong className="text-[#f2ca50] font-semibold">The Spice Vault (Kalaivani Spices)</strong> was founded to preserve the uncompromised authenticity of our region. Our black pepper is picked only when the berries have reached full maturity, and cured slowly on traditional bamboo mats under the Kerala sun.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden border border-[#353437] shadow-lg aspect-4/3">
            <img
              src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80"
              alt="Sun-drying peppercorns in Kerala"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[#353437]">
          <div className="bg-[#1c1b1d] p-6 rounded-2xl border border-[#353437] space-y-2">
            <Leaf className="w-6 h-6 text-[#8b9b7b]" />
            <h3 className="font-editorial text-base font-bold text-[#e5e1e4]">Shade-Grown Farming</h3>
            <p className="text-xs text-[#d0c5af] leading-relaxed">
              Our pepper vines and cardamom shrubs flourish beneath a natural canopy of silver oak and wild fig trees, creating rich biodiversity.
            </p>
          </div>

          <div className="bg-[#1c1b1d] p-6 rounded-2xl border border-[#353437] space-y-2">
            <Award className="w-6 h-6 text-[#d4af37]" />
            <h3 className="font-editorial text-base font-bold text-[#e5e1e4]">Hand-Graded Precision</h3>
            <p className="text-xs text-[#d0c5af] leading-relaxed">
              Only plump 8mm green cardamom pods and garbled Tellicherry peppercorns meet our strict reserve standards.
            </p>
          </div>

          <div className="bg-[#1c1b1d] p-6 rounded-2xl border border-[#353437] space-y-2">
            <HeartHandshake className="w-6 h-6 text-[#a94f38]" />
            <h3 className="font-editorial text-base font-bold text-[#e5e1e4]">Planter Fair Trade</h3>
            <p className="text-xs text-[#d0c5af] leading-relaxed">
              We eliminate excessive layers of middlemen, ensuring family planters receive fair, above-market compensation for premier harvests.
            </p>
          </div>
        </div>

        {/* Sourcing Promise */}
        <div className="bg-[#1c1b1d] p-8 rounded-3xl border border-[#353437] shadow-sm space-y-4">
          <h3 className="font-editorial text-xl font-bold text-[#e5e1e4]">
            Our Freshness Guarantee
          </h3>
          <p className="text-xs sm:text-sm text-[#d0c5af] leading-relaxed font-light">
            {settings.aboutStory}
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
            >
              <span>Explore The Harvest</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#131315]" />
            </Link>
          </div>
        </div>

      </section>

    </div>
  );
};
