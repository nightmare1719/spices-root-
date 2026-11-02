import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { GoogleAuthButton } from '../components/GoogleAuthButton.js';
import { Lock, Mail, User, Phone, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryRedirect = new URLSearchParams(location.search).get('redirect');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined
      });
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate(queryRedirect || '/', { replace: true });
      }, 600);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-[#D0AE70] uppercase tracking-widest block font-sans">
          Join Spice Roots
        </span>
        <h1 className="font-editorial text-3xl font-bold text-[#171814]">
          Create Customer Account
        </h1>
        <p className="text-xs text-[#77766E]">
          Save addresses, track your plantation shipments, and manage wishlist items.
        </p>
      </div>

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

      <div className="bg-white p-8 rounded-3xl border border-[#E5DED0] shadow-xs space-y-6">
        {/* Google 1-Click Verified Registration Section */}
        <div className="bg-[#F7F2E8] p-4 rounded-2xl border border-[#D0AE70]/40 space-y-3">
          <div className="flex items-center gap-2 text-[#171814]">
            <Sparkles className="w-4 h-4 text-[#D0AE70]" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Instant Verified Signup
            </span>
          </div>
          <p className="text-[11px] text-[#77766E] leading-relaxed">
            Verify and create your account instantly with your Google account. No password required!
          </p>
          <GoogleAuthButton
            mode="signup"
            enableOneTap={true}
            onSuccess={(_user, isNewUser) => {
              setSuccessMessage(
                isNewUser 
                  ? 'Account verified & created with Google! Welcome to Spice Roots.' 
                  : 'Welcome back! Signed in with Google.'
              );
              setTimeout(() => {
                navigate(queryRedirect || '/', { replace: true });
              }, 600);
            }}
            onError={(err) => setErrorMessage(err)}
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5DED0]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-[#77766E] font-semibold tracking-wider text-[11px] uppercase">
              or create with custom password
            </span>
          </div>
        </div>

        {/* Manual Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#292A25] mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Sharma"
                className="w-full text-xs p-3 pl-10 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] placeholder:text-[#77766E] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
              />
              <User className="w-4 h-4 text-[#77766E] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#292A25] mb-1">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs p-3 pl-10 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] placeholder:text-[#77766E] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
              />
              <Mail className="w-4 h-4 text-[#77766E] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#292A25] mb-1">
              Mobile Number (India +91)
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full text-xs p-3 pl-10 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] placeholder:text-[#77766E] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
              />
              <Phone className="w-4 h-4 text-[#77766E] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#292A25] mb-1">
              Password (min 6 characters) *
            </label>
            <div className="relative">
              <input
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

          <div className="flex items-center gap-2 text-[11px] text-[#77766E]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#435B43]" />
            <span>Your credentials are encrypted & stored securely.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm hover:shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4 text-[#171814]" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#E5DED0] text-center text-xs text-[#77766E]">
          Already registered?{' '}
          <Link 
            to={queryRedirect ? `/login?redirect=${encodeURIComponent(queryRedirect)}` : '/login'} 
            className="font-bold text-[#171814] hover:text-[#D0AE70] hover:underline"
          >
            Sign In with Email or Google
          </Link>
        </div>
      </div>

    </div>
  );
};
