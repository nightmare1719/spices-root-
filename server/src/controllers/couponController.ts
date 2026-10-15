import { Request, Response } from 'express';
import { db } from '../models/dataStore.js';

export async function validateCoupon(req: Request, res: Response) {
  try {
    const { code, cartSubtotalPaise } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const subtotal = Number(cartSubtotalPaise) || 0;
    const coupon = db.findCouponByCode(code);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
    }

    if (subtotal < coupon.minOrderValuePaise) {
      const minINR = (coupon.minOrderValuePaise / 100).toFixed(0);
      return res.status(400).json({ 
        success: false, 
        message: `This coupon requires a minimum cart value of ₹${minINR}.` 
      });
    }

    let discountPaise = 0;
    if (coupon.discountType === 'percent') {
      discountPaise = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountPaise && discountPaise > coupon.maxDiscountPaise) {
        discountPaise = coupon.maxDiscountPaise;
      }
    } else {
      discountPaise = Math.min(coupon.discountValue, subtotal);
    }

    return res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountPaise,
        minOrderValuePaise: coupon.minOrderValuePaise
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Coupon validation failed', error: (err as Error).message });
  }
}
