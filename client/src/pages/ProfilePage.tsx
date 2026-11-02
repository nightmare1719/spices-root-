import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { IOrder, IUserAddress } from '../types/index.js';
import { formatINR, formatDateTime } from '../utils/format.js';
import {
  User, Package, MapPin, KeyRound, Shield,
  Trash2, Plus, CheckCircle2, Clock, Truck, Sparkles,
  X, ExternalLink, ArrowRight
} from 'lucide-react';
import { GoogleAuthButton } from '../components/GoogleAuthButton.js';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Address Form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<IUserAddress>({
    name: user?.name || '',
    phone: user?.phone || '',
    addressLine: '',
    landmark: '',
    city: '',
    state: 'Kerala',
    pincode: '',
    isDefault: false
  });

  // Password state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', isError: false });
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      async function loadOrders() {
        setIsLoadingOrders(true);
        try {
          const res = await api.getMyOrders();
          if (res.success && res.data) {
            setOrders(res.data);
          }
        } catch (err) {
          console.warn('Failed to load orders:', err);
        } finally {
          setIsLoadingOrders(false);
        }
      }
      loadOrders();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess('');
    try {
      await api.updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshUser();
      setProfileSuccess('Profile details updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      alert((err as Error).message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.addressLine || !newAddr.city || !newAddr.pincode) return;

    try {
      const existing = user?.addresses || [];
      const updated = [...existing, newAddr];
      await api.updateProfile({ addresses: updated });
      await refreshUser();
      setIsAddingAddress(false);
      setNewAddr({
        name: user?.name || '',
        phone: user?.phone || '',
        addressLine: '',
        landmark: '',
        city: '',
        state: 'Kerala',
        pincode: '',
        isDefault: false
      });
    } catch (err) {
      alert((err as Error).message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (index: number) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      const updated = (user?.addresses || []).filter((_, i) => i !== index);
      await api.updateProfile({ addresses: updated });
      await refreshUser();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete address');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwdMsg({ text: 'New password must be at least 6 characters.', isError: true });
      return;
    }
    setIsChangingPwd(true);
    setPwdMsg({ text: '', isError: false });
    try {
      await api.changePassword({ currentPassword: currPassword, newPassword });
      setPwdMsg({ text: 'Password changed successfully.', isError: false });
      setCurrPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdMsg({ text: (err as Error).message || 'Password update failed', isError: true });
    } finally {
      setIsChangingPwd(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-[#77766E] mb-4">Please log in to view your profile.</p>
        <Link to="/login" className="bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] text-xs font-bold px-6 py-2.5 rounded-full transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header Profile Summary */}
      <div className="bg-[#171814] text-[#F7F2E8] p-6 sm:p-8 rounded-3xl border border-[#D0AE70]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-2 border-[#D0AE70] shadow-md object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#F7F2E8]/10 border border-[#D0AE70]/40 flex items-center justify-center font-editorial text-2xl font-bold text-[#D0AE70] shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D0AE70] font-sans">
                Customer Dashboard
              </span>
              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-1 bg-[#435B43]/30 text-[#8B9B7B] border border-[#435B43]/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-[#D0AE70]" />
                  Google Verified
                </span>
              )}
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#F7F2E8]">
              Namaste, {user.name}
            </h1>
            <p className="text-xs text-[#D8D0C0] mt-0.5">{user.email}</p>
          </div>
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md transition-all shrink-0"
          >
            <Shield className="w-4 h-4 text-[#171814]" />
            <span>Go to Admin Dashboard</span>
          </Link>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Navigation Tabs */}
        <aside className="space-y-1 bg-white p-3 rounded-2xl border border-[#E5DED0] shadow-2xs h-fit">
          <button
            onClick={() => setSearchParams({ tab: 'profile' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${activeTab === 'profile' ? 'bg-[#171814] text-[#D0AE70]' : 'text-[#292A25] hover:bg-[#F7F2E8]'
              }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Information</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'orders' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${activeTab === 'orders' ? 'bg-[#171814] text-[#D0AE70]' : 'text-[#292A25] hover:bg-[#F7F2E8]'
              }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders & Dispatch</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'addresses' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${activeTab === 'addresses' ? 'bg-[#171814] text-[#D0AE70]' : 'text-[#292A25] hover:bg-[#F7F2E8]'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'security' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${activeTab === 'security' ? 'bg-[#171814] text-[#D0AE70]' : 'text-[#292A25] hover:bg-[#F7F2E8]'
              }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
        </aside>

        {/* Tab Content Panel */}
        <main className="lg:col-span-3">

          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DED0] shadow-xs space-y-6">
              <h2 className="font-editorial text-xl font-bold text-[#171814] pb-3 border-b border-[#E5DED0]">
                Personal Profile
              </h2>

              {/* Google Account Verification & Security Status */}
              <div className="p-4 rounded-2xl border border-[#E5DED0] bg-[#F7F2E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-[#E5DED0] shadow-2xs shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.3 21.35 7.36 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.3 2.65 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#171814] flex items-center gap-2">
                      Google Verification
                      {user.googleId ? (
                        <span className="text-[#435B43] font-bold bg-[#435B43]/15 text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#435B43]" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[#77766E] font-normal text-[10px] bg-[#E5DED0] px-2 py-0.5 rounded-full">
                          Not Linked
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-[#77766E] mt-0.5">
                      {user.googleId
                        ? 'Your customer account is verified with Google OAuth for 1-click logins.'
                        : 'Link and verify your customer account with Google for 1-click login and verified badges.'}
                    </p>
                  </div>
                </div>

                {!user.googleId && (
                  <div className="w-full sm:w-auto shrink-0">
                    <GoogleAuthButton
                      mode="verify"
                      buttonText="Verify with Google"
                      onSuccess={async () => {
                        await refreshUser();
                        setProfileSuccess('Google account successfully linked and verified!');
                        setTimeout(() => setProfileSuccess(''), 4000);
                      }}
                      onError={(err) => alert(err)}
                    />
                  </div>
                )}
              </div>

              {profileSuccess && (
                <div className="p-3 bg-[#435B43]/10 text-[#435B43] text-xs rounded-xl border border-[#435B43]/30">
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-[#292A25] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292A25] mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full text-xs p-3 bg-[#E5DED0]/50 border border-[#E5DED0] rounded-xl text-[#77766E] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292A25] mb-1">Contact Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] placeholder:text-[#77766E] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="py-3 px-6 bg-[#D0AE70] text-[#171814] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#B99153] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Orders List */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DED0] shadow-xs space-y-6">
              <h2 className="font-editorial text-xl font-bold text-[#171814] pb-3 border-b border-[#E5DED0]">
                Order History & Live Status
              </h2>

              {isLoadingOrders ? (
                <div className="py-12 text-center text-xs text-[#77766E]">
                  Loading past orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-10 h-10 text-[#D8D0C0] mx-auto" />
                  <p className="text-xs text-[#77766E]">You haven't placed any orders yet.</p>
                  <Link to="/shop" className="inline-block bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] text-xs font-bold px-5 py-2.5 rounded-full transition-colors">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div 
                      key={ord.id} 
                      onClick={() => setSelectedOrder(ord)}
                      className="p-5 rounded-2xl border border-[#E5DED0] bg-[#F7F2E8]/40 space-y-3 cursor-pointer hover:border-[#D0AE70] hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-[#E5DED0] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#171814] group-hover:text-[#D0AE70] transition-colors">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[10px] bg-[#E5DED0] text-[#292A25] px-2 py-0.5 rounded-md font-semibold">
                              Click to view details
                            </span>
                          </div>
                          <span className="text-[11px] text-[#77766E] block mt-0.5">Placed {formatDateTime(ord.createdAt)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold bg-[#171814] text-[#D0AE70] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {ord.fulfillmentStatus}
                          </span>
                          <p className="text-xs font-bold text-[#435B43] mt-1">{formatINR(ord.priceBreakdown.totalPaise)}</p>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E5DED0] text-xs text-[#292A25]">
                            <img src={item.image} alt={item.productName} className="w-6 h-6 object-cover rounded shrink-0 bg-[#F7F2E8]" />
                            <span className="font-semibold truncate max-w-[150px]">{item.productName}</span>
                            <span className="text-[#77766E]">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-[#E5DED0]">
                        {ord.trackingNumber ? (
                          <div className="text-xs text-[#171814] font-semibold bg-[#435B43]/10 px-3 py-1.5 rounded-lg border border-[#435B43]/20 flex items-center gap-2">
                            <span>Courier: {ord.courierName} ({ord.trackingNumber})</span>
                            <Link 
                              to={`/track/${encodeURIComponent(ord.trackingNumber)}`}
                              onClick={(e) => e.stopPropagation()} 
                              className="underline font-bold text-[#171814] hover:text-[#D0AE70]"
                            >
                              Track Package →
                            </Link>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#77766E]">Packaging at Munnar plantation depot</span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                          className="text-xs font-bold text-[#171814] hover:text-[#D0AE70] flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>View Full Order Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Popup for Order Details */}
          {selectedOrder && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setSelectedOrder(null)}
            >
              <div 
                className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-[#E5DED0] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-[#171814] text-[#F7F2E8] p-6 sm:p-7 rounded-t-3xl flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#D0AE70] uppercase tracking-widest block font-sans">
                      Order Summary & Tracking
                    </span>
                    <h3 className="font-editorial text-2xl font-bold text-[#F7F2E8] font-mono">
                      {selectedOrder.orderNumber}
                    </h3>
                    <p className="text-xs text-[#D8D0C0]">
                      Placed on {formatDateTime(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-[#D8D0C0] hover:text-[#D0AE70] hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    aria-label="Close details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 flex-1">
                  {/* Status Banner */}
                  <div className="bg-[#F7F2E8] p-4 rounded-2xl border border-[#E5DED0] flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#77766E] block font-sans">Fulfillment Status</span>
                      <span className="text-xs font-bold text-[#171814] uppercase">
                        {selectedOrder.fulfillmentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#77766E] block font-sans">Payment Method</span>
                      <span className="text-xs font-semibold text-[#292A25] uppercase">
                        {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                      </span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <Link
                        to={`/track/${encodeURIComponent(selectedOrder.trackingNumber)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] rounded-lg text-xs font-bold transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#171814]" />
                        <span>Live Tracking</span>
                      </Link>
                    )}
                  </div>

                  {/* Tracking Milestones / Delivery Data */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#292A25] flex items-center gap-1.5 font-sans">
                      <Truck className="w-4 h-4 text-[#D0AE70]" />
                      <span>Shipment & Logistics</span>
                    </h4>
                    <div className="p-4 bg-[#F7F2E8] rounded-2xl border border-[#E5DED0] text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#77766E]">Carrier Partner:</span>
                        <strong className="text-[#171814]">{selectedOrder.courierName || 'Blue Dart Express (Plantation Depot)'}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#77766E]">Tracking AWB:</span>
                        <strong className="font-mono text-[#171814]">{selectedOrder.trackingNumber || 'Pending Courier Pickup'}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#77766E]">Depot Hub:</span>
                        <span className="text-[#292A25]">Munnar Plantation Hub, Kerala (685612)</span>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#292A25] font-sans">
                      Order Items ({selectedOrder.items.length})
                    </h4>
                    <div className="space-y-2 border border-[#E5DED0] rounded-2xl p-3 bg-[#F7F2E8]/40">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E5DED0] text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={item.image} alt={item.productName} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-[#E5DED0] bg-[#F7F2E8]" />
                            <div className="min-w-0">
                              <p className="font-bold text-[#171814] truncate">{item.productName}</p>
                              <p className="text-[10px] text-[#77766E]">{item.packSize} • Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-bold text-[#435B43] shrink-0 ml-2">
                            {formatINR(item.lineTotalPaise)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#292A25] flex items-center gap-1.5 font-sans">
                      <MapPin className="w-4 h-4 text-[#D0AE70]" />
                      <span>Shipping Address</span>
                    </h4>
                    <div className="p-3.5 bg-[#F7F2E8] rounded-xl border border-[#E5DED0] text-xs space-y-1">
                      <p className="font-bold text-[#171814]">{selectedOrder.shippingAddress.name} ({selectedOrder.shippingAddress.phone})</p>
                      <p className="text-[#292A25]">
                        {selectedOrder.shippingAddress.addressLine}
                        {selectedOrder.shippingAddress.landmark ? `, Near ${selectedOrder.shippingAddress.landmark}` : ''}
                      </p>
                      <p className="text-[#77766E]">
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="p-4 bg-[#F7F2E8] rounded-2xl border border-[#E5DED0] space-y-2 text-xs">
                    <div className="flex justify-between text-[#77766E]">
                      <span>Subtotal:</span>
                      <span className="text-[#292A25] font-semibold">{formatINR(selectedOrder.priceBreakdown.subtotalPaise)}</span>
                    </div>
                    {selectedOrder.priceBreakdown.discountPaise > 0 && (
                      <div className="flex justify-between text-[#A94F38] font-semibold">
                        <span>Discount:</span>
                        <span>-{formatINR(selectedOrder.priceBreakdown.discountPaise)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#77766E]">
                      <span>Shipping Fee:</span>
                      <span className="text-[#435B43] font-semibold">{selectedOrder.priceBreakdown.shippingFeePaise === 0 ? 'FREE' : formatINR(selectedOrder.priceBreakdown.shippingFeePaise)}</span>
                    </div>
                    <div className="flex justify-between text-[#77766E]">
                      <span>Tax / GST:</span>
                      <span className="text-[#292A25]">{formatINR(selectedOrder.priceBreakdown.taxPaise)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#E5DED0] flex justify-between font-bold text-sm text-[#171814]">
                      <span>Grand Total:</span>
                      <span className="font-editorial text-base text-[#435B43]">{formatINR(selectedOrder.priceBreakdown.totalPaise)}</span>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-6 bg-[#F7F2E8] border-t border-[#E5DED0] rounded-b-3xl flex justify-between items-center gap-3">
                  {selectedOrder.trackingNumber ? (
                    <Link
                      to={`/track/${encodeURIComponent(selectedOrder.trackingNumber)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171814] text-[#D0AE70] hover:bg-[#292A25] rounded-xl text-xs font-bold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#D0AE70]" />
                      <span>Open Live Tracking Page</span>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-[#77766E]">Tracking code will appear once dispatched</span>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2 bg-[#E5DED0] hover:bg-[#D8D0C0] text-[#171814] rounded-xl text-xs font-bold transition-colors ml-auto cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DED0] shadow-xs space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-[#E5DED0]">
                <h2 className="font-editorial text-xl font-bold text-[#171814]">
                  Delivery Addresses
                </h2>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#171814] hover:text-[#D0AE70] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#D0AE70]" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleAddAddress} className="space-y-4 max-w-lg p-5 bg-[#F7F2E8] rounded-2xl border border-[#E5DED0]">
                  <h3 className="text-xs font-bold uppercase text-[#171814]">New Delivery Address</h3>
                  <div>
                    <label className="block text-xs font-semibold text-[#292A25] mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white border border-[#E5DED0] rounded-lg text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#292A25] mb-1">House / Flat / Street</label>
                    <input
                      type="text"
                      required
                      value={newAddr.addressLine}
                      onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white border border-[#E5DED0] rounded-lg text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#292A25] mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-[#E5DED0] rounded-lg text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#292A25] mb-1">PIN Code (6 digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, '') })}
                        className="w-full text-xs p-2.5 bg-white border border-[#E5DED0] rounded-lg text-[#292A25] focus:outline-hidden focus:border-[#D0AE70]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-[#D0AE70] text-[#171814] hover:bg-[#B99153] text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="py-2.5 px-4 text-xs font-semibold text-[#77766E] hover:text-[#171814] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((addr, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-[#E5DED0] bg-[#F7F2E8] flex justify-between items-start">
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-[#171814]">{addr.name}</p>
                          <p className="text-[#292A25]">{addr.addressLine}</p>
                          <p className="text-[#77766E]">{addr.city}, {addr.state} - {addr.pincode}</p>
                          {addr.phone && <p className="text-[#77766E]">Phone: {addr.phone}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(idx)}
                          className="text-[#77766E] hover:text-[#A94F38] p-1 cursor-pointer transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#77766E] italic col-span-2">
                      No saved addresses yet. Addresses added during checkout will also appear here.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Password Security */}
          {activeTab === 'security' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DED0] shadow-xs space-y-6">
              <h2 className="font-editorial text-xl font-bold text-[#171814] pb-3 border-b border-[#E5DED0]">
                Change Password
              </h2>

              {pwdMsg.text && (
                <div className={`p-3 text-xs rounded-xl border ${pwdMsg.isError ? 'bg-[#A94F38]/10 text-[#A94F38] border-[#A94F38]/30' : 'bg-[#435B43]/10 text-[#435B43] border-[#435B43]/30'
                  }`}>
                  {pwdMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-xs font-semibold text-[#292A25] mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292A25] mb-1">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs p-3 bg-[#F7F2E8] border border-[#E5DED0] rounded-xl text-[#292A25] focus:outline-hidden focus:border-[#D0AE70] focus:ring-1 focus:ring-[#D0AE70]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPwd}
                  className="py-3 px-6 bg-[#D0AE70] text-[#171814] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#B99153] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {isChangingPwd ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

        </main>

      </div>

    </div>
  );
};
