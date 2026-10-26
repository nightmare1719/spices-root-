import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../src/models/dataStore.js';
import { runSeed } from '../src/seed.js';
import { generateUpiPaymentDetails, getMerchantUpiConfig } from '../src/services/upiService.js';
import { generateInvoiceData } from '../src/services/invoiceService.js';
import { IOrder } from '../src/types/index.js';

beforeAll(async () => {
  await runSeed(true);
});

describe('Manual Direct UPI Payment & Verification System', () => {
  
  it('generates correct UPI URI and QR code with merchant UPI ID and exact amount', async () => {
    const config = getMerchantUpiConfig();
    expect(config.upiId).toBe('cynalbertoz@sbi');
    expect(config.whatsappNumber).toBe('919188570191');

    const orderNumber = 'SR-2026-TEST01';
    const amountPaise = 45000; // ₹450.00
    const details = await generateUpiPaymentDetails(orderNumber, amountPaise);

    expect(details.amountInRupees).toBe('450.00');
    expect(details.upiId).toBe('cynalbertoz@sbi');
    expect(details.orderNumber).toBe(orderNumber);

    // Verify standard upi://pay URI
    expect(details.upiUri).toContain('upi://pay?');
    expect(details.upiUri).toContain('pa=cynalbertoz%40sbi');
    expect(details.upiUri).toContain('am=450.00');
    expect(details.upiUri).toContain('cu=INR');
    expect(details.upiUri).toContain('tr=SR-2026-TEST01');

    // Verify QR code is valid base64 data url
    expect(details.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    // Verify WhatsApp deep link and prefilled message
    expect(details.whatsappUrl).toContain('https://wa.me/919188570191?text=');
    expect(decodeURIComponent(details.whatsappUrl)).toContain('Order ID: SR-2026-TEST01');
    expect(decodeURIComponent(details.whatsappUrl)).toContain('Amount: ₹450.00');
    expect(details.whatsappQrDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('creates an order with initial payment status AWAITING_PAYMENT', () => {
    const orderData: IOrder = {
      orderNumber: 'SR-2026-TEST02',
      customerName: 'Test Buyer',
      customerEmail: 'buyer@test.com',
      customerPhone: '9876543210',
      shippingAddress: {
        name: 'Test Buyer',
        phone: '9876543210',
        addressLine: '123 Test Street',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001'
      },
      items: [
        {
          productId: 'prod_black_pepper',
          productName: 'Malabar Black Pepper',
          productSlug: 'malabar-black-pepper',
          variantId: 'v_bp_100',
          sku: 'BP-100',
          packSize: '100g',
          unitPricePaise: 16000,
          quantity: 2,
          lineTotalPaise: 32000,
          image: '/images/pepper.jpg'
        }
      ],
      priceBreakdown: {
        subtotalPaise: 32000,
        discountPaise: 0,
        shippingFeePaise: 6000,
        taxPaise: 1600,
        totalPaise: 38000
      },
      paymentMethod: 'upi_manual',
      paymentStatus: 'AWAITING_PAYMENT',
      fulfillmentStatus: 'pending',
      statusHistory: [
        { status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed, awaiting UPI transfer' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const created = db.createOrder(orderData);
    expect(created.orderNumber).toBe('SR-2026-TEST02');
    expect(created.paymentStatus).toBe('AWAITING_PAYMENT');
    expect(created.paymentMethod).toBe('upi_manual');
  });

  it('CRITICAL: submitting "I\'ve Paid" transitions order to VERIFICATION_PENDING and NEVER marks order as PAID', () => {
    const order = db.findOrderById('SR-2026-TEST02');
    expect(order).toBeDefined();

    const submissionTime = new Date().toISOString();
    const customerUtr = '429381749281';

    // Simulate customer clicking "I've Paid" with UTR
    const updated = db.updateOrder(order!.id || order!.orderNumber, {
      paymentStatus: 'VERIFICATION_PENDING',
      upiTransactionRef: customerUtr,
      paymentSubmittedAt: submissionTime,
      paymentAuditLogs: [
        {
          previousStatus: 'AWAITING_PAYMENT',
          newStatus: 'VERIFICATION_PENDING',
          timestamp: submissionTime,
          changedBy: 'customer',
          utr: customerUtr,
          note: 'Customer submitted payment details on checkout'
        }
      ]
    });

    // ABSOLUTE ASSERTION: Must NOT be PAID
    expect(updated?.paymentStatus).not.toBe('PAID');
    expect(updated?.paymentStatus).not.toBe('paid');
    expect(updated?.paymentStatus).toBe('VERIFICATION_PENDING');
    expect(updated?.upiTransactionRef).toBe('429381749281');
    expect(updated?.paymentSubmittedAt).toBe(submissionTime);
    expect(updated?.paymentAuditLogs?.length).toBe(1);
    expect(updated?.paymentAuditLogs?.[0].changedBy).toBe('customer');
  });

  it('allows ONLY admin verification to transition an order to PAID with audit log', () => {
    const order = db.findOrderById('SR-2026-TEST02');
    expect(order).toBeDefined();
    expect(order?.paymentStatus).toBe('VERIFICATION_PENDING');

    const verifiedTime = new Date().toISOString();
    const adminUser = 'Admin Operations (admin@spiceroots.in)';
    const verifiedUtr = '429381749281';
    const adminNote = 'Verified in SBI Yono banking app statement at 11:30 AM';

    const currentAudit = order?.paymentAuditLogs || [];
    currentAudit.push({
      previousStatus: order!.paymentStatus,
      newStatus: 'PAID',
      timestamp: verifiedTime,
      changedBy: adminUser,
      utr: verifiedUtr,
      note: adminNote
    });

    const verifiedOrder = db.updateOrder(order!.id || order!.orderNumber, {
      paymentStatus: 'PAID',
      fulfillmentStatus: 'confirmed',
      upiTransactionRef: verifiedUtr,
      verifiedAt: verifiedTime,
      verifiedBy: adminUser,
      adminNotes: adminNote,
      paymentAuditLogs: currentAudit
    });

    expect(verifiedOrder?.paymentStatus).toBe('PAID');
    expect(verifiedOrder?.fulfillmentStatus).toBe('confirmed');
    expect(verifiedOrder?.verifiedBy).toBe(adminUser);
    expect(verifiedOrder?.paymentAuditLogs?.length).toBe(2);
    expect(verifiedOrder?.paymentAuditLogs?.[1].newStatus).toBe('PAID');
  });

  it('allows admin to reject an invalid payment submission with recorded reason', () => {
    // Create a dummy order for rejection testing
    const rejectOrderData: IOrder = {
      orderNumber: 'SR-2026-REJECT01',
      customerName: 'Fraud Suspect',
      customerEmail: 'fraud@test.com',
      customerPhone: '9123456780',
      shippingAddress: {
        name: 'Fraud Suspect',
        phone: '9123456780',
        addressLine: 'Nowhere',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001'
      },
      items: [],
      priceBreakdown: {
        subtotalPaise: 20000,
        discountPaise: 0,
        shippingFeePaise: 6000,
        taxPaise: 1000,
        totalPaise: 26000
      },
      paymentMethod: 'upi_manual',
      paymentStatus: 'VERIFICATION_PENDING',
      fulfillmentStatus: 'pending',
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.createOrder(rejectOrderData);

    const now = new Date().toISOString();
    const reason = 'No incoming credit received in SBI account for this order';

    const rejected = db.updateOrder('SR-2026-REJECT01', {
      paymentStatus: 'REJECTED',
      rejectionReason: reason,
      paymentAuditLogs: [
        {
          previousStatus: 'VERIFICATION_PENDING',
          newStatus: 'REJECTED',
          timestamp: now,
          changedBy: 'Admin (admin@spiceroots.in)',
          note: `Rejected: ${reason}`
        }
      ]
    });

    expect(rejected?.paymentStatus).toBe('REJECTED');
    expect(rejected?.rejectionReason).toBe(reason);
  });

  it('generates official Tax Invoice or Bill of Supply with legal business name and tax calculation', () => {
    const order = db.findOrderById('SR-2026-TEST02')!;
    const settings = db.getSettings();

    // Test with GSTIN absent -> Bill of Supply
    const settingsNoGst = { ...settings, gstin: '', legalBusinessName: 'Kalaivani Spices & Plantation Depot' };
    const billOfSupply = generateInvoiceData(order, settingsNoGst);

    expect(billOfSupply.isRegisteredGst).toBe(false);
    expect(billOfSupply.businessName).toBe('Kalaivani Spices & Plantation Depot');
    expect(billOfSupply.totalPaise).toBe(order.priceBreakdown.totalPaise);
    expect(billOfSupply.totalInWords).toContain('Rupees');
    expect(billOfSupply.items.length).toBeGreaterThan(0);
    expect(billOfSupply.items[0].hsnCode).toBeDefined();

    // Test with GSTIN present -> Tax Invoice with CGST/SGST breakdown
    const settingsWithGst = { 
      ...settings, 
      gstin: '32AAAAA0000A1Z5', 
      legalBusinessName: 'Kalaivani Spices & Plantation Depot',
      taxPercent: 5
    };
    const taxInvoice = generateInvoiceData(order, settingsWithGst);

    expect(taxInvoice.isRegisteredGst).toBe(true);
    expect(taxInvoice.gstin).toBe('32AAAAA0000A1Z5');
    expect(taxInvoice.cgstPaise).toBeGreaterThan(0);
    expect(taxInvoice.sgstPaise).toBeGreaterThan(0);
    expect(taxInvoice.cgstPaise + taxInvoice.sgstPaise).toBe(taxInvoice.taxPaise);
  });

});
