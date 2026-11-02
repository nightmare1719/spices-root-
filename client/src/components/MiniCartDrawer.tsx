import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { formatINR } from '../utils/format.js';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';

export const MiniCartDrawer: React.FC = () => {
  const { cart, isMiniCartOpen, closeMiniCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isMiniCartOpen) return null;

  const handleViewCart = () => {
    closeMiniCart();
    if (!user) {
      navigate('/login?redirect=/cart', {
        state: { message: 'Please sign in to view your shopping cart.' }
      });
    } else {
      navigate('/cart');
    }
  };

  const handleCheckout = () => {
    closeMiniCart();
    if (!user) {
      navigate('/login?redirect=/checkout', {
        state: { message: 'Please sign in to proceed to checkout and payment.' }
      });
    } else {
      navigate('/checkout');
    }
  };

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
        <div className="w-screen max-w-md bg-[#131315] text-[#e5e1e4] shadow-2xl flex flex-col border-l border-[#d4af37]/25">

          {/* Header */}
          <div className="p-5 border-b border-[#353437] flex items-center justify-between bg-[#0e0e10] text-[#e5e1e4]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
              <h2 className="font-editorial text-xl font-bold text-[#d4af37]">Vault Curations</h2>
              <span className="text-xs bg-[#d4af37] text-[#131315] px-2 py-0.5 rounded-full font-bold">
                {cart.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={closeMiniCart}
              className="p-1.5 text-[#d0c5af] hover:text-[#d4af37] rounded-full hover:bg-[#201f22] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-[#1c1b1d] p-4 border-b border-[#353437]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              {cart.qualifiesForFreeShipping ? (
                <span className="text-[#dccf96] flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Complimentary Gold-Wax Vault packaging unlocked</span>
                </span>
              ) : (
                <span className="text-[#99907c]">
                  Add <strong className="text-[#d4af37]">{formatINR(cart.freeShippingRemainingPaise)}</strong> more to unlock <strong>free delivery</strong>
                </span>
              )}
              <span className="text-[#d4af37] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#201f22] rounded-full overflow-hidden border border-[#353437]">
              <div
                className="h-full bg-gradient-to-r from-[#d4af37] to-[#f2ca50] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-[#d4af37]/40 mx-auto mb-3" />
                <h3 className="font-editorial text-lg text-[#e5e1e4] font-semibold mb-1">Your vault is empty</h3>
                <p className="text-xs text-[#99907c] max-w-xs mx-auto mb-6">
                  Explore our Western Ghats archives, Tellicherry reserves, and single-harvest teas.
                </p>
                <button
                  onClick={closeMiniCart}
                  className="bg-[#d4af37] text-[#131315] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg hover:bg-[#f2ca50] transition-all cursor-pointer font-sans"
                >
                  Explore The Archive
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3 bg-[#1c1b1d] p-3 rounded-lg border border-[#353437] shadow-xs hover:border-[#d4af37]/50 transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-18 h-18 object-cover rounded bg-[#0e0e10] shrink-0 border border-[#353437]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <Link
                        to={`/product/${item.productSlug}`}
                        onClick={closeMiniCart}
                        className="text-xs font-bold text-[#e5e1e4] hover:text-[#d4af37] line-clamp-1 font-editorial"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-[#99907c] hover:text-[#ffb4ab] transition-colors p-0.5 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-[#99907c] font-medium mt-0.5">
                      Pack Size: <span className="text-[#d0c5af] font-semibold">{item.packSize}</span>
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#353437] rounded bg-[#201f22] px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="p-1 text-[#d0c5af] hover:text-[#d4af37] transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2 text-[#e5e1e4] min-w-[20px] text-center font-sans">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 text-[#d0c5af] hover:text-[#d4af37] disabled:opacity-30 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#f2ca50] font-sans">
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
            <div className="p-5 border-t border-[#353437] bg-[#0e0e10] space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#99907c] font-medium">Cart Subtotal:</span>
                <span className="font-sans text-lg font-bold text-[#f2ca50]">
                  {formatINR(cart.subtotalPaise)}
                </span>
              </div>
              <p className="text-[11px] text-[#99907c]">
                Taxes, harvest coupons, and final courier dispatch calculated at checkout.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleViewCart}
                  className="w-full text-center py-2.5 px-3 border border-[#d4af37]/40 text-[#e5e1e4] hover:bg-[#1c1b1d] hover:text-[#f2ca50] hover:border-[#d4af37] rounded-lg text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer font-sans"
                >
                  View Basket
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] rounded-lg text-xs font-bold tracking-wider uppercase shadow-md transition-all group cursor-pointer font-sans"
                >
                  <span>Vault CHECKOUT </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
