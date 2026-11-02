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
        <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block font-sans">
          Join The Spice Vault
        </span>
        <h1 className="font-editorial text-3xl font-bold text-[#e5e1e4]">
          Create Customer Account
        </h1>
        <p className="text-xs text-[#d0c5af]">
          Save addresses, track your plantation shipments, and manage wishlist items.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-[#a94f38]/20 p-3.5 rounded-xl border border-[#a94f38]/30 text-xs text-[#a94f38] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-[#435b43]/20 p-3.5 rounded-xl border border-[#435b43]/30 text-xs text-[#8b9b7b] flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#8b9b7b]" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-[#1c1b1d] p-8 rounded-3xl border border-[#353437] shadow-lg space-y-6">
        {/* Google 1-Click Verified Registration Section */}
        <div className="bg-[#201f22] p-4 rounded-2xl border border-[#d4af37]/35 space-y-3">
          <div className="flex items-center gap-2 text-[#e5e1e4]">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Instant Verified Signup
            </span>
          </div>
          <p className="text-[11px] text-[#d0c5af] leading-relaxed">
            Verify and create your account instantly with your Google account. No password required!
          </p>
          <GoogleAuthButton
            mode="signup"
            enableOneTap={true}
            onSuccess={(_user, isNewUser) => {
              setSuccessMessage(
                isNewUser 
                  ? 'Account verified & created with Google! Welcome to The Spice Vault.' 
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
            <div className="w-full border-t border-[#353437]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#1c1b1d] px-3 text-[#99907c] font-semibold tracking-wider text-[11px] uppercase">
              or create with custom password
            </span>
          </div>
        </div>

        {/* Manual Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#d0c5af] mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Sharma"
                className="w-full text-xs p-3 pl-10 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder:text-[#99907c] focus:outline-hidden focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <User className="w-4 h-4 text-[#99907c] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#d0c5af] mb-1">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs p-3 pl-10 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder:text-[#99907c] focus:outline-hidden focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <Mail className="w-4 h-4 text-[#99907c] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#d0c5af] mb-1">
              Mobile Number (India +91)
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full text-xs p-3 pl-10 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder:text-[#99907c] focus:outline-hidden focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <Phone className="w-4 h-4 text-[#99907c] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#d0c5af] mb-1">
              Password (min 6 characters) *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 pl-10 bg-[#0e0e10] border border-[#353437] rounded-xl text-[#e5e1e4] placeholder:text-[#99907c] focus:outline-hidden focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <Lock className="w-4 h-4 text-[#99907c] absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#99907c]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8b9b7b]" />
            <span>Your credentials are encrypted & stored securely.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#d4af37] text-[#131315] hover:bg-[#f2ca50] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.25)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4 text-[#131315]" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#353437] text-center text-xs text-[#99907c]">
          Already registered?{' '}
          <Link 
            to={queryRedirect ? `/login?redirect=${encodeURIComponent(queryRedirect)}` : '/login'} 
            className="font-bold text-[#d4af37] hover:underline"
          >
            Sign In with Email or Google
          </Link>
        </div>
      </div>

    </div>
  );
};
