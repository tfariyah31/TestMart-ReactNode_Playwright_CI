import { Page, expect } from '@playwright/test';

/**
 * DashboardPage — POM for the customer dashboard at route: /dashboard
 *
 * data-testid map (CustomerDashboard.js):
 *   dashboard-welcome      → <Typography data-testid="dashboard-welcome">My Dashboard
 *   dashboard-stats        → <Card data-testid="dashboard-stats"> (stats grid card)
 *   shop-now-button        → <Button data-testid="shop-now-button">Shop Now
 *   browse-products-button → Quick Actions "Browse Products" button
 *   view-cart-button       → Quick Actions "View Cart" button
 */
export class DashboardPage {
  // ── Locators ───────────────────────────────────────────────────────────────
  private readonly welcomeHeading;
  private readonly statsCard;
  private readonly shopNowButton;
  private readonly browseProductsBtn;
  private readonly viewCartButton;

  constructor(private readonly page: Page) {
    this.welcomeHeading    = this.page.getByTestId('dashboard-welcome');
    this.statsCard         = this.page.getByTestId('dashboard-stats');
    this.shopNowButton     = this.page.getByTestId('shop-now-button');
    this.browseProductsBtn = this.page.getByTestId('browse-products-button');
    this.viewCartButton    = this.page.getByTestId('view-cart-button');
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Navigate directly to the dashboard (only works when already authenticated). */
  async goto() {
    await this.page.goto('/dashboard');
    await this.expectLoaded();
  }

  /** Click the "Shop Now" hero button → navigates to /products. */
  async clickShopNow() {
    await this.shopNowButton.click();
    await expect(this.page).toHaveURL('/products', { timeout: 10_000 });
  }

  /** Click the Quick Actions "Browse Products" button → navigates to /products. */
  async clickBrowseProducts() {
    await this.browseProductsBtn.click();
    await expect(this.page).toHaveURL('/products', { timeout: 10_000 });
  }

  /** Click the Quick Actions "View Cart" button → navigates to /cart. */
  async clickViewCart() {
    await this.viewCartButton.click();
    await expect(this.page).toHaveURL('/cart', { timeout: 10_000 });
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  /** Assert the dashboard is fully rendered (welcome heading visible). */
  async expectLoaded() {
    await expect(this.welcomeHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Assert the "My Dashboard" heading text is correct. */
  async expectWelcomeHeading() {
    await expect(this.welcomeHeading).toContainText('My Dashboard');
  }

  /** Assert the stats section is rendered. */
  async expectStatsVisible() {
    await expect(this.statsCard).toBeVisible();
  }

  /** Assert all four Quick Action buttons are present. */
  async expectQuickActionsVisible() {
    await expect(this.shopNowButton).toBeVisible();
    await expect(this.browseProductsBtn).toBeVisible();
    await expect(this.viewCartButton).toBeVisible();
  }
}