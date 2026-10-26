import QRCode from 'qrcode';
import { db } from '../models/dataStore.js';

export interface UpiPaymentDetails {
  upiId: string;
  merchantName: string;
  amountInRupees: string;
  amountPaise: number;
  orderNumber: string;
  transactionNote: string;
  upiUri: string;
  qrDataUrl: string;
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappUrl: string;
  whatsappQrDataUrl: string;
}

export function getMerchantUpiConfig() {
  const settings = db.getSettings();
  const upiId = process.env.MERCHANT_UPI_ID || settings.merchantUpiId || 'cynalbertoz@sbi';
  const merchantName = process.env.MERCHANT_NAME || settings.storeName || 'Spice Roots';
  const rawWhatsapp = process.env.MERCHANT_WHATSAPP_NUMBER || settings.merchantWhatsappNumber || '919188570191';
  const whatsappNumber = rawWhatsapp.replace(/\D/g, '');

  return {
    upiId: upiId.trim(),
    merchantName: merchantName.trim(),
    whatsappNumber: whatsappNumber.trim()
  };
}

export async function generateUpiPaymentDetails(orderNumber: string, amountPaise: number): Promise<UpiPaymentDetails> {
  const { upiId, merchantName, whatsappNumber } = getMerchantUpiConfig();
  const amountInRupees = (amountPaise / 100).toFixed(2);
  const transactionNote = `Order ${orderNumber}`;

  // Standard upi://pay URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${encodeURIComponent(orderNumber)}`;

  // Generate crisp QR code for Desktop UPI scan
  const qrDataUrl = await QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#153E2B', // Brand emerald
      light: '#FFFFFF'
    }
  });

  // Pre-fill WhatsApp verification chat message
  const whatsappMessage = `Hello, I have made a UPI payment. Order ID: ${orderNumber}. Amount: ₹${amountInRupees}. Please verify my payment.`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  // Generate WhatsApp QR code for desktop
  const whatsappQrDataUrl = await QRCode.toDataURL(whatsappUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#075E54', // WhatsApp dark green
      light: '#FFFFFF'
    }
  });

  return {
    upiId,
    merchantName,
    amountInRupees,
    amountPaise,
    orderNumber,
    transactionNote,
    upiUri,
    qrDataUrl,
    whatsappNumber,
    whatsappMessage,
    whatsappUrl,
    whatsappQrDataUrl
  };
}
