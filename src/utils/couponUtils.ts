import { Coupon, CouponValidationResult, CartItem, CustomerOrder } from '../types/index.ts';

export function normalizeCouponCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * Validates a coupon code against cart items, customer info, and business rules.
 */
export function validateAndCalculateCoupon(
  coupon: Coupon | null | undefined,
  foodSubtotal: number,
  cartItems: CartItem[] = [],
  customerPhone?: string,
  existingOrders: CustomerOrder[] = []
): CouponValidationResult {
  if (!coupon) {
    return {
      valid: false,
      message: 'Invalid coupon code. Please check and try again.',
      discountAmount: 0,
    };
  }

  // 1. Active status check
  if (coupon.isActive === false) {
    return {
      valid: false,
      message: `Coupon '${coupon.code}' is currently inactive.`,
      discountAmount: 0,
    };
  }

  // 2. Expiry date check
  if (coupon.expiryDate) {
    const expiryTime = new Date(coupon.expiryDate).getTime();
    if (!isNaN(expiryTime) && expiryTime < Date.now()) {
      return {
        valid: false,
        message: `Coupon '${coupon.code}' has expired.`,
        discountAmount: 0,
      };
    }
  }

  // 3. Global usage limit check
  if (typeof coupon.usageLimit === 'number' && coupon.usageLimit > 0) {
    if ((coupon.usedCount || 0) >= coupon.usageLimit) {
      return {
        valid: false,
        message: `Coupon '${coupon.code}' has reached its maximum redemption limit.`,
        discountAmount: 0,
      };
    }
  }

  // 4. Per-customer limit check
  const perCustomerLimit = typeof coupon.perCustomerLimit === 'number' ? coupon.perCustomerLimit : 1;
  if (customerPhone && perCustomerLimit > 0 && Array.isArray(existingOrders)) {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      const timesUsed = existingOrders.filter(order => {
        if (order.status === 'cancelled') return false;
        const orderPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
        const sameCustomer = orderPhone === cleanPhone || (cleanPhone.length === 10 && orderPhone.endsWith(cleanPhone));
        const matchedCoupon = order.appliedOfferTitle?.toUpperCase().includes(coupon.code) || false;
        return sameCustomer && matchedCoupon;
      }).length;

      if (timesUsed >= perCustomerLimit) {
        return {
          valid: false,
          message: `You have already redeemed coupon '${coupon.code}' the maximum allowed number of times (${perCustomerLimit}).`,
          discountAmount: 0,
        };
      }
    }
  }

  // 5. Item / Category applicability check
  let eligibleSubtotal = foodSubtotal;

  if (coupon.applicabilityType === 'categories' && Array.isArray(coupon.applicableCategoryIds) && coupon.applicableCategoryIds.length > 0) {
    const matchingItems = cartItems.filter(item => item.categoryName && coupon.applicableCategoryIds?.includes(item.categoryName));
    eligibleSubtotal = matchingItems.reduce((sum, item) => {
      const addonsCost = (item.addons || []).reduce((a, b) => a + b.price, 0);
      return sum + (item.unitPrice + addonsCost) * item.quantity;
    }, 0);

    if (eligibleSubtotal <= 0) {
      return {
        valid: false,
        message: `Coupon '${coupon.code}' is only applicable to selected menu categories.`,
        discountAmount: 0,
      };
    }
  } else if (coupon.applicabilityType === 'items' && Array.isArray(coupon.applicableItemIds) && coupon.applicableItemIds.length > 0) {
    const matchingItems = cartItems.filter(item => coupon.applicableItemIds?.includes(item.menuItemId || item.id));
    eligibleSubtotal = matchingItems.reduce((sum, item) => {
      const addonsCost = (item.addons || []).reduce((a, b) => a + b.price, 0);
      return sum + (item.unitPrice + addonsCost) * item.quantity;
    }, 0);

    if (eligibleSubtotal <= 0) {
      return {
        valid: false,
        message: `Coupon '${coupon.code}' is only applicable to specific menu items.`,
        discountAmount: 0,
      };
    }
  }

  // 6. Minimum order amount check
  if (foodSubtotal < coupon.minOrderAmount) {
    const diff = coupon.minOrderAmount - foodSubtotal;
    return {
      valid: false,
      message: `Minimum food subtotal of ₹${coupon.minOrderAmount} required for '${coupon.code}'. Add ₹${diff} more to apply!`,
      discountAmount: 0,
    };
  }

  // 7. Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    const rawPct = Math.round((eligibleSubtotal * coupon.discountValue) / 100);
    if (typeof coupon.maxDiscount === 'number' && coupon.maxDiscount > 0) {
      discountAmount = Math.min(rawPct, coupon.maxDiscount);
    } else {
      discountAmount = rawPct;
    }
  } else {
    // Fixed ₹ amount discount
    discountAmount = Math.min(eligibleSubtotal, coupon.discountValue);
  }

  discountAmount = Math.max(0, Math.min(eligibleSubtotal, Math.round(discountAmount)));

  return {
    valid: true,
    message: `Coupon '${coupon.code}' applied! Saved ₹${discountAmount} on your order.`,
    discountAmount,
    coupon,
  };
}
