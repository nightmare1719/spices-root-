import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { formatINR } from '../utils/format.js';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';

export const MiniCartDrawer: React.FC = () => {
  const { cart, isMiniCartOpen, closeMiniCart, updateQuantity, removeFromCart } = useCart();

  if (!isMiniCartOpen) return null;

  const threshold = cart.freeShippingThresholdPaise;
  const progressPercent = Math.min(100, Math.round((cart.subtotalPaise / threshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={closeMiniCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FCFAF6] shadow-2xl flex flex-col border-l border-[#EFE8D6]">
          
          {/* Header */}
          <div className="p-5 border-b border-[#EFE8D6] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#153E2B]" />
              <h2 className="font-editorial text-xl font-bold text-[#153E2B]">Your Spice Basket</h2>
              <span className="text-xs bg-[#153E2B]/10 text-[#153E2B] px-2 py-0.5 rounded-full font-bold">
                {cart.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button 
              onClick={closeMiniCart}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-[#FAF7F2] p-4 border-b border-[#EFE8D6]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              {cart.qualifiesForFreeShipping ? (
                <span className="text-[#153E2B] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Congratulations! You qualify for <strong>FREE Delivery</strong></span>
                </span>
              ) : (
                <span className="text-stone-600">
                  Add <strong className="text-[#153E2B]">{formatINR(cart.freeShippingRemainingPaise)}</strong> more to get <strong>FREE Delivery</strong>
                </span>
              )}
              <span className="text-[#C5A059] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#C5A059] to-[#153E2B] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-[#C5A059]/40 mx-auto mb-3" />
                <h3 className="font-editorial text-lg text-[#241D17] font-semibold mb-1">Your basket is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto mb-6">
                  Explore our Western Ghats harvests, tellicherry peppercorns, and high-grown teas.
                </p>
                <button
                  onClick={closeMiniCart}
                  className="bg-[#153E2B] text-[#F7F3E9] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-[#1E5138] transition-all"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div 
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3 bg-white p-3 rounded-xl border border-stone-100 shadow-2xs hover:border-[#C5A059]/30 transition-colors"
                >
                  <img 
                    src={item.image} 
                    alt={item.productName}
                    className="w-18 h-18 object-cover rounded-lg bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <Link 
                        to={`/product/${item.productSlug}`}
                        onClick={closeMiniCart}
                        className="text-xs font-bold text-[#153E2B] hover:underline line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-stone-400 hover:text-[#B85D3A] transition-colors p-0.5"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                      Pack Size: <span className="text-[#382F26] font-semibold">{item.packSize}</span>
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="p-1 text-stone-500 hover:text-black transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2 text-[#241D17] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 text-stone-500 hover:text-black disabled:opacity-30 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#153E2B]">
                          {formatINR(item.lineTotalPaise)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout CTAs */}
          {cart.items.length > 0 && (
            <div className="p-5 border-t border-[#EFE8D6] bg-white space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-600 font-medium">Estimated Subtotal:</span>
                <span className="font-editorial text-lg font-bold text-[#153E2B]">
                  {formatINR(cart.subtotalPaise)}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Taxes, coupons, and final shipping calculated at checkout.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/cart"
                  onClick={closeMiniCart}
                  className="w-full text-center py-2.5 px-3 border border-[#153E2B] text-[#153E2B] hover:bg-[#153E2B]/5 rounded-xl text-xs font-bold tracking-wide transition-colors"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={closeMiniCart}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#153E2B] text-[#F7F3E9] hover:bg-[#1E5138] rounded-xl text-xs font-bold tracking-wide shadow-md transition-all group"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
