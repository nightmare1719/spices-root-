import { Request, Response } from 'express';
import { db } from '../models/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createRazorpayOrder, verifyRazorpaySignature, getRazorpayPublicConfig } from '../services/razorpay.js';
import { IOrderItemSnapshot, IUserAddress, IOrder } from '../types/index.js';
import { generateUpiPaymentDetails, getMerchantUpiConfig } from '../services/upiService.js';
import { calculateTotalWeightInGrams, calculateTotalWeight } from '../utils/weight.js';

function validateIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

function validatePincode(pincode: string): boolean {
  const digits = pincode.replace(/\D/g, '');
  return digits.length === 6;
}

interface QuoteParams {
  items: { productId: string; variantId: string; quantity: number }[];
  couponCode?: string;
  pincode?: string;
}

export interface QuoteSuccess {
  success: true;
  error?: undefined;
  snapshots: IOrderItemSnapshot[];
  priceBreakdown: {
    subtotalPaise: number;
    discountPaise: number;
    shippingFeePaise: number;
    taxPaise: number;
    totalPaise: number;
  };
  appliedCouponCode?: string;
  qualifiesForFreeShipping: boolean;
  freeShippingThresholdPaise: number;
  shippingDetails?: {
    zoneName: string;
    pincode: string;
    totalWeightGrams: number;
    formattedWeight: string;
    baseWeightKg: number;
    baseRate: number;
    perAdditionalKgRate: number;
    extraKg: number;
    shippingFeeINR: number;
    shippingFeePaise: number;
    estimatedDelivery: string;
  };
  errors: string[];
}

export interface QuoteError {
  success: false;
  error: string;
  errors: string[];
  snapshots?: undefined;
  priceBreakdown?: undefined;
}

export type QuoteResult = QuoteSuccess | QuoteError;

export function computeVerifiedQuote(params: QuoteParams): QuoteResult {
  const settings = db.getSettings();
  let subtotalPaise = 0;
  const verifiedSnapshots: IOrderItemSnapshot[] = [];
  const errors: string[] = [];

  for (const item of params.items) {
    const product = db.findProductById(item.productId);
    if (!product || !product.isPublished) {
      errors.push(`Item with ID ${item.productId} is no longer available.`);
      continue;
    }

    const variant = product.variants.find(v => v.id === item.variantId);
    if (!variant || !variant.isAvailable) {
      errors.push(`Variant for "${product.name}" is no longer available.`);
      continue;
    }

    if (variant.stock < item.quantity) {
      errors.push(`"${product.name} (${variant.packSize})" has only ${variant.stock} units remaining.`);
      continue;
    }

    const unitPricePaise = variant.pricePaise;
    const lineTotalPaise = unitPricePaise * item.quantity;
    subtotalPaise += lineTotalPaise;

    verifiedSnapshots.push({
      productId: product.id || '',
      productName: product.name,
      productSlug: product.slug,
      variantId: variant.id,
      sku: variant.sku,
      packSize: variant.packSize,
      unitPricePaise,
      quantity: item.quantity,
      lineTotalPaise,
      image: product.images[0] || ''
    });
  }

  if (verifiedSnapshots.length === 0) {
    return { success: false, error: 'Your cart contains no available items.', errors };
  }

  // Calculate Coupon discount
  let discountPaise = 0;
  let appliedCouponCode: string | undefined = undefined;

  if (params.couponCode && params.couponCode.trim()) {
    const coupon = db.findCouponByCode(params.couponCode);
    if (coupon && coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) >= new Date())) {
      if (subtotalPaise >= coupon.minOrderValuePaise) {
        if (coupon.discountType === 'percent') {
          discountPaise = Math.round((subtotalPaise * coupon.discountValue) / 100);
          if (coupon.maxDiscountPaise && discountPaise > coupon.maxDiscountPaise) {
            discountPaise = coupon.maxDiscountPaise;
          }
        } else {
          discountPaise = Math.min(coupon.discountValue, subtotalPaise);
        }
        appliedCouponCode = coupon.code;
      }
    }
  }

  // Total package weight calculated from verified order items (e.g. 50g, 250g, 500g, 1kg)
  const totalWeightGrams = calculateTotalWeightInGrams(verifiedSnapshots);
  const formattedWeight = calculateTotalWeight(verifiedSnapshots);

  // In adminlogisticspage the total amount of courier is the shipping charge for the customer.
  // Weight + Distance (destination pincode zone) = Shipping Charges.
  const shippingInfo = db.getShippingDetails(params.pincode || '', totalWeightGrams);
  const freeShippingThresholdPaise = Number(settings.freeShippingThresholdPaise) || 99900;
  const qualifiesForFreeShipping = subtotalPaise >= freeShippingThresholdPaise;
  const shippingFeePaise = qualifiesForFreeShipping ? 0 : shippingInfo.shippingChargePaise;

  // Calculate Tax (e.g. 5% GST inclusive / calculated)
  const taxableAmount = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = Math.round((taxableAmount * (settings.taxPercent || 0)) / 100);

  const grandTotalPaise = taxableAmount + shippingFeePaise + taxPaise;

  return {
    success: true,
    snapshots: verifiedSnapshots,
    priceBreakdown: {
      subtotalPaise,
      discountPaise,
      shippingFeePaise,
      taxPaise,
      totalPaise: grandTotalPaise
    },
    appliedCouponCode,
    qualifiesForFreeShipping,
    freeShippingThresholdPaise,
    shippingDetails: {
      zoneName: shippingInfo.zoneName,
      pincode: shippingInfo.pincode,
      totalWeightGrams: shippingInfo.totalWeightGrams,
      formattedWeight,
      baseWeightKg: shippingInfo.baseWeightKg,
      baseRate: shippingInfo.baseRate,
      perAdditionalKgRate: shippingInfo.perAdditionalKgRate,
      extraKg: shippingInfo.extraKg,
      shippingFeeINR: shippingInfo.shippingChargeINR,
      shippingFeePaise,
      estimatedDelivery: shippingInfo.estimatedDelivery
    },
    errors
  };
}

export async function calculateQuote(req: Request, res: Response) {
  try {
    const { items, couponCode, pincode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required for quote.' });
    }

    const result = computeVerifiedQuote({ items, couponCode, pincode });
    if (!result.success || result.error) {
      return res.status(400).json({ success: false, message: result.error, errors: result.errors });
    }

    return res.json({
      success: true,
      data: {
        priceBreakdown: result.priceBreakdown,
        appliedCouponCode: result.appliedCouponCode,
        qualifiesForFreeShipping: result.qualifiesForFreeShipping,
        freeShippingThresholdPaise: result.freeShippingThresholdPaise,
        shippingDetails: result.shippingDetails,
        itemCount: result.snapshots.length,
        errors: result.errors
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to calculate quote', error: (err as Error).message });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { 
      items, 
      couponCode, 
      shippingAddress, 
      customerEmail, 
      customerName, 
      customerPhone,
      paymentMethod,
      deliveryNotes 
    } = req.body;

    // Validate Contact Details
    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required for order updates.' });
    }
    if (!customerName || customerName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide recipient full name.' });
    }
    if (!customerPhone || !validateIndianPhone(customerPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // Validate Address
    if (!shippingAddress || !shippingAddress.addressLine || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Complete delivery address and PIN code are required.' });
    }
    if (!validatePincode(shippingAddress.pincode)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit Indian PIN code.' });
    }

    // Server-side recalculate and verify all items & shipping rate for destination pincode
    const quote = computeVerifiedQuote({ 
      items, 
      couponCode, 
      pincode: shippingAddress.pincode 
    });
    if (!quote.success || quote.error) {
      return res.status(400).json({ success: false, message: quote.error, errors: quote.errors });
    }

    const settings = db.getSettings();
    let chosenMethod: 'upi_manual' | 'razorpay' | 'cod' = 'upi_manual';
    if (paymentMethod === 'cod' && settings.isCodEnabled) {
      chosenMethod = 'cod';
    } else if (paymentMethod === 'razorpay' && settings.isRazorpayEnabled) {
      chosenMethod = 'razorpay';
    } else {
      chosenMethod = 'upi_manual';
    }

    // Generate unique order number
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `SR-${new Date().getFullYear()}-${randomSuffix}`;

    const initialPaymentStatus = chosenMethod === 'upi_manual' ? 'AWAITING_PAYMENT' : 'pending';
    const initialFulfillmentStatus = chosenMethod === 'cod' ? 'confirmed' : 'pending';

    const orderData: IOrder = {
      orderNumber,
      userId: req.user?.id || req.user?._id,
      customerEmail: customerEmail.trim().toLowerCase(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      shippingAddress: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        addressLine: shippingAddress.addressLine.trim(),
        landmark: shippingAddress.landmark ? shippingAddress.landmark.trim() : '',
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim()
      },
      items: quote.snapshots,
      priceBreakdown: quote.priceBreakdown,
      couponCode: quote.appliedCouponCode,
      deliveryNotes: deliveryNotes ? deliveryNotes.trim() : undefined,
      paymentMethod: chosenMethod,
      paymentStatus: initialPaymentStatus,
      fulfillmentStatus: initialFulfillmentStatus,
      statusHistory: [
        { 
          status: initialFulfillmentStatus, 
          timestamp: new Date().toISOString(), 
          note: chosenMethod === 'cod' 
            ? 'Order placed with Cash on Delivery' 
            : chosenMethod === 'upi_manual'
            ? 'Order created for Direct UPI payment. Awaiting customer transfer.'
            : 'Order created, awaiting payment verification' 
        }
      ],
      paymentAuditLogs: [
        {
          previousStatus: 'CREATED',
          newStatus: initialPaymentStatus,
          timestamp: new Date().toISOString(),
          changedBy: 'system',
          note: `Order initialized with payment method: ${chosenMethod}`
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Decrement stock for confirmed items
    for (const snap of quote.snapshots) {
      const prod = db.findProductById(snap.productId);
      if (prod) {
        const vIndex = prod.variants.findIndex(v => v.id === snap.variantId);
        if (vIndex >= 0) {
          prod.variants[vIndex].stock = Math.max(0, prod.variants[vIndex].stock - snap.quantity);
          if (prod.variants[vIndex].stock === 0) {
            prod.variants[vIndex].isAvailable = false;
          }
          db.updateProduct(prod.id || '', { variants: prod.variants });
        }
      }
    }

    // If coupon was applied, increment timesUsed
    if (quote.appliedCouponCode) {
      const cpn = db.findCouponByCode(quote.appliedCouponCode);
      if (cpn) {
        db.updateCoupon(cpn.id || '', { timesUsed: (cpn.timesUsed || 0) + 1 });
      }
    }

    // Low-Cost Manual UPI Flow (Direct to cynalbertoz@sbi)
    if (chosenMethod === 'upi_manual') {
      const createdOrder = db.createOrder(orderData);
      const upiDetails = await generateUpiPaymentDetails(orderNumber, quote.priceBreakdown.totalPaise);

      return res.json({
        success: true,
        message: 'Order created for direct UPI transfer.',
        data: {
          order: createdOrder,
          paymentMethod: 'upi_manual',
          upi: upiDetails
        }
      });
    }

    // Razorpay Flow
    if (chosenMethod === 'razorpay') {
      const rzpOrder = await createRazorpayOrder({
        amountPaise: quote.priceBreakdown.totalPaise,
        receipt: orderNumber,
        notes: {
          customerEmail,
          customerName,
          orderNumber
        }
      });

      orderData.razorpayOrderId = rzpOrder.orderId;
      const createdOrder = db.createOrder(orderData);

      return res.json({
        success: true,
        data: {
          order: createdOrder,
          paymentMethod: 'razorpay',
          razorpay: {
            orderId: rzpOrder.orderId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: rzpOrder.keyId,
            isTestSandbox: rzpOrder.isTestSandbox,
            customerName,
            customerEmail,
            customerPhone
          }
        }
      });
    }

    // COD Flow
    const createdOrder = db.createOrder(orderData);
    return res.json({
      success: true,
      message: 'Order placed successfully via Cash on Delivery.',
      data: {
        order: createdOrder,
        paymentMethod: 'cod'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create order', error: (err as Error).message });
  }
}

export async function submitUpiPayment(req: Request, res: Response) {
  try {
    const { orderNumber, upiTransactionRef, customerNotes } = req.body;
    if (!orderNumber || !String(orderNumber).trim()) {
      return res.status(400).json({ success: false, message: 'Order reference number is required.' });
    }

    const order = db.findOrderById(orderNumber.trim());
    if (!order) {
      return res.status(404).json({ success: false, message: `Order with reference "${orderNumber}" was not found.` });
    }

    // If order is already paid, prevent duplicate submission
    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ 
        success: false, 
        message: 'This order has already been verified and marked as Paid by the store administrator.' 
      });
    }

    const now = new Date().toISOString();
    const cleanUtr = upiTransactionRef ? String(upiTransactionRef).trim() : undefined;
    const screenshotFilename = req.file ? req.file.filename : undefined;

    const previousStatus = order.paymentStatus;
    const newStatus = 'VERIFICATION_PENDING';

    const auditLogs = order.paymentAuditLogs || [];
    auditLogs.push({
      previousStatus,
      newStatus,
      timestamp: now,
      changedBy: 'customer',
      note: customerNotes ? String(customerNotes).trim() : 'Customer submitted payment details on checkout',
      utr: cleanUtr
    });

    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: 'processing',
      timestamp: now,
      note: `Customer submitted payment details (UTR: ${cleanUtr || 'Screenshot attached'}). Payment Verification Pending.`
    });

    const updated = db.updateOrder(order.id || order.orderNumber, {
      paymentStatus: newStatus,
      upiTransactionRef: cleanUtr || order.upiTransactionRef,
      screenshotPath: screenshotFilename || order.screenshotPath,
      paymentSubmittedAt: now,
      paymentAuditLogs: auditLogs,
      statusHistory
    });

    const upiDetails = await generateUpiPaymentDetails(order.orderNumber, order.priceBreakdown.totalPaise);

    return res.json({
      success: true,
      message: 'Payment submission received. Status updated to Payment Verification Pending.',
      data: {
        order: updated,
        upi: upiDetails
      }
    });
  } catch (err) {
    console.error('Error submitting UPI payment:', err);
    return res.status(500).json({ success: false, message: 'Failed to process UPI payment submission.', error: (err as Error).message });
  }
}

export async function getUpiPaymentInfo(req: Request, res: Response) {
  try {
    const { orderNumber } = req.params;
    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'Order reference is required.' });
    }

    const order = db.findOrderById(orderNumber.trim());
    if (!order) {
      return res.status(404).json({ success: false, message: `Order "${orderNumber}" was not found.` });
    }

    const upiDetails = await generateUpiPaymentDetails(order.orderNumber, order.priceBreakdown.totalPaise);

    return res.json({
      success: true,
      data: {
        order,
        upi: upiDetails
      }
    });
  } catch (err) {
    console.error('Error getting UPI payment info:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve UPI payment details.', error: (err as Error).message });
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'Missing order ID or payment ID for verification.' });
    }

    const order = db.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order record not found.' });
    }

    if (order.paymentStatus === 'paid' || order.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Payment already verified.', data: { order } });
    }

    const isValid = verifyRazorpaySignature(
      razorpayOrderId || order.razorpayOrderId || '',
      razorpayPaymentId,
      razorpaySignature || ''
    );

    if (!isValid) {
      db.updateOrder(order.id || '', {
        paymentStatus: 'failed',
        statusHistory: [
          ...order.statusHistory,
          { status: 'pending', timestamp: new Date().toISOString(), note: 'Payment verification failed' }
        ]
      });
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    // Update order to paid & confirmed
    const updated = db.updateOrder(order.id || '', {
      paymentStatus: 'paid',
      fulfillmentStatus: 'confirmed',
      razorpayPaymentId,
      razorpaySignature,
      statusHistory: [
        ...order.statusHistory,
        { status: 'confirmed', timestamp: new Date().toISOString(), note: `Paid ₹${(order.priceBreakdown.totalPaise / 100).toFixed(2)} via Razorpay (${razorpayPaymentId})` }
      ]
    });

    return res.json({
      success: true,
      message: 'Payment verified successfully! Order is confirmed.',
      data: { order: updated }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Payment verification error', error: (err as Error).message });
  }
}

export async function getPaymentConfig(_req: Request, res: Response) {
  const config = getRazorpayPublicConfig();
  const settings = db.getSettings();
  const upiConfig = getMerchantUpiConfig();

  return res.json({
    success: true,
    data: {
      ...config,
      // COD and Razorpay are temporarily hidden for both admin and customer (can be reactivated later)
      isCodEnabled: false,
      isRazorpayEnabled: false,
      isUpiManualEnabled: true,
      upi: {
        upiId: upiConfig.upiId,
        merchantName: upiConfig.merchantName,
        whatsappNumber: upiConfig.whatsappNumber
      },
      freeShippingThresholdPaise: settings.freeShippingThresholdPaise,
      standardShippingFeePaise: settings.standardShippingFeePaise,
      taxPercent: settings.taxPercent
    }
  });
}
