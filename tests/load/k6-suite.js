/**
 * ONE BITE MOTIHARI - K6 Scalability & Load Testing Suite
 *
 * Target: Up to 500 Concurrent Virtual Users (VUs)
 *
 * Scenarios Included:
 * 1. smoke: 5 VUs (Sanity check)
 * 2. normal: 50 VUs (Standard day traffic)
 * 3. rampup: Progressive ramp from 100 -> 250 -> 500 VUs
 * 4. spike: Instant surge to 500 VUs (Viral social media / festive promo surge)
 * 5. soak: Sustained 500 VUs for 30 minutes (Stability & memory leak audit)
 *
 * Safe Staging Policy:
 * - Sends 'X-Load-Test: dry-run' header so orders are fully validated server-side
 *   without polluting real restaurant orders or generating fake kitchen tickets.
 *
 * Run Examples:
 *   k6 run -e SCENARIO=smoke tests/load/k6-suite.js
 *   k6 run -e SCENARIO=rampup -e TARGET_URL=http://localhost:3000 tests/load/k6-suite.js
 *   k6 run -e SCENARIO=spike -e TARGET_URL=https://your-staging-url.vercel.app tests/load/k6-suite.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Custom Metrics
const pageLoadDuration = new Trend('page_load_duration', true);
const catalogApiDuration = new Trend('catalog_api_duration', true);
const orderSimulationDuration = new Trend('order_simulation_duration', true);
const successfulOrders = new Counter('successful_orders');
const failureRate = new Rate('custom_failure_rate');

// Selected Scenario (Default: smoke)
const SCENARIO_NAME = __ENV.SCENARIO || 'smoke';
const BASE_URL = (__ENV.TARGET_URL || 'http://localhost:3000').replace(/\/$/, '');

// Scenario Definitions
const scenarios = {
  smoke: {
    executor: 'constant-vus',
    vus: 5,
    duration: '1m',
  },
  normal: {
    executor: 'ramping-vus',
    startVUs: 5,
    stages: [
      { duration: '30s', target: 50 },
      { duration: '2m', target: 50 },
      { duration: '30s', target: 0 },
    ],
  },
  rampup: {
    executor: 'ramping-vus',
    startVUs: 10,
    stages: [
      { duration: '1m', target: 100 },
      { duration: '2m', target: 250 },
      { duration: '3m', target: 500 },
      { duration: '2m', target: 500 },
      { duration: '1m', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 10,
    stages: [
      { duration: '10s', target: 50 },
      { duration: '30s', target: 500 }, // Sudden viral surge
      { duration: '3m', target: 500 },
      { duration: '30s', target: 0 },
    ],
  },
  soak: {
    executor: 'ramping-vus',
    startVUs: 50,
    stages: [
      { duration: '2m', target: 500 },
      { duration: '30m', target: 500 }, // 30-minute sustained soak
      { duration: '2m', target: 0 },
    ],
  },
};

export const options = {
  scenarios: {
    selected_scenario: scenarios[SCENARIO_NAME] || scenarios.smoke,
  },
  thresholds: {
    // 1. HTTP failure rate must stay below 1%
    http_req_failed: ['rate<0.01'],
    custom_failure_rate: ['rate<0.01'],

    // 2. p95 response time below 1 second for standard requests
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
    catalog_api_duration: ['p(95)<800', 'p(99)<2000'],
    page_load_duration: ['p(95)<1000'],
  },
};

export default function () {
  const commonHeaders = {
    'User-Agent': 'OneBite-K6-LoadTest/1.0',
    'Accept': 'application/json, text/html, */*',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  // Group 1: Visit Restaurant Home Page
  group('1. Homepage & Static Bundle Load', () => {
    const pageRes = http.get(`${BASE_URL}/`, { headers: commonHeaders });
    const pageOk = check(pageRes, {
      'homepage status is 200': r => r.status === 200,
      'has HTML content': r => r.body && r.body.includes('One Bite'),
    });
    failureRate.add(!pageOk);
    pageLoadDuration.add(pageRes.timings.duration);
  });

  sleep(Math.random() * 2 + 1); // User browses hero banner (1-3s)

  // Group 2: Hydrate Menu & Active Offers Catalog (/api/data)
  let catalogItems = [];
  group('2. Fetch Menu & Offers Catalog', () => {
    const catalogRes = http.get(`${BASE_URL}/api/data`, { headers: commonHeaders });
    const catalogOk = check(catalogRes, {
      'catalog status is 200 or 304': r => r.status === 200 || r.status === 304,
      'contains categories': r => r.status === 304 || (r.json('categories') && r.json('categories').length > 0),
      'contains menuItems': r => r.status === 304 || (r.json('menuItems') && r.json('menuItems').length > 0),
    });
    failureRate.add(!catalogOk);
    catalogApiDuration.add(catalogRes.timings.duration);

    if (catalogRes.status === 200) {
      const body = catalogRes.json();
      if (body.menuItems) catalogItems = body.menuItems;
    }
  });

  sleep(Math.random() * 3 + 2); // User browses menu items (2-5s)

  // Group 3: Simulate Order Generation via WhatsApp Checkout (20% of users place orders)
  if (Math.random() < 0.2) {
    group('3. WhatsApp Order Submission (Dry-Run Staging)', () => {
      // Pick a sample item
      const itemToOrder = catalogItems.length > 0 ? catalogItems[0] : {
        id: 'item_veg_burger',
        name: 'Veg Aloo Tikki Burger',
        slug: 'veg-aloo-tikki-burger',
        foodType: 'veg',
        unitPrice: 80,
      };

      const orderPayload = JSON.stringify({
        customerName: `Virtual User ${__VU}`,
        customerPhone: '9876543210',
        orderType: 'takeaway',
        notes: 'k6 performance verification test',
        items: [
          {
            id: itemToOrder.id,
            name: itemToOrder.name,
            slug: itemToOrder.slug,
            quantity: 2,
            unitPrice: itemToOrder.price || 80,
          },
        ],
        subtotal: 160,
        addonsTotal: 0,
        totalAmount: 160,
        isDryRun: true, // Safeguard: prevents creating real restaurant tickets
      });

      const orderHeaders = {
        ...commonHeaders,
        'Content-Type': 'application/json',
        'X-Load-Test': 'dry-run',
      };

      const orderRes = http.post(`${BASE_URL}/api/orders`, orderPayload, { headers: orderHeaders });
      const orderOk = check(orderRes, {
        'order status is 201 or 200': r => r.status === 201 || r.status === 200,
        'order response has id': r => Boolean(r.json('id')),
        'order verified server-side': r => r.json('totalAmount') !== undefined,
      });

      failureRate.add(!orderOk);
      orderSimulationDuration.add(orderRes.timings.duration);
      if (orderOk) successfulOrders.add(1);
    });
  }

  sleep(Math.random() * 2 + 1);
}
