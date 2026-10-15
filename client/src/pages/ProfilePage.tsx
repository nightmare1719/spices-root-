import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { IOrder, IUserAddress } from '../types/index.js';
import { formatINR, formatDateTime } from '../utils/format.js';
import { 
  User, Package, MapPin, KeyRound, Shield, 
  Trash2, Plus, CheckCircle2, Clock, Truck 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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
        <p className="text-stone-500 mb-4">Please log in to view your profile.</p>
        <Link to="/login" className="bg-[#153E2B] text-white text-xs font-bold px-6 py-2.5 rounded-full">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Profile Summary */}
      <div className="bg-[#153E2B] text-white p-6 sm:p-8 rounded-3xl border border-[#C5A059]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#D8B26E] block mb-1">
            Customer Dashboard
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold">
            Namaste, {user.name}
          </h1>
          <p className="text-xs text-[#E3D9C0] mt-0.5">{user.email}</p>
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 bg-[#C5A059] text-[#0F2E20] hover:bg-[#D8B26E] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md transition-all"
          >
            <Shield className="w-4 h-4" />
            <span>Go to Admin Dashboard</span>
          </Link>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Tabs */}
        <aside className="space-y-1 bg-white p-3 rounded-2xl border border-[#EFE8D6] shadow-2xs h-fit">
          <button
            onClick={() => setSearchParams({ tab: 'profile' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'profile' ? 'bg-[#153E2B] text-white' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Information</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'orders' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'orders' ? 'bg-[#153E2B] text-white' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders & Dispatch</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'addresses' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'addresses' ? 'bg-[#153E2B] text-white' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'security' })}
            className={`w-full text-left text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'security' ? 'bg-[#153E2B] text-white' : 'text-stone-700 hover:bg-stone-50'
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
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8D6] shadow-xs space-y-6">
              <h2 className="font-editorial text-xl font-bold text-[#153E2B] pb-3 border-b border-stone-100">
                Personal Profile
              </h2>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full text-xs p-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="py-3 px-6 bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1E5138] disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Orders List */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8D6] shadow-xs space-y-6">
              <h2 className="font-editorial text-xl font-bold text-[#153E2B] pb-3 border-b border-stone-100">
                Order History & Live Status
              </h2>

              {isLoadingOrders ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  Loading past orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500">You haven't placed any orders yet.</p>
                  <Link to="/shop" className="inline-block bg-[#153E2B] text-white text-xs font-bold px-5 py-2 rounded-full">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="p-5 rounded-2xl border border-stone-200 bg-[#FAF7F2] space-y-3">
                      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-stone-200 pb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#153E2B]">{ord.orderNumber}</span>
                          <span className="text-[11px] text-stone-500 block">Placed {formatDateTime(ord.createdAt)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold bg-[#153E2B] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {ord.fulfillmentStatus}
                          </span>
                          <p className="text-xs font-bold text-[#153E2B] mt-1">{formatINR(ord.priceBreakdown.totalPaise)}</p>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-xs">
                            <img src={item.image} alt={item.productName} className="w-6 h-6 object-cover rounded shrink-0" />
                            <span className="font-semibold truncate max-w-[150px]">{item.productName}</span>
                            <span className="text-stone-400">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {ord.trackingNumber && (
                        <div className="text-xs text-[#153E2B] font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                          <span>Courier: {ord.courierName} ({ord.trackingNumber})</span>
                          <Link to="/track-order" className="underline font-bold text-[#153E2B]">
                            Track Package →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8D6] shadow-xs space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                <h2 className="font-editorial text-xl font-bold text-[#153E2B]">
                  Delivery Addresses
                </h2>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153E2B] hover:text-[#C5A059]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleAddAddress} className="space-y-4 max-w-lg p-5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                  <h3 className="text-xs font-bold uppercase text-[#153E2B]">New Delivery Address</h3>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">House / Flat / Street</label>
                    <input
                      type="text"
                      required
                      value={newAddr.addressLine}
                      onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">PIN Code (6 digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, '') })}
                        className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="py-2 px-5 bg-[#153E2B] text-white text-xs font-bold rounded-lg"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="py-2 px-4 text-xs font-semibold text-stone-600 hover:text-black"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((addr, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-stone-200 bg-[#FAF7F2] flex justify-between items-start">
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-[#153E2B]">{addr.name}</p>
                          <p className="text-stone-600">{addr.addressLine}</p>
                          <p className="text-stone-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                          {addr.phone && <p className="text-stone-500">Phone: {addr.phone}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(idx)}
                          className="text-stone-400 hover:text-[#B85D3A] p-1"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-500 italic col-span-2">
                      No saved addresses yet. Addresses added during checkout will also appear here.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Password Security */}
          {activeTab === 'security' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE8D6] shadow-xs space-y-6">
              <h2 className="font-editorial text-xl font-bold text-[#153E2B] pb-3 border-b border-stone-100">
                Change Password
              </h2>

              {pwdMsg.text && (
                <div className={`p-3 text-xs rounded-xl border ${
                  pwdMsg.isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {pwdMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FAF7F2] border border-stone-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPwd}
                  className="py-3 px-6 bg-[#153E2B] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1E5138] disabled:opacity-50 transition-colors shadow-xs"
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
