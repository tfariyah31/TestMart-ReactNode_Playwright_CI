import { test as base } from '@playwright/test';
import { LoginPage }    from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductsPage }  from '../pages/ProductsPage';
import { CartPage }      from '../pages/CartPage';
import { CheckoutPage }  from '../pages/CheckoutPage';

/**
 * page.fixture.ts — extends Playwright's base `test` with POM instances.
 *
 * Why a fixture instead of `new XxxPage(page)` in each test?
 * ─────────────────────────────────────────────────────────────
 * 1. DRY — POMs are instantiated once per test automatically.
 * 2. Typed — TypeScript knows the exact return type of each fixture.
 * 3. Scoped — each fixture uses the same `page` instance that Playwright
 *    provides for that test, so storageState, tracing, and screenshots
 *    all work correctly without any extra wiring.
 * 4. Readable — test signatures document exactly which pages are touched:
 *
 *    test('...', async ({ loginPage, productsPage, cartPage }) => { ... })
 *
 * Usage:
 *   Import `test` and `expect` from this file instead of @playwright/test
 *   in any spec that needs POM access.
 *
 *   import { test, expect } from '../../fixtures/page.fixture';
 */

// ── Fixture type declaration ──────────────────────────────────────────────────
type PageFixtures = {
  loginPage:     LoginPage;
  dashboardPage: DashboardPage;
  productsPage:  ProductsPage;
  cartPage:      CartPage;
  checkoutPage:  CheckoutPage;
};

// ── Extended test object ──────────────────────────────────────────────────────
export const test = base.extend<PageFixtures>({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

});

// Re-export expect so specs only need one import line
export { expect } from '@playwright/test';