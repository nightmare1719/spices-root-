import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.js';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { settings } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Product Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && message.trim()) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 6000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#D0AE70] uppercase tracking-widest block font-sans">
          Get In Touch
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#171814]">
          Contact Our Plantation Depot
        </h1>
        <p className="text-xs sm:text-sm text-[#77766E]">
          Have a question regarding bulk orders, corporate gifting, or our spice harvests? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-[#F7F2E8] p-6 rounded-2xl border border-[#E5DED0] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#171814] text-white flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#D0AE70]" />
            </div>
            <h3 className="font-editorial text-base font-bold text-[#171814]">Plantation Depot</h3>
            <p className="text-xs text-[#77766E] leading-relaxed">
              {settings.businessAddress}
            </p>
          </div>

          <div className="bg-[#F7F2E8] p-6 rounded-2xl border border-[#E5DED0] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#171814] text-white flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#D0AE70]" />
            </div>
            <h3 className="font-editorial text-base font-bold text-[#171814]">Phone & WhatsApp</h3>
            <p className="text-xs text-[#77766E]">
              <a href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`} className="hover:text-[#D0AE70] text-[#292A25] font-semibold transition-colors">
                {settings.supportPhone}
              </a>
            </p>
            <p className="text-[11px] text-[#77766E]">Monday - Saturday, 9:00 AM - 6:00 PM IST</p>
          </div>

          <div className="bg-[#F7F2E8] p-6 rounded-2xl border border-[#E5DED0] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#171814] text-white flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#D0AE70]" />
            </div>
            <h3 className="font-editorial text-base font-bold text-[#171814]">Customer Care</h3>
            <p className="text-xs text-[#77766E]">
              <a href={`mailto:${settings.supportEmail}`} className="hover:text-[#D0AE70] text-[#292A25] font-semibold transition-colors">
                {settings.supportEmail}
              </a>
            </p>
            <p className="text-[11px] text-[#77766E]">Response within 24 business hours</p>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#E5DED0] shadow-xs space-y-6">
          <h2 className="font-editorial text-xl font-bold text-[#171814] flex items-center gap-2 pb-3 border-b border-[#E5DED0]">
            <MessageSquare className="w-5 h-5 text-[#D0AE70]" />
            Send Us a Message
          </h2>

          {submitted && (
            <div className="p-4 bg-[#435B43]/10 text-[#435B43] rounded-xl border border-[#435B43]/30 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Thank you! Your inquiry has been sent to our Munnar depot. We will respond shortly.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name-input" className="block text-xs font-semibold text-[#292A25] mb-1">Your Name *</label>
                <input
                  id="contact-name-input"
                  name="name"
                  autoComplete="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meera Nair"
                  className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
                />
              </div>

              <div>
                <label htmlFor="contact-email-input" className="block text-xs font-semibold text-[#292A25] mb-1">Email Address *</label>
                <input
                  id="contact-email-input"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject-select" className="block text-xs font-semibold text-[#292A25] mb-1">Subject</label>
              <select
                id="contact-subject-select"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
              >
                <option value="Product Inquiry">Product Inquiry & Harvest Details</option>
                <option value="Order Status">Order Tracking / Dispatch Inquiry</option>
                <option value="Corporate Gifting">Corporate Hampers & Wedding Gifting</option>
                <option value="Wholesale">Wholesale & Restaurant Supply</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact-message-input" className="block text-xs font-semibold text-[#292A25] mb-1">Message *</label>
              <textarea
                id="contact-message-input"
                name="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we assist you with our spices?"
                className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-8 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>Submit Inquiry</span>
              <Send className="w-3.5 h-3.5 text-[#171814]" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
