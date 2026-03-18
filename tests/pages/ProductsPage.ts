import { Page, Locator, expect } from '@playwright/test';

/**
 * ProductsPage — POM for the product listing page at route: /products
 *
 * data-testid map (ProductList.js):
 *   product-list         → <Grid data-testid="product-list"> container
 *   product-card-{id}    → <Card data-testid="product-card-{product._id}">
 *   add-to-cart-button   → <Button data-testid="add-to-cart-button"> on each card
 *                          (Note: your summary uses "add-to-cart-button" not per-id,
 *                           so we scope it to the first card by default)
 *
 * Navbar (Navbar.js):
 *   cart-button          → <IconButton data-testid="cart-button"> cart icon
 *
 * Cart snackbar (ProductList.js):
 *   The success snackbar has no data-testid — we locate it by role which is
 *   stable across MUI versions.
 */
export class ProductsPage {
  // ── Locators ───────────────────────────────────────────────────────────────
  private readonly productList: Locator;
  private readonly cartNavButton: Locator;

  constructor(private readonly page: Page) {
    this.productList = this.page.getByTestId('product-list');
    this.cartNavButton = this.page.getByTestId('cart-button');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Returns the card locator for a product by its MongoDB _id. */
  private cardById(productId: string): Locator {
    return this.page.getByTestId(`product-card-${productId}`);
  }

  /**
   * Returns all "Add to Cart" buttons currently visible on the page.
   * ProductList.js renders one per product for the customer role.
   */
  private get allAddToCartButtons(): Locator {
    return this.page.getByTestId('add-to-cart-button');
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Navigate directly to /products (only works when authenticated). */
  async goto() {
    await this.page.goto('/products');
    await this.expectLoaded();
  }

  /**
   * Wait for at least one product card to appear.
   * Products are fetched async — do NOT assert count before this resolves.
   */
  async waitForProducts() {
    await expect(this.productList).toBeVisible({ timeout: 10_000 });
    // Wait until at least one Add to Cart button renders (API response arrived)
    await expect(this.allAddToCartButtons.first()).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Add the first available product to the cart.
   * Returns the product name text so the caller can assert cart contents.
   */
  async addFirstProductToCart(): Promise<string> {
    await this.waitForProducts();

    // Grab the name from the first card before clicking — the snackbar will
    // confirm it by name, and the spec can verify cart contents by name too.
    const firstCard = this.page.getByTestId('product-list')
      .locator('[data-testid^="product-card-"]').first();

    const productName = await firstCard
      .locator('.MuiTypography-h6, h6')
      .first()
      .innerText();

    // Click the first Add to Cart button
    await this.allAddToCartButtons.first().click();

    return productName.trim();
  }

  /**
   * Add a product to cart by its exact name text.
   * Useful when the test needs a specific, predictable product.
   */
  async addProductToCartByName(name: string) {
    await this.waitForProducts();

    // Find the card whose h6 text matches the name, then click its button
    const cards = this.page.locator('[data-testid^="product-card-"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const cardName = await card.locator('h6').first().innerText();
      if (cardName.trim() === name) {
        await card.getByTestId('add-to-cart-button').click();
        return;
      }
    }

    throw new Error(`Product "${name}" not found on the products page`);
  }

  /** Navigate to the cart via the Navbar cart icon button. */
  async goToCartViaNavbar() {
    await this.cartNavButton.click();
    await expect(this.page).toHaveURL('/cart', { timeout: 10_000 });
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  /** Assert the product list container is visible. */
  async expectLoaded() {
    await expect(this.productList).toBeVisible({ timeout: 10_000 });
  }

  /** Assert at least `count` products are rendered (default: 1). */
  async expectProductCount(count = 1) {
    await expect(this.allAddToCartButtons).toHaveCount(
      await this.allAddToCartButtons.count(),
    );
    const actual = await this.allAddToCartButtons.count();
    expect(actual).toBeGreaterThanOrEqual(count);
  }

  /**
   * Assert the add-to-cart success snackbar appears with the product name.
   * The snackbar is rendered by MUI Snackbar + Alert — no data-testid needed
   * because its text content is deterministic: `"<name>" added to cart!`
   */
  async expectAddToCartConfirmation(productName: string) {
    const snackbar = this.page.locator('[role="alert"]').filter({
      hasText: `"${productName}" added to cart!`,
    });
    await expect(snackbar).toBeVisible({ timeout: 5_000 });
  }
}