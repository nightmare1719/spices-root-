import { Request, Response } from 'express';
import { db } from '../models/dataStore.js';
import { IProduct, IOrder, ICoupon, OrderFulfillmentStatus } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getDashboardMetrics(_req: Request, res: Response) {
  try {
    const orders = db.getOrders();
    const products = db.getProducts();
    const customers = db.getUsers().filter(u => u.role === 'customer');

    // Revenue calculation from paid/confirmed orders
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid' || o.paymentMethod === 'cod');
    const totalSalesPaise = paidOrders.reduce((sum, o) => sum + o.priceBreakdown.totalPaise, 0);

    const pendingOrdersCount = orders.filter(o => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'confirmed').length;
    const processingOrdersCount = orders.filter(o => o.fulfillmentStatus === 'processing').length;
    const shippedOrdersCount = orders.filter(o => o.fulfillmentStatus === 'shipped').length;
    const deliveredOrdersCount = orders.filter(o => o.fulfillmentStatus === 'delivered').length;

    // Inventory alerts: variants with stock <= 15
    const lowStockAlerts: { productName: string; variantPackSize: string; stock: number; sku: string }[] = [];
    for (const prod of products) {
      for (const v of prod.variants) {
        if (v.stock <= 15) {
          lowStockAlerts.push({
            productName: prod.name,
            variantPackSize: v.packSize,
            stock: v.stock,
            sku: v.sku
          });
        }
      }
    }

    // Bestselling products aggregated from orders
    const salesByProduct: Record<string, { name: string; quantity: number; revenuePaise: number }> = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (!salesByProduct[item.productId]) {
          salesByProduct[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenuePaise: 0
          };
        }
        salesByProduct[item.productId].quantity += item.quantity;
        salesByProduct[item.productId].revenuePaise += item.lineTotalPaise;
      }
    }
    const bestsellers = Object.values(salesByProduct)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Recent 6 orders
    const recentOrders = orders.slice(0, 6);

    return res.json({
      success: true,
      data: {
        totalRevenuePaise: totalSalesPaise,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        pendingOrdersCount,
        processingOrdersCount,
        shippedOrdersCount,
        deliveredOrdersCount,
        lowStockAlerts,
        bestsellers,
        recentOrders
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics', error: (err as Error).message });
  }
}

// --- PRODUCTS ---
export async function getAdminProducts(req: Request, res: Response) {
  try {
    const { search, category } = req.query;
    let products = db.getProducts();

    if (category && category !== 'all') {
      products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.variants.some(v => v.sku.toLowerCase().includes(q)));
    }

    return res.json({ success: true, data: products });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve products', error: (err as Error).message });
  }
}

export async function createAdminProduct(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!body.name || !body.category || !body.variants || !body.variants.length) {
      return res.status(400).json({ success: false, message: 'Product name, category, and at least one variant are required.' });
    }

    const slug = (body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) + '-' + Math.floor(100 + Math.random() * 900);
    const newProduct = db.createProduct({
      ...body,
      slug: body.slug || slug,
      isPublished: body.isPublished !== undefined ? body.isPublished : true,
      isFeatured: body.isFeatured || false,
      rating: body.rating || 5.0,
      reviewCount: body.reviewCount || 0,
      images: body.images && body.images.length ? body.images : ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80']
    });

    return res.status(201).json({ success: true, data: newProduct, message: 'Product created successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create product', error: (err as Error).message });
  }
}

export async function updateAdminProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = db.updateProduct(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, data: updated, message: 'Product updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update product', error: (err as Error).message });
  }
}

export async function deleteAdminProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const ok = db.deleteProduct(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete product', error: (err as Error).message });
  }
}

// --- ORDERS ---
export async function getAdminOrders(req: Request, res: Response) {
  try {
    const { status, search } = req.query;
    let orders = db.getOrders();

    if (status && status !== 'all') {
      orders = orders.filter(o => o.fulfillmentStatus === status || o.paymentStatus === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      orders = orders.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }

    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders', error: (err as Error).message });
  }
}

export async function updateAdminOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { fulfillmentStatus, paymentStatus, courierName, trackingNumber, note } = req.body;

    const order = db.findOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const updates: Partial<IOrder> = {};
    if (fulfillmentStatus) updates.fulfillmentStatus = fulfillmentStatus as OrderFulfillmentStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (courierName !== undefined) updates.courierName = courierName;
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;

    const newHistory = [
      ...order.statusHistory,
      {
        status: (fulfillmentStatus as OrderFulfillmentStatus) || order.fulfillmentStatus,
        timestamp: new Date().toISOString(),
        note: note || `Updated by Admin (${req.user?.name || 'Administrator'})`,
        updatedBy: req.user?.name
      }
    ];
    updates.statusHistory = newHistory;

    const updated = db.updateOrder(order.id || id, updates);
    return res.json({ success: true, data: updated, message: 'Order status updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update order status', error: (err as Error).message });
  }
}

// --- COUPONS ---
export async function getAdminCoupons(_req: Request, res: Response) {
  try {
    const coupons = db.getCoupons();
    return res.json({ success: true, data: coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve coupons', error: (err as Error).message });
  }
}

export async function createAdminCoupon(req: Request, res: Response) {
  try {
    const { code, discountType, discountValue, minOrderValuePaise, maxDiscountPaise, expiryDate, usageLimit, isActive } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code, type, and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.findCouponByCode(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A coupon with this code already exists.' });
    }

    const newCoupon = db.createCoupon({
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderValuePaise: Number(minOrderValuePaise) || 0,
      maxDiscountPaise: maxDiscountPaise ? Number(maxDiscountPaise) : undefined,
      expiryDate: expiryDate || new Date(Date.now() + 365 * 86400000).toISOString(),
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      timesUsed: 0,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({ success: true, data: newCoupon, message: 'Coupon created successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create coupon', error: (err as Error).message });
  }
}

export async function updateAdminCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = db.updateCoupon(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    return res.json({ success: true, data: updated, message: 'Coupon updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update coupon', error: (err as Error).message });
  }
}

export async function deleteAdminCoupon(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const ok = db.deleteCoupon(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    return res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete coupon', error: (err as Error).message });
  }
}

// --- CUSTOMERS ---
export async function getAdminCustomers(_req: Request, res: Response) {
  try {
    const customers = db.getUsers().filter(u => u.role === 'customer');
    const orders = db.getOrders();

    const customerStats = customers.map(c => {
      const userOrders = orders.filter(o => o.userId === c.id || o.customerEmail.toLowerCase() === c.email.toLowerCase());
      const totalSpentPaise = userOrders
        .filter(o => o.paymentStatus === 'paid' || o.paymentMethod === 'cod')
        .reduce((sum, o) => sum + o.priceBreakdown.totalPaise, 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalOrders: userOrders.length,
        totalSpentPaise,
        joinedAt: c.createdAt,
        addressesCount: c.addresses.length
      };
    });

    return res.json({ success: true, data: customerStats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve customers', error: (err as Error).message });
  }
}

// --- SETTINGS ---
export async function getAdminSettings(_req: Request, res: Response) {
  try {
    const settings = db.getSettings();
    return res.json({
      success: true,
      data: {
        ...settings,
        systemStatus: {
          isGeminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10),
          isRazorpayLive: Boolean(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('demo')),
          databaseMode: process.env.MONGODB_URI ? 'MongoDB Atlas / Local' : 'Embedded Persistent Store'
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings', error: (err as Error).message });
  }
}

export async function updateAdminSettings(req: Request, res: Response) {
  try {
    const updates = req.body;
    const updated = db.updateSettings(updates);
    return res.json({ success: true, data: updated, message: 'Store settings updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update settings', error: (err as Error).message });
  }
}

// --- CSV EXPORT & IMPORT ---
export async function exportProductsCsv(_req: Request, res: Response) {
  try {
    const products = db.getProducts();
    const rows = ['Name,Category,SKU,PackSize,PriceINR,Stock,IsPublished'];

    for (const p of products) {
      for (const v of p.variants) {
        rows.push(`"${p.name}","${p.category}","${v.sku}","${v.packSize}",${(v.pricePaise / 100).toFixed(2)},${v.stock},${p.isPublished}`);
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="spiceroots_products.csv"');
    return res.send(rows.join('\n'));
  } catch (err) {
    return res.status(500).json({ success: false, message: 'CSV export failed', error: (err as Error).message });
  }
}
