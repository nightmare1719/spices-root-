import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const queryRedirect = new URLSearchParams(location.search).get('redirect');
  const from = queryRedirect || location.state?.from?.pathname || '/';
  const redirectMessage = location.state?.message || (queryRedirect ? (queryRedirect.includes('checkout') ? 'Please sign in to proceed with your checkout & payment.' : 'Please sign in to view your shopping cart.') : '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage((err as Error).message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (role: 'customer' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@spiceroots.in');
      setPassword('AdminPassword123!');
    } else {
      setEmail('customer@spiceroots.in');
      setPassword('Customer123!');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block">
          Welcome to Spice Roots
        </span>
        <h1 className="font-editorial text-3xl font-bold text-[#153E2B]">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-stone-500">
          Access your past orders, saved delivery addresses, and wishlist.
        </p>
      </div>

      {/* Authentication Guard Notice */}
      {redirectMessage && (
        <div className="bg-[#153E2B]/5 border border-[#153E2B]/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-[#153E2B] animate-in fade-in duration-200">
          <div className="p-1.5 bg-[#153E2B] text-white rounded-lg shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-bold">Authentication Required</p>
            <p className="text-stone-600 mt-0.5">{redirectMessage}</p>
            <p className="text-[11px] text-[#C5A059] font-semibold mt-1">
              Tip: Click "Customer Demo" below to auto-fill credentials instantly!
            </p>
          </div>
        </div>
      )}

      {/* Demo Credentials Quick-Fill Banner */}
      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#C5A059]/40 space-y-2 text-xs">
        <span className="font-bold text-[#153E2B] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          Instant Demo Account Access:
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('customer')}
            className="flex-1 py-1.5 px-2 bg-white text-[#153E2B] border border-stone-200 rounded-lg font-semibold hover:border-[#153E2B] transition-colors"
          >
            Customer Demo
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="flex-1 py-1.5 px-2 bg-[#153E2B] text-white rounded-lg font-semibold hover:bg-[#1E5138] transition-colors"
          >
            Admin Demo
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-[#B85D3A]/10 p-3.5 rounded-xl border border-[#B85D3A]/30 text-xs text-[#B85D3A] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-[#EFE8D6] shadow-xs">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs p-3 pl-10 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 pl-10 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#153E2B] text-white hover:bg-[#1E5138] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 text-[#D8B26E]" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center text-xs text-stone-500">
          Don't have an account yet?{' '}
          <Link 
            to={queryRedirect ? `/register?redirect=${encodeURIComponent(queryRedirect)}` : '/register'} 
            className="font-bold text-[#153E2B] hover:underline"
          >
            Register Here
          </Link>
        </div>
      </div>

    </div>
  );
};
