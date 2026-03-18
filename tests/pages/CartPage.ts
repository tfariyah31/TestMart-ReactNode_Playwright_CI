import { Page, expect } from '@playwright/test';

/**
 * CartPage — POM for the cart page at route: /cart
 *
 * data-testid map (Cart.js):
 *   cart-container          → <Box data-testid="cart-container">
 *   cart-item-{id}          → <Box data-testid="cart-item-{item._id}"> per item row
 *   cart-total              → <Typography data-testid="cart-total"> — order total
 *   cart-checkout-btn       → <Button data-testid="cart-checkout-btn"> (rendered
 *                             inside CheckoutPayment component)
 *   continue-shopping-button→ <Button data-testid="continue-shopping-button">
 *   clear-cart-button       → <Button data-testid="clear-cart-button">
 *   quantity-increase       → <IconButton data-testid="quantity-increase">
 *   quantity-decrease       → <IconButton data-testid="quantity-decrease">
 *   remove-item             → <IconButton data-testid="remove-item">
 *
 * CheckoutPayment (CheckoutPayment.js):
 *   payment-form            → <form data-testid="payment-form">
 *   card-element-wrapper    → <Paper data-testid="card-element-wrapper">
 *   pay-button              → <Button data-testid="pay-button">
 *   charge-amount           → <Chip data-testid="charge-amount">
 *
 * Note: Cart.js renders CheckoutPayment inline inside the Order Summary card,
 * so all payment data-testids are reachable on the /cart route without
 * navigating away.
 */
export class CartPage {
  // ── Locators ───────────────────────────────────────────────────────────────
  private readonly cartContainer;
  private readonly cartTotal;
  private readonly checkoutButton;
  private readonly continueShoppingBtn;
  private readonly clearCartButton;
  private readonly paymentForm;
  private readonly chargeAmount;

  constructor(private readonly page: Page) {
    this.cartContainer       = this.page.getByTestId('cart-container');
    this.cartTotal           = this.page.getByTestId('cart-total');
    this.checkoutButton      = this.page.getByTestId('cart-checkout-btn');
    this.continueShoppingBtn = this.page.getByTestId('continue-shopping-button');
    this.clearCartButton     = this.page.getByTestId('clear-cart-button');
    this.paymentForm         = this.page.getByTestId('payment-form');
    this.chargeAmount        = this.page.getByTestId('charge-amount');
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Navigate directly to /cart. */
  async goto() {
    await this.page.goto('/cart');
    await this.expectLoaded();
  }

  /** Click the "← Continue Shopping" button → back to /products. */
  async continueShopping() {
    await this.continueShoppingBtn.click();
    await expect(this.page).toHaveURL('/products', { timeout: 10_000 });
  }

  /** Increase quantity of the nth cart item (0-indexed). */
  async increaseQuantity(itemIndex = 0) {
    await this.page.getByTestId('quantity-increase').nth(itemIndex).click();
  }

  /** Decrease quantity of the nth cart item (0-indexed). */
  async decreaseQuantity(itemIndex = 0) {
    await this.page.getByTestId('quantity-decrease').nth(itemIndex).click();
  }

  /** Remove the nth cart item (0-indexed). */
  async removeItem(itemIndex = 0) {
    await this.page.getByTestId('remove-item').nth(itemIndex).click();
  }

  /** Click the "Clear Cart" text button. */
  async clearCart() {
    await this.clearCartButton.click();
  }

  /**
   * Read the order total text.
   * Cart.js calculates: subtotal + 8% tax, displayed as "$XX.XX"
   */
  async getTotal(): Promise<string> {
    return (await this.cartTotal.innerText()).trim();
  }

  /**
   * Read the charge amount shown on the Stripe pay button chip.
   * This should match the cart total.
   */
  async getChargeAmount(): Promise<string> {
    return (await this.chargeAmount.innerText()).trim();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  /** Assert the cart container is visible (page fully rendered). */
  async expectLoaded() {
    await expect(this.cartContainer).toBeVisible({ timeout: 10_000 });
  }

  /** Assert at least one item is in the cart. */
  async expectCartNotEmpty() {
    const items = this.page.locator('[data-testid^="cart-item-"]');
    await expect(items.first()).toBeVisible({ timeout: 5_000 });
  }

  /** Assert a specific item is present by its product name text. */
  async expectItemInCart(productName: string) {
    const item = this.page.locator('[data-testid^="cart-item-"]').filter({
      hasText: productName,
    });
    await expect(item).toBeVisible({ timeout: 5_000 });
  }

  /** Assert the payment form (Stripe) is rendered and ready. */
  async expectPaymentFormVisible() {
    await expect(this.paymentForm).toBeVisible({ timeout: 10_000 });
    await expect(this.chargeAmount).toBeVisible();
  }

  /** Assert the cart total label is visible. */
  async expectTotalVisible() {
    await expect(this.cartTotal).toBeVisible();
  }
}