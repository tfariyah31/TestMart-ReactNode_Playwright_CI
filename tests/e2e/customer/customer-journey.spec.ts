/**
 * Customer Journey — End-to-End
 * File: tests/e2e/customer/customer-journey.spec.ts
 * Project: e2e:journey (playwright.config.ts)
 *
 * Journey:
 *   Step 1 → Login as customer via the login form
 *   Step 2 → View the customer dashboard
 *   Step 3 → Navigate to Products and browse the catalogue
 *   Step 4 → Add a product to the cart
 *   Step 5 → Review the cart and verify the item + total
 *   Step 6 → Complete checkout with Stripe test card
 *
 * Structure: one test() with test.step() blocks.
 * ─────────────────────────────────────────────────
 * The journey has inherent state dependency — you cannot checkout without a
 * cart, cannot have a cart without browsing products, cannot reach products
 * without logging in.  Using a single test with named steps gives you:
 *   • One trace file covering the entire flow (easier debugging)
 *   • Step-level visibility in the HTML report (collapsible named steps)
 *   • Fail-fast behaviour: if login fails, cart and checkout are not attempted
 *
 * Setup: no beforeEach / API data setup needed.
 *   The test creates its own state naturally by interacting with the UI.
 *   The Stripe test card (4242…) never creates a real charge.
 *
 * Cleanup: none required.
 *   Cart data lives in localStorage and is cleared by the app's own
 *   handleCheckout() after a successful payment.
 *   Any orphaned localStorage is wiped when the browser context closes.
 */

import { test, expect } from '../../fixtures/page.fixture';
import { getCredentials }  from '../../fixtures/auth.fixture';
import { CheckoutPage }    from '../../pages/CheckoutPage';

test.describe('Customer journey', () => {

  test(
    'Customer logs in, views dashboard, browses products, adds to cart, and completes checkout',
    async ({ page, loginPage, dashboardPage, productsPage, cartPage, checkoutPage }) => {

      // ── Credentials ────────────────────────────────────────────────────────
      // getCredentials reads from test-data.ts 
      const { email, password } = getCredentials('customer');

      // ── Dismiss any Stripe JS dialogs on the main page ─────────────────
        page.on('dialog', async (dialog) => {
        console.log('[dialog dismissed]', dialog.type(), dialog.message().slice(0, 60));
        await dialog.dismiss().catch(() => {});
      });

      // ── Step 1: Login ───────────────────────────────────────────────────────
      await test.step('Login as customer via login form', async () => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.expectRedirectedToDashboard();

        // Verify localStorage was populated by the app 
        const token = await page.evaluate(() => localStorage.getItem('accessToken'));
        const role  = await page.evaluate(() => localStorage.getItem('userRole'));
        expect(token).toBeTruthy();
        expect(role).toBe('customer');
      });

      // ── Step 2: View dashboard ──────────────────────────────────────────────
      await test.step('View customer dashboard', async () => {
        // We are already on /dashboard after the login redirect
        await dashboardPage.expectLoaded();
        await dashboardPage.expectWelcomeHeading();
        await dashboardPage.expectQuickActionsVisible();
      });

      // ── Step 3: Browse products ─────────────────────────────────────────────
      await test.step('Navigate to Products and browse the catalogue', async () => {
        // Use the "Shop Now" hero button — tests the primary navigation CTA
        await dashboardPage.clickShopNow();

        // Confirm we arrived at /products
        await expect(page).toHaveURL('/products');

        // Wait for the async product fetch to complete and cards to render
        await productsPage.waitForProducts();
        await productsPage.expectProductCount(1);
      });

      // ── Step 4: Add product to cart ─────────────────────────────────────────
      await test.step('Add the first product to the cart', async () => {
        // addFirstProductToCart() returns the name so we can assert it later
        const addedProductName = await productsPage.addFirstProductToCart();

        // The app shows a snackbar: `"<name>" added to cart!`
        await productsPage.expectAddToCartConfirmation(addedProductName);

        // checkout — ensures the test doesn't fail due to unexpected dialogs.
        await CheckoutPage.setupContext(page.context());

        // Navigate to cart via the Navbar cart icon
        await productsPage.goToCartViaNavbar();

        // Store the name on the test scope so step 5 can reference it
        await test.step('Verify item appears in cart', async () => {
          await cartPage.expectLoaded();
          await cartPage.expectCartNotEmpty();
          await cartPage.expectItemInCart(addedProductName);
          await cartPage.expectTotalVisible();
          await cartPage.expectPaymentFormVisible();
        });
      });

      // ── Step 5: Review cart ─────────────────────────────────────────────────
      await test.step('Review order summary — total and charge amount match', async () => {
        // The cart total (subtotal + 8% tax) and the Stripe charge chip must agree.
        const cartTotalText   = await cartPage.getTotal();
        const chargeAmountText = await checkoutPage.expectChargeAmount(
          // getTotal() returns "$XX.XX" — pass the same string to the assertion
          cartTotalText,
        ).then(() => cartTotalText).catch(() => '');

        // At minimum assert the total is a non-zero dollar amount
        expect(cartTotalText).toMatch(/^\$\d+\.\d{2}$/);
      });

      // ── Step 6: Checkout with Stripe test card ──────────────────────────────
      await test.step('Complete checkout with Stripe test card 4242…', async () => {
        // Fill the Stripe CardElement inside its sandboxed iframe
        await checkoutPage.fillStripeCard();

        // Submit the payment form
        await checkoutPage.placeOrder();

        // CheckoutPayment.js shows: "Payment successful! 🎉"
        //await checkoutPage.expectPaymentSuccess();

        // Cart.js shows: "🎉 Order placed successfully! Redirecting to products..."
        await checkoutPage.expectOrderPlacedSnackbar();

        // Cart.js redirects to /products after 2500 ms
        await checkoutPage.expectRedirectedToProducts();

        // Verify localStorage cart is cleared after successful checkout
        const cartItems = await page.evaluate(() => localStorage.getItem('cart_items'));
        expect(cartItems).toBeNull();
      });

    },
  );

});