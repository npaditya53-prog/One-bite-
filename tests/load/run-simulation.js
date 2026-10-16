/**
 * Lightweight Concurrent Load Simulator & Verification Script
 * Tests the local server endpoints with concurrent promises to measure real latency & error rates.
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 50;
const REQUESTS_PER_USER = 4;

function makeRequest(path, options = {}) {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          status: res.statusCode,
          duration,
          headers: res.headers,
          ok: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, duration: Date.now() - start, error: err.message, ok: false });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runBenchmark() {
  console.log(`Starting load simulation: ${CONCURRENT_USERS} concurrent simulated clients...`);
  const latencies = [];
  let failures = 0;
  let totalRequests = 0;

  const userTasks = Array.from({ length: CONCURRENT_USERS }).map(async (_, vuId) => {
    for (let r = 0; r < REQUESTS_PER_USER; r++) {
      totalRequests++;
      // 1. Fetch homepage
      const pageRes = await makeRequest('/');
      latencies.push(pageRes.duration);
      if (!pageRes.ok) failures++;

      // 2. Fetch API catalog with ETag check
      const catRes = await makeRequest('/api/data');
      latencies.push(catRes.duration);
      if (!catRes.ok) failures++;

      // 3. Conditional 304 revalidation
      if (catRes.headers && catRes.headers.etag) {
        const condRes = await makeRequest('/api/data', {
          headers: { 'if-none-match': catRes.headers.etag },
        });
        latencies.push(condRes.duration);
        if (condRes.status !== 304 && !condRes.ok) failures++;
      }

      // 4. Dry-run order check
      const orderRes = await makeRequest('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Load-Test': 'dry-run',
        },
        body: JSON.stringify({
          customerName: `VU_${vuId}_R${r}`,
          customerPhone: `98765432${(vuId % 90 + 10)}`,
          orderType: 'takeaway',
          items: [{ id: 'item_addon_extra_cheese', quantity: 1, unitPrice: 35 }],
          subtotal: 35,
          totalAmount: 35,
          isDryRun: true,
        }),
      });
      latencies.push(orderRes.duration);
      if (!orderRes.ok) failures++;
    }
  });

  const startTime = Date.now();
  await Promise.all(userTasks);
  const totalDurationMs = Date.now() - startTime;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const failureRatePercent = (failures / latencies.length) * 100;
  const reqPerSec = (latencies.length / (totalDurationMs / 1000)).toFixed(1);

  console.log('\n--- LOAD SIMULATION RESULTS ---');
  console.log(`Total HTTP Requests: ${latencies.length}`);
  console.log(`Wall Clock Time:     ${totalDurationMs} ms (${reqPerSec} req/sec)`);
  console.log(`HTTP Failure Rate:   ${failureRatePercent.toFixed(2)}% (Target: < 1.0%)`);
  console.log(`Median Latency (p50): ${p50} ms`);
  console.log(`95th Percentile (p95): ${p95} ms (Target: < 1000 ms)`);
  console.log(`99th Percentile (p99): ${p99} ms (Target: < 3000 ms)`);
  console.log('-------------------------------\n');
}

runBenchmark().catch(console.error);
