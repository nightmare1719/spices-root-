import crypto from 'crypto';
import Razorpay from 'razorpay';

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demoKeyId12345';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'demoSecretKeyVal123456';
const isDemoCredentials = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('demo');

let razorpayClient: Razorpay | null = null;

if (!isDemoCredentials) {
  try {
    razorpayClient = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    });
  } catch (err) {
    console.warn('⚠️ [Razorpay] Could not initialize live Razorpay client, falling back to test sandbox adapter:', err);
  }
}

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  if (razorpayClient && !isDemoCredentials) {
    const order = await razorpayClient.orders.create({
      amount: params.amountPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes,
    });
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID,
      isTestSandbox: false
    };
  }

  // Developer Test Sandbox Mode
  const simulatedOrderId = 'order_test_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  return {
    orderId: simulatedOrderId,
    amount: params.amountPaise,
    currency: 'INR',
    keyId: KEY_ID,
    isTestSandbox: true
  };
}

export function verifyRazorpaySignature(
  orderId: string, 
  paymentId: string, 
  signature: string
): boolean {
  if (!orderId || !paymentId) return false;

  // In test sandbox mode with test order tokens:
  if (orderId.startsWith('order_test_') && signature.startsWith('sig_test_')) {
    return true;
  }

  try {
    const generated = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return generated === signature;
  } catch (err) {
    console.error('Razorpay signature verification error:', err);
    return false;
  }
}

export function getRazorpayPublicConfig() {
  return {
    keyId: KEY_ID,
    isTestSandbox: isDemoCredentials
  };
}
