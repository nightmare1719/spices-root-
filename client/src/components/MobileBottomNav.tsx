import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const isHomeActive = path === '/';
  const isCategoriesActive = path.startsWith('/category') || path === '/shop';
  const isAccountActive = path.startsWith('/profile') || path === '/login' || path === '/register';

  const accountLink = user ? '/profile' : '/login';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#171814]/95 backdrop-blur-md border-t border-[#D0AE70]/20 shadow-[0_-2px_12px_rgba(0,0,0,0.2)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-3 h-14 max-w-md mx-auto">
        {/* Tab 1: Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 transition-colors select-none ${
            isHomeActive
              ? 'text-[#D0AE70] font-bold'
              : 'text-[#77766E] hover:text-[#F7F2E8] font-medium'
          }`}
          aria-label="Home"
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight leading-none">Home</span>
        </Link>

        {/* Tab 2: Categories */}
        <Link
          to="/shop"
          className={`flex flex-col items-center justify-center gap-1 transition-colors select-none ${
            isCategoriesActive
              ? 'text-[#D0AE70] font-bold'
              : 'text-[#77766E] hover:text-[#F7F2E8] font-medium'
          }`}
          aria-label="Categories"
        >
          <LayoutGrid className={`w-5 h-5 ${isCategoriesActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight leading-none">Categories</span>
        </Link>

        {/* Tab 3: Account */}
        <Link
          to={accountLink}
          className={`flex flex-col items-center justify-center gap-1 transition-colors select-none ${
            isAccountActive
              ? 'text-[#D0AE70] font-bold'
              : 'text-[#77766E] hover:text-[#F7F2E8] font-medium'
          }`}
          aria-label="Account"
        >
          <User className={`w-5 h-5 ${isAccountActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight leading-none">Account</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;

