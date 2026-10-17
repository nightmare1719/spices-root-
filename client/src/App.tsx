import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { WishlistProvider } from './context/WishlistContext.js';
import { StoreProvider } from './context/StoreContext.js';

import { AnnouncementBar } from './components/AnnouncementBar.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { MiniCartDrawer } from './components/MiniCartDrawer.js';
import { AiAssistantWidget } from './components/AiAssistantWidget.js';

import { HomePage } from './pages/HomePage.js';
import { ShopPage } from './pages/ShopPage.js';
import { CategoryPage } from './pages/CategoryPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { CartPage } from './pages/CartPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.js';
import { OrderTrackingPage } from './pages/OrderTrackingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { WishlistPage } from './pages/WishlistPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { FaqPage } from './pages/FaqPage.js';
import { PoliciesPage } from './pages/PoliciesPage.js';

import { AdminLayout } from './pages/admin/AdminLayout.js';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminProductsPage } from './pages/admin/AdminProductsPage.js';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.js';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage.js';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

// Customer Authentication Guard for Cart & Checkout
const CustomerAuthGuard: React.FC<{ children: React.ReactNode; redirectMessage: string }> = ({ children, redirectMessage }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-4 border-[#153E2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-stone-500 font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (!user) {
    const targetUrl = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(targetUrl)}`}
        state={{ from: location, message: redirectMessage }}
        replace
      />
    );
  }

  return <>{children}</>;
};

// Customer layout wrapper including Header, AnnouncementBar, Footer, MiniCart, and AI Assistant
const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MiniCartDrawer />
      <AiAssistantWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Customer Storefront Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  
                  {/* Protected Cart & Checkout Authentication Guards */}
                  <Route 
                    path="/cart" 
                    element={
                      <CustomerAuthGuard redirectMessage="Please sign in to view your shopping cart.">
                        <CartPage />
                      </CustomerAuthGuard>
                    } 
                  />
                  <Route 
                    path="/checkout" 
                    element={
                      <CustomerAuthGuard redirectMessage="Please sign in to proceed to checkout and payment.">
                        <CheckoutPage />
                      </CustomerAuthGuard>
                    } 
                  />
                  <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                  <Route path="/track-order" element={<OrderTrackingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/shipping-policy" element={<PoliciesPage initialTab="shipping" />} />
                  <Route path="/returns-policy" element={<PoliciesPage initialTab="returns" />} />
                  <Route path="/privacy-policy" element={<PoliciesPage initialTab="privacy" />} />
                  <Route path="/terms" element={<PoliciesPage initialTab="terms" />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="coupons" element={<AdminCouponsPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
};

export default App;
