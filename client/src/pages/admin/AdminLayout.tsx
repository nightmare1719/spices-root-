import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard, Package, ShoppingCart, Tag,
  Users, Settings, ArrowLeft, Shield, LogOut, Truck, CheckCircle2
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, logout, refreshUser } = useAuth();
  const location = useLocation();

  // State hydration layer to parse & validate tokens instantly when admin page mounts
  useEffect(() => {
    const token = localStorage.getItem('spiceroots_token');
    if (token) {
      refreshUser();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131315]">
        <div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Server-side + Frontend Admin protection
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131315] p-4 text-center">
        <Shield className="w-12 h-12 text-[#a94f38] mb-3" />
        <h1 className="font-editorial text-2xl font-bold text-[#e5e1e4] mb-2">
          Administrator Access Required
        </h1>
        <p className="text-xs text-[#d0c5af] max-w-sm mb-6">
          You must be logged in as an administrator to access the Spice Vault management console.
        </p>
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
          state={{ from: location }}
          className="bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Products & Stock', href: '/admin/products', icon: Package },
    { label: 'Orders & Tracking', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Discount Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Customer Base', href: '/admin/customers', icon: Users },
    { label: 'Logistics & Rates', href: '/admin/logistics', icon: Truck },
    { label: 'Store Settings', href: '/admin/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#131315] text-[#e5e1e4] flex flex-col md:flex-row">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0e0e10] text-[#e5e1e4] flex flex-col justify-between shrink-0 border-r border-[#353437]">
        <div>
          {/* Logo & Header */}
          <div className="p-6 border-b border-[#353437]">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 object-contain brightness-125" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <div>
                <span className="font-editorial text-lg font-bold tracking-tight text-[#d4af37] block">
                  THE SPICE VAULT
                </span>
                <span className="text-[10px] text-[#99907c] font-bold tracking-widest uppercase block -mt-1 font-sans">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isActive
                    ? 'bg-[#d4af37] text-[#131315] font-bold shadow-md'
                    : 'text-[#d0c5af] hover:bg-[#201f22] hover:text-[#d4af37]'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#353437] space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#d0c5af] hover:text-[#d4af37] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Public Storefront</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#a94f38] hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Top Profile Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Profile Header Bar */}
        <header className="bg-[#1c1b1d] border-b border-[#353437] px-6 sm:px-8 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#99907c] hidden sm:inline">Admin Console</span>
            <span className="text-xs text-[#353437] hidden sm:inline">/</span>
            <span className="text-xs font-bold text-[#e5e1e4] capitalize">
              {location.pathname.replace('/admin/', '').replace('/admin', '') || 'Dashboard'}
            </span>
          </div>

          {/* Hydrated Top Profile View */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#e5e1e4] leading-tight">{user?.name || 'Administrator'}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b9b7b] animate-pulse" />
                <p className="text-[10px] text-[#99907c] font-medium">{user?.email || 'admin@spiceroots.in'}</p>
                <span className="text-[9px] bg-[#0e0e10] text-[#d4af37] border border-[#4d4635] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0e0e10] text-[#d4af37] font-bold text-xs flex items-center justify-center border border-[#d4af37]/40 shadow-sm shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'Admin'} className="w-full h-full object-cover" />
              ) : (
                (user?.name || 'A').charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-10 overflow-y-auto min-w-0 bg-[#131315]">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
