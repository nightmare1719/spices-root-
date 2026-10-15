import fs from 'fs';
import path from 'path';
import { 
  IUser, IProduct, ICategory, ICart, IWishlist, 
  IOrder, ICoupon, IReview, IStoreSettings 
} from '../types/index.js';

interface DatabaseCollections {
  users: IUser[];
  products: IProduct[];
  categories: ICategory[];
  carts: ICart[];
  wishlists: IWishlist[];
  orders: IOrder[];
  coupons: ICoupon[];
  reviews: IReview[];
  settings: IStoreSettings;
}

const defaultSettings: IStoreSettings = {
  storeName: "Spice Roots",
  brandTagline: "Authentic Western Ghats & Kerala Spices",
  announcementText: "🌿 Free shipping across India on orders above ₹999 | Sourced fresh from Munnar & Western Ghats",
  supportEmail: "care@spiceroots.in",
  supportPhone: "+91 94882 12345",
  businessAddress: "Kalaivani Spices & Plantation Depot, Post Office Junction, Munnar, Idukki District, Kerala - 685612",
  currencySymbol: "₹",
  freeShippingThresholdPaise: 99900,
  standardShippingFeePaise: 6000,
  taxPercent: 5,
  isCodEnabled: true,
  isRazorpayEnabled: true,
  isAiEnabled: true,
  aboutStory: "Founded amidst the mist-clad hills of Munnar and the lush slopes of the Western Ghats, Spice Roots (Kalaivani Spices) connects generational spice planters with kitchens that revere authenticity. Each peppercorn, cardamom pod, and hand-rolled cinnamon quill is selected for peak essential oil content, zero adulteration, and traditional sun-drying practices.",
  shippingPolicy: "Orders are dispatched within 24-48 business hours via trusted courier partners (Blue Dart, DTDC, India Post). Standard delivery timeline is 3-6 business days across India. Tracking details are emailed and accessible on our tracking page as soon as your shipment is picked up.",
  returnPolicy: "Because spices and food products are perishable and consumable goods, we accept returns or replacements within 7 days of delivery only for items received in damaged condition, defective packaging, or incorrect products sent. Please reach out to care@spiceroots.in with photos of the package.",
  privacyPolicy: "We respect your personal privacy. Customer information including address, phone number, and email are solely utilized to fulfill your orders, process payments securely, and send order updates. We never sell, rent, or lease customer data to third-party marketing services.",
  termsAndConditions: "By using Spice Roots, you agree to these terms. Prices are listed in Indian Rupees (INR) inclusive of applicable taxes. Order cancellation is supported prior to dispatch. Products are subject to seasonal availability from our plantation harvests."
};

class DataStore {
  private dataDir: string;
  private filePath: string;
  private inMemory: DatabaseCollections;
  private isLoaded: boolean = false;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, 'store.json');
    this.inMemory = {
      users: [],
      products: [],
      categories: [],
      carts: [],
      wishlists: [],
      orders: [],
      coupons: [],
      reviews: [],
      settings: defaultSettings
    };
  }

  public init() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.inMemory = {
          ...this.inMemory,
          ...parsed,
          settings: { ...defaultSettings, ...(parsed.settings || {}) }
        };
      } else {
        this.save();
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('DataStore initialization warning, using memory state:', err);
      this.isLoaded = true;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.inMemory, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to store.json:', err);
    }
  }

  // --- USERS ---
  public getUsers() { this.init(); return this.inMemory.users; }
  public findUserByEmail(email: string) {
    this.init();
    return this.inMemory.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  public findUserById(id: string) {
    this.init();
    return this.inMemory.users.find(u => u.id === id || u._id === id);
  }
  public createUser(user: IUser) {
    this.init();
    const id = user.id || user._id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newUser: IUser = { ...user, id, _id: id, createdAt: user.createdAt || now, updatedAt: now };
    this.inMemory.users.push(newUser);
    this.save();
    return newUser;
  }
  public updateUser(id: string, updates: Partial<IUser>) {
    this.init();
    const index = this.inMemory.users.findIndex(u => u.id === id || u._id === id);
    if (index === -1) return null;
    this.inMemory.users[index] = { 
      ...this.inMemory.users[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.save();
    return this.inMemory.users[index];
  }

  // --- PRODUCTS ---
  public getProducts() { this.init(); return this.inMemory.products; }
  public findProductById(id: string) {
    this.init();
    return this.inMemory.products.find(p => p.id === id || p._id === id);
  }
  public findProductBySlug(slug: string) {
    this.init();
    return this.inMemory.products.find(p => p.slug === slug);
  }
  public createProduct(product: IProduct) {
    this.init();
    const id = product.id || product._id || 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newProduct: IProduct = { ...product, id, _id: id, createdAt: now, updatedAt: now };
    this.inMemory.products.push(newProduct);
    this.save();
    return newProduct;
  }
  public updateProduct(id: string, updates: Partial<IProduct>) {
    this.init();
    const index = this.inMemory.products.findIndex(p => p.id === id || p._id === id);
    if (index === -1) return null;
    this.inMemory.products[index] = { 
      ...this.inMemory.products[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.save();
    return this.inMemory.products[index];
  }
  public deleteProduct(id: string) {
    this.init();
    const index = this.inMemory.products.findIndex(p => p.id === id || p._id === id);
    if (index === -1) return false;
    this.inMemory.products.splice(index, 1);
    this.save();
    return true;
  }
  public setProducts(products: IProduct[]) {
    this.init();
    this.inMemory.products = products;
    this.save();
  }

  // --- CATEGORIES ---
  public getCategories() { this.init(); return this.inMemory.categories; }
  public setCategories(categories: ICategory[]) {
    this.init();
    this.inMemory.categories = categories;
    this.save();
  }

  // --- CARTS ---
  public getCart(identifier: { userId?: string; guestId?: string }) {
    this.init();
    return this.inMemory.carts.find(c => 
      (identifier.userId && c.userId === identifier.userId) ||
      (identifier.guestId && c.guestId === identifier.guestId)
    );
  }
  public saveCart(cart: ICart) {
    this.init();
    const index = this.inMemory.carts.findIndex(c => 
      (cart.userId && c.userId === cart.userId) ||
      (cart.guestId && c.guestId === cart.guestId)
    );
    const id = cart.id || cart._id || 'cart_' + Date.now();
    const updated = { ...cart, id, _id: id, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      this.inMemory.carts[index] = updated;
    } else {
      this.inMemory.carts.push(updated);
    }
    this.save();
    return updated;
  }
  public clearCart(identifier: { userId?: string; guestId?: string }) {
    this.init();
    const index = this.inMemory.carts.findIndex(c => 
      (identifier.userId && c.userId === identifier.userId) ||
      (identifier.guestId && c.guestId === identifier.guestId)
    );
    if (index >= 0) {
      this.inMemory.carts.splice(index, 1);
      this.save();
    }
  }

  // --- WISHLIST ---
  public getWishlist(identifier: { userId?: string; guestId?: string }) {
    this.init();
    return this.inMemory.wishlists.find(w => 
      (identifier.userId && w.userId === identifier.userId) ||
      (identifier.guestId && w.guestId === identifier.guestId)
    );
  }
  public saveWishlist(wishlist: IWishlist) {
    this.init();
    const index = this.inMemory.wishlists.findIndex(w => 
      (wishlist.userId && w.userId === wishlist.userId) ||
      (wishlist.guestId && w.guestId === wishlist.guestId)
    );
    const id = wishlist.id || wishlist._id || 'wish_' + Date.now();
    const updated = { ...wishlist, id, _id: id, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      this.inMemory.wishlists[index] = updated;
    } else {
      this.inMemory.wishlists.push(updated);
    }
    this.save();
    return updated;
  }

  // --- ORDERS ---
  public getOrders() { this.init(); return this.inMemory.orders; }
  public findOrderById(id: string) {
    this.init();
    return this.inMemory.orders.find(o => o.id === id || o._id === id || o.orderNumber === id);
  }
  public findOrdersByUser(userId: string) {
    this.init();
    return this.inMemory.orders.filter(o => o.userId === userId);
  }
  public findOrderByGuest(orderNumber: string, emailOrPhone: string) {
    this.init();
    const cleanLookup = emailOrPhone.trim().toLowerCase();
    const lookupDigits = cleanLookup.replace(/\D/g, '');
    return this.inMemory.orders.find(o => {
      if (o.orderNumber.toUpperCase() !== orderNumber.trim().toUpperCase()) return false;
      if (o.customerEmail.toLowerCase() === cleanLookup) return true;
      if (lookupDigits.length >= 6) {
        const orderPhoneDigits = o.customerPhone.replace(/\D/g, '');
        return orderPhoneDigits.endsWith(lookupDigits) || lookupDigits.endsWith(orderPhoneDigits);
      }
      return false;
    });
  }
  public createOrder(order: IOrder) {
    this.init();
    const id = order.id || order._id || 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newOrder: IOrder = { ...order, id, _id: id, createdAt: now, updatedAt: now };
    this.inMemory.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }
  public updateOrder(id: string, updates: Partial<IOrder>) {
    this.init();
    const index = this.inMemory.orders.findIndex(o => o.id === id || o._id === id || o.orderNumber === id);
    if (index === -1) return null;
    this.inMemory.orders[index] = { 
      ...this.inMemory.orders[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.save();
    return this.inMemory.orders[index];
  }

  // --- COUPONS ---
  public getCoupons() { this.init(); return this.inMemory.coupons; }
  public findCouponByCode(code: string) {
    this.init();
    return this.inMemory.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  }
  public createCoupon(coupon: ICoupon) {
    this.init();
    const id = coupon.id || coupon._id || 'cpn_' + Date.now();
    const newCoupon: ICoupon = { ...coupon, id, _id: id };
    this.inMemory.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }
  public updateCoupon(id: string, updates: Partial<ICoupon>) {
    this.init();
    const index = this.inMemory.coupons.findIndex(c => c.id === id || c._id === id);
    if (index === -1) return null;
    this.inMemory.coupons[index] = { ...this.inMemory.coupons[index], ...updates };
    this.save();
    return this.inMemory.coupons[index];
  }
  public deleteCoupon(id: string) {
    this.init();
    const index = this.inMemory.coupons.findIndex(c => c.id === id || c._id === id);
    if (index === -1) return false;
    this.inMemory.coupons.splice(index, 1);
    this.save();
    return true;
  }
  public setCoupons(coupons: ICoupon[]) {
    this.init();
    this.inMemory.coupons = coupons;
    this.save();
  }

  // --- REVIEWS ---
  public getReviews(productId?: string) {
    this.init();
    if (productId) {
      return this.inMemory.reviews.filter(r => r.productId === productId);
    }
    return this.inMemory.reviews;
  }
  public createReview(review: IReview) {
    this.init();
    const id = review.id || review._id || 'rev_' + Date.now();
    const newRev = { ...review, id, _id: id, createdAt: new Date().toISOString() };
    this.inMemory.reviews.push(newRev);
    this.save();
    return newRev;
  }

  // --- SETTINGS ---
  public getSettings() {
    this.init();
    return this.inMemory.settings;
  }
  public updateSettings(updates: Partial<IStoreSettings>) {
    this.init();
    this.inMemory.settings = { ...this.inMemory.settings, ...updates };
    this.save();
    return this.inMemory.settings;
  }
}

export const db = new DataStore();
