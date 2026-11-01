import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/models/dataStore.js';
import { computeVerifiedQuote } from '../src/controllers/checkoutController.js';
import { generateInvoiceData } from '../src/services/invoiceService.js';
import { trackOrderByParameter } from '../src/controllers/orderController.js';
import { Request, Response } from 'express';

describe('Production Fixes & Enhancements Verification', () => {
  beforeEach(() => {
    db.init();
  });

  describe('Fix 7: GST Accounting to Admin Settings', () => {
    it('uses 5% GST when admin sets taxPercent to 5', () => {
      db.updateSettings({ taxPercent: 5, freeShippingThresholdPaise: 999000 });
      const products = db.getProducts();
      const product = products[0];
      const variant = product.variants[0];

      const quote = computeVerifiedQuote({
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }]
      });

      expect(quote.success).toBe(true);
      if (quote.success) {
        const taxableAmount = quote.priceBreakdown.subtotalPaise - quote.priceBreakdown.discountPaise;
        const expectedTax = Math.round((taxableAmount * 5) / 100);
        expect(quote.priceBreakdown.taxPaise).toBe(expectedTax);
        expect(quote.priceBreakdown.totalPaise).toBe(
          taxableAmount + quote.priceBreakdown.shippingFeePaise + expectedTax
        );
      }
    });

    it('uses 0% GST when admin sets taxPercent to 0', () => {
      db.updateSettings({ taxPercent: 0, freeShippingThresholdPaise: 999000 });
      const products = db.getProducts();
      const product = products[0];
      const variant = product.variants[0];

      const quote = computeVerifiedQuote({
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }]
      });

      expect(quote.success).toBe(true);
      if (quote.success) {
        expect(quote.priceBreakdown.taxPaise).toBe(0);
        const taxableAmount = quote.priceBreakdown.subtotalPaise - quote.priceBreakdown.discountPaise;
        expect(quote.priceBreakdown.totalPaise).toBe(
          taxableAmount + quote.priceBreakdown.shippingFeePaise
        );
      }
    });

    it('generates invoice with 0% tax when taxPercent is 0', () => {
      db.updateSettings({ taxPercent: 0, gstin: '32AAAAA0000A1Z5' });
      const orders = db.getOrders();
      const testOrder = {
        ...orders[0],
        priceBreakdown: {
          ...orders[0].priceBreakdown,
          taxPaise: 0
        }
      };

      const invoice = generateInvoiceData(testOrder);
      expect(invoice.taxRatePercent).toBe(0);
      expect(invoice.taxPaise).toBe(0);
      expect(invoice.cgstPaise).toBe(0);
      expect(invoice.sgstPaise).toBe(0);
      expect(invoice.igstPaise).toBe(0);
    });

    it('generates invoice with 5% tax when taxPercent is 5', () => {
      db.updateSettings({ taxPercent: 5, gstin: '32AAAAA0000A1Z5' });
      const orders = db.getOrders();
      const testOrder = {
        ...orders[0],
        priceBreakdown: {
          ...orders[0].priceBreakdown,
          taxPaise: 1000
        }
      };

      const invoice = generateInvoiceData(testOrder);
      expect(invoice.taxRatePercent).toBe(5);
      expect(invoice.taxPaise).toBe(1000);
    });
  });

  describe('Fix 6 Part B: Parameterized Auto-Fulfillment Tracking Route', () => {
    it('looks up shipment using tracking number in dataStore', () => {
      const orders = db.getOrders();
      const firstOrder = orders[0];
      const found = db.findOrderByTracking(firstOrder.orderNumber);
      expect(found).toBeDefined();
      expect(found?.orderNumber).toBe(firstOrder.orderNumber);
    });

    it('returns shipment data via trackOrderByParameter using orderNumber', async () => {
      const orders = db.getOrders();
      const targetOrder = orders[0];

      let responseData: any = null;
      let statusCode = 0;

      const req = {
        params: { trackingId: targetOrder.orderNumber }
      } as unknown as Request;

      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: any) => {
          responseData = data;
          return res;
        }
      } as unknown as Response;

      await trackOrderByParameter(req, res);
      expect(statusCode === 0 || statusCode === 200).toBe(true);
      expect(responseData.success).toBe(true);
      expect(responseData.data.orderNumber).toBe(targetOrder.orderNumber);
    });

    it('returns 404 for unknown tracking reference in trackOrderByParameter', async () => {
      let responseData: any = null;
      let statusCode = 0;

      const req = {
        params: { trackingId: 'NON_EXISTENT_TRACKING_12345' }
      } as unknown as Request;

      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: any) => {
          responseData = data;
          return res;
        }
      } as unknown as Response;

      await trackOrderByParameter(req, res);
      expect(statusCode).toBe(404);
      expect(responseData.success).toBe(false);
    });
  });
});
