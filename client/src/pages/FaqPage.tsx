import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Sparkles, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Sourcing & Authenticity',
    question: 'Where are Spice Roots spices sourced from?',
    answer: 'All our whole spices, cardamom, black pepper, and high-grown teas originate directly from certified plantations across Idukki, Munnar, Vandanmedu, and Wayanad in Kerala. We work directly with generational planter estates without intermediaries.'
  },
  {
    category: 'Sourcing & Authenticity',
    question: 'Are your spices irradiated or chemically treated?',
    answer: 'No. Our spices are 100% natural and non-irradiated. They are naturally sun-cured on woven bamboo mats and sorted by experienced estate sorters to preserve natural volatile essential oils and therapeutic botanical compounds.'
  },
  {
    category: 'Quality & Freshness',
    question: 'How do you guarantee the aroma and potency of the spices?',
    answer: 'Unlike supermarket spices that may sit on warehouse shelves for over a year, our batches are sealed in food-grade, moisture-barrier pouches and tin/glass caskets right at our Munnar depot within 48 hours of lot grading.'
  },
  {
    category: 'Quality & Freshness',
    question: 'What is the shelf life of whole spices versus masalas?',
    answer: 'Whole spices (cardamom pods, black peppercorns, cloves, star anise) retain their peak essential oil potency for 12 to 18 months when stored in airtight containers away from heat and direct sunlight. Stone-ground masalas are best enjoyed within 4 to 6 months for maximum aromatic intensity.'
  },
  {
    category: 'Shipping & Delivery',
    question: 'How long does delivery take across India?',
    answer: 'Orders are dispatched within 24 to 48 business hours from our Munnar depot via Blue Dart, DTDC, and India Post Speed Post. Delivery generally takes 3 to 6 business days depending on your delivery PIN code.'
  },
  {
    category: 'Shipping & Delivery',
    question: 'How do I qualify for Free Shipping?',
    answer: 'Any domestic order across India we have delevery partner , the shipping charges is calcuated with weight and distance of your locations.'
  },
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'Now  we accpect Gpay, PhonePe, UPI Only , later we will intergrate razorpay payments gateway , all cards and international payments '
  },
  {
    category: 'Gifting & Wholesale',
    question: 'Can I order custom spice gift boxes for weddings or corporate events?',
    answer: 'Yes! Our Western Ghats Spice Discovery Caskets can be custom engraved or bundled for corporate celebrations, festival hampers, and weddings. Please reach out to uniquestorm11@gmail.com or call our depot at +91 91885 70191.'
  }
];

export const FaqPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndexes, setOpenIndexes] = useState<number[]>([0, 1]);

  const toggleIndex = (idx: number) => {
    setOpenIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const filteredFaqs = FAQS.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-[#D0AE70] uppercase tracking-widest block font-sans">
          Knowledge Base
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#171814]">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-[#77766E] max-w-lg mx-auto">
          Everything you need to know about our Kerala harvests, freshness sealing, pan-India delivery, and storage.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-lg mx-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions (e.g. shipping, shelf life, pepper, cardamom)..."
          className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white border border-[#E5DED0] rounded-full text-[#292A25] placeholder:text-[#77766E] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70] shadow-2xs"
        />
        <Search className="w-4 h-4 text-[#77766E] absolute left-3.5 top-3.5" />
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E5DED0]">
            <p className="text-xs text-[#77766E]">No questions matched your search query.</p>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndexes.includes(idx);
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E5DED0] overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  onClick={() => toggleIndex(idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-[#F7F2E8] transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D0AE70] block mb-1 font-sans">
                      {faq.category}
                    </span>
                    <h3 className="font-editorial text-base font-bold text-[#171814]">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="p-1.5 rounded-full bg-[#F7F2E8] text-[#171814] shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#292A25] leading-relaxed border-t border-[#E5DED0] pt-3 font-light">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
