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
        <div className="w-screen max-w-md bg-[#F7F2E8] shadow-2xl flex flex-col border-l border-[#E5DED0]">

          {/* Header */}
          <div className="p-5 border-b border-[#D0AE70]/20 flex items-center justify-between bg-[#171814] text-[#F7F2E8]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D0AE70]" />
              <h2 className="font-editorial text-xl font-bold text-[#D0AE70]">Your Spice Basket</h2>
              <span className="text-xs bg-[#D0AE70] text-[#171814] px-2 py-0.5 rounded-full font-bold">
                {cart.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={closeMiniCart}
              className="p-1.5 text-[#D8D0C0] hover:text-white rounded-full hover:bg-[#292A25] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-white p-4 border-b border-[#E5DED0]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              {cart.qualifiesForFreeShipping ? (
                <span className="text-[#435B43] flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#D0AE70]" />
                  <span>Congratulations! You qualify for <strong>free delivery</strong></span>
                </span>
              ) : (
                <span className="text-[#77766E]">
                  Add <strong className="text-[#171814]">{formatINR(cart.freeShippingRemainingPaise)}</strong> more to get <strong>free delivery</strong>
                </span>
              )}
              <span className="text-[#D0AE70] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#E5DED0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D0AE70] to-[#B99153] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-[#D0AE70]/40 mx-auto mb-3" />
                <h3 className="font-editorial text-lg text-[#171814] font-semibold mb-1">Your basket is empty</h3>
                <p className="text-xs text-[#77766E] max-w-xs mx-auto mb-6">
                  Explore our Western Ghats harvests, tellicherry peppercorns, and high-grown teas.
                </p>
                <button
                  onClick={closeMiniCart}
                  className="bg-[#D0AE70] text-[#171814] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-[#B99153] transition-all"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3 bg-white p-3 rounded-xl border border-[#E5DED0] shadow-xs hover:border-[#D0AE70] transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-18 h-18 object-cover rounded-lg bg-[#F7F2E8] shrink-0 border border-[#E5DED0]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <Link
                        to={`/product/${item.productSlug}`}
                        onClick={closeMiniCart}
                        className="text-xs font-bold text-[#171814] hover:text-[#D0AE70] line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-[#77766E] hover:text-[#A94F38] transition-colors p-0.5"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-[#77766E] font-medium mt-0.5">
                      Pack Size: <span className="text-[#292A25] font-semibold">{item.packSize}</span>
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E5DED0] rounded-lg bg-[#F7F2E8] px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="p-1 text-[#292A25] hover:text-[#D0AE70] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2 text-[#171814] min-w-[20px] text-center font-product">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 text-[#292A25] hover:text-[#D0AE70] disabled:opacity-30 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#435B43] font-product">
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
            <div className="p-5 border-t border-[#E5DED0] bg-white space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#77766E] font-medium">Estimated Subtotal:</span>
                <span className="font-product text-lg font-bold text-[#435B43]">
                  {formatINR(cart.subtotalPaise)}
                </span>
              </div>
              <p className="text-[11px] text-[#77766E]">
                Taxes, coupons, and final shipping calculated at checkout.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleViewCart}
                  className="w-full text-center py-2.5 px-3 border border-[#171814] text-[#171814] hover:bg-[#171814] hover:text-[#D0AE70] rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer"
                >
                  View Cart
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-xl text-xs font-bold tracking-wide shadow-md transition-all group cursor-pointer"
                >
                  <span>Checkout</span>
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
