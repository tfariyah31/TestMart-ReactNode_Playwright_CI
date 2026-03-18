import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * CheckoutPage — POM for the Stripe payment form rendered inside Cart at /cart
 *
 * data-testid map (CheckoutPayment.js):
 *   payment-form         → <form data-testid="payment-form">
 *   card-element-wrapper → <Paper data-testid="card-element-wrapper">
 *   pay-button           → <Button data-testid="pay-button">
 *   payment-message      → <Alert data-testid="payment-message">
 *   charge-amount        → <Chip data-testid="charge-amount">
 * Test card (Stripe test mode):
 *   Number:  4242 4242 4242 4242
 *   Expiry:  12/26  (any future date)
 *   CVC:     424    (any 3 digits)
 *   ZIP:     42424  (any 5 digits)
 */

const STRIPE_TEST_CARD = {
  number: '4242424242424242',
  expiry: '1226',
  cvc:    '424',
  zip:    '42424',
};


export class CheckoutPage {
  // ── Locators ───────────────────────────────────────────────────────────────
  private readonly paymentForm;
  private readonly payButton;
  private readonly paymentMessage;
  private readonly chargeAmount;

  /**
   * The Stripe card input iframe identified by its stable `title` attribute.
   */

  private get stripeFrame() {
    return this.page.frameLocator(
      'iframe[title="Secure card payment input frame"]',
    );
  }

  constructor(private readonly page: Page) {
    this.paymentForm    = this.page.getByTestId('payment-form');
    this.payButton      = this.page.getByTestId('pay-button');
    this.paymentMessage = this.page.getByTestId('payment-message');
    this.chargeAmount   = this.page.getByTestId('charge-amount');
  }
  
  static async setupContext(context: BrowserContext): Promise<void> {
  // Dialog dismisser only — merchant-ui-api.stripe.com is blocked at
  // DNS level via --host-resolver-rules in playwright.config.ts
  const dismissDialogs = (p: import('@playwright/test').Page) => {
    p.on('dialog', async (dialog) => {
      await dialog.dismiss().catch(() => {});
    });
  };
  for (const p of context.pages()) dismissDialogs(p);
  context.on('page', (p) => dismissDialogs(p));
}

    // ── Actions ────────────────────────────────────────────────────────────────

  async fillStripeCard(card = STRIPE_TEST_CARD) {

    // Wait for the Stripe form and pay button to be fully initialised
    await expect(this.paymentForm).toBeVisible({ timeout: 15_000 });
    await expect(this.payButton).toBeEnabled({ timeout: 15_000 });

    const frame = this.stripeFrame;

    // ── Fill card number ────────────────────────────────────────────────────
    
    const cardField = frame.locator('[name="cardnumber"]');
    for (let attempt = 1; attempt <= 3; attempt++) {
      await cardField.click();
      await cardField.pressSequentially(card.number, { delay: 50 });

      // Stripe formats the number as "4242 4242 4242 4242" with spaces
      const value = await cardField.inputValue().catch(() => '');
      if (value.replace(/\s/g, '').length === 16) break;
      if (attempt === 3) throw new Error(`Card number not accepted after ${attempt} attempts. Got: "${value}"`);
      await this.page.waitForTimeout(300);
    }

    // Expiry 
    await frame.locator('[name="exp-date"]').click();
    await frame.locator('[name="exp-date"]').pressSequentially(card.expiry, { delay: 50 });

    // CVC
    await frame.locator('[name="cvc"]').click();
    await frame.locator('[name="cvc"]').pressSequentially(card.cvc, { delay: 50 });

    // Postal code 
    const postalField = frame.locator('[name="postal"]');
    if (await postalField.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await postalField.click();
      await postalField.pressSequentially(card.zip, { delay: 50 });
    }

    // ── Stability wait ──────────────────────────────────────────────────────
    
    await this.page.waitForTimeout(1_500);

    // ── Verify card is still filled after the wait ──────────────────────────
    const finalValue = await frame.locator('[name="cardnumber"]').inputValue().catch(() => '');
    if (finalValue.replace(/\s/g, '').length < 16) {
      throw new Error(`Card number was cleared by re-render. Value after wait: "${finalValue}". Stop the Navbar poll (setInterval in Navbar.js) to fix this permanently.`);
    }
  }

  /**
   * Click the Pay button.
   */

  async placeOrder() {
    await this.payButton.click();
    // Button shows "Processing…" 
    await expect(this.payButton).toContainText('Processing…', { timeout: 5_000 })
      .catch(() => {});
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  /** "Payment successful! 🎉" alert from CheckoutPayment.js */
  async expectPaymentSuccess() {
    await expect(this.paymentMessage).toBeVisible({ timeout: 20_000 });
    await expect(this.paymentMessage).toContainText('Payment successful');
  }

  /** "🎉 Order placed successfully! Redirecting to products..." snackbar from Cart.js */
  async expectOrderPlacedSnackbar() {
    const snackbar = this.page.locator('.MuiAlert-message', { hasText: 'Order placed successfully!' });
    await expect(snackbar).toBeVisible({ timeout: 15_000 });
  }

  /** Cart.js redirects to /products 2500ms after onSuccess() */
  async expectRedirectedToProducts() {
    await expect(this.page).toHaveURL('/products', { timeout: 10_000 });
  }

  /** Charge amount chip must match the cart total e.g. "$54.00" */
  async expectChargeAmount(expectedTotal: string) {
    await expect(this.chargeAmount).toContainText(expectedTotal);
  }
}