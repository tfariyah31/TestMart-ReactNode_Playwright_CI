import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// ─── Session file paths ───────────────────────────────────────────────────────
// global.setup.ts writes two files per role:
//   <role>.api.json   — { accessToken, refreshToken, user } used by API tests
//   <role>.state.json — Playwright storageState { cookies, origins } used by E2E tests
const sessions = (role: string) =>
  path.join(__dirname, 'tests', '.sessions', `${role}.state.json`);

export default defineConfig({
  // ─── Root ──────────────────────────────────────────────────────────────────
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  workers: 2,

  // ─── Reporter ──────────────────────────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/playwright-report', open: 'never' }],
  ],

  // ─── Shared defaults (all projects inherit these) ─────────────────────────
  use: {
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // ─── Projects ──────────────────────────────────────────────────────────────
  projects: [

    // ── 1. Setup ─────────────────────────────────────────────────────────────
    // Runs global.setup.ts as a named project so it appears in the report and
    // can be declared as a dependency. E2E tests will never start until this
    // project completes successfully.
    {
      name: 'setup',
      testMatch: 'global.setup.ts',
    },

    // ── 2. API ────────────────────────────────────────────────────────────────
    // Pure HTTP tests — no browser, no storageState needed.
    // Depends on `setup` so sessions are always fresh before API specs run.
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      dependencies: ['setup'],
    },

    // ── 3. E2E — Customer (pre-authenticated) ────────────────────────────────
    // Browser context is pre-authenticated as `customer` via storageState.
    // Reserved for isolated post-login tests (cart management, product browsing)
    // that do NOT need to exercise the login form.
    // These specs live in tests/e2e/customer/authenticated/
    {
      name: 'e2e:customer',
      testMatch: '**/e2e/customer/authenticated/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        storageState: sessions('customer'),
      },
    },

    // ── 4. E2E — Merchant ─────────────────────────────────────────────────────
    {
      name: 'e2e:merchant',
      testMatch: '**/e2e/merchant/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        storageState: sessions('merchant'),
      },
    },

    // ── 5. E2E — Super Admin ──────────────────────────────────────────────────
    {
      name: 'e2e:superadmin',
      testMatch: '**/e2e/admin/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        storageState: sessions('superadmin'),
      },
    },

    // ── 6. E2E — Auth (unauthenticated) ───────────────────────────────────────
    // Login-page tests intentionally start with NO storageState so the browser
    // context is a clean guest session — exactly what login flow tests need.
    {
      name: 'e2e:auth',
      testMatch: '**/e2e/auth/**/*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        // No storageState — tests exercise the login form itself
      },
    },

    // ── 7. E2E — Customer Journey (unauthenticated) ────────────────────────
    // Full end-to-end flow: login form → dashboard → products → cart → checkout.
    // Starts with NO storageState because the journey validates the login step
    // itself — the test must begin as a guest, not a pre-authenticated user.
    {
      name: 'e2e:journey',
      testMatch: '**/e2e/customer/**/*.spec.ts',
  
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        extraHTTPHeaders: {},
        launchOptions: {
          args: [
            '--host-resolver-rules=MAP merchant-ui-api.stripe.com 127.0.0.1',
            '--ignore-certificate-errors',
          ],
        },
      },
    },
  ],
});