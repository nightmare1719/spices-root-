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
        <span className="text-xs font-bold text-[#D0AE70] uppercase tracking-widest block font-sans">
          Welcome to Spice Roots
        </span>
        <h1 className="font-editorial text-3xl font-bold text-[#171814]">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-[#77766E]">
          Access your past orders, delivery addresses, and account management.
        </p>
      </div>

      {/* Authentication Notice if redirected */}
      {redirectMessage && (
        <div className="bg-[#171814]/5 border border-[#171814]/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-[#171814] animate-in fade-in duration-200">
          <div className="p-1.5 bg-[#171814] text-[#D0AE70] rounded-lg shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-bold text-[#171814]">Authentication Required</p>
            <p className="text-[#77766E] mt-0.5">{redirectMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#A94F38]/10 p-3.5 rounded-xl border border-[#A94F38]/30 text-xs text-[#A94F38] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-[#435B43]/10 p-3.5 rounded-xl border border-[#435B43]/30 text-xs text-[#435B43] flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#435B43]" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-[#E5DED0] shadow-xs">
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
              <div className="w-full border-t border-[#E5DED0]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#77766E] font-semibold tracking-wider text-[11px] uppercase">
                or sign in with credentials
              </span>
            </div>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-username-input" className="block text-xs font-semibold text-[#292A25] mb-1">
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
                className="w-full text-xs p-3 pl-10 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] placeholder:text-[#77766E] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
              />
              <Mail className="w-4 h-4 text-[#77766E] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label htmlFor="login-password-input" className="block text-xs font-semibold text-[#292A25] mb-1">
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
                className="w-full text-xs p-3 pl-10 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] placeholder:text-[#77766E] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
              />
              <Lock className="w-4 h-4 text-[#77766E] absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm hover:shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 text-[#171814]" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E5DED0] text-center text-xs text-[#77766E]">
          Don't have an account yet?{' '}
          <Link 
            to={queryRedirect ? `/register?redirect=${encodeURIComponent(queryRedirect)}` : '/register'} 
            className="font-bold text-[#171814] hover:text-[#D0AE70] hover:underline"
          >
            Create Customer Account
          </Link>
        </div>
      </div>

    </div>
  );
};
