import { OfferItem, OfferStatus, MenuItem, CartItem } from '../types/index.ts';

/**
 * Determines current status of an offer based on dates, active flag, and explicit status.
 */
export function getOfferStatus(offer: OfferItem, now: Date = new Date()): OfferStatus {
  // If explicitly draft or paused
  if (offer.status === 'draft') return 'draft';
  if (offer.status === 'paused' || offer.active === false) return 'paused';

  const currentTime = now.getTime();

  // Check start date (scheduled)
  if (offer.startDate) {
    const startTime = new Date(offer.startDate).getTime();
    if (!isNaN(startTime) && currentTime < startTime) {
      return 'scheduled';
    }
  }

  // Check end date (expired)
  if (offer.endDate) {
    const endTime = new Date(offer.endDate).getTime();
    if (!isNaN(endTime) && currentTime > endTime) {
      return 'expired';
    }
  }

  return 'active';
}

/**
 * Returns true if the offer is currently active, within valid dates, and allowed for public display.
 */
export function isOfferPubliclyActive(offer: OfferItem, now?: Date): boolean {
  if (offer.isPublic === false) return false;
  const nowDate = now instanceof Date ? now : new Date();
  return getOfferStatus(offer, nowDate) === 'active';
}

/**
 * Checks whether a specific menu item is eligible for an offer.
 * Rule: Never apply a vegetarian offer to non-vegetarian items.
 */
export function isItemEligibleForOffer(item: MenuItem, offer: OfferItem): boolean {
  // 1. Strict Veg / Non-Veg guard
  if (offer.targetType === 'veg_only') {
    if (item.foodType !== 'veg') return false;
  } else if (offer.targetType === 'non_veg_only') {
    if (item.foodType !== 'non_veg') return false;
  }

  // 2. Target Scope
  if (offer.targetType === 'all' || offer.targetType === 'veg_only' || offer.targetType === 'non_veg_only' || !offer.targetType) {
    return true;
  }

  if (offer.targetType === 'categories') {
    return Boolean(offer.targetCategoryIds && offer.targetCategoryIds.includes(item.categoryId));
  }

  if (offer.targetType === 'items') {
    return Boolean(offer.targetItemIds && offer.targetItemIds.includes(item.id));
  }

  return false;
}

export interface ItemOfferCalculation {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountBadge: string;
  offerTitle: string;
}

/**
 * Calculate promotional price for an individual item base price.
 */
export function calculateItemOfferPrice(
  basePrice: number,
  offer: OfferItem
): { discountedPrice: number; discountAmount: number; discountBadge: string } {
  if (basePrice <= 0) {
    return { discountedPrice: basePrice, discountAmount: 0, discountBadge: offer.discount };
  }

  const offerType = offer.offerType || 'percentage';
  const val = Number(offer.discountValue || 0);

  let discountAmount = 0;

  switch (offerType) {
    case 'percentage': {
      const pct = Math.max(0, Math.min(100, val));
      discountAmount = Math.round((basePrice * pct) / 100);
      break;
    }
    case 'flat_amount': {
      discountAmount = Math.min(basePrice, Math.max(0, val));
      break;
    }
    case 'fixed_price': {
      if (val > 0 && val < basePrice) {
        discountAmount = basePrice - val;
      }
      break;
    }
    case 'bogo': {
      // BOGO is handled during cart pairing, but for single item display note badge
      discountAmount = 0;
      break;
    }
    case 'custom':
    default: {
      if (val > 0) {
        discountAmount = Math.min(basePrice, val);
      }
      break;
    }
  }

  const discountedPrice = Math.max(0, basePrice - discountAmount);
  return {
    discountedPrice,
    discountAmount,
    discountBadge: offer.discount || (discountAmount > 0 ? `₹${discountAmount} OFF` : 'Special Offer'),
  };
}

/**
 * Evaluates active offers and returns the best applicable offer for a menu item.
 */
export function getBestOfferForItem(
  item: MenuItem,
  activeOffers: OfferItem[]
): ItemOfferCalculation | null {
  if (item.price === 'MRP' || typeof item.price !== 'number') {
    return null;
  }

  const basePrice = item.price;
  let bestCalculation: ItemOfferCalculation | null = null;
  let maxDiscount = 0;

  for (const offer of activeOffers) {
    if (!isOfferPubliclyActive(offer)) continue;
    if (!isItemEligibleForOffer(item, offer)) continue;

    const { discountedPrice, discountAmount, discountBadge } = calculateItemOfferPrice(basePrice, offer);

    if (discountAmount > maxDiscount) {
      maxDiscount = discountAmount;
      bestCalculation = {
        originalPrice: basePrice,
        discountedPrice,
        discountAmount,
        discountBadge,
        offerTitle: offer.title,
      };
    }
  }

  return bestCalculation;
}

/**
 * Cart discount calculation result.
 */
export interface CartDiscountResult {
  eligibleCount: number;
  discountTotal: number;
  subtotal: number;
  finalTotal: number;
  appliedOffer: OfferItem | null;
  message?: string;
  isEligible: boolean;
}

/**
 * Calculate dynamic cart discount according to restaurant offer rules.
 */
export function calculateCartDiscount(
  cart: CartItem[],
  offer: OfferItem | null,
  menuItems: MenuItem[]
): CartDiscountResult {
  const subtotal = cart.reduce((sum, item) => {
    const addonsPrice = (item.addons || []).reduce((aSum, a) => aSum + a.price, 0);
    return sum + (item.unitPrice + addonsPrice) * item.quantity;
  }, 0);

  if (!offer || cart.length === 0) {
    return {
      eligibleCount: 0,
      discountTotal: 0,
      subtotal,
      finalTotal: subtotal,
      appliedOffer: null,
      isEligible: true,
    };
  }

  // Check min order value requirement
  if (offer.minOrderValue && subtotal < offer.minOrderValue) {
    return {
      eligibleCount: 0,
      discountTotal: 0,
      subtotal,
      finalTotal: subtotal,
      appliedOffer: offer,
      message: `Minimum order value of ₹${offer.minOrderValue} required for this offer.`,
      isEligible: false,
    };
  }

  const itemMap = new Map<string, MenuItem>();
  for (const mi of menuItems) {
    itemMap.set(mi.id, mi);
  }

  let eligibleCount = 0;
  let discountTotal = 0;

  const offerType = offer.offerType || 'percentage';
  const val = Number(offer.discountValue || 0);

  if (offerType === 'bogo') {
    // Buy One Get One rule:
    // Gather all eligible single units
    const eligibleUnits: { price: number; name: string }[] = [];
    for (const ci of cart) {
      const mi = itemMap.get(ci.menuItemId);
      if (!mi || !isItemEligibleForOffer(mi, offer)) continue;

      for (let i = 0; i < ci.quantity; i++) {
        eligibleUnits.push({ price: ci.unitPrice, name: ci.name });
      }
    }

    eligibleCount = eligibleUnits.length;
    if (eligibleUnits.length >= 2) {
      // Sort ascending so cheapest eligible item in each pair gets 100% off
      eligibleUnits.sort((a, b) => a.price - b.price);
      const freeItemsCount = Math.floor(eligibleUnits.length / 2);
      for (let i = 0; i < freeItemsCount; i++) {
        discountTotal += eligibleUnits[i].price;
      }
    }
  } else if (offerType === 'flat_amount') {
    // Flat ₹X discount off total eligible items (cannot exceed eligible items sum)
    let eligibleSubtotal = 0;
    for (const ci of cart) {
      const mi = itemMap.get(ci.menuItemId);
      if (mi && isItemEligibleForOffer(mi, offer)) {
        eligibleCount += ci.quantity;
        eligibleSubtotal += ci.unitPrice * ci.quantity;
      }
    }
    discountTotal = Math.min(eligibleSubtotal, Math.max(0, val));
  } else {
    // Percentage or Fixed Price per eligible item
    for (const ci of cart) {
      const mi = itemMap.get(ci.menuItemId);
      if (!mi || !isItemEligibleForOffer(mi, offer)) continue;

      eligibleCount += ci.quantity;

      if (offerType === 'percentage') {
        const pct = Math.max(0, Math.min(100, val));
        const itemDiscount = Math.round((ci.unitPrice * pct) / 100);
        discountTotal += itemDiscount * ci.quantity;
      } else if (offerType === 'fixed_price') {
        if (val > 0 && val < ci.unitPrice) {
          const itemDiscount = ci.unitPrice - val;
          discountTotal += itemDiscount * ci.quantity;
        }
      } else {
        // Custom
        if (val > 0) {
          discountTotal = Math.min(subtotal, val);
        }
      }
    }
  }

  // Ensure discount doesn't exceed subtotal
  discountTotal = Math.min(subtotal, Math.max(0, discountTotal));
  const finalTotal = Math.max(0, subtotal - discountTotal);

  return {
    eligibleCount,
    discountTotal,
    subtotal,
    finalTotal,
    appliedOffer: offer,
    isEligible: eligibleCount > 0,
    message:
      eligibleCount === 0
        ? `No items in cart match the offer eligibility (${getOfferTargetLabel(offer)}).`
        : undefined,
  };
}

/**
 * Human-readable target label for an offer
 */
export function getOfferTargetLabel(offer: OfferItem): string {
  switch (offer.targetType) {
    case 'veg_only':
      return 'Vegetarian items only';
    case 'non_veg_only':
      return 'Non-vegetarian items only';
    case 'categories':
      return `${offer.targetCategoryIds?.length || 0} selected categories`;
    case 'items':
      return `${offer.targetItemIds?.length || 0} selected items`;
    case 'all':
    default:
      return 'All menu items';
  }
}
