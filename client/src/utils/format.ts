export function formatINR(paise: number, showDecimals: boolean = false): string {
  if (isNaN(paise) || paise === null || paise === undefined) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : (rupees % 1 === 0 ? 0 : 2),
    maximumFractionDigits: 2
  }).format(rupees);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export function getDiscountPercentage(pricePaise: number, comparePricePaise?: number): number {
  if (!comparePricePaise || comparePricePaise <= pricePaise) return 0;
  return Math.round(((comparePricePaise - pricePaise) / comparePricePaise) * 100);
}

export function getGuestId(): string {
  let guestId = localStorage.getItem('spiceroots_guest_id');
  if (!guestId) {
    guestId = 'gst_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('spiceroots_guest_id', guestId);
  }
  return guestId;
}
