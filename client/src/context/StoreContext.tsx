import React, { createContext, useContext, useState, useEffect } from 'react';
import { IStoreSettings } from '../types/index.js';
import { api } from '../services/api.js';

interface StoreContextType {
  settings: IStoreSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: IStoreSettings = {
  storeName: "Spice Roots",
  brandTagline: "Authentic Western Ghats & Kerala Spices",
  announcementText: "🌿 Free shipping across India on orders above ₹999 | Direct from Munnar & Western Ghats",
  supportEmail: "care@spiceroots.in",
  supportPhone: "+91 94882 12345",
  businessAddress: "Kalaivani Spices & Plantation Depot, Post Office Junction, Munnar, Kerala - 685612",
  currencySymbol: "₹",
  freeShippingThresholdPaise: 99900,
  standardShippingFeePaise: 6000,
  taxPercent: 5,
  isCodEnabled: true,
  isRazorpayEnabled: true,
  isAiEnabled: true,
  aboutStory: "Founded amidst the mist-clad hills of Munnar and the lush slopes of the Western Ghats, Spice Roots (Kalaivani Spices) connects generational spice planters with kitchens that revere authenticity.",
  shippingPolicy: "Orders are dispatched within 24-48 business hours via Blue Dart, DTDC, or India Post.",
  returnPolicy: "We accept returns or replacements within 7 days of delivery for damaged or defective packaging.",
  privacyPolicy: "We respect your personal privacy. Customer information is solely utilized to fulfill your orders.",
  termsAndConditions: "By using Spice Roots, you agree to these terms. Prices are listed in Indian Rupees (INR)."
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<IStoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch store settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <StoreContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
