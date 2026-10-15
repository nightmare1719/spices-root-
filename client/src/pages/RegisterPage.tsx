import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, User, Phone, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined
      });
      navigate('/');
    } catch (err) {
      setErrorMessage((err as Error).message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest block">
          Join Spice Roots
        </span>
        <h1 className="font-editorial text-3xl font-bold text-[#153E2B]">
          Create Customer Account
        </h1>
        <p className="text-xs text-stone-500">
          Save addresses, track your plantation shipments, and manage wishlist items.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-[#B85D3A]/10 p-3.5 rounded-xl border border-[#B85D3A]/30 text-xs text-[#B85D3A] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-[#EFE8D6] shadow-xs">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Sharma"
                className="w-full text-xs p-3 pl-10 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address *
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
              Mobile Number (India +91)
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full text-xs p-3 pl-10 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Password (min 6 characters) *
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
            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4 text-[#D8B26E]" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center text-xs text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#153E2B] hover:underline">
            Sign In
          </Link>
        </div>
      </div>

    </div>
  );
};
