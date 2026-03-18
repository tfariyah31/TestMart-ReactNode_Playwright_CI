import { Page, expect } from '@playwright/test';

/**
 * LoginPage — POM for the login form at route: /
 *
 * data-testid map (Login.js):
 *   login-form       → <form data-testid="login-form">
 *   login-email      → TextField inputProps data-testid (renders on the <input>)
 *   login-password   → TextField inputProps data-testid (renders on the <input>)
 *   login-submit     → <Button data-testid="login-submit">
 *
 * Note: MUI TextField with inputProps={{ 'data-testid': 'x' }} puts the
 * attribute on the underlying <input>, so we use getByTestId which resolves
 * to that element directly — no need to chain .locator('input').
 */
export class LoginPage {
  // ── Locators ───────────────────────────────────────────────────────────────
  private readonly emailInput;
  private readonly passwordInput;
  private readonly submitButton;
  private readonly errorAlert;

  constructor(private readonly page: Page) {
    this.emailInput    = this.page.getByTestId('login-email');
    this.passwordInput = this.page.getByTestId('login-password');
    this.submitButton  = this.page.getByTestId('login-submit');
    this.errorAlert    = this.page.locator('.MuiAlert-message');
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Navigate to the login page (root route). */
  async goto() {
    await this.page.goto('/');
    // Wait for the form to be visible — guards against slow initial renders
    await expect(this.page.getByTestId('login-form')).toBeVisible();
  }

  /**
   * Fill in credentials and click Login.
   * Does NOT assert outcome — callers do that in the spec.
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  /** Assert the user was redirected to /dashboard after login. */
  async expectRedirectedToDashboard() {
    await expect(this.page).toHaveURL('/dashboard', { timeout: 15_000 });
  }

  /** Assert an inline error alert is visible with optional text match. */
  async expectErrorVisible(messagePattern?: string | RegExp) {
    await expect(this.errorAlert).toBeVisible();
    if (messagePattern) {
      await expect(this.errorAlert).toContainText(messagePattern);
    }
  }

  /** Assert the login page is still showing (no redirect occurred). */
  async expectStillOnLoginPage() {
    await expect(this.page).toHaveURL('/', { timeout: 5_000 });
  }
}