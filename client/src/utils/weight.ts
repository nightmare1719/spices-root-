/**
 * Weight Calculation Utilities for Spice Roots E-Commerce
 * Handles parsing varying pack sizes (e.g. 50g, 100g, 250 g, 500gm, 1kg, 1.5 kg)
 * and calculates aggregate weight cleanly in grams and human-readable formatting.
 */

export interface CartItemWeightLike {
  packSize: string;
  quantity: number;
  [key: string]: any;
}

/**
 * Parses any pack size string and converts it to grams.
 * Examples handled:
 *  - "50g", "50 g", "50 gm", "500 grams" -> 50, 500
 *  - "1kg", "1 kg", "1.5kg", "2.5 kg" -> 1000, 1500, 2500
 */
export function parsePackSizeInGrams(packSize: string): number {
  if (!packSize || typeof packSize !== 'string') return 0;

  const normalized = packSize.trim().toLowerCase();

  // Match decimal or integer followed by optional unit
  const match = normalized.match(/([\d.]+)\s*(kg|kilo|kilogram|kilograms|g|gm|gms|gram|grams)?/i);
  if (!match) return 0;

  const numericValue = parseFloat(match[1]);
  if (isNaN(numericValue)) return 0;

  const unit = match[2] ? match[2].toLowerCase() : 'g';

  // If unit starts with 'k', convert kg to grams
  if (unit.startsWith('k')) {
    return Math.round(numericValue * 1000);
  }

  // Grams
  return Math.round(numericValue);
}

/**
 * Calculates aggregate weight in grams across all cart items.
 */
export function calculateTotalWeightInGrams(cartItems: CartItemWeightLike[]): number {
  if (!Array.isArray(cartItems)) return 0;

  return cartItems.reduce((acc, item) => {
    const itemWeightGrams = parsePackSizeInGrams(item.packSize);
    const quantity = Math.max(0, Number(item.quantity) || 0);
    return acc + itemWeightGrams * quantity;
  }, 0);
}

/**
 * Returns cleanly formatted string:
 *  - If total is 150g -> "150g"
 *  - If total is 1500g -> "1.5 kg"
 *  - If total is 2000g -> "2 kg"
 */
export function calculateTotalWeight(cartItems: CartItemWeightLike[]): string {
  const totalGrams = calculateTotalWeightInGrams(cartItems);

  if (totalGrams <= 0) {
    return '0g';
  }

  if (totalGrams < 1000) {
    return `${totalGrams}g`;
  }

  // Convert to kilograms and strip trailing redundant decimals
  const kgValue = totalGrams / 1000;
  const formattedKg = Number(kgValue.toFixed(2)).toString();

  return `${formattedKg} kg`;
}
