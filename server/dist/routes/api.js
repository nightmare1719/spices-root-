import { Router } from 'express';
import { getProducts, getProductBySlug, getCategories, addProductReview } from '../controllers/productController.js';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cartController.js';
import { validateCoupon } from '../controllers/couponController.js';
import { calculateQuote, createOrder, verifyPayment, getPaymentConfig } from '../controllers/checkoutController.js';
import { getMyOrders, getOrderById, trackGuestOrder, cancelOrder } from '../controllers/orderController.js';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/authController.js';
import { processAssistantChat } from '../services/aiAssistant.js';
import { getDashboardMetrics, getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct, getAdminOrders, updateAdminOrderStatus, getAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon, getAdminCustomers, getAdminSettings, updateAdminSettings, exportProductsCsv } from '../controllers/adminController.js';
import { verifyToken, optionalToken, requireAdmin } from '../middleware/auth.js';
import { db } from '../models/dataStore.js';
const router = Router();
// --- HEALTH & STORE PUBLIC SETTINGS ---
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        store: 'Spice Roots E-Commerce API',
        time: new Date().toISOString()
    });
});
router.get('/settings', (_req, res) => {
    const settings = db.getSettings();
    res.json({
        success: true,
        data: {
            storeName: settings.storeName,
            brandTagline: settings.brandTagline,
            announcementText: settings.announcementText,
            supportEmail: settings.supportEmail,
            supportPhone: settings.supportPhone,
            businessAddress: settings.businessAddress,
            currencySymbol: settings.currencySymbol,
            freeShippingThresholdPaise: settings.freeShippingThresholdPaise,
            standardShippingFeePaise: settings.standardShippingFeePaise,
            taxPercent: settings.taxPercent,
            isCodEnabled: settings.isCodEnabled,
            isRazorpayEnabled: settings.isRazorpayEnabled,
            isAiEnabled: settings.isAiEnabled,
            aboutStory: settings.aboutStory,
            shippingPolicy: settings.shippingPolicy,
            returnPolicy: settings.returnPolicy,
            privacyPolicy: settings.privacyPolicy,
            termsAndConditions: settings.termsAndConditions
        }
    });
});
// --- PRODUCTS & CATEGORIES ---
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);
router.get('/categories', getCategories);
router.post('/products/:id/reviews', addProductReview);
// --- CART ---
router.get('/cart', optionalToken, getCart);
router.post('/cart/items', optionalToken, addToCart);
router.patch('/cart/items', optionalToken, updateCartItem);
router.delete('/cart/items', optionalToken, removeCartItem);
router.delete('/cart', optionalToken, clearCart);
// --- COUPONS ---
router.post('/coupons/validate', validateCoupon);
// --- CHECKOUT & PAYMENTS ---
router.post('/checkout/quote', calculateQuote);
router.post('/checkout/create-order', optionalToken, createOrder);
router.post('/checkout/verify-payment', verifyPayment);
router.get('/checkout/payment-config', getPaymentConfig);
// --- ORDERS ---
router.get('/orders', verifyToken, getMyOrders);
router.get('/orders/:id', optionalToken, getOrderById);
router.post('/orders/track', trackGuestOrder);
router.post('/orders/:id/cancel', verifyToken, cancelOrder);
// --- AUTHENTICATION & PROFILE ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', verifyToken, getProfile);
router.put('/auth/profile', verifyToken, updateProfile);
router.put('/auth/password', verifyToken, changePassword);
// --- AI SHOPPING ASSISTANT ---
router.post('/assistant/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }
        const response = await processAssistantChat(message.trim(), history || []);
        return res.json({ success: true, data: response });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Assistant error', error: err.message });
    }
});
// --- ADMIN ROUTES (Protected) ---
router.get('/admin/dashboard', verifyToken, requireAdmin, getDashboardMetrics);
router.get('/admin/products', verifyToken, requireAdmin, getAdminProducts);
router.post('/admin/products', verifyToken, requireAdmin, createAdminProduct);
router.put('/admin/products/:id', verifyToken, requireAdmin, updateAdminProduct);
router.delete('/admin/products/:id', verifyToken, requireAdmin, deleteAdminProduct);
router.get('/admin/products/export-csv', verifyToken, requireAdmin, exportProductsCsv);
router.get('/admin/orders', verifyToken, requireAdmin, getAdminOrders);
router.put('/admin/orders/:id/status', verifyToken, requireAdmin, updateAdminOrderStatus);
router.get('/admin/coupons', verifyToken, requireAdmin, getAdminCoupons);
router.post('/admin/coupons', verifyToken, requireAdmin, createAdminCoupon);
router.put('/admin/coupons/:id', verifyToken, requireAdmin, updateAdminCoupon);
router.delete('/admin/coupons/:id', verifyToken, requireAdmin, deleteAdminCoupon);
router.get('/admin/customers', verifyToken, requireAdmin, getAdminCustomers);
router.get('/admin/settings', verifyToken, requireAdmin, getAdminSettings);
router.put('/admin/settings', verifyToken, requireAdmin, updateAdminSettings);
export default router;
