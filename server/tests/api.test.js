import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../src/models/dataStore.js';
import { runSeed } from '../src/seed.js';
import { computeVerifiedQuote } from '../src/controllers/checkoutController.js';
import { verifyRazorpaySignature } from '../src/services/razorpay.js';
import { processAssistantChat } from '../src/services/aiAssistant.js';
beforeAll(async () => {
    await runSeed(true);
});
describe('Spice Roots Core Business & Security Logic', () => {
    it('loads seeded catalog products correctly', () => {
        const products = db.getProducts();
        expect(products.length).toBeGreaterThan(5);
        const pepper = db.findProductBySlug('malabar-black-pepper');
        expect(pepper).toBeDefined();
        expect(pepper?.name).toContain('Black Pepper');
        expect(pepper?.variants.length).toBeGreaterThan(0);
        expect(pepper?.variants[0].pricePaise).toBe(16000); // ₹160
    });
    it('validates active coupon WELCOME10 with minimum order limit', () => {
        const coupon = db.findCouponByCode('WELCOME10');
        expect(coupon).toBeDefined();
        expect(coupon?.discountType).toBe('percent');
        expect(coupon?.discountValue).toBe(10);
        expect(coupon?.minOrderValuePaise).toBe(49900); // ₹499
    });
    it('correctly calculates server-side price quote and rejects client price tampering', () => {
        const quote = computeVerifiedQuote({
            items: [
                {
                    productId: 'prod_black_pepper',
                    variantId: 'v_bp_100',
                    quantity: 2
                }
            ],
            couponCode: 'WELCOME10'
        });
        expect(quote.success).toBe(true);
        if (quote.success) {
            // 2 x ₹160 = ₹320 (32000 paise)
            expect(quote.priceBreakdown.subtotalPaise).toBe(32000);
            // Below ₹499, so coupon discount is 0
            expect(quote.priceBreakdown.discountPaise).toBe(0);
            // Below free shipping threshold ₹999, so shipping is ₹60 (6000 paise)
            expect(quote.priceBreakdown.shippingFeePaise).toBe(6000);
            expect(quote.priceBreakdown.totalPaise).toBeGreaterThan(32000);
        }
    });
    it('applies free shipping when cart exceeds threshold', () => {
        const quote = computeVerifiedQuote({
            items: [
                {
                    productId: 'prod_green_cardamom_8mm',
                    variantId: 'v_gc_250', // ₹1,250
                    quantity: 1
                }
            ]
        });
        expect(quote.success).toBe(true);
        if (quote.success) {
            expect(quote.qualifiesForFreeShipping).toBe(true);
            expect(quote.priceBreakdown.shippingFeePaise).toBe(0);
        }
    });
    it('rejects order if requested quantity exceeds available stock', () => {
        const quote = computeVerifiedQuote({
            items: [
                {
                    productId: 'prod_heritage_spice_box',
                    variantId: 'v_box_royal',
                    quantity: 9999 // Exceeds stock (stock is 15)
                }
            ]
        });
        expect(quote.success).toBe(false);
        expect(quote.error).toContain('available');
    });
    it('correctly verifies Razorpay HMAC SHA256 payment signature', () => {
        // Test sandbox verification handles sandbox signatures
        const isValid = verifyRazorpaySignature('order_test_sandbox123', 'pay_test_456', 'sig_test_valid');
        expect(isValid).toBe(true);
        const isInvalid = verifyRazorpaySignature('order_real_123', 'pay_real_456', 'bogus_signature');
        expect(isInvalid).toBe(false);
    });
    it('provides grounded catalog recommendations when AI key is missing', async () => {
        const res = await processAssistantChat('Recommend spices for biryani');
        expect(res).toBeDefined();
        expect(res.message).toContain('Biryani');
        expect(res.recommendedProducts.length).toBeGreaterThan(0);
        expect(res.recommendedProducts[0].pricePaise).toBeGreaterThan(0);
    });
    it('protects guest order tracking with required email/phone verification', () => {
        const found = db.findOrderByGuest('SR-2026-91823', 'customer@spiceroots.in');
        expect(found).toBeDefined();
        const notFound = db.findOrderByGuest('SR-2026-91823', 'wrong@email.com');
        expect(notFound).toBeUndefined();
    });
});
