import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { 
  LayoutDashboard, Package, ShoppingCart, Tag, 
  Users, Settings, ArrowLeft, Shield, LogOut, Truck 
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-8 h-8 border-4 border-[#153E2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Server-side + Frontend Admin protection
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] p-4 text-center">
        <Shield className="w-12 h-12 text-[#B85D3A] mb-3" />
        <h1 className="font-editorial text-2xl font-bold text-[#153E2B] mb-2">
          Administrator Access Required
        </h1>
        <p className="text-xs text-stone-500 max-w-sm mb-6">
          You must be logged in as an administrator to access the Spice Roots management console.
        </p>
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
          state={{ from: location }}
          className="bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full"
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
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#153E2B] text-white flex flex-col justify-between shrink-0 border-r border-[#1E5138]">
        <div>
          {/* Logo & Header */}
          <div className="p-6 border-b border-[#1E5138]">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/images/logo.png" alt="Logo" className="w-8 h-8 object-contain brightness-125" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <div>
                <span className="font-editorial text-lg font-bold tracking-tight text-white block">
                  SPICE ROOTS
                </span>
                <span className="text-[10px] text-[#D8B26E] font-bold tracking-widest uppercase block -mt-1">
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#C5A059] text-[#0F2E20] font-bold shadow-xs'
                      : 'text-[#E3D9C0] hover:bg-[#1E5138] hover:text-white'
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
        <div className="p-4 border-t border-[#1E5138] space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#E3D9C0] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Public Storefront</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#B85D3A] hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};
