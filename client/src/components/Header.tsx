import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { useStore } from '../context/StoreContext.js';
import {
  Search, ShoppingBag, Heart, User, X,
  ChevronDown, LogOut, Package, Shield, Settings as SettingsIcon
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, openMiniCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { settings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
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
    <header className="sticky top-0 z-40 bg-[#171814] text-[#F7F2E8] border-b border-[#D0AE70]/20 shadow-md">
      
      {/* =========================================================================
          COMPONENT 1: MOBILE STICKY TOP HEADER & NAVIGATION BAR (<= 768px / <= 480px)
          Meesho Mobile App Inspired Clean 2-Row Layout
         ========================================================================= */}
      <div className="md:hidden px-4 pt-2.5 pb-2.5 space-y-2">
        {/* Row 1: Header Actions (Logo on Left, Wishlist & Cart on Right) */}
        <div className="flex items-center justify-between h-11">
          {/* Left: Company Logo (Spice Roots) clean and vertically aligned */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/images/logo.png"
              alt={settings.storeName}
              className="h-8 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col justify-center">
              <span className="font-editorial text-lg font-bold tracking-tight text-[#D0AE70] leading-none">
                {settings.storeName.toUpperCase()}
              </span>
              <span className="text-[8px] tracking-widest text-[#D8D0C0] uppercase font-bold mt-0.5">
                Western Ghats • Kerala
              </span>
            </div>
          </Link>

          {/* Right: Two action icons spaced evenly: Wishlist (Heart) and Cart (Shopping Bag) */}
          <div className="flex items-center gap-4">
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-1 text-[#F7F2E8] hover:text-[#D0AE70] transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#A94F38] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <button
              onClick={openMiniCart}
              className="p-1 text-[#F7F2E8] hover:text-[#D0AE70] transition-colors relative cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#D0AE70]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#D0AE70] text-[#171814] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Search Container (Full-width clean search bar, no overlap bugs) */}
        <div className="w-full">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative flex items-center w-full">
              <Search className="w-4 h-4 absolute left-3 text-[#77766E] pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tellicherry pepper, cardamom, teas..."
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-[#E5DED0] rounded-xl text-[#292A25] placeholder-[#77766E] focus:outline-none focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70] shadow-xs"
                autoComplete="off"
                autoCapitalize="off"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-[#77766E] hover:text-[#292A25] cursor-pointer"
                  aria-label="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP HEADER CONTAINER (>= md screens)
         ========================================================================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/images/logo.png"
              alt={settings.storeName}
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-editorial text-2xl font-bold tracking-tight text-[#D0AE70]">
                {settings.storeName.toUpperCase()}
              </span>
              <span className="text-[10px] tracking-widest text-[#D8D0C0] uppercase font-semibold -mt-1">
                Western Ghats • Kerala
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-6 xl:space-x-7">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm tracking-wide transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-[#D0AE70] after:transition-all after:duration-300 ${
                    isActive
                      ? 'text-[#D0AE70] font-semibold after:w-full'
                      : 'text-[#F7F2E8] font-medium hover:text-[#D0AE70] after:w-0 hover:after:w-full'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Desktop Search Trigger */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Tellicherry pepper, cardamom..."
                    autoFocus
                    className="w-48 sm:w-64 pl-3 pr-8 py-1.5 text-sm bg-white text-[#292A25] placeholder-[#77766E] border border-[#D0AE70] rounded-full focus:outline-none focus:ring-1 focus:ring-[#D0AE70]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-2 text-[#77766E] hover:text-[#292A25]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-[#F7F2E8] hover:text-[#D0AE70] hover:bg-[#292A25] rounded-full transition-colors"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="p-2 text-[#F7F2E8] hover:text-[#D0AE70] hover:bg-[#292A25] rounded-full transition-colors relative"
              aria-label="View wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#A94F38] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account Dropdown */}
            <div className="relative user-account-action flex items-center">
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="p-1.5 md:px-2.5 md:py-1.5 text-[#F7F2E8] hover:text-[#D0AE70] hover:bg-[#292A25] rounded-full transition-colors flex items-center gap-1.5"
                aria-label="User Account Sign In or Profile"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#D0AE70]"
                  />
                ) : (
                  <User className="w-5 h-5 text-[#F7F2E8]" />
                )}
                {user ? (
                  <span className="hidden md:inline text-xs font-semibold max-w-[80px] truncate text-[#F7F2E8]">{user.name.split(' ')[0]}</span>
                ) : (
                  <span className="hidden sm:inline text-xs font-semibold text-[#D0AE70]">Sign In</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 hidden md:inline text-[#D8D0C0]" />
              </button>

              {isAccountMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-[#E5DED0] rounded-xl shadow-xl py-2 z-50 text-sm text-[#292A25]"
                  onMouseLeave={() => setIsAccountMenuOpen(false)}
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-[#E5DED0]">
                        <p className="font-semibold text-[#171814]">{user.name}</p>
                        <p className="text-xs text-[#77766E] truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[#171814] bg-[#F7F2E8] font-semibold hover:bg-[#D0AE70]/20 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#D0AE70]" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#292A25] hover:bg-[#F7F2E8] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#77766E]" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/profile?tab=orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#292A25] hover:bg-[#F7F2E8] transition-colors"
                      >
                        <Package className="w-4 h-4 text-[#77766E]" />
                        <span>My Orders</span>
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setIsAccountMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-[#A94F38] hover:bg-[#F7F2E8] text-left transition-colors border-t border-[#E5DED0] mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs text-[#77766E] border-b border-[#E5DED0]">
                        Welcome to Spice Roots
                      </div>
                      <Link
                        to="/login"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-4 py-2 text-[#171814] font-semibold hover:bg-[#F7F2E8] transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-4 py-2 text-[#D0AE70] font-semibold hover:bg-[#F7F2E8] transition-colors"
                      >
                        Sign Up / Register
                      </Link>
                      <Link
                        to="/track-order"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block px-4 py-2 text-[#77766E] hover:bg-[#F7F2E8] transition-colors text-xs"
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
              className="flex items-center gap-2 bg-[#D0AE70] text-[#171814] px-3.5 py-2 rounded-full hover:bg-[#B99153] transition-all shadow-sm hover:shadow-md group font-semibold"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#171814] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold tracking-wider">{totalItems}</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
