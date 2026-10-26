import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { GoogleAuthButton } from '../components/GoogleAuthButton.js';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const queryRedirect = new URLSearchParams(location.search).get('redirect');
  const from = queryRedirect || location.state?.from?.pathname || '/';
  const redirectMessage = location.state?.message || (
    queryRedirect 
      ? (queryRedirect.includes('checkout') 
          ? 'Please sign in to proceed with your checkout & payment.' 
          : (queryRedirect.startsWith('/admin')
              ? 'Administrator authentication required.'
              : 'Please sign in to view your shopping cart.'))
      : ''
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const authenticatedUser = await login({ email: email.trim(), password });
      
      // Role-Based Access Control: Admins automatically navigate to the management console
      if (authenticatedUser?.role === 'admin') {
        const adminDestination = (queryRedirect && queryRedirect.startsWith('/admin')) 
          ? queryRedirect 
          : '/admin';
        navigate(adminDestination, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
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
          Access your past orders, delivery addresses, and account management.
        </p>
      </div>

      {/* Authentication Notice if redirected */}
      {redirectMessage && (
        <div className="bg-[#153E2B]/5 border border-[#153E2B]/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-[#153E2B] animate-in fade-in duration-200">
          <div className="p-1.5 bg-[#153E2B] text-white rounded-lg shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-bold">Authentication Required</p>
            <p className="text-stone-600 mt-0.5">{redirectMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#B85D3A]/10 p-3.5 rounded-xl border border-[#B85D3A]/30 text-xs text-[#B85D3A] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-[#EFE8D6] shadow-xs">
        {/* Secure 1-Click Google Sign-In */}
        <div className="space-y-3 mb-6">
          <GoogleAuthButton
            mode="signin"
            enableOneTap={true}
            onSuccess={(user, isNewUser) => {
              setSuccessMessage(
                isNewUser 
                  ? 'Account verified and created with Google! Redirecting...' 
                  : 'Signed in with Google! Redirecting...'
              );
              setTimeout(() => {
                // Role-Based Access Control: Route admins to admin console
                if (user?.role === 'admin') {
                  const adminDestination = (queryRedirect && queryRedirect.startsWith('/admin'))
                    ? queryRedirect
                    : '/admin';
                  navigate(adminDestination, { replace: true });
                } else {
                  navigate(from, { replace: true });
                }
              }, 600);
            }}
            onError={(err) => setErrorMessage(err)}
          />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-stone-400 font-semibold tracking-wider text-[11px] uppercase">
                or sign in with credentials
              </span>
            </div>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-username-input" className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address or Registered Phone
            </label>
            <div className="relative">
              <input
                id="login-username-input"
                name="username"
                autoComplete="username"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or 10-digit mobile"
                className="w-full text-xs p-3 pl-10 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label htmlFor="login-password-input" className="block text-xs font-semibold text-stone-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password-input"
                name="password"
                autoComplete="current-password"
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
            className="w-full py-3.5 bg-[#153E2B] text-white hover:bg-[#1E5138] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            Create Customer Account
          </Link>
        </div>
      </div>

    </div>
  );
};
