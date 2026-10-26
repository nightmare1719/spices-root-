export type UserRole = 'customer' | 'admin';

export interface IUserAddress {
  id?: string;
  name: string;
  phone: string;
  addressLine: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  googleId?: string;
  isEmailVerified?: boolean;
  addresses: IUserAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface IProductVariant {
  id: string;
  sku: string;
  packSize: string;
  unit: string;
  pricePaise: number; // stored in paise, e.g. 25000 = ₹250.00
  comparePricePaise?: number;
  stock: number;
  isAvailable: boolean;
}

export type ProductCategory = 
  | 'spices' 
  | 'masalas' 
  | 'tea' 
  | 'essential_oils' 
  | 'gift_boxes' 
  | 'combos'
  | 'chocolates';

export interface IProduct {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  category: ProductCategory;
  categoryName?: string;
  shortDescription: string;
  description: string;
  origin?: string;
  ingredients?: string[];
  storageInfo?: string;
  usageTips?: string;
  images: string[];
  isFeatured: boolean;
  isPublished: boolean;
  variants: IProductVariant[];
  rating: number;
  reviewCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  itemCount?: number;
}

export interface ICartItem {
  productId: string;
  variantId: string;
  packSize: string;
  quantity: number;
  unitPricePaise: number;
  product?: IProduct;
}

export interface ICart {
  _id?: string;
  id?: string;
  userId?: string;
  guestId?: string;
  items: ICartItem[];
  updatedAt: string;
}

export interface IWishlist {
  _id?: string;
  id?: string;
  userId?: string;
  guestId?: string;
  productIds: string[];
  updatedAt: string;
}

export type PaymentState = 
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'VERIFICATION_PENDING'
  | 'PAID'
  | 'REJECTED'
  | 'EXPIRED'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 'upi_manual' | 'razorpay' | 'cod';

export type OrderPaymentStatus = PaymentState;
export type OrderFulfillmentStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface IOrderItemSnapshot {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  sku: string;
  packSize: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  image: string;
}

export interface IOrderStatusHistory {
  status: OrderFulfillmentStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface IPaymentAuditLog {
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  changedBy: string;
  note?: string;
  utr?: string;
}

export interface IOrder {
  _id?: string;
  id?: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: IUserAddress;
  items: IOrderItemSnapshot[];
  priceBreakdown: {
    subtotalPaise: number;
    discountPaise: number;
    shippingFeePaise: number;
    taxPaise: number;
    totalPaise: number;
  };
  couponCode?: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentState;
  upiTransactionRef?: string;
  screenshotPath?: string;
  paymentSubmittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
  paymentAuditLogs?: IPaymentAuditLog[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  courierName?: string;
  trackingNumber?: string;
  statusHistory: IOrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id?: string;
  id?: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number; // percentage (e.g. 10 for 10%) or flat amount in paise (e.g. 10000 for ₹100)
  minOrderValuePaise: number;
  maxDiscountPaise?: number;
  expiryDate: string;
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
}

export interface IReview {
  _id?: string;
  id?: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface IStoreSettings {
  _id?: string;
  storeName: string;
  brandTagline: string;
  announcementText: string;
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  currencySymbol: string;
  freeShippingThresholdPaise: number;
  standardShippingFeePaise: number;
  taxPercent: number;
  isCodEnabled: boolean;
  isRazorpayEnabled: boolean;
  isAiEnabled: boolean;
  aboutStory: string;
  shippingPolicy: string;
  returnPolicy: string;
  privacyPolicy: string;
  termsAndConditions: string;
  legalBusinessName?: string;
  gstin?: string;
  pan?: string;
  invoicePrefix?: string;
  merchantUpiId?: string;
  merchantWhatsappNumber?: string;
  isUpiManualEnabled?: boolean;
}

export interface ShippingZoneRate {
  id?: string;
  _id?: string;
  zoneName: string;
  pincodePrefix: string;
  baseWeightKg: number;
  baseRate: number;
  perAdditionalKgRate: number;
  estimatedDelivery?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

