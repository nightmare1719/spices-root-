export interface IProductVariant {
  id: string;
  sku: string;
  packSize: string;
  unit: string;
  pricePaise: number;
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
  id: string;
  _id?: string;
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
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  itemCount?: number;
}

export interface ICartItem {
  productId: string;
  productName: string;
  productSlug: string;
  image: string;
  variantId: string;
  packSize: string;
  unitPricePaise: number;
  comparePricePaise?: number;
  quantity: number;
  maxStock: number;
  lineTotalPaise: number;
}

export interface ICartCalculation {
  items: ICartItem[];
  subtotalPaise: number;
  qualifiesForFreeShipping: boolean;
  freeShippingThresholdPaise: number;
  freeShippingRemainingPaise: number;
}

export interface IUserAddress {
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
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  addresses: IUserAddress[];
}

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

export type OrderFulfillmentStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface IOrderStatusHistory {
  status: OrderFulfillmentStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface IOrder {
  id: string;
  _id?: string;
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
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  fulfillmentStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  courierName?: string;
  trackingNumber?: string;
  statusHistory: IOrderStatusHistory[];
  createdAt: string;
}

export interface IStoreSettings {
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
}

export interface IReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ICouponValidation {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountPaise: number;
  minOrderValuePaise: number;
}

export interface ICoupon {
  id?: string;
  _id?: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValuePaise: number;
  maxDiscountPaise?: number;
  expiryDate?: string;
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
}
