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
              <Bot className="w-5 h-5 text-[#D0AE70] group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D0AE70] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D0AE70] rounded-full" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold tracking-wide text-[#D0AE70]">Spice Roots AI</p>
              <p className="text-[10px] text-[#D8D0C0] -mt-0.5">Culinary Assistant</p>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-2 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[560px] max-h-[80vh] bg-[#F7F2E8] rounded-2xl shadow-2xl border border-[#E5DED0] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-[#171814] text-[#F7F2E8] p-4 flex items-center justify-between border-b border-[#D0AE70]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#292A25] border border-[#D0AE70]/40 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-[#D0AE70]" />
              </div>
              <div>
                <h3 className="font-editorial text-base font-bold text-[#D0AE70] flex items-center gap-1.5">
                  <span>Spice Roots Concierge</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#D0AE70]" />
                </h3>
                <p className="text-[11px] text-[#D8D0C0] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#435B43] rounded-full inline-block" />
                  Western Ghats Catalog Assistant
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-[#D8D0C0] hover:text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F2E8]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#171814] text-[#D0AE70] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#171814] text-[#F7F2E8] rounded-br-xs'
                        : 'bg-white text-[#292A25] border border-[#E5DED0] rounded-bl-xs shadow-xs'
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
                      <p className="text-[11px] font-bold text-[#171814] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D0AE70]" />
                        Recommended from Our Catalog:
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.recommendedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="bg-white p-2.5 rounded-xl border border-[#E5DED0] flex items-center gap-3 shadow-xs hover:border-[#D0AE70] transition-all"
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-14 h-14 object-cover rounded-lg bg-[#F7F2E8] shrink-0 border border-[#E5DED0]"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-[#171814] truncate font-product">{prod.name}</h4>
                              <p className="text-[11px] text-[#77766E]">
                                {prod.packSize} • <strong className="text-[#435B43] font-product">{formatINR(prod.pricePaise)}</strong>
                              </p>
                              
                              <div className="flex items-center gap-2 mt-1.5">
                                <Link
                                  to={`/product/${prod.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="text-[10px] font-semibold text-[#D0AE70] hover:underline flex items-center gap-0.5"
                                >
                                  <span>View</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </Link>

                                <button
                                  onClick={() => handleQuickAdd(prod)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                                    addedIds[prod.id]
                                      ? 'bg-[#435B43] text-white'
                                      : 'bg-[#D0AE70] text-[#171814] hover:bg-[#B99153]'
                                  }`}
                                >
                                  {addedIds[prod.id] ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-3 h-3 text-[#171814]" />
                                      <span>Add to Cart</span>
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
                          className="text-[11px] bg-white border border-[#E5DED0] text-[#292A25] hover:border-[#D0AE70] hover:text-[#D0AE70] px-2.5 py-1 rounded-full transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-[#77766E] mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-[#D0AE70] text-[#171814] flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-[#77766E] text-xs py-2 px-3 bg-white rounded-xl border border-[#E5DED0] w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D0AE70]" />
                <span>Checking plantation catalog...</span>
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
            className="p-3 bg-white border-t border-[#E5DED0] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about spices, biryani, tea, or gifts..."
              className="flex-1 text-xs sm:text-sm bg-[#F7F2E8] border border-[#E5DED0] text-[#292A25] rounded-full px-4 py-2 focus:outline-none focus:border-[#D0AE70]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-[#D0AE70] text-[#171814] rounded-full hover:bg-[#B99153] disabled:opacity-40 transition-colors shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-[#171814]" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
