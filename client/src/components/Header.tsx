import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { useStore } from '../context/StoreContext.js';
import { 
  Search, ShoppingBag, Heart, User, Menu, X, 
  ChevronDown, LogOut, Package, Shield, Settings as SettingsIcon 
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, openMiniCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { settings } = useStore();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Shop All', href: '/shop' },
    { label: 'Whole Spices', href: '/category/spices' },
    { label: 'Masala Blends', href: '/category/masalas' },
    { label: 'Munnar Tea', href: '/category/tea' },
    { label: 'Essential Oils', href: '/category/essential_oils' },
    { label: 'Gift Boxes', href: '/category/gift_boxes' },
    { label: 'Chocolates', href: '/category/chocolates' },
    { label: 'Our Story', href: '/about' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FCFAF6]/95 backdrop-blur-md border-b border-[#EFE8D6] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#241D17] hover:text-[#153E2B] focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img 
              src="/images/logo.png" 
              alt={settings.storeName}
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // If logo fails, keep text visible
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-editorial text-2xl font-bold tracking-tight text-[#153E2B]">
                {settings.storeName.toUpperCase()}
              </span>
              <span className="text-[10px] tracking-widest text-[#C5A059] uppercase font-semibold -mt-1">
                Western Ghats • Kerala
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-[#382F26] hover:text-[#153E2B] tracking-wide transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C5A059] hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Search Trigger */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Tellicherry pepper, cardamom..."
                    autoFocus
                    className="w-48 sm:w-64 pl-3 pr-8 py-1.5 text-sm bg-white border border-[#C5A059] rounded-full focus:outline-hidden focus:ring-1 focus:ring-[#153E2B]"
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-[#382F26] hover:text-[#153E2B] hover:bg-[#F4EFE6] rounded-full transition-colors"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="p-2 text-[#382F26] hover:text-[#B85D3A] hover:bg-[#F4EFE6] rounded-full transition-colors relative"
              aria-label="View wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#B85D3A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account Dropdown & Mobile Action */}
            <div className="relative user-account-action flex items-center">
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="p-1.5 md:px-2.5 md:py-1.5 text-[#382F26] hover:text-[#153E2B] hover:bg-[#F4EFE6] rounded-full transition-colors flex items-center gap-1.5"
                aria-label="User Account Sign In or Profile"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#C5A059]"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                {user ? (
                  <span className="hidden md:inline text-xs font-semibold max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                ) : (
                  <span className="hidden sm:inline text-xs font-semibold text-[#153E2B]">Sign In</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 hidden md:inline text-stone-500" />
              </button>

              {isAccountMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white border border-[#EFE8D6] rounded-xl shadow-xl py-2 z-50 text-sm"
                  onMouseLeave={() => setIsAccountMenuOpen(false)}
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="font-semibold text-[#153E2B]">{user.name}</p>
                        <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[#153E2B] bg-[#153E2B]/5 font-semibold hover:bg-[#153E2B]/10 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#C5A059]" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#382F26] hover:bg-[#FAF7F2] transition-colors"
                      >
                        <User className="w-4 h-4 text-stone-500" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/profile?tab=orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#382F26] hover:bg-[#FAF7F2] transition-colors"
                      >
                        <Package className="w-4 h-4 text-stone-500" />
                        <span>My Orders</span>
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setIsAccountMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-[#B85D3A] hover:bg-[#FAF7F2] text-left transition-colors border-t border-stone-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs text-stone-500 border-b border-stone-100">
                        Welcome to Spice Roots
                      </div>
                      <Link
                        to="/login"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-4 py-2 text-[#153E2B] font-semibold hover:bg-[#FAF7F2] transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-4 py-2 text-[#C5A059] font-semibold hover:bg-[#FAF7F2] transition-colors"
                      >
                        Sign Up / Register
                      </Link>
                      <Link
                        to="/track-order"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-4 py-2 text-stone-700 hover:bg-[#FAF7F2] transition-colors text-xs"
                      >
                        Track Guest Order
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart Trigger */}
            <button
              onClick={openMiniCart}
              className="flex items-center gap-2 bg-[#153E2B] text-[#F7F3E9] px-3.5 py-2 rounded-full hover:bg-[#1E5138] transition-all shadow-xs hover:shadow-md group"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#D8B26E] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold tracking-wider">{totalItems}</span>
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#FCFAF6] border-b border-[#EFE8D6] px-4 pt-2 pb-6 space-y-3">
          {/* Mobile Account Access Section */}
          <div className="p-3 bg-white rounded-xl border border-[#EFE8D6] mb-3 user-account-mobile">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#153E2B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#153E2B] truncate">{user.name}</p>
                    <p className="text-[10px] text-stone-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-bold text-[#C5A059] hover:underline shrink-0"
                >
                  My Profile →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 py-2 px-3 bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider text-center rounded-lg hover:bg-[#1E5138] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 py-2 px-3 bg-[#FAF7F2] border border-[#C5A059] text-[#153E2B] text-xs font-bold uppercase tracking-wider text-center rounded-lg hover:bg-[#F4EFE6] transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tellicherry pepper, cardamom..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#EFE8D6] rounded-lg focus:outline-hidden focus:border-[#C5A059]"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            </div>
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#382F26] hover:text-[#153E2B] border-b border-stone-100"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/track-order"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xs font-semibold text-[#C5A059] hover:underline"
            >
              Track Guest Order →
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-bold text-[#153E2B] bg-[#153E2B]/10 p-2 rounded-md"
              >
                Go to Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
