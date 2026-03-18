const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const protect = require('../middleware/auth'); 

/**
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent for the given cart total.
 * Protected — requires a valid JWT (any role: customer, merchant, superadmin).
 *
 * Body:
 *   amount   {number}  Cart total in DOLLARS (e.g. 29.99). Converted to cents internally.
 *   currency {string}  Optional. Defaults to "usd".
 *
 * Response:
 *   { clientSecret: "pi_xxx_secret_xxx" }
 */
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (amount === undefined || amount === null) {
      return res.status(400).json({ message: 'amount is required' });
    }

    if (Array.isArray(amount) || typeof amount === 'object') {
      return res.status(400).json({ message: 'amount must be a number' });
    }

    if (typeof amount !== 'number' || !isFinite(amount)) {
      return res.status(400).json({ message: 'amount must be a valid number' });
    }

    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }

    // Stripe minimum charge is $0.50 USD
    if (parsedAmount < 0.5) {
      return res.status(400).json({ message: 'amount must be at least $0.50' });
    }

    // Convert dollars → cents (Stripe works in smallest currency unit)
    const amountInCents = Math.round(parsedAmount * 100);

    // ── Create PaymentIntent ──────────────────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        userId: req.userId,
        userRole: req.userRole || 'unknown',
      },
      //automatic_payment_methods: { enabled: true },
  });
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id, // useful for logging / test assertions
    });
  } catch (error) {
    // Stripe errors have a 'type' field
    if (error.type && error.type.startsWith('Stripe')) {
      return res.status(402).json({
        message: error.message,
        stripeCode: error.code,
      });
    }
    console.error('PaymentIntent creation error:', error);
    return res.status(500).json({ message: 'Server error creating payment intent' });
  }
});

/**
 * POST /api/payments/confirm
 * (Optional helper) Confirms a PaymentIntent server-side after frontend attaches
 * a payment method. Useful for testing server-side confirmation flows.
 *
 * Body:
 *   paymentIntentId {string}
 *   paymentMethodId {string}  e.g. "pm_card_visa" in test mode
 */
router.post('/confirm', protect, async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({ message: 'paymentIntentId and paymentMethodId are required' });
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return res.status(200).json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      return res.status(402).json({ message: error.message, stripeCode: error.code });
    }
    return res.status(500).json({ message: 'Server error confirming payment' });
  }
});

module.exports = router;