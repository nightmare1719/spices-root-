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
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
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
  calculateQuote: (items: any[], couponCode?: string) =>
    request<any>('/checkout/quote', {
      method: 'POST',
      body: JSON.stringify({ items, couponCode })
    }),
  createOrder: (orderPayload: any) =>
    request<any>('/checkout/create-order', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    }),
  verifyPayment: (payload: { orderId: string; razorpayOrderId?: string; razorpayPaymentId: string; razorpaySignature?: string }) =>
    request<any>('/checkout/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getPaymentConfig: () => request<any>('/checkout/payment-config'),

  // --- Orders ---
  getMyOrders: () => request<any>('/orders'),
  getOrderById: (id: string) => request<any>(`/orders/${id}`),
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
      const q = new URLSearchParams(params || {}).toString();
      return request<any>(`/admin/products?${q}`);
    },
    createProduct: (data: any) => request<any>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: string, data: any) => request<any>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id: string) => request<any>(`/admin/products/${id}`, { method: 'DELETE' }),
    getOrders: (params?: any) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any>(`/admin/orders?${q}`);
    },
    updateOrderStatus: (id: string, data: any) => request<any>(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    getCoupons: () => request<any>('/admin/coupons'),
    createCoupon: (data: any) => request<any>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
    updateCoupon: (id: string, data: any) => request<any>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCoupon: (id: string) => request<any>(`/admin/coupons/${id}`, { method: 'DELETE' }),
    getCustomers: () => request<any>('/admin/customers'),
    getSettings: () => request<any>('/admin/settings'),
    updateSettings: (data: any) => request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
  }
};
