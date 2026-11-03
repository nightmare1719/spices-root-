import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.js';
import { formatINR } from '../utils/format.js';
import {
  MessageSquare, X, Send, Sparkles, Bot, User,
  ShoppingBag, ArrowRight, Check, RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  recommendedProducts?: {
    id: string;
    name: string;
    slug: string;
    packSize: string;
    pricePaise: number;
    image: string;
    category: string;
  }[];
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const AiAssistantWidget: React.FC = () => {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      text: "Namaste! I am your **Spice Roots Concierge** 🌿. Sourced directly from Kerala & the Western Ghats, I can help you select authentic spices, recommend blends for biryani, find soothing teas, or curate festive gift boxes. How may I assist your culinary journey today?",
      suggestedFollowUps: [
        'Recommend an evening tea',
        'Accepted payment options',
        'Find spices for biryani',
        'Which pepper should I buy?',
        'Show products under ₹500',
        'How do I store whole spices?'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      const res = await api.sendAssistantMessage(text.trim(), history);

      if (res.success && res.data) {
        const assistantMsg: ChatMessage = {
          id: 'asst_' + Date.now(),
          role: 'assistant',
          text: res.data.message,
          recommendedProducts: res.data.recommendedProducts,
          suggestedFollowUps: res.data.suggestedFollowUps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          text: "I apologize, but I encountered a momentary connection issue with our plantation catalog. Please feel free to ask again or browse our collection directly.",
          suggestedFollowUps: ['Show all spices', 'Best selling teas'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async (product: any) => {
    try {
      // Find default variant or first variant
      const details = await api.getProductBySlug(product.slug);
      const prod = details.data?.product;
      const variantId = prod?.variants[0]?.id || 'v_default';
      await addToCart(product.id, variantId, 1);
      setAddedIds(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [product.id]: false }));
      }, 2500);
    } catch {
      alert('Could not add item to basket');
    }
  };

  return (
    <div className="ai-assistant-widget-container">
      {/* Floating Trigger Button (Positioned above MobileBottomNav on mobile) */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-[#171814] text-[#F7F2E8] px-4 py-3 rounded-full shadow-2xl hover:bg-[#292A25] hover:scale-105 transition-all duration-300 border border-[#D0AE70]/40 group"
            aria-label="Open AI Spice Assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-[#d4af37] group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#d4af37] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#d4af37] rounded-full" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold tracking-wide text-[#d4af37]">Spice Roots AI</p>
              <p className="text-[10px] text-[#d0c5af] -mt-0.5">Vault Sommelier</p>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-2 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[560px] max-h-[80vh] bg-[#131315] rounded-2xl shadow-2xl border border-[#d4af37]/35 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">

          {/* Header */}
          <div className="bg-[#0e0e10] text-[#e5e1e4] p-4 flex items-center justify-between border-b border-[#353437]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1c1b1d] border border-[#d4af37]/40 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                <img
                  src="/images/logo.png"
                  alt="Spice Roots Logo"
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-editorial text-base font-bold text-[#d4af37] flex items-center gap-1.5">
                  <span>Vault Sommelier Advisor</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                </h3>
                <p className="text-[11px] text-[#d0c5af] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#435b43] rounded-full inline-block" />
                  Terroir & Botanical Pairing Engine
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-[#d0c5af] hover:text-[#d4af37] rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#131315]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#1c1b1d] border border-[#d4af37]/30 text-[#d4af37] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${msg.role === 'user'
                        ? 'bg-[#d4af37] text-[#131315] font-medium rounded-br-xs'
                        : 'bg-[#1c1b1d] text-[#e5e1e4] border border-[#353437] rounded-bl-xs shadow-xs'
                      }`}
                  >
                    <div
                      className="whitespace-pre-line"
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </div>

                  {/* Product Recommendations Cards */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="w-full mt-2.5 space-y-2">
                      <p className="text-[11px] font-bold text-[#d4af37] flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-[#d4af37]" />
                        Vault Curations Selected:
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.recommendedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="bg-[#1c1b1d] p-2.5 rounded-xl border border-[#353437] flex items-center gap-3 shadow-xs hover:border-[#d4af37]/50 transition-all"
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-14 h-14 object-cover rounded-lg bg-[#0e0e10] shrink-0 border border-[#353437]"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-[#e5e1e4] truncate font-editorial">{prod.name}</h4>
                              <p className="text-[11px] text-[#99907c]">
                                {prod.packSize} • <strong className="text-[#f2ca50] font-sans">{formatINR(prod.pricePaise)}</strong>
                              </p>

                              <div className="flex items-center gap-2 mt-1.5">
                                <Link
                                  to={`/product/${prod.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="text-[10px] font-semibold text-[#d4af37] hover:underline flex items-center gap-0.5"
                                >
                                  <span>View</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </Link>

                                <button
                                  onClick={() => handleQuickAdd(prod)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${addedIds[prod.id]
                                      ? 'bg-[#435b43] text-white'
                                      : 'bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50]'
                                    }`}
                                >
                                  {addedIds[prod.id] ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-3 h-3 text-[#131315]" />
                                      <span>Acquire</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up chips */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {msg.suggestedFollowUps.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip)}
                          className="text-[11px] bg-[#1c1b1d] border border-[#353437] text-[#d0c5af] hover:border-[#d4af37] hover:text-[#f2ca50] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-[#99907c] mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-[#d4af37] text-[#131315] flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-[#d0c5af] text-xs py-2 px-3 bg-[#1c1b1d] rounded-xl border border-[#353437] w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
                <span>Consulting vault sommelier records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0e0e10] border-t border-[#353437] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about terroirs, Tellicherry pepper, saffron, blends..."
              className="flex-1 text-xs sm:text-sm bg-[#1c1b1d] border border-[#353437] text-[#e5e1e4] placeholder-[#99907c] rounded-full px-4 py-2 focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-[#d4af37] text-[#131315] rounded-full hover:bg-[#f2ca50] disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-[#131315]" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
