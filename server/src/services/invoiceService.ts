import { IOrder, IStoreSettings } from '../types/index.js';
import { db } from '../models/dataStore.js';

// Number to Words in Indian Rupees
export function amountInWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

  function inWords(n: number): string {
    if (n === 0) return '';
    let str = '';
    if (Math.floor(n / 10000000) > 0) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += a[n % 10];
      }
    }
    return str;
  }

  const wholeRupees = Math.floor(num);
  const paise = Math.round((num - wholeRupees) * 100);

  let result = inWords(wholeRupees).trim();
  if (!result) result = 'Zero';
  result += ' Rupees';

  if (paise > 0) {
    result += ' and ' + inWords(paise).trim() + ' Paise';
  }
  return result + ' Only';
}

export function getHsnCode(productSlug: string, category?: string): string {
  const slug = (productSlug || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  if (slug.includes('pepper')) return '0904';
  if (slug.includes('cardamom')) return '0908';
  if (slug.includes('clove')) return '0907';
  if (slug.includes('cinnamon')) return '0906';
  if (slug.includes('tea')) return '0902';
  if (slug.includes('oil') || cat.includes('oil')) return '3301';
  if (slug.includes('choc') || cat.includes('choc')) return '1806';
  if (slug.includes('masala') || cat.includes('masala')) return '0910';
  return '0910'; // General spice mixture
}

export function generateInvoiceData(order: IOrder, settings?: IStoreSettings) {
  const s = settings || db.getSettings();
  const isGstRegistered = Boolean(s.gstin && s.gstin.trim().length >= 10);
  const invoiceTitle = isGstRegistered ? 'TAX INVOICE' : 'BILL OF SUPPLY';

  const invoiceNumber = `${s.invoicePrefix || 'SR-INV-'}${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
  const invoiceDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  const isKeralaOrder = (order.shippingAddress.state || '').trim().toLowerCase() === 'kerala';
  const taxRate = s.taxPercent || 5;

  const totalPaise = order.priceBreakdown.totalPaise;
  const totalRupees = totalPaise / 100;
  const taxPaise = order.priceBreakdown.taxPaise;
  const taxRupees = taxPaise / 100;

  // CGST + SGST vs IGST
  const cgstAmount = isKeralaOrder ? (taxRupees / 2).toFixed(2) : '0.00';
  const sgstAmount = isKeralaOrder ? (taxRupees / 2).toFixed(2) : '0.00';
  const igstAmount = !isKeralaOrder ? taxRupees.toFixed(2) : '0.00';

  const items = order.items.map((item, idx) => {
    const lineTotal = item.lineTotalPaise / 100;
    const hsn = getHsnCode(item.productSlug);
    return {
      index: idx + 1,
      name: item.productName,
      packSize: item.packSize,
      sku: item.sku,
      hsn,
      hsnCode: hsn,
      quantity: item.quantity,
      unitPrice: (item.unitPricePaise / 100).toFixed(2),
      ratePaise: item.unitPricePaise,
      lineTotal: lineTotal.toFixed(2),
      totalPaise: item.lineTotalPaise
    };
  });

  const legalName = s.legalBusinessName || 'Kalaivani Spices & Plantation Depot';
  const totalInWordsStr = amountInWords(totalRupees);

  return {
    invoiceTitle,
    invoiceNumber,
    invoiceDate,
    isGstRegistered,
    isRegisteredGst: isGstRegistered,
    businessName: legalName,
    address: s.businessAddress,
    gstin: s.gstin || '',
    pan: s.pan || '',
    taxRatePercent: taxRate,
    subtotalPaise: order.priceBreakdown.subtotalPaise,
    discountPaise: order.priceBreakdown.discountPaise,
    shippingFeePaise: order.priceBreakdown.shippingFeePaise,
    taxPaise: order.priceBreakdown.taxPaise,
    cgstPaise: isKeralaOrder ? Math.round(taxPaise / 2) : 0,
    sgstPaise: isKeralaOrder ? Math.round(taxPaise / 2) : 0,
    igstPaise: !isKeralaOrder ? taxPaise : 0,
    totalPaise,
    totalInWords: totalInWordsStr,
    merchant: {
      brandName: s.storeName,
      legalName,
      address: s.businessAddress,
      phone: s.supportPhone,
      email: s.supportEmail,
      gstin: s.gstin || '',
      pan: s.pan || '',
      state: 'Kerala',
      stateCode: '32'
    },
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      addressLine: order.shippingAddress.addressLine,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      pincode: order.shippingAddress.pincode
    },
    buyer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      shippingAddress: order.shippingAddress,
      state: order.shippingAddress.state,
      pincode: order.shippingAddress.pincode
    },
    order: {
      orderNumber: order.orderNumber,
      orderDate: invoiceDate,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      upiTransactionRef: order.upiTransactionRef || 'N/A',
      verifiedAt: order.verifiedAt || null,
      courierName: order.courierName || 'Pending Dispatch',
      trackingNumber: order.trackingNumber || 'Pending Pickup'
    },
    items,
    breakdown: {
      subtotal: (order.priceBreakdown.subtotalPaise / 100).toFixed(2),
      discount: (order.priceBreakdown.discountPaise / 100).toFixed(2),
      shippingFee: (order.priceBreakdown.shippingFeePaise / 100).toFixed(2),
      taxPercent: taxRate,
      isKeralaOrder,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax: taxRupees.toFixed(2),
      total: totalRupees.toFixed(2),
      amountInWords: totalInWordsStr
    }
  };
}
