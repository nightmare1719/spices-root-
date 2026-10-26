import mongoose, { Schema } from 'mongoose';
import {
  IUser, IProduct, ICategory, ICart, IWishlist,
  IOrder, ICoupon, IReview, IStoreSettings, ShippingZoneRate
} from '../types/index.js';

// --- USER SCHEMA ---
const userAddressSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine: { type: String, required: true },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new Schema<IUser>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  phone: { type: String },
  avatar: { type: String },
  googleId: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  addresses: [userAddressSchema],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

// --- PRODUCT SCHEMA ---
const productVariantSchema = new Schema({
  id: { type: String, required: true },
  sku: { type: String, required: true },
  packSize: { type: String, required: true },
  unit: { type: String, required: true },
  pricePaise: { type: Number, required: true },
  comparePricePaise: { type: Number },
  stock: { type: Number, required: true, default: 0 },
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const productSchema = new Schema<IProduct>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  categoryName: { type: String },
  shortDescription: { type: String, required: true },
  description: { type: String, required: true },
  origin: { type: String },
  ingredients: [{ type: String }],
  storageInfo: { type: String },
  usageTips: { type: String },
  images: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  variants: [productVariantSchema],
  rating: { type: Number, default: 5 },
  reviewCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

// --- CATEGORY SCHEMA ---
const categorySchema = new Schema<ICategory>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  itemCount: { type: Number, default: 0 }
}, { timestamps: false });

// --- CART SCHEMA ---
const cartItemSchema = new Schema({
  productId: { type: String, required: true },
  variantId: { type: String, required: true },
  packSize: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPricePaise: { type: Number, required: true }
}, { _id: false });

const cartSchema = new Schema<ICart>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  guestId: { type: String },
  items: [cartItemSchema],
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

// --- WISHLIST SCHEMA ---
const wishlistSchema = new Schema<IWishlist>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  guestId: { type: String },
  productIds: [{ type: String }],
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

// --- ORDER SCHEMA ---
const orderItemSnapshotSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  variantId: { type: String, required: true },
  sku: { type: String, required: true },
  packSize: { type: String, required: true },
  unitPricePaise: { type: Number, required: true },
  quantity: { type: Number, required: true },
  lineTotalPaise: { type: Number, required: true },
  image: { type: String, required: true }
}, { _id: false });

const orderStatusHistorySchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: String, required: true },
  note: { type: String },
  updatedBy: { type: String }
}, { _id: false });

const paymentAuditLogSchema = new Schema({
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  timestamp: { type: String, required: true },
  changedBy: { type: String, required: true },
  note: { type: String },
  utr: { type: String }
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: String },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  shippingAddress: userAddressSchema,
  items: [orderItemSnapshotSchema],
  priceBreakdown: {
    subtotalPaise: { type: Number, required: true },
    discountPaise: { type: Number, default: 0 },
    shippingFeePaise: { type: Number, default: 0 },
    taxPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true }
  },
  couponCode: { type: String },
  deliveryNotes: { type: String },
  paymentMethod: { type: String, required: true, default: 'upi_manual' },
  paymentStatus: { type: String, required: true, default: 'AWAITING_PAYMENT' },
  upiTransactionRef: { type: String },
  screenshotPath: { type: String },
  paymentSubmittedAt: { type: String },
  verifiedAt: { type: String },
  verifiedBy: { type: String },
  rejectionReason: { type: String },
  adminNotes: { type: String },
  paymentAuditLogs: [paymentAuditLogSchema],
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  fulfillmentStatus: { type: String, required: true, default: 'pending' },
  courierName: { type: String },
  trackingNumber: { type: String },
  statusHistory: [orderStatusHistorySchema],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

// --- COUPON SCHEMA ---
const couponSchema = new Schema<ICoupon>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValuePaise: { type: Number, default: 0 },
  maxDiscountPaise: { type: Number },
  expiryDate: { type: String, required: true },
  usageLimit: { type: Number },
  timesUsed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: false });

// --- REVIEW SCHEMA ---
const reviewSchema = new Schema<IReview>({
  _id: { type: String },
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isVerifiedPurchase: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

// --- SETTINGS SCHEMA ---
const settingsSchema = new Schema<IStoreSettings>({
  _id: { type: String },
  storeName: { type: String, default: 'Spice Roots' },
  brandTagline: { type: String, default: 'Authentic Western Ghats & Kerala Spices' },
  announcementText: { type: String },
  supportEmail: { type: String },
  supportPhone: { type: String },
  businessAddress: { type: String },
  currencySymbol: { type: String, default: '₹' },
  freeShippingThresholdPaise: { type: Number, default: 99900 },
  standardShippingFeePaise: { type: Number, default: 6000 },
  taxPercent: { type: Number, default: 5 },
  isCodEnabled: { type: Boolean, default: true },
  isRazorpayEnabled: { type: Boolean, default: true },
  isUpiManualEnabled: { type: Boolean, default: true },
  isAiEnabled: { type: Boolean, default: true },
  merchantUpiId: { type: String, default: 'cynalbertoz@sbi' },
  merchantWhatsappNumber: { type: String, default: '919188570191' },
  legalBusinessName: { type: String, default: 'Kalaivani Spices & Plantation Depot' },
  gstin: { type: String, default: '' },
  pan: { type: String, default: '' },
  invoicePrefix: { type: String, default: 'SR-INV-' },
  aboutStory: { type: String },
  shippingPolicy: { type: String },
  returnPolicy: { type: String },
  privacyPolicy: { type: String },
  termsAndConditions: { type: String }
}, { timestamps: true });

// Export Models
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
export const CartModel = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
export const WishlistModel = mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', wishlistSchema);
export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
export const StoreSettingsModel = mongoose.models.StoreSettings || mongoose.model<IStoreSettings>('StoreSettings', settingsSchema);

// --- SHIPPING ZONE RATES SCHEMA ---
const shippingZoneRateSchema = new Schema<ShippingZoneRate>({
  id: { type: String },
  _id: { type: String },
  zoneName: { type: String, required: true },
  pincodePrefix: { type: String, required: true },
  baseWeightKg: { type: Number, required: true, default: 1 },
  baseRate: { type: Number, required: true, default: 100 },
  perAdditionalKgRate: { type: Number, required: true, default: 50 },
  estimatedDelivery: { type: String, default: '3-5 business days' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const ShippingZoneRateModel = mongoose.models.ShippingZoneRate || mongoose.model<ShippingZoneRate>('ShippingZoneRate', shippingZoneRateSchema);
