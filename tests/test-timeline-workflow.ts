import { isRestaurantOpen } from '../src/utils/operatingHours.ts';
import { validateStatusTransition, getNextAllowedTransition, getOrderTimelineTimestamps } from '../src/utils/orderTimeline.ts';

async function runTests() {
  console.log('--- STARTING TIMELINE & ORDER MANAGEMENT WORKFLOW TESTS ---\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Forward Transitions Validation (Only allow valid forward transitions)
  console.log('>>> Testing Forward Transition Logic & Guardrails:');
  const t1 = validateStatusTransition('pending', 'packed');
  assert('Allowed: pending -> packed', t1.valid === true);

  const t2 = validateStatusTransition('packed', 'out_for_delivery');
  assert('Allowed: packed -> out_for_delivery', t2.valid === true);

  const t3 = validateStatusTransition('out_for_delivery', 'delivered');
  assert('Allowed: out_for_delivery -> delivered', t3.valid === true);

  const t4 = validateStatusTransition('pending', 'delivered');
  assert('Disallowed: pending -> delivered (skipping steps)', t4.valid === false);

  const t5 = validateStatusTransition('packed', 'delivered');
  assert('Disallowed: packed -> delivered (must be out_for_delivery first)', t5.valid === false);

  const t6 = validateStatusTransition('delivered', 'packed');
  assert('Disallowed: delivered -> packed (cannot backward transition)', t6.valid === false);

  const t7 = validateStatusTransition('cancelled', 'packed');
  assert('Disallowed: cancelled -> packed (cancelled orders cannot be modified)', t7.valid === false);

  // Next allowed status action buttons
  const nextFromPending = getNextAllowedTransition('pending');
  assert('Pending next status is packed with label "Mark as Packed"', 
    nextFromPending.nextStatus === 'packed' && nextFromPending.actionButtonText === 'Mark as Packed');

  const nextFromPacked = getNextAllowedTransition('packed');
  assert('Packed next status is out_for_delivery with label "Mark as Out for Delivery"',
    nextFromPacked.nextStatus === 'out_for_delivery' && nextFromPacked.actionButtonText === 'Mark as Out for Delivery');

  const nextFromOut = getNextAllowedTransition('out_for_delivery');
  assert('Out for Delivery next status is delivered with label "Mark as Delivered"',
    nextFromOut.nextStatus === 'delivered' && nextFromOut.actionButtonText === 'Mark as Delivered');

  // TEST 2: Operating Hours & Status display verification
  console.log('\n>>> Testing Operating Hours and Restaurant Open/Closed Status:');
  // IST 11:00 AM is 660 mins, 8:45 PM is 1245 mins
  // Test with explicit dates in IST
  const dateDuringDay = new Date('2026-10-21T07:00:00Z'); // 12:30 PM IST (open)
  const dateBeforeOpen = new Date('2026-10-21T05:00:00Z'); // 10:30 AM IST (closed)
  const dateAfterClose = new Date('2026-10-21T16:00:00Z'); // 9:30 PM IST (closed)

  assert('Restaurant is OPEN at 12:30 PM IST', isRestaurantOpen(dateDuringDay) === true);
  assert('Restaurant is CLOSED at 10:30 AM IST', isRestaurantOpen(dateBeforeOpen) === false);
  assert('Restaurant is CLOSED at 9:30 PM IST', isRestaurantOpen(dateAfterClose) === false);

  // TEST 3: Timestamps computation and legacy order fallback
  console.log('\n>>> Testing Order Timeline Timestamps Computation:');
  const dummyOrder: any = {
    id: 'OB-TEST-101',
    createdAt: '2026-10-21T08:00:00.000Z',
    placedAt: '2026-10-21T08:00:00.000Z',
    packedAt: '2026-10-21T08:15:00.000Z',
    outForDeliveryAt: '2026-10-21T08:25:00.000Z',
    deliveredAt: '2026-10-21T08:45:00.000Z',
    status: 'delivered',
    statusHistory: [
      { status: 'pending', statusName: 'Order Placed', timestamp: '2026-10-21T08:00:00.000Z' },
      { status: 'packed', statusName: 'Order Packed', timestamp: '2026-10-21T08:15:00.000Z' },
      { status: 'out_for_delivery', statusName: 'Out for Delivery', timestamp: '2026-10-21T08:25:00.000Z' },
      { status: 'delivered', statusName: 'Delivered', timestamp: '2026-10-21T08:45:00.000Z' }
    ]
  };

  const timestamps = getOrderTimelineTimestamps(dummyOrder);
  assert('Extracts correct placedAt timestamp', timestamps.placedAt?.toISOString() === '2026-10-21T08:00:00.000Z');
  assert('Extracts correct packedAt timestamp', timestamps.packedAt?.toISOString() === '2026-10-21T08:15:00.000Z');
  assert('Extracts correct outForDeliveryAt timestamp', timestamps.outForDeliveryAt?.toISOString() === '2026-10-21T08:25:00.000Z');
  assert('Extracts correct deliveredAt timestamp', timestamps.deliveredAt?.toISOString() === '2026-10-21T08:45:00.000Z');

  // Legacy order with no statusHistory or explicit placedAt
  const legacyOrder: any = {
    id: 'OB-LEGACY-001',
    createdAt: '2026-10-20T10:00:00.000Z',
    status: 'pending'
  };
  const legacyTimestamps = getOrderTimelineTimestamps(legacyOrder);
  assert('Legacy order gracefully falls back to createdAt for placedAt', legacyTimestamps.placedAt?.toISOString() === '2026-10-20T10:00:00.000Z');
  assert('Legacy order packedAt is undefined before stage reached', legacyTimestamps.packedAt === undefined);

  // TEST 4: API Endpoints verification via fetch to running server
  console.log('\n>>> Testing Live Server Endpoints:');
  try {
    const settingsRes = await fetch('http://localhost:3000/api/settings');
    assert('Server returns site settings with status 200', settingsRes.status === 200);

    const categoriesRes = await fetch('http://localhost:3000/api/categories');
    assert('Server returns menu categories with status 200', categoriesRes.status === 200);

    const itemsRes = await fetch('http://localhost:3000/api/menu-items');
    assert('Server returns menu items with status 200', itemsRes.status === 200);

    // Test unauthorized status update rejected
    const unauthUpdateRes = await fetch('http://localhost:3000/api/orders/test-order-id/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'packed' }),
    });
    assert('Unauthorized user cannot update order status (HTTP 401/403)', unauthUpdateRes.status === 401 || unauthUpdateRes.status === 403);
  } catch (err: any) {
    console.error('Fetch error during server tests:', err);
    assert('Server response failed', false);
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} / ${total} tests PASSED`);
  console.log(`========================================\n`);
}

runTests();
