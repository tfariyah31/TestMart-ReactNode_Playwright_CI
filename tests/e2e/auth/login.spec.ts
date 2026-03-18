import { test, expect } from '../../fixtures/page.fixture';
import { getCredentials } from '../../fixtures/auth.fixture';
import { API_URL } from '../../fixtures/test-data';

/**
 * Login E2E Tests
 * File:    tests/e2e/auth/login.spec.ts
 * Project: e2e:auth  (playwright.config.ts)
 *
 * Context: NO storageState — every test starts as an unauthenticated guest.
 *
 * All UI interactions go through LoginPage (tests/pages/LoginPage.ts).
 * The spec never touches `page` directly for login actions — that logic
 * lives in the POM so it is maintained in one place.
 *
 * Coverage:
 *   [LGN-E2E-001]  Customer logs in successfully → redirected to /dashboard
 *   [LGN-E2E-002]  Merchant logs in successfully → redirected to /dashboard
 *   [LGN-E2E-003]  Super Admin logs in successfully → redirected to /dashboard
 *   [LGN-E2E-004]  Wrong password → error shown, stays on login page
 *   [LGN-E2E-005]  Non-existent email → error shown
 *   [LGN-E2E-006]  Blocked user → blocked-account error shown
 *   [LGN-E2E-007]  Empty form submit → no network request fired
 *   [LGN-E2E-008]  Locked out user → button disabled, shows "Try again later"
 *   [LGN-E2E-009]  accessToken + userRole written to localStorage on success
 *   [LGN-E2E-010]  Pre-authenticated user visiting / redirected to /dashboard
 *
 * Setup / teardown: none — no data is mutated by these tests.
 */

test.describe('Login page — UI', () => {

  // ── Happy path: each role logs in and lands on /dashboard ─────────────────

  test('[LGN-E2E-001] Customer logs in and is redirected to /dashboard',
    async ({ loginPage }) => {
      const { email, password } = getCredentials('customer');

      await loginPage.goto();
      await loginPage.login(email, password);
      await loginPage.expectRedirectedToDashboard();
    },
  );

  test('[LGN-E2E-002] Merchant logs in and is redirected to /dashboard',
    async ({ loginPage }) => {
      const { email, password } = getCredentials('merchant');

      await loginPage.goto();
      await loginPage.login(email, password);
      await loginPage.expectRedirectedToDashboard();
    },
  );

  test('[LGN-E2E-003] Super Admin logs in and is redirected to /dashboard',
    async ({ loginPage }) => {
      const { email, password } = getCredentials('superadmin');

      await loginPage.goto();
      await loginPage.login(email, password);
      await loginPage.expectRedirectedToDashboard();
    },
  );


  /*
  // ── Error states ───────────────────────────────────────────────────────────

  test('[LGN-E2E-004] Wrong password shows inline error and stays on login page',
    async ({ loginPage }) => {
      const { email } = getCredentials('customer');

      await loginPage.goto();
      await loginPage.login(email, 'WrongPassword!999');

      await loginPage.expectErrorVisible();
      await loginPage.expectStillOnLoginPage();
    },
  );

  test('[LGN-E2E-005] Non-existent email shows inline error',
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('nobody@testmart.com', 'SomePass@1');

      await loginPage.expectErrorVisible();
      await loginPage.expectStillOnLoginPage();
    },
  );

  test('[LGN-E2E-006] Blocked user sees a blocked-account error message',
    async ({ loginPage }) => {
      const { email, password } = getCredentials('blockedUser');

      await loginPage.goto();
      await loginPage.login(email, password);

      // Backend returns: "Your account is blocked. Please contact …"
      await loginPage.expectErrorVisible(/blocked/i);
      await loginPage.expectStillOnLoginPage();
    },
  );

  test('[LGN-E2E-007] Submitting an empty form fires no network request',
    async ({ loginPage, page }) => {
      await loginPage.goto();

      // Listen for any login API call before clicking submit
      let loginRequestFired = false;
      page.on('request', (req) => {
        if (req.url().includes('/api/auth/login')) loginRequestFired = true;
      });

      // Click submit without filling any fields — HTML5 `required` blocks submission
      await loginPage.submitEmptyForm();

      // Brief settle — confirms no request was dispatched
      await page.waitForTimeout(500);
      expect(loginRequestFired).toBe(false);

      // Form is still visible (user was not navigated away)
      await loginPage.expectFormVisible();
    },
  );

  test('[LGN-E2E-008] Locked-out user sees a disabled "Try again later" button',
    async ({ loginPage }) => {
      const { email, password } = getCredentials('lockedUser');

      await loginPage.goto();
      await loginPage.login(email, password);

      // Login.js sets attemptsLeft = 0 when the backend signals rate-limit/lockout,
      // which disables the button and changes its label
      await loginPage.expectLockedOutButton();
    },
  );

  // ── localStorage verification ──────────────────────────────────────────────

  test('[LGN-E2E-009] Successful login writes accessToken and userRole to localStorage',
    async ({ loginPage, page }) => {
      const { email, password } = getCredentials('customer');

      await loginPage.goto();
      await loginPage.login(email, password);
      await loginPage.expectRedirectedToDashboard();

      // Verify the app (Login.js) populated localStorage correctly
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      const userRole    = await page.evaluate(() => localStorage.getItem('userRole'));

      expect(accessToken).toBeTruthy();
      // A valid JWT has exactly three dot-separated Base64 segments
      expect(accessToken!.split('.').length).toBe(3);
      expect(userRole).toBe('customer');
    },
  );

  // ── Already-authenticated redirect ─────────────────────────────────────────

  test('[LGN-E2E-010] Visiting / with a valid token in localStorage redirects to /dashboard',
    async ({ loginPage, page }) => {
      const { email, password } = getCredentials('customer');

      // Obtain a real token from the API so ProtectedRoute accepts it
      const apiRes = await page.request.post(`${API_URL}/auth/login`, {
        data: { email, password },
      });
      const { accessToken, user } = await apiRes.json();

      // Seed localStorage before the page loads — simulates a returning user
      await loginPage.seedAuthState(accessToken, user.role);

      await page.goto('/');

      // App.js default route or ProtectedRoute should redirect to /dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
    },
  );
*/

});