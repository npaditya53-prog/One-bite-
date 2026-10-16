# ONE BITE MOTIHARI — Load Testing & Scalability Runbook

## 1. Overview & Performance Objectives
This test suite verifies that the ONE BITE Motihari web platform can reliably handle a peak concurrent load of **500 Virtual Users (VUs)** while maintaining:
- **HTTP Failure Rate**: < 1.0%
- **p95 Response Time**: < 1000 ms (1.0 second) for page and catalog requests
- **p99 Response Time**: < 3000 ms (3.0 seconds)
- **Data Integrity**: Zero lost or duplicate orders in database

---

## 2. Core Concepts: Distinguishing Virtual Users vs Requests vs Visitors
- **Virtual User (VU)**: An execution thread simulating a single customer interacting with the site (browsing home page, fetching menu, viewing offers, simulating cart order). A single VU generates multiple requests spaced by realistic user think-times (1–4 seconds).
- **Requests Per Second (RPS)**: The raw network throughput hitting the server or CDN cache. 500 active VUs typically produce **100–350 RPS** depending on user pacing.
- **Concurrent Visitors**: Actual human browser sessions on the site concurrently.
- **Edge CDN Offload**: Thanks to `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` and `ETag: 304`, up to 90% of catalog requests are served directly from Edge CDN POPs in < 20ms without invoking serverless compute.

---

## 3. Test Scenarios

| Scenario | Target VUs | Duration | Purpose | Command |
|---|---|---|---|---|
| **Smoke** | 5 VUs | 1 minute | Sanity check deployment | `k6 run -e SCENARIO=smoke tests/load/k6-suite.js` |
| **Normal** | 50 VUs | 3 minutes | Standard day-time restaurant load | `k6 run -e SCENARIO=normal tests/load/k6-suite.js` |
| **Ramp-Up** | 100 → 250 → 500 VUs | 9 minutes | Progressive scalability validation | `k6 run -e SCENARIO=rampup tests/load/k6-suite.js` |
| **Spike** | 10 → 500 VUs in 30s | 4 minutes | Festival promo surge / viral campaign | `k6 run -e SCENARIO=spike tests/load/k6-suite.js` |
| **Soak** | 500 VUs | 30 minutes | Sustained stability & memory leak test | `k6 run -e SCENARIO=soak tests/load/k6-suite.js` |

---

## 4. How to Execute Tests Safely on Staging
> **IMPORTANT**: Always target a staging deployment URL (`TARGET_URL`). Never target production without off-peak scheduling.
> All test orders pass the header `X-Load-Test: dry-run` to validate the entire backend item and pricing pipeline without creating real kitchen tickets.

### Prerequisites
Install k6:
- macOS: `brew install k6`
- Linux: `sudo gpg -k && sudo apt install k6`
- Windows: `choco install k6` or download binary from https://k6.io

### Running Tests
```bash
# 1. Run Smoke Test on local dev or staging
k6 run -e SCENARIO=smoke -e TARGET_URL=http://localhost:3000 tests/load/k6-suite.js

# 2. Run Progressive Ramp-up to 500 Virtual Users
k6 run -e SCENARIO=rampup -e TARGET_URL=https://staging.onebitemotihari.in tests/load/k6-suite.js

# 3. Run Spike Test to 500 Virtual Users
k6 run -e SCENARIO=spike -e TARGET_URL=https://staging.onebitemotihari.in tests/load/k6-suite.js

# 4. Run 30-Minute Soak Test
k6 run -e SCENARIO=soak -e TARGET_URL=https://staging.onebitemotihari.in tests/load/k6-suite.js
```

---

## 5. Monitoring & Cloud Resource Observability

### Vercel Dashboard Monitoring
1. **Analytics & Web Vitals**: Monitor **LCP (Largest Contentful Paint)**, **FID/INP**, and **CLS**.
2. **Serverless Function Metrics**: Check Execution Duration (ms), Invocations, and Memory Usage.
3. **Bandwidth & Cache Hit Ratio**: Ensure Edge Cache Hit Rate on `/assets/*` and `/api/data` exceeds 85%.

### Firebase Cloud Firestore Monitoring
1. **Reads / Writes Dashboard**: Go to Firebase Console → Firestore Database → Usage.
2. **Quota Tracking**: Monitor daily read operations. (Spark free tier provides 50,000 reads/day; Blaze pay-as-you-go provides scale-to-infinity at $0.06 per 100k reads).
3. **Billing Alerts**: Set up GCP Budget Alert at ₹500 and ₹1,500 thresholds to avoid unexpected costs.
