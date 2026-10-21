import { CustomerOrder, OrderStatus } from '../types/index.ts';

/**
 * Safely parses Firestore Timestamp instances, ISO strings, milliseconds, or Dates
 */
export function parseFirestoreDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof val.toMillis === 'function') {
    try {
      const d = new Date(val.toMillis());
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    const ms = val.seconds * 1000 + (typeof val.nanoseconds === 'number' ? val.nanoseconds / 1000000 : 0);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats date to Indian Standard 12-hour time (e.g. "02:45 PM")
 */
export function formatTimelineTime(val: any): string | null {
  const date = parseFirestoreDate(val);
  if (!date) return null;
  try {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

/**
 * Formats date and time (e.g. "21 Oct, 02:45 PM")
 */
export function formatTimelineDateTime(val: any): string | null {
  const date = parseFirestoreDate(val);
  if (!date) return null;
  try {
    return `${date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })}, ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  } catch {
    return null;
  }
}

/**
 * Canonical 4-Stage Status Map
 * 1. Order Placed
 * 2. Order Packed
 * 3. Out for Delivery
 * 4. Delivered
 */
export const STATUS_CANONICAL_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Order Placed',
  preparing: 'Order Placed',
  packed: 'Order Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Order Cancelled',
};

export function getStatusDisplayName(status: string): string {
  return STATUS_CANONICAL_LABELS[status] || status;
}

/**
 * Stage Rank:
 * 1: Order Placed (pending, confirmed, preparing)
 * 2: Order Packed (packed)
 * 3: Out for Delivery (out_for_delivery)
 * 4: Delivered (delivered, completed)
 */
export function getStatusRank(status: string): number {
  if (status === 'packed') return 2;
  if (status === 'out_for_delivery') return 3;
  if (status === 'delivered' || status === 'completed') return 4;
  return 1;
}

/**
 * Computes the next valid forward transition action for an order.
 * Strictly enforces forward progression and prevents invalid skips.
 */
export function getNextAllowedTransition(currentStatus: string): {
  nextStatus: 'packed' | 'out_for_delivery' | 'delivered' | null;
  nextLabel: string;
  actionButtonText: string;
  isAllowed: boolean;
  reason?: string;
} {
  switch (currentStatus) {
    case 'pending':
    case 'confirmed':
    case 'preparing':
      return {
        nextStatus: 'packed',
        nextLabel: 'Order Packed',
        actionButtonText: 'Mark as Packed',
        isAllowed: true,
      };
    case 'packed':
      return {
        nextStatus: 'out_for_delivery',
        nextLabel: 'Out for Delivery',
        actionButtonText: 'Mark as Out for Delivery',
        isAllowed: true,
      };
    case 'out_for_delivery':
      return {
        nextStatus: 'delivered',
        nextLabel: 'Delivered',
        actionButtonText: 'Mark as Delivered',
        isAllowed: true,
      };
    case 'delivered':
    case 'completed':
      return {
        nextStatus: null,
        nextLabel: 'Delivered',
        actionButtonText: 'Delivered (Complete)',
        isAllowed: false,
        reason: 'This order has already reached final Delivered status.',
      };
    case 'cancelled':
      return {
        nextStatus: null,
        nextLabel: 'Cancelled',
        actionButtonText: 'Order Cancelled',
        isAllowed: false,
        reason: 'Order is cancelled and cannot be updated.',
      };
    default:
      return {
        nextStatus: 'packed',
        nextLabel: 'Order Packed',
        actionButtonText: 'Mark as Packed',
        isAllowed: true,
      };
  }
}

/**
 * Validates forward transitions strictly
 */
export function validateStatusTransition(currentStatus: string, nextStatus: string): { valid: boolean; error?: string } {
  if (currentStatus === nextStatus) {
    return { valid: false, error: `Order is already in "${getStatusDisplayName(nextStatus)}" status.` };
  }
  if (currentStatus === 'delivered' || currentStatus === 'completed') {
    return { valid: false, error: 'Order is already marked as Delivered and cannot be changed.' };
  }
  if (currentStatus === 'cancelled') {
    return { valid: false, error: 'Cancelled orders cannot transition to an active status.' };
  }
  if (nextStatus === 'delivered' && currentStatus !== 'out_for_delivery') {
    return {
      valid: false,
      error: 'Invalid transition: Order must be marked "Out for Delivery" before it can be marked "Delivered".',
    };
  }
  if (nextStatus === 'out_for_delivery' && currentStatus !== 'packed') {
    return {
      valid: false,
      error: 'Invalid transition: Order must be marked "Order Packed" before being dispatched for delivery.',
    };
  }
  return { valid: true };
}

/**
 * Extracts authentic timestamp for each timeline stage from order fields or statusHistory
 */
export function getOrderTimelineTimestamps(order: CustomerOrder): {
  placedAt?: Date;
  packedAt?: Date;
  outForDeliveryAt?: Date;
  deliveredAt?: Date;
} {
  const result: {
    placedAt?: Date;
    packedAt?: Date;
    outForDeliveryAt?: Date;
    deliveredAt?: Date;
  } = {};

  // 1. Placed
  result.placedAt = parseFirestoreDate(order.placedAt) || parseFirestoreDate(order.createdAt) || undefined;

  // 2. Packed
  result.packedAt = parseFirestoreDate(order.packedAt) || undefined;

  // 3. Out for Delivery
  result.outForDeliveryAt =
    parseFirestoreDate(order.outForDeliveryAt) || parseFirestoreDate(order.startedDeliveryAt) || undefined;

  // 4. Delivered
  result.deliveredAt = parseFirestoreDate(order.deliveredAt) || undefined;

  // Search statusHistory fallback if direct fields are empty
  if (order.statusHistory && Array.isArray(order.statusHistory)) {
    for (const entry of order.statusHistory) {
      const parsed = parseFirestoreDate(entry.timestamp);
      if (!parsed) continue;

      if (!result.placedAt && (entry.status === 'pending' || entry.status === 'confirmed')) {
        result.placedAt = parsed;
      }
      if (!result.packedAt && entry.status === 'packed') {
        result.packedAt = parsed;
      }
      if (!result.outForDeliveryAt && entry.status === 'out_for_delivery') {
        result.outForDeliveryAt = parsed;
      }
      if (!result.deliveredAt && (entry.status === 'delivered' || entry.status === 'completed')) {
        result.deliveredAt = parsed;
      }
    }
  }

  return result;
}
