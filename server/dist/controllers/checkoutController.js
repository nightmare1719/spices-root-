import { db } from '../models/dataStore.js';
import { createRazorpayOrder, verifyRazorpaySignature, getRazorpayPublicConfig } from '../services/razorpay.js';
function validateIndianPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
}
function validatePincode(pincode) {
    const digits = pincode.replace(/\D/g, '');
    return digits.length === 6;
}
export function computeVerifiedQuote(params) {
    const settings = db.getSettings();
    let subtotalPaise = 0;
    const verifiedSnapshots = [];
    const errors = [];
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
    let appliedCouponCode = undefined;
    if (params.couponCode && params.couponCode.trim()) {
        const coupon = db.findCouponByCode(params.couponCode);
        if (coupon && coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) >= new Date())) {
            if (subtotalPaise >= coupon.minOrderValuePaise) {
                if (coupon.discountType === 'percent') {
                    discountPaise = Math.round((subtotalPaise * coupon.discountValue) / 100);
                    if (coupon.maxDiscountPaise && discountPaise > coupon.maxDiscountPaise) {
                        discountPaise = coupon.maxDiscountPaise;
                    }
                }
                else {
                    discountPaise = Math.min(coupon.discountValue, subtotalPaise);
                }
                appliedCouponCode = coupon.code;
            }
        }
    }
    // Calculate Shipping fee
    const qualifiesForFreeShipping = subtotalPaise >= settings.freeShippingThresholdPaise;
    const shippingFeePaise = qualifiesForFreeShipping ? 0 : settings.standardShippingFeePaise;
    // Calculate Tax (e.g. 5% GST inclusive / calculated)
    const taxableAmount = Math.max(0, subtotalPaise - discountPaise);
    const taxPaise = Math.round((taxableAmount * settings.taxPercent) / 100);
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
        freeShippingThresholdPaise: settings.freeShippingThresholdPaise,
        errors
    };
}
export async function calculateQuote(req, res) {
    try {
        const { items, couponCode } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart items are required for quote.' });
        }
        const result = computeVerifiedQuote({ items, couponCode });
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
                itemCount: result.snapshots.length,
                errors: result.errors
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to calculate quote', error: err.message });
    }
}
export async function createOrder(req, res) {
    try {
        const { items, couponCode, shippingAddress, customerEmail, customerName, customerPhone, paymentMethod, deliveryNotes } = req.body;
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
        // Server-side recalculate and verify all items & prices
        const quote = computeVerifiedQuote({ items, couponCode });
        if (!quote.success || quote.error) {
            return res.status(400).json({ success: false, message: quote.error, errors: quote.errors });
        }
        const settings = db.getSettings();
        const chosenMethod = paymentMethod === 'cod' && settings.isCodEnabled ? 'cod' : 'razorpay';
        // Generate unique order number
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const orderNumber = `SR-${new Date().getFullYear()}-${randomSuffix}`;
        const orderData = {
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
            paymentStatus: chosenMethod === 'cod' ? 'pending' : 'pending',
            fulfillmentStatus: chosenMethod === 'cod' ? 'confirmed' : 'pending',
            statusHistory: [
                {
                    status: chosenMethod === 'cod' ? 'confirmed' : 'pending',
                    timestamp: new Date().toISOString(),
                    note: chosenMethod === 'cod' ? 'Order placed with Cash on Delivery' : 'Order created, awaiting payment verification'
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
                order: createdOrder
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to create order', error: err.message });
    }
}
export async function verifyPayment(req, res) {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        if (!orderId || !razorpayPaymentId) {
            return res.status(400).json({ success: false, message: 'Missing order ID or payment ID for verification.' });
        }
        const order = db.findOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order record not found.' });
        }
        if (order.paymentStatus === 'paid') {
            return res.json({ success: true, message: 'Payment already verified.', data: { order } });
        }
        const isValid = verifyRazorpaySignature(razorpayOrderId || order.razorpayOrderId || '', razorpayPaymentId, razorpaySignature || '');
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
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Payment verification error', error: err.message });
    }
}
export async function getPaymentConfig(_req, res) {
    const config = getRazorpayPublicConfig();
    const settings = db.getSettings();
    return res.json({
        success: true,
        data: {
            ...config,
            isCodEnabled: settings.isCodEnabled,
            isRazorpayEnabled: settings.isRazorpayEnabled
        }
    });
}
