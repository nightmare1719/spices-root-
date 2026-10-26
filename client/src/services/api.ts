import { getGuestId } from '../utils/format.js';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('spiceroots_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-guest-id': getGuestId()
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  if (options.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // --- Products & Categories ---
  getProducts: (params?: { 
    category?: string; 
    search?: string; 
    sort?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    inStock?: boolean; 
    featured?: boolean;
    page?: number; 
    limit?: number 
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.set(k, String(v));
        }
      });
    }
    return request<any>(`/products?${query.toString()}`);
  },

  getProductBySlug: (slug: string) => request<any>(`/products/${slug}`),
  getCategories: () => request<any>('/categories'),
  addReview: (productId: string, review: { customerName: string; rating: number; comment: string }) => 
    request<any>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review)
    }),

  // --- Cart ---
  getCart: () => request<any>('/cart'),
  addToCart: (productId: string, variantId: string, quantity: number = 1) =>
    request<any>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity })
    }),
  updateCartItem: (productId: string, variantId: string, quantity: number) =>
    request<any>('/cart/items', {
      method: 'PATCH',
      body: JSON.stringify({ productId, variantId, quantity })
    }),
  removeCartItem: (productId: string, variantId: string) =>
    request<any>('/cart/items', {
      method: 'DELETE',
      body: JSON.stringify({ productId, variantId })
    }),
  clearCart: () => request<any>('/cart', { method: 'DELETE' }),

  // --- Coupons ---
  validateCoupon: (code: string, cartSubtotalPaise: number) =>
    request<any>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, cartSubtotalPaise })
    }),

  // --- Checkout ---
  calculateQuote: (items: any[], couponCode?: string, pincode?: string) =>
    request<any>('/checkout/quote', {
      method: 'POST',
      body: JSON.stringify({ items, couponCode, pincode })
    }),
  createOrder: (orderPayload: any) =>
    request<any>('/checkout/create-order', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    }),
  submitUpiPayment: (formData: FormData) =>
    request<any>('/checkout/submit-upi-payment', {
      method: 'POST',
      body: formData
    }),
  getUpiPaymentInfo: (orderNumber: string) =>
    request<any>(`/checkout/upi-info/${orderNumber}`),
  verifyPayment: (payload: { orderId: string; razorpayOrderId?: string; razorpayPaymentId: string; razorpaySignature?: string }) =>
    request<any>('/checkout/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getPaymentConfig: () => request<any>('/checkout/payment-config'),

  // --- Orders ---
  getMyOrders: () => request<any>('/orders'),
  getOrderById: (id: string) => request<any>(`/orders/${id}`),
  getOrderInvoice: (id: string) => request<any>(`/orders/${id}/invoice`),
  trackGuestOrder: (orderNumber: string, emailOrPhone: string) =>
    request<any>('/orders/track', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, emailOrPhone })
    }),
  cancelOrder: (id: string, reason?: string) =>
    request<any>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // --- Auth ---
  register: (payload: any) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (payload: any) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getAuthConfig: () => request<any>('/auth/config'),
  googleAuth: (credential: string, guestId?: string) =>
    request<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, guestId })
    }),
  linkGoogle: (credential: string) =>
    request<any>('/auth/google/verify', {
      method: 'POST',
      body: JSON.stringify({ credential })
    }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (payload: any) =>
    request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  changePassword: (payload: any) =>
    request<any>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // --- AI Assistant ---
  sendAssistantMessage: (message: string, history?: any[]) =>
    request<any>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    }),

  // --- Settings ---
  getSettings: () => request<any>('/settings'),

  // --- Admin ---
  admin: {
    getDashboard: () => request<any>('/admin/dashboard'),
    getProducts: (params?: any) => {
      const q = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'all') {
            q.set(k, String(v));
          }
        });
      }
      const qs = q.toString();
      return request<any>(`/admin/products${qs ? `?${qs}` : ''}`);
    },
    createProduct: (data: any) => request<any>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: string, data: any) => request<any>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id: string) => request<any>(`/admin/products/${id}`, { method: 'DELETE' }),
    getOrders: (params?: any) => {
      const q = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'all') {
            q.set(k, String(v));
          }
        });
      }
      const qs = q.toString();
      return request<any>(`/admin/orders${qs ? `?${qs}` : ''}`);
    },
    updateOrderStatus: (id: string, data: any) => request<any>(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    verifyPayment: (id: string, data: { upiTransactionRef?: string; utr?: string; adminNotes?: string; adminNote?: string }) =>
      request<any>(`/admin/orders/${id}/verify-payment`, { 
        method: 'POST', 
        body: JSON.stringify({ 
          ...data,
          utr: data.utr || data.upiTransactionRef,
          upiTransactionRef: data.upiTransactionRef || data.utr,
          adminNote: data.adminNote || data.adminNotes,
          adminNotes: data.adminNotes || data.adminNote
        }) 
      }),
    rejectPayment: (id: string, data: { rejectionReason?: string; reason?: string; adminNotes?: string; adminNote?: string }) =>
      request<any>(`/admin/orders/${id}/reject-payment`, { 
        method: 'POST', 
        body: JSON.stringify({ 
          ...data,
          reason: data.reason || data.rejectionReason,
          rejectionReason: data.rejectionReason || data.reason,
          adminNote: data.adminNote || data.adminNotes,
          adminNotes: data.adminNotes || data.adminNote
        }) 
      }),
    getOrderInvoice: (id: string) => request<any>(`/admin/orders/${id}/invoice`),
    getScreenshotUrl: (id: string) => {
      const token = localStorage.getItem('spiceroots_token') || '';
      return `${API_BASE}/admin/orders/${id}/screenshot?token=${encodeURIComponent(token)}`;
    },
    getCoupons: () => request<any>('/admin/coupons'),
    createCoupon: (data: any) => request<any>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
    updateCoupon: (id: string, data: any) => request<any>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCoupon: (id: string) => request<any>(`/admin/coupons/${id}`, { method: 'DELETE' }),
    getCustomers: () => request<any>('/admin/customers'),
    getSettings: () => request<any>('/admin/settings'),
    updateSettings: (data: any) => request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
    getShippingRates: () => request<any>('/shipping-rates'),
    createShippingRate: (data: any) => request<any>('/shipping-rates', { method: 'POST', body: JSON.stringify(data) }),
    updateShippingRate: (id: string, data: any) => request<any>(`/shipping-rates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteShippingRate: (id: string) => request<any>(`/shipping-rates/${id}`, { method: 'DELETE' }),
    calculateShippingRate: (pincode: string, totalWeightGrams: number) =>
      request<any>('/shipping-rates/calculate', { method: 'POST', body: JSON.stringify({ pincode, totalWeightGrams }) })
  },

  // Public shipping rates
  getShippingRates: () => request<any>('/shipping-rates'),
  calculateShippingRate: (pincode: string, totalWeightGrams: number) =>
    request<any>('/shipping-rates/calculate', { method: 'POST', body: JSON.stringify({ pincode, totalWeightGrams }) })
};
