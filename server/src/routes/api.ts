import { Router, Request, Response } from 'express';
import { 
  getProducts, 
  getProductBySlug, 
  getCategories, 
  addProductReview 
} from '../controllers/productController.js';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem, 
  clearCart 
} from '../controllers/cartController.js';
import { validateCoupon } from '../controllers/couponController.js';
import { 
  calculateQuote, 
  createOrder, 
  verifyPayment, 
  getPaymentConfig,
  submitUpiPayment,
  getUpiPaymentInfo
} from '../controllers/checkoutController.js';
import { 
  getMyOrders, 
  getOrderById, 
  trackGuestOrder, 
  cancelOrder 
} from '../controllers/orderController.js';
import { 
  register, 
  login, 
  googleAuth,
  linkGoogleAccount,
  getAuthConfig,
  getProfile, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { processAssistantChat } from '../services/aiAssistant.js';
import { 
  getDashboardMetrics, 
  getAdminProducts, 
  createAdminProduct, 
  updateAdminProduct, 
  deleteAdminProduct, 
  getAdminOrders, 
  updateAdminOrderStatus, 
  verifyAdminPayment,
  rejectAdminPayment,
  serveAdminScreenshot,
  getOrderInvoice,
  getAdminCoupons, 
  createAdminCoupon, 
  updateAdminCoupon, 
  deleteAdminCoupon, 
  getAdminCustomers, 
  getAdminSettings, 
  updateAdminSettings, 
  exportProductsCsv 
} from '../controllers/adminController.js';
import { verifyToken, optionalToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { screenshotUpload } from '../middleware/screenshotUpload.js';
import { db } from '../models/dataStore.js';

const router = Router();

// --- HEALTH & STORE PUBLIC SETTINGS ---
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    store: 'Spice Roots E-Commerce API',
    time: new Date().toISOString()
  });
});

router.get('/settings', (_req: Request, res: Response) => {
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
router.post('/checkout/submit-upi-payment', screenshotUpload.single('screenshot'), submitUpiPayment);
router.get('/checkout/upi-info/:orderNumber', getUpiPaymentInfo);
router.post('/checkout/verify-payment', verifyPayment);
router.get('/checkout/payment-config', getPaymentConfig);

// --- ORDERS ---
router.get('/orders', verifyToken, getMyOrders);
router.get('/orders/:id', optionalToken, getOrderById);
router.get('/orders/:id/invoice', getOrderInvoice);
router.post('/orders/track', trackGuestOrder);
router.post('/orders/:id/cancel', verifyToken, cancelOrder);

// --- AUTHENTICATION & PROFILE ---
router.get('/auth/config', getAuthConfig);
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleAuth);
router.post('/auth/google/verify', verifyToken, linkGoogleAccount);
router.get('/auth/me', verifyToken, getProfile);
router.put('/auth/profile', verifyToken, updateProfile);
router.put('/auth/password', verifyToken, changePassword);

// --- AI SHOPPING ASSISTANT ---
router.post('/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    const response = await processAssistantChat(message.trim(), history || []);
    return res.json({ success: true, data: response });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Assistant error', error: (err as Error).message });
  }
});

// --- ADMIN ROUTES (Protected) ---
router.get('/admin/dashboard', verifyToken, requireAdmin, getDashboardMetrics);
router.get('/admin/products', verifyToken, requireAdmin, getAdminProducts);
router.post('/admin/products', verifyToken, requireAdmin, createAdminProduct);
router.put('/admin/products/:id', verifyToken, requireAdmin, updateAdminProduct);
router.delete('/admin/products/:id', verifyToken, requireAdmin, deleteAdminProduct);
router.get('/admin/products/export-csv', verifyToken, requireAdmin, exportProductsCsv);

// Support both /admin/orders and /admin/order
router.get('/admin/orders', verifyToken, requireAdmin, getAdminOrders);
router.get('/admin/order', verifyToken, requireAdmin, getAdminOrders);

router.put('/admin/orders/:id/status', verifyToken, requireAdmin, updateAdminOrderStatus);
router.put('/admin/order/:id/status', verifyToken, requireAdmin, updateAdminOrderStatus);

router.post('/admin/orders/:id/verify-payment', verifyToken, requireAdmin, verifyAdminPayment);
router.post('/admin/order/:id/verify-payment', verifyToken, requireAdmin, verifyAdminPayment);

router.post('/admin/orders/:id/reject-payment', verifyToken, requireAdmin, rejectAdminPayment);
router.post('/admin/order/:id/reject-payment', verifyToken, requireAdmin, rejectAdminPayment);

router.get('/admin/orders/:id/screenshot', verifyToken, requireAdmin, serveAdminScreenshot);
router.get('/admin/order/:id/screenshot', verifyToken, requireAdmin, serveAdminScreenshot);

router.get('/admin/orders/:id/invoice', verifyToken, requireAdmin, getOrderInvoice);
router.get('/admin/order/:id/invoice', verifyToken, requireAdmin, getOrderInvoice);

router.get('/admin/coupons', verifyToken, requireAdmin, getAdminCoupons);
router.post('/admin/coupons', verifyToken, requireAdmin, createAdminCoupon);
router.put('/admin/coupons/:id', verifyToken, requireAdmin, updateAdminCoupon);
router.delete('/admin/coupons/:id', verifyToken, requireAdmin, deleteAdminCoupon);

router.get('/admin/customers', verifyToken, requireAdmin, getAdminCustomers);
router.get('/admin/settings', verifyToken, requireAdmin, getAdminSettings);
router.put('/admin/settings', verifyToken, requireAdmin, updateAdminSettings);

// --- SHIPPING ZONE RATES & LOGISTICS ---
router.get('/shipping-rates', (_req: Request, res: Response) => {
  const rates = db.getShippingRates();
  return res.json({ success: true, data: rates });
});

router.post('/shipping-rates/calculate', (req: Request, res: Response) => {
  const { pincode, totalWeightGrams } = req.body;
  if (!pincode || typeof totalWeightGrams !== 'number') {
    return res.status(400).json({ success: false, message: 'Destination pincode and totalWeightGrams are required.' });
  }
  const details = db.getShippingDetails(pincode, totalWeightGrams);
  return res.json({ 
    success: true, 
    data: { 
      pincode: details.pincode, 
      totalWeightGrams: details.totalWeightGrams,
      totalWeightKg: details.totalWeightKg,
      zoneName: details.zoneName,
      baseWeightKg: details.baseWeightKg,
      baseRate: details.baseRate,
      perAdditionalKgRate: details.perAdditionalKgRate,
      extraKg: details.extraKg,
      shippingChargeINR: details.shippingChargeINR,
      shippingChargePaise: details.shippingChargePaise,
      estimatedDelivery: details.estimatedDelivery
    } 
  });
});

router.post('/shipping-rates', verifyToken, requireAdmin, (req: Request, res: Response) => {
  const { zoneName, pincodePrefix, baseWeightKg, baseRate, perAdditionalKgRate, estimatedDelivery, isActive } = req.body;
  if (!zoneName || !pincodePrefix) {
    return res.status(400).json({ success: false, message: 'Zone name and pincode prefix are required.' });
  }
  const created = db.createShippingRate({
    zoneName: zoneName.trim(),
    pincodePrefix: pincodePrefix.trim(),
    baseWeightKg: Number(baseWeightKg) || 1,
    baseRate: Number(baseRate) || 0,
    perAdditionalKgRate: Number(perAdditionalKgRate) || 0,
    estimatedDelivery: estimatedDelivery ? estimatedDelivery.trim() : '3-5 business days',
    isActive: isActive !== false
  });
  return res.status(201).json({ success: true, data: created, message: 'Shipping zone slab created successfully.' });
});

router.put('/shipping-rates/:id', verifyToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateShippingRate(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Shipping rate slab not found.' });
  }
  return res.json({ success: true, data: updated, message: 'Shipping zone slab updated.' });
});

router.delete('/shipping-rates/:id', verifyToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteShippingRate(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Shipping rate slab not found.' });
  }
  return res.json({ success: true, message: 'Shipping zone slab removed.' });
});

// --- 404 HANDLER FOR UNMATCHED API ROUTES (Problem 6) ---
router.use('*', (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: 'API_ENDPOINT_NOT_FOUND',
    message: `API endpoint '${req.method} /api${req.path}' does not exist or has been moved.`,
    requestedEndpoint: `/api${req.path}`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default router;
